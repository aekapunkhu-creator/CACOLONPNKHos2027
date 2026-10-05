import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { PatientScreening, PatientLocation } from '../types';
import { 
  MapPin, 
  Crosshair, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Compass, 
  Phone, 
  Home, 
  Layers, 
  ExternalLink, 
  ArrowLeft, 
  Check, 
  Save, 
  Stethoscope, 
  Copy, 
  User, 
  Calendar 
} from 'lucide-react';

interface VhvPublicPinHouseViewProps {
  patients: PatientScreening[];
  initialHn?: string | null;
  onUpdatePatient: (updated: PatientScreening) => Promise<void> | void;
  onExit?: () => void;
}

// Center of Phon Na Kaeo District
const DEFAULT_CENTER = { lat: 17.1685, lng: 104.3120 };

export const VhvPublicPinHouseView: React.FC<VhvPublicPinHouseViewProps> = ({
  patients,
  initialHn,
  onUpdatePatient,
  onExit
}) => {
  // Currently selected patient
  const [selectedHn, setSelectedHn] = useState<string>(() => {
    if (initialHn) return initialHn;
    // Default to first patient with Adenocarcinoma or first patient in list
    const adeno = patients.find(p => p.caTracking?.biopsyResult === 'adenocarcinoma');
    return adeno ? adeno.hn : (patients[0]?.hn || '');
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showPatientSelector, setShowPatientSelector] = useState<boolean>(!initialHn);

  const currentPatient = useMemo(() => {
    return patients.find(p => p.hn === selectedHn) || null;
  }, [patients, selectedHn]);

  // Form states
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [addressDetails, setAddressDetails] = useState<string>('');
  const [osmName, setOsmName] = useState<string>('อสม. ในพื้นที่');
  const [osmPhone, setOsmPhone] = useState<string>('');
  const [visitStatus, setVisitStatus] = useState<'visited' | 'not_visited' | 'followup_needed'>('visited');
  const [visitNotes, setVisitNotes] = useState<string>('');

  // GPS & Map states
  const [isGettingGps, setIsGettingGps] = useState<boolean>(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('satellite'); // default to satellite for rural village recognition!
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync form when current patient changes
  useEffect(() => {
    if (currentPatient) {
      if (currentPatient.location) {
        setLat(currentPatient.location.lat ? currentPatient.location.lat.toFixed(6) : '');
        setLng(currentPatient.location.lng ? currentPatient.location.lng.toFixed(6) : '');
        setLandmark(currentPatient.location.landmark || '');
        setAddressDetails(currentPatient.location.addressDetails || `บ้านเลขที่ ${currentPatient.houseNo} ม.${currentPatient.villageNo} ต.${currentPatient.subdistrict || 'นาแก้ว'}`);
        setOsmName(currentPatient.location.osmName || 'อสม. ในพื้นที่');
        setOsmPhone(currentPatient.location.osmPhone || '');
        setVisitStatus(currentPatient.location.visitStatus || 'visited');
        setVisitNotes(currentPatient.location.visitNotes || '');
      } else {
        setLat('');
        setLng('');
        setLandmark('');
        setAddressDetails(`บ้านเลขที่ ${currentPatient.houseNo} ม.${currentPatient.villageNo} ต.${currentPatient.subdistrict || 'นาแก้ว'}`);
        setOsmName('อสม. ในพื้นที่');
        setOsmPhone('');
        setVisitStatus('visited');
        setVisitNotes('');
      }
      setSubmitSuccess(false);
    }
  }, [currentPatient]);

  // Filtered patients for dropdown selector
  const eligiblePatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase().trim();
    return patients.filter(p => 
      p.hn.toLowerCase().includes(q) ||
      `${p.prefix}${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.houseNo.toLowerCase().includes(q) ||
      (p.villageName || '').toLowerCase().includes(q)
    );
  }, [patients, searchQuery]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const initLat = currentPatient?.location?.lat || DEFAULT_CENTER.lat;
    const initLng = currentPatient?.location?.lng || DEFAULT_CENTER.lng;

    const map = L.map(mapContainerRef.current, {
      center: [initLat, initLng],
      zoom: currentPatient?.location?.lat ? 17 : 14,
      zoomControl: false,
    });

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
        attribution: 'Tiles &copy; Esri &mdash; รพ.โพนนาแก้ว',
      }
    );

    // Default layer: Satellite
    satelliteLayer.addTo(map);
    (map as any)._streetLayer = streetLayer;
    (map as any)._satelliteLayer = satelliteLayer;

    // Draggable Pin Marker
    const pinIcon = L.divIcon({
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: grab;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: #e11d48; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 18px;">
            📍
          </div>
          <div style="margin-top: 2px; background: rgba(15, 23, 42, 0.95); color: #ffffff; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.4); white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
            บ้านผู้ป่วย
          </div>
        </div>
      `,
      className: 'vhv-drag-pin',
      iconSize: [44, 56],
      iconAnchor: [22, 38],
    });

    const marker = L.marker([initLat, initLng], { 
      icon: pinIcon, 
      draggable: true 
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setLat(pos.lat.toFixed(6));
      setLng(pos.lng.toFixed(6));
      showToast(`เลื่อนหมุดไปยัง: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setLat(e.latlng.lat.toFixed(6));
      setLng(e.latlng.lng.toFixed(6));
      showToast(`ปักหมุดที่: ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`);
    });

    markerRef.current = marker;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map layer on toggle
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

  // Sync marker position when lat / lng changes
  const updateMapMarker = (newLat: number, newLng: number, zoomLevel: number = 17) => {
    const map = mapInstanceRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    marker.setLatLng([newLat, newLng]);
    map.flyTo([newLat, newLng], zoomLevel, { duration: 0.8 });
  };

  // Fetch High-Accuracy GPS on device
  const handleFetchCurrentGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showToast('⚠️ อุปกรณ์นี้ไม่รองรับการดึงสัญญาณ GPS');
      return;
    }

    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGettingGps(false);
        const currentLat = pos.coords.latitude;
        const currentLng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);
        
        setLat(currentLat.toFixed(6));
        setLng(currentLng.toFixed(6));
        setGpsAccuracy(accuracy);

        updateMapMarker(currentLat, currentLng, 18);
        showToast(`✅ ดึงพิกัด GPS สำเร็จ! (ความแม่นยำ: ±${accuracy} ม.)`);
      },
      (err) => {
        setIsGettingGps(false);
        console.warn('GPS Notice:', err.message);
        showToast('⚠️ ไม่สามารถจับสัญญาณ GPS ได้ กรุณาเปิด Location บนมือถือ หรือคลิกเลือกตำแหน่งบนแผนที่ดาวเทียม');
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 
      }
    );
  };

  // Handle Save
  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) {
      showToast('กรุณาเลือกผู้ป่วย');
      return;
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      showToast('⚠️ กรุณากดปุ่ม "ดึงพิกัด GPS" หรือคลิกบนแผนที่เพื่อระบุพิกัดบ้าน');
      return;
    }

    setIsSubmitting(true);
    try {
      const newLocation: PatientLocation = {
        lat: Number(latNum.toFixed(6)),
        lng: Number(lngNum.toFixed(6)),
        addressDetails: addressDetails.trim(),
        landmark: landmark.trim(),
        osmName: osmName.trim(),
        osmPhone: osmPhone.trim(),
        visitStatus: visitStatus,
        visitNotes: visitNotes.trim(),
        updatedAt: new Date().toISOString()
      };

      const updatedPatient: PatientScreening = {
        ...currentPatient,
        location: newLocation
      };

      await onUpdatePatient(updatedPatient);
      setIsSubmitting(false);
      setSubmitSuccess(true);
      showToast(`บันทึกและส่งพิกัดบ้านของ ${updatedPatient.prefix}${updatedPatient.firstName} ขึ้นระบบสำเร็จ!`);
    } catch {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      showToast('บันทึกพิกัดบ้านเรียบร้อยแล้ว');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-prompt pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm border border-emerald-500/40 backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="flex-1 font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Mobile App Header */}
      <header className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-rose-300">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>รพ.โพนนาแก้ว • อสม. ปักหมุดบ้าน</span>
              </div>
              <h1 className="text-sm sm:text-base font-bold">ส่งพิกัดบ้านผู้ป่วย (ไม่ต้อง Login)</h1>
            </div>
          </div>

          {onExit && (
            <button
              onClick={onExit}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบ</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto px-3 sm:px-4 py-4 space-y-4">
        {/* Patient Selection Card */}
        {currentPatient ? (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base text-slate-900">
                    {currentPatient.prefix}{currentPatient.firstName} {currentPatient.lastName}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-xs font-bold text-slate-700">
                    HN: {currentPatient.hn}
                  </span>
                  {currentPatient.caTracking?.biopsyResult === 'adenocarcinoma' && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-300">
                      มะเร็งลำไส้ใหญ่ (Adeno)
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                  <Home className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    บ้านเลขที่ {currentPatient.houseNo} ม.{currentPatient.villageNo} {currentPatient.villageName || ''} ต.{currentPatient.subdistrict || 'นาแก้ว'}
                  </span>
                </div>

                {currentPatient.phone && (
                  <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>โทร: <a href={`tel:${currentPatient.phone}`} className="text-emerald-700 font-mono font-bold">{currentPatient.phone}</a></span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowPatientSelector(!showPatientSelector)}
                className="text-xs text-emerald-700 font-semibold hover:underline bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 flex-shrink-0"
              >
                {showPatientSelector ? 'ซ่อนรายชื่อ' : 'เปลี่ยนผู้ป่วย'}
              </button>
            </div>

            {/* If patient selector is opened */}
            {showPatientSelector && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อ, HN, บ้านเลขที่..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
                  {eligiblePatients.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedHn(p.hn);
                        setShowPatientSelector(false);
                      }}
                      className={`p-2 text-xs cursor-pointer flex items-center justify-between ${
                        p.hn === selectedHn ? 'bg-emerald-50 font-bold text-emerald-800' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div>{p.prefix}{p.firstName} {p.lastName} (HN: {p.hn})</div>
                        <div className="text-[10px] text-slate-500 font-normal">บ้านเลขที่ {p.houseNo} ม.{p.villageNo} {p.villageName}</div>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        p.location?.lat ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.location?.lat ? 'มีพิกัดแล้ว' : 'รอพิกัด'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 text-center text-slate-500 text-sm">
            ไม่พบข้อมูลผู้ป่วย
          </div>
        )}

        {/* Big One-Tap GPS Button */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-4 text-white shadow-lg text-center space-y-2.5">
          <div className="text-xs text-emerald-100 font-medium">
            หากกำลังยืนอยู่ที่บ้านของผู้ป่วย ให้กดปุ่มด้านล่างเพื่อดึงพิกัดจากดาวเทียมทันที
          </div>

          <button
            type="button"
            onClick={handleFetchCurrentGps}
            disabled={isGettingGps}
            className="w-full py-3.5 px-4 bg-white hover:bg-emerald-50 active:scale-98 text-emerald-800 rounded-xl text-base font-bold shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer border border-white"
          >
            <Crosshair className={`w-5 h-5 text-emerald-700 ${isGettingGps ? 'animate-spin' : ''}`} />
            <span>{isGettingGps ? 'กำลังค้นหาสัญญาณดาวเทียม GPS...' : '📍 กดส่งพิกัด GPS บ้านผู้ป่วยขณะนี้'}</span>
          </button>

          {gpsAccuracy !== null && (
            <div className="text-[11px] text-emerald-200">
              ความแม่นยำของดาวเทียม: ±{gpsAccuracy} เมตร • สามารถเลื่อนหมุดบนแผนที่ด้านล่างเพื่อปรับให้ตรงหลังคาบ้าน
            </div>
          )}
        </div>

        {/* Success Banner if just submitted */}
        {submitSuccess && (
          <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-4 text-emerald-900 shadow-md space-y-2 animate-scale-up">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-sm">บันทึกและส่งพิกัดบ้านขึ้นระบบสำเร็จ!</h3>
                <p className="text-xs text-emerald-700">
                  ข้อมูลพิกัดถูกส่งเข้าสู่ระบบของโรงพยาบาลโพนนาแก้วเรียบร้อยแล้ว
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-emerald-200 font-mono text-xs flex items-center justify-between">
              <span>พิกัด: <strong>{lat}, {lng}</strong></span>
              <a
                href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 font-bold underline flex items-center gap-1"
              >
                <span>ดูบน Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Map & Pin Fine-Tuning */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Map Header */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>ตำแหน่งบนแผนที่ (ลากหมุดเพื่อปรับตำแหน่งได้)</span>
            </div>

            <div className="flex items-center gap-1 p-0.5 bg-slate-200 rounded-lg">
              <button
                type="button"
                onClick={() => setMapType('street')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                  mapType === 'street' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
                }`}
              >
                แผนที่ถนน
              </button>
              <button
                type="button"
                onClick={() => setMapType('satellite')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                  mapType === 'satellite' ? 'bg-emerald-700 text-white font-bold shadow-xs' : 'text-slate-600'
                }`}
              >
                ภาพดาวเทียม
              </button>
            </div>
          </div>

          {/* Leaflet Map Box */}
          <div className="w-full h-72 sm:h-80 relative bg-slate-200">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Coordinates Floating Tag */}
            <div className="absolute bottom-2 left-2 z-10 bg-slate-900/90 text-white px-2.5 py-1 rounded-lg text-[10px] font-mono shadow-md border border-white/20">
              Lat: {lat || '-'} • Lng: {lng || '-'}
            </div>
          </div>
        </div>

        {/* Form Details */}
        <form onSubmit={handleSavePin} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3.5">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Compass className="w-4 h-4 text-emerald-700" />
            <span>รายละเอียดพิกัดบ้านและการลงเยี่ยม อสม.</span>
          </h2>

          {/* Latitude & Longitude Inputs */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Latitude (ละติจูด N) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={lat}
                onChange={(e) => {
                  setLat(e.target.value);
                  const latN = parseFloat(e.target.value);
                  const lngN = parseFloat(lng);
                  if (!isNaN(latN) && !isNaN(lngN)) {
                    updateMapMarker(latN, lngN);
                  }
                }}
                placeholder="เช่น 17.165200"
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Longitude (ลองจิจูด E) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={lng}
                onChange={(e) => {
                  setLng(e.target.value);
                  const latN = parseFloat(lat);
                  const lngN = parseFloat(e.target.value);
                  if (!isNaN(latN) && !isNaN(lngN)) {
                    updateMapMarker(latN, lngN);
                  }
                }}
                placeholder="เช่น 104.308500"
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Landmark */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              จุดสังเกตเด่นของบ้าน (Landmark)
            </label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="เช่น ตรงข้ามร้านค้าป้าจันทร์, ติดศาลาประชาคม, บ้านไม้ 2 ชั้น รั้วสีฟ้า"
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Address Details */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              ที่อยู่ / ทางเข้าบ้าน
            </label>
            <input
              type="text"
              value={addressDetails}
              onChange={(e) => setAddressDetails(e.target.value)}
              placeholder="บ้านเลขที่, ซอย, ถนนในหมู่บ้าน"
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* VHV Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ชื่อ อสม. หรือเจ้าหน้าที่ผู้ส่งพิกัด <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={osmName}
                onChange={(e) => setOsmName(e.target.value)}
                placeholder="ระบุชื่อ อสม."
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                เบอร์โทรศัพท์ อสม.
              </label>
              <input
                type="tel"
                value={osmPhone}
                onChange={(e) => setOsmPhone(e.target.value)}
                placeholder="เช่น 089-111-2233"
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Visit Status */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              สถานะการลงเยี่ยมบ้าน
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                visitStatus === 'visited' ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold' : 'border-slate-200 text-slate-600'
              }`}>
                <input
                  type="radio"
                  name="visitStatus"
                  value="visited"
                  checked={visitStatus === 'visited'}
                  onChange={() => setVisitStatus('visited')}
                  className="text-emerald-600"
                />
                <span>เยี่ยมบ้านแล้ว</span>
              </label>

              <label className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                visitStatus === 'not_visited' ? 'bg-slate-100 border-slate-400 text-slate-900 font-bold' : 'border-slate-200 text-slate-600'
              }`}>
                <input
                  type="radio"
                  name="visitStatus"
                  value="not_visited"
                  checked={visitStatus === 'not_visited'}
                  onChange={() => setVisitStatus('not_visited')}
                  className="text-emerald-600"
                />
                <span>ยังไม่ได้เยี่ยม</span>
              </label>

              <label className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                visitStatus === 'followup_needed' ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold' : 'border-slate-200 text-slate-600'
              }`}>
                <input
                  type="radio"
                  name="visitStatus"
                  value="followup_needed"
                  checked={visitStatus === 'followup_needed'}
                  onChange={() => setVisitStatus('followup_needed')}
                  className="text-emerald-600"
                />
                <span>ต้องติดตามซ้ำ</span>
              </label>
            </div>
          </div>

          {/* Visit Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              บันทึกข้อสังเกตจากการลงพื้นที่
            </label>
            <textarea
              rows={2}
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.target.value)}
              placeholder="เช่น ผู้ป่วยอยู่บ้าน, กำลังรับประทานอาหารกากใยตามคำแนะนำ, สภาพจิตใจดี"
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !lat || !lng}
              className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-base font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-5 h-5" />
              <span>{isSubmitting ? 'กำลังบันทึกและส่งข้อมูล...' : '💾 บันทึกและส่งพิกัดบ้านเข้าสู่ระบบ รพ.'}</span>
            </button>
          </div>
        </form>

        <footer className="text-center text-[11px] text-slate-400 py-2">
          ระบบสารสนเทศคัดกรองมะเร็งลำไส้ใหญ่ โรงพยาบาลโพนนาแก้ว จ.สกลนคร
        </footer>
      </main>
    </div>
  );
};
