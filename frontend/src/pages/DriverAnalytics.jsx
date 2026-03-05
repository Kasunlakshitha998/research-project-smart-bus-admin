import React, { useState, useEffect } from "react";
import { Users, TrendingUp, AlertTriangle, ShieldCheck, Activity, Award, Star, Zap } from "lucide-react";
import { ref, get } from "firebase/database";
import { realTimeDb } from "../config/firebase";

// URL for the Reinforcement Learning Python API
// Used for predicting driver tiers, points, and monthly bonuses
const RL_API_URL = import.meta.env.VITE_PYTHON_API_URL || "http://localhost:5001";

export default function DriverAnalytics() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const dbRef = ref(realTimeDb, "/");
      const snapshot = await get(dbRef);
      
      if (!snapshot.exists()) {
        setDrivers([]);
        return;
      }
      
      const data = snapshot.val();
      const loadedDrivers = [];

      Object.keys(data).forEach((key) => {
        if (key.startsWith("Bus_") || (typeof data[key] === "object" && data[key] !== null)) {
          const busData = data[key];
          if (!busData || (!busData.live_data && !busData.violations && !busData.history)) return;

          let rawSpeeding = 0;
          let rawAccel = 0;
          let rawBrake = 0;

          if (busData.violations) {
            Object.values(busData.violations).forEach((v) => {
              const type = String(v.type).toLowerCase();
              if (type.includes("speed")) rawSpeeding++;
              else if (type.includes("accel")) rawAccel++;
              else if (type.includes("brake") || type.includes("sudden")) rawBrake++;
            });
          }

          // Weighting: 10 harsh accel events = 1 violation, 10 sudden brakes = 1 violation
          const weightedViolations = rawSpeeding + (rawAccel / 10.0) + (rawBrake / 10.0);

          // Score formula: max(0, 100 - weighted_violations * 5)  [same as Python model]
          const fallbackScore = Math.max(0, 100 - weightedViolations * 5);
          const currentRewardScore = busData.live_data?.rewardScore ?? fallbackScore;
          
          let tier = "Standard";
          let tierColor = "text-gray-500 bg-gray-100";
          if (currentRewardScore >= 88) { tier = "Platinum"; tierColor = "text-slate-800 bg-gradient-to-r from-gray-200 to-gray-300"; }
          else if (currentRewardScore >= 75) { tier = "Gold"; tierColor = "text-yellow-800 bg-yellow-100"; }
          else if (currentRewardScore >= 60) { tier = "Silver"; tierColor = "text-gray-700 bg-gray-200"; }
          else if (currentRewardScore >= 40) { tier = "Bronze"; tierColor = "text-amber-800 bg-amber-100"; }

          let riskLevel = "Safe";
          if (currentRewardScore < 60) riskLevel = "High Risk";
          else if (currentRewardScore < 80) riskLevel = "Moderate";

          // Dynamically compute achievements
          const achievements = [];
          if (rawSpeeding === 0 && rawAccel === 0 && rawBrake === 0) achievements.push({ id: "perfect", title: "Perfect Record", icon: <Star size={14} className="text-yellow-500" /> });
          if (rawSpeeding === 0) achievements.push({ id: "speed", title: "Speed Champion", icon: <ShieldCheck size={14} className="text-emerald-500" /> });
          if (rawAccel === 0) achievements.push({ id: "accel", title: "Smooth Acceleration", icon: <Zap size={14} className="text-blue-500" /> });
          if (rawBrake === 0) achievements.push({ id: "brake", title: "Smooth Braking", icon: <Activity size={14} className="text-purple-500" /> });

          loadedDrivers.push({
            id: key,
            name: busData.driverName || `Driver (${key})`,
            email: "Live IoT Data Stream",
            busId: key,
            rawSpeeding,
            rawAccel,
            rawBrake,
            weightedViolations: Math.round(weightedViolations * 10) / 10,
            currentRewardScore,
            tier,
            tierColor,
            riskLevel,
            achievements,
          });
        }
      });

      // Query the RL API to get the EXACT tiers and rewards
      let enrichedDrivers = [];
      try {
        const payload = {
          drivers: loadedDrivers.map(d => ({
            driver_id: d.id,
            speeding:     d.rawSpeeding,
            harsh_accel:  d.rawAccel,
            sudden_brake: d.rawBrake,
          }))
        };

        const res = await fetch(`${RL_API_URL}/predict-batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("RL API not reachable");
        
        const rlData = await res.json();
        const rlMap = {};
        if (rlData.success && rlData.results) {
          rlData.results.forEach(r => { rlMap[r.driver_id] = r; });
        }

        enrichedDrivers = loadedDrivers.map(d => {
          const rlInfo = rlMap[d.id];
          if (!rlInfo) return { ...d, points_earned: 0, monthly_bonus: 0, isRL: false };

          // Override local static tier and score with ML API inference
          let newTierColor = "text-gray-500 bg-gray-100";
          if (rlInfo.tier === "Platinum") newTierColor = "text-slate-800 bg-gradient-to-r from-gray-200 to-gray-300";
          else if (rlInfo.tier === "Gold") newTierColor = "text-yellow-800 bg-yellow-100";
          else if (rlInfo.tier === "Silver") newTierColor = "text-gray-700 bg-gray-200";
          else if (rlInfo.tier === "Bronze") newTierColor = "text-amber-800 bg-amber-100";

          return {
            ...d,
            currentRewardScore: rlInfo.safety_score || d.currentRewardScore,
            tier: rlInfo.tier || d.tier,
            tierColor: newTierColor,
            points_earned: rlInfo.points_earned !== undefined ? Number(rlInfo.points_earned) : 0,
            monthly_bonus: rlInfo.monthly_bonus !== undefined ? Number(rlInfo.monthly_bonus) : 0,
            isRL: true
          };
        });
      } catch (e) {
        console.warn("Failed to contact RL Model API. Falling back to rule-based algorithms:", e);
        enrichedDrivers = loadedDrivers.map(d => {
          let pts = 25, bonus = 0;
          if (d.tier === "Platinum") { pts = 500; bonus = 8000; }
          else if (d.tier === "Gold") { pts = 300; bonus = 5000; }
          else if (d.tier === "Silver") { pts = 150; bonus = 3000; }
          else if (d.tier === "Bronze") { pts = 75; bonus = 1500; }
          return { ...d, points_earned: pts, monthly_bonus: bonus, isRL: false };
        });
      }

      // Also compute total violations for the summary stat
      enrichedDrivers = enrichedDrivers.map(d => ({
        ...d,
        totalViolations: Math.round(d.weightedViolations ?? 0)
      }));

      enrichedDrivers.sort((a, b) => b.currentRewardScore - a.currentRewardScore);
      setDrivers(enrichedDrivers);
    } catch (err) {
      console.error("Firebase Realtime DB Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case "Safe": return <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">Safe</span>;
      case "Moderate": return <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">Moderate</span>;
      case "High Risk": return <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">High Risk</span>;
      default: return <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">{level}</span>;
    }
  };

  const formatCurrency = (val) => {
    if (isNaN(val) || val === undefined || val === null) return "LKR 0";
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(val);
  };

  if (loading) return <div className="p-8 flex items-center justify-center min-h-[500px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (error) return <div className="p-8"><div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">Error: {error}</div></div>;

  const totalDrivers = drivers.length;
  const avgScore = totalDrivers > 0 ? (drivers.reduce((acc, d) => acc + d.currentRewardScore, 0) / totalDrivers).toFixed(1) : 0;
  const totalWeightedViolations = drivers.reduce((acc, d) => acc + (d.weightedViolations ?? 0), 0).toFixed(1);

  return (
    <div className="p-8 max-w-[90rem] mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Driver Analytics & Reward System</h1>
          <p className="text-gray-500 mt-1">Live leaderboard factoring in speeding, harsh accelerations, and sudden brakes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="h-14 w-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><Award size={28} /></div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Ranked Drivers</p>
            <h3 className="text-3xl font-bold text-gray-900">{totalDrivers}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="h-14 w-14 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600"><TrendingUp size={28} /></div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Fleet Avg Score</p>
            <h3 className="text-3xl font-bold text-gray-900">{avgScore}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="h-14 w-14 rounded-xl bg-red-50 flex items-center justify-center text-red-600"><AlertTriangle size={28} /></div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Verified Violations</p>
            <h3 className="text-3xl font-bold text-gray-900">{totalWeightedViolations}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Leaderboard Dashboard</h2>
          {/* <span className="text-xs text-gray-500 font-medium">*(Note: Telemetry normalization active. 50 raw harsh events = 1 verified violation)*</span> */}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left align-middle whitespace-nowrap">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-center w-16">Rank</th>
                <th className="px-6 py-4 font-semibold">Driver Profile</th>
                <th className="px-6 py-4 font-semibold text-center">Reward Tier</th>
                <th className="px-6 py-4 font-semibold text-center">Points Earned</th>
                <th className="px-6 py-4 font-semibold text-center">Monthly Bonus</th>
                <th className="px-6 py-4 font-semibold text-center">Speeding<br/><span className="text-[9px] normal-case text-gray-400 font-normal">events</span></th>
                <th className="px-6 py-4 font-semibold text-center">Harsh Accel<br/><span className="text-[9px] normal-case text-gray-400 font-normal">events (÷10 = 1 viol.)</span></th>
                <th className="px-6 py-4 font-semibold text-center">Sudden Brakes<br/><span className="text-[9px] normal-case text-gray-400 font-normal">events (÷10 = 1 viol.)</span></th>
                <th className="px-6 py-4 font-semibold">Achievements Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drivers.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500 text-base">No active leaderboard data found.</td></tr>
              ) : (
                drivers.map((driver, index) => (
                  <tr key={driver.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-center font-bold text-gray-400 text-base">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-bold text-gray-900">{driver.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-mono text-[10px]">{driver.busId}</span>
                            {getRiskBadge(driver.riskLevel)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`px-3 py-1 rounded border font-bold text-xs ${driver.tierColor} border-black/5 shadow-sm`} title={driver.isRL ? "Predicted by RL Model" : "Rule-based Fallback"}>
                          {driver.tier} {driver.isRL ? "✨" : ""}
                        </span>
                        <span className="text-xs text-gray-500 font-semibold mt-1">{driver.currentRewardScore} Pts</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-indigo-600">
                      +{driver.points_earned} pts
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">
                      {formatCurrency(driver.monthly_bonus)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${driver.rawSpeeding > 0 ? "text-red-500" : "text-emerald-500"}`}>{driver.rawSpeeding}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${driver.rawAccel > 0 ? "text-amber-500" : "text-gray-400"}`}>{driver.rawAccel}</span>
                      {driver.rawAccel >= 10 && <span className="ml-1 text-[10px] text-gray-400">({(driver.rawAccel/10).toFixed(1)} viol.)</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${driver.rawBrake > 0 ? "text-purple-500" : "text-gray-400"}`}>{driver.rawBrake}</span>
                      {driver.rawBrake >= 10 && <span className="ml-1 text-[10px] text-gray-400">({(driver.rawBrake/10).toFixed(1)} viol.)</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 items-center flex-wrap">
                        {driver.achievements.length > 0 ? driver.achievements.map((ach) => (
                          <div key={ach.id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border border-gray-100 rounded-lg" title={ach.title}>
                            {ach.icon}
                            <span className="text-[11px] font-semibold text-gray-700">{ach.title}</span>
                          </div>
                        )) : (
                          <span className="text-xs text-gray-400 italic">No achievements yet</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
