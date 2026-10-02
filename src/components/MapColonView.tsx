import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  InfoWindow, 
  useMap 
} from '@vis.gl/react-google-maps';
import { GisLeafletMap } from './GisLeafletMap';
import { PatientScreening, PatientLocation } from '../types';
import { VILLAGE_LIST } from '../mockData';
import { 
  MapPin, 
  Search, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  ExternalLink, 
  Filter, 
  Crosshair, 
  X, 
  Edit3, 
  Trash2, 
  Home, 
  User, 
  Key, 
  Layers, 
  Printer, 
  Stethoscope,
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface MapColonViewProps {
  patients: PatientScreening[];
  initialHn?: string;
  onUpdatePatient: (updated: PatientScreening) => Promise<void> | void;
  onNavigateToReferral?: (hn: string) => void;
  onNavigateToTracking?: () => void;
  isWidescreen16x9?: boolean;
}

// Center of Phon Na Kaeo District, Sakon Nakhon Province
const DEFAULT_CENTER = { lat: 17.1685, lng: 104.3120 };
const DEFAULT_ZOOM = 13;

const isValidGoogleMapsKey = (k: string) => Boolean(k && k.trim().startsWith('AIza') && k.trim().length >= 20);

export const MapColonView: React.FC<MapColonViewProps> = ({
  patients,
  initialHn,
  onUpdatePatient,
  onNavigateToReferral,
  onNavigateToTracking,
  isWidescreen16x9 = true
}) => {
  // API Key management: Only use if properly formatted Google Maps Key
  const [apiKey, setApiKey] = useState<string>(() => {
    const saved = localStorage.getItem('pnk_google_maps_api_key');
    if (saved && isValidGoogleMapsKey(saved)) return saved;
    const envKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string;
    if (envKey && isValidGoogleMapsKey(envKey)) return envKey;
    return '';
  });

  const [hasAuthError, setHasAuthError] = useState<boolean>(false);
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>(apiKey);

  const isGoogleMapsActive = Boolean(isValidGoogleMapsKey(apiKey) && !hasAuthError);

  // Catch window.gm_authFailure from Google Maps script
  useEffect(() => {
    (window as any).gm_authFailure = () => {
      setHasAuthError(true);
      showToast('⚠️ Google Maps API Key ไม่ผ่านการตรวจสอบ สลับมาใช้แผนที่ GIS OpenStreetMap อัตโนมัติ');
    };
  }, []);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'positive' | 'negative' | 'pending'>('all');
  const [pinFilter, setPinFilter] = useState<'all' | 'pinned' | 'unpinned'>('all');
  const [visitFilter, setVisitFilter] = useState<'all' | 'visited' | 'not_visited' | 'followup_needed'>('all');

  // Map state
  const [selectedPatient, setSelectedPatient] = useState<PatientScreening | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(DEFAULT_ZOOM);

  // Focus on initialHn if provided
  useEffect(() => {
    if (initialHn) {
      const match = patients.find((p) => p.hn === initialHn);
      if (match) {
        setSelectedPatient(match);
        if (match.location?.lat && match.location?.lng) {
          setMapCenter({ lat: match.location.lat, lng: match.location.lng });
          setMapZoom(16);
        }
      }
    }
  }, [initialHn, patients]);

  // Pinning / Edit Modal state
  const [editingPatient, setEditingPatient] = useState<PatientScreening | null>(null);
  const [pinModePatient, setPinModePatient] = useState<PatientScreening | null>(null);
  const [formLat, setFormLat] = useState<string>('');
  const [formLng, setFormLng] = useState<string>('');
  const [formLandmark, setFormLandmark] = useState<string>('');
  const [formAddress, setFormAddress] = useState<string>('');
  const [formOsmName, setFormOsmName] = useState<string>('');
  const [formOsmPhone, setFormOsmPhone] = useState<string>('');
  const [formVisitStatus, setFormVisitStatus] = useState<'not_visited' | 'visited' | 'followup_needed'>('not_visited');
  const [formVisitNotes, setFormVisitNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGettingGps, setIsGettingGps] = useState<boolean>(false);

  // Sidebar visibility on mobile
  const [showMobileList, setShowMobileList] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${p.prefix}${p.firstName} ${p.lastName}`.toLowerCase();
        const hn = p.hn.toLowerCase();
        const house = p.houseNo.toLowerCase();
        const landmark = (p.location?.landmark || '').toLowerCase();
        const osm = (p.location?.osmName || '').toLowerCase();
        if (
          !fullName.includes(q) &&
          !hn.includes(q) &&
          !house.includes(q) &&
          !landmark.includes(q) &&
          !osm.includes(q)
        ) {
          return false;
        }
      }

      // Village
      if (selectedVillage !== 'all' && p.villageNo !== selectedVillage) {
        return false;
      }

      // FIT Result
      if (resultFilter === 'positive' && p.fitResult !== 'positive') return false;
      if (resultFilter === 'negative' && p.fitResult !== 'negative') return false;
      if (resultFilter === 'pending' && (p.fitResult === 'positive' || p.fitResult === 'negative')) return false;

      // Pin Status
      const hasPin = Boolean(p.location && p.location.lat && p.location.lng);
      if (pinFilter === 'pinned' && !hasPin) return false;
      if (pinFilter === 'unpinned' && hasPin) return false;

      // Visit Status
      if (visitFilter !== 'all') {
        const vStatus = p.location?.visitStatus || 'not_visited';
        if (vStatus !== visitFilter) return false;
      }

      return true;
    });
  }, [patients, searchQuery, selectedVillage, resultFilter, pinFilter, visitFilter]);

  // Pinned patients with valid coordinates
  const pinnedPatients = useMemo(() => {
    return filteredPatients.filter(
      (p) => p.location && typeof p.location.lat === 'number' && typeof p.location.lng === 'number'
    );
  }, [filteredPatients]);

  // Statistics
  const stats = useMemo(() => {
    const total = patients.length;
    const pinned = patients.filter((p) => p.location && p.location.lat && p.location.lng).length;
    const unpinned = total - pinned;
    const positiveTotal = patients.filter((p) => p.fitResult === 'positive').length;
    const positivePinned = patients.filter(
      (p) => p.fitResult === 'positive' && p.location && p.location.lat && p.location.lng
    ).length;
    const visited = patients.filter((p) => p.location?.visitStatus === 'visited').length;
    return { total, pinned, unpinned, positiveTotal, positivePinned, visited };
  }, [patients]);

  // Open Edit Location Modal
  const handleOpenEdit = (patient: PatientScreening) => {
    setEditingPatient(patient);
    setPinModePatient(null);
    if (patient.location) {
      setFormLat(patient.location.lat ? String(patient.location.lat) : '');
      setFormLng(patient.location.lng ? String(patient.location.lng) : '');
      setFormLandmark(patient.location.landmark || '');
      setFormAddress(patient.location.addressDetails || `บ้านเลขที่ ${patient.houseNo} ม.${patient.villageNo} ต.${patient.subdistrict || 'นาแก้ว'}`);
      setFormOsmName(patient.location.osmName || '');
      setFormOsmPhone(patient.location.osmPhone || '');
      setFormVisitStatus(patient.location.visitStatus || 'not_visited');
      setFormVisitNotes(patient.location.visitNotes || '');
    } else {
      setFormLat('');
      setFormLng('');
      setFormLandmark('');
      setFormAddress(`บ้านเลขที่ ${patient.houseNo} ม.${patient.villageNo} ต.${patient.subdistrict || 'นาแก้ว'}`);
      setFormOsmName('');
      setFormOsmPhone('');
      setFormVisitStatus('not_visited');
      setFormVisitNotes('');
    }
  };

  // Close Modal
  const handleCloseModal = () => {
    setEditingPatient(null);
    setPinModePatient(null);
  };

  // Start Pin Mode for a patient
  const handleStartPinMode = (patient: PatientScreening) => {
    setPinModePatient(patient);
    setSelectedPatient(patient);
    showToast(`📍 โหมดปักหมุดเปิดแล้ว: คลิกบนแผนที่เพื่อเลือกตำแหน่งบ้านของ ${patient.prefix}${patient.firstName}`);
    // If patient already has location, center on it
    if (patient.location?.lat && patient.location?.lng) {
      setMapCenter({ lat: patient.location.lat, lng: patient.location.lng });
      setMapZoom(16);
    }
  };

  // Click on Map handler
  const handleMapClick = useCallback((event: any) => {
    if (!event.detail || !event.detail.latLng) return;
    const clickedLat = event.detail.latLng.lat;
    const clickedLng = event.detail.latLng.lng;

    if (pinModePatient) {
      // Set form coordinates and open modal
      setEditingPatient(pinModePatient);
      setFormLat(clickedLat.toFixed(6));
      setFormLng(clickedLng.toFixed(6));
      setFormAddress(
        pinModePatient.location?.addressDetails ||
        `บ้านเลขที่ ${pinModePatient.houseNo} ม.${pinModePatient.villageNo} ต.${pinModePatient.subdistrict || 'นาแก้ว'}`
      );
      setFormLandmark(pinModePatient.location?.landmark || '');
      setFormOsmName(pinModePatient.location?.osmName || '');
      setFormOsmPhone(pinModePatient.location?.osmPhone || '');
      setFormVisitStatus(pinModePatient.location?.visitStatus || 'not_visited');
      setFormVisitNotes(pinModePatient.location?.visitNotes || '');
      setPinModePatient(null);
      showToast('เลือกพิกัดบนแผนที่เรียบร้อย กรุณาตรวจสอบและกดบันทึก');
    }
  }, [pinModePatient]);

  // Click on GIS Leaflet Map handler
  const handleGisMapClick = (clickedLat: number, clickedLng: number) => {
    if (pinModePatient) {
      setEditingPatient(pinModePatient);
      setFormLat(clickedLat.toFixed(6));
      setFormLng(clickedLng.toFixed(6));
      setFormAddress(
        pinModePatient.location?.addressDetails ||
        `บ้านเลขที่ ${pinModePatient.houseNo} ม.${pinModePatient.villageNo} ต.${pinModePatient.subdistrict || 'นาแก้ว'}`
      );
      setFormLandmark(pinModePatient.location?.landmark || '');
      setFormOsmName(pinModePatient.location?.osmName || '');
      setFormOsmPhone(pinModePatient.location?.osmPhone || '');
      setFormVisitStatus(pinModePatient.location?.visitStatus || 'not_visited');
      setFormVisitNotes(pinModePatient.location?.visitNotes || '');
      setPinModePatient(null);
      showToast('เลือกพิกัดบนแผนที่เรียบร้อย กรุณาตรวจสอบและกดบันทึก');
    }
  };

  // GPS Current Location (robust without alert or unhandled console errors)
  const handleGetCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showToast('⚠️ เบราว์เซอร์นี้ไม่รองรับการดึงพิกัด GPS');
      return;
    }
    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGettingGps(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setFormLat(lat.toFixed(6));
        setFormLng(lng.toFixed(6));
        setMapCenter({ lat, lng });
        setMapZoom(16);
        showToast(`✅ ดึงพิกัด GPS ปัจจุบันสำเร็จ (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
      },
      (err) => {
        setIsGettingGps(false);
        const code = err?.code;
        const msg = err?.message || 'ไม่สามารถรับสัญญาณพิกัด GPS ได้';
        console.warn(`Geolocation notice [Code ${code}]: ${msg}`);
        // Fallback to Tambon Na Kaeo default
        setFormLat(DEFAULT_CENTER.lat.toFixed(6));
        setFormLng(DEFAULT_CENTER.lng.toFixed(6));
        setMapCenter(DEFAULT_CENTER);
        setMapZoom(14);
        showToast('📍 การเข้าถึง GPS ถูกจำกัด ระบบตั้งพิกัดศูนย์กลาง อ.โพนนาแก้ว ให้แทน หรือสามารถคลิกบนแผนที่ได้ทันที');
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
    );
  };

  // Pan to patient
  const handlePanToPatient = (p: PatientScreening) => {
    if (p.location?.lat && p.location?.lng) {
      setMapCenter({ lat: p.location.lat, lng: p.location.lng });
      setMapZoom(16);
      setSelectedPatient(p);
      setShowMobileList(false);
    } else {
      handleStartPinMode(p);
    }
  };

  // Save Location to Patient
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;

    const latNum = parseFloat(formLat);
    const lngNum = parseFloat(formLng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      showToast('⚠️ กรุณาระบุพิกัดละติจูดและลองจิจูดให้ถูกต้อง (หรือคลิกเลือกบนแผนที่)');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedLocation: PatientLocation = {
        lat: latNum,
        lng: lngNum,
        landmark: formLandmark.trim(),
        addressDetails: formAddress.trim(),
        osmName: formOsmName.trim(),
        osmPhone: formOsmPhone.trim(),
        visitStatus: formVisitStatus,
        visitNotes: formVisitNotes.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: 'เจ้าหน้าที่สาธารณสุข'
      };

      const updatedPatient: PatientScreening = {
        ...editingPatient,
        location: updatedLocation
      };

      await onUpdatePatient(updatedPatient);
      setSelectedPatient(updatedPatient);
      setEditingPatient(null);
      setMapCenter({ lat: latNum, lng: lngNum });
      setMapZoom(16);
      showToast(`บันทึกพิกัดบ้านของ ${updatedPatient.prefix}${updatedPatient.firstName} เรียบร้อยแล้ว`);
    } catch (err: any) {
      console.error('Save location error:', err);
      showToast('เกิดข้อผิดพลาดในการบันทึกพิกัด');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove Location
  const handleRemoveLocation = async () => {
    if (!editingPatient) return;
    if (
      !window.confirm(
        `คุณต้องการลบพิกัดแผนที่บ้านของ ${editingPatient.prefix}${editingPatient.firstName} ${editingPatient.lastName} ใช่หรือไม่?`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedPatient: PatientScreening = {
        ...editingPatient,
        location: undefined
      };
      await onUpdatePatient(updatedPatient);
      if (selectedPatient?.id === editingPatient.id) {
        setSelectedPatient(null);
      }
      setEditingPatient(null);
      showToast('ลบพิกัดบ้านผู้ป่วยเรียบร้อยแล้ว');
    } catch (err: any) {
      console.error('Delete location error:', err);
      showToast('เกิดข้อผิดพลาดในการลบพิกัด');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save API Key
  const handleSaveApiKey = () => {
    const trimmed = tempApiKey.trim();
    if (!trimmed) {
      handleUseGisMode();
      return;
    }
    if (!trimmed.startsWith('AIza') || trimmed.length < 20) {
      showToast('⚠️ Google Maps API Key ต้องขึ้นต้นด้วย "AIzaSy..." (ประมาณ 39 ตัวอักษร) หากไม่มีสามารถใช้โหมด GIS ได้ทันที');
      return;
    }
    localStorage.setItem('pnk_google_maps_api_key', trimmed);
    setApiKey(trimmed);
    setHasAuthError(false);
    setShowKeyModal(false);
    showToast('บันทึก Google Maps API Key สำเร็จ และเปิดโหมด Google Maps');
  };

  // Clear key and switch to GIS Mode
  const handleUseGisMode = () => {
    localStorage.removeItem('pnk_google_maps_api_key');
    setApiKey('');
    setHasAuthError(false);
    setShowKeyModal(false);
    showToast('สลับมาใช้แผนที่ GIS OpenStreetMap เรียบร้อย (ไม่ต้องใช้ API Key)');
  };

  // Print/Export visit list
  const handlePrintVisitList = () => {
    window.print();
  };

  return (
    <div className={`space-y-4 pb-12 transition-all duration-300 ${
      isWidescreen16x9 ? 'max-w-[1920px] 2xl:max-w-full mx-auto px-2 sm:px-6 2xl:px-8' : 'max-w-7xl mx-auto px-4 sm:px-6'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900/90 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm border border-emerald-500/30 animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-2xl p-4 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 text-emerald-100 text-xs font-medium mb-2 border border-emerald-500/30">
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              <span>GIS Public Health & Home Visit Mapping • ตำบลนาแก้ว อำเภอโพนนาแก้ว</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Map Colon: แผนที่บ้านผู้ป่วยคัดกรองมะเร็งลำไส้ใหญ่</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-2xl leading-relaxed">
              บันทึกพิกัด GPS บ้านผู้ป่วย จุดสังเกตเด่น เชื่อมโยง อสม. ประจำตัว นำทางเยี่ยมบ้าน และติดตามกลุ่มผลบวก (1B0061) ให้ได้รับการส่องกล้องครบ 100%
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                // Find first unpinned patient or open selector
                const unpinned = patients.find(p => !p.location?.lat);
                if (unpinned) {
                  handleOpenEdit(unpinned);
                } else if (patients.length > 0) {
                  handleOpenEdit(patients[0]);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกพิกัดบ้าน</span>
            </button>

            <button
              onClick={handleGetCurrentLocation}
              disabled={isGettingGps}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors border border-white/20"
              title="ดึงตำแหน่ง GPS ของอุปกรณ์ขณะนี้"
            >
              <Crosshair className={`w-4 h-4 ${isGettingGps ? 'animate-spin text-emerald-300' : ''}`} />
              <span className="hidden sm:inline">พิกัดฉัน</span>
            </button>

            <button
              onClick={handlePrintVisitList}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors border border-white/20"
              title="พิมพ์รายงานรายชื่อและพิกัดบ้าน อสม."
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">พิมพ์รายชื่อ</span>
            </button>

            <button
              onClick={() => {
                setTempApiKey(apiKey);
                setShowKeyModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-emerald-100 rounded-xl text-xs sm:text-sm font-medium transition-colors border border-white/20"
              title="ตั้งค่า Google Maps API Key"
            >
              <Key className="w-4 h-4 text-amber-300" />
              <span className="font-mono text-xs hidden md:inline">Key: {apiKey.slice(0, 5)}...</span>
            </button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 mt-4 pt-4 border-t border-emerald-700/50">
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs border border-white/10">
            <div className="text-[11px] text-emerald-200 font-medium">ผู้รับการคัดกรองทั้งหมด</div>
            <div className="text-lg sm:text-xl font-bold text-white mt-0.5">{stats.total} <span className="text-xs font-normal text-emerald-200">คน</span></div>
          </div>

          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs border border-white/10">
            <div className="text-[11px] text-emerald-200 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span>ปักหมุดพิกัดบ้านแล้ว</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-emerald-300 mt-0.5">
              {stats.pinned} <span className="text-xs font-normal text-emerald-200">คน ({stats.total > 0 ? Math.round((stats.pinned / stats.total) * 100) : 0}%)</span>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs border border-white/10">
            <div className="text-[11px] text-emerald-200 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span>ยังไม่ระบุพิกัด</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-amber-200 mt-0.5">
              {stats.unpinned} <span className="text-xs font-normal text-emerald-200">คน</span>
            </div>
          </div>

          <div className="bg-rose-500/20 rounded-xl p-2.5 backdrop-blur-xs border border-rose-400/30">
            <div className="text-[11px] text-rose-200 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400 inline-block animate-pulse" />
              <span>กลุ่มผลบวก (1B0061) มีพิกัด</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-white mt-0.5">
              {stats.positivePinned} / {stats.positiveTotal} <span className="text-xs font-normal text-rose-200">คน</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pin Mode Alert Banner */}
      {pinModePatient && (
        <div className="bg-amber-50 border-2 border-amber-400 text-amber-900 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-md animate-pulse">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <MapPin className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-bold">โหมดปักหมุดแผนที่:</span> กรุณาคลิกบนตำแหน่งบ้านของผู้ป่วย{' '}
              <strong className="text-emerald-800 font-bold underline">
                {pinModePatient.prefix}{pinModePatient.firstName} {pinModePatient.lastName} (HN: {pinModePatient.hn}, ม.{pinModePatient.villageNo} บ้านเลขที่ {pinModePatient.houseNo})
              </strong>{' '}
              บนแผนที่ด้านล่าง หรือกดยกเลิก
            </div>
          </div>
          <button
            onClick={() => setPinModePatient(null)}
            className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg text-xs font-bold transition-colors"
          >
            ยกเลิก
          </button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, HN, บ้านเลขที่, อสม...."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Village Filter */}
          <div>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="all">📍 ทุกหมู่บ้าน (ตำบลนาแก้ว)</option>
              {VILLAGE_LIST.map((v) => (
                <option key={v.id} value={v.no}>
                  หมู่ {v.no} {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* FIT Result Filter */}
          <div>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="all">🔬 ทุกผลตรวจ</option>
              <option value="positive">🔴 ผลบวก (Positive 1B0061)</option>
              <option value="negative">🟢 ผลลบ (Negative 1B0060)</option>
              <option value="pending">⏳ รอตรวจผลแล็บ</option>
            </select>
          </div>

          {/* Pin Status Filter */}
          <div>
            <select
              value={pinFilter}
              onChange={(e) => setPinFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="all">📌 สถานะพิกัด: ทั้งหมด</option>
              <option value="pinned">✅ ปักหมุดแล้ว ({stats.pinned})</option>
              <option value="unpinned">⚪ ยังไม่ปักหมุด ({stats.unpinned})</option>
            </select>
          </div>

          {/* Visit Status Filter */}
          <div>
            <select
              value={visitFilter}
              onChange={(e) => setVisitFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="all">🏠 สถานะเยี่ยมบ้าน: ทั้งหมด</option>
              <option value="visited">✅ ลงเยี่ยมแล้ว</option>
              <option value="not_visited">⏳ ยังไม่ได้ลงเยี่ยม</option>
              <option value="followup_needed">⚠️ ต้องติดตามซ้ำ</option>
            </select>
          </div>
        </div>

        {/* Quick status bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span>
              แสดง <strong className="text-slate-800">{filteredPatients.length}</strong> จาก {patients.length} คน
            </span>
            <span>•</span>
            <span>
              แสดงบนแผนที่ <strong className="text-emerald-700 font-bold">{pinnedPatients.length}</strong> พิกัด
            </span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-white shadow-xs" />
              <span>ผลบวก (1B0061) / CA Colon</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white shadow-xs" />
              <span>ผลลบ (1B0060)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white shadow-xs" />
              <span>รอตรวจ / อื่นๆ</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Map & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Map Container (takes 8 cols on large screens, or 9 on 16:9 widescreen) */}
        <div className={`lg:col-span-8 ${isWidescreen16x9 ? 'xl:col-span-9' : 'xl:col-span-8'} bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col relative`}>
          {/* Map Toolbar */}
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span className="font-semibold text-slate-800">
                {isGoogleMapsActive ? 'Google Maps (ดาวเทียม & ถนน)' : 'GIS OpenStreetMap & Esri Satellite'}
              </span>
              <span className="hidden sm:inline text-slate-400">• คลิกหมุดเพื่อดูข้อมูลบ้านและนำทาง</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                isGoogleMapsActive ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {isGoogleMapsActive ? 'Google Maps Mode' : 'GIS OpenStreetMap Mode'}
              </span>

              <button
                onClick={() => {
                  setMapCenter(DEFAULT_CENTER);
                  setMapZoom(DEFAULT_ZOOM);
                }}
                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 text-[11px] font-medium transition-colors"
                title="รีเซ็ตมุมมองศูนย์กลางอำเภอโพนนาแก้ว"
              >
                ศูนย์กลาง อ.โพนนาแก้ว
              </button>

              <button
                onClick={() => setShowMobileList(!showMobileList)}
                className="lg:hidden px-2.5 py-1 bg-emerald-700 text-white rounded-md text-[11px] font-medium"
              >
                {showMobileList ? 'ดูแผนที่' : `รายชื่อ (${filteredPatients.length})`}
              </button>
            </div>
          </div>

          {/* Interactive Map View */}
          <div className="w-full h-[520px] sm:h-[620px] xl:h-[680px] relative bg-slate-100">
            {isGoogleMapsActive ? (
              <APIProvider 
                apiKey={apiKey}
                libraries={['marker', 'places', 'geometry']}
                language="th"
                region="TH"
              >
                <Map
                  mapId="DEMO_MAP_ID"
                  defaultCenter={DEFAULT_CENTER}
                  center={mapCenter}
                  defaultZoom={DEFAULT_ZOOM}
                  zoom={mapZoom}
                  onCameraChanged={(e) => {
                    setMapCenter(e.detail.center);
                    setMapZoom(e.detail.zoom);
                  }}
                  onClick={handleMapClick}
                  gestureHandling="greedy"
                  fullscreenControl={true}
                  mapTypeControl={true}
                  streetViewControl={true}
                  internalUsageAttributionIds={['gmp_git_agentskills_v1']}
                  className="w-full h-full"
                >
                  {/* Advanced Markers for each pinned patient */}
                  {pinnedPatients.map((p) => {
                    if (!p.location?.lat || !p.location?.lng) return null;
                    const isPositive = p.fitResult === 'positive';
                    const isNegative = p.fitResult === 'negative';
                    const isSelected = selectedPatient?.id === p.id;

                    return (
                      <AdvancedMarker
                        key={p.id}
                        position={{ lat: p.location.lat, lng: p.location.lng }}
                        onClick={() => setSelectedPatient(p)}
                        title={`${p.prefix}${p.firstName} ${p.lastName} (${p.hn})`}
                        zIndex={isSelected ? 100 : isPositive ? 50 : 10}
                      >
                        {/* Custom Marker Pin DOM */}
                        <div 
                          className={`relative flex items-center justify-center cursor-pointer transition-all duration-200 transform ${
                            isSelected ? 'scale-125 z-50' : 'hover:scale-115'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white ring-2 ${
                              isPositive
                                ? 'bg-rose-600 ring-rose-300'
                                : isNegative
                                ? 'bg-emerald-600 ring-emerald-300'
                                : 'bg-amber-500 ring-amber-300'
                            }`}
                          >
                            {isPositive ? (
                              <AlertTriangle className="w-4 h-4 text-white" />
                            ) : isNegative ? (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            ) : (
                              <MapPin className="w-4 h-4 text-white" />
                            )}
                          </div>

                          {/* House/Village Label Badge */}
                          <div className="absolute -bottom-4 bg-slate-900/90 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md shadow-xs whitespace-nowrap border border-white/20">
                            {p.houseNo} ม.{p.villageNo}
                          </div>
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                  {/* InfoWindow for Selected Patient */}
                  {selectedPatient && selectedPatient.location?.lat && selectedPatient.location?.lng && (
                    <InfoWindow
                      position={{
                        lat: selectedPatient.location.lat,
                        lng: selectedPatient.location.lng
                      }}
                      onCloseClick={() => setSelectedPatient(null)}
                      maxWidth={340}
                    >
                      <div className="p-1 text-slate-800">
                        {/* Header with Result Badge */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                          <div>
                            <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                              <Home className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{selectedPatient.prefix}{selectedPatient.firstName} {selectedPatient.lastName}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              HN: {selectedPatient.hn} • อายุ {selectedPatient.ageYears} ปี ({selectedPatient.gender})
                            </div>
                          </div>

                          {selectedPatient.fitResult === 'positive' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap">
                              🔴 ผลบวก (1B0061)
                            </span>
                          ) : selectedPatient.fitResult === 'negative' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                              🟢 ผลลบ (1B0060)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                              รอตรวจผล
                            </span>
                          )}
                        </div>

                        {/* Address & Landmark */}
                        <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong className="text-slate-700">ที่อยู่:</strong> บ้านเลขที่ {selectedPatient.houseNo} หมู่ {selectedPatient.villageNo} {selectedPatient.villageName || ''} ต.{selectedPatient.subdistrict || 'นาแก้ว'}
                            </div>
                          </div>

                          {selectedPatient.location.landmark && (
                            <div className="flex items-start gap-1.5 bg-amber-50/80 p-1.5 rounded-lg border border-amber-200/60 text-amber-900 text-[11px]">
                              <Info className="w-3.5 h-3.5 text-amber-600 mt-0.2 flex-shrink-0" />
                              <div>
                                <strong>จุดสังเกตเด่น:</strong> {selectedPatient.location.landmark}
                              </div>
                            </div>
                          )}

                          {selectedPatient.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span>โทรผู้ป่วย: <a href={`tel:${selectedPatient.phone}`} className="text-emerald-700 font-mono font-bold hover:underline">{selectedPatient.phone}</a></span>
                            </div>
                          )}

                          {/* Assigned VHV / อสม. */}
                          {selectedPatient.location.osmName && (
                            <div className="bg-emerald-50/80 p-1.5 rounded-lg border border-emerald-200/60 text-[11px] text-emerald-900">
                              <div><strong>อสม. ผู้รับผิดชอบ:</strong> {selectedPatient.location.osmName}</div>
                              {selectedPatient.location.osmPhone && (
                                <div className="mt-0.5">
                                  โทร อสม.: <a href={`tel:${selectedPatient.location.osmPhone}`} className="font-mono font-bold text-emerald-700 hover:underline">{selectedPatient.location.osmPhone}</a>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Visit Status Badge */}
                          <div className="flex items-center justify-between text-[11px] pt-1">
                            <span className="text-slate-500">สถานะเยี่ยมบ้าน:</span>
                            {selectedPatient.location.visitStatus === 'visited' ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
                                ✅ เยี่ยมบ้านแล้ว
                              </span>
                            ) : selectedPatient.location.visitStatus === 'followup_needed' ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold">
                                ⚠️ ต้องติดตามซ้ำ
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                                ⏳ ยังไม่ได้ลงเยี่ยม
                              </span>
                            )}
                          </div>

                          {selectedPatient.location.visitNotes && (
                            <div className="text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded italic">
                              "{selectedPatient.location.visitNotes}"
                            </div>
                          )}
                        </div>

                        {/* Action Buttons in InfoWindow */}
                        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPatient.location.lat},${selectedPatient.location.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>นำทาง GPS</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(selectedPatient)}
                            className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>แก้ไขพิกัด</span>
                          </button>
                        </div>

                        {/* Positive quick referral jump */}
                        {selectedPatient.fitResult === 'positive' && onNavigateToTracking && (
                          <button
                            type="button"
                            onClick={() => onNavigateToTracking()}
                            className="w-full mt-1.5 py-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold rounded-lg border border-rose-200 flex items-center justify-center gap-1 transition-colors"
                          >
                            <Stethoscope className="w-3 h-3 text-rose-600" />
                            <span>เปิดดูประวัติติดตาม CA Colon (ส่องกล้อง)</span>
                          </button>
                        )}
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>
            ) : (
              <GisLeafletMap
                center={mapCenter}
                zoom={mapZoom}
                patients={filteredPatients}
                selectedPatient={selectedPatient}
                onSelectPatient={(p) => {
                  setSelectedPatient(p);
                  if (p.location?.lat && p.location?.lng) {
                    setMapCenter({ lat: p.location.lat, lng: p.location.lng });
                  }
                }}
                onMapClick={handleGisMapClick}
                onOpenEdit={handleOpenEdit}
                pinModePatient={pinModePatient}
              />
            )}

            {/* Quick Helper Floating Button in Map */}
            <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-[11px] text-slate-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>พิกัดศูนย์กลาง: 17.1685° N, 104.3120° E (โพนนาแก้ว)</span>
            </div>
          </div>
        </div>

        {/* Patients Sidebar / List (takes 4 cols on large, 3 cols on 16:9 widescreen) */}
        <div className={`lg:col-span-4 ${isWidescreen16x9 ? 'xl:col-span-3' : 'xl:col-span-4'} ${
          showMobileList ? 'block' : 'hidden lg:block'
        } bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[520px] sm:h-[620px] xl:h-[680px]`}>
          {/* Sidebar Header */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-700" />
                <span>รายชื่อผู้ป่วยคัดกรอง</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {filteredPatients.length} คน
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              คลิกเพื่อบินไปที่บ้าน หรือกดปักหมุดพิกัดเพื่อบันทึกบ้านใหม่
            </p>
          </div>

          {/* Patients Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2 divide-y divide-slate-100">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <MapPin className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <span>ไม่พบข้อมูลผู้ป่วยตามเงื่อนไขที่เลือก</span>
              </div>
            ) : (
              filteredPatients.map((p) => {
                const hasPin = Boolean(p.location?.lat && p.location?.lng);
                const isPositive = p.fitResult === 'positive';
                const isSelected = selectedPatient?.id === p.id;

                return (
                  <div
                    key={p.id}
                    className={`pt-2 rounded-xl p-2.5 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-100'
                    }`}
                    onClick={() => handlePanToPatient(p)}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            isPositive ? 'bg-rose-500' : p.fitResult === 'negative' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`} />
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {p.prefix}{p.firstName} {p.lastName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {p.hn}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1.5">
                          <Home className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate">
                            บ้านเลขที่ {p.houseNo} ม.{p.villageNo} {p.villageName || ''}
                          </span>
                        </div>

                        {p.location?.landmark && (
                          <div className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1 truncate">
                            📍 {p.location.landmark}
                          </div>
                        )}

                        {p.location?.osmName && (
                          <div className="text-[10px] text-emerald-700 mt-0.5">
                            อสม: {p.location.osmName}
                          </div>
                        )}
                      </div>

                      {/* Right Pin Status or Action */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {hasPin ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(p);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="แก้ไขพิกัด"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartPinMode(p);
                            }}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold shadow-2xs flex items-center gap-1 transition-colors"
                            title="ปักหมุดบ้านผู้ป่วย"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>ปักหมุด</span>
                          </button>
                        )}

                        {isPositive && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700">
                            1B0061
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-2.5 border-t border-slate-200 bg-slate-50/50 rounded-b-2xl text-center">
            <span className="text-[11px] text-slate-500">
              ปักหมุดแล้ว {stats.pinned} / {stats.total} คน ({stats.total > 0 ? Math.round((stats.pinned / stats.total) * 100) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* Save / Edit Patient Location Modal */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scale-up">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    {editingPatient.location?.lat ? 'แก้ไขพิกัดบ้านผู้ป่วย' : 'บันทึกพิกัดบ้านผู้ป่วยใหม่'}
                  </h3>
                  <p className="text-[11px] text-emerald-100">
                    {editingPatient.prefix}{editingPatient.firstName} {editingPatient.lastName} (HN: {editingPatient.hn})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveLocation} className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Patient Basic Info Card */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-500">เลขบัตร ปชช.:</span> {editingPatient.idCard}
                </div>
                <div>
                  <span className="text-slate-500">อายุ/เพศ:</span> {editingPatient.ageYears} ปี ({editingPatient.gender})
                </div>
                <div>
                  <span className="text-slate-500">ที่อยู่ตามทะเบียน:</span> บ้านเลขที่ {editingPatient.houseNo} ม.{editingPatient.villageNo} {editingPatient.villageName || ''}
                </div>
                <div>
                  <span className="text-slate-500">ผลตรวจ FIT:</span>{' '}
                  <span className={`font-bold ${editingPatient.fitResult === 'positive' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {editingPatient.fitResult === 'positive' ? 'ผลบวก (1B0061)' : 'ผลลบ (1B0060)'}
                  </span>
                </div>
              </div>

              {/* Coordinates Inputs */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Crosshair className="w-3.5 h-3.5 text-emerald-700" />
                    <span>พิกัด GPS (ละติจูด & ลองจิจูด) <span className="text-rose-500">*</span></span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingGps}
                    className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <Crosshair className={`w-3 h-3 ${isGettingGps ? 'animate-spin' : ''}`} />
                    <span>ดึงจาก GPS มือถือขณะนี้</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500">Latitude (ละติจูด N)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formLat}
                      onChange={(e) => setFormLat(e.target.value)}
                      placeholder="เช่น 17.165200"
                      className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Longitude (ลองจิจูด E)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formLng}
                      onChange={(e) => setFormLng(e.target.value)}
                      placeholder="เช่น 104.308500"
                      className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 mt-1">
                  💡 เคล็ดลับ: สามารถปิดหน้าต่างนี้แล้วคลิกบนแผนที่โดยตรง พิกัดจะถูกดึงเข้าฟอร์มอัตโนมัติ
                </p>
              </div>

              {/* Landmark / จุดสังเกตเด่น */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  จุดสังเกตเด่นของบ้าน (Landmark / จุดนัดพบ)
                </label>
                <input
                  type="text"
                  value={formLandmark}
                  onChange={(e) => setFormLandmark(e.target.value)}
                  placeholder="เช่น ตรงข้ามวัดศิริมงคล, ติดร้านค้าป้าจันทร์, บ้านไม้ 2 ชั้น รั้วสีฟ้า"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Address details */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  รายละเอียดที่อยู่จริง / ทางเข้าบ้าน
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="บ้านเลขที่, ซอย, ถนนในหมู่บ้าน"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Assigned VHV (อสม. ผู้รับผิดชอบ) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ชื่อ อสม. ผู้ดูแล
                  </label>
                  <input
                    type="text"
                    value={formOsmName}
                    onChange={(e) => setFormOsmName(e.target.value)}
                    placeholder="เช่น นางมาลี บำรุงจิต"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    เบอร์โทรศัพท์ อสม.
                  </label>
                  <input
                    type="tel"
                    value={formOsmPhone}
                    onChange={(e) => setFormOsmPhone(e.target.value)}
                    placeholder="เช่น 089-111-2233"
                    className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Home Visit Status */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  สถานะการลงเยี่ยมบ้าน
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                    formVisitStatus === 'not_visited' ? 'bg-slate-100 border-slate-400 text-slate-900 font-bold' : 'border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="visitStatus"
                      value="not_visited"
                      checked={formVisitStatus === 'not_visited'}
                      onChange={() => setFormVisitStatus('not_visited')}
                      className="text-emerald-600"
                    />
                    <span>ยังไม่ได้เยี่ยม</span>
                  </label>

                  <label className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                    formVisitStatus === 'visited' ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold' : 'border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="visitStatus"
                      value="visited"
                      checked={formVisitStatus === 'visited'}
                      onChange={() => setFormVisitStatus('visited')}
                      className="text-emerald-600"
                    />
                    <span>เยี่ยมบ้านแล้ว</span>
                  </label>

                  <label className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                    formVisitStatus === 'followup_needed' ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold' : 'border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="visitStatus"
                      value="followup_needed"
                      checked={formVisitStatus === 'followup_needed'}
                      onChange={() => setFormVisitStatus('followup_needed')}
                      className="text-emerald-600"
                    />
                    <span>ต้องติดตามซ้ำ</span>
                  </label>
                </div>
              </div>

              {/* Visit Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  บันทึกการลงเยี่ยมบ้าน / ข้อสังเกตเพิ่มเติม
                </label>
                <textarea
                  rows={2}
                  value={formVisitNotes}
                  onChange={(e) => setFormVisitNotes(e.target.value)}
                  placeholder="เช่น ผู้ป่วยอยู่บ้านช่วงเย็น, ให้คำแนะนำงดอาหารกากใยก่อนตรวจ, อสม. ช่วยดูแลการทานยาระบาย"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                {editingPatient.location?.lat ? (
                  <button
                    type="button"
                    onClick={handleRemoveLocation}
                    disabled={isSubmitting}
                    className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>ลบพิกัด</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกพิกัดบ้าน'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Maps API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base">ตั้งค่า Google Maps API Key</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5">
              <p className="text-xs text-slate-600 leading-relaxed">
                ระบบรองรับ 2 รูปแบบ: <strong className="text-emerald-800">GIS OpenStreetMap & Satellite</strong> (ใช้งานฟรี ไม่ต้องใช้ Key) หรือ <strong className="text-blue-800">Google Maps Platform</strong> (ต้องระบุ API Key)
              </p>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Google Maps API Key (ขึ้นต้นด้วย AIzaSy...):
                </label>
                <input
                  type="text"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="เช่น AIzaSyAbCdEf..."
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  * Google Maps API Key ที่ถูกต้องจะมีความยาวประมาณ 39 ตัวอักษร
                </p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-700">
                <div className="flex items-center justify-between">
                  <span>สถานะปัจจุบัน:</span>
                  <span className={`font-bold ${isGoogleMapsActive ? 'text-blue-700' : 'text-emerald-700'}`}>
                    {isGoogleMapsActive ? 'ใช้งาน Google Maps' : 'ใช้งาน GIS OpenStreetMap'}
                  </span>
                </div>
                {apiKey && !apiKey.startsWith('AIza') && (
                  <div className="mt-1 text-rose-600 text-[10px]">
                    ⚠️ รหัส "{apiKey}" ไม่ใช่รูปแบบ Google Maps Key ที่ถูกต้อง (ต้องขึ้นต้นด้วย AIza...)
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleUseGisMode}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors"
                >
                  ใช้โหมด GIS (ไม่ใช้ Key)
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
                  >
                    ปิด
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    บันทึก Google Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
