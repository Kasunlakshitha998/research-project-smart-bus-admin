const db = require("../config/db");
const axios = require("axios");

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || "http://localhost:5002";

/**
 * ComplaintService
 * Handles all business logic and data access for Complaints using MySQL.
 */
class ComplaintService {
  /**
   * Get all complaints with enriched user and bus details.
   */
  static async getAllComplaints(agentId = null, passengerId = null) {
    let query = `
      SELECT c.*,
             u.name as user_name,
             b.license_plate, b.bus_number,
             r.route_number, r.route_name
      FROM complaints c
      LEFT JOIN system_users u ON c.passengerId = u.id
      LEFT JOIN buses b ON c.busId = b.id
      LEFT JOIN routes r ON c.routeId = r.id
    `;
    const params = [];

    if (agentId) {
      query += " WHERE c.assignedAgentId = ?";
      params.push(agentId);
    } else if (passengerId) {
      query += " WHERE c.passengerId = ?";
      params.push(passengerId);
    }

    query += " ORDER BY c.created_at DESC";

    const [complaints] = await db.execute(query, params);

    // Serialize integer IDs as strings so the frontend's .substring()/.toLowerCase()
    // and === comparisons work (MySQL returns numbers; Firebase used string doc IDs)
    return complaints.map((c) => ({
      ...c,
      id: String(c.id),
      busId: c.busId != null ? String(c.busId) : null,
      routeId: c.routeId != null ? String(c.routeId) : null,
      assignedAgentId:
        c.assignedAgentId != null ? String(c.assignedAgentId) : null,
      busLocationAtTime:
        typeof c.busLocationAtTime === "string"
          ? JSON.parse(c.busLocationAtTime)
          : c.busLocationAtTime,
    }));
  }

  /**
   * Create a new complaint with metadata and telemetry validation.
   */
  static async createComplaint(data) {
    const { passengerId, busId, complaintText, tripId } = data;

    // 1. Fetch Bus metadata
    const [buses] = await db.execute("SELECT * FROM buses WHERE id = ?", [
      busId,
    ]);
    if (buses.length === 0) {
      throw new Error("Bus not found");
    }
    const busData = buses[0];

    // 2. Fetch Route metadata
    const routeId = busData.current_route_id;
    let routeData = null;
    if (routeId) {
      const [routes] = await db.execute("SELECT * FROM routes WHERE id = ?", [
        routeId,
      ]);
      if (routes.length > 0) routeData = routes[0];
    }

    // 3. Simulated Telemetry Logic
    const busSpeedAtTime = Math.floor(Math.random() * (85 - 20) + 20);
    const busLocationAtTime = {
      latitude: routeData?.start_lat || 6.9271,
      longitude: routeData?.start_lng || 79.8612,
    };

    const [insertResult] = await db.execute(
      `INSERT INTO complaints 
       (passengerId, busId, driverId, routeId, tripId, complaintText, complaintCategory, timestamp, busSpeedAtTime, busLocationAtTime, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, 'Pending', NOW())`,
      [
        passengerId || "anonymous",
        busId,
        busData.driver_id || "unknown",
        routeId || null,
        tripId || "unknown",
        complaintText,
        "Pending Classification",
        busSpeedAtTime,
        JSON.stringify(busLocationAtTime),
      ],
    );

    const complaintId = insertResult.insertId;

    // 4. Asynchronous NLP Categorization
    try {
      const nlpResponse = await axios.post(`${NLP_SERVICE_URL}/predict`, {
        complaint_text: complaintText,
      });
      const predictedCategory = nlpResponse.data.predicted_category;

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
        confidenceScore: 1.0,
        evidence: validationResult.reason,
        status:
          validationResult.new_status === "Pending"
            ? "Pending"
            : validationResult.new_status,
        assignedAgentId: null,
        assignedAgentName: null,
      };

      // 5. Automatic Agent Assignment
      try {
        const [agents] = await db.execute(
          `SELECT id, name FROM system_users WHERE role_id = 3 AND specialization = ? LIMIT 1`,
          [predictedCategory],
        );
        if (agents.length > 0) {
          updates.assignedAgentId = agents[0].id;
          updates.assignedAgentName = agents[0].name;
        } else {
          const [generalAgents] = await db.execute(
            `SELECT id, name FROM system_users WHERE role_id = 3 AND specialization = 'Other' LIMIT 1`,
          );
          if (generalAgents.length > 0) {
            updates.assignedAgentId = generalAgents[0].id;
            updates.assignedAgentName = generalAgents[0].name;
          }
        }
      } catch (assignError) {
        console.error("Agent Assignment Error:", assignError.message);
      }

      await db.execute(
        `UPDATE complaints SET complaintCategory = ?, confidenceScore = ?, evidence = ?, status = ?, assignedAgentId = ?, assignedAgentName = ? WHERE id = ?`,
        [
          updates.complaintCategory,
          updates.confidenceScore,
          updates.evidence,
          updates.status,
          updates.assignedAgentId,
          updates.assignedAgentName,
          complaintId,
        ],
      );

      return {
        id: String(complaintId),
        passengerId,
        busId,
        complaintText,
        ...updates,
      };
    } catch (error) {
      console.error("NLP Service Error:", error.message);
      return { id: String(complaintId), passengerId, busId, complaintText };
    }
  }

  /**
   * Update complaint status with optional resolution message.
   */
  static async updateStatus(id, status, resolutionMessage = null) {
    if (status.toLowerCase() === "resolved" && resolutionMessage) {
      await db.execute(
        `UPDATE complaints SET status = ?, resolutionMessage = ?, resolvedAt = NOW(), updated_at = NOW() WHERE id = ?`,
        [status, resolutionMessage, id],
      );
    } else {
      await db.execute(
        `UPDATE complaints SET status = ?, updated_at = NOW() WHERE id = ?`,
        [status, id],
      );
    }
    return { id: String(id), status, resolutionMessage };
  }

  /**
   * Update resolution feedback (Like/Dislike).
   */
  static async updateFeedback(id, feedback) {
    await db.execute(
      `UPDATE complaints SET resolutionFeedback = ?, feedback_at = NOW() WHERE id = ?`,
      [feedback, id],
    );
    return { id: String(id), resolutionFeedback: feedback };
  }

  /**
   * Get statistics on complaints categories.
   */
  static async getStats() {
    const [rows] = await db.execute(
      `SELECT complaintCategory as category, COUNT(*) as count FROM complaints GROUP BY complaintCategory`,
    );
    return rows;
  }
}

module.exports = ComplaintService;
