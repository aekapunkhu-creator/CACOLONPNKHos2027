import React, { useState } from 'react';
import { PatientScreening } from '../types';
import { 
  FileText, 
  Printer, 
  Edit3, 
  Calendar, 
  Clock, 
  MapPin, 
  Hospital, 
  AlertOctagon, 
  CheckCircle2, 
  User, 
  Share2, 
  Eye, 
  Save, 
  X,
  Send
} from 'lucide-react';

interface ReferralViewProps {
  patients: PatientScreening[];
  initialHn?: string;
  onUpdatePatient: (updated: PatientScreening) => void;
  onPrintIndividual: (patient: PatientScreening) => void;
  onPrintAll: () => void;
}

export const ReferralView: React.FC<ReferralViewProps> = ({
  patients,
  initialHn,
  onUpdatePatient,
  onPrintIndividual,
  onPrintAll
}) => {
  // Filter for patients with Positive FIT Test result (Code 1B0061)
  const positivePatients = patients.filter(p => p.fitResult === 'positive');

  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    if (initialHn) {
      const found = positivePatients.find(p => p.hn.toLowerCase() === initialHn.toLowerCase());
      if (found) return found.id;
    }
    return positivePatients[0]?.id || '';
  });

  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Edit form state
  const [editApptDate, setEditApptDate] = useState('2026-09-28');
  const [editApptTime, setEditApptTime] = useState('08:30');
  const [editDestination, setEditDestination] = useState('โรงพยาบาลสกลนคร');
  const [editDepartment, setEditDepartment] = useState('ศูนย์ส่องกล้องระบบทางเดินอาหารและตับ (Endoscopy Center)');
  const [editDoctor, setEditDoctor] = useState('นพ.อภิชาติ ปัญญาเลิศ (ว.45892)');
  const [editReason, setEditReason] = useState('ตรวจคัดกรองมะเร็งลำไส้ใหญ่ด้วยวิธี FIT Test ได้ผลบวก (Positive Code 1B0061)');
  const [editInstruction, setEditInstruction] = useState('รับยาระบาย Swiff/Klean-Prep ตามคู่มือ งดผักผลไม้เมล็ดพืช 3 วันก่อนตรวจ และงดน้ำงดอาหารหลังเที่ยงคืน');

  const currentPatient = positivePatients.find(p => p.id === selectedPatientId) || positivePatients[0] || null;

  const openEditModal = (patient: PatientScreening) => {
    setSelectedPatientId(patient.id);
    const ref = patient.referral;
    setEditApptDate(ref?.appointmentDate || '2026-09-28');
    setEditApptTime(ref?.appointmentTime || '08:30');
    setEditDestination(ref?.destinationHospital || 'โรงพยาบาลสกลนคร');
    setEditDepartment(ref?.department || 'ศูนย์ส่องกล้องระบบทางเดินอาหารและตับ (Endoscopy Center)');
    setEditDoctor(ref?.referralDoctor || 'นพ.อภิชาติ ปัญญาเลิศ (ว.45892)');
    setEditReason(ref?.referralReason || 'ตรวจคัดกรองมะเร็งลำไส้ใหญ่ด้วยวิธี FIT Test ได้ผลบวก (Positive Code 1B0061)');
    setEditInstruction(ref?.bowelPrepInstruction || 'รับยาระบาย Swiff/Klean-Prep ตามคู่มือ งดผักผลไม้เมล็ดพืช 3 วันก่อนตรวจ และงดน้ำงดอาหารหลังเที่ยงคืน');
    setIsEditingModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;

    const updatedReferral = {
      referralNo: currentPatient.referral?.referralNo || `PNK-REF-2569-${String(Date.now()).slice(-3)}`,
      destinationHospital: editDestination.trim() || 'โรงพยาบาลสกลนคร',
      department: editDepartment.trim(),
      appointmentDate: editApptDate,
      appointmentTime: editApptTime,
      referralReason: editReason.trim(),
      referralDoctor: editDoctor.trim(),
      bowelPrepInstruction: editInstruction.trim(),
      status: 'referred' as const,
      createdDate: currentPatient.referral?.createdDate || new Date().toISOString()
    };

    const updated: PatientScreening = {
      ...currentPatient,
      referral: updatedReferral
    };

    onUpdatePatient(updated);
    setIsEditingModalOpen(false);
    setNotification(`บันทึกข้อมูลการนัดหมายและสถานที่ส่งต่อของ HN: ${updated.hn} เรียบร้อยแล้ว`);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Batch Print Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded-md mb-2">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
              หน้าที่ 5: ส่งต่อ Colonoscopy ผู้มีผลตรวจเป็นบวก (Positive)
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              ระบบออกใบส่งต่อส่องกล้อง Colonoscopy ไปยัง โรงพยาบาลสกลนคร
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              พิมพ์ใบส่งต่อรายบุคคล แก้ไขวันเวลานัด สถานที่ หรือกดพิมพ์ใบส่งต่อทั้งหมดในคราวเดียว
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={onPrintAll}
              disabled={positivePatients.length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ใบส่งต่อทั้งหมด ({positivePatients.length} ราย)</span>
            </button>
          </div>
        </div>

        {notification && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      {positivePatients.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">ยังไม่มีผู้ป่วยที่มีผลตรวจเป็นบวก (Positive)</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            เมื่อมีการบันทึกผลตรวจ FIT Test เป็นบวก (Positive รหัส 1B0061) ในหน้าที่ 4 ระบบจะสร้างรายการส่งต่อ Colonoscopy ที่นี่โดยอัตโนมัติ
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Positive Patients List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
              <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  รายชื่อผู้มีผลบวกที่ต้องส่งต่อ ({positivePatients.length} ราย)
                </h3>
                <span className="text-[11px] font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-bold">
                  1B0061
                </span>
              </div>

              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
                {positivePatients.map((p) => {
                  const isSelected = p.id === currentPatient?.id;
                  const ref = p.referral;

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPatientId(p.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50/50 shadow-xs ring-1 ring-rose-400'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-rose-700">
                          HN: {p.hn}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          Positive (ผลบวก)
                        </span>
                      </div>

                      <div className="font-bold text-slate-900 text-sm mt-1">
                        {p.prefix}{p.firstName} {p.lastName}
                      </div>

                      <div className="text-xs text-slate-500 mt-0.5">
                        ม.{p.villageNo} {p.villageName} | อายุ {p.ageYears} ปี | สิทธิ {p.benefitName}
                      </div>

                      {/* Appointment summary */}
                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>นัด: {ref?.appointmentDate || 'รอกำหนด'} ({ref?.appointmentTime || '08:30'})</span>
                        </div>
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          รพ.สกลนคร
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Referral Document Preview & Edit */}
          <div className="lg:col-span-7">
            {currentPatient && (
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-5">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-800 text-sm">
                        HN: {currentPatient.hn}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded">
                        FIT Test Positive 1B0061
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                      ใบส่งตัวส่องกล้อง: {currentPatient.prefix}{currentPatient.firstName} {currentPatient.lastName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(currentPatient)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      แก้ไขวันเวลานัด/สถานที่
                    </button>

                    <button
                      type="button"
                      onClick={() => onPrintIndividual(currentPatient)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      พิมพ์ใบส่งต่อ (A4)
                    </button>
                  </div>
                </div>

                {/* Simulated Referral Paper Preview */}
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-300 font-sarabun text-slate-800 space-y-4">
                  {/* Hospital Header */}
                  <div className="text-center pb-3 border-b border-slate-300">
                    <h4 className="text-base font-bold text-slate-900">
                      หนังสือส่งต่อผู้ป่วยเพื่อส่องกล้องตรวจลำไส้ใหญ่ (Colonoscopy Referral)
                    </h4>
                    <p className="text-xs text-slate-600">
                      หน่วยบริการ: โรงพยาบาลโพนนาแก้ว อ.โพนนาแก้ว จ.สกลนคร
                    </p>
                    <div className="text-xs font-mono text-slate-500 mt-1">
                      เลขที่หนังสือ: {currentPatient.referral?.referralNo || 'PNK-REF-2569-001'}
                    </div>
                  </div>

                  {/* Destination & Reason */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-400 font-bold block mb-1">ส่งต่อไปยัง:</span>
                      <div className="font-bold text-emerald-800 text-sm flex items-center gap-1.5">
                        <Hospital className="w-4 h-4 text-emerald-600" />
                        {currentPatient.referral?.destinationHospital || 'โรงพยาบาลสกลนคร'}
                      </div>
                      <div className="text-slate-600 mt-0.5">
                        {currentPatient.referral?.department || 'ศูนย์ส่องกล้องระบบทางเดินอาหาร (Endoscopy Unit)'}
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-400 font-bold block mb-1">วันและเวลานัดหมาย:</span>
                      <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-rose-600" />
                        วันที่ {currentPatient.referral?.appointmentDate || '2026-09-28'}
                      </div>
                      <div className="text-slate-600 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        เวลา {currentPatient.referral?.appointmentTime || '08:30'} น.
                      </div>
                    </div>
                  </div>

                  {/* Patient Bio & Vitals in Paper */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-2">
                    <div className="font-bold text-slate-800 border-b border-slate-100 pb-1">
                      ข้อมูลผู้ป่วย & สัญญาณชีพ
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div><strong>ชื่อ-สกุล:</strong> {currentPatient.prefix}{currentPatient.firstName} {currentPatient.lastName}</div>
                      <div><strong>เลขบัตร ปชช.:</strong> {currentPatient.idCard}</div>
                      <div><strong>สิทธิการรักษา:</strong> {currentPatient.benefitName}</div>
                      <div><strong>อายุ:</strong> {currentPatient.ageYears} ปี ({currentPatient.gender})</div>
                      <div><strong>ความดันโลหิต (BP):</strong> {currentPatient.bloodPressureSys ? `${currentPatient.bloodPressureSys}/${currentPatient.bloodPressureDia} mmHg` : '-'}</div>
                      <div><strong>ส่วนสูง/น้ำหนัก:</strong> {currentPatient.heightCm || '-'} ซม. / {currentPatient.weightKg || '-'} กก.</div>
                    </div>
                    <div>
                      <strong>ที่อยู่:</strong> บ้านเลขที่ {currentPatient.houseNo} หมู่ {currentPatient.villageNo} {currentPatient.villageName} อ.โพนนาแก้ว จ.สกลนคร
                    </div>
                    <div>
                      <strong>โรคประจำตัว:</strong> {currentPatient.underlyingDisease || 'ไม่มี'}
                    </div>
                  </div>

                  {/* Indication / Test result */}
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-rose-800">
                      <AlertOctagon className="w-4 h-4 text-rose-600" />
                      ข้อบ่งชี้ในการส่งตรวจ: ตรวจคัดกรองมะเร็งลำไส้ใหญ่ด้วยวิธี FIT Test ได้ผลบวก (1B0061)
                    </div>
                    <p className="text-[11px] text-rose-700">
                      วันที่ตรวจวิเคราะห์: {currentPatient.testedDate || '-'} โดย {currentPatient.testedBy || 'ห้องปฏิบัติการ รพ.โพนนาแก้ว'}
                    </p>
                  </div>

                  {/* Bowel Prep */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-800 block">คำแนะนำการเตรียมตัว / เตรียมลำไส้ (Bowel Preparation):</span>
                    <p className="text-slate-600 pl-2 border-l-2 border-emerald-500">
                      {currentPatient.referral?.bowelPrepInstruction || 'รับยาระบายตามใบคำแนะนำ งดอาหารกากใย 3 วันก่อนวันนัด และงดน้ำงดอาหารหลังเที่ยงคืน'}
                    </p>
                  </div>

                  {/* Sign off */}
                  <div className="text-right text-xs pt-2 text-slate-600">
                    <div>แพทย์ผู้ส่งต่อ: <strong>{currentPatient.referral?.referralDoctor || 'นพ.อภิชาติ ปัญญาเลิศ (ว.45892)'}</strong></div>
                    <div className="text-[11px] text-slate-400">โรงพยาบาลโพนนาแก้ว จ.สกลนคร</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Referral Modal */}
      {isEditingModalOpen && currentPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-800 text-white">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">
                  แก้ไขวันเวลานัดและสถานที่ส่งต่อ Colonoscopy
                </h3>
              </div>
              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800">ผู้ป่วย:</span> {currentPatient.prefix}{currentPatient.firstName} {currentPatient.lastName} (HN: {currentPatient.hn})
              </div>

              {/* Destination Hospital & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    โรงพยาบาลปลายทางที่ส่งต่อ:
                  </label>
                  <input
                    type="text"
                    value={editDestination}
                    onChange={(e) => setEditDestination(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    สถานที่ / แผนกที่ส่งตรวจ:
                  </label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Appointment Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    วันนัดตรวจส่องกล้อง (Appointment Date):
                  </label>
                  <input
                    type="date"
                    value={editApptDate}
                    onChange={(e) => setEditApptDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    เวลานัดหมาย (Appointment Time):
                  </label>
                  <input
                    type="time"
                    value={editApptTime}
                    onChange={(e) => setEditApptTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                  />
                </div>
              </div>

              {/* Doctor */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  แพทย์ผู้ส่งตรวจ / เจ้าหน้าที่ประสานงาน:
                </label>
                <input
                  type="text"
                  value={editDoctor}
                  onChange={(e) => setEditDoctor(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                />
              </div>

              {/* Bowel Prep Instructions */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  คำแนะนำการเตรียมลำไส้ก่อนส่องกล้อง (Bowel Preparation):
                </label>
                <textarea
                  rows={3}
                  value={editInstruction}
                  onChange={(e) => setEditInstruction(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
