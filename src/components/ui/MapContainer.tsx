'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Next.js
const fixLeafletIcon = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    title: string;
    description?: string;
    sensors?: {
      moisture: number;
      temperature: number;
      humidity: number;
    };
  }>;
  className?: string;
}

const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

export default function Map({ 
  center = [4.0511, 9.7679], // Default to Douala, Cameroon
  zoom = 13,
  markers = [],
  className = "h-full w-full"
}: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fixLeafletIcon();
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`${className} bg-slate-100 animate-pulse flex items-center justify-center`}>
        <span className="text-slate-400 font-bold">Initializing Map...</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={center} zoom={zoom} />
        {markers.map((marker, index) => (
          <Marker key={index} position={marker.position}>
            <Popup>
              <div className="p-2 min-w-[180px] text-slate-800 dark:text-slate-100">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">potted_plant</span>
                  {marker.title}
                </h3>
                {marker.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
                    {marker.description}
                  </p>
                )}
                
                {marker.sensors ? (
                  <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1 flex items-center gap-1 leading-none">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                      Sensor Telemetry
                    </p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-blue-500">water_drop</span>
                        Soil Moisture
                      </span>
                      <span className="font-black text-indigo-600 dark:text-indigo-400">{marker.sensors.moisture}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-red-500">thermostat</span>
                        Temp
                      </span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">{marker.sensors.temperature}°C</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-sky-500">humidity_percentage</span>
                        Humidity
                      </span>
                      <span className="font-black text-amber-600 dark:text-amber-400">{marker.sensors.humidity}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 italic">No telemetry active</div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
