import React, { useState, useMemo, useEffect } from 'react';
import { PatientScreening } from '../types';
import { PHON_NA_KAEO_VILLAGES } from '../data/villages';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { AllScreeningListView } from './AllScreeningListView';
import { generateHnQrCodeDataUrl } from '../utils/stickerGenerator';
import { 
  HeartHandshake, 
  Camera, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck,
  ShieldCheck,
  HeartPulse,
  FileSpreadsheet,
  Plus,
  Printer,
  X,
  Send,
  Tag,
  Clock
} from 'lucide-react';

interface VhvMobileVitalsViewProps {
  patients: PatientScreening[];
  onUpdatePatient: (updated: PatientScreening) => void | Promise<void>;
  onExitVhvMode?: () => void;
}

export const VhvMobileVitalsView: React.FC<VhvMobileVitalsViewProps> = ({
  patients,
  onUpdatePatient
}) => {
  // Navigation tabs within VHV Mobile Mode: 'form' (บันทึกข้อมูลสุขภาพ) or 'list' (หน้าแสดงรายชื่อคัดกรอง)
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Form State
  const [heightCm, setHeightCm] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');
  const [waistInch, setWaistInch] = useState<string>('');
  const [bpSys, setBpSys] = useState<string>('');
  const [bpDia, setBpDia] = useState<string>('');
  const [isKitReturned, setIsKitReturned] = useState<boolean>(true);
  const [recordedByName, setRecordedByName] = useState<string>('อสม. ในพื้นที่');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [justSavedPatient, setJustSavedPatient] = useState<PatientScreening | null>(null);

  // Quick previews for referral slip & sticker if clicked inside screening list
  const [previewReferralHn, setPreviewReferralHn] = useState<string | null>(null);
  const [previewStickerHn, setPreviewStickerHn] = useState<string | null>(null);
  const [stickerQrUrl, setStickerQrUrl] = useState<string>('');

  const selectedPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  // Generate QR for sticker preview modal
  useEffect(() => {
    if (previewStickerHn) {
      generateHnQrCodeDataUrl(previewStickerHn)
        .then(url => setStickerQrUrl(url))
        .catch(() => setStickerQrUrl(''));
    } else {
      setStickerQrUrl('');
    }
  }, [previewStickerHn]);

  // Handle patient selection
  const handleSelectPatient = (patient: PatientScreening) => {
    setSelectedPatientId(patient.id);
    setHeightCm(patient.heightCm ? String(patient.heightCm) : '');
    setWeightKg(patient.weightKg ? String(patient.weightKg) : '');
    setWaistInch(patient.waistInch ? String(patient.waistInch) : (patient.waistCm ? String(Math.round(patient.waistCm / 2.54)) : ''));
    setBpSys(patient.bloodPressureSys ? String(patient.bloodPressureSys) : '');
    setBpDia(patient.bloodPressureDia ? String(patient.bloodPressureDia) : '');
    setIsKitReturned(patient.kitStatus === 'received' || patient.kitStatus === 'tested' || true);
    setJustSavedPatient(null);
  };

  // Barcode / QR Scanner result
  const handleScanSuccess = (code: string) => {
    setIsScannerOpen(false);
    const clean = code.trim().toLowerCase();
    const matched = patients.find(p => 
      p.hn.toLowerCase() === clean || 
      p.idCard === code.trim() ||
      code.includes(p.hn)
    );

    if (matched) {
      handleSelectPatient(matched);
      setActiveTab('form');
      setNotification({
        type: 'success',
        message: `สแกนพบผู้ป่วย: HN ${matched.hn} (${matched.prefix}${matched.firstName} ${matched.lastName})`
      });
    } else {
      setNotification({
        type: 'error',
        message: `ไม่พบข้อมูลผู้ป่วยสำหรับรหัส "${code}" กรุณาตรวจสอบหรือค้นหาด้วยชื่อ`
      });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  // BMI Calculation
  const currentBmi = useMemo(() => {
    const h = parseFloat(heightCm) / 100;
    const w = parseFloat(weightKg);
    if (h > 0 && w > 0) {
      return (w / (h * h)).toFixed(1);
    }
    return null;
  }, [heightCm, weightKg]);

  const bmiCategory = useMemo(() => {
    if (!currentBmi) return null;
    const val = parseFloat(currentBmi);
    if (val < 18.5) return { label: 'น้ำหนักน้อย/ผอม', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (val < 23) return { label: 'สมส่วน/ปกติ', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (val < 25) return { label: 'น้ำหนักเกิน (ท้วม)', color: 'text-orange-600 bg-orange-50 border-orange-200' };
    return { label: 'ภาวะอ้วน', color: 'text-rose-600 bg-rose-50 border-rose-200' };
  }, [currentBmi]);

  // Filtered patient list for search box
  const filteredPatients = useMemo(() => {
    const list = Array.isArray(patients) ? patients : [];
    const q = searchQuery.toLowerCase().trim();
    return list.filter(p => {
      if (selectedVillage !== 'all') {
        const match = p.villageNo === selectedVillage || (!isNaN(parseInt(p.villageNo, 10)) && parseInt(p.villageNo, 10) === parseInt(selectedVillage, 10));
        if (!match) return false;
      }
      if (!q) return true;
      const fullName = `${p.prefix}${p.firstName} ${p.lastName}`.toLowerCase();
      return p.hn.toLowerCase().includes(q) || p.idCard.includes(q) || fullName.includes(q);
    }).slice(0, 30);
  }, [patients, searchQuery, selectedVillage]);

  // Save handler - Persists data and automatically navigates to "หน้าแสดงรายชื่อคัดกรอง"
  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const h = parseFloat(heightCm) || undefined;
    const w = parseFloat(weightKg) || undefined;
    const wInch = parseFloat(waistInch) || undefined;
    const wCm = wInch ? Math.round(wInch * 2.54) : undefined;
    const sys = parseInt(bpSys, 10) || undefined;
    const dia = parseInt(bpDia, 10) || undefined;
    const bmiVal = currentBmi ? parseFloat(currentBmi) : undefined;

    const nowStr = new Date().toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const updated: PatientScreening = {
      ...selectedPatient,
      kitStatus: isKitReturned ? (selectedPatient.kitStatus === 'tested' ? 'tested' : 'received') : selectedPatient.kitStatus,
      kitReceivedDate: isKitReturned ? (selectedPatient.kitReceivedDate || nowStr) : selectedPatient.kitReceivedDate,
      heightCm: h,
      weightKg: w,
      waistInch: wInch,
      waistCm: wCm,
      bloodPressureSys: sys,
      bloodPressureDia: dia,
      bmi: bmiVal,
      notes: selectedPatient.notes ? `${selectedPatient.notes} [อสม. บันทึก: ${recordedByName}]` : `[อสม. บันทึก: ${recordedByName}]`
    };

    // 1. Sync data to local state & Cloud Firebase
    await onUpdatePatient(updated);
    setJustSavedPatient(updated);
    setSelectedPatientId(null);
    setSearchQuery('');

    // 2. Automatically navigate to "หน้าแสดงรายชื่อคัดกรอง" as requested
    setActiveTab('list');

    // 3. Show prominent success feedback connecting the action
    setNotification({
      type: 'success',
      message: `บันทึกข้อมูลสุขภาพของ ${updated.prefix}${updated.firstName} ${updated.lastName} (HN: ${updated.hn}) สำเร็จ! เชื่อมโยงข้อมูลมายังหน้าแสดงรายชื่อคัดกรองแล้ว`
    });
  };

  const referralPatient = useMemo(() => {
    if (!previewReferralHn) return null;
    return patients.find(p => p.hn === previewReferralHn) || null;
  }, [patients, previewReferralHn]);

  const stickerPatient = useMemo(() => {
    if (!previewStickerHn) return null;
    return patients.find(p => p.hn === previewStickerHn) || null;
  }, [patients, previewStickerHn]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      {/* Mobile Sticky Header (Without "หน้ารวม" button) */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-emerald-800 to-teal-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <HeartHandshake className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-emerald-200 tracking-wide uppercase">
                รพ.โพนนาแก้ว จ.สกลนคร
              </div>
              <h1 className="text-sm font-bold text-white leading-tight">
                ระบบบันทึกข้อมูลสุขภาพ อสม.
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-emerald-100 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">เชื่อมโยงข้อมูลคัดกรอง</span>
              <span className="font-mono font-bold text-white">({patients.length} ราย)</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher: บันทึกข้อมูลสุขภาพ <-> หน้าแสดงรายชื่อคัดกรอง */}
        <div className="bg-emerald-950/40 border-t border-white/10 px-3 sm:px-4 py-1.5">
          <div className="max-w-md mx-auto flex items-center justify-center p-1 bg-white/10 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>บันทึกข้อมูลสุขภาพ</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>หน้าแสดงรายชื่อคัดกรอง</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                activeTab === 'list' ? 'bg-emerald-100 text-emerald-800' : 'bg-white/20 text-white'
              }`}>
                {patients.length}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className={activeTab === 'form' ? 'max-w-md mx-auto p-4 space-y-4' : 'max-w-7xl mx-auto p-3 sm:p-6 space-y-4'}>
        {/* Notification Banner */}
        {notification && (
          <div className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}>
            <div className="flex items-center gap-2.5">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-white/80 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: FORM (บันทึกข้อมูลสุขภาพ / ค้นหา / สแกน) */}
        {activeTab === 'form' && (
          <div className="space-y-4">
            {/* Quick Scan Action Button */}
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 active:from-emerald-700 active:to-teal-700 text-white font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              <span>เปิดกล้องสแกน QR บนหลอด / สติกเกอร์ HN</span>
            </button>

            {/* Selected Patient Form */}
            {selectedPatient ? (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-200 space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono font-bold text-xs">
                        HN: {selectedPatient.hn}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ม.{selectedPatient.villageNo} {selectedPatient.villageName}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mt-1">
                      {selectedPatient.prefix}{selectedPatient.firstName} {selectedPatient.lastName}
                    </h2>
                    <p className="text-xs text-slate-500">
                      อายุ {selectedPatient.ageYears} ปี • CID: {selectedPatient.idCard}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPatientId(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 p-1"
                  >
                    เปลี่ยนคน
                  </button>
                </div>

                <form onSubmit={handleSaveVitals} className="space-y-3.5">
                  {/* Return Kit Checkbox */}
                  <label className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isKitReturned}
                      onChange={(e) => setIsKitReturned(e.target.checked)}
                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-blue-300"
                    />
                    <div>
                      <div className="text-xs font-bold text-blue-900">
                        รับชุดตรวจอุจจาระที่ส่งคืน (Return Kit) เรียบร้อย
                      </div>
                      <div className="text-[11px] text-blue-700">
                        ติ๊กช่องนี้เพื่อบันทึกสถานะ "ส่งชุดตรวจแล้ว" และบันทึกเวลา
                      </div>
                    </div>
                  </label>

                  {/* Height & Weight */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ส่วนสูง (ซม.)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        placeholder="เช่น 165"
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        น้ำหนัก (กก.)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        placeholder="เช่น 62.5"
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* BMI Auto-Display */}
                  {currentBmi && (
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${bmiCategory?.color || 'bg-slate-50'}`}>
                      <span>ค่า BMI: <strong className="font-mono text-sm">{currentBmi}</strong></span>
                      <span>{bmiCategory?.label}</span>
                    </div>
                  )}

                  {/* Waist */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      รอบเอว (นิ้ว)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={waistInch}
                      onChange={(e) => setWaistInch(e.target.value)}
                      placeholder="เช่น 32"
                      className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Blood Pressure Sys/Dia */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ความดันโลหิต (มม.ปรอท) บน / ล่าง
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={bpSys}
                        onChange={(e) => setBpSys(e.target.value)}
                        placeholder="SYS เช่น 120"
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        value={bpDia}
                        onChange={(e) => setBpDia(e.target.value)}
                        placeholder="DIA เช่น 80"
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Name of VHV Recorder */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ชื่อ อสม. ผู้บันทึก
                    </label>
                    <input
                      type="text"
                      value={recordedByName}
                      onChange={(e) => setRecordedByName(e.target.value)}
                      placeholder="ระบุชื่อ อสม."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPatientId(null)}
                      className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>บันทึกข้อมูลสุขภาพ &gt; ไปหน้ารายชื่อ</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Search & Patient List */
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-emerald-600" />
                    <span>ค้นหารายชื่อผู้ป่วยในพื้นที่</span>
                  </h2>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {patients.length} ราย
                  </span>
                </div>

                {/* Filter by Village */}
                <select
                  value={selectedVillage}
                  onChange={(e) => setSelectedVillage(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="all">ทุกหมู่บ้าน (PCU รพ.โพนนาแก้ว)</option>
                  {PHON_NA_KAEO_VILLAGES.map(v => (
                    <option key={v.no} value={v.no}>
                      หมู่ {v.no} {v.name}
                    </option>
                  ))}
                </select>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="พิมพ์ชื่อ, เลข HN หรือเลขบัตร 13 หลัก..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Patient Cards List */}
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5 scrollbar-thin">
                  {filteredPatients.map(p => {
                    const isReturned = p.kitStatus === 'received' || p.kitStatus === 'tested';
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPatient(p)}
                        className="p-3 bg-slate-50 hover:bg-emerald-50/50 active:bg-emerald-100 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-emerald-800">{p.hn}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              isReturned ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isReturned ? 'ส่งชุดแล้ว' : 'ยังไม่ส่งชุด'}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5">
                            {p.prefix}{p.firstName} {p.lastName}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            ม.{p.villageNo} {p.villageName} (ต.{p.subdistrict || 'โพนนาแก้ว'})
                          </div>
                        </div>

                        <button
                          type="button"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1"
                        >
                          <HeartPulse className="w-3.5 h-3.5" />
                          <span>บันทึก</span>
                        </button>
                      </div>
                    );
                  })}

                  {filteredPatients.length === 0 && (
                    <div className="p-6 text-center text-xs text-slate-400">
                      ไม่พบรายชื่อผู้ป่วยที่ตรงกับคำค้นหา
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Link to view full screening list */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>ดูหน้าแสดงรายชื่อคัดกรองทั้งหมด ({patients.length} ราย)</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: LIST (หน้าแสดงรายชื่อคัดกรอง) */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            {/* Quick Return to form banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>หน้าแสดงรายชื่อคัดกรองมะเร็งลำไส้ใหญ่ รพ.โพนนาแก้ว</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  ข้อมูลสุขภาพและสถานะส่งชุดตรวจเชื่อมโยงกันเรียบร้อย • สามารถคลิก "บันทึกสุขภาพ" บนรายชื่อใดก็ได้เพื่อแก้ไขหรือบันทึกข้อมูล
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('form');
                  setSelectedPatientId(null);
                }}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>บันทึกข้อมูลสุขภาพรายต่อไป</span>
              </button>
            </div>

            {/* Just-saved patient highlight banner */}
            {justSavedPatient && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    ข้อมูลที่เพิ่งบันทึก: <strong>{justSavedPatient.prefix}{justSavedPatient.firstName} {justSavedPatient.lastName}</strong> (HN: {justSavedPatient.hn})
                    {' • '}ส่วนสูง {justSavedPatient.heightCm || '-'} ซม., น้ำหนัก {justSavedPatient.weightKg || '-'} กก., รอบเอว {justSavedPatient.waistInch ? `${justSavedPatient.waistInch} นิ้ว` : '-'}, ความดัน {justSavedPatient.bloodPressureSys || '-'}/{justSavedPatient.bloodPressureDia || '-'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setJustSavedPatient(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs px-2"
                >
                  ปิด
                </button>
              </div>
            )}

            {/* Screening List View */}
            <AllScreeningListView
              patients={patients}
              onNavigateToReferral={(hn) => setPreviewReferralHn(hn)}
              onNavigateToStickerPrint={(hn) => setPreviewStickerHn(hn)}
              onSelectPatientForVitals={(p) => {
                handleSelectPatient(p);
                setActiveTab('form');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* Security Info Footer */}
        <div className="p-3 rounded-xl bg-slate-200/60 text-slate-500 text-[11px] text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>ระบบบันทึกข้อมูลสุขภาพ อสม. อ.โพนนาแก้ว เชื่อมโยงข้อมูลคัดกรองอัตโนมัติ</span>
        </div>
      </main>

      {/* Barcode / QR Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="สแกน Barcode / QR Code ค้นหาผู้ป่วย"
        description="หันกล้องไปที่บาร์โค้ดบนหลอดเก็บอุจจาระหรือสติกเกอร์ HN"
        patients={patients}
      />

      {/* Referral Slip Modal Preview */}
      {previewReferralHn && referralPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  ใบส่งตัวตรวจส่องกล้อง (Colonoscopy) รพ.สกลนคร
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewReferralHn(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs space-y-1">
              <div className="font-bold text-rose-900">
                ผลตรวจคัดกรอง FIT Test: Positive (ผลบวก 1B0061)
              </div>
              <div className="text-rose-700">
                HN: {referralPatient.hn} • {referralPatient.prefix}{referralPatient.firstName} {referralPatient.lastName}
              </div>
              <div className="text-rose-700">
                อายุ {referralPatient.ageYears} ปี • ที่อยู่: {referralPatient.houseNo} ม.{referralPatient.villageNo} {referralPatient.villageName}
              </div>
              <div className="text-rose-700">
                ความดัน: {referralPatient.bloodPressureSys || '-'}/{referralPatient.bloodPressureDia || '-'} • ส่วนสูง: {referralPatient.heightCm || '-'} ซม. • น้ำหนัก: {referralPatient.weightKg || '-'} กก.
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์ใบส่งตัว</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewReferralHn(null)}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticker Preview Modal */}
      {previewStickerHn && stickerPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  สติกเกอร์ผู้ป่วย (7×2.5 cm)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewStickerHn(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sticker Graphic */}
            <div className="border border-slate-300 rounded-lg p-3 bg-white shadow-xs flex items-center gap-3">
              {stickerQrUrl && (
                <img src={stickerQrUrl} alt="QR Code" className="w-16 h-16 flex-shrink-0" />
              )}
              <div className="text-[11px] text-slate-900 leading-tight">
                <div className="font-bold font-mono text-emerald-900 text-xs">HN: {stickerPatient.hn}</div>
                <div className="font-bold">{stickerPatient.prefix}{stickerPatient.firstName} {stickerPatient.lastName}</div>
                <div>อายุ {stickerPatient.ageYears} ปี ({stickerPatient.gender})</div>
                <div>ม.{stickerPatient.villageNo} {stickerPatient.villageName}</div>
                <div className="text-[10px] text-slate-500 font-mono">CID: {stickerPatient.idCard}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์สติกเกอร์</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewStickerHn(null)}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
