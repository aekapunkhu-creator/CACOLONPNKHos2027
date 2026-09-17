import React, { useState, useEffect } from 'react';
import { PatientScreening, FitResultType, KitStatusType, UserAccount } from '../types';
import { 
  X, 
  Save, 
  User, 
  MapPin, 
  Activity, 
  FlaskConical, 
  Send, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

interface EditPatientModalProps {
  patient: PatientScreening | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: PatientScreening) => Promise<void> | void;
  currentUser?: UserAccount | null;
}

export const EditPatientModal: React.FC<EditPatientModalProps> = ({
  patient,
  isOpen,
  onClose,
  onSave,
  currentUser
}) => {
  if (!isOpen || !patient) return null;

  const [activeTab, setActiveTab] = useState<'info' | 'vitals' | 'result' | 'referral'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tab 1: Info & Demographics
  const [hn, setHn] = useState(patient.hn);
  const [prefix, setPrefix] = useState(patient.prefix);
  const [firstName, setFirstName] = useState(patient.firstName);
  const [lastName, setLastName] = useState(patient.lastName);
  const [gender, setGender] = useState<'ชาย' | 'หญิง'>(patient.gender || 'ชาย');
  const [idCard, setIdCard] = useState(patient.idCard || '');
  const [birthDate, setBirthDate] = useState(patient.birthDate || '');
  const [ageYears, setAgeYears] = useState<number>(patient.ageYears || 50);
  const [ageMonths, setAgeMonths] = useState<number>(patient.ageMonths || 0);

  // Address
  const [houseNo, setHouseNo] = useState(patient.houseNo || '');
  const [villageNo, setVillageNo] = useState(patient.villageNo || '1');
  const [villageName, setVillageName] = useState(patient.villageName || '');
  const [subdistrict, setSubdistrict] = useState(patient.subdistrict || 'โพนนาแก้ว');

  // Benefit & Underlying
  const [benefitCode, setBenefitCode] = useState(patient.benefitCode || 'UCS');
  const [benefitName, setBenefitName] = useState(patient.benefitName || 'บัตรทอง (UC)');
  const [underlyingDisease, setUnderlyingDisease] = useState(patient.underlyingDisease || 'ไม่มี');

  // Tab 2: Vitals & Kit Status
  const [kitStatus, setKitStatus] = useState<KitStatusType>(patient.kitStatus || 'not_received');
  const [kitReceivedDate, setKitReceivedDate] = useState(patient.kitReceivedDate || '');
  const [heightCm, setHeightCm] = useState<string>(patient.heightCm ? String(patient.heightCm) : '');
  const [weightKg, setWeightKg] = useState<string>(patient.weightKg ? String(patient.weightKg) : '');
  const [waistInch, setWaistInch] = useState<string>(patient.waistInch ? String(patient.waistInch) : '');
  const [waistCm, setWaistCm] = useState<string>(patient.waistCm ? String(patient.waistCm) : '');
  const [bpSys, setBpSys] = useState<string>(patient.bloodPressureSys ? String(patient.bloodPressureSys) : '');
  const [bpDia, setBpDia] = useState<string>(patient.bloodPressureDia ? String(patient.bloodPressureDia) : '');

  // Tab 3: Fit Result
  const [fitResult, setFitResult] = useState<FitResultType>(patient.fitResult || 'pending');
  const [testedDate, setTestedDate] = useState(patient.testedDate || '');
  const [testedBy, setTestedBy] = useState(patient.testedBy || '');
  const [testLotNo, setTestLotNo] = useState(patient.testLotNo || 'FIT-202609A');
  const [notes, setNotes] = useState(patient.notes || '');

  // Tab 4: Referral
  const [hasReferral, setHasReferral] = useState(!!patient.referral || patient.fitResult === 'positive');
  const [referralNo, setReferralNo] = useState(patient.referral?.referralNo || `REF-PNK-${patient.hn.replace(/[^a-zA-Z0-9]/g, '')}`);
  const [destinationHospital, setDestinationHospital] = useState(patient.referral?.destinationHospital || 'โรงพยาบาลสกลนคร');
  const [department, setDepartment] = useState(patient.referral?.department || 'ศูนย์ส่องกล้องระบบทางเดินอาหารและตับ (Endoscopy Center)');
  const [appointmentDate, setAppointmentDate] = useState(patient.referral?.appointmentDate || '');
  const [appointmentTime, setAppointmentTime] = useState(patient.referral?.appointmentTime || '08:30');
  const [referralDoctor, setReferralDoctor] = useState(patient.referral?.referralDoctor || 'นพ.อภิชาติ ปัญญาเลิศ (ว.45892)');
  const [referralStatus, setReferralStatus] = useState<'pending_referral' | 'referred' | 'completed'>(patient.referral?.status || 'referred');
  const [bowelPrepInstruction, setBowelPrepInstruction] = useState(patient.referral?.bowelPrepInstruction || 'รับยาระบาย Swiff/Klean-Prep ตามคู่มือ งดผักผลไม้เมล็ดพืช 3 วันก่อนตรวจ และงดน้ำงดอาหารหลังเที่ยงคืน');
  const [referralReason, setReferralReason] = useState(patient.referral?.referralReason || 'ตรวจคัดกรองมะเร็งลำไส้ใหญ่ด้วยวิธี FIT Test ได้ผลบวก (Positive Code 1B0061)');

  // Auto calculate BMI
  const computedBmi = React.useMemo(() => {
    const h = parseFloat(heightCm) / 100;
    const w = parseFloat(weightKg);
    if (h > 0 && w > 0) {
      return parseFloat((w / (h * h)).toFixed(1));
    }
    return undefined;
  }, [heightCm, weightKg]);

  // When birthDate changes, calculate age
  const handleBirthDateChange = (val: string) => {
    setBirthDate(val);
    if (val) {
      const bDate = new Date(val);
      const now = new Date();
      let y = now.getFullYear() - bDate.getFullYear();
      let m = now.getMonth() - bDate.getMonth();
      if (m < 0) {
        y--;
        m += 12;
      }
      if (y >= 0 && y < 130) {
        setAgeYears(y);
        setAgeMonths(m);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!hn.trim()) {
      setErrorMsg('กรุณาระบุเลข HN');
      setActiveTab('info');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('กรุณาระบุชื่อและนามสกุล');
      setActiveTab('info');
      return;
    }

    setIsSaving(true);

    try {
      const updated: PatientScreening = {
        ...patient,
        hn: hn.trim(),
        prefix: prefix.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        idCard: idCard.trim(),
        birthDate,
        ageYears: Number(ageYears) || 0,
        ageMonths: Number(ageMonths) || 0,
        houseNo: houseNo.trim(),
        villageNo: villageNo.trim(),
        villageName: villageName.trim(),
        subdistrict: subdistrict.trim(),
        benefitCode: benefitCode.trim(),
        benefitName: benefitName.trim(),
        underlyingDisease: underlyingDisease.trim() || 'ไม่มี',

        kitStatus,
        kitReceivedDate: kitReceivedDate || (kitStatus !== 'not_received' ? new Date().toLocaleDateString('th-TH') : undefined),
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        waistInch: waistInch ? parseFloat(waistInch) : undefined,
        waistCm: waistCm ? parseFloat(waistCm) : (waistInch ? Math.round(parseFloat(waistInch) * 2.54) : undefined),
        bloodPressureSys: bpSys ? parseInt(bpSys, 10) : undefined,
        bloodPressureDia: bpDia ? parseInt(bpDia, 10) : undefined,
        bmi: computedBmi,

        fitResult,
        testedDate: testedDate || (fitResult !== 'pending' ? new Date().toLocaleDateString('th-TH') : undefined),
        testedBy: testedBy.trim() || undefined,
        testLotNo: testLotNo.trim() || undefined,
        notes: notes.trim() || undefined,

        referral: (hasReferral || fitResult === 'positive') ? {
          referralNo: referralNo.trim() || `REF-PNK-${hn.replace(/[^a-zA-Z0-9]/g, '')}`,
          destinationHospital: destinationHospital.trim(),
          department: department.trim(),
          appointmentDate: appointmentDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          appointmentTime: appointmentTime || '08:30',
          referralDoctor: referralDoctor.trim(),
          status: referralStatus,
          bowelPrepInstruction: bowelPrepInstruction.trim(),
          referralReason: referralReason.trim(),
          createdDate: patient.referral?.createdDate || new Date().toISOString()
        } : undefined
      };

      await onSave(updated);
      onClose();
    } catch (err: any) {
      console.error('Save patient error:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึก: ' + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 no-print animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <User className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  แก้ไขข้อมูลผู้ป่วย (Admin Edit)
                </span>
                <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-white">
                  HN: {patient.hn}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {patient.prefix}{patient.firstName} {patient.lastName}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs sm:text-sm overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`px-4 py-3 font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeTab === 'info'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>1. ข้อมูลทั่วไปและที่อยู่</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vitals')}
            className={`px-4 py-3 font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeTab === 'vitals'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>2. ชุดตรวจและสุขภาพ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('result')}
            className={`px-4 py-3 font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeTab === 'result'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>3. ผลตรวจ FIT Test</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('referral')}
            className={`px-4 py-3 font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeTab === 'referral'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>4. ข้อมูลการส่งต่อ (Referral)</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 sm:p-6 max-h-[68vh] overflow-y-auto space-y-4">
            
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* TAB 1: Demographic & Address */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      เลขประจำตัวผู้ป่วย (HN) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={hn}
                      onChange={(e) => setHn(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      เลขบัตรประชาชน (CID 13 หลัก)
                    </label>
                    <input
                      type="text"
                      maxLength={13}
                      value={idCard}
                      onChange={(e) => setIdCard(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      เพศ
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                    >
                      <option value="ชาย">ชาย</option>
                      <option value="หญิง">หญิง</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      คำนำหน้า
                    </label>
                    <input
                      type="text"
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                      placeholder="นาย / นาง / นางสาว"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ชื่อ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      นามสกุล <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      วันเกิด (YYYY-MM-DD)
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => handleBirthDateChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      อายุ (ปี)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={ageYears}
                      onChange={(e) => setAgeYears(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      อายุ (เดือน)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={11}
                      value={ageMonths}
                      onChange={(e) => setAgeMonths(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Address Section */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ข้อมูลที่อยู่</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">บ้านเลขที่</label>
                      <input
                        type="text"
                        value={houseNo}
                        onChange={(e) => setHouseNo(e.target.value)}
                        placeholder="เช่น 45/2"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">หมู่ที่</label>
                      <select
                        value={villageNo}
                        onChange={(e) => {
                          const v = e.target.value;
                          setVillageNo(v);
                          const mapping: Record<string, string> = {
                            '2': 'บ้านนาเดื่อ',
                            '3': 'บ้านกลาง',
                            '10': 'บ้านกลางใหม่',
                            '11': 'บ้านนาเดื่อน้อย'
                          };
                          if (mapping[v]) {
                            setVillageName(mapping[v]);
                            setSubdistrict('นาแก้ว');
                          }
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="2">หมู่ 2 (บ้านนาเดื่อ)</option>
                        <option value="3">หมู่ 3 (บ้านกลาง)</option>
                        <option value="10">หมู่ 10 (บ้านกลางใหม่)</option>
                        <option value="11">หมู่ 11 (บ้านนาเดื่อน้อย)</option>
                        {villageNo && !['2', '3', '10', '11'].includes(villageNo) && (
                          <option value={villageNo}>หมู่ {villageNo}</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">ชื่อหมู่บ้าน</label>
                      <input
                        type="text"
                        value={villageName}
                        onChange={(e) => setVillageName(e.target.value)}
                        placeholder="เช่น บ้านนาเดื่อ"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">ตำบล</label>
                      <input
                        type="text"
                        value={subdistrict}
                        onChange={(e) => setSubdistrict(e.target.value)}
                        placeholder="เช่น นาแก้ว"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Benefit & Disease */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      สิทธิการรักษา
                    </label>
                    <input
                      type="text"
                      value={benefitName}
                      onChange={(e) => setBenefitName(e.target.value)}
                      placeholder="เช่น บัตรทอง (UC), ข้าราชการ/เบิกตรง"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      โรคประจำตัว
                    </label>
                    <input
                      type="text"
                      value={underlyingDisease}
                      onChange={(e) => setUnderlyingDisease(e.target.value)}
                      placeholder="เช่น ไม่มี, เบาหวาน, ความดัน"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Vitals & Kit Status */}
            {activeTab === 'vitals' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      สถานะชุดตรวจ (FIT Kit)
                    </label>
                    <select
                      value={kitStatus}
                      onChange={(e) => setKitStatus(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 bg-white"
                    >
                      <option value="not_received">ยังไม่ได้รับชุดตรวจ</option>
                      <option value="received">รับชุดตรวจแล้ว (รอผลตรวจ)</option>
                      <option value="tested">ตรวจแล้ว (มีผลตรวจ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      วันที่ส่ง/รับชุดตรวจ
                    </label>
                    <input
                      type="text"
                      value={kitReceivedDate}
                      onChange={(e) => setKitReceivedDate(e.target.value)}
                      placeholder="เช่น 16/09/2569"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      ข้อมูลสุขภาพเบื้องต้นและสัญญาณชีพ
                    </span>
                    {computedBmi && (
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        BMI: {computedBmi} kg/m²
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">ส่วนสูง (ซม.)</label>
                      <input
                        type="number"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        placeholder="165"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">น้ำหนัก (กก.)</label>
                      <input
                        type="number"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        placeholder="60"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">รอบเอว (นิ้ว)</label>
                      <input
                        type="number"
                        value={waistInch}
                        onChange={(e) => {
                          setWaistInch(e.target.value);
                          if (e.target.value) {
                            setWaistCm(String(Math.round(parseFloat(e.target.value) * 2.54)));
                          }
                        }}
                        placeholder="32"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">รอบเอว (ซม.)</label>
                      <input
                        type="number"
                        value={waistCm}
                        onChange={(e) => setWaistCm(e.target.value)}
                        placeholder="81"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">ความดันโลหิตบน (SYS)</label>
                      <input
                        type="number"
                        value={bpSys}
                        onChange={(e) => setBpSys(e.target.value)}
                        placeholder="120"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">ความดันโลหิตล่าง (DIA)</label>
                      <input
                        type="number"
                        value={bpDia}
                        onChange={(e) => setBpDia(e.target.value)}
                        placeholder="80"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: FIT Test Result */}
            {activeTab === 'result' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ผลการตรวจ FIT Test
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFitResult('negative');
                        setKitStatus('tested');
                      }}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                        fitResult === 'negative'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                          : 'border-slate-200 hover:border-emerald-300 text-slate-600 bg-white'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-emerald-500 mb-1"></span>
                      <span className="text-xs">ผลลบ (1B0060)</span>
                      <span className="text-[10px] text-emerald-700 font-normal">ปกติ (ไม่พบเลือด)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFitResult('positive');
                        setKitStatus('tested');
                        setHasReferral(true);
                      }}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                        fitResult === 'positive'
                          ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold shadow-xs'
                          : 'border-slate-200 hover:border-rose-300 text-slate-600 bg-white'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-rose-500 mb-1"></span>
                      <span className="text-xs">ผลบวก (1B0061)</span>
                      <span className="text-[10px] text-rose-700 font-normal">ผิดปกติ (ส่งต่อส่องกล้อง)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFitResult('inconclusive');
                        setKitStatus('tested');
                      }}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                        fitResult === 'inconclusive'
                          ? 'border-slate-700 bg-slate-100 text-slate-900 font-bold shadow-xs'
                          : 'border-slate-200 hover:border-slate-400 text-slate-600 bg-white'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-slate-700 mb-1"></span>
                      <span className="text-xs">ออกผลไม่ได้</span>
                      <span className="text-[10px] text-slate-600 font-normal">แถบควบคุมไม่ขึ้น</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFitResult('pending')}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                        fitResult === 'pending'
                          ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold shadow-xs'
                          : 'border-slate-200 hover:border-amber-300 text-slate-600 bg-white'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-amber-500 mb-1"></span>
                      <span className="text-xs">รอตรวจ</span>
                      <span className="text-[10px] text-amber-700 font-normal">ยังไม่ออกผล</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">วันที่ตรวจ</label>
                    <input
                      type="text"
                      value={testedDate}
                      onChange={(e) => setTestedDate(e.target.value)}
                      placeholder="เช่น 16/09/2569"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">เจ้าหน้าที่ผู้ตรวจ</label>
                    <input
                      type="text"
                      value={testedBy}
                      onChange={(e) => setTestedBy(e.target.value)}
                      placeholder="เช่น น.ส.จริยา การุญ"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">หมายเลข Lot ชุดตรวจ</label>
                    <input
                      type="text"
                      value={testLotNo}
                      onChange={(e) => setTestLotNo(e.target.value)}
                      placeholder="FIT-202609A"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">หมายเหตุเพิ่มเติม</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="บันทึกข้อสังเกต หรือสาเหตุการตรวจซ้ำ"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: Referral */}
            {activeTab === 'referral' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-bold text-rose-900">
                      สร้าง/เปิดใช้งานข้อมูลใบส่งต่อส่องกล้อง (Colonoscopy Referral)
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasReferral}
                      onChange={(e) => setHasReferral(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>

                {hasReferral && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">เลขที่ใบส่งต่อ</label>
                        <input
                          type="text"
                          value={referralNo}
                          onChange={(e) => setReferralNo(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">สถานะการส่งต่อ</label>
                        <select
                          value={referralStatus}
                          onChange={(e) => setReferralStatus(e.target.value as any)}
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="pending_referral">รอดำเนินการส่งต่อ</option>
                          <option value="referred">ส่งต่อแล้ว (ออกใบนัดเรียบร้อย)</option>
                          <option value="completed">ส่องกล้องเสร็จสิ้น</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">โรงพยาบาลปลายทาง</label>
                        <input
                          type="text"
                          value={destinationHospital}
                          onChange={(e) => setDestinationHospital(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">แผนก</label>
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">วันที่นัดส่องกล้อง</label>
                        <input
                          type="date"
                          value={appointmentDate}
                          onChange={(e) => setAppointmentDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">เวลานัด</label>
                        <input
                          type="text"
                          value={appointmentTime}
                          onChange={(e) => setAppointmentTime(e.target.value)}
                          placeholder="08:30"
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">แพทย์ผู้ส่งต่อ</label>
                        <input
                          type="text"
                          value={referralDoctor}
                          onChange={(e) => setReferralDoctor(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">ข้อบ่งชี้ในการส่งต่อ</label>
                      <input
                        type="text"
                        value={referralReason}
                        onChange={(e) => setReferralReason(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">คำแนะนำการเตรียมลำไส้</label>
                      <textarea
                        rows={2}
                        value={bowelPrepInstruction}
                        onChange={(e) => setBowelPrepInstruction(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              {currentUser?.role === 'admin' && (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded">
                  <ShieldAlert className="w-3 h-3" /> สิทธิ์ผู้ดูแลระบบ (Admin)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข (Save)'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
