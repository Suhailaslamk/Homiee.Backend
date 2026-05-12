import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet + React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition, onLocationSelected }) {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onLocationSelected(lat, lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

// Helper to center map if position changes from outside
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapPicker({ initialPosition, onLocationSelected, className = "h-64" }) {
  const [position, setPosition] = useState(initialPosition || [20.5937, 78.9629]); // Default to India center

  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
    }
  }, [initialPosition]);

  return (
    <div className={`relative overflow-hidden rounded-[2rem] border border-[var(--color-stone)]/10 shadow-inner ${className}`}>
      <MapContainer 
        center={position} 
        zoom={13} 
        scrollWheelZoom={false}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={position} zoom={13} />
        <LocationMarker 
          position={position} 
          setPosition={setPosition} 
          onLocationSelected={onLocationSelected} 
        />
      </MapContainer>
      <div className="absolute bottom-4 left-4 z-[400] bg-white/80 backdrop-blur-md px-4 py-2 rounded-full text-[8px] font-bold uppercase tracking-widest text-[var(--color-primary-dark)] shadow-sm pointer-events-none">
        Click to pinpoint studio
      </div>
    </div>
  );
}
