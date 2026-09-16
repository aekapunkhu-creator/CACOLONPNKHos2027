import React, { useState } from 'react';
import { PatientScreening } from '../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { 
  PackageCheck, 
  Camera, 
  Search, 
  Scale, 
  Ruler, 
  HeartPulse, 
  CheckCircle2, 
  UserCheck, 
  AlertCircle,
  Clock
} from 'lucide-react';

interface SampleReceiveViewProps {
  patients: PatientScreening[];
  onUpdatePatient: (updated: PatientScreening) => void;
  onNavigateToResult: (hn: string) => void;
}

export const SampleReceiveView: React.FC<SampleReceiveViewProps> = ({
  patients,
  onUpdatePatient,
  onNavigateToResult
}) => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchHn, setSearchHn] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Vitals form
  const [heightCm, setHeightCm] = useState<string>('165');
  const [weightKg, setWeightKg] = useState<string>('62');
  const [waistInch, setWaistInch] = useState<string>('31');
  const [waistCm, setWaistCm] = useState<string>('79');
  const [bpSys, setBpSys] = useState<string>('120');
  const [bpDia, setBpDia] = useState<string>('80');

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || null;

  // Auto calculate BMI
  const currentBmi = React.useMemo(() => {
    const h = parseFloat(heightCm) / 100;
    const w = parseFloat(weightKg);
    if (h > 0 && w > 0) {
      return (w / (h * h)).toFixed(1);
    }
    return null;
  }, [heightCm, weightKg]);

  const handleSelectPatient = (patient: PatientScreening) => {
    setSelectedPatientId(patient.id);
    if (patient.heightCm) setHeightCm(String(patient.heightCm));
    if (patient.weightKg) setWeightKg(String(patient.weightKg));
    if (patient.waistInch) setWaistInch(String(patient.waistInch));
    if (patient.waistCm) setWaistCm(String(patient.waistCm));
    if (patient.bloodPressureSys) setBpSys(String(patient.bloodPressureSys));
    if (patient.bloodPressureDia) setBpDia(String(patient.bloodPressureDia));
  };

  const handleScanSuccess = (scannedCode: string) => {
    setIsScannerOpen(false);
    // Find matching patient by HN or CID
    const matched = patients.find(p => 
      p.hn.toLowerCase() === scannedCode.toLowerCase() ||
      p.idCard === scannedCode
    );

    if (matched) {
      handleSelectPatient(matched);
      setNotification({
        type: 'success',
        message: `สแกนพบข้อมูล: HN ${matched.hn} (${matched.prefix}${matched.firstName} ${matched.lastName})`
      });
    } else {
      setNotification({
        type: 'error',
        message: `ไม่พบข้อมูลผู้ป่วยสำหรับรหัส "${scannedCode}" ในระบบ กรุณาตรวจสอบเลข HN หรือลงทะเบียนก่อน`
      });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveSampleReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const h = parseFloat(heightCm) || undefined;
    const w = parseFloat(weightKg) || undefined;
    const wInch = parseFloat(waistInch) || undefined;
    const wCm = parseFloat(waistCm) || (wInch ? Math.round(wInch * 2.54) : undefined);
    const sys = parseInt(bpSys, 10) || undefined;
    const dia = parseInt(bpDia, 10) || undefined;
    const bmiVal = (h && w) ? parseFloat((w / ((h / 100) * (h / 100))).toFixed(1)) : undefined;

    const nowStr = new Date().toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const updated: PatientScreening = {
      ...selectedPatient,
      kitStatus: selectedPatient.kitStatus === 'tested' ? 'tested' : 'received',
      kitReceivedDate: nowStr,
      heightCm: h,
      weightKg: w,
      waistInch: wInch,
      waistCm: wCm,
      bloodPressureSys: sys,
      bloodPressureDia: dia,
      bmi: bmiVal
    };

    onUpdatePatient(updated);
    setNotification({
      type: 'success',
      message: `บันทึกสถานะ "ส่งชุดตรวจ" และข้อมูลสุขภาพของ HN: ${updated.hn} (${updated.prefix}${updated.firstName} ${updated.lastName}) เรียบร้อยแล้ว`
    });

    setTimeout(() => setNotification(null), 4000);
  };

  // Filtered patients needing kit receive
  const pendingReceivePatients = patients.filter(p => p.kitStatus === 'not_received');
  const alreadyReceivedPatients = patients.filter(p => p.kitStatus === 'received' || p.kitStatus === 'tested');

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Scan Action */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md mb-2">
              <PackageCheck className="w-3.5 h-3.5" />
              หน้าที่ 3: จุดรับชุดตรวจและตรวจวัดสัญญาณชีพ
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              ลงทะเบียนรับชุดตรวจที่มาส่ง (Return Kit) & บันทึกข้อมูลสุขภาพ
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              ใช้กล้องสแกน Barcode/QR อ่าน HN ผู้ป่วย บันทึกสถานะ "ส่งชุดตรวจ" และบันทึก สส., นน., รอบเอว, ความดันโลหิต
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2.5 self-start md:self-auto"
          >
            <Camera className="w-5 h-5" />
            <span>สแกน Barcode / QR รับชุดตรวจ</span>
          </button>
        </div>

        {notification && (
          <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Patient Search & Select */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-600" />
                ค้นหาผู้ป่วยเพื่อรับชุดตรวจ
              </h3>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                รอส่งชุด {pendingReceivePatients.length} คน
              </span>
            </div>

            <div className="relative mb-3">
              <input
                type="text"
                value={searchHn}
                onChange={(e) => setSearchHn(e.target.value)}
                placeholder="พิมพ์ค้นหา HN หรือ ชื่อผู้ป่วย..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>

            {/* List of patients to click */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {patients
                .filter(p => {
                  const q = searchHn.toLowerCase().trim();
                  if (!q) return true;
                  return p.hn.toLowerCase().includes(q) || p.firstName.toLowerCase().includes(q) || p.lastName.toLowerCase().includes(q);
                })
                .map(p => {
                  const isSelected = selectedPatient?.id === p.id;
                  const isReceived = p.kitStatus === 'received' || p.kitStatus === 'tested';

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPatient(p)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-mono font-bold text-xs text-emerald-800">
                          HN: {p.hn}
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isReceived 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isReceived ? 'ส่งชุดตรวจแล้ว' : 'ยังไม่ส่งชุดตรวจ'}
                        </span>
                      </div>
                      <div className="font-medium text-slate-900 text-sm mt-0.5">
                        {p.prefix}{p.firstName} {p.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
                        <span>ม.{p.villageNo} {p.villageName} (อายุ {p.ageYears} ปี)</span>
                        <span className="text-slate-400 font-mono text-[10px]">{p.benefitCode}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Right Column: Vitals Form & Confirmation */}
        <div className="lg:col-span-7">
          {selectedPatient ? (
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-6">
              {/* Patient Profile Card Header */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-800 text-base">HN: {selectedPatient.hn}</span>
                    <span className="text-xs text-slate-400">• CID: {selectedPatient.idCard}</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mt-0.5">
                    {selectedPatient.prefix}{selectedPatient.firstName} {selectedPatient.lastName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    ที่อยู่: บ้านเลขที่ {selectedPatient.houseNo} หมู่ {selectedPatient.villageNo} {selectedPatient.villageName} | เพศ {selectedPatient.gender} | อายุ {selectedPatient.ageYears} ปี
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    สิทธิ: <strong>{selectedPatient.benefitName}</strong> | โรคประจำตัว: <strong>{selectedPatient.underlyingDisease || 'ไม่มี'}</strong>
                  </p>
                </div>

                <div className="flex flex-col items-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selectedPatient.kitStatus === 'not_received' 
                      ? 'bg-amber-100 text-amber-800 animate-pulse' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {selectedPatient.kitStatus === 'not_received' ? 'รอรับชุดตรวจ' : 'ส่งชุดตรวจแล้ว'}
                  </span>
                  {selectedPatient.kitReceivedDate && (
                    <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedPatient.kitReceivedDate}
                    </span>
                  )}
                </div>
              </div>

              {/* Vital Signs Form: สส. นน. เอว ความดันโลหิต */}
              <form onSubmit={handleSaveSampleReceive} className="space-y-5">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <HeartPulse className="w-4 h-4 text-emerald-600" />
                  บันทึกข้อมูลสุขภาพและสัญญาณชีพ (Vital Signs)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ส่วนสูง สส. */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5 text-emerald-600" />
                        ส่วนสูง (สส.) <span className="text-rose-500">*</span>
                      </span>
                      <span className="text-[11px] text-slate-400">เซนติเมตร (cm)</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="100"
                      max="220"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      required
                      placeholder="เช่น 165"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                    />
                  </div>

                  {/* น้ำหนัก นน. */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-emerald-600" />
                        น้ำหนัก (นน.) <span className="text-rose-500">*</span>
                      </span>
                      <span className="text-[11px] text-slate-400">กิโลกรัม (kg)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="30"
                      max="200"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      required
                      placeholder="เช่น 62.5"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                    />
                  </div>

                  {/* รอบเอว */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>รอบเอว (นิ้ว / ซม.) <span className="text-rose-500">*</span></span>
                      <span className="text-[11px] text-slate-400">
                        {waistInch ? `≈ ${(parseFloat(waistInch) * 2.54).toFixed(1)} ซม.` : ''}
                      </span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="20"
                          max="60"
                          value={waistInch}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWaistInch(val);
                            if (val) setWaistCm(String(Math.round(parseFloat(val) * 2.54)));
                          }}
                          placeholder="รอบเอว (นิ้ว)"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                        <span className="absolute right-2.5 top-2 text-xs text-slate-400">นิ้ว</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="50"
                          max="150"
                          value={waistCm}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWaistCm(val);
                            if (val) setWaistInch(String((parseFloat(val) / 2.54).toFixed(1)));
                          }}
                          placeholder="รอบเอว (ซม.)"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                        <span className="absolute right-2.5 top-2 text-xs text-slate-400">ซม.</span>
                      </div>
                    </div>
                  </div>

                  {/* ความดันโลหิต */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                        ความดันโลหิต (BP) <span className="text-rose-500">*</span>
                      </span>
                      <span className="text-[11px] text-slate-400">Systolic / Diastolic mmHg</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="70"
                        max="240"
                        value={bpSys}
                        onChange={(e) => setBpSys(e.target.value)}
                        placeholder="120"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono text-center"
                      />
                      <span className="text-slate-400 font-bold">/</span>
                      <input
                        type="number"
                        min="40"
                        max="140"
                        value={bpDia}
                        onChange={(e) => setBpDia(e.target.value)}
                        placeholder="80"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono text-center"
                      />
                      <span className="text-xs text-slate-400 whitespace-nowrap">mmHg</span>
                    </div>
                  </div>
                </div>

                {/* BMI badge */}
                {currentBmi && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">ดัชนีมวลกาย (BMI คำนวณอัตโนมัติ):</span>
                      <span className="font-mono font-bold text-emerald-800 text-sm">{currentBmi} kg/m²</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      parseFloat(currentBmi) < 18.5 
                        ? 'bg-blue-100 text-blue-800' 
                        : parseFloat(currentBmi) <= 22.9 
                        ? 'bg-emerald-100 text-emerald-800'
                        : parseFloat(currentBmi) <= 24.9
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {parseFloat(currentBmi) < 18.5 ? 'น้ำหนักน้อย' : parseFloat(currentBmi) <= 22.9 ? 'สมส่วน (ปกติ)' : parseFloat(currentBmi) <= 24.9 ? 'น้ำหนักเกิน (ท้วม)' : 'โรคอ้วน'}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">
                    * เมื่อกดบันทึก ระบบจะเปลี่ยนสถานะเป็น <strong className="text-emerald-700">"ส่งชุดตรวจ"</strong> พร้อมส่งต่อห้องปฏิบัติการ
                  </span>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs flex items-center gap-2"
                    >
                      <PackageCheck className="w-4 h-4" />
                      บันทึกสถานะ "ส่งชุดตรวจ" & ข้อมูลสุขภาพ
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateToResult(selectedPatient.hn)}
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                      title="ไปตรวจผลต่อทันที"
                    >
                      ไปบันทึกผล FIT Test →
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs flex flex-col items-center justify-center min-h-[380px]">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                พร้อมสแกนหรือเลือกผู้ป่วยเพื่อรับชุดตรวจ
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5">
                กดปุ่ม "สแกน Barcode / QR" เพื่อใช้กล้องอ่านเลข HN หรือคลิกเลือกรายชื่อผู้ป่วยจากตารางด้านซ้ายมือ
              </p>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                เปิดกล้องสแกน Barcode / QR ทันที
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Camera Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="สแกนรับชุดตรวจ FIT Test (จุดคัดกรอง)"
        description="หันกล้องไปที่ Barcode หรือ QR Code ของหลอดเก็บอุจจาระหรือบัตร HN"
        patients={patients}
      />
    </div>
  );
};
