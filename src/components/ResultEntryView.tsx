import React, { useState } from 'react';
import { PatientScreening, FitResultType } from '../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { 
  FlaskConical, 
  Camera, 
  Search, 
  CheckCircle2, 
  AlertOctagon, 
  HelpCircle, 
  UserCheck, 
  AlertCircle,
  ArrowRight,
  Sparkles,
  Clock,
  Send
} from 'lucide-react';

interface ResultEntryViewProps {
  patients: PatientScreening[];
  initialHn?: string;
  onUpdatePatient: (updated: PatientScreening) => void;
  onNavigateToReferral: (hn?: string) => void;
  currentUserName?: string;
}

export const ResultEntryView: React.FC<ResultEntryViewProps> = ({
  patients,
  initialHn,
  onUpdatePatient,
  onNavigateToReferral,
  currentUserName
}) => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedHn, setSelectedHn] = useState<string>(initialHn || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [testedBy, setTestedBy] = useState(currentUserName ? `${currentUserName} (รพ.โพนนาแก้ว)` : 'เจ้าหน้าที่ห้องปฏิบัติการ รพ.โพนนาแก้ว');
  const [lotNo, setLotNo] = useState('FIT-202609A');
  const [notes, setNotes] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string; isPositive?: boolean; patientHn?: string } | null>(null);

  // Find currently selected patient
  const selectedPatient = patients.find(p => p.hn.toLowerCase() === selectedHn.toLowerCase()) || null;

  const handleScanSuccess = (scannedCode: string) => {
    setIsScannerOpen(false);
    const matched = patients.find(p => 
      p.hn.toLowerCase() === scannedCode.toLowerCase() ||
      p.idCard === scannedCode
    );

    if (matched) {
      setSelectedHn(matched.hn);
      setNotes(matched.notes || '');
      setNotification({
        type: 'success',
        message: `สแกนสำเร็จ! พบข้อมูลผู้ป่วย: HN ${matched.hn} (${matched.prefix}${matched.firstName} ${matched.lastName})`
      });
    } else {
      setNotification({
        type: 'error',
        message: `ไม่พบข้อมูลผู้ป่วยสำหรับรหัส "${scannedCode}" กรุณาตรวจสอบเลข HN`
      });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSelectResult = (result: FitResultType) => {
    if (!selectedPatient) return;

    const nowStr = new Date().toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    let autoReferral = selectedPatient.referral;
    if (result === 'positive' && !autoReferral) {
      // Auto draft referral to Sakon Nakhon Hospital
      const refCount = patients.filter(p => p.referral).length + 1;
      const refNo = `PNK-REF-2569-${String(refCount).padStart(3, '0')}`;
      
      // Default appointment 2 weeks from now
      const apptDate = new Date();
      apptDate.setDate(apptDate.getDate() + 14);
      const apptDateStr = apptDate.toISOString().split('T')[0];

      autoReferral = {
        referralNo: refNo,
        destinationHospital: 'โรงพยาบาลสกลนคร',
        department: 'ศูนย์ส่องกล้องระบบทางเดินอาหาร (Endoscopy Unit)',
        appointmentDate: apptDateStr,
        appointmentTime: '09:00',
        referralReason: 'ตรวจคัดกรองมะเร็งลำไส้ใหญ่ด้วยวิธี FIT Test ได้ผลบวก (Positive Code 1B0061)',
        referralDoctor: 'นพ.อภิชาติ ปัญญาเลิศ (ว.45892)',
        bowelPrepInstruction: 'รับยาระบาย Swiff/Klean-Prep ตามใบคำแนะนำ งดอาหารกากใย 3 วันก่อนวันนัด และงดน้ำงดอาหารหลังเที่ยงคืน',
        status: 'pending_referral',
        createdDate: nowStr
      };
    }

    const updated: PatientScreening = {
      ...selectedPatient,
      kitStatus: 'tested',
      fitResult: result,
      testedDate: nowStr,
      testedBy: testedBy.trim() || 'เจ้าหน้าที่ห้องแล็บ รพ.โพนนาแก้ว',
      testLotNo: lotNo.trim(),
      notes: notes.trim() || (result === 'positive' ? 'พบผลบวก (Positive 1B0061)' : result === 'negative' ? 'ผลลบ (Negative 1B0060)' : 'ออกผลไม่ได้ (Inconclusive)'),
      referral: autoReferral
    };

    onUpdatePatient(updated);

    if (result === 'positive') {
      setNotification({
        type: 'success',
        isPositive: true,
        patientHn: updated.hn,
        message: `บันทึกผล "Positive (ผลบวก)" รหัส 1B0061 สำหรับ HN: ${updated.hn} เรียบร้อยแล้ว (สร้างใบส่งต่อไปยัง รพ.สกลนคร)`
      });
    } else if (result === 'negative') {
      setNotification({
        type: 'success',
        message: `บันทึกผล "Negative (ผลลบ)" รหัส 1B0060 สำหรับ HN: ${updated.hn} สำเร็จ (นัดตรวจซ้ำอีก 2 ปี)`
      });
    } else {
      setNotification({
        type: 'success',
        message: `บันทึกผล "Inconclusive (ออกผลไม่ได้)" สำหรับ HN: ${updated.hn} สำเร็จ (แนะนำให้เก็บตัวอย่างซ้ำ)`
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Barcode Scan Trigger */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-md mb-2">
              <FlaskConical className="w-3.5 h-3.5" />
              หน้าที่ 4: บันทึกผลตรวจคัดกรอง FIT Test (ห้องปฏิบัติการ/ชันสูตร)
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              บันทึกผลตรวจคัดกรอง (Scan Barcode/QR อ่าน HN อัตโนมัติ)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              สแกน Barcode/QR เพื่อดึงชื่อผู้ป่วยขึ้นมาอัตโนมัติ จากนั้นกดเลือกผลตรวจ: สีแดง Positive, สีเขียว Negative, สีดำ Inconclusive
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2.5 self-start md:self-auto"
          >
            <Camera className="w-5 h-5" />
            <span>สแกนกล้องอ่าน HN อัตโนมัติ</span>
          </button>
        </div>

        {/* Dynamic Notification & Positive Referral Shortcut */}
        {notification && (
          <div className={`mt-4 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm ${
            notification.isPositive
              ? 'bg-rose-50 border-2 border-rose-300 text-rose-900'
              : notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-3">
              {notification.isPositive ? (
                <AlertOctagon className="w-6 h-6 text-rose-600 flex-shrink-0 animate-bounce" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              )}
              <div>
                <div className="font-bold">{notification.message}</div>
                {notification.isPositive && (
                  <p className="text-xs text-rose-700 mt-0.5">
                    ผู้ป่วยจำเป็นต้องได้รับการส่งต่อส่องกล้อง Colonoscopy ที่โรงพยาบาลสกลนคร
                  </p>
                )}
              </div>
            </div>

            {notification.isPositive && (
              <button
                type="button"
                onClick={() => onNavigateToReferral(notification.patientHn)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>เปิดใบส่งต่อ รพ.สกลนคร ทันที</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Select / Search Patient */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-600" />
                เลือกผู้ป่วยที่ต้องการออกผลตรวจ
              </h3>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                ทั้งหมด {patients.length} คน
              </span>
            </div>

            <div className="relative mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="พิมพ์ค้นหา HN หรือ ชื่อผู้ป่วย..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
              {patients
                .filter(p => {
                  const q = searchQuery.toLowerCase().trim();
                  if (!q) return true;
                  return p.hn.toLowerCase().includes(q) || p.firstName.toLowerCase().includes(q) || p.lastName.toLowerCase().includes(q);
                })
                .map(p => {
                  const isSelected = selectedPatient?.id === p.id;
                  let badge = (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      ยังไม่ตรวจ
                    </span>
                  );
                  if (p.fitResult === 'positive') {
                    badge = (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        Positive (1B0061)
                      </span>
                    );
                  } else if (p.fitResult === 'negative') {
                    badge = (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Negative (1B0060)
                      </span>
                    );
                  } else if (p.fitResult === 'inconclusive') {
                    badge = (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-white">
                        Inconclusive
                      </span>
                    );
                  }

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedHn(p.hn);
                        setNotes(p.notes || '');
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-emerald-800">
                          HN: {p.hn}
                        </span>
                        {badge}
                      </div>
                      <div className="font-medium text-slate-900 text-sm mt-0.5">
                        {p.prefix}{p.firstName} {p.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
                        <span>ม.{p.villageNo} {p.villageName} (อายุ {p.ageYears} ปี)</span>
                        <span className="text-slate-400 text-[10px]">
                          {p.kitStatus === 'tested' ? 'บันทึกแล้ว' : p.kitStatus === 'received' ? 'รับชุดตรวจแล้ว' : 'ยังไม่ส่งชุด'}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Right Side: Active Patient Pop-up & 3 Big Result Buttons */}
        <div className="lg:col-span-7">
          {selectedPatient ? (
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-6">
              {/* Patient Card (เด้งขึ้นมาเมื่อสแกนหรือเลือก) */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/70 to-teal-50/50 border-2 border-emerald-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    ผู้ป่วยที่สแกนพบ (พร้อมบันทึกผลตรวจ)
                  </span>
                  <span className="font-mono font-bold text-base text-emerald-900 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300">
                    HN: {selectedPatient.hn}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {selectedPatient.prefix}{selectedPatient.firstName} {selectedPatient.lastName}
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600 mt-2.5 pt-2 border-t border-emerald-200/60">
                  <div>
                    <span className="text-slate-400">เลขบัตร ปชช.:</span>
                    <div className="font-mono font-semibold text-slate-800">{selectedPatient.idCard}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">อายุ / เพศ:</span>
                    <div className="font-semibold text-slate-800">{selectedPatient.ageYears} ปี / {selectedPatient.gender}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">ที่อยู่:</span>
                    <div className="font-semibold text-slate-800 truncate">
                      ม.{selectedPatient.villageNo} {selectedPatient.villageName}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">สิทธิการรักษา:</span>
                    <div className="font-semibold text-slate-800">{selectedPatient.benefitName}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">โรคประจำตัว:</span>
                    <div className="font-semibold text-slate-800">{selectedPatient.underlyingDisease || 'ไม่มี'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">ความดัน / สัญญาณชีพ:</span>
                    <div className="font-semibold text-slate-800">
                      {selectedPatient.bloodPressureSys ? `${selectedPatient.bloodPressureSys}/${selectedPatient.bloodPressureDia} mmHg` : '-'}
                    </div>
                  </div>
                </div>

                {/* Current Status if already tested */}
                {selectedPatient.fitResult !== 'pending' && (
                  <div className="mt-3 p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">ผลตรวจปัจจุบันที่บันทึกไว้:</span>
                    <span className={`font-bold px-2.5 py-1 rounded-md text-xs ${
                      selectedPatient.fitResult === 'positive' 
                        ? 'bg-rose-100 text-rose-800' 
                        : selectedPatient.fitResult === 'negative'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-900 text-white'
                    }`}>
                      {selectedPatient.fitResult === 'positive' ? '🔴 Positive (1B0061)' : selectedPatient.fitResult === 'negative' ? '🟢 Negative (1B0060)' : '⚫ Inconclusive'}
                    </span>
                  </div>
                )}
              </div>

              {/* 3 Large Action Result Buttons Requested by User */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  กดเลือกผลตรวจคัดกรอง FIT Test ทันที:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* 1. สีแดง "Positive" */}
                  <button
                    type="button"
                    onClick={() => handleSelectResult('positive')}
                    className="p-5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:shadow-lg transition-all text-left flex flex-col justify-between border-2 border-rose-700 active:scale-98 group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                        </span>
                        <span className="text-[11px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full">
                          1B0061
                        </span>
                      </div>
                      <div className="text-xl font-bold tracking-tight">
                        Positive
                      </div>
                      <div className="text-xs font-semibold text-rose-100 mt-0.5">
                        (ผลบวก - พบเลือดแฝง)
                      </div>
                    </div>
                    <p className="text-[11px] text-rose-100/90 mt-4 pt-2 border-t border-rose-500/60 leading-tight">
                      * ปรากฏ 2 ขีด (C & T) ต้องส่งต่อส่องกล้อง Colonoscopy รพ.สกลนคร
                    </p>
                  </button>

                  {/* 2. สีเขียว "Negative" */}
                  <button
                    type="button"
                    onClick={() => handleSelectResult('negative')}
                    className="p-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all text-left flex flex-col justify-between border-2 border-emerald-700 active:scale-98 group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        </span>
                        <span className="text-[11px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full">
                          1B0060
                        </span>
                      </div>
                      <div className="text-xl font-bold tracking-tight">
                        Negative
                      </div>
                      <div className="text-xs font-semibold text-emerald-100 mt-0.5">
                        (ผลลบ - ปกติ)
                      </div>
                    </div>
                    <p className="text-[11px] text-emerald-100/90 mt-4 pt-2 border-t border-emerald-500/60 leading-tight">
                      * ปรากฏ 1 ขีดที่แถบ C ไม่พบเลือดแฝง นัดตรวจซ้ำอีก 2 ปีตามเกณฑ์
                    </p>
                  </button>

                  {/* 3. สีดำ "Inconclusive" */}
                  <button
                    type="button"
                    onClick={() => handleSelectResult('inconclusive')}
                    className="p-5 rounded-2xl bg-slate-900 hover:bg-black text-white shadow-md hover:shadow-lg transition-all text-left flex flex-col justify-between border-2 border-slate-950 active:scale-98 group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                        </span>
                        <span className="text-[11px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full">
                          Re-test
                        </span>
                      </div>
                      <div className="text-xl font-bold tracking-tight">
                        Inconclusive
                      </div>
                      <div className="text-xs font-semibold text-slate-300 mt-0.5">
                        (ออกผลไม่ได้)
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300/90 mt-4 pt-2 border-t border-slate-700 leading-tight">
                      * แถบ C ไม่ขึ้น หรือสิ่งส่งตรวจไม่สมบูรณ์ ต้องจ่ายชุดตรวจใหม่ให้ทำซ้ำ
                    </p>
                  </button>

                </div>
              </div>

              {/* Lab Metadata Inputs: Lot No & Tested By & Notes */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Lot No. ชุดตรวจ FIT Test:
                    </label>
                    <input
                      type="text"
                      value={lotNo}
                      onChange={(e) => setLotNo(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      ผู้ตรวจ / เจ้าหน้าที่ห้องปฏิบัติการ:
                    </label>
                    <input
                      type="text"
                      value={testedBy}
                      onChange={(e) => setTestedBy(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    หมายเหตุ / บันทึกเพิ่มเติม:
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="เช่น ขีดทดสอบเข้มชัดเจน หรือ มีประวัติถ่ายดำ..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs flex flex-col items-center justify-center min-h-[420px]">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                พร้อมสแกน Barcode/QR เพื่ออ่าน HN อัตโนมัติ
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5">
                เมื่อสแกนแล้ว ข้อมูลผู้ป่วยจะเด้งขึ้นมาทันที เพื่อให้ท่านกดปุ่มเลือกผลตรวจ สีแดง (Positive), สีเขียว (Negative) หรือ สีดำ (Inconclusive)
              </p>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                เปิดกล้องสแกน Barcode / QR อ่าน HN ทันที
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="สแกน Barcode / QR อ่าน HN ออกผลตรวจ"
        description="หันกล้องไปที่บาร์โค้ดบนหลอดสิ่งส่งตรวจหรือบัตรผู้ป่วย"
        patients={patients}
      />
    </div>
  );
};
