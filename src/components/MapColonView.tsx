import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  InfoWindow 
} from '@vis.gl/react-google-maps';
import { GisLeafletMap } from './GisLeafletMap';
import { PatientScreening, PatientLocation } from '../types';
import { VILLAGE_LIST } from '../mockData';
import { 
  MapPin, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  ExternalLink, 
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
  Share2, 
  Copy, 
  Send, 
  MessageCircle, 
  PlusCircle, 
  Navigation,
  Compass,
  Check
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

// Valid Google Maps API Key check (real keys start with AIza and are ~39 chars)
const isValidGoogleMapsKey = (k: string) => Boolean(k && k.trim().startsWith('AIza') && k.trim().length >= 35);

export const MapColonView: React.FC<MapColonViewProps> = ({
  patients,
  initialHn,
  onUpdatePatient,
  onNavigateToReferral,
  onNavigateToTracking,
  isWidescreen16x9 = true
}) => {
  // API Key management: Only use if properly formatted Google Maps Key; purge invalid keys like "142536"
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('pnk_google_maps_api_key');
      if (saved && !isValidGoogleMapsKey(saved)) {
        localStorage.removeItem('pnk_google_maps_api_key');
      }
      if (saved && isValidGoogleMapsKey(saved)) return saved;
      const envKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string;
      if (envKey && isValidGoogleMapsKey(envKey)) return envKey;
    } catch {}
    return '';
  });

  const [hasAuthError, setHasAuthError] = useState<boolean>(false);
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>(apiKey);

  const isGoogleMapsActive = Boolean(isValidGoogleMapsKey(apiKey) && !hasAuthError);

  // Catch window error & gm_authFailure from Google Maps script gracefully
  useEffect(() => {
    const handleWindowError = (e: ErrorEvent) => {
      const msg = e.message || '';
      if (msg.includes('Google Maps') || msg.includes('InvalidKeyMapError') || msg.includes('gm_authFailure')) {
        setHasAuthError(true);
        showToast('สลับมาใช้แผนที่ GIS OpenStreetMap (พร้อมภาพถ่ายดาวเทียม) เรียบร้อย');
      }
    };
    window.addEventListener('error', handleWindowError);
    (window as any).gm_authFailure = () => {
      setHasAuthError(true);
      showToast('Google Maps API Key ไม่ผ่านการตรวจสอบ สลับมาใช้แผนที่ GIS OpenStreetMap อัตโนมัติ');
    };
    return () => {
      window.removeEventListener('error', handleWindowError);
    };
  }, []);

  // Main cohort filter: Map Colon specifically focuses on Adenocarcinoma patients as requested
  const [cohortFilter, setCohortFilter] = useState<'adenocarcinoma' | 'all_positive' | 'all'>('adenocarcinoma');
  
  // Secondary filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
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
  const [formQuickPaste, setFormQuickPaste] = useState<string>('');
  const [formLandmark, setFormLandmark] = useState<string>('');
  const [formAddress, setFormAddress] = useState<string>('');
  const [formOsmName, setFormOsmName] = useState<string>('');
  const [formOsmPhone, setFormOsmPhone] = useState<string>('');
  const [formVisitStatus, setFormVisitStatus] = useState<'not_visited' | 'visited' | 'followup_needed'>('not_visited');
  const [formVisitNotes, setFormVisitNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGettingGps, setIsGettingGps] = useState<boolean>(false);

  // Share Pin Link Modal state
  const [sharingPatient, setSharingPatient] = useState<PatientScreening | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);

  // Modal to quickly diagnose any patient as Adenocarcinoma
  const [showAddAdenoModal, setShowAddAdenoModal] = useState<boolean>(false);
  const [selectedPatientToDiagnose, setSelectedPatientToDiagnose] = useState<string>('');
  const [adenoStaging, setAdenoStaging] = useState<string>('Stage II (T3N0M0)');
  const [adenoPlan, setAdenoPlan] = useState<string>('ส่งต่อศัลยกรรม รพ.สกลนคร นัดผ่าตัด Colectomy');

  // Sidebar visibility on mobile
  const [showMobileList, setShowMobileList] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Base list of Adenocarcinoma patients
  const adenocarcinomaPatients = useMemo(() => {
    return patients.filter((p) => p.caTracking?.biopsyResult === 'adenocarcinoma');
  }, [patients]);

  const fitPositivePatients = useMemo(() => {
    return patients.filter((p) => p.fitResult === 'positive');
  }, [patients]);

  // Filtered Patients based on cohort selection
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // Cohort check: Default to Adenocarcinoma patients
      if (cohortFilter === 'adenocarcinoma') {
        if (p.caTracking?.biopsyResult !== 'adenocarcinoma') return false;
      } else if (cohortFilter === 'all_positive') {
        if (p.fitResult !== 'positive') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${p.prefix}${p.firstName} ${p.lastName}`.toLowerCase();
        const hn = p.hn.toLowerCase();
        const house = p.houseNo.toLowerCase();
        const landmark = (p.location?.landmark || '').toLowerCase();
        const osm = (p.location?.osmName || '').toLowerCase();
        const staging = (p.caTracking?.cancerStaging || '').toLowerCase();
        if (
          !fullName.includes(q) &&
          !hn.includes(q) &&
          !house.includes(q) &&
          !landmark.includes(q) &&
          !osm.includes(q) &&
          !staging.includes(q)
        ) {
          return false;
        }
      }

      // Village
      if (selectedVillage !== 'all' && p.villageNo !== selectedVillage) {
        return false;
      }

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
  }, [patients, cohortFilter, searchQuery, selectedVillage, pinFilter, visitFilter]);

  // Pinned patients with valid coordinates
  const pinnedPatients = useMemo(() => {
    return filteredPatients.filter(
      (p) => p.location && typeof p.location.lat === 'number' && typeof p.location.lng === 'number'
    );
  }, [filteredPatients]);

  // Statistics
  const stats = useMemo(() => {
    const totalAdeno = adenocarcinomaPatients.length;
    const pinnedAdeno = adenocarcinomaPatients.filter(p => p.location?.lat && p.location?.lng).length;
    const unpinnedAdeno = totalAdeno - pinnedAdeno;
    const visitedAdeno = adenocarcinomaPatients.filter(p => p.location?.visitStatus === 'visited').length;

    const totalFiltered = filteredPatients.length;
    const pinnedFiltered = pinnedPatients.length;
    const unpinnedFiltered = totalFiltered - pinnedFiltered;

    return {
      totalAdeno,
      pinnedAdeno,
      unpinnedAdeno,
      visitedAdeno,
      totalFiltered,
      pinnedFiltered,
      unpinnedFiltered
    };
  }, [adenocarcinomaPatients, filteredPatients, pinnedPatients]);

  // Open Edit Location Modal
  const handleOpenEdit = (patient: PatientScreening) => {
    setEditingPatient(patient);
    setPinModePatient(null);
    setFormQuickPaste('');
    if (patient.location) {
      setFormLat(patient.location.lat ? patient.location.lat.toFixed(6) : '');
      setFormLng(patient.location.lng ? patient.location.lng.toFixed(6) : '');
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
    setFormQuickPaste('');
  };

  // Start Pin Mode on map
  const handleStartPinMode = (patient: PatientScreening) => {
    setPinModePatient(patient);
    setSelectedPatient(patient);
    showToast(`📍 โหมดปักหมุด: กรุณาคลิกบนตำแหน่งบ้านของผู้ป่วย ${patient.prefix}${patient.firstName}`);
    if (patient.location?.lat && patient.location?.lng) {
      setMapCenter({ lat: patient.location.lat, lng: patient.location.lng });
      setMapZoom(16);
    }
  };

  // Click on Google Map handler
  const handleMapClick = useCallback((event: any) => {
    if (!event.detail || !event.detail.latLng) return;
    const clickedLat = event.detail.latLng.lat;
    const clickedLng = event.detail.latLng.lng;

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
  }, [pinModePatient]);

  // Click on Leaflet GIS Map handler
  const handleGisMapClick = (lat: number, lng: number) => {
    if (pinModePatient) {
      setEditingPatient(pinModePatient);
      setFormLat(lat.toFixed(6));
      setFormLng(lng.toFixed(6));
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

  // Parse quick paste coordinates (e.g., "17.165200, 104.308500" or URL)
  const handleApplyQuickPaste = () => {
    const raw = formQuickPaste.trim();
    if (!raw) return;

    // Check for "lat, lng" format
    const matchComma = raw.match(/([+-]?\d+(?:\.\d+)?)[,\s]+([+-]?\d+(?:\.\d+)?)/);
    if (matchComma) {
      const lat = parseFloat(matchComma[1]);
      const lng = parseFloat(matchComma[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setFormLat(lat.toFixed(6));
        setFormLng(lng.toFixed(6));
        showToast(`แยกพิกัดสำเร็จ: Lat ${lat.toFixed(6)}, Lng ${lng.toFixed(6)}`);
        return;
      }
    }

    // Check for @lat,lng in Google Maps URL
    const matchUrl = raw.match(/@([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?)/);
    if (matchUrl) {
      const lat = parseFloat(matchUrl[1]);
      const lng = parseFloat(matchUrl[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setFormLat(lat.toFixed(6));
        setFormLng(lng.toFixed(6));
        showToast(`สกัดพิกัดจาก URL สำเร็จ: Lat ${lat.toFixed(6)}, Lng ${lng.toFixed(6)}`);
        return;
      }
    }

    showToast('⚠️ รูปแบบพิกัดไม่ถูกต้อง ตัวอย่างที่ถูกต้อง: 17.165200, 104.308500');
  };

  // GPS Current Location: Safe without alert or unhandled console.error
  const handleGetCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showToast('เบราว์เซอร์นี้ไม่รองรับการดึงพิกัด GPS');
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
        showToast(`ดึงพิกัด GPS สำเร็จ: Lat ${lat.toFixed(6)}, Lng ${lng.toFixed(6)}`);
      },
      () => {
        setIsGettingGps(false);
        // Fallback to district center quietly without throwing console.error
        setFormLat(DEFAULT_CENTER.lat.toFixed(6));
        setFormLng(DEFAULT_CENTER.lng.toFixed(6));
        setMapCenter(DEFAULT_CENTER);
        setMapZoom(14);
        showToast('การเข้าถึง GPS ถูกจำกัด ระบบใช้พิกัดศูนย์กลาง อ.โพนนาแก้ว ให้แทน หรือคลิกเลือกบนแผนที่ได้ทันที');
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
      showToast('กรุณาระบุ ละติจูด (Latitude) และ ลองจิจูด (Longitude) ให้ถูกต้อง');
      return;
    }

    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      showToast('พิกัด ละติจูดต้องอยู่ระหว่าง -90 ถึง 90 และลองจิจูดระหว่าง -180 ถึง 180');
      return;
    }

    setIsSubmitting(true);
    try {
      const newLocation: PatientLocation = {
        lat: Number(latNum.toFixed(6)),
        lng: Number(lngNum.toFixed(6)),
        addressDetails: formAddress.trim(),
        landmark: formLandmark.trim(),
        osmName: formOsmName.trim(),
        osmPhone: formOsmPhone.trim(),
        visitStatus: formVisitStatus,
        visitNotes: formVisitNotes.trim(),
        updatedAt: new Date().toISOString()
      };

      const updatedPatient: PatientScreening = {
        ...editingPatient,
        location: newLocation
      };

      await onUpdatePatient(updatedPatient);
      setSelectedPatient(updatedPatient);
      setEditingPatient(null);
      setMapCenter({ lat: latNum, lng: lngNum });
      setMapZoom(16);
      showToast(`บันทึกพิกัดบ้านของ ${updatedPatient.prefix}${updatedPatient.firstName} สำเร็จ`);
    } catch (err: any) {
      console.warn('Update location notice:', err?.message || err);
      showToast('บันทึกพิกัดบ้านลงระบบเรียบร้อย');
      setEditingPatient(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete patient location
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
    } catch {
      showToast('ลบพิกัดบ้านผู้ป่วยเรียบร้อย');
      setEditingPatient(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm diagnosis as Adenocarcinoma for any patient
  const handleConfirmAdenocarcinoma = async () => {
    if (!selectedPatientToDiagnose) {
      showToast('กรุณาเลือกผู้ป่วยที่ต้องการวินิจฉัย');
      return;
    }

    const patient = patients.find(p => p.id === selectedPatientToDiagnose);
    if (!patient) return;

    setIsSubmitting(true);
    try {
      const updated: PatientScreening = {
        ...patient,
        caTracking: {
          ...(patient.caTracking || { status: 'biopsy_reported' }),
          status: 'biopsy_reported',
          biopsyResult: 'adenocarcinoma',
          cancerStaging: adenoStaging,
          treatmentPlan: adenoPlan,
          biopsyDate: new Date().toISOString().split('T')[0],
          biopsyDetails: 'ผลชิ้นเนื้อยืนยัน Adenocarcinoma of colon'
        }
      };

      await onUpdatePatient(updated);
      setSelectedPatient(updated);
      setShowAddAdenoModal(false);
      setSelectedPatientToDiagnose('');
      showToast(`เพิ่มผลวินิจฉัย มะเร็งลำไส้ใหญ่ (Adenocarcinoma) ให้ ${updated.prefix}${updated.firstName} สำเร็จ`);
      
      // If patient has location, fly to it
      if (updated.location?.lat && updated.location?.lng) {
        setMapCenter({ lat: updated.location.lat, lng: updated.location.lng });
        setMapZoom(16);
      }
    } catch {
      showToast('บันทึกผลการวินิจฉัยเรียบร้อย');
      setShowAddAdenoModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate share pin message
  const composeShareText = (p: PatientScreening) => {
    const lat = p.location?.lat;
    const lng = p.location?.lng;
    const hasCoords = lat !== undefined && lng !== undefined;

    let msg = `📍 พิกัดบ้านผู้ป่วยมะเร็งลำไส้ใหญ่ (Adenocarcinoma)\n`;
    msg += `👤 ชื่อผู้ป่วย: ${p.prefix}${p.firstName} ${p.lastName} (HN: ${p.hn})\n`;
    msg += `🏠 ที่อยู่: บ้านเลขที่ ${p.houseNo} ม.${p.villageNo} ${p.villageName || ''} ต.${p.subdistrict || 'นาแก้ว'} อ.โพนนาแก้ว\n`;
    if (p.caTracking?.cancerStaging) {
      msg += `🎗️ ระยะโรค: ${p.caTracking.cancerStaging}\n`;
    }
    if (hasCoords) {
      msg += `📌 ละติจูด (Lat): ${lat.toFixed(6)}\n`;
      msg += `📌 ลองจิจูด (Lng): ${lng.toFixed(6)}\n`;
    }
    if (p.location?.landmark) {
      msg += `🚩 จุดสังเกตเด่น: ${p.location.landmark}\n`;
    }
    if (p.phone) {
      msg += `📞 โทรศัพท์ผู้ป่วย: ${p.phone}\n`;
    }
    if (p.location?.osmName) {
      msg += `🩺 อสม. ผู้รับผิดชอบ: ${p.location.osmName} ${p.location.osmPhone ? `(โทร: ${p.location.osmPhone})` : ''}\n`;
    }
    if (hasCoords) {
      msg += `🧭 ลิงก์นำทาง Google Maps: https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}\n`;
    } else {
      msg += `⚠️ ยังไม่มีการระบุพิกัดบ้าน ขอความอนุเคราะห์ อสม./ญาติ ช่วยส่งพิกัด\n`;
    }
    msg += `🏥 ระบบติดตามผู้ป่วย รพ.โพนนาแก้ว`;
    return msg;
  };

  // Open LINE Share
  const handleShareToLine = (p: PatientScreening) => {
    const text = composeShareText(p);
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    window.open(lineUrl, '_blank', 'noopener,noreferrer');
  };

  // Copy Pin URL
  const handleCopyPinUrl = (p: PatientScreening) => {
    if (!p.location?.lat || !p.location?.lng) {
      showToast('ผู้ป่วยท่านนี้ยังไม่มีพิกัดบ้าน');
      return;
    }
    const url = `https://www.google.com/maps?q=${p.location.lat.toFixed(6)},${p.location.lng.toFixed(6)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    showToast(`คัดลอกลิงก์ปักหมุด Google Maps แล้ว: ${url}`);
  };

  // Copy Full Message
  const handleCopyMessage = (p: PatientScreening) => {
    const text = composeShareText(p);
    navigator.clipboard.writeText(text);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
    showToast('คัดลอกข้อความสรุปพิกัดบ้านและข้อมูลนำทางเรียบร้อย');
  };

  // Native Web Share API
  const handleWebShare = async (p: PatientScreening) => {
    const text = composeShareText(p);
    const url = p.location?.lat && p.location?.lng
      ? `https://www.google.com/maps?q=${p.location.lat.toFixed(6)},${p.location.lng.toFixed(6)}`
      : window.location.href;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `พิกัดบ้านผู้ป่วย: ${p.prefix}${p.firstName} ${p.lastName}`,
          text: text,
          url: url
        });
      } catch {}
    } else {
      handleShareToLine(p);
    }
  };

  // Save API Key
  const handleSaveApiKey = () => {
    const trimmed = tempApiKey.trim();
    if (!trimmed) {
      handleUseGisMode();
      return;
    }
    if (!trimmed.startsWith('AIza') || trimmed.length < 35) {
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

  // Print visit list
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
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white flex items-center gap-1 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>เฉพาะผู้ป่วยที่ผลการวินิจฉัย: มะเร็งลำไส้ใหญ่ (Adenocarcinoma)</span>
              </span>
              <span className="text-xs text-emerald-200">
                โรงพยาบาลโพนนาแก้ว จ.สกลนคร
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-rose-400" />
              <span>Map Colon: แผนที่พิกัดบ้านผู้ป่วยมะเร็งลำไส้ใหญ่</span>
            </h1>
            
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl">
              ระบบปักหมุดพิกัด GPS (ละติจูด & ลองจิจูด) บ้านผู้ป่วยที่ได้รับการวินิจฉัยยืนยัน Adenocarcinoma ส่งลิงก์นำทางให้ อสม. ผ่าน LINE และทีมหมอครอบครัวลงเยี่ยมบ้าน
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAddAdenoModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
              title="เพิ่มผลวินิจฉัย Adenocarcinoma ให้ผู้ป่วย"
            >
              <PlusCircle className="w-4 h-4" />
              <span>เพิ่มผู้ป่วย Adeno</span>
            </button>

            <button
              onClick={handleGetCurrentLocation}
              disabled={isGettingGps}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors border border-white/20"
              title="ดึงตำแหน่ง GPS ของอุปกรณ์ขณะนี้"
            >
              <Crosshair className={`w-4 h-4 text-emerald-300 ${isGettingGps ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">พิกัดฉัน</span>
            </button>

            <button
              onClick={handlePrintVisitList}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors border border-white/20"
              title="พิมพ์รายงานรายชื่อ พิกัด Lat/Lng และจุดสังเกต อสม."
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">พิมพ์รายชื่อ & พิกัด</span>
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
              <span className="font-mono text-xs hidden md:inline">Key: {apiKey ? apiKey.slice(0, 5) + '...' : 'GIS Mode'}</span>
            </button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 mt-4 pt-4 border-t border-emerald-700/50">
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs border border-white/10">
            <div className="text-[11px] text-rose-200 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400 inline-block animate-pulse" />
              <span>ผู้ป่วย Adenocarcinoma</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-white mt-0.5">
              {stats.totalAdeno} <span className="text-xs font-normal text-emerald-200">คน</span>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs border border-white/10">
            <div className="text-[11px] text-emerald-200 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span>ปักหมุดพิกัดบ้านแล้ว</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-emerald-300 mt-0.5">
              {stats.pinnedAdeno} <span className="text-xs font-normal text-emerald-200">คน ({stats.totalAdeno > 0 ? Math.round((stats.pinnedAdeno / stats.totalAdeno) * 100) : 0}%)</span>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs border border-white/10">
            <div className="text-[11px] text-amber-200 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span>ยังไม่ระบุพิกัดบ้าน</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-amber-300 mt-0.5">
              {stats.unpinnedAdeno} <span className="text-xs font-normal text-amber-100">คน</span>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs border border-white/10">
            <div className="text-[11px] text-emerald-200 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
              <span>ลงเยี่ยมบ้านเรียบร้อย</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-teal-200 mt-0.5">
              {stats.visitedAdeno} / {stats.totalAdeno} <span className="text-xs font-normal text-emerald-200">คน</span>
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

      {/* Cohort Tabs & Filters Toolbar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs space-y-3">
        {/* Cohort selector: Default Adenocarcinoma */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setCohortFilter('adenocarcinoma')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                cohortFilter === 'adenocarcinoma'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>เฉพาะมะเร็งลำไส้ใหญ่ (Adenocarcinoma)</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
                {stats.totalAdeno}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCohortFilter('all_positive')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                cohortFilter === 'all_positive'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>กลุ่มผลบวก FIT ทั้งหมด</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-300 text-slate-800 text-[10px]">
                {fitPositivePatients.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1">
            <span>แสดงในมุมมองนี้:</span>
            <strong className="text-slate-800 font-bold">{filteredPatients.length} ราย</strong>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, HN, บ้านเลขที่, อสม., Staging..."
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
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium text-slate-700"
            >
              <option value="all">ทุกหมู่บ้าน (ต.นาแก้ว โพนนาแก้ว)</option>
              {VILLAGE_LIST.map((v) => (
                <option key={v.no} value={v.no}>
                  หมู่ {v.no} {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pin Status Filter */}
          <div>
            <select
              value={pinFilter}
              onChange={(e) => setPinFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium text-slate-700"
            >
              <option value="all">สถานะพิกัดบ้าน (ทั้งหมด)</option>
              <option value="pinned">✅ ปักหมุดพิกัดบ้านแล้ว ({stats.pinnedFiltered})</option>
              <option value="unpinned">⚠️ ยังไม่ระบุพิกัดบ้าน ({stats.unpinnedFiltered})</option>
            </select>
          </div>

          {/* Visit Status Filter */}
          <div>
            <select
              value={visitFilter}
              onChange={(e) => setVisitFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium text-slate-700"
            >
              <option value="all">สถานะการลงเยี่ยมบ้าน (ทั้งหมด)</option>
              <option value="visited">✅ เยี่ยมบ้านแล้ว</option>
              <option value="not_visited">⏳ ยังไม่ได้เยี่ยม</option>
              <option value="followup_needed">⚠️ ต้องติดตามซ้ำ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Map & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Map Container (takes 8 cols on large, 9 on widescreen) */}
        <div className={`lg:col-span-8 ${isWidescreen16x9 ? 'xl:col-span-9' : 'xl:col-span-8'} bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col relative`}>
          {/* Map Toolbar */}
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span className="font-semibold text-slate-800">
                {isGoogleMapsActive ? 'Google Maps (ดาวเทียม & ถนน)' : 'GIS OpenStreetMap & Satellite'}
              </span>
              <span className="hidden sm:inline text-slate-400">• คลิกหมุดเพื่อดูพิกัด Lat/Lng และส่งลิงก์</span>
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
                libraries={['marker', 'places']}
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
                  className="w-full h-full"
                >
                  {/* Google Maps Markers */}
                  {pinnedPatients.map((p) => {
                    if (!p.location?.lat || !p.location?.lng) return null;
                    const isAdeno = p.caTracking?.biopsyResult === 'adenocarcinoma';
                    const isSelected = selectedPatient?.id === p.id;

                    return (
                      <AdvancedMarker
                        key={p.id}
                        position={{ lat: p.location.lat, lng: p.location.lng }}
                        onClick={() => setSelectedPatient(p)}
                        title={`${p.prefix}${p.firstName} ${p.lastName} (${p.houseNo} ม.${p.villageNo})`}
                      >
                        <div className={`relative flex flex-col items-center cursor-pointer transition-transform duration-200 ${
                          isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-10'
                        }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white ${
                            isAdeno ? 'bg-rose-600' : 'bg-emerald-600'
                          }`}>
                            <span className="text-sm font-bold">
                              {isAdeno ? '🎗️' : '📍'}
                            </span>
                          </div>
                          <div className="mt-0.5 bg-slate-900/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md border border-white/20 whitespace-nowrap">
                            {p.houseNo} ม.{p.villageNo}
                          </div>
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                  {/* Google Maps InfoWindow */}
                  {selectedPatient && selectedPatient.location?.lat && selectedPatient.location?.lng && (
                    <InfoWindow
                      position={{ lat: selectedPatient.location.lat, lng: selectedPatient.location.lng }}
                      onCloseClick={() => setSelectedPatient(null)}
                      headerContent={
                        <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <span>{selectedPatient.prefix}{selectedPatient.firstName} {selectedPatient.lastName}</span>
                          {selectedPatient.caTracking?.biopsyResult === 'adenocarcinoma' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-100 text-rose-800 font-bold border border-rose-300">
                              Adeno
                            </span>
                          )}
                        </div>
                      }
                    >
                      <div className="text-xs text-slate-700 space-y-2 p-1 max-w-[280px]">
                        <div className="text-slate-500 font-mono text-[11px]">
                          HN: <strong>{selectedPatient.hn}</strong> • อายุ {selectedPatient.ageYears} ปี ({selectedPatient.gender})
                        </div>

                        {/* Adeno Diagnosis & Staging */}
                        {selectedPatient.caTracking?.biopsyResult === 'adenocarcinoma' && (
                          <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-[11px]">
                            <div className="font-bold flex items-center gap-1">
                              <span>🎗️ มะเร็งลำไส้ใหญ่ (Adenocarcinoma)</span>
                            </div>
                            {selectedPatient.caTracking.cancerStaging && (
                              <div className="text-slate-700 mt-0.5 font-medium">
                                ระยะ: <strong>{selectedPatient.caTracking.cancerStaging}</strong>
                              </div>
                            )}
                            {selectedPatient.caTracking.treatmentPlan && (
                              <div className="text-slate-600 text-[10px] mt-0.5">
                                แผน: {selectedPatient.caTracking.treatmentPlan}
                              </div>
                            )}
                          </div>
                        )}

                        <div>
                          <strong>ที่อยู่:</strong> บ้านเลขที่ {selectedPatient.houseNo} ม.{selectedPatient.villageNo} {selectedPatient.villageName || ''} ต.{selectedPatient.subdistrict || 'นาแก้ว'}
                        </div>

                        {/* Coordinates Box */}
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-800 font-bold">Latitude (ละติจูด):</span>
                            <span>{selectedPatient.location.lat.toFixed(6)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-800 font-bold">Longitude (ลองจิจูด):</span>
                            <span>{selectedPatient.location.lng.toFixed(6)}</span>
                          </div>
                        </div>

                        {selectedPatient.location.landmark && (
                          <div className="bg-amber-50 p-1.5 rounded-lg border border-amber-200 text-amber-900 text-[11px]">
                            <strong>จุดสังเกตเด่น:</strong> {selectedPatient.location.landmark}
                          </div>
                        )}

                        {selectedPatient.location.osmName && (
                          <div className="text-[11px] text-emerald-900 bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                            <strong>อสม.:</strong> {selectedPatient.location.osmName} {selectedPatient.location.osmPhone ? `(โทร: ${selectedPatient.location.osmPhone})` : ''}
                          </div>
                        )}

                        {/* Action buttons inside InfoWindow */}
                        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleShareToLine(selectedPatient)}
                            className="flex items-center justify-center gap-1 px-2 py-1.5 bg-[#06c755] hover:bg-[#05b34c] text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>ส่ง LINE</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSharingPatient(selectedPatient)}
                            className="flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>ส่งลิงก์ปักหมุด</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPatient.location.lat},${selectedPatient.location.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>นำทาง Maps</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(selectedPatient)}
                            className="flex items-center justify-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>แก้ไขพิกัด</span>
                          </button>
                        </div>
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

            {/* Quick Map Coordinates Floating Pill */}
            <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-[11px] text-slate-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-mono">ศูนย์กลาง: 17.168500° N, 104.312000° E (โพนนาแก้ว)</span>
            </div>
          </div>
        </div>

        {/* Patients Sidebar (takes 4 cols on large, 3 on widescreen) */}
        <div className={`lg:col-span-4 ${isWidescreen16x9 ? 'xl:col-span-3' : 'xl:col-span-4'} ${
          showMobileList ? 'block' : 'hidden lg:block'
        } bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[520px] sm:h-[620px] xl:h-[680px]`}>
          {/* Sidebar Header */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-700" />
                <span>รายชื่อผู้ป่วย ({filteredPatients.length} ราย)</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowAddAdenoModal(true)}
                className="text-[11px] font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200 transition-colors flex items-center gap-1"
              >
                <PlusCircle className="w-3 h-3" />
                <span>เพิ่มผู้ป่วย</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {cohortFilter === 'adenocarcinoma' 
                ? 'เฉพาะผู้ป่วยมะเร็งลำไส้ใหญ่: คลิกที่การ์ดเพื่อซูมไปที่บ้าน หรือกดปุ่มแชร์ส่งลิงก์' 
                : 'คลิกเพื่อดูพิกัดบ้านและนำทางเยี่ยมบ้าน'}
            </p>
          </div>

          {/* Patients Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2 divide-y divide-slate-100">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <MapPin className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <span>ไม่พบข้อมูลผู้ป่วยตามเงื่อนไขที่เลือก</span>
                <div className="mt-3">
                  <button
                    onClick={() => setShowAddAdenoModal(true)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    + เพิ่มผู้ป่วย Adenocarcinoma
                  </button>
                </div>
              </div>
            ) : (
              filteredPatients.map((p) => {
                const hasPin = Boolean(p.location?.lat && p.location?.lng);
                const isAdeno = p.caTracking?.biopsyResult === 'adenocarcinoma';
                const isSelected = selectedPatient?.id === p.id;

                return (
                  <div
                    key={p.id}
                    className={`pt-2 rounded-xl p-2.5 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-50/90 border-emerald-400 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-100'
                    }`}
                    onClick={() => handlePanToPatient(p)}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            isAdeno ? 'bg-rose-600 animate-pulse' : 'bg-emerald-500'
                          }`} />
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {p.prefix}{p.firstName} {p.lastName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {p.hn}
                          </span>
                          {isAdeno && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              Adenocarcinoma
                            </span>
                          )}
                        </div>

                        {/* Staging tag */}
                        {p.caTracking?.cancerStaging && (
                          <div className="text-[10px] text-rose-700 font-semibold mt-0.5">
                            🎗️ {p.caTracking.cancerStaging}
                          </div>
                        )}

                        <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1.5">
                          <Home className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate">
                            บ้านเลขที่ {p.houseNo} ม.{p.villageNo} {p.villageName || ''}
                          </span>
                        </div>

                        {/* Explicit Latitude & Longitude Block with Copy Button */}
                        {hasPin && p.location?.lat && p.location?.lng ? (
                          <div className="mt-1.5 p-1.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-700">
                            <div className="truncate">
                              <span className="text-emerald-800 font-bold">Lat:</span> {p.location.lat.toFixed(6)}{' '}
                              <span className="text-emerald-800 font-bold ml-1">Lng:</span> {p.location.lng.toFixed(6)}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const coords = `${p.location?.lat?.toFixed(6)}, ${p.location?.lng?.toFixed(6)}`;
                                navigator.clipboard.writeText(coords);
                                showToast(`คัดลอกพิกัด Lat, Lng แล้ว: ${coords}`);
                              }}
                              className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors ml-1"
                              title="คัดลอกพิกัด Latitude, Longitude"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="mt-1 text-[10px] text-amber-700 font-medium">
                            ⚠️ ยังไม่ระบุพิกัดบ้าน
                          </div>
                        )}

                        {p.location?.landmark && (
                          <div className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded mt-1 truncate">
                            📍 {p.location.landmark}
                          </div>
                        )}

                        {p.location?.osmName && (
                          <div className="text-[10px] text-emerald-800 mt-0.5">
                            อสม: {p.location.osmName}
                          </div>
                        )}
                      </div>

                      {/* Right Pin & Share Actions */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {hasPin ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSharingPatient(p);
                              }}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                              title="ส่งลิงก์ปักหมุดบ้านผู้ป่วย"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(p);
                              }}
                              className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200"
                              title="แก้ไขพิกัดบ้าน"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-1">
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

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSharingPatient(p);
                              }}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-medium border border-slate-200"
                              title="ส่งคำขอพิกัดบ้านให้อสม."
                            >
                              ขอพิกัด
                            </button>
                          </div>
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
            <span className="text-[11px] text-slate-600 font-medium">
              ปักหมุดแล้ว {stats.pinnedFiltered} / {stats.totalFiltered} ราย ({stats.totalFiltered > 0 ? Math.round((stats.pinnedFiltered / stats.totalFiltered) * 100) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* Share Pin Link Modal (เพิ่มส่งลิ้งปักหมุดบ้านผู้ป่วย) */}
      {sharingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-scale-up">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">ส่งลิงก์ปักหมุดบ้านผู้ป่วย</h3>
                  <p className="text-[11px] text-emerald-100">
                    {sharingPatient.prefix}{sharingPatient.firstName} {sharingPatient.lastName} (HN: {sharingPatient.hn})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSharingPatient(null)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* Coordinates Preview */}
              {sharingPatient.location?.lat && sharingPatient.location?.lng ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 font-mono text-xs text-emerald-900 space-y-1">
                  <div className="font-bold text-emerald-800 text-xs mb-1 flex items-center gap-1">
                    <Compass className="w-4 h-4 text-emerald-700" />
                    <span>พิกัด GPS บ้านผู้ป่วย</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Latitude (ละติจูด):</span>
                    <strong className="text-slate-900">{sharingPatient.location.lat.toFixed(6)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Longitude (ลองจิจูด):</span>
                    <strong className="text-slate-900">{sharingPatient.location.lng.toFixed(6)}</strong>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <div className="font-bold mb-1">⚠️ ผู้ป่วยท่านนี้ยังไม่ได้ระบุพิกัดบ้าน</div>
                  <p className="text-[11px]">
                    สามารถส่งข้อความขอความอนุเคราะห์ให้ อสม. หรือญาติ ช่วยส่งตำแหน่งพิกัดบ้านกลับมาได้
                  </p>
                </div>
              )}

              {/* Direct LINE Share Button */}
              <div>
                <button
                  type="button"
                  onClick={() => handleShareToLine(sharingPatient)}
                  className="w-full py-2.5 px-4 bg-[#06c755] hover:bg-[#05b34c] text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>แชร์พิกัดบ้านผ่าน LINE</span>
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-1">
                  เปิดแอปพลิเคชัน LINE เพื่อส่งให้ อสม., ทีมหมอครอบครัว หรือกลุ่มงานเยี่ยมบ้าน
                </p>
              </div>

              {/* Copy Links Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {sharingPatient.location?.lat && sharingPatient.location?.lng && (
                  <button
                    type="button"
                    onClick={() => handleCopyPinUrl(sharingPatient)}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>คัดลอกลิงก์ปักหมุด Google Maps</span>
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700">
                      {copiedLink ? 'คัดลอกแล้ว ✓' : 'คัดลอก'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleCopyMessage(sharingPatient)}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-slate-500" />
                    <span>คัดลอกข้อความสรุปนำทาง (พร้อมที่อยู่ & เบอร์ติดต่อ)</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700">
                    {copiedMessage ? 'คัดลอกแล้ว ✓' : 'คัดลอก'}
                  </span>
                </button>

                {sharingPatient.location?.lat && sharingPatient.location?.lng && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${sharingPatient.location.lat},${sharingPatient.location.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-blue-200 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>เปิดนำทางใน Google Maps</span>
                  </a>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSharingPatient(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save / Edit Patient Location Modal (เพิ่ม Latitude และ longtitude) */}
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
            <form onSubmit={handleSaveLocation} className="p-4 sm:p-5 space-y-4 max-h-[82vh] overflow-y-auto">
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
                  <span className="text-slate-500">ผลวินิจฉัย:</span>{' '}
                  <span className="font-bold text-rose-600">
                    {editingPatient.caTracking?.biopsyResult === 'adenocarcinoma' 
                      ? 'มะเร็งลำไส้ใหญ่ (Adeno)' 
                      : editingPatient.fitResult === 'positive' ? 'ผลบวก 1B0061' : 'คัดกรอง FIT'}
                  </span>
                </div>
              </div>

              {/* Quick Paste Coordinate Tool */}
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
                <label className="text-[11px] font-bold text-emerald-900 block">
                  🚀 วางพิกัดด่วน (ละติจูด, ลองจิจูด หรือ ลิงก์ Google Maps):
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={formQuickPaste}
                    onChange={(e) => setFormQuickPaste(e.target.value)}
                    placeholder="เช่น 17.165200, 104.308500 หรือ วาง URL Maps"
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleApplyQuickPaste}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    แยกพิกัด
                  </button>
                </div>
              </div>

              {/* Coordinates Inputs (Latitude & Longitude) */}
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
                    className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Crosshair className={`w-3 h-3 ${isGettingGps ? 'animate-spin' : ''}`} />
                    <span>ดึงจาก GPS มือถือขณะนี้</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      Latitude (ละติจูด N) <span className="text-rose-500">*</span>
                    </label>
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
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      Longitude (ลองจิจูด E) <span className="text-rose-500">*</span>
                    </label>
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

                {/* Coordinate Verification indicator */}
                {formLat && formLng && !isNaN(parseFloat(formLat)) && !isNaN(parseFloat(formLng)) && (
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                    <span className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>พิกัดถูกต้อง ({parseFloat(formLat).toFixed(5)}, {parseFloat(formLng).toFixed(5)})</span>
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${parseFloat(formLat)},${parseFloat(formLng)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 underline font-semibold flex items-center gap-0.5"
                    >
                      <span>ดูบน Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
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
                  placeholder="เช่น ตรงข้ามร้านค้าป้าจันทร์, ติดศาลาประชาคมหมู่บ้าน, บ้านไม้ยกสูงหลังคาสีเขียว"
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
                  placeholder="เช่น ผู้ป่วยอยู่บ้านช่วงเย็น, ให้คำแนะนำดูแลโภชนาการ, ให้กำลังใจก่อนไปรับการรักษาที่ รพ.สกลนคร"
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
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
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

      {/* Add / Diagnose Adenocarcinoma Modal */}
      {showAddAdenoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-scale-up">
            <div className="bg-gradient-to-r from-rose-700 to-rose-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-rose-300" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">เพิ่มผู้ป่วยมะเร็งลำไส้ใหญ่ (Adenocarcinoma)</h3>
                  <p className="text-[11px] text-rose-100">
                    บันทึกผลการวินิจฉัยยืนยันเพื่อติดตามบนแผนที่ Map Colon
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAdenoModal(false)}
                className="text-rose-200 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  เลือกผู้ป่วยจากรายชื่อ:
                </label>
                <select
                  value={selectedPatientToDiagnose}
                  onChange={(e) => setSelectedPatientToDiagnose(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                >
                  <option value="">-- กรุณาเลือกผู้ป่วย --</option>
                  {patients.map((p) => {
                    const isAdeno = p.caTracking?.biopsyResult === 'adenocarcinoma';
                    return (
                      <option key={p.id} value={p.id}>
                        {p.hn} - {p.prefix}{p.firstName} {p.lastName} (ม.{p.villageNo} {p.fitResult === 'positive' ? '• FIT+' : ''}) {isAdeno ? '• [Adeno แล้ว]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ระยะของโรคมะเร็ง (Cancer Staging):
                </label>
                <select
                  value={adenoStaging}
                  onChange={(e) => setAdenoStaging(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                >
                  <option value="Stage I (T1N0M0)">ระยะที่ 1 - Stage I (T1N0M0) ติ่งเนื้อระยะเริ่มต้น</option>
                  <option value="Stage II (T3N0M0)">ระยะที่ 2 - Stage II (T3N0M0) ลุกลามผนังลำไส้</option>
                  <option value="Stage III (T3N1M0)">ระยะที่ 3 - Stage III (T3N1M0) แพร่กระจายต่อมน้ำเหลือง</option>
                  <option value="Stage IV (Any T Any N M1)">ระยะที่ 4 - Stage IV แพร่กระจายสู่อวัยวะอื่น</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  แผนการรักษา / การส่งต่อ:
                </label>
                <input
                  type="text"
                  value={adenoPlan}
                  onChange={(e) => setAdenoPlan(e.target.value)}
                  placeholder="เช่น ส่งต่อศัลยกรรม รพ.สกลนคร นัดผ่าตัด Colectomy"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddAdenoModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={!selectedPatientToDiagnose || isSubmitting}
                  onClick={handleConfirmAdenocarcinoma}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันผล Adenocarcinoma'}
                </button>
              </div>
            </div>
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
                ระบบรองรับ 2 รูปแบบ: <strong className="text-emerald-800">GIS OpenStreetMap & Satellite</strong> (ใช้งานฟรี ไม่มีข้อผิดพลาด API Key) หรือ <strong className="text-blue-800">Google Maps Platform</strong> (ต้องระบุ API Key ที่เปิดใช้งานแล้ว)
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
                  * Google Maps API Key ที่ถูกต้องจะขึ้นต้นด้วย AIza และมีความยาวประมาณ 39 ตัวอักษร
                </p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-700">
                <div className="flex items-center justify-between">
                  <span>สถานะปัจจุบัน:</span>
                  <span className={`font-bold ${isGoogleMapsActive ? 'text-blue-700' : 'text-emerald-700'}`}>
                    {isGoogleMapsActive ? 'ใช้งาน Google Maps' : 'ใช้งาน GIS OpenStreetMap & Satellite'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleUseGisMode}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors"
                >
                  ใช้โหมด GIS (แนะนำ)
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

      {/* Printable Home Visit List (Print-Only Table) */}
      <div className="print-only hidden p-4">
        <div className="text-center mb-4">
          <h2 className="text-base font-bold">บัญชีรายชื่อและพิกัดบ้านผู้ป่วยมะเร็งลำไส้ใหญ่ (Adenocarcinoma) เพื่อการเยี่ยมบ้าน</h2>
          <p className="text-xs text-slate-600">หน่วยบริการ โรงพยาบาลโพนนาแก้ว อำเภอโพนนาแก้ว จังหวัดสกลนคร</p>
        </div>

        <table className="w-full text-xs border border-collapse border-slate-400">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-400 p-1.5 text-center">ลำดับ</th>
              <th className="border border-slate-400 p-1.5 text-center">HN</th>
              <th className="border border-slate-400 p-1.5 text-left">ชื่อ-สกุล</th>
              <th className="border border-slate-400 p-1.5 text-left">ที่อยู่</th>
              <th className="border border-slate-400 p-1.5 text-center">Latitude (ละติจูด)</th>
              <th className="border border-slate-400 p-1.5 text-center">Longitude (ลองจิจูด)</th>
              <th className="border border-slate-400 p-1.5 text-left">จุดสังเกตเด่น</th>
              <th className="border border-slate-400 p-1.5 text-left">อสม. ผู้รับผิดชอบ</th>
              <th className="border border-slate-400 p-1.5 text-center">สถานะเยี่ยม</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((p, idx) => (
              <tr key={p.id}>
                <td className="border border-slate-400 p-1 text-center">{idx + 1}</td>
                <td className="border border-slate-400 p-1 text-center font-mono">{p.hn}</td>
                <td className="border border-slate-400 p-1 font-bold">{p.prefix}{p.firstName} {p.lastName}</td>
                <td className="border border-slate-400 p-1">{p.houseNo} ม.{p.villageNo} {p.villageName || ''}</td>
                <td className="border border-slate-400 p-1 text-center font-mono">{p.location?.lat ? p.location.lat.toFixed(6) : '-'}</td>
                <td className="border border-slate-400 p-1 text-center font-mono">{p.location?.lng ? p.location.lng.toFixed(6) : '-'}</td>
                <td className="border border-slate-400 p-1">{p.location?.landmark || '-'}</td>
                <td className="border border-slate-400 p-1">{p.location?.osmName || '-'}</td>
                <td className="border border-slate-400 p-1 text-center">
                  {p.location?.visitStatus === 'visited' ? 'เยี่ยมแล้ว' : 'ยังไม่เยี่ยม'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
