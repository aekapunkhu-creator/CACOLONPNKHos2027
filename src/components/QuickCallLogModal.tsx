import React, { useState } from 'react';
import { PatientScreening, CallLogEntry, CaColonStatus } from '../types';
import { 
  Phone, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  PhoneOff, 
  User, 
  Calendar, 
  Save, 
  FileText 
} from 'lucide-react';

interface QuickCallLogModalProps {
  patient: PatientScreening;
  onClose: () => void;
  onSave: (updated: PatientScreening) => void;
  defaultCaller?: string;
}

export const QuickCallLogModal: React.FC<QuickCallLogModalProps> = ({
  patient,
  onClose,
  onSave,
  defaultCaller = 'นายเอกพันธ์ ขันติ (นวก.สาธารณสุข)'
}) => {
  const currentTracking = patient.caTracking || {
    status: 'pending_contact',
    fitPositiveDate: patient.testedDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    callLogs: []
  };

  const [phone, setPhone] = useState(patient.phone || '');
  const [caller, setCaller] = useState(defaultCaller);
  const [date, setDate] = useState(() => {
    const now = new Date();
    return `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [outcome, setOutcome] = useState<CallLogEntry['outcome']>('answered_agreed');
  const [notes, setNotes] = useState('');
  const [updateStatus, setUpdateStatus] = useState<CaColonStatus>(() => {
    return outcome === 'answered_agreed' ? 'contacted' : currentTracking.status;
  });

  const handleOutcomeChange = (newOutcome: CallLogEntry['outcome']) => {
    setOutcome(newOutcome);
    if (newOutcome === 'answered_agreed') {
      setUpdateStatus('contacted');
    } else if (newOutcome === 'answered_refused') {
      setUpdateStatus('refused');
    } else if (newOutcome === 'no_answer' || newOutcome === 'wrong_number') {
      const existingFails = (currentTracking.callLogs || []).filter(c => c.outcome === 'no_answer' || c.outcome === 'wrong_number').length;
      if (existingFails >= 2) {
        setUpdateStatus('cannot_contact');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newCallEntry: CallLogEntry = {
      id: `call-${Date.now()}`,
      date,
      caller: caller.trim(),
      phone: phone.trim(),
      outcome,
      notes: notes.trim()
    };

    const existingLogs = currentTracking.callLogs || [];
    const updatedLogs = [newCallEntry, ...existingLogs];

    const updatedTracking = {
      ...currentTracking,
      status: updateStatus,
      contactDate: date,
      contactOfficer: caller.trim(),
      contactNotes: notes.trim() || currentTracking.contactNotes,
      callLogs: updatedLogs,
      updatedAt: new Date().toISOString(),
      updatedBy: caller.trim()
    };

    const updatedPatient: PatientScreening = {
      ...patient,
      phone: phone.trim(),
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
        <div className="bg-gradient-to-r from-teal-700 to-emerald-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">บันทึกการโทรติดต่อผู้ป่วย</h3>
              <p className="text-teal-100 text-xs">
                HN: {patient.hn} • {patient.prefix}{patient.firstName} {patient.lastName} (อายุ {patient.ageYears} ปี)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-teal-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-slate-800">
          {/* Quick dial bar */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-emerald-800 font-medium">เบอร์โทรศัพท์ที่ใช้ติดต่อ</div>
              <div className="text-base font-bold text-emerald-950 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>{phone || 'ยังไม่มีเบอร์โทร'}</span>
              </div>
            </div>
            {phone && (
              <a
                href={`tel:${phone.replace(/[^0-9]/g, '')}`}
                className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                กดโทรออกทันที
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เบอร์โทรศัพท์ผู้ป่วย/ญาติ
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="เช่น 081-234-5678"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันและเวลาที่โทร
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เจ้าหน้าที่ผู้ติดต่อ
            </label>
            <input
              type="text"
              value={caller}
              onChange={(e) => setCaller(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          {/* Outcome Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ผลการติดต่อ (Call Outcome)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { id: 'answered_agreed', label: 'รับสาย & ยินยอมนัดส่องกล้อง', icon: CheckCircle2, color: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
                { id: 'answered_hesitant', label: 'รับสาย & ลังเล/ขอปรึกษาญาติ', icon: Clock, color: 'border-amber-500 bg-amber-50 text-amber-900' },
                { id: 'answered_refused', label: 'รับสาย & ปฏิเสธการส่องกล้อง', icon: AlertTriangle, color: 'border-rose-500 bg-rose-50 text-rose-900' },
                { id: 'no_answer', label: 'โทรติดแต่ไม่มีผู้รับสาย', icon: PhoneOff, color: 'border-slate-400 bg-slate-50 text-slate-800' },
                { id: 'wrong_number', label: 'เบอร์ผิด / ติดต่อไม่ได้เลย', icon: PhoneOff, color: 'border-red-400 bg-red-50 text-red-800' }
              ].map(opt => {
                const Icon = opt.icon;
                const isSelected = outcome === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleOutcomeChange(opt.id as any)}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all ${
                      isSelected ? `${opt.color} ring-2 ring-emerald-600 font-semibold shadow-xs` : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รายละเอียดการพูดคุย / ข้อตกลงกับผู้ป่วย
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ระบุข้อความ เช่น แจ้งผล FIT เป็นบวก แนะนำการส่องกล้อง ผู้ป่วยยินยอมให้นัดช่วงปลายเดือน..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-slate-400"
            />
          </div>

          {/* Update Status Selection */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ปรับเปลี่ยนสถานะผู้ป่วยหลังบันทึกการโทร
            </label>
            <select
              value={updateStatus}
              onChange={(e) => setUpdateStatus(e.target.value as CaColonStatus)}
              className="w-full px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="pending_contact">🟡 รอติดต่อแจ้งผล (Pending Contact)</option>
              <option value="contacted">🔵 ติดต่อสำเร็จ / รอนัด (Contacted)</option>
              <option value="scheduled">🟣 นัดส่องกล้องแล้ว (Scheduled)</option>
              <option value="cannot_contact">⚪ ติดต่อไม่ได้ (Cannot Contact)</option>
              <option value="refused">🔴 ผู้ป่วยปฏิเสธการตรวจ (Refused)</option>
            </select>
          </div>

          {/* Previous call history */}
          {(currentTracking.callLogs || []).length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>ประวัติการโทรครั้งก่อนหน้านี้ ({(currentTracking.callLogs || []).length} ครั้ง)</span>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                {(currentTracking.callLogs || []).map((log, idx) => (
                  <div key={log.id || idx} className="p-2 bg-slate-100 rounded-lg text-xs text-slate-700 border border-slate-200">
                    <div className="flex items-center justify-between font-medium">
                      <span>{log.date} ({log.caller})</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-800 font-semibold">
                        {log.outcome}
                      </span>
                    </div>
                    {log.notes && <p className="text-slate-600 mt-0.5 text-[11px]">{log.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

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
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              บันทึกการโทร
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
