import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useState, useEffect } from 'react';
import { Bus } from 'lucide-react';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const LiveMap = () => {
    const [buses, setBuses] = useState([
        { id: 1, route: '138', lat: 6.9271, lng: 79.8612, status: 'On Time' }, // Colombo
        { id: 2, route: '177', lat: 6.9147, lng: 79.9733, status: 'Delayed' }, // Kaduwela
        { id: 3, route: '120', lat: 6.8400, lng: 79.9600, status: 'On Time' }, // Horana
    ]);

    return (
        <div className="h-full flex flex-col">
            <div className="p-6 bg-white border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Live Bus Tracking</h1>
                    <p className="text-gray-500">Real-time location of active buses.</p>
                </div>
                <div className="flex space-x-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Active Buses: {buses.length}
                    </span>
                </div>
            </div>

            <div className="flex-1 relative z-0">
                <MapContainer center={[6.9271, 79.8612]} zoom={12} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {buses.map(bus => (
                        <Marker key={bus.id} position={[bus.lat, bus.lng]}>
                            <Popup>
                                <div className="p-2">
                                    <h3 className="font-bold text-lg">Route {bus.route}</h3>
                                    <p className={`text-sm font-medium ${bus.status === 'On Time' ? 'text-green-600' : 'text-red-600'}`}>
                                        Status: {bus.status}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default LiveMap;
