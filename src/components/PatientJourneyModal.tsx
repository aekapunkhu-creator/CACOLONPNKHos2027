import React, { useState } from 'react';
import { 
  PatientScreening, 
  CaColonTracking, 
  CaColonStatus,
  BowelPrepStatus,
  ColonoscopyFinding,
  BiopsyResult 
} from '../types';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Microscope, 
  FileText, 
  Pill, 
  Plus, 
  PhoneCall, 
  Building2, 
  Save, 
  Sparkles,
  ShieldAlert,
  ChevronRight,
  Stethoscope
} from 'lucide-react';

interface PatientJourneyModalProps {
  patient: PatientScreening;
  onClose: () => void;
  onUpdatePatient: (updated: PatientScreening) => void;
  onOpenCallLog: () => void;
  onOpenAppointment: () => void;
  onOpenColonoscopy: () => void;
}

export const PatientJourneyModal: React.FC<PatientJourneyModalProps> = ({
  patient,
  onClose,
  onUpdatePatient,
  onOpenCallLog,
  onOpenAppointment,
  onOpenColonoscopy
}) => {
  const tracking: CaColonTracking = patient.caTracking || {
    status: 'pending_contact',
    fitPositiveDate: patient.testedDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    callLogs: []
  };

  const [clinicalNotes, setClinicalNotes] = useState(tracking.clinicalNotes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveSuccess, setNotesSaveSuccess] = useState(false);

  // Overdue check
  const fitDateStr = tracking.fitPositiveDate || patient.testedDate?.slice(0, 10);
  let daysSinceFit: number | null = null;
  let isOverdue = false;

  if (fitDateStr) {
    const fitDate = new Date(fitDateStr);
    const now = new Date('2026-09-21'); // system reference date or current date
    const diffTime = Math.max(0, now.getTime() - fitDate.getTime());
    daysSinceFit = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    // Overdue if > 7 days and has not completed scheduling / colonoscopy
    if (daysSinceFit > 7 && (tracking.status === 'pending_contact' || tracking.status === 'contacted' || tracking.status === 'cannot_contact')) {
      isOverdue = true;
    }
  }

  const handleSaveClinicalNotes = () => {
    setIsSavingNotes(true);
    const updatedTracking = {
      ...tracking,
      clinicalNotes: clinicalNotes.trim(),
      updatedAt: new Date().toISOString()
    };
    const updated = {
      ...patient,
      caTracking: updatedTracking
    };
    onUpdatePatient(updated);

    setTimeout(() => {
      setIsSavingNotes(false);
      setNotesSaveSuccess(true);
      setTimeout(() => setNotesSaveSuccess(false), 2500);
    }, 300);
  };

  // Helper for status badge
  const getStatusBadge = (status: CaColonStatus) => {
    switch (status) {
      case 'pending_contact':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            รอติดต่อแจ้งผล (Pending Contact)
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <Phone className="w-3.5 h-3.5 text-blue-700" />
            ติดต่อสำเร็จ / รอนัด (Contacted)
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
            <Calendar className="w-3.5 h-3.5 text-purple-700" />
            นัดส่องกล้องแล้ว (Scheduled)
          </span>
        );
      case 'prep_in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-900 border border-cyan-300">
            <Pill className="w-3.5 h-3.5 text-cyan-700" />
            กำลังเตรียมตัว / รับยาระบายแล้ว
          </span>
        );
      case 'colonoscopy_done':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
            <Activity className="w-3.5 h-3.5 text-indigo-700" />
            ส่องกล้องเรียบร้อย (รอผลชิ้นเนื้อ)
          </span>
        );
      case 'biopsy_reported':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            ผลชิ้นเนื้อออกแล้ว / มีแผนรักษา
          </span>
        );
      case 'refused':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
            ผู้ป่วยปฏิเสธการส่องกล้อง (Refused)
          </span>
        );
      case 'cannot_contact':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">
            <AlertCircle className="w-3.5 h-3.5 text-slate-600" />
            ติดต่อไม่ได้ (Cannot Contact)
          </span>
        );
      default:
        return null;
    }
  };

  const getBowelPrepLabel = (status?: BowelPrepStatus) => {
    switch (status) {
      case 'not_started': return 'ยังไม่เริ่มเตรียมลำไส้';
      case 'received_meds': return 'ได้รับยาระบาย Swiff/Klean-Prep แล้ว';
      case 'diet_restricted': return 'เริ่มงดกากใย (Low Fiber Diet)';
      case 'prep_completed': return 'เตรียมลำไส้เรียบร้อย ถ่ายเป็นน้ำใส';
      case 'problem_encountered': return 'มีปัญหาในการดื่มยาระบาย';
      default: return 'ยังไม่ระบุ';
    }
  };

  const getFindingLabel = (finding?: ColonoscopyFinding) => {
    switch (finding) {
      case 'normal': return 'ปกติ ไม่พบติ่งเนื้อหรือรอยโรค';
      case 'polyps_removed': return 'พบติ่งเนื้อและตัดออกแล้ว (Polypectomy)';
      case 'suspected_cancer': return 'พบก้อนเนื้อสงสัยมะเร็ง (Malignancy/Tumor)';
      case 'ulcer_inflammation': return 'แผลหรือการอักเสบในลำไส้ (Colitis/Ulcer)';
      case 'stricture': return 'ลำไส้ตีบแคบ (Stricture)';
      case 'other': return 'อื่นๆ';
      default: return 'รอเข้ารับการส่องกล้อง';
    }
  };

  const getBiopsyLabel = (biopsy?: BiopsyResult) => {
    switch (biopsy) {
      case 'benign_polyp': return 'ติ่งเนื้อธรรมดา (Hyperplastic Polyp)';
      case 'tubular_adenoma': return 'Tubular / Villous Adenoma';
      case 'high_grade_dysplasia': return 'Adenoma with High-Grade Dysplasia';
      case 'adenocarcinoma': return 'มะเร็งลำไส้ใหญ่ (Adenocarcinoma)';
      case 'not_indicated': return 'ไม่ได้ตัดชิ้นเนื้อ (ตรวจปกติ)';
      case 'other': return 'อื่นๆ';
      case 'pending': return 'กำลังตรวจวิเคราะห์ (รอผลแล็บ)';
      default: return '-';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-emerald-950 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
              <Activity className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">เส้นทางการดูแลผู้ป่วย (Patient Journey)</h3>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/30 border border-rose-400/40 text-rose-200">
                  สงสัย CA Colon (FIT Positive)
                </span>
              </div>
              <p className="text-teal-200/80 text-xs">
                โรงพยาบาลโพนนาแก้ว • การติดตามเชิงรุกและการส่งต่อส่องกล้องรพ.สกลนคร
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Summary Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm border border-teal-200">
              {patient.prefix === 'นาย' ? '👨' : '👩'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base">
                  {patient.prefix}{patient.firstName} {patient.lastName}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-mono font-medium">
                  HN: {patient.hn}
                </span>
                <span className="text-xs text-slate-500">
                  (อายุ {patient.ageYears} ปี • เพศ{patient.gender})
                </span>
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  บ้านเลขที่ {patient.houseNo} ม.{patient.villageNo} {patient.villageName} ต.{patient.subdistrict || 'นาแก้ว'}
                </span>
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  {patient.phone || 'ยังไม่มีเบอร์'}
                </span>
                <span className="text-slate-500">
                  สิทธิ: {patient.benefitName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge(tracking.status)}
            {isOverdue && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                เกินกำหนด 7 วัน ({daysSinceFit} วัน)
              </span>
            )}
          </div>
        </div>

        {/* Quick Action Buttons Toolbar */}
        <div className="px-6 py-2.5 bg-teal-50/50 border-b border-teal-100 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold text-teal-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>ปุ่มลัดดำเนินการสำหรับเคสนี้:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCallLog}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              บันทึกการโทร
            </button>
            <button
              onClick={onOpenAppointment}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              เลื่อนนัด / บันทึกนัด
            </button>
            <button
              onClick={onOpenColonoscopy}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              บันทึกผลส่องกล้อง
            </button>
          </div>
        </div>

        {/* Modal Main Content: Timeline + Clinical Notes */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* TIMELINE SECTION */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              ลำดับขั้นตอนการดูแลผู้ป่วย (Patient Journey Timeline)
            </h4>

            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {/* Step 1: FIT Positive */}
              <div className="relative">
                <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  1
                </div>
                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-rose-900">ตรวจคัดกรอง FIT Test ได้ผลบวก (Positive)</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-200 text-rose-900">
                          รหัส 1B0061
                        </span>
                      </div>
                      <div className="text-xs text-rose-700 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>วันที่ตรวจแล็บ: <strong>{patient.testedDate || tracking.fitPositiveDate || '-'}</strong></span>
                        <span>Lot No: <strong>{patient.testLotNo || 'FIT-202609A'}</strong></span>
                        <span>ผู้ตรวจ: <strong>{patient.testedBy || 'ห้องปฏิบัติการ รพ.โพนนาแก้ว'}</strong></span>
                      </div>
                    </div>
                    {daysSinceFit !== null && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        daysSinceFit > 7 ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {daysSinceFit} วันที่ผ่านมา {daysSinceFit > 7 ? '⚠️ เกินกำหนด' : ''}
                      </span>
                    )}
                  </div>
                  {patient.notes && (
                    <div className="mt-2 text-xs text-rose-800 bg-rose-100/60 p-2 rounded-lg">
                      <span className="font-semibold">บันทึกผลแล็บ:</span> {patient.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Contacted / Call Logs */}
              <div className="relative">
                <div className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-xs ${
                  tracking.contactDate || (tracking.callLogs && tracking.callLogs.length > 0)
                    ? 'bg-blue-600'
                    : 'bg-slate-400'
                }`}>
                  2
                </div>
                <div className={`p-4 rounded-xl border ${
                  tracking.contactDate || (tracking.callLogs && tracking.callLogs.length > 0)
                    ? 'bg-blue-50/70 border-blue-200'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">เจ้าหน้าที่ติดต่อแจ้งผล & ให้คำแนะนำ</span>
                        {tracking.contactDate ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                            ติดต่อสำเร็จแล้ว
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                            อยู่ระหว่างดำเนินการ
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>วันที่ติดต่อ: <strong>{tracking.contactDate || 'ยังไม่มีบันทึก'}</strong></span>
                        <span>ผู้ติดต่อ: <strong>{tracking.contactOfficer || 'นายเอกพันธ์ ขันติ'}</strong></span>
                      </div>
                    </div>
                    <button
                      onClick={onOpenCallLog}
                      className="px-2.5 py-1 text-xs font-semibold bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg shadow-2xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      เพิ่มบันทึกการโทร
                    </button>
                  </div>

                  {/* Call logs history */}
                  {(tracking.callLogs && tracking.callLogs.length > 0) && (
                    <div className="mt-3 space-y-1.5">
                      <div className="text-xs font-bold text-slate-700">ประวัติการโทร ({tracking.callLogs.length} ครั้ง):</div>
                      {tracking.callLogs.map(log => (
                        <div key={log.id} className="p-2 bg-white rounded-lg border border-blue-100 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{log.date} ({log.caller})</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {log.outcome === 'answered_agreed' && '✅ รับสาย ยินยอมนัด'}
                              {log.outcome === 'answered_hesitant' && '⏳ รับสาย ลังเล/ปรึกษาญาติ'}
                              {log.outcome === 'answered_refused' && '❌ รับสาย ปฏิเสธตรวจ'}
                              {log.outcome === 'no_answer' && '📴 ไม่มีผู้รับสาย'}
                              {log.outcome === 'wrong_number' && '⚠️ เบอร์ผิด/ติดต่อไม่ได้'}
                              {log.outcome === 'busy' && '⌛ สายไม่ว่าง'}
                            </span>
                          </div>
                          {log.notes && <p className="text-slate-600 mt-1">{log.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Appointment & Bowel Prep */}
              <div className="relative">
                <div className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-xs ${
                  tracking.appointmentDate || patient.referral?.appointmentDate
                    ? 'bg-purple-600'
                    : 'bg-slate-400'
                }`}>
                  3
                </div>
                <div className={`p-4 rounded-xl border ${
                  tracking.appointmentDate || patient.referral?.appointmentDate
                    ? 'bg-purple-50/70 border-purple-200'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">วันเวลานัดส่องกล้อง & เตรียมตัว</span>
                        {(tracking.appointmentDate || patient.referral?.appointmentDate) ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
                            นัดหมายแล้ว
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                            ยังไม่ได้นัด
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>โรงพยาบาล: <strong>{tracking.hospitalName || patient.referral?.destinationHospital || 'โรงพยาบาลสกลนคร'}</strong></span>
                        <span>วันเวลานัด: <strong>{tracking.appointmentDate || patient.referral?.appointmentDate || 'รอนัดหมาย'} {tracking.appointmentTime || patient.referral?.appointmentTime || ''}</strong></span>
                      </div>
                    </div>
                    <button
                      onClick={onOpenAppointment}
                      className="px-2.5 py-1 text-xs font-semibold bg-white border border-purple-300 text-purple-700 hover:bg-purple-50 rounded-lg shadow-2xs flex items-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      {tracking.appointmentDate ? 'เลื่อนนัด/แก้นัด' : 'ลงเวลานัด'}
                    </button>
                  </div>

                  {/* Preparation Details */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-white rounded-lg border border-purple-100">
                      <div className="text-slate-500 font-medium">การเตรียมลำไส้ (Bowel Prep):</div>
                      <div className="font-bold text-purple-900 mt-0.5 flex items-center gap-1">
                        <Pill className="w-3.5 h-3.5 text-purple-600" />
                        {getBowelPrepLabel(tracking.bowelPrepStatus)}
                      </div>
                      {tracking.bowelPrepNotes && (
                        <p className="text-slate-600 text-[11px] mt-1">{tracking.bowelPrepNotes}</p>
                      )}
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-purple-100">
                      <div className="text-slate-500 font-medium">ญาติ / ผู้ร่วมเดินทาง:</div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {tracking.companionName || 'ยังไม่ระบุ'}
                      </div>
                      {tracking.companionPhone && (
                        <div className="text-slate-600 text-[11px] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {tracking.companionPhone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Colonoscopy Procedure */}
              <div className="relative">
                <div className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-xs ${
                  tracking.colonoscopyDate
                    ? 'bg-indigo-600'
                    : 'bg-slate-400'
                }`}>
                  4
                </div>
                <div className={`p-4 rounded-xl border ${
                  tracking.colonoscopyDate
                    ? 'bg-indigo-50/70 border-indigo-200'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">ผลการตรวจส่องกล้อง (Colonoscopy Result)</span>
                        {tracking.colonoscopyDate ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold">
                            ส่องกล้องแล้ว
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                            รอการส่องกล้อง
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>วันที่ส่องกล้อง: <strong>{tracking.colonoscopyDate || '-'}</strong></span>
                        <span>แพทย์: <strong>{tracking.colonoscopyDoctor || '-'}</strong></span>
                        <span>ผลตรวจ: <strong>{getFindingLabel(tracking.colonoscopyFinding)}</strong></span>
                      </div>
                    </div>
                    <button
                      onClick={onOpenColonoscopy}
                      className="px-2.5 py-1 text-xs font-semibold bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 rounded-lg shadow-2xs flex items-center gap-1"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      {tracking.colonoscopyDate ? 'แก้ไขผลส่องกล้อง' : 'บันทึกผลส่องกล้อง'}
                    </button>
                  </div>

                  {tracking.colonoscopyFinding === 'polyps_removed' && (
                    <div className="mt-2.5 p-2 bg-indigo-100/60 rounded-lg text-xs text-indigo-950 font-medium">
                      ✂️ ทำ Polypectomy ตัดติ่งเนื้อ {tracking.polypCount ?? 1} ชิ้น ตำแหน่ง/ขนาด: {tracking.polypSizeLocation || 'ระบุในผลแล็บ'}
                    </div>
                  )}

                  {tracking.colonoscopyDetails && (
                    <div className="mt-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-indigo-100">
                      <span className="font-semibold text-slate-900">รายละเอียดผลการตรวจ:</span> {tracking.colonoscopyDetails}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 5: Pathology / Biopsy & Diagnosis */}
              <div className="relative">
                <div className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-xs ${
                  tracking.biopsyResult && tracking.biopsyResult !== 'pending'
                    ? 'bg-emerald-600'
                    : 'bg-slate-400'
                }`}>
                  5
                </div>
                <div className={`p-4 rounded-xl border ${
                  tracking.biopsyResult && tracking.biopsyResult !== 'pending'
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">ผลตรวจทางพยาธิวิทยาและการวินิจฉัย (Pathology)</span>
                        {tracking.biopsyResult && tracking.biopsyResult !== 'pending' ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                            รายงานผลแล้ว
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                            รอผลชิ้นเนื้อ
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>วันที่ผลออก: <strong>{tracking.biopsyDate || '-'}</strong></span>
                        <span>ผลการวินิจฉัย: <strong>{getBiopsyLabel(tracking.biopsyResult)}</strong></span>
                      </div>
                    </div>
                    <button
                      onClick={onOpenColonoscopy}
                      className="px-2.5 py-1 text-xs font-semibold bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-lg shadow-2xs flex items-center gap-1"
                    >
                      <Microscope className="w-3.5 h-3.5" />
                      อัปเดตผลชิ้นเนื้อ
                    </button>
                  </div>

                  {tracking.biopsyDetails && (
                    <div className="mt-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-emerald-100">
                      <span className="font-semibold text-slate-900">ผลทางพยาธิวิทยา:</span> {tracking.biopsyDetails}
                    </div>
                  )}

                  {tracking.treatmentPlan && (
                    <div className="mt-2 text-xs text-emerald-900 bg-emerald-100/70 p-2.5 rounded-lg border border-emerald-200 font-medium flex items-start gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-bold">แผนการรักษาต่อเนื่อง / เฝ้าระวัง:</span> {tracking.treatmentPlan}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CLINICAL NOTES SECTION */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <h4 className="font-bold text-sm text-slate-800">
                  บันทึกข้อความทางคลินิก & ข้อสังเกต (Clinical Notes)
                </h4>
              </div>
              {notesSaveSuccess && (
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  บันทึกเรียบร้อย
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              ใช้สำหรับบันทึกเหตุผลหากผู้ป่วยปฏิเสธการส่องกล้อง, ติดต่อไม่ได้, ประสาน อสม. ลงพื้นที่, หรือข้อควรระวังพิเศษ (เช่น ประวัติทานยาต้านการแข็งตัวของเลือด, โรคประจำตัว)
            </p>

            <textarea
              rows={4}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="พิมพ์บันทึกข้อความทางคลินิกที่นี่ เช่น ผู้ป่วยปฏิเสธเนื่องจาก..., ประสาน อสม. ติดตามแล้วผลคือ..., มีข้อควรระวังเรื่องยาละลายลิ่มเลือด..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800"
            />

            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-slate-400">
                ข้อมูลจะถูกจัดเก็บลงฐานข้อมูลและซิงค์ทันที
              </div>
              <button
                type="button"
                onClick={handleSaveClinicalNotes}
                disabled={isSavingNotes}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {isSavingNotes ? 'กำลังบันทึก...' : 'บันทึก Clinical Notes'}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            อัปเดตล่าสุด: {tracking.updatedAt ? new Date(tracking.updatedAt).toLocaleString('th-TH') : '-'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
