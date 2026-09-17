import React, { useMemo } from 'react';
import { PatientScreening, VillageSummary } from '../types';
import { VILLAGE_LIST } from '../mockData';
import { 
  Activity, 
  CheckCircle2, 
  AlertOctagon, 
  HelpCircle, 
  Users, 
  PackageCheck, 
  Building2, 
  ArrowUpRight,
  TrendingUp,
  Percent,
  Search,
  Edit3,
  Trash2,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { UserAccount } from '../types';

interface DashboardViewProps {
  patients: PatientScreening[];
  onNavigateToTab: (tabId: any) => void;
  onEditPatient?: (patient: PatientScreening) => void;
  onDeletePatient?: (patient: PatientScreening) => void;
  currentUser?: UserAccount | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  patients,
  onNavigateToTab,
  onEditPatient,
  onDeletePatient,
  currentUser
}) => {
  const [adminSearchQuery, setAdminSearchQuery] = React.useState('');
  const isAdmin = currentUser?.role === 'admin';

  const adminMatchedPatients = useMemo(() => {
    if (!adminSearchQuery.trim()) return [];
    const q = adminSearchQuery.toLowerCase().trim();
    return patients.filter(p => 
      p.hn.toLowerCase().includes(q) || 
      `${p.prefix}${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.idCard.includes(q)
    ).slice(0, 5);
  }, [patients, adminSearchQuery]);
  const stats = useMemo(() => {
    const totalRegistered = patients.length;
    const totalReceivedKits = patients.filter(p => p.kitStatus === 'received' || p.kitStatus === 'tested').length;
    const totalTested = patients.filter(p => p.kitStatus === 'tested').length;

    const negativeCount = patients.filter(p => p.fitResult === 'negative').length;
    const positiveCount = patients.filter(p => p.fitResult === 'positive').length;
    const inconclusiveCount = patients.filter(p => p.fitResult === 'inconclusive').length;
    const pendingCount = patients.filter(p => p.fitResult === 'pending').length;

    const testRate = totalRegistered > 0 ? (totalTested / totalRegistered) * 100 : 0;
    const negativeRate = totalTested > 0 ? (negativeCount / totalTested) * 100 : 0;
    const positiveRate = totalTested > 0 ? (positiveCount / totalTested) * 100 : 0;
    const inconclusiveRate = totalTested > 0 ? (inconclusiveCount / totalTested) * 100 : 0;

    // Village breakdown
    const villageMap: Record<string, VillageSummary> = {};

    // Initialize with known villages
    VILLAGE_LIST.forEach(v => {
      villageMap[v.no] = {
        villageNo: v.no,
        villageName: v.name,
        totalRegistered: 0,
        totalTested: 0,
        negativeCount: 0,
        positiveCount: 0,
        inconclusiveCount: 0,
        pendingCount: 0,
        positiveRate: 0,
        negativeRate: 0
      };
    });

    // Populate with patient data
    patients.forEach(p => {
      const rawNo = (p.villageNo || '').trim();
      const matchNo = rawNo.match(/\d+/);
      const vNo = matchNo ? String(parseInt(matchNo[0], 10)) : (rawNo || '2');
      if (!villageMap[vNo]) {
        villageMap[vNo] = {
          villageNo: vNo,
          villageName: p.villageName || `หมู่ ${vNo}`,
          totalRegistered: 0,
          totalTested: 0,
          negativeCount: 0,
          positiveCount: 0,
          inconclusiveCount: 0,
          pendingCount: 0,
          positiveRate: 0,
          negativeRate: 0
        };
      }

      villageMap[vNo].totalRegistered += 1;
      if (p.kitStatus === 'tested') {
        villageMap[vNo].totalTested += 1;
        if (p.fitResult === 'negative') villageMap[vNo].negativeCount += 1;
        if (p.fitResult === 'positive') villageMap[vNo].positiveCount += 1;
        if (p.fitResult === 'inconclusive') villageMap[vNo].inconclusiveCount += 1;
      } else {
        villageMap[vNo].pendingCount += 1;
      }
    });

    const villageList = Object.values(villageMap).map(v => ({
      ...v,
      positiveRate: v.totalTested > 0 ? (v.positiveCount / v.totalTested) * 100 : 0,
      negativeRate: v.totalTested > 0 ? (v.negativeCount / v.totalTested) * 100 : 0
    })).sort((a, b) => parseInt(a.villageNo, 10) - parseInt(b.villageNo, 10));

    return {
      totalRegistered,
      totalReceivedKits,
      totalTested,
      negativeCount,
      positiveCount,
      inconclusiveCount,
      pendingCount,
      testRate,
      negativeRate,
      positiveRate,
      inconclusiveRate,
      villageList
    };
  }, [patients]);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome & Section Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-md mb-2">
            <Building2 className="w-3.5 h-3.5" />
            หน่วยบริการ โรงพยาบาลโพนนาแก้ว อ.โพนนาแก้ว จ.สกลนคร
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            Dashboard แสดงผลการคัดกรองมะเร็งลำไส้ใหญ่และลำไส้ตรงด้วยวิธี FIT Test (Workload)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            สรุปผลการดำเนินงานตรวจคัดกรองด้วยชุดตรวจ FIT Test รหัสหัตถการ สปสช. 1B0060 (ผลลบ) และ 1B0061 (ผลบวก)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToTab('result-entry')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Activity className="w-4 h-4" />
            บันทึกผลตรวจ FIT Test
          </button>
          <button
            onClick={() => onNavigateToTab('referral')}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5"
          >
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            ส่งต่อส่องกล้อง ({stats.positiveCount})
          </button>
        </div>
      </div>

      {/* Empty State Banner if 0 patients */}
      {patients.length === 0 && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                ระบบพร้อมใช้งาน (ฐานข้อมูลว่างเปล่า พร้อมสำหรับนำเข้ารายชื่อจริง)
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                ข้อมูลผู้ป่วยตัวอย่างเดิมถูกลบออกเรียบร้อยแล้ว ท่านสามารถเริ่มต้นโดยนำเข้าไฟล์ Excel รายชื่อกลุ่มเป้าหมาย (อายุ 50-70 ปี) หรือลงทะเบียนผู้ป่วยใหม่ผ่านระบบได้ทันที
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('registration')}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-2 flex-shrink-0"
          >
            <Users className="w-4 h-4" />
            ไปที่หน้าลงทะเบียน / นำเข้า Excel
          </button>
        </div>
      )}

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered & Workload */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">รวมเป้าหมายลงทะเบียน</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800">{stats.totalRegistered}</span>
            <span className="text-xs text-slate-500 font-medium">คน</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">รับชุดตรวจแล้ว:</span>
            <span className="font-semibold text-slate-700">{stats.totalReceivedKits} คน ({((stats.totalReceivedKits / (stats.totalRegistered || 1)) * 100).toFixed(1)}%)</span>
          </div>
        </div>

        {/* Card 2: Total Tested (Workload) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">รวมตรวจคัดกรองแล้ว (Workload)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-indigo-700">{stats.totalTested}</span>
            <span className="text-xs text-slate-500 font-medium">คน</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">ร้อยละของเป้าหมาย:</span>
            <span className="font-bold text-indigo-600">{stats.testRate.toFixed(1)}%</span>
          </div>
        </div>

        {/* Card 3: Negative 1B0060 */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 bg-gradient-to-b from-emerald-50/30 to-white shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-800">ผลลบ (Negative)</span>
              <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-emerald-100 text-emerald-800 rounded font-mono font-bold">1B0060</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-600">{stats.negativeCount}</span>
            <span className="text-xs text-slate-500 font-medium">คน</span>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">ร้อยละผลลบ:</span>
            <span className="font-bold text-emerald-700 text-sm">{stats.negativeRate.toFixed(1)}%</span>
          </div>
        </div>

        {/* Card 4: Positive 1B0061 */}
        <div className="bg-white rounded-2xl p-5 border border-rose-200/90 bg-gradient-to-b from-rose-50/30 to-white shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-rose-800">ผลบวก (Positive)</span>
              <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-rose-100 text-rose-800 rounded font-mono font-bold">1B0061</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-600">{stats.positiveCount}</span>
            <span className="text-xs text-slate-500 font-medium">คน</span>
          </div>
          <div className="mt-3 pt-3 border-t border-rose-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">ร้อยละผลบวก:</span>
            <span className="font-bold text-rose-700 text-sm">{stats.positiveRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Visual Percentage Gauges / Diagrams */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Gauge 1: แผนภูมิแสดง ร้อยละผลลบ (1B0060) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              แผนภูมิแสดง ร้อยละผลลบ (Negative 1B0060)
            </h3>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              เกณฑ์ปกติ
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            ผู้รับบริการที่มีผลตรวจเป็นลบ ไม่พบเลือดแฝงในอุจจาระ นัดตรวจซ้ำทุก 2 ปี
          </p>

          <div className="flex flex-col items-center justify-center my-4">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500 transition-all duration-1000 ease-out"
                  strokeDasharray={`${stats.negativeRate}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold text-emerald-600">{stats.negativeRate.toFixed(1)}%</span>
                <span className="text-[11px] text-slate-500 font-medium">ผลลบ</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/60 rounded-xl p-3 text-xs text-slate-700 flex justify-between items-center">
            <span>จำนวนผู้มีผลลบ:</span>
            <strong className="text-emerald-800 font-semibold">{stats.negativeCount} / {stats.totalTested} คน</strong>
          </div>
        </div>

        {/* Gauge 2: แผนภูมิแสดง ร้อยละผลบวก (1B0061) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              แผนภูมิแสดง ร้อยละผลบวก (Positive 1B0061)
            </h3>
            <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
              ต้องส่งต่อ
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            ผู้รับบริการที่มีผลตรวจเป็นบวก พบเลือดแฝงในอุจจาระ ต้องส่งต่อส่องกล้อง Colonoscopy
          </p>

          <div className="flex flex-col items-center justify-center my-4">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-rose-500 transition-all duration-1000 ease-out"
                  strokeDasharray={`${stats.positiveRate}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold text-rose-600">{stats.positiveRate.toFixed(1)}%</span>
                <span className="text-[11px] text-slate-500 font-medium">ผลบวก</span>
              </div>
            </div>
          </div>

          <div className="bg-rose-50/60 rounded-xl p-3 text-xs text-slate-700 flex justify-between items-center">
            <span>จำนวนผู้มีผลบวก:</span>
            <strong className="text-rose-800 font-semibold">{stats.positiveCount} / {stats.totalTested} คน</strong>
          </div>
        </div>

        {/* Gauge 3: Inconclusive & Pending Status */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span>
              ออกผลไม่ได้ (Inconclusive) & รอตรวจ
            </h3>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
              ติดตาม
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            แถบควบคุมไม่ขึ้น หรือตัวอย่างไม่สมบูรณ์ ต้องจ่ายชุดตรวจใหม่ให้ตรวจซ้ำ
          </p>

          <div className="my-2 space-y-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                  ออกผลไม่ได้ (Inconclusive)
                </span>
                <span className="font-bold text-slate-900">{stats.inconclusiveCount} คน ({stats.inconclusiveRate.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-slate-800 h-2 rounded-full" 
                  style={{ width: `${Math.min(stats.inconclusiveRate, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-100">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-amber-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  อยู่ระหว่างรอผลตรวจ/ยังไม่ตรวจ
                </span>
                <span className="font-bold text-amber-800">{stats.pendingCount} คน</span>
              </div>
              <div className="w-full bg-amber-200/70 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-amber-500 h-2 rounded-full" 
                  style={{ width: `${Math.min((stats.pendingCount / (stats.totalRegistered || 1)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-slate-100/70 rounded-xl p-3 text-xs text-slate-600 flex justify-between items-center mt-2">
            <span>ความก้าวหน้าการตรวจ:</span>
            <strong className="text-slate-800 font-semibold">{stats.totalTested} จากเป้าหมาย {stats.totalRegistered}</strong>
          </div>
        </div>

      </div>

      {/* Admin Quick Patient Search & Action Section */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 border border-blue-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  สิทธิ์ผู้ดูแลระบบ (Admin): ค้นหาและจัดการแก้ไข/ลบข้อมูลผู้ป่วยด่วน
                </h3>
                <p className="text-xs text-slate-500">
                  ค้นหาจาก HN, เลขบัตรประชาชน หรือชื่อ-สกุล เพื่อแก้ไขข้อมูลหรือลบรายการได้ทันที
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('all-list')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto hover:underline"
            >
              <span>ดูรายชื่อผู้ป่วยทั้งหมด ({patients.length} ราย)</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={adminSearchQuery}
              onChange={(e) => setAdminSearchQuery(e.target.value)}
              placeholder="พิมพ์ค้นหา HN, เลขบัตร 13 หลัก, หรือชื่อ-สกุลผู้ป่วย..."
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          {adminMatchedPatients.length > 0 && (
            <div className="mt-3 divide-y divide-blue-100 bg-white rounded-xl border border-blue-200 overflow-hidden shadow-xs">
              {adminMatchedPatients.map((p) => (
                <div key={p.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 font-mono text-xs font-bold flex items-center justify-center border border-emerald-200">
                      HN
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-emerald-900">{p.hn}</span>
                        <span className="text-xs font-bold text-slate-900">{p.prefix}{p.firstName} {p.lastName}</span>
                        <span className="text-[11px] text-slate-400">• CID: {p.idCard}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        ม.{p.villageNo} {p.villageName} | อายุ {p.ageYears} ปี | สิทธิ: {p.benefitName}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {onEditPatient && (
                      <button
                        type="button"
                        onClick={() => onEditPatient(p)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>แก้ไขข้อมูล</span>
                      </button>
                    )}
                    {onDeletePatient && (
                      <button
                        type="button"
                        onClick={() => onDeletePatient(p)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบ</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Village Breakdown Table & Comparison (ข้อมูลคัดกรองแยกรายหมู่บ้าน) */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              ข้อมูลการคัดกรองมะเร็งลำไส้ใหญ่ แยกรายหมู่บ้าน (อ.โพนนาแก้ว)
            </h3>
            <p className="text-xs text-slate-500">
              สรุปจำนวนเป้าหมาย ผลตรวจ 1B0060, 1B0061 และอัตราความผิดปกติในแต่ละหมู่บ้าน
            </p>
          </div>
          <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full self-start sm:self-auto">
            ครอบคลุม {stats.villageList.length} หมู่บ้าน
          </span>
        </div>

        {/* 1. Mobile Village Cards (สำหรับโทรศัพท์มือถือ sm:hidden) */}
        <div className="sm:hidden divide-y divide-slate-100 p-2">
          {stats.villageList.map((v) => (
            <div key={v.villageNo} className="p-3 bg-white rounded-xl mb-2 border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">
                  ม.{v.villageNo} {v.villageName}
                </span>
                {v.positiveCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                    พบผลบวก {v.positiveCount} คน
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
                    ปกติทั้งหมด
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                <div className="p-1.5 bg-slate-50 rounded-lg">
                  <div className="text-slate-400">เป้าหมาย</div>
                  <div className="font-bold text-slate-800 text-xs mt-0.5">{v.totalRegistered}</div>
                </div>
                <div className="p-1.5 bg-indigo-50 rounded-lg">
                  <div className="text-indigo-600">ตรวจแล้ว</div>
                  <div className="font-bold text-indigo-900 text-xs mt-0.5">{v.totalTested}</div>
                </div>
                <div className="p-1.5 bg-emerald-50 rounded-lg">
                  <div className="text-emerald-700">ผลลบ (-)</div>
                  <div className="font-bold text-emerald-800 text-xs mt-0.5">{v.negativeCount}</div>
                </div>
                <div className="p-1.5 bg-rose-50 rounded-lg">
                  <div className="text-rose-700">ผลบวก (+)</div>
                  <div className="font-bold text-rose-800 text-xs mt-0.5">{v.positiveCount}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-100">
                <span>อัตราผลบวก: <strong className={v.positiveRate > 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}>{v.positiveRate.toFixed(1)}%</strong></span>
                <span>รอตรวจ: <strong className="text-amber-600">{v.pendingCount}</strong> คน</span>
              </div>
            </div>
          ))}
        </div>

        {/* 2. Desktop Table (hidden sm:block) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-center">หมู่ที่</th>
                <th className="px-4 py-3">ชื่อหมู่บ้าน / ตำบล</th>
                <th className="px-4 py-3 text-right">เป้าหมาย (คน)</th>
                <th className="px-4 py-3 text-right">ตรวจแล้ว (คน)</th>
                <th className="px-4 py-3 text-right text-emerald-700">ผลลบ 1B0060</th>
                <th className="px-4 py-3 text-right text-rose-700">ผลบวก 1B0061</th>
                <th className="px-4 py-3 text-right text-slate-600">ออกผลไม่ได้</th>
                <th className="px-4 py-3 text-right text-amber-600">รอตรวจ</th>
                <th className="px-4 py-3 text-right">ร้อยละผลบวก (%)</th>
                <th className="px-4 py-3 text-center">สถานะการส่งต่อ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {stats.villageList.map((v) => (
                <tr key={v.villageNo} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 text-center font-bold text-slate-700">
                    ม.{v.villageNo}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {v.villageName}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-700">
                    {v.totalRegistered}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-indigo-600">
                    {v.totalTested}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600 bg-emerald-50/30">
                    {v.negativeCount}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-rose-600 bg-rose-50/30">
                    {v.positiveCount}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {v.inconclusiveCount}
                  </td>
                  <td className="px-4 py-3 text-right text-amber-600">
                    {v.pendingCount}
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    <span className={v.positiveRate > 0 ? 'text-rose-600' : 'text-slate-400'}>
                      {v.positiveRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {v.positiveCount > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                        ส่งต่อ Colonoscopy {v.positiveCount} ราย
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                        ปกติทั้งหมด
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-right font-bold text-slate-800">
                  รวมทั้งสิ้น (โรงพยาบาลโพนนาแก้ว):
                </td>
                <td className="px-4 py-3 text-right text-slate-900 font-bold">{stats.totalRegistered}</td>
                <td className="px-4 py-3 text-right text-indigo-700 font-bold">{stats.totalTested}</td>
                <td className="px-4 py-3 text-right text-emerald-700 font-bold">{stats.negativeCount}</td>
                <td className="px-4 py-3 text-right text-rose-700 font-bold">{stats.positiveCount}</td>
                <td className="px-4 py-3 text-right text-slate-700">{stats.inconclusiveCount}</td>
                <td className="px-4 py-3 text-right text-amber-700">{stats.pendingCount}</td>
                <td className="px-4 py-3 text-right text-rose-700 font-bold">{stats.positiveRate.toFixed(1)}%</td>
                <td className="px-4 py-3 text-center text-rose-700">ส่งต่อ {stats.positiveCount} ราย</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
