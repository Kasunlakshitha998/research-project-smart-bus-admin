const db = require("../config/db");

class DashboardService {
  /**
   * Get all dashboard metrics in one call
   */
  static async getDashboardStats() {
    // 1. Parallel Collection Snapshotting
    const [busSnap, routeSnap, complaintSnap, userSnap, historySnap] =
      await Promise.all([
        db.collection("buses").where("status", "==", "active").get(),
        db.collection("routes").get(),
        db.collection("complaints").get(),
        db.collection("system_users").get(),
        db
          .collection("trip_history")
          .orderBy("trip_date", "desc")
          .limit(500) // Get enough for 7-day trend across routes
          .get(),
      ]);

    // 2. Simple Counts
    const activeBusesCount = busSnap.size;
    const activeRoutesCount = routeSnap.size;
    const totalUsersCount = userSnap.size;

    // 3. Complaint Metrics
    const complaints = complaintSnap.docs.map((doc) => doc.data());
    const pendingComplaintsCount = complaints.filter(
      (c) => c.status?.toLowerCase() === "pending",
    ).length;

    const categoryStatsMap = {};
    complaints.forEach((c) => {
      const cat = c.complaintCategory || "Other";
      categoryStatsMap[cat] = (categoryStatsMap[cat] || 0) + 1;
    });
    const complaintsBreakdown = Object.entries(categoryStatsMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // 4. Traffic Metrics (Last 7 Days)
    const history = historySnap.docs.map((doc) => doc.data());
    const today = new Date();
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      last7Days.push(d.toISOString().split("T")[0]);
    }

    const trafficTrend = last7Days.map((dateStr) => {
      const dayName = new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "short",
      });
      const passengers = history
        .filter((h) => h.trip_date === dateStr)
        .reduce((sum, h) => sum + (h.passenger_count || 0), 0);
      return { name: dayName, passengers };
    });

    const totalPassengers = history.reduce(
      (sum, h) => sum + (h.passenger_count || 0),
      0,
    );

    // 5. Recent Activity (Mix of complaints and system events)
    // For now, let's take the last 5 complaints as activity
    const recentActivities = complaints
      .sort(
        (a, b) =>
          (b.created_at?.toDate?.() || new Date(b.created_at)) -
          (a.created_at?.toDate?.() || new Date(a.created_at)),
      )
      .slice(0, 5)
      .map((c, idx) => {
        const time = c.created_at?.toDate?.() || new Date(c.created_at);
        const timeAgo = this.getTimeAgo(time);
        return {
          id: `act-${idx}`,
          type: "complaint",
          message: `Complaint: ${c.complaintCategory} - ${c.complaintText.substring(0, 40)}...`,
          time: timeAgo,
          category: c.complaintCategory,
        };
      });

    return {
      stats: {
        totalPassengers: totalPassengers.toLocaleString(),
        activeBuses: activeBusesCount,
        activeRoutes: activeRoutesCount,
        pendingComplaints: pendingComplaintsCount,
        passengersChange: "+3.1%", // Mocked for UI
        busesChange: `+${Math.floor(activeBusesCount * 0.05)}`,
        routesChange: "Stable",
        complaintsChange: `-${Math.floor(pendingComplaintsCount * 0.1)}`,
      },
      trafficTrend,
      complaintsBreakdown,
      recentActivities,
    };
  }

  static getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  }
}

module.exports = DashboardService;
