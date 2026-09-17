import React, { useState, useEffect, useMemo } from 'react';
import { PatientScreening } from '../types';
import { 
  X, 
  PackageCheck, 
  Activity, 
  Scale, 
  Heart, 
  CheckCircle2, 
  User, 
  Clock, 
  Building, 
  Send
} from 'lucide-react';

interface ReturnKitHealthVitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientScreening | null;
  onSave: (updated: PatientScreening) => void;
}

export const ReturnKitHealthVitalsModal: React.FC<ReturnKitHealthVitalsModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSave
}) => {
  const [isKitReceived, setIsKitReceived] = useState<boolean>(true);
  const [receivedDate, setReceivedDate] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');
  const [waistInch, setWaistInch] = useState<string>('');
  const [waistCm, setWaistCm] = useState<string>('');
  const [bloodPressureSys, setBloodPressureSys] = useState<string>('');
  const [bloodPressureDia, setBloodPressureDia] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (patient && isOpen) {
      setIsKitReceived(patient.kitStatus === 'received' || patient.kitStatus === 'tested' || true);
      
      const nowStr = new Date().toLocaleString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      setReceivedDate(patient.kitReceivedDate || nowStr);

      setHeightCm(patient.heightCm ? String(patient.heightCm) : '');
      setWeightKg(patient.weightKg ? String(patient.weightKg) : '');
      setWaistInch(patient.waistInch ? String(patient.waistInch) : '');
      setWaistCm(patient.waistCm ? String(patient.waistCm) : '');
      setBloodPressureSys(patient.bloodPressureSys ? String(patient.bloodPressureSys) : '');
      setBloodPressureDia(patient.bloodPressureDia ? String(patient.bloodPressureDia) : '');
      setNotes(patient.notes || '');
    }
  }, [patient, isOpen]);

  // Handle waist sync between inch and cm
  const handleWaistInchChange = (val: string) => {
    setWaistInch(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setWaistCm(String(Math.round(num * 2.54)));
    } else if (val === '') {
      setWaistCm('');
    }
  };

  const handleWaistCmChange = (val: string) => {
    setWaistCm(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setWaistInch((num / 2.54).toFixed(1));
    } else if (val === '') {
      setWaistInch('');
    }
  };

  // BMI Calculation
  const bmi = useMemo(() => {
    const h = parseFloat(heightCm) / 100;
    const w = parseFloat(weightKg);
    if (h > 0 && w > 0) {
      return (w / (h * h)).toFixed(1);
    }
    return null;
  }, [heightCm, weightKg]);

  const bmiCategory = useMemo(() => {
    if (!bmi) return null;
    const val = parseFloat(bmi);
    if (val < 18.5) return { label: 'น้ำหนักน้อย / ผอม', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (val < 23) return { label: 'สมส่วน / ปกติ', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (val < 25) return { label: 'น้ำหนักเกิน (ท้วม)', color: 'text-orange-700 bg-orange-50 border-orange-200' };
    return { label: 'ภาวะอ้วน (Obese)', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  }, [bmi]);

  // Blood Pressure Category
  const bpCategory = useMemo(() => {
    const sys = parseInt(bloodPressureSys, 10);
    const dia = parseInt(bloodPressureDia, 10);
    if (!sys || !dia) return null;

    if (sys < 120 && dia < 80) {
      return { label: 'ความดันโลหิตปกติ (Optimal)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
    if (sys <= 139 || dia <= 89) {
      return { label: 'ความดันโลหิตค่อนข้างสูง (Pre-HT)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    }
    return { label: 'ความดันโลหิตสูง (Hypertension)', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  }, [bloodPressureSys, bloodPressureDia]);

  if (!isOpen || !patient) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const h = parseFloat(heightCm) || undefined;
    const w = parseFloat(weightKg) || undefined;
    const wInch = parseFloat(waistInch) || undefined;
    const wCm = parseFloat(waistCm) || (wInch ? Math.round(wInch * 2.54) : undefined);
    const sys = parseInt(bloodPressureSys, 10) || undefined;
    const dia = parseInt(bloodPressureDia, 10) || undefined;
    const bmiVal = bmi ? parseFloat(bmi) : undefined;

    const newKitStatus = isKitReceived 
      ? (patient.kitStatus === 'tested' ? 'tested' : 'received') 
      : 'not_received';

    const updated: PatientScreening = {
      ...patient,
      kitStatus: newKitStatus,
      kitReceivedDate: isKitReceived ? (receivedDate || new Date().toLocaleString('th-TH')) : undefined,
      heightCm: h,
      weightKg: w,
      waistInch: wInch,
      waistCm: wCm,
      bloodPressureSys: sys,
      bloodPressureDia: dia,
      bmi: bmiVal,
      notes: notes.trim()
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <PackageCheck className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">
                หน้าที่ 3: จุดรับชุดตรวจและตรวจวัดสัญญาณชีพ
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                ลงทะเบียนรับชุดตรวจที่มาส่ง (Return Kit) & บันทึกข้อมูลสุขภาพ
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-blue-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Info Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 font-mono font-bold flex items-center justify-center text-xs">
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
              เลขบัตร: {patient.idCard} • {patient.benefitName}
            </div>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Action 1: กดส่งชุดตรวจ / ยืนยันรับชุดตรวจ */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 font-bold text-blue-950 text-sm">
                  <Send className="w-4 h-4 text-blue-600" />
                  <span>สถานะการส่งชุดตรวจ (Return Kit)</span>
                </div>
                <p className="text-xs text-blue-700 mt-0.5">
                  กดยืนยันเมื่อผู้ป่วยหรือ อสม. นำหลอดเก็บอุจจาระมาส่งคืนที่จุดบริการ
                </p>
              </div>

              {/* Big Interactive Send Kit Toggle Button */}
              <button
                type="button"
                onClick={() => setIsKitReceived(!isKitReceived)}
                className={`px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                  isKitReceived
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${isKitReceived ? 'text-white' : 'text-slate-400'}`} />
                <span>{isKitReceived ? '✓ ได้รับชุดตรวจแล้ว' : 'กดส่งชุดตรวจ / ยืนยันรับชุดตรวจ'}</span>
              </button>
            </div>

            {isKitReceived && (
              <div className="mt-3 pt-3 border-t border-blue-200/70 flex items-center gap-2 text-xs text-blue-800">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>บันทึกวันที่รับ:</span>
                <input
                  type="text"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-blue-300 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Action 2: สัญญาณชีพและข้อมูลสุขภาพ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>บันทึกข้อมูลสุขภาพ & สัญญาณชีพ</span>
              </h4>
              <span className="text-[11px] text-slate-500">กรอกอย่างน้อยส่วนสูง-น้ำหนัก หรือความดัน</span>
            </div>

            {/* Height & Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ส่วนสูง (เซนติเมตร)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="เช่น 165"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">ซม.</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  น้ำหนัก (กิโลกรัม)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="เช่น 62.5"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">กก.</span>
                </div>
              </div>
            </div>

            {/* BMI Auto-Card */}
            {bmi && (
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${bmiCategory?.color || 'bg-slate-50'}`}>
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  <span>ดัชนีมวลกาย (BMI): <strong className="font-mono text-sm">{bmi}</strong> kg/m²</span>
                </div>
                <span className="font-bold px-2 py-0.5 bg-white/70 rounded-md">{bmiCategory?.label}</span>
              </div>
            )}

            {/* Waist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รอบเอว (นิ้ว)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={waistInch}
                    onChange={(e) => handleWaistInchChange(e.target.value)}
                    placeholder="เช่น 32"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">นิ้ว</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รอบเอว (เซนติเมตร)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    value={waistCm}
                    onChange={(e) => handleWaistCmChange(e.target.value)}
                    placeholder="เช่น 81"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">ซม.</span>
                </div>
              </div>
            </div>

            {/* Blood Pressure */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  ความดันโลหิต (มม.ปรอท) บน / ล่าง
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setBloodPressureSys('120'); setBloodPressureDia('80'); }}
                    className="text-[10px] text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded font-medium"
                  >
                    120/80 (ปกติ)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setBloodPressureSys('130'); setBloodPressureDia('85'); }}
                    className="text-[10px] text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded font-medium"
                  >
                    130/85
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="number"
                    value={bloodPressureSys}
                    onChange={(e) => setBloodPressureSys(e.target.value)}
                    placeholder="SYS เช่น 120"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">mmHg</span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    value={bloodPressureDia}
                    onChange={(e) => setBloodPressureDia(e.target.value)}
                    placeholder="DIA เช่น 80"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">mmHg</span>
                </div>
              </div>

              {bpCategory && (
                <div className={`mt-2 p-2 rounded-lg border text-xs flex items-center justify-between font-medium ${bpCategory.color}`}>
                  <span>การแปลผลความดัน:</span>
                  <span className="font-bold">{bpCategory.label}</span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมายเหตุเพิ่มเติม / อาการผิดปกติ
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="เช่น ผู้ป่วยรับประทานอาหารรสจัด, มีอาการท้องผูกสลับท้องเสีย..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>บันทึกข้อมูลสุขภาพ & สถานะส่งชุดตรวจ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
