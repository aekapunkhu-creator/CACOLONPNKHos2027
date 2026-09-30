import React, { useState } from 'react';
import { PatientScreening } from '../types';
import { RotateCcw, AlertTriangle, X, CheckCircle2, PackageX, Activity, Calendar } from 'lucide-react';

interface CancelKitModalProps {
  patient: PatientScreening | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (patient: PatientScreening, resetLabResult: boolean) => Promise<void> | void;
}

export const CancelKitModal: React.FC<CancelKitModalProps> = ({
  patient,
  isOpen,
  onClose,
  onConfirmCancel
}) => {
  if (!isOpen || !patient) return null;

  const [resetLabResult, setResetLabResult] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const hasLabResult = patient.fitResult !== 'pending' || Boolean(patient.testedDate);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirmCancel(patient, resetLabResult);
      onClose();
    } catch (err) {
      console.error('Failed to cancel kit status:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const bp = (patient.bloodPressureSys && patient.bloodPressureDia)
    ? `${patient.bloodPressureSys}/${patient.bloodPressureDia} mmHg`
    : '-';
  const waist = patient.waistInch
    ? `${patient.waistInch} นิ้ว`
    : (patient.waistCm ? `${patient.waistCm} ซม.` : '-');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 no-print animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-amber-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shadow-inner">
              <PackageX className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/20 text-amber-100 border border-white/20 inline-block">
                ยกเลิกสถานะส่งชุดตรวจ / บันทึกสุขภาพ
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                ยืนยันยกเลิกการส่งชุดตรวจ
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 text-slate-700 text-xs sm:text-sm">
          {/* Patient Details Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  HN: {patient.hn}
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {patient.prefix}{patient.firstName} {patient.lastName}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                อายุ {patient.ageYears} ปี ({patient.gender})
              </span>
            </div>

            <div className="text-xs text-slate-600 pt-1 border-t border-slate-200/60 flex flex-wrap gap-x-4 gap-y-1">
              <span><strong>ที่อยู่:</strong> {patient.houseNo} ม.{patient.villageNo} {patient.villageName}</span>
              <span><strong>เลขบัตร:</strong> <span className="font-mono">{patient.idCard}</span></span>
              <span><strong>เบอร์โทร:</strong> {patient.phone || '-'}</span>
            </div>
          </div>

          {/* Current Recorded Data Preview */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-amber-900 font-semibold text-xs">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-600" />
                ข้อมูลที่บันทึกไว้ในปัจจุบันที่จะถูกล้าง:
              </span>
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                {patient.kitStatus === 'tested' ? 'ตรวจแล็บแล้ว' : 'ส่งชุด/บันทึกแล้ว'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
              <div className="bg-white p-2 rounded-xl border border-amber-100">
                <span className="text-slate-400 block text-[10px]">วัน-เวลาที่ส่งชุดตรวจ:</span>
                <strong className="text-slate-800 font-mono text-[11px]">
                  {patient.kitReceivedDate || '-'}
                </strong>
              </div>
              <div className="bg-white p-2 rounded-xl border border-amber-100">
                <span className="text-slate-400 block text-[10px]">ส่วนสูง / น้ำหนัก:</span>
                <strong className="text-slate-800">
                  {patient.heightCm ? `${patient.heightCm} ซม.` : '-'} / {patient.weightKg ? `${patient.weightKg} กก.` : '-'}
                </strong>
              </div>
              <div className="bg-white p-2 rounded-xl border border-amber-100">
                <span className="text-slate-400 block text-[10px]">ความดันโลหิต (BP):</span>
                <strong className="text-slate-800 font-mono">
                  {bp}
                </strong>
              </div>
              <div className="bg-white p-2 rounded-xl border border-amber-100">
                <span className="text-slate-400 block text-[10px]">รอบเอว / BMI:</span>
                <strong className="text-slate-800">
                  {waist} / {patient.bmi ? patient.bmi : '-'}
                </strong>
              </div>
              <div className="bg-white p-2 rounded-xl border border-amber-100 col-span-2 sm:col-span-2">
                <span className="text-slate-400 block text-[10px]">ผลการตรวจคัดกรอง FIT:</span>
                <strong className={
                  patient.fitResult === 'positive'
                    ? 'text-rose-600 font-bold'
                    : patient.fitResult === 'negative'
                    ? 'text-emerald-600 font-bold'
                    : 'text-slate-700'
                }>
                  {patient.fitResult === 'positive'
                    ? 'Positive 1B0061 (ผลบวก)'
                    : patient.fitResult === 'negative'
                    ? 'Negative 1B0060 (ผลลบ)'
                    : patient.fitResult === 'inconclusive'
                    ? 'Inconclusive (ออกผลไม่ได้)'
                    : 'รอตรวจแล็บ (Pending)'}
                  {patient.testedDate ? ` (${patient.testedDate})` : ''}
                </strong>
              </div>
            </div>
          </div>

          {/* If patient already has a lab test result */}
          {hasLabResult && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>ผู้ป่วยรายนี้มีการบันทึกผลแล็บแล้ว ({patient.testedDate || 'มีผลตรวจ'})</span>
              </div>
              <p className="text-rose-700 leading-relaxed text-[11px]">
                ต้องการให้รีเซ็ตผลตรวจแล็บ FIT Test กลับเป็น &quot;รอตรวจ (Pending)&quot; ด้วยหรือไม่?
              </p>
              <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-rose-200 cursor-pointer hover:bg-rose-50/50 transition-colors">
                <input
                  type="checkbox"
                  checked={resetLabResult}
                  onChange={(e) => setResetLabResult(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                />
                <span className="font-semibold text-rose-900 text-xs">
                  ลบผลตรวจแล็บด้วย (เปลี่ยนสถานะ FIT เป็นรอตรวจ และล้างข้อมูลการส่งต่อ)
                </span>
              </label>
            </div>
          )}

          {/* Explanation Warning */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-100 text-slate-600 text-xs">
            <RotateCcw className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              เมื่อกดยืนยัน ระบบจะปรับสถานะชุดตรวจของ <strong>{patient.hn}</strong> กลับเป็น <strong className="text-amber-700">&quot;ยังไม่ส่งชุดตรวจ&quot;</strong> และล้างข้อมูลสัญญาณชีพเดิมออก เพื่อให้เจ้าหน้าที่หรือ อสม. สามารถนำรหัสนี้ไปสแกนรับชุดตรวจหรือบันทึกข้อมูลใหม่ได้
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs sm:text-sm transition-colors"
          >
            ยกเลิก (ไม่ทำรายการ)
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'กำลังยกเลิกสถานะ...' : 'ยืนยันยกเลิกส่งชุดตรวจ'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
