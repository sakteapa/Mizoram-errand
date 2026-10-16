import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  Compass, 
  TrendingUp, 
  ArrowRight, 
  Play, 
  Square, 
  RefreshCw, 
  ExternalLink, 
  Crosshair, 
  Bike, 
  Layers, 
  Check, 
  Info,
  ChevronDown,
  ChevronUp,
  Maximize2
} from 'lucide-react';
import { MIZORAM_LOCALITIES } from '../utils/mizoramData.ts';
import { 
  computePointToPointRoute, 
  generateRouteWaypoints, 
  findNearestLocality 
} from '../utils/gpsEngine.ts';
import type { GpsCoordinate, PointToPointRoute, MizoramLocality } from '../types/platform.ts';

interface PointToPointGpsMapProps {
  language: 'en' | 'mizo';
  originGps?: GpsCoordinate;
  destGps?: GpsCoordinate;
  onSelectRoute?: (route: PointToPointRoute) => void;
  interactive?: boolean;
  compact?: boolean;
}

export const PointToPointGpsMap: React.FC<PointToPointGpsMapProps> = ({
  language,
  originGps,
  destGps,
  onSelectRoute,
  interactive = true,
  compact = false,
}) => {
  const isMizo = language === 'mizo';

  // State for origin (Point A) and destination (Point B)
  const [pointA, setPointA] = useState<GpsCoordinate>(() => {
    if (originGps) return originGps;
    const def = MIZORAM_LOCALITIES[0]; // Bara Bazar
    return {
      lat: def.latitude,
      lng: def.longitude,
      name: def.name,
      elevationMeters: def.elevationMeters,
    };
  });

  const [pointB, setPointB] = useState<GpsCoordinate>(() => {
    if (destGps) return destGps;
    const def = MIZORAM_LOCALITIES[1]; // Zarkawt
    return {
      lat: def.latitude,
      lng: def.longitude,
      name: def.name,
      elevationMeters: def.elevationMeters,
    };
  });

  const [activePinTarget, setActivePinTarget] = useState<'A' | 'B'>('B');
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'elevation'>('map');

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with prop changes if passed
  useEffect(() => {
    if (originGps) setPointA(originGps);
  }, [originGps]);

  useEffect(() => {
    if (destGps) setPointB(destGps);
  }, [destGps]);

  // Compute live point to point route
  const currentRoute = useMemo(() => {
    const route = computePointToPointRoute(pointA, pointB, 4);
    return route;
  }, [pointA, pointB]);

  // Notify parent on route update
  useEffect(() => {
    if (onSelectRoute) {
      onSelectRoute(currentRoute);
    }
  }, [currentRoute, onSelectRoute]);

  // Generate route waypoints for animation and display
  const waypoints = useMemo(() => {
    return generateRouteWaypoints(pointA, pointB, 16);
  }, [pointA, pointB]);

  // Live GPS Fetch using HTML5 Geolocation API
  const handleGetDeviceLocation = () => {
    if (!navigator.geolocation) {
      setGpsError(isMizo ? 'I browser hian GPS a support lo.' : 'Geolocation is not supported by your browser.');
      return;
    }

    setIsGettingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGettingGps(false);
        const { latitude, longitude, accuracy, altitude } = pos.coords;
        const nearest = findNearestLocality(latitude, longitude, MIZORAM_LOCALITIES);
        
        const newCoord: GpsCoordinate = {
          lat: Math.round(latitude * 10000) / 10000,
          lng: Math.round(longitude * 10000) / 10000,
          name: `${nearest.locality.name} (${Math.round(nearest.distanceKm * 1000)}m away)`,
          elevationMeters: altitude ? Math.round(altitude) : nearest.locality.elevationMeters,
          accuracyMeters: Math.round(accuracy),
        };

        if (activePinTarget === 'A') {
          setPointA(newCoord);
        } else {
          setPointB(newCoord);
        }
      },
      (err) => {
        setIsGettingGps(false);
        // Fallback to Aizawl Dawrpui center if GPS permission denied in testing
        const fallback = MIZORAM_LOCALITIES[0];
        const newCoord: GpsCoordinate = {
          lat: fallback.latitude,
          lng: fallback.longitude,
          name: `${fallback.name} (GPS Default)`,
          elevationMeters: fallback.elevationMeters,
          accuracyMeters: 25,
        };
        if (activePinTarget === 'A') {
          setPointA(newCoord);
        } else {
          setPointB(newCoord);
        }
        setGpsError(
          isMizo 
            ? 'GPS location phalsak a ni lo, Aizawl central hmangin kan dah e.' 
            : 'GPS permission denied or unavailable, defaulted to Aizawl Central.'
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  // Swap Point A and B
  const handleSwapPoints = () => {
    const temp = pointA;
    setPointA(pointB);
    setPointB(temp);
  };

  // Select locality preset
  const handleSelectLocality = (loc: MizoramLocality, target: 'A' | 'B') => {
    const coord: GpsCoordinate = {
      lat: loc.latitude,
      lng: loc.longitude,
      name: loc.name,
      elevationMeters: loc.elevationMeters,
    };
    if (target === 'A') setPointA(coord);
    else setPointB(coord);
  };

  // Simulation handler
  const handleToggleSimulation = () => {
    if (isSimulating) {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      setIsSimulating(false);
      setSimStep(0);
    } else {
      setIsSimulating(true);
      setSimStep(0);
      let step = 0;
      simTimerRef.current = setInterval(() => {
        step += 1;
        if (step >= waypoints.length) {
          step = 0;
        }
        setSimStep(step);
      }, 700);
    }
  };

  useEffect(() => {
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, []);

  // Map canvas coordinate normalization (Aizawl bounds ~ lat 23.68 - 23.82, lng 92.68 - 92.76)
  const mapBounds = useMemo(() => {
    const allLats = [pointA.lat, pointB.lat, ...MIZORAM_LOCALITIES.slice(0, 8).map(l => l.latitude)];
    const allLngs = [pointA.lng, pointB.lng, ...MIZORAM_LOCALITIES.slice(0, 8).map(l => l.longitude)];
    const minLat = Math.min(...allLats) - 0.01;
    const maxLat = Math.max(...allLats) + 0.01;
    const minLng = Math.min(...allLngs) - 0.01;
    const maxLng = Math.max(...allLngs) + 0.01;
    return { minLat, maxLat, minLng, maxLng };
  }, [pointA, pointB]);

  // Helper to convert lat/lng to SVG percentage coordinates (50 to 950 px)
  const projectToSvg = (lat: number, lng: number) => {
    const { minLat, maxLat, minLng, maxLng } = mapBounds;
    const x = ((lng - minLng) / (maxLng - minLng || 0.05)) * 900 + 50;
    // Invert Y because latitude goes north (up) but SVG Y goes down
    const y = (1 - (lat - minLat) / (maxLat - minLat || 0.05)) * 420 + 40;
    return { x: Math.round(x), y: Math.round(y) };
  };

  const svgA = projectToSvg(pointA.lat, pointA.lng);
  const svgB = projectToSvg(pointB.lat, pointB.lng);
  const currentSimPoint = waypoints[simStep] || waypoints[0];
  const svgSim = projectToSvg(currentSimPoint.lat, currentSimPoint.lng);

  // Generate SVG path for route
  const svgPathD = useMemo(() => {
    return waypoints.map((pt, i) => {
      const { x, y } = projectToSvg(pt.lat, pt.lng);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [waypoints, mapBounds]);

  // Click on SVG map to reposition active pin
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Normalizing to 0-1
    const normX = clickX / rect.width;
    const normY = clickY / rect.height;

    // Reconstruct lat/lng
    const { minLat, maxLat, minLng, maxLng } = mapBounds;
    const lng = minLng + normX * (maxLng - minLng);
    const lat = maxLat - normY * (maxLat - minLat);

    const nearest = findNearestLocality(lat, lng, MIZORAM_LOCALITIES);
    const newCoord: GpsCoordinate = {
      lat: Math.round(lat * 10000) / 10000,
      lng: Math.round(lng * 10000) / 10000,
      name: `Point near ${nearest.locality.name}`,
      elevationMeters: nearest.locality.elevationMeters,
    };

    if (activePinTarget === 'A') {
      setPointA(newCoord);
      setActivePinTarget('B'); // auto-advance to point B!
    } else {
      setPointB(newCoord);
    }
  };

  // External Google Maps directions URL
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${pointA.lat},${pointA.lng}&destination=${pointB.lat},${pointB.lng}`;

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl shadow-xs ${
      compact ? 'p-2 sm:p-3 space-y-2' : 'p-3 sm:p-4 space-y-3'
    }`}>
      {/* Top Header: Title & Quick GPS Controls */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>{isMizo ? 'Point-to-Point GPS Kalkawng' : 'Point-to-Point GPS Hill Routing'}</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-mono font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                LIVE
              </span>
            </h3>
            {!compact && (
              <p className="text-[11px] text-slate-500">
                {isMizo 
                  ? 'Aizawl tlangchhip coordinate, kual leh chho/thuk hisap' 
                  : 'Precise coordinate-to-coordinate switchback & slope calculation'}
              </p>
            )}
          </div>
        </div>

        {/* View toggle (Map vs Elevation Profile) */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('map')}
              className={`px-2 py-1 rounded-md font-semibold text-[11px] transition ${
                viewMode === 'map' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              {isMizo ? 'Map' : 'Map View'}
            </button>
            <button
              onClick={() => setViewMode('elevation')}
              className={`px-2 py-1 rounded-md font-semibold text-[11px] transition ${
                viewMode === 'elevation' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              {isMizo ? 'Tlangram Slope' : 'Elevation Profile'}
            </button>
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg border border-slate-200 font-semibold flex items-center gap-1 transition"
            title="Open in Google Maps"
          >
            <ExternalLink className="w-3 h-3 text-emerald-600" />
            <span className="hidden sm:inline">Google Maps</span>
          </a>
        </div>
      </div>

      {/* Point A & Point B Selection Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {/* Point A (Pickup / Origin) */}
        <div 
          onClick={() => setActivePinTarget('A')}
          className={`p-2.5 rounded-xl border transition cursor-pointer ${
            activePinTarget === 'A'
              ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
              : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-emerald-800 text-[11px] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>Point A: {isMizo ? 'Lakna (Pickup)' : 'Origin (Pickup)'}</span>
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              {pointA.elevationMeters ?? 920}m ASL
            </span>
          </div>

          <div className="font-semibold text-slate-900 text-xs truncate">
            {pointA.name || 'Bara Bazar'}
          </div>

          <div className="font-mono text-[10px] text-slate-500 mt-0.5">
            {pointA.lat.toFixed(4)}°N, {pointA.lng.toFixed(4)}°E
          </div>
        </div>

        {/* Point B (Drop / Destination) */}
        <div 
          onClick={() => setActivePinTarget('B')}
          className={`p-2.5 rounded-xl border transition cursor-pointer ${
            activePinTarget === 'B'
              ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20'
              : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-amber-800 text-[11px] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              <span>Point B: {isMizo ? 'Dahna (Drop)' : 'Destination (Drop)'}</span>
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              {pointB.elevationMeters ?? 920}m ASL
            </span>
          </div>

          <div className="font-semibold text-slate-900 text-xs truncate">
            {pointB.name || 'Zarkawt'}
          </div>

          <div className="font-mono text-[10px] text-slate-500 mt-0.5">
            {pointB.lat.toFixed(4)}°N, {pointB.lng.toFixed(4)}°E
          </div>
        </div>
      </div>

      {/* Action Toolbar for GPS Pinning */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Live Device GPS Button */}
          <button
            type="button"
            onClick={handleGetDeviceLocation}
            disabled={isGettingGps}
            className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 shadow-2xs text-[11px]"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isGettingGps ? 'animate-spin' : ''}`} />
            <span>
              {isGettingGps
                ? (isMizo ? 'GPS zawng mek...' : 'Locating...')
                : (isMizo ? `Ka Awmna GPS (Set Point ${activePinTarget})` : `My GPS (Set Point ${activePinTarget})`)}
            </span>
          </button>

          {/* Swap A & B Button */}
          <button
            type="button"
            onClick={handleSwapPoints}
            className="bg-white hover:bg-slate-100 text-slate-700 px-2 py-1.5 rounded-lg border border-slate-200 font-semibold text-[11px] flex items-center gap-1 transition"
            title="Swap Origin and Destination"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" />
            <span>{isMizo ? 'A & B Thleng' : 'Swap'}</span>
          </button>
        </div>

        {/* Quick presets dropdown for quick testing */}
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-slate-500 hidden sm:inline">{isMizo ? 'Preset:' : 'Quick Select:'}</span>
          <select
            onChange={(e) => {
              const loc = MIZORAM_LOCALITIES.find(l => l.id === e.target.value);
              if (loc) handleSelectLocality(loc, activePinTarget);
            }}
            aria-label="Preset Mizoram Locality"
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="">{isMizo ? `Point ${activePinTarget} hmun thlang rawh...` : `Set Point ${activePinTarget}...`}</option>
            {MIZORAM_LOCALITIES.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.elevationMeters}m)
              </option>
            ))}
          </select>
        </div>
      </div>

      {gpsError && (
        <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Main Interactive Map & Visualizer (Clean Light Theme) */}
      <div className="relative bg-slate-50 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
        {viewMode === 'map' ? (
          <div className={`relative w-full select-none ${compact ? 'h-40 sm:h-52' : 'h-50 sm:h-64'}`}>
            {/* Topographical grid background */}
            <svg
              onClick={handleMapClick}
              className="w-full h-full cursor-crosshair"
              viewBox="0 0 1000 500"
              preserveAspectRatio="none"
            >
              <defs>
                <pattern id="gridPatternLight" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
                </pattern>
                <linearGradient id="routeGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>

              {/* Background Grid */}
              <rect width="1000" height="500" fill="#f8fafc" />
              <rect width="1000" height="500" fill="url(#gridPatternLight)" />

              {/* Simulated Mountain Contours in subtle slate */}
              <path d="M 0 120 Q 250 80, 500 150 T 1000 100" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M 0 240 Q 250 180, 500 280 T 1000 220" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M 0 360 Q 250 300, 500 400 T 1000 340" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 4" />

              {/* All Major Aizawl Localities as subtle reference dots */}
              {MIZORAM_LOCALITIES.slice(0, 10).map((loc) => {
                const pt = projectToSvg(loc.latitude, loc.longitude);
                return (
                  <g key={loc.id} opacity="0.8">
                    <circle cx={pt.x} cy={pt.y} r="3.5" fill="#94a3b8" />
                    <text x={pt.x + 6} y={pt.y + 3} fill="#475569" fontSize="11" fontWeight="500" fontFamily="system-ui, sans-serif">
                      {loc.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}

              {/* Straight Displacement Line (Dashed) */}
              <line
                x1={svgA.x}
                y1={svgA.y}
                x2={svgB.x}
                y2={svgB.y}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Point-to-Point Winding Hill Road Route (Solid with Gradient) */}
              <path
                d={svgPathD}
                fill="none"
                stroke="url(#routeGradientLight)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Point A Marker (Pickup - Emerald) */}
              <g transform={`translate(${svgA.x}, ${svgA.y})`}>
                <circle r="14" fill="#10b981" fillOpacity="0.3" className="animate-ping" />
                <circle r="7.5" fill="#059669" stroke="#ffffff" strokeWidth="2.5" />
                <text y="-12" textAnchor="middle" fill="#047857" fontSize="12" fontWeight="bold" fontFamily="system-ui, sans-serif">
                  A (Pickup)
                </text>
              </g>

              {/* Point B Marker (Drop - Amber) */}
              <g transform={`translate(${svgB.x}, ${svgB.y})`}>
                <circle r="14" fill="#f59e0b" fillOpacity="0.3" className="animate-ping" />
                <circle r="7.5" fill="#d97706" stroke="#ffffff" strokeWidth="2.5" />
                <text y="-12" textAnchor="middle" fill="#b45309" fontSize="12" fontWeight="bold" fontFamily="system-ui, sans-serif">
                  B (Drop)
                </text>
              </g>

              {/* Courier Simulation Avatar */}
              {isSimulating && (
                <g transform={`translate(${svgSim.x}, ${svgSim.y})`}>
                  <circle r="10" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                  <circle r="18" fill="#0284c7" fillOpacity="0.3" className="animate-pulse" />
                </g>
              )}
            </svg>

            {/* Map Overlay Controls */}
            <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] text-slate-700 flex items-center gap-2 shadow-2xs">
              <span className="flex items-center gap-1 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>Point A</span>
              </span>
              <span>→</span>
              <span className="flex items-center gap-1 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                <span>Point B</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-700 font-mono font-bold">
                {currentRoute.roadDistanceKm} km
              </span>
            </div>

            {/* Tap instruction badge */}
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-slate-600 font-medium border border-slate-200 shadow-2xs">
              {isMizo ? `Map-ah hmet la Point ${activePinTarget} dah rawh` : `Click anywhere to set Point ${activePinTarget}`}
            </div>

            {/* Simulation Play / Pause Button */}
            <button
              type="button"
              onClick={handleToggleSimulation}
              className="absolute bottom-2 right-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-md transition"
            >
              {isSimulating ? (
                <>
                  <Square className="w-3 h-3 fill-current" />
                  <span>{isMizo ? 'Stop GPS' : 'Stop'}</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isMizo ? 'Live Test' : 'Simulate'}</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Elevation Profile View (Clean Light Theme) */
          <div className={`p-3 sm:p-4 bg-white text-slate-900 flex flex-col justify-between ${
            compact ? 'h-40 sm:h-52' : 'h-50 sm:h-64'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                {isMizo ? 'Tlangram Chho / Thuk Dinhmun' : 'Terrain Elevation Profile'}
              </span>
              <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                currentRoute.climbDirection === 'uphill' 
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : currentRoute.climbDirection === 'downhill'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {currentRoute.climbDirection === 'uphill' ? '▲ UPHILL CLIMB' : currentRoute.climbDirection === 'downhill' ? '▼ DOWNHILL' : '▬ RIDGE LEVEL'}
              </span>
            </div>

            {/* Elevation SVG Chart */}
            <div className="w-full h-28 sm:h-32 pt-2">
              <svg className="w-full h-full" viewBox="0 0 500 140" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="hillFillGradientLight" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Ground Fill */}
                <path
                  d={`M 40 120 L 40 ${120 - Math.min(100, Math.max(10, (pointA.elevationMeters ?? 900) - 700) * 0.2)} Q 250 ${
                    120 - Math.min(100, Math.max(10, ((pointA.elevationMeters ?? 900) + (pointB.elevationMeters ?? 900)) / 2 - 700) * 0.2)
                  }, 460 ${120 - Math.min(100, Math.max(10, (pointB.elevationMeters ?? 900) - 700) * 0.2)} L 460 120 Z`}
                  fill="url(#hillFillGradientLight)"
                />

                {/* Mountain Ridge Curve */}
                <path
                  d={`M 40 ${120 - Math.min(100, Math.max(10, (pointA.elevationMeters ?? 900) - 700) * 0.2)} Q 250 ${
                    120 - Math.min(100, Math.max(10, ((pointA.elevationMeters ?? 900) + (pointB.elevationMeters ?? 900)) / 2 - 700) * 0.2)
                  }, 460 ${120 - Math.min(100, Math.max(10, (pointB.elevationMeters ?? 900) - 700) * 0.2)}`}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="3"
                />

                {/* Point A Marker */}
                <circle cx="40" cy={120 - Math.min(100, Math.max(10, (pointA.elevationMeters ?? 900) - 700) * 0.2)} r="5" fill="#059669" stroke="#ffffff" strokeWidth="1.5" />
                <text x="45" y={110 - Math.min(100, Math.max(10, (pointA.elevationMeters ?? 900) - 700) * 0.2)} fill="#047857" fontWeight="bold" fontSize="10">
                  {pointA.name?.split(' ')[0]} ({pointA.elevationMeters}m)
                </text>

                {/* Point B Marker */}
                <circle cx="460" cy={120 - Math.min(100, Math.max(10, (pointB.elevationMeters ?? 900) - 700) * 0.2)} r="5" fill="#d97706" stroke="#ffffff" strokeWidth="1.5" />
                <text x="360" y={110 - Math.min(100, Math.max(10, (pointB.elevationMeters ?? 900) - 700) * 0.2)} fill="#b45309" fontWeight="bold" fontSize="10">
                  {pointB.name?.split(' ')[0]} ({pointB.elevationMeters}m)
                </text>
              </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-100 pt-1.5 font-medium">
              <span>Slope: <strong className="text-slate-900 font-mono">{currentRoute.averageGradientPercent}%</strong></span>
              <span>Delta: <strong className="text-slate-900 font-mono">{currentRoute.elevationChangeMeters > 0 ? `+${currentRoute.elevationChangeMeters}` : currentRoute.elevationChangeMeters}m</strong></span>
              <span>Transit: <strong className="text-slate-900 font-mono">~{currentRoute.estimatedTransitMinutes} mins</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Live Route Telemetry Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">{isMizo ? 'Kawng Hlat Zawng' : 'Road Distance'}</span>
          <span className="text-sm font-bold font-mono text-emerald-800 mt-0.5 block">
            {currentRoute.roadDistanceKm} km
          </span>
          <span className="text-[10px] text-slate-400">({currentRoute.straightDistanceKm} km straight)</span>
        </div>

        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">{isMizo ? 'Chho / Thuk Zawng' : 'Elevation Change'}</span>
          <span className="text-sm font-bold font-mono text-slate-900 mt-0.5 block">
            {currentRoute.elevationChangeMeters > 0 ? `+${currentRoute.elevationChangeMeters}` : currentRoute.elevationChangeMeters}m
          </span>
          <span className="text-[10px] text-slate-500 capitalize">{currentRoute.climbDirection}</span>
        </div>

        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">{isMizo ? 'Awih Zawng' : 'Slope Gradient'}</span>
          <span className="text-sm font-bold font-mono text-amber-700 mt-0.5 block">
            {currentRoute.averageGradientPercent}%
          </span>
          <span className="text-[10px] text-slate-400">Terrain factor: {currentRoute.hillSteepnessFactor.toFixed(2)}x</span>
        </div>

        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">{isMizo ? 'Thlen Hun Chhian' : 'Est. Transit ETA'}</span>
          <span className="text-sm font-bold font-mono text-purple-700 mt-0.5 block">
            ~{currentRoute.estimatedTransitMinutes} mins
          </span>
          <span className="text-[10px] text-slate-400">Two-Wheeler / Taxi</span>
        </div>
      </div>
    </div>
  );
};
