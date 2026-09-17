import React, { useState, useRef } from 'react';
import { PatientScreening } from '../types';
import { downloadPatientTemplateExcel, parseExcelPatients } from '../utils/excel';
import { VILLAGE_LIST } from '../mockData';
import { 
  UserPlus, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Trash2, 
  Edit3,
  Calendar,
  IdCard,
  Building,
  UserCheck,
  Tag
} from 'lucide-react';
import { UserAccount } from '../types';

interface RegistrationViewProps {
  patients: PatientScreening[];
  onAddPatient: (patient: PatientScreening) => void;
  onImportPatients: (imported: PatientScreening[]) => void;
  onDeletePatient: (patient: PatientScreening) => void;
  onEditPatient?: (patient: PatientScreening) => void;
  onClearAllPatients?: () => void;
  onNavigateToStickerPrint?: (hn?: string) => void;
  currentUser?: UserAccount | null;
}

export const RegistrationView: React.FC<RegistrationViewProps> = ({
  patients,
  onAddPatient,
  onImportPatients,
  onDeletePatient,
  onEditPatient,
  onClearAllPatients,
  onNavigateToStickerPrint,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'excel'>('form');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    hn: '',
    villageNo: '2',
    houseNo: '',
    prefix: 'นาย',
    firstName: '',
    lastName: '',
    gender: 'ชาย' as 'ชาย' | 'หญิง',
    ageYears: 55,
    ageMonths: 0,
    birthDate: '1971-01-15',
    idCard: '',
    benefitCode: 'UCS',
    benefitName: 'บัตรทอง (UC)',
    underlyingDisease: 'ไม่มี'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Handle BirthDate change to auto calculate age
  const handleBirthDateChange = (bDate: string) => {
    if (!bDate) return;
    const birth = new Date(bDate);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    setFormData(prev => ({
      ...prev,
      birthDate: bDate,
      ageYears: Math.max(0, years),
      ageMonths: Math.max(0, months)
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hn.trim()) {
      setNotification({ type: 'error', message: 'กรุณาระบุเลข HN ของผู้ป่วย' });
      return;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setNotification({ type: 'error', message: 'กรุณากรอกชื่อและนามสกุลให้ครบถ้วน' });
      return;
    }

    // Check duplicate HN
    const isDup = patients.some(p => p.hn.trim().toLowerCase() === formData.hn.trim().toLowerCase());
    if (isDup) {
      setNotification({ type: 'error', message: `เลข HN: ${formData.hn} มีอยู่ในระบบแล้ว` });
      return;
    }

    const selectedVillage = VILLAGE_LIST.find(v => v.no === formData.villageNo);

    const newPatient: PatientScreening = {
      id: `pt-${Date.now()}`,
      hn: formData.hn.trim(),
      villageNo: formData.villageNo,
      villageName: selectedVillage ? selectedVillage.name : `หมู่ ${formData.villageNo}`,
      subdistrict: selectedVillage ? selectedVillage.subdistrict : 'โพนนาแก้ว',
      houseNo: formData.houseNo.trim() || '-',
      prefix: formData.prefix,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      gender: formData.gender,
      ageYears: Number(formData.ageYears) || 50,
      ageMonths: Number(formData.ageMonths) || 0,
      birthDate: formData.birthDate,
      idCard: formData.idCard.replace(/\D/g, '') || '-',
      benefitCode: formData.benefitCode,
      benefitName: formData.benefitName,
      underlyingDisease: formData.underlyingDisease.trim() || 'ไม่มี',
      kitStatus: 'not_received',
      fitResult: 'pending'
    };

    onAddPatient(newPatient);
    setNotification({ type: 'success', message: `บันทึกข้อมูลผู้ป่วย HN: ${newPatient.hn} (${newPatient.prefix}${newPatient.firstName} ${newPatient.lastName}) เรียบร้อยแล้ว` });

    // Reset form with new suggested HN
    const currentNum = parseInt(formData.hn.replace(/\D/g, ''), 10) || 100;
    setFormData({
      hn: `67-${String(currentNum + 1).padStart(5, '0')}`,
      villageNo: formData.villageNo,
      houseNo: '',
      prefix: 'นาย',
      firstName: '',
      lastName: '',
      gender: 'ชาย',
      ageYears: 55,
      ageMonths: 0,
      birthDate: '1971-01-15',
      idCard: '',
      benefitCode: 'UCS',
      benefitName: 'บัตรทอง (UC)',
      underlyingDisease: 'ไม่มี'
    });

    setTimeout(() => setNotification(null), 4000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const imported = await parseExcelPatients(file);
      onImportPatients(imported);
      setNotification({
        type: 'success',
        message: `นำเข้าข้อมูลกลุ่มเป้าหมายจากไฟล์ Excel สำเร็จจำนวน ${imported.length} รายการ`
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `เกิดข้อผิดพลาดในการนำเข้าไฟล์: ${err.message || 'รูปแบบไฟล์ไม่ถูกต้อง'}`
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Filtered patients list
  const filteredPatients = patients.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.hn.toLowerCase().includes(q) ||
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.idCard.includes(q) ||
      p.villageNo.includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Navigation Subtabs */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-md mb-2">
              <UserCheck className="w-3.5 h-3.5" />
              หน้าที่ 2: ระบบลงทะเบียนกลุ่มเป้าหมาย (อายุ 50-70 ปี)
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              ลงทะเบียนข้อมูลผู้ป่วยคัดกรองมะเร็งลำไส้ใหญ่
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              เพิ่มข้อมูลรายบุคคลผ่านแบบฟอร์ม หรือนำเข้ารายชื่อจำนวนมากด้วยไฟล์ Excel
            </p>
          </div>

          {/* Subtab Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'form'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              กรอกฟอร์มทีละคน
            </button>
            <button
              onClick={() => setActiveTab('excel')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'excel'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              นำเข้าไฟล์ Excel
            </button>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}
      </div>

      {/* Main Mode: Form vs Excel */}
      {activeTab === 'form' ? (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <h3 className="text-base font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            แบบฟอร์มลงทะเบียนข้อมูลผู้ป่วยรายใหม่ (โรงพยาบาลโพนนาแก้ว)
          </h3>

          <form onSubmit={handleFormSubmit} className="space-y-5">
            {/* Row 1: HN, ID Card, Village, House No */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  HN (Hospital Number) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.hn}
                  onChange={(e) => setFormData({ ...formData, hn: e.target.value })}
                  placeholder="เช่น 67-00120"
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  เลขที่บัตรประชาชน (13 หลัก) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={13}
                  value={formData.idCard}
                  onChange={(e) => setFormData({ ...formData, idCard: e.target.value })}
                  placeholder="เช่น 3470500123456"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  หมู่ที่ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.villageNo}
                  onChange={(e) => setFormData({ ...formData, villageNo: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {VILLAGE_LIST.map((v) => (
                    <option key={v.no} value={v.no}>
                      หมู่ {v.no} {v.name} (ต.{v.subdistrict})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  บ้านเลขที่ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.houseNo}
                  onChange={(e) => setFormData({ ...formData, houseNo: e.target.value })}
                  placeholder="เช่น 45/2"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Row 2: Prefix, First Name, Last Name, Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  คำนำหน้า <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.prefix}
                  onChange={(e) => {
                    const p = e.target.value;
                    let g: 'ชาย' | 'หญิง' = formData.gender;
                    if (p === 'นาย') g = 'ชาย';
                    if (p === 'นาง' || p === 'นางสาว') g = 'หญิง';
                    setFormData({ ...formData, prefix: p, gender: g });
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="นาย">นาย</option>
                  <option value="นาง">นาง</option>
                  <option value="นางสาว">นางสาว</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ชื่อ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="เช่น สมชาย"
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="เช่น สดใส"
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  เพศ
                </label>
                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="ชาย"
                      checked={formData.gender === 'ชาย'}
                      onChange={() => setFormData({ ...formData, gender: 'ชาย' })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    ชาย
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="หญิง"
                      checked={formData.gender === 'หญิง'}
                      onChange={() => setFormData({ ...formData, gender: 'หญิง' })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    หญิง
                  </label>
                </div>
              </div>
            </div>

            {/* Row 3: BirthDate, Age (Years), Age (Months), Underlying Disease */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  วันเกิด (ว/ด/ป)
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleBirthDateChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  อายุ (ปี) <span className="text-slate-400 font-normal">(กลุ่มเป้าหมาย 50-70 ปี)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={formData.ageYears}
                  onChange={(e) => setFormData({ ...formData, ageYears: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  อายุ (เดือน)
                </label>
                <input
                  type="number"
                  min="0"
                  max="11"
                  value={formData.ageMonths}
                  onChange={(e) => setFormData({ ...formData, ageMonths: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  โรคประจำตัว
                </label>
                <input
                  type="text"
                  value={formData.underlyingDisease}
                  onChange={(e) => setFormData({ ...formData, underlyingDisease: e.target.value })}
                  placeholder="เช่น ความดัน, เบาหวาน หรือ ไม่มี"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Row 4: Benefit Code, Benefit Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  รหัสสิทธิ
                </label>
                <select
                  value={formData.benefitCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    let name = 'บัตรทอง (UC)';
                    if (code === 'OFC') name = 'ข้าราชการ/เบิกตรง';
                    if (code === 'SSS') name = 'ประกันสังคม';
                    if (code === 'LGO') name = 'องค์กรปกครองส่วนท้องถิ่น';
                    if (code === 'PAY') name = 'ชำระเงินเอง';
                    setFormData({ ...formData, benefitCode: code, benefitName: name });
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="UCS">UCS - สิทธิหลักประกันสุขภาพถ้วนหน้า (บัตรทอง)</option>
                  <option value="OFC">OFC - ข้าราชการ/เบิกต้นสังกัด</option>
                  <option value="SSS">SSS - กองทุนประกันสังคม</option>
                  <option value="LGO">LGO - ข้าราชการส่วนท้องถิ่น</option>
                  <option value="PAY">PAY - ชำระเงินเอง</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  สิทธิการรักษา
                </label>
                <input
                  type="text"
                  value={formData.benefitName}
                  onChange={(e) => setFormData({ ...formData, benefitName: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFormData({
                  hn: '',
                  villageNo: '2',
                  houseNo: '',
                  prefix: 'นาย',
                  firstName: '',
                  lastName: '',
                  gender: 'ชาย',
                  ageYears: 50,
                  ageMonths: 0,
                  birthDate: '1976-01-01',
                  idCard: '',
                  benefitCode: 'UCS',
                  benefitName: 'บัตรทอง (UC)',
                  underlyingDisease: 'ไม่มี'
                })}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                ล้างฟอร์ม
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                บันทึกการลงทะเบียนผู้ป่วย
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Excel Upload & Template Section */
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
            <div>
              <h3 className="font-bold text-slate-800 text-base">ดาวน์โหลดไฟล์แม่แบบ Excel (Template)</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                ใช้ไฟล์แม่แบบนี้สำหรับกรอกข้อมูลรายชื่อกลุ่มเป้าหมายคัดกรองมะเร็งลำไส้ใหญ่ในชุมชน/รพ.สต. เพื่อนำเข้าพร้อมกัน
              </p>
            </div>
            <button
              type="button"
              onClick={downloadPatientTemplateExcel}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-2 self-start md:self-auto"
            >
              <Download className="w-4 h-4" />
              ดาวน์โหลด Template Excel (.xlsx)
            </button>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-emerald-50/30 transition-all">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls, .csv"
              className="hidden"
              id="excel-file-input"
            />
            <label htmlFor="excel-file-input" className="cursor-pointer flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <Upload className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">
                คลิกเพื่อเลือกไฟล์ Excel หรือลากไฟล์มาวางที่นี่
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                รองรับไฟล์นามสกุล .xlsx, .xls และ .csv โดยระบบจะจับคู่คอลัมน์ HN, หมู่ที่, บ้านเลขที่, คำนำหน้า, ชื่อ, นามสกุล, บัตรประชาชน และสิทธิการรักษา ให้อัตโนมัติ
              </p>
              <div className="mt-4 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs">
                {isImporting ? 'กำลังประมวลผลไฟล์...' : 'เลือกไฟล์จากคอมพิวเตอร์'}
              </div>
            </label>
          </div>

          {/* Quick Clear before import */}
          {onClearAllPatients && patients.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-amber-800">
                <span className="font-bold">เตรียมนำเข้าข้อมูลใหม่:</span> ปัจจุบันมีข้อมูลผู้ป่วยเดิมค้างอยู่ในระบบ {patients.length} รายการ หากต้องการเริ่มต้นใหม่แบบสะอาด สามารถลบข้อมูลเดิมทั้งหมดออกได้
              </div>
              <button
                type="button"
                onClick={onClearAllPatients}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ลบข้อมูลเดิมทั้งหมด ({patients.length} คน)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Target Patients List & Quick Search */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              รายชื่อผู้ป่วยที่ลงทะเบียนแล้ว ({patients.length} คน)
            </h3>
            <p className="text-xs text-slate-500">
              {patients.length === 0 
                ? 'ยังไม่มีข้อมูลผู้ป่วยในระบบ พร้อมสำหรับการนำเข้าไฟล์ชุดใหม่'
                : 'สามารถค้นหาด้วย HN, ชื่อ, สกุล หรือเลขประจำตัวประชาชน'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigateToStickerPrint && patients.length > 0 && (
              <button
                type="button"
                onClick={() => onNavigateToStickerPrint('')}
                title="ไปที่หน้าพิมพ์สติกเกอร์ขนาด 7x2.5 cm สำหรับผู้ป่วยทั้งหมด"
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                <Tag className="w-3.5 h-3.5 text-emerald-700" />
                <span>พิมพ์สติกเกอร์ (7×2.5 cm)</span>
              </button>
            )}

            {onClearAllPatients && patients.length > 0 && (
              <button
                type="button"
                onClick={onClearAllPatients}
                title="ลบข้อมูลผู้ป่วยทั้งหมดออกจาก Cloud Firebase"
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                ล้างข้อมูล ({patients.length})
              </button>
            )}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหา HN / ชื่อ / เลขบัตร..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/70 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">HN</th>
                <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                <th className="px-4 py-3">เลขบัตร ปชช.</th>
                <th className="px-4 py-3">ที่อยู่</th>
                <th className="px-4 py-3">เพศ/อายุ</th>
                <th className="px-4 py-3">สิทธิการรักษา</th>
                <th className="px-4 py-3">โรคประจำตัว</th>
                <th className="px-4 py-3 text-center">สถานะชุดตรวจ</th>
                <th className="px-4 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-slate-400">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-700 text-sm">ยังไม่มีข้อมูลผู้ป่วยในระบบ</p>
                      <p className="text-xs text-slate-500 mt-1">
                        ระบบพร้อมสำหรับการใช้งานจริง สามารถนำเข้าไฟล์ Excel รายชื่อกลุ่มเป้าหมาย หรือกรอกลงทะเบียนรายบุคคลได้ทันที
                      </p>
                      <button
                        onClick={() => setActiveTab('excel')}
                        className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
                      >
                        นำเข้าไฟล์ Excel ตอนนี้
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    ไม่พบข้อมูลผู้ป่วยที่ตรงกับการค้นหา "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-800">
                      {p.hn}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {p.prefix}{p.firstName} {p.lastName}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {p.idCard}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      บ้านเลขที่ {p.houseNo} ม.{p.villageNo} {p.villageName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.gender} / {p.ageYears} ปี {p.ageMonths > 0 ? `${p.ageMonths} ด.` : ''}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px] font-mono mr-1">
                        {p.benefitCode}
                      </span>
                      {p.benefitName}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {p.underlyingDisease || 'ไม่มี'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.kitStatus === 'tested' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          ตรวจแล้ว
                        </span>
                      ) : p.kitStatus === 'received' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                          ส่งชุดตรวจแล้ว
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                          ยังไม่ส่งชุดตรวจ
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {onNavigateToStickerPrint && (
                          <button
                            type="button"
                            onClick={() => onNavigateToStickerPrint(p.hn)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="พิมพ์สติกเกอร์ 7x2.5 cm สำหรับผู้ป่วยรายนี้"
                          >
                            <Tag className="w-4 h-4" />
                          </button>
                        )}
                        {onEditPatient && (
                          <button
                            type="button"
                            onClick={() => onEditPatient(p)}
                            className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="แก้ไขข้อมูลผู้ป่วย (Admin Edit)"
                          >
                            <Edit3 className="w-4 h-4 text-blue-600" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeletePatient(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="ลบข้อมูลผู้ป่วย (Admin Delete)"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
