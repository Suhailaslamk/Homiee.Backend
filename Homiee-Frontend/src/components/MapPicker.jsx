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

import { useToast } from '../hooks/useToast';

export default function MapPicker({ initialPosition, onLocationSelected, className = "h-64" }) {
  const [position, setPosition] = useState(initialPosition || [20.5937, 78.9629]); // Default to India center
  const [isLocating, setIsLocating] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
    }
  }, [initialPosition]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos = [latitude, longitude];
        setPosition(newPos);
        onLocationSelected(latitude, longitude);
        setIsLocating(false);
      },
      (err) => {
        console.error('Location error:', err);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

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
      
      {/* Overlay UI */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl border border-[var(--color-stone)]/10 flex items-center justify-center text-[var(--color-primary-dark)] hover:bg-white hover:text-[var(--color-accent)] transition-all shadow-lg group"
          title="Locate me"
        >
          {isLocating ? (
            <div className="w-4 h-4 border-2 border-[var(--color-stone)]/20 border-t-[var(--color-accent)] rounded-full animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          )}
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-[400] bg-white/80 backdrop-blur-md px-4 py-2 rounded-full text-[8px] font-bold uppercase tracking-widest text-[var(--color-primary-dark)] shadow-sm pointer-events-none">
        Click map or use GPS to pinpoint studio
      </div>
    </div>
  );
}
