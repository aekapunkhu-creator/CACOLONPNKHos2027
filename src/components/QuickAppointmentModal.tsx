import React, { useState } from 'react';
import { PatientScreening, BowelPrepStatus, CaColonStatus } from '../types';
import { 
  Calendar, 
  Clock, 
  Building2, 
  X, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Pill, 
  UserCheck 
} from 'lucide-react';

interface QuickAppointmentModalProps {
  patient: PatientScreening;
  onClose: () => void;
  onSave: (updated: PatientScreening) => void;
}

export const QuickAppointmentModal: React.FC<QuickAppointmentModalProps> = ({
  patient,
  onClose,
  onSave
}) => {
  const currentTracking = patient.caTracking || {
    status: 'pending_contact',
    fitPositiveDate: patient.testedDate?.slice(0, 10) || new Date().toISOString().slice(0, 10)
  };

  const initialApptDate = currentTracking.appointmentDate || patient.referral?.appointmentDate || '';
  const initialApptTime = currentTracking.appointmentTime || patient.referral?.appointmentTime || '08:30';
  const initialHospital = currentTracking.hospitalName || patient.referral?.destinationHospital || 'โรงพยาบาลสกลนคร';
  const initialDept = currentTracking.department || patient.referral?.department || 'ศูนย์ส่องกล้องระบบทางเดินอาหาร (Endoscopy Unit)';
  const initialPrepStatus = currentTracking.bowelPrepStatus || 'received_meds';
  const initialPrepNotes = currentTracking.bowelPrepNotes || patient.referral?.bowelPrepInstruction || 'รับยาระบาย Swiff/Klean-Prep ตามคำแนะนำ งดอาหารกากใย 3 วันก่อนวันนัด และงดน้ำงดอาหารหลังเที่ยงคืน';

  const [appointmentDate, setAppointmentDate] = useState(initialApptDate);
  const [appointmentTime, setAppointmentTime] = useState(initialApptTime);
  const [hospitalName, setHospitalName] = useState(initialHospital);
  const [department, setDepartment] = useState(initialDept);
  const [bowelPrepStatus, setBowelPrepStatus] = useState<BowelPrepStatus>(initialPrepStatus);
  const [bowelPrepNotes, setBowelPrepNotes] = useState(initialPrepNotes);
  const [companionName, setCompanionName] = useState(currentTracking.companionName || '');
  const [companionPhone, setCompanionPhone] = useState(currentTracking.companionPhone || '');
  const [rescheduleReason, setRescheduleReason] = useState('');

  const isReschedule = Boolean(initialApptDate && initialApptDate !== '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let newStatus: CaColonStatus = 'scheduled';
    if (bowelPrepStatus === 'prep_completed' || bowelPrepStatus === 'diet_restricted') {
      newStatus = 'prep_in_progress';
    }

    const updatedTracking = {
      ...currentTracking,
      status: newStatus,
      appointmentDate,
      appointmentTime,
      hospitalName,
      department,
      bowelPrepStatus,
      bowelPrepNotes,
      companionName: companionName.trim(),
      companionPhone: companionPhone.trim(),
      updatedAt: new Date().toISOString(),
      updatedBy: 'ผู้บันทึกนัดหมาย'
    };

    if (rescheduleReason.trim()) {
      updatedTracking.clinicalNotes = (currentTracking.clinicalNotes ? currentTracking.clinicalNotes + '\n' : '') +
        `[เลื่อนนัดเมื่อ ${new Date().toLocaleDateString('th-TH')}] จากวันที่เดิม ${initialApptDate || '-'} เป็น ${appointmentDate} เหตุผล: ${rescheduleReason.trim()}`;
    }

    // Also update patient.referral so both views stay in sync
    const updatedReferral = {
      ...(patient.referral || {
        referralNo: `PNK-REF-${new Date().getFullYear() + 543}-${patient.hn.replace(/[^0-9]/g, '')}`,
        referralReason: 'ตรวจคัดกรองมะเร็งลำไส้ใหญ่ด้วยวิธี FIT Test ได้ผลบวก (1B0061)',
        referralDoctor: 'นพ.อภิชาติ ปัญญาเลิศ (ว.45892)',
        createdDate: new Date().toISOString().slice(0, 10)
      }),
      destinationHospital: hospitalName,
      department,
      appointmentDate,
      appointmentTime,
      bowelPrepInstruction: bowelPrepNotes,
      status: 'referred' as const
    };

    const updatedPatient: PatientScreening = {
      ...patient,
      referral: updatedReferral,
      caTracking: updatedTracking
    };

    onSave(updatedPatient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isReschedule ? 'เลื่อนนัดหมายส่องกล้อง (Reschedule)' : 'บันทึกนัดหมายส่องกล้องลำไส้ใหญ่'}
              </h3>
              <p className="text-blue-100 text-xs">
                HN: {patient.hn} • {patient.prefix}{patient.firstName} {patient.lastName} (อายุ {patient.ageYears} ปี)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-slate-800">
          {isReschedule && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold">วันนัดเดิม:</span> {initialApptDate} เวลา {initialApptTime} น.
                <div className="mt-1">
                  <input
                    type="text"
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    placeholder="ระบุเหตุผลในการเลื่อนนัด เช่น ผู้ป่วยติดธุระจำเป็น, ป่วยไข้หวัด..."
                    className="w-full mt-1 px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันนัดหมายส่องกล้อง *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เวลานัดหมาย *
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Hospital & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                โรงพยาบาลปลายทาง
              </label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                แผนก / หน่วยงาน
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Bowel Prep Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-blue-600" />
              <span>สถานะการเตรียมลำไส้ (Bowel Preparation)</span>
            </label>
            <select
              value={bowelPrepStatus}
              onChange={(e) => setBowelPrepStatus(e.target.value as BowelPrepStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="not_started">⚪ ยังไม่เริ่มเตรียม / รอนัดรับยาระบาย</option>
              <option value="received_meds">💊 ได้รับยาระบายแล้ว (Swiff / Klean-Prep)</option>
              <option value="diet_restricted">🥗 กำลังงดอาหารกากใย (Low Fiber Diet)</option>
              <option value="prep_completed">✅ เตรียมลำไส้เรียบร้อย ถ่ายเป็นน้ำใส</option>
              <option value="problem_encountered">⚠️ มีปัญหาในการดื่มยาระบาย (อาเจียน/ถ่ายไม่ออก)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              คำแนะนำการเตรียมตัว / ยาระบาย
            </label>
            <textarea
              rows={2}
              value={bowelPrepNotes}
              onChange={(e) => setBowelPrepNotes(e.target.value)}
              placeholder="ระบุคำแนะนำ เช่น ทาน Swiff 2 ขวด งดผักผลไม้ 3 วันก่อนวันนัด..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Companion */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>ผู้ดูแล / ญาติร่วมเดินทาง (จำเป็นสำหรับการส่องกล้องที่ใช้ยาระงับความรู้สึก)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="ชื่อ-นามสกุล ญาติ/ผู้ดูแล"
                value={companionName}
                onChange={(e) => setCompanionName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
              <input
                type="text"
                placeholder="เบอร์โทรศัพท์ญาติ"
                value={companionPhone}
                onChange={(e) => setCompanionPhone(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {isReschedule ? 'บันทึกการเลื่อนนัด' : 'บันทึกวันนัดส่องกล้อง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
