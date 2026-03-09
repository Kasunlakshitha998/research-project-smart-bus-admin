const db = require("../config/db");

class DashboardService {
  /**
   * Get all dashboard metrics in one call using MySQL.
   */
  static async getDashboardStats() {
    // 1. Parallel Queries
    const [
      [activeBusesRows],
      [activeRoutesRows],
      [complaintRows],
      [userRows],
      [historyRows],
    ] = await Promise.all([
      db.execute("SELECT COUNT(*) as count FROM buses WHERE status = 'active'"),
      db.execute("SELECT COUNT(*) as count FROM routes"),
      db.execute("SELECT * FROM complaints"),
      db.execute("SELECT COUNT(*) as count FROM system_users"),
      db.execute(
        "SELECT * FROM trip_history ORDER BY trip_date DESC LIMIT 500",
      ),
    ]);

    // 2. Simple Counts
    const activeBusesCount = activeBusesRows[0].count;
    const activeRoutesCount = activeRoutesRows[0].count;
    const totalUsersCount = userRows[0].count;

    // 3. Complaint Metrics
    const complaints = complaintRows;
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
    const history = historyRows;
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
      // trip_date from MySQL may be a Date object, convert to ISO string for comparison
      const passengers = history
        .filter((h) => {
          const hDate =
            h.trip_date instanceof Date
              ? h.trip_date.toISOString().split("T")[0]
              : String(h.trip_date).split("T")[0];
          return hDate === dateStr;
        })
        .reduce((sum, h) => sum + (h.passenger_count || 0), 0);
      return { name: dayName, passengers };
    });

    const totalPassengers = history.reduce(
      (sum, h) => sum + (h.passenger_count || 0),
      0,
    );

    // 5. Recent Activity
    const recentActivities = [...complaints]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map((c, idx) => {
        const time = new Date(c.created_at);
        const timeAgo = this.getTimeAgo(time);
        return {
          id: `act-${idx}`,
          type: "complaint",
          message: `Complaint: ${c.complaintCategory} - ${String(c.complaintText).substring(0, 40)}...`,
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
        passengersChange: "+3.1%",
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
