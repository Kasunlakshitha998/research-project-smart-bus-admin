const db = require("../config/db");

/**
 * ComplaintService
 * Handles all business logic and data access for Complaints.
 */
class ComplaintService {
  /**
   * Get all complaints with enriched user and bus details.
   * @returns {Promise<Array>} List of enriched complaints
   */
  static async getAllComplaints() {
    const snapshot = await db
      .collection("complaints")
      .orderBy("created_at", "desc")
      .get();
    const complaints = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (complaints.length > 0) {
      const userSnapshot = await db.collection("users").get();
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
          const routeId = busMap[c.bus_id].current_route_id;
          if (routeId && routeMap[routeId])
            c.route_number = routeMap[routeId].route_number;
        }
      });
    }
    return complaints;
  }

  /**
   * Create a new complaint.
   */
  static async createComplaint(data) {
    const newComplaint = {
      ...data,
      status: "pending",
      created_at: new Date(),
    };
    const docRef = await db.collection("complaints").add(newComplaint);
    return { id: docRef.id, ...newComplaint };
  }

  /**
   * Update complaint status.
   */
  static async updateStatus(id, status) {
    await db.collection("complaints").doc(id).update({ status });
    return { id, status };
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
