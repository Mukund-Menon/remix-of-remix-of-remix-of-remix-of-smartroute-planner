"use client";

import { useEffect, useState, Fragment } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// CSS is imported globally in app/layout.tsx to avoid chunk loading issues with dynamic imports

interface RouteData {
  coordinates: [number, number][];
  distance: number;
  duration: number;
  cost: number;
  mode: string;
  optimizationType?: "shortest" | "fastest" | "cheapest" | "balanced";
}

interface TransportMode {
  value: string;
  label: string;
  icon: any;
  color: string;
}

interface Waypoint {
  lat: number;
  lon: number;
  type: string;
  userId: string;
  location: string;
}

interface Member {
  userId: string;
  user: {
    name: string;
    email: string;
    image: string | null;
  };
}

interface MapComponentProps {
  routes: RouteData[];
  transportModes: TransportMode[];
  waypoints?: Waypoint[];
  members?: Member[];
}

// Fix for default marker icons in Leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

function MapUpdater({ routes, waypoints }: { routes: RouteData[]; waypoints?: Waypoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !routes || routes.length === 0) return;
    
    const timer = setTimeout(() => {
      try {
        const allCoordinates: [number, number][] = [];
        
        routes.forEach(route => {
          if (route.coordinates && Array.isArray(route.coordinates)) {
            allCoordinates.push(...route.coordinates);
          }
        });
        
        if (waypoints && waypoints.length > 0) {
          waypoints.forEach(waypoint => {
            allCoordinates.push([waypoint.lat, waypoint.lon]);
          });
        }
        
        if (allCoordinates.length > 0) {
          const bounds = L.latLngBounds(allCoordinates);
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (error) {
        console.error("Error updating map bounds:", error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [routes, waypoints, map]);

  return null;
}

export default function MapComponent({ routes, transportModes, waypoints, members }: MapComponentProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getMarkerIcon = (color: string) => {
    if (typeof window === 'undefined') return null;
    try {
      return L.divIcon({
        className: "custom-marker",
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    } catch {
      return null;
    }
  };

  const getWaypointIcon = (type: string, index: number) => {
    if (typeof window === 'undefined') return null;
    try {
      const color = type === 'pickup' ? '#22c55e' : '#3b82f6';
      return L.divIcon({
        className: "waypoint-marker",
        html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">${index + 1}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    } catch {
      return null;
    }
  };

  const getRouteColor = (optimizationType?: string) => {
    const colorMap = {
      fastest: "#3b82f6",
      cheapest: "#f59e0b",
      balanced: "#8b5cf6",
    };
    return colorMap[optimizationType as keyof typeof colorMap] || "#6b7280";
  };

  const getRouteStyle = (index: number, optimizationType?: string) => {
    const isPrimary = index === 0;
    return {
      color: getRouteColor(optimizationType),
      weight: isPrimary ? 5 : 4,
      opacity: isPrimary ? 0.9 : 0.6,
      dashArray: isPrimary ? undefined : "10, 10",
    };
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters.toFixed(0)}m`;
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(2)}`;
  };

  const getOptimizationLabel = (type?: string) => {
    const labels = {
      fastest: "Fastest Time",
      cheapest: "Cheapest Cost",
      balanced: "Balanced Route",
    };
    return labels[type as keyof typeof labels] || "Route";
  };

  const createRouteLabelIcon = (color: string, label: string) => {
    if (typeof window === 'undefined') return null;
    try {
      return L.divIcon({
        className: "route-label",
        html: `<div style="background-color: ${color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3); border: 2px solid white;">${label}</div>`,
        iconSize: [100, 20],
        iconAnchor: [50, 10],
      });
    } catch {
      return null;
    }
  };

  const getMemberName = (userId: string) => {
    if (!members) return "Member";
    const member = members.find(m => m.userId === userId);
    return member?.user.name || "Member";
  };

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={4}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {routes && routes.length > 0 && routes.map((route, index) => {
          const routeStyle = getRouteStyle(index, route.optimizationType);
          if (!route.coordinates || route.coordinates.length === 0) return null;
          
          const startPoint = route.coordinates[0];
          const endPoint = route.coordinates[route.coordinates.length - 1];
          const midPoint = route.coordinates[Math.floor(route.coordinates.length / 2)];
          
          return (
            <Fragment key={`route-${index}`}>
              <Polyline positions={route.coordinates} pathOptions={routeStyle} />
              
              {!waypoints && index === 0 && startPoint && (
                <Marker position={startPoint} icon={getMarkerIcon("#22c55e")!}>
                  <Popup><div className="text-sm"><strong>Start Point</strong><br />Mode: {route.mode}</div></Popup>
                </Marker>
              )}
              
              {!waypoints && index === 0 && endPoint && (
                <Marker position={endPoint} icon={getMarkerIcon("#ef4444")!}>
                  <Popup><div className="text-sm"><strong>Destination</strong><br />Mode: {route.mode}</div></Popup>
                </Marker>
              )}
              
              {!waypoints && route.coordinates.length > 2 && midPoint && (() => {
                const labelIcon = createRouteLabelIcon(routeStyle.color, getOptimizationLabel(route.optimizationType));
                if (!labelIcon) return null;
                return (
                  <Marker position={midPoint} icon={labelIcon}>
                    <Popup>
                      <div className="text-sm space-y-1">
                        <div className="font-semibold text-base mb-2">{getOptimizationLabel(route.optimizationType)}</div>
                        <div><strong>Distance:</strong> {formatDistance(route.distance)}</div>
                        <div><strong>Duration:</strong> {formatDuration(route.duration)}</div>
                        <div><strong>Cost:</strong> {formatCost(route.cost)}</div>
                        <div><strong>Mode:</strong> {route.mode}</div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })()}
            </Fragment>
          );
        })}
        
        {waypoints && waypoints.length > 0 && waypoints.map((waypoint, index) => {
          const icon = getWaypointIcon(waypoint.type, index);
          if (!icon) return null;
          return (
            <Marker key={`waypoint-${index}`} position={[waypoint.lat, waypoint.lon]} icon={icon}>
              <Popup>
                <div className="text-sm space-y-1">
                  <div className="font-semibold text-base mb-1">Stop #{index + 1}</div>
                  <div><strong>Type:</strong> {waypoint.type === 'pickup' ? 'Pick up' : 'Drop off'}</div>
                  <div><strong>Location:</strong> {waypoint.location}</div>
                  <div><strong>Traveler:</strong> {getMemberName(waypoint.userId)}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        <MapUpdater routes={routes} waypoints={waypoints} />
      </MapContainer>
    </div>
  );
}