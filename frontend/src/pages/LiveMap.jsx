import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useState, useMemo, useEffect } from "react";
import {
  Bus,
  Navigation,
  Activity,
  Search,
  Map as MapIcon,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import clsx from "clsx";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon behavior in some environments
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Bus Marker Generator
const createBusIcon = (status) => {
  let color = "#22c55e"; // default green
  if (status === "Delayed") color = "#ef4444";
  if (status === "Maintenance") color = "#f59e0b";

  return L.divIcon({
    html: `
            <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border-2" style="border-color: ${color}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h10"></path>
                    <circle cx="7" cy="17" r="2"></circle>
                    <circle cx="17" cy="17" r="2"></circle>
                </svg>
                <div class="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white flex items-center justify-center">
                    <div class="w-2 h-2 rounded-full" style="background-color: ${color}"></div>
                </div>
            </div>
        `,
    className: "custom-bus-icon",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

// Map Recenter Component
const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 14, { animate: true, duration: 1 });
  }, [center, map]);
  return null;
};

const LiveMap = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBus, setSelectedBus] = useState(null);

  const [buses] = useState([
    {
      id: "B001",
      route: "138",
      busNo: "WP NB-5432",
      lat: 6.9271,
      lng: 79.8612,
      status: "On Time",
      lastStop: "Colombo Fort",
      speed: "32 km/h",
      capacity: "85%",
    },
    {
      id: "B002",
      route: "177",
      busNo: "WP NB-8721",
      lat: 6.9147,
      lng: 79.9733,
      status: "Delayed",
      lastStop: "Kothalawala",
      speed: "12 km/h",
      capacity: "40%",
    },
    {
      id: "B003",
      route: "120",
      busNo: "WP NA-3321",
      lat: 6.84,
      lng: 79.96,
      status: "On Time",
      lastStop: "Piliyandala",
      speed: "45 km/h",
      capacity: "60%",
    },
    {
      id: "B004",
      route: "138",
      busNo: "WP NC-1122",
      lat: 6.91,
      lng: 79.88,
      status: "Maintenance",
      lastStop: "Nugegoda",
      speed: "0 km/h",
      capacity: "0%",
    },
    {
      id: "B005",
      route: "154",
      busNo: "WP NB-9988",
      lat: 6.94,
      lng: 79.85,
      status: "On Time",
      lastStop: "Bambalapitiya",
      speed: "28 km/h",
      capacity: "92%",
    },
    {
      id: "B006",
      route: "17",
      busNo: "WP NC-5566",
      lat: 6.9,
      lng: 79.92,
      status: "Delayed",
      lastStop: "Malabe",
      speed: "8 km/h",
      capacity: "45%",
    },
    {
      id: "B007",
      route: "EX-01",
      busNo: "WP NA-7711",
      lat: 6.85,
      lng: 80.0,
      status: "On Time",
      lastStop: "Kottawa",
      speed: "85 km/h",
      capacity: "70%",
    },
  ]);

  const filteredBuses = useMemo(
    () =>
      buses.filter(
        (b) =>
          b.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.busNo.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [buses, searchQuery]
  );

  const stats = useMemo(
    () => ({
      active: buses.length,
      onTime: buses.filter((b) => b.status === "On Time").length,
      delayed: buses.filter((b) => b.status === "Delayed").length,
      maintenance: buses.filter((b) => b.status === "Maintenance").length,
    }),
    [buses]
  );

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden font-['Plus_Jakarta_Sans']">
      {/* Sidebar Controls */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-gray-100 bg-white">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
              <Navigation className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Fleet Tracking
              </h1>
              <div className="flex items-center space-x-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">
                  Live System
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase">
                On Time
              </p>
              <p className="text-lg font-bold text-green-600">{stats.onTime}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase">
                Delayed
              </p>
              <p className="text-lg font-bold text-red-600">{stats.delayed}</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search Route or Bus No..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
          {filteredBuses.map((bus) => (
            <button
              key={bus.id}
              onClick={() => setSelectedBus(bus)}
              className={clsx(
                "w-full p-4 rounded-2xl border transition-all text-left group",
                selectedBus?.id === bus.id
                  ? "bg-blue-50 border-blue-200 shadow-md shadow-blue-50"
                  : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none">
                    Route {bus.route}
                  </p>
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors uppercase">
                    {bus.busNo}
                  </h3>
                </div>
                <span
                  className={clsx(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    bus.status === "On Time"
                      ? "bg-green-100 text-green-700"
                      : bus.status === "Delayed"
                      ? "bg-red-100 text-red-700"
                      : "bg-orange-100 text-orange-700"
                  )}
                >
                  {bus.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-gray-500">
                <div className="flex items-center">
                  <MapIcon className="h-3 w-3 mr-1 opacity-50" />
                  <span className="truncate">{bus.lastStop}</span>
                </div>
                <div className="flex items-center justify-end">
                  <Activity className="h-3 w-3 mr-1 opacity-50" />
                  <span>{bus.speed}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Map Area */}
      <main className="flex-1 relative">
        <MapContainer
          center={[6.9271, 79.8612]}
          zoom={12}
          className="h-full w-full grayscale-[0.2]"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {buses.map((bus) => (
            <Marker
              key={bus.id}
              position={[bus.lat, bus.lng]}
              icon={createBusIcon(bus.status)}
              eventHandlers={{
                click: () => setSelectedBus(bus),
              }}
            >
              <Popup className="bus-popup">
                <div className="p-3 w-48">
                  <div className="flex justify-between items-center mb-3">
                    <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                      <Bus className="h-5 w-5" />
                    </div>
                    <span
                      className={clsx(
                        "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                        bus.status === "On Time"
                          ? "bg-green-100 text-green-700"
                          : bus.status === "Delayed"
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                      )}
                    >
                      {bus.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 leading-tight mb-1 uppercase tracking-tighter">
                    Route {bus.route} - {bus.busNo}
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-gray-400 uppercase">Speed</span>
                      <span className="text-gray-900">{bus.speed}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-gray-400 uppercase">
                        Load Capacity
                      </span>
                      <div className="flex items-center">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full mr-2 overflow-hidden border border-gray-50">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: bus.capacity }}
                          ></div>
                        </div>
                        <span className="text-blue-600 font-extrabold">
                          {bus.capacity}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold pt-1 border-t border-gray-50">
                      <span className="text-gray-400 uppercase">Last Stop</span>
                      <span className="text-gray-900">{bus.lastStop}</span>
                    </div>
                  </div>
                  <button className="w-full mt-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase transition-all hover:bg-blue-700 shadow-md shadow-blue-100">
                    View Analytics
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {selectedBus && (
            <MapRecenter center={[selectedBus.lat, selectedBus.lng]} />
          )}

          <div className="absolute bottom-10 right-8 space-y-2 z-[1000]">
            <button className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-xl shadow-lg text-gray-600 hover:text-blue-600 transition-colors">
              <MapIcon size={20} />
            </button>
            <button className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-xl shadow-lg text-gray-600 hover:text-blue-600 transition-colors">
              <Clock size={20} />
            </button>
          </div>

          <div className="absolute top-8 right-8 z-[1000]">
            <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/50 flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs font-bold text-gray-900">
                  System Secure
                </span>
              </div>
              <div className="h-4 w-px bg-gray-200" />
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-xs font-bold text-gray-900">
                  {stats.delayed} Alerts
                </span>
              </div>
            </div>
          </div>
        </MapContainer>
      </main>
    </div>
  );
};

export default LiveMap;
