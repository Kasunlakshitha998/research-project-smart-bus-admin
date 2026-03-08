const db = require("../config/db");
const axios = require("axios");

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || "http://localhost:5002";

/**
 * ComplaintService
 * Handles all business logic and data access for Complaints.
 */
class ComplaintService {
  /**
   * Get all complaints with enriched user and bus details.
   * @param {string} agentId Optional filter for assigned agent
   * @returns {Promise<Array>} List of enriched complaints
   */
  static async getAllComplaints(agentId = null, passengerId = null) {
    let query = db.collection("complaints");

    if (agentId) {
      query = query.where("assignedAgentId", "==", agentId);
    } else if (passengerId) {
      query = query.where("passengerId", "==", passengerId);
    }

    query = query.orderBy("created_at", "desc");

    const snapshot = await query.get();
    const complaints = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (complaints.length > 0) {
      const userSnapshot = await db.collection("system_users").get();
      const busSnapshot = await db.collection("buses").get();
      const routeSnapshot = await db.collection("routes").get();

      const userMap = {};
      userSnapshot.forEach((doc) => (userMap[doc.id] = doc.data()));
      const busMap = {};
      busSnapshot.forEach((doc) => (busMap[doc.id] = doc.data()));
      const routeMap = {};
      routeSnapshot.forEach((doc) => (routeMap[doc.id] = doc.data()));

      complaints.forEach((c) => {
        if (c.user_id && userMap[c.user_id])
          c.user_name = userMap[c.user_id].name;
        if (c.bus_id && busMap[c.bus_id]) {
          c.license_plate = busMap[c.bus_id].license_plate;
          c.bus_number = busMap[c.bus_id].bus_number;
          const routeId = c.routeId || busMap[c.bus_id].current_route_id;
          if (routeId && routeMap[routeId]) {
            c.route_number = routeMap[routeId].route_number;
            c.route_name = routeMap[routeId].route_name;
          }
        }
      });
    }
    return complaints;
  }

  /**
   * Create a new complaint with metadata and telemetry validation.
   */
  static async createComplaint(data) {
    const { passengerId, busId, complaintText, tripId } = data;

    // 1. Fetch Bus metadata
    const busDoc = await db.collection("buses").doc(busId).get();
    if (!busDoc.exists) {
      throw new Error("Bus not found");
    }
    const busData = busDoc.data();

    // 2. Fetch Route metadata
    const routeId = busData.current_route_id;
    let routeData = null;
    if (routeId) {
      const routeDoc = await db.collection("routes").doc(routeId).get();
      if (routeDoc.exists) {
        routeData = routeDoc.data();
      }
    }

    // 3. Simulated Telemetry Logic (since real-time telemetry service is not yet implemented)
    // In a real system, we would fetch this from a telemetry database/service using busId and timestamp
    const busSpeedAtTime = Math.floor(Math.random() * (85 - 20) + 20); // Random speed between 20 and 85
    const busLocationAtTime = {
      latitude: routeData?.start_lat || 6.9271,
      longitude: routeData?.start_lng || 79.8612,
    };

    const newComplaint = {
      passengerId: passengerId || "anonymous",
      busId,
      driverId: busData.driver_id || "unknown", // Assuming bus has a driver_id
      routeId: routeId || "unknown",
      tripId: tripId || "unknown",
      complaintText,
      complaintCategory: "Pending Classification", // Will be updated by NLP service
      timestamp: new Date(),
      busSpeedAtTime,
      busLocationAtTime,
      status: "Pending",
      created_at: new Date(),
    };

    const docRef = await db.collection("complaints").add(newComplaint);

    // 4. Asynchronous Categorization and Validation
    try {
      const nlpResponse = await axios.post(`${NLP_SERVICE_URL}/predict`, {
        complaint_text: complaintText,
      });

      const predictedCategory = nlpResponse.data.predicted_category;

      // 5. Validation based on category and telemetry
      let validationResult = {
        verified: false,
        reason: "N/A",
        new_status: "Pending",
      };
      if (["Over Speeding", "Route Deviation"].includes(predictedCategory)) {
        const valResponse = await axios.post(
          `${NLP_SERVICE_URL}/validate-telemetry`,
          {
            category: predictedCategory,
            speed: busSpeedAtTime,
            location: busLocationAtTime,
          },
        );
        validationResult = valResponse.data;
      }

      const updates = {
        complaintCategory: predictedCategory,
        confidenceScore: 1.0, // Pickle-based simple version doesn't return confidence yet
        evidence: validationResult.reason,
        status:
          validationResult.new_status === "Pending"
            ? "Pending"
            : validationResult.new_status,
      };

      // 6. Automatic Agent Assignment
      try {
        const agentSnap = await db
          .collection("system_users")
          .where("role_id", "==", "3") // Role 3 is Agent
          .where("specialization", "==", predictedCategory)
          .limit(1)
          .get();

        if (!agentSnap.empty) {
          updates.assignedAgentId = agentSnap.docs[0].id;
          updates.assignedAgentName = agentSnap.docs[0].data().name;
        } else {
          // Fallback to a general agent if specific one not found
          const generalAgentSnap = await db
            .collection("system_users")
            .where("role_id", "==", "3")
            .where("specialization", "==", "Other")
            .limit(1)
            .get();
          if (!generalAgentSnap.empty) {
            updates.assignedAgentId = generalAgentSnap.docs[0].id;
            updates.assignedAgentName = generalAgentSnap.docs[0].data().name;
          }
        }
      } catch (assignError) {
        console.error("Agent Assignment Error:", assignError.message);
      }

      await db.collection("complaints").doc(docRef.id).update(updates);

      return { id: docRef.id, ...newComplaint, ...updates };
    } catch (error) {
      console.error("NLP Service Error:", error.message);
      // Fallback if NLP service is down
      return { id: docRef.id, ...newComplaint };
    }
  }

  /**
   * Update complaint status with optional resolution message.
   */
  static async updateStatus(id, status, resolutionMessage = null) {
    const updates = {
      status,
      updated_at: new Date(),
    };

    if (status.toLowerCase() === "resolved" && resolutionMessage) {
      updates.resolutionMessage = resolutionMessage;
      updates.resolvedAt = new Date();
    }

    await db.collection("complaints").doc(id).update(updates);
    return { id, ...updates };
  }

  /**
   * Update resolution feedback (Like/Dislike).
   */
  static async updateFeedback(id, feedback) {
    const updates = {
      resolutionFeedback: feedback,
      feedback_at: new Date(),
    };

    await db.collection("complaints").doc(id).update(updates);
    return { id, ...updates };
  }

  /**
   * Get statistics on complaints categories.
   */
  static async getStats() {
    const snapshot = await db.collection("complaints").get();
    const statsMap = {};
    snapshot.forEach((doc) => {
      const category = doc.data().category;
      statsMap[category] = (statsMap[category] || 0) + 1;
    });
    return Object.entries(statsMap).map(([category, count]) => ({
      category,
      count,
    }));
  }
}

module.exports = ComplaintService;
