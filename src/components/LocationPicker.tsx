"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState, useEffect } from "react";

// Fix Leaflet's default icon paths in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickMarker({
    position,
    onChange,
}: {
    position: [number, number];
    onChange: (position: [number, number]) => void;
}) {
    useMapEvents({
        click(e) {
            onChange([e.latlng.lat, e.latlng.lng]);
        },
    });

    return <Marker position={position} />;
}

export default function LocationPicker({
    latitude,
    longitude,
    onLocationChange,
}: {
    latitude: number;
    longitude: number;
    onLocationChange: (lat: number, lng: number) => void;
}) {
    const [position, setPosition] = useState<[number, number]>([
        latitude,
        longitude,
    ]);

    // Sync internal state when external props change
    useEffect(() => {
        setPosition([latitude, longitude]);
    }, [latitude, longitude]);

    return (
        <div className="relative z-0 isolate w-full overflow-hidden rounded-2xl shadow-lg ring-1 ring-slate-200 dark:ring-white/10">
            <MapContainer
                center={[latitude, longitude]}
                zoom={17}
                scrollWheelZoom={true}
                className="h-72 sm:h-96 md:h-[450px] w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <ClickMarker
                    position={position}
                    onChange={(newPosition) => {
                        setPosition(newPosition);
                        onLocationChange(newPosition[0], newPosition[1]);
                    }}
                />
            </MapContainer>

            {/* Floating UX hint - guides users to interact with the map */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 backdrop-blur-md px-4 py-2 text-xs font-medium text-white shadow-lg pointer-events-none whitespace-nowrap select-none">
                📍 Tap the map to select your location
            </div>
        </div>
    );
}