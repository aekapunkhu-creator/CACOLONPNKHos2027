import React, { useState, useEffect } from 'react';
import { PatientScreening, FitResultType } from '../types';
import { 
  X, 
  FlaskConical, 
  CheckCircle2, 
  AlertOctagon, 
  HelpCircle, 
  Zap, 
  Building, 
  User, 
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface FitResultPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientScreening | null;
  onSelectResultAutoSave: (
    patient: PatientScreening, 
    result: FitResultType, 
    lotNo: string, 
    testedBy: string, 
    notes: string
  ) => void;
  defaultLotNo?: string;
  defaultTestedBy?: string;
}

export const FitResultPopupModal: React.FC<FitResultPopupModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSelectResultAutoSave,
  defaultLotNo = 'FIT-2026-A12',
  defaultTestedBy = 'เจ้าหน้าที่ห้องปฏิบัติการ รพ.โพนนาแก้ว'
}) => {
  const [lotNo, setLotNo] = useState(defaultLotNo);
  const [testedBy, setTestedBy] = useState(defaultTestedBy);
  const [notes, setNotes] = useState('');
  const [justSavedResult, setJustSavedResult] = useState<FitResultType | null>(null);

  useEffect(() => {
    if (patient && isOpen) {
      setLotNo(patient.testLotNo || defaultLotNo);
      setTestedBy(patient.testedBy || defaultTestedBy);
      setNotes(patient.notes || '');
      setJustSavedResult(null);
    }
  }, [patient, isOpen, defaultLotNo, defaultTestedBy]);

  if (!isOpen || !patient) return null;

  const handleChooseResult = (result: FitResultType) => {
    setJustSavedResult(result);
    // Auto-save immediately!
    onSelectResultAutoSave(patient, result, lotNo, testedBy, notes);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <FlaskConical className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-200 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>บันทึกผลแล็บอัตโนมัติ (Auto-Save)</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                บันทึกผลตรวจคัดกรอง FIT Test (ห้องชันสูตร)
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-purple-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Info Card */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-900 font-mono font-bold flex items-center justify-center text-xs">
              HN
            </div>
            <div>
              <div className="font-mono font-bold text-sm text-slate-900">
                {patient.hn}
              </div>
              <div className="font-semibold text-slate-800">
                {patient.prefix}{patient.firstName} {patient.lastName} ({patient.gender}, อายุ {patient.ageYears} ปี)
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-slate-500">
              ม.{patient.villageNo} {patient.villageName} {patient.subdistrict ? `ต.${patient.subdistrict}` : ''}
            </div>
            <div className="font-mono text-[11px] text-slate-400">
              CID: {patient.idCard} • {patient.benefitName}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Lab metadata row */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Lot No. ชุดตรวจ (ตลับทดสอบ)
              </label>
              <input
                type="text"
                value={lotNo}
                onChange={(e) => setLotNo(e.target.value)}
                placeholder="เช่น FIT-2026-A12"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                เจ้าหน้าที่ผู้ตรวจวิเคราะห์
              </label>
              <input
                type="text"
                value={testedBy}
                onChange={(e) => setTestedBy(e.target.value)}
                placeholder="ชื่อเจ้าหน้าที่แล็บ"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section: One-Click Auto-Save Result Buttons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>กดเลือกผลตรวจเพื่อบันทึกอัตโนมัติทันที:</span>
              </label>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                บันทึกทันทีใน 1 คลิก
              </span>
            </div>

            {/* 1. Negative Button */}
            <button
              type="button"
              onClick={() => handleChooseResult('negative')}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${
                justSavedResult === 'negative' || patient.fitResult === 'negative'
                  ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-400'
                  : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 bg-white'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">ปกติ (Negative)</span>
                    <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      รหัส 1B0060
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ไม่พบเลือดแฝงในอุจจาระ • นัดตรวจซ้ำอีก 2 ปี ตามมาตรฐาน สปสช.
                  </p>
                </div>
              </div>
              <div className="text-xs font-bold text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <span>บันทึกทันที</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>

            {/* 2. Positive Button */}
            <button
              type="button"
              onClick={() => handleChooseResult('positive')}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${
                justSavedResult === 'positive' || patient.fitResult === 'positive'
                  ? 'border-rose-500 bg-rose-50 shadow-md ring-2 ring-rose-400'
                  : 'border-slate-200 hover:border-rose-400 hover:bg-rose-50/40 bg-white'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-950 text-sm">ผิดปกติ (Positive)</span>
                    <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                      รหัส 1B0061
                    </span>
                  </div>
                  <p className="text-xs text-rose-700 mt-0.5 font-medium">
                    พบเลือดแฝงในอุจจาระ • ระบบจะสร้างใบส่งต่อส่องกล้อง รพ.สกลนคร อัตโนมัติ
                  </p>
                </div>
              </div>
              <div className="text-xs font-bold text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <span>บันทึกทันที</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>

            {/* 3. Inconclusive Button */}
            <button
              type="button"
              onClick={() => handleChooseResult('inconclusive')}
              className={`w-full p-3.5 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${
                justSavedResult === 'inconclusive' || patient.fitResult === 'inconclusive'
                  ? 'border-slate-500 bg-slate-100 shadow-md'
                  : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50 bg-white'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold flex-shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-xs">
                    ออกผลไม่ได้ (Inconclusive)
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    แถบทดสอบควบคุมไม่ขึ้น หรือตัวอย่างไม่สมบูรณ์ • ต้องเก็บตัวอย่างตรวจซ้ำ
                  </p>
                </div>
              </div>
              <div className="text-xs font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <span>บันทึกทันที</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              หมายเหตุเพิ่มเติม (ถ้ามี)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น ตัวอย่างสีน้ำตาลเข้ม มีเสมหะปนเล็กน้อย..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            ระบบบันทึกผลอัตโนมัติทันทีที่กดเลือกผลตรวจ
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
