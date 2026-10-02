import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { PatientScreening } from '../types';
import { Layers, MapPin, ExternalLink, Edit3, Phone, Home, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface GisLeafletMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  patients: PatientScreening[];
  selectedPatient: PatientScreening | null;
  onSelectPatient: (patient: PatientScreening) => void;
  onMapClick?: (lat: number, lng: number) => void;
  onOpenEdit: (patient: PatientScreening) => void;
  pinModePatient: PatientScreening | null;
}

export const GisLeafletMap: React.FC<GisLeafletMapProps> = ({
  center,
  zoom,
  patients,
  selectedPatient,
  onSelectPatient,
  onMapClick,
  onOpenEdit,
  pinModePatient
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Fix default icon urls if needed
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom: zoom,
      zoomControl: false,
    });

    // Add zoom control top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Street Tile Layer (OpenStreetMap)
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors • รพ.โพนนาแก้ว',
    });

    // Satellite Tile Layer (Esri World Imagery)
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      }
    );

    // Initial layer
    streetLayer.addTo(map);
    (map as any)._streetLayer = streetLayer;
    (map as any)._satelliteLayer = satelliteLayer;

    // Markers layer
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Map click
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map type (street vs satellite)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const street = (map as any)._streetLayer;
    const satellite = (map as any)._satelliteLayer;

    if (mapType === 'satellite') {
      if (street && map.hasLayer(street)) map.removeLayer(street);
      if (satellite && !map.hasLayer(satellite)) map.addLayer(satellite);
    } else {
      if (satellite && map.hasLayer(satellite)) map.removeLayer(satellite);
      if (street && !map.hasLayer(street)) map.addLayer(street);
    }
  }, [mapType]);

  // Center/Zoom updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const currentCenter = map.getCenter();
    const dist = Math.abs(currentCenter.lat - center.lat) + Math.abs(currentCenter.lng - center.lng);
    if (dist > 0.0001) {
      map.flyTo([center.lat, center.lng], zoom, { duration: 1 });
    }
  }, [center.lat, center.lng, zoom]);

  // Render Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    patients.forEach((p) => {
      if (!p.location?.lat || !p.location?.lng) return;

      const isPositive = p.fitResult === 'positive';
      const isNegative = p.fitResult === 'negative';
      const isSelected = selectedPatient?.id === p.id;

      const isAdeno = p.caTracking?.biopsyResult === 'adenocarcinoma';
      const pinColor = isAdeno ? '#b91c1c' : isPositive ? '#e11d48' : isNegative ? '#059669' : '#d97706';
      
      const iconHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: ${isSelected ? 'scale(1.25)' : 'scale(1)'}; transition: transform 0.2s;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: ${pinColor}; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
            ${isAdeno ? '🎗️' : isPositive ? '⚠️' : isNegative ? '✓' : '📍'}
          </div>
          <div style="margin-top: 2px; background: rgba(15, 23, 42, 0.9); color: #ffffff; font-size: 10px; font-weight: bold; padding: 1px 6px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.25); white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
            ${p.houseNo} ม.${p.villageNo}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-marker',
        iconSize: [40, 52],
        iconAnchor: [20, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([p.location.lat, p.location.lng], { icon: customIcon });

      const lineMessage = encodeURIComponent(
        `📍 พิกัดบ้านผู้ป่วย: ${p.prefix}${p.firstName} ${p.lastName} (HN: ${p.hn})\n` +
        `🏠 ที่อยู่: บ้านเลขที่ ${p.houseNo} ม.${p.villageNo} ${p.villageName || ''} ต.${p.subdistrict || 'นาแก้ว'}\n` +
        `🎗️ ผลวินิจฉัย: ${isAdeno ? 'มะเร็งลำไส้ใหญ่ (Adenocarcinoma) ' + (p.caTracking?.cancerStaging || '') : 'กลุ่มคัดกรอง FIT'}\n` +
        `📌 ละติจูด (Lat): ${p.location.lat.toFixed(6)}\n` +
        `📌 ลองจิจูด (Lng): ${p.location.lng.toFixed(6)}\n` +
        (p.location.landmark ? `🚩 จุดสังเกต: ${p.location.landmark}\n` : '') +
        (p.phone ? `📞 โทรผู้ป่วย: ${p.phone}\n` : '') +
        (p.location.osmName ? `🩺 อสม.: ${p.location.osmName} ${p.location.osmPhone ? '(' + p.location.osmPhone + ')' : ''}\n` : '') +
        `🧭 ลิงก์ปักหมุด Google Maps: https://www.google.com/maps?q=${p.location.lat.toFixed(6)},${p.location.lng.toFixed(6)}`
      );

      // Build popup HTML
      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #1e293b; min-width: 250px; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px;">
            <div>
              <strong style="font-size: 13px; color: #0f172a;">${p.prefix}${p.firstName} ${p.lastName}</strong>
              <div style="font-size: 10px; color: #64748b;">HN: ${p.hn} • อายุ ${p.ageYears} ปี (${p.gender})</div>
            </div>
            <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 9999px; ${
              isAdeno
                ? 'background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;'
                : isPositive
                ? 'background: #ffe4e6; color: #9f1239; border: 1px solid #fecdd3;'
                : 'background: #dcfce7; color: #166534; border: 1px solid #bbf7d0;'
            }">
              ${isAdeno ? '🔴 มะเร็งลำไส้ใหญ่' : isPositive ? '⚠️ ผลบวก FIT+' : '🟢 ผลลบ FIT-'}
            </span>
          </div>

          ${isAdeno ? `
            <div style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 4px 6px; border-radius: 6px; font-size: 11px; margin-bottom: 6px;">
              <strong>ผลชิ้นเนื้อ:</strong> มะเร็งลำไส้ใหญ่ (Adenocarcinoma) ${p.caTracking?.cancerStaging ? `• ${p.caTracking.cancerStaging}` : ''}
              ${p.caTracking?.treatmentPlan ? `<div style="font-size: 10px; color: #7f1d1d; margin-top: 2px;">แผน: ${p.caTracking.treatmentPlan}</div>` : ''}
            </div>
          ` : ''}

          <div style="margin-bottom: 6px;">
            <strong>ที่อยู่:</strong> บ้านเลขที่ ${p.houseNo} ม.${p.villageNo} ${p.villageName || ''} ต.${p.subdistrict || 'นาแก้ว'}
          </div>

          <!-- Latitude & Longitude Block -->
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; margin-bottom: 6px; font-family: monospace; font-size: 11px; color: #0f172a;">
            <div><strong style="color: #047857;">Latitude (ละติจูด):</strong> ${p.location.lat.toFixed(6)}</div>
            <div><strong style="color: #047857;">Longitude (ลองจิจูด):</strong> ${p.location.lng.toFixed(6)}</div>
          </div>

          ${p.location.landmark ? `
            <div style="background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 4px 6px; border-radius: 6px; font-size: 11px; margin-bottom: 6px;">
              <strong>จุดสังเกตเด่น:</strong> ${p.location.landmark}
            </div>
          ` : ''}

          ${p.location.osmName ? `
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 4px 6px; border-radius: 6px; font-size: 11px; margin-bottom: 6px;">
              <strong>อสม. ผู้ดูแล:</strong> ${p.location.osmName} ${p.location.osmPhone ? `(${p.location.osmPhone})` : ''}
            </div>
          ` : ''}

          <!-- Action Buttons -->
          <div style="display: flex; gap: 4px; margin-top: 8px; border-top: 1px solid #f1f5f9; padding-top: 6px;">
            <a href="https://line.me/R/msg/text/?${lineMessage}" target="_blank" rel="noreferrer" style="flex: 1; text-align: center; background: #06c755; color: #ffffff; padding: 5px 6px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: bold; display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
              💬 ส่งลิงก์ LINE
            </a>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${p.location.lat},${p.location.lng}" target="_blank" rel="noreferrer" style="flex: 1; text-align: center; background: #2563eb; color: #ffffff; padding: 5px 6px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: bold; display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
              🧭 Google Maps
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 300 });

      marker.on('click', () => {
        onSelectPatient(p);
      });

      markersLayer.addLayer(marker);
    });
  }, [patients, selectedPatient]);

  return (
    <div className="relative w-full h-full">
      {/* Leaflet container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Layer switcher control */}
      <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-md rounded-xl shadow-md p-1 border border-slate-200 flex items-center gap-1 text-xs">
        <button
          type="button"
          onClick={() => setMapType('street')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
            mapType === 'street' ? 'bg-emerald-700 text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          แผนที่ถนน
        </button>
        <button
          type="button"
          onClick={() => setMapType('satellite')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
            mapType === 'satellite' ? 'bg-emerald-700 text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          ภาพดาวเทียม
        </button>
      </div>

      {/* Mode hint */}
      {pinModePatient && (
        <div className="absolute top-3 right-14 z-10 bg-amber-500 text-white font-bold px-3 py-1 rounded-xl shadow-lg text-xs animate-bounce flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          <span>คลิกบนแผนที่เพื่อเลือกตำแหน่งบ้าน</span>
        </div>
      )}
    </div>
  );
};
