import React, { useState } from 'react';
import { PatientScreening, ColonoscopyFinding, BiopsyResult, CaColonStatus } from '../types';
import { 
  Activity, 
  X, 
  Save, 
  FileText, 
  Microscope, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar 
} from 'lucide-react';

interface QuickColonoscopyModalProps {
  patient: PatientScreening;
  onClose: () => void;
  onSave: (updated: PatientScreening) => void;
}

export const QuickColonoscopyModal: React.FC<QuickColonoscopyModalProps> = ({
  patient,
  onClose,
  onSave
}) => {
  const currentTracking = patient.caTracking || {
    status: 'scheduled',
    fitPositiveDate: patient.testedDate?.slice(0, 10) || new Date().toISOString().slice(0, 10)
  };

  const [colonoscopyDate, setColonoscopyDate] = useState(
    currentTracking.colonoscopyDate || new Date().toISOString().slice(0, 10)
  );
  const [colonoscopyHospital, setColonoscopyHospital] = useState(
    currentTracking.colonoscopyHospital || currentTracking.hospitalName || 'โรงพยาบาลสกลนคร'
  );
  const [colonoscopyDoctor, setColonoscopyDoctor] = useState(
    currentTracking.colonoscopyDoctor || 'นพ.อภิชาติ ปัญญาเลิศ'
  );
  const [colonoscopyFinding, setColonoscopyFinding] = useState<ColonoscopyFinding>(
    currentTracking.colonoscopyFinding || 'polyps_removed'
  );
  const [colonoscopyDetails, setColonoscopyDetails] = useState(
    currentTracking.colonoscopyDetails || ''
  );
  const [polypCount, setPolypCount] = useState<number | undefined>(
    currentTracking.polypCount ?? 1
  );
  const [polypSizeLocation, setPolypSizeLocation] = useState(
    currentTracking.polypSizeLocation || ''
  );

  // Biopsy section
  const [biopsyDate, setBiopsyDate] = useState(
    currentTracking.biopsyDate || ''
  );
  const [biopsyResult, setBiopsyResult] = useState<BiopsyResult>(
    currentTracking.biopsyResult || 'pending'
  );
  const [biopsyDetails, setBiopsyDetails] = useState(
    currentTracking.biopsyDetails || ''
  );
  const [treatmentPlan, setTreatmentPlan] = useState(
    currentTracking.treatmentPlan || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let newStatus: CaColonStatus = 'colonoscopy_done';
    if (biopsyResult && biopsyResult !== 'pending') {
      newStatus = 'biopsy_reported';
    }

    const updatedTracking = {
      ...currentTracking,
      status: newStatus,
      colonoscopyDate,
      colonoscopyHospital,
      colonoscopyDoctor,
      colonoscopyFinding,
      colonoscopyDetails: colonoscopyDetails.trim(),
      polypCount: colonoscopyFinding === 'polyps_removed' ? Number(polypCount) || 0 : undefined,
      polypSizeLocation: colonoscopyFinding === 'polyps_removed' ? polypSizeLocation.trim() : undefined,
      biopsyDate: biopsyDate || undefined,
      biopsyResult,
      biopsyDetails: biopsyDetails.trim() || undefined,
      treatmentPlan: treatmentPlan.trim() || undefined,
      updatedAt: new Date().toISOString(),
      updatedBy: colonoscopyDoctor
    };

    // Update referral status to completed if colonoscopy is done
    const updatedReferral = patient.referral ? {
      ...patient.referral,
      status: 'completed' as const
    } : undefined;

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
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">บันทึกผลการส่องกล้อง & พยาธิวิทยา</h3>
              <p className="text-purple-100 text-xs">
                HN: {patient.hn} • {patient.prefix}{patient.firstName} {patient.lastName} (อายุ {patient.ageYears} ปี)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-purple-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-slate-800">
          {/* Section 1: Colonoscopy Finding */}
          <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
            <div className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-purple-700" />
              <span>1. ผลการตรวจส่องกล้อง (Colonoscopy)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันที่ส่องกล้อง *
                </label>
                <input
                  type="date"
                  value={colonoscopyDate}
                  onChange={(e) => setColonoscopyDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  แพทย์ผู้ทำหัตถการ
                </label>
                <input
                  type="text"
                  value={colonoscopyDoctor}
                  onChange={(e) => setColonoscopyDoctor(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ผลการตรวจทางกล้อง (Endoscopic Findings) *
              </label>
              <select
                value={colonoscopyFinding}
                onChange={(e) => setColonoscopyFinding(e.target.value as ColonoscopyFinding)}
                className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="normal">✅ ปกติ ไม่พบติ่งเนื้อหรือรอยโรค (Normal)</option>
                <option value="polyps_removed">🔬 พบติ่งเนื้อและตัดออกแล้ว (Polypectomy)</option>
                <option value="suspected_cancer">⚠️ พบก้อนเนื้อสงสัยมะเร็ง (Suspected Malignancy / Mass)</option>
                <option value="ulcer_inflammation">🩹 แผลหรือการอักเสบในลำไส้ (Colitis / Ulcer)</option>
                <option value="stricture">⛔ ลำไส้ตีบแคบ กล้องผ่านไม่ได้ (Colonic Stricture)</option>
                <option value="other">📝 อื่นๆ (ระบุในรายละเอียด)</option>
              </select>
            </div>

            {colonoscopyFinding === 'polyps_removed' && (
              <div className="p-2.5 bg-white border border-purple-200 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    จำนวนติ่งเนื้อที่ตัด (ชิ้น)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={polypCount ?? 1}
                    onChange={(e) => setPolypCount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    ขนาดและตำแหน่งติ่งเนื้อ
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น Sigmoid 1.2 cm, Ascending 0.8 cm"
                    value={polypSizeLocation}
                    onChange={(e) => setPolypSizeLocation(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รายละเอียดเพิ่มเติมผลการส่องกล้อง
              </label>
              <textarea
                rows={2}
                value={colonoscopyDetails}
                onChange={(e) => setColonoscopyDetails(e.target.value)}
                placeholder="ระบุข้อความบันทึก เช่น ส่องถึง Cecum สมบูรณ์, ไม่พบภาวะแทรกซ้อน, ตัดชิ้นเนื้อส่งตรวจแล็บ..."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          {/* Section 2: Biopsy / Pathology */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
            <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <Microscope className="w-4 h-4 text-indigo-700" />
              <span>2. ผลตรวจทางพยาธิวิทยา (Pathology / Biopsy Result)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ผลชิ้นเนื้อ
                </label>
                <select
                  value={biopsyResult}
                  onChange={(e) => setBiopsyResult(e.target.value as BiopsyResult)}
                  className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="pending">⏳ รอผลตรวจชิ้นเนื้อ (Pending Lab Result)</option>
                  <option value="not_indicated">⚪ ไม่ได้ตัดชิ้นเนื้อ (ตรวจปกติ)</option>
                  <option value="benign_polyp">🟢 ติ่งเนื้อธรรมดา (Hyperplastic Polyp)</option>
                  <option value="tubular_adenoma">🟡 ติ่งเนื้อชนิด Tubular / Villous Adenoma</option>
                  <option value="high_grade_dysplasia">🟠 Adenoma with High-Grade Dysplasia</option>
                  <option value="adenocarcinoma">🔴 มะเร็งลำไส้ใหญ่ (Adenocarcinoma)</option>
                  <option value="other">⚪ ผลอื่นๆ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันที่ผลชิ้นเนื้อออก
                </label>
                <input
                  type="date"
                  value={biopsyDate}
                  onChange={(e) => setBiopsyDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รายละเอียดผลชิ้นเนื้อ (Pathological Description)
              </label>
              <textarea
                rows={2}
                value={biopsyDetails}
                onChange={(e) => setBiopsyDetails(e.target.value)}
                placeholder="เช่น Tubular adenoma with low grade dysplasia, surgical margins free..."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                แผนการรักษาต่อเนื่อง / นัดตรวจซ้ำ (Treatment & Surveillance Plan)
              </label>
              <input
                type="text"
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                placeholder="เช่น นัดส่องกล้องซ้ำในอีก 3 ปี, ส่งพบศัลยแพทย์เพื่อวางแผนผ่าตัด..."
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
              className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              บันทึกผลส่องกล้อง
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
