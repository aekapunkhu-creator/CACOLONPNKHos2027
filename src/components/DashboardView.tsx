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
  UserCheck,
  Banknote,
  Coins,
  FileText
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
    const list = Array.isArray(patients) ? patients : [];
    return list.filter(p => 
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

    const REIMBURSEMENT_RATE = 60; // 60 บาท ต่อคน (สปสช.)
    const totalEarnedReimbursement = totalTested * REIMBURSEMENT_RATE;
    const totalTargetReimbursement = totalRegistered * REIMBURSEMENT_RATE;
    const pendingReimbursement = pendingCount * REIMBURSEMENT_RATE;
    const negativeReimbursement = negativeCount * REIMBURSEMENT_RATE;
    const positiveReimbursement = positiveCount * REIMBURSEMENT_RATE;
    const inconclusiveReimbursement = inconclusiveCount * REIMBURSEMENT_RATE;
    const reimbursementRatePercent = totalRegistered > 0 ? (totalTested / totalRegistered) * 100 : 0;

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
      villageList,
      REIMBURSEMENT_RATE,
      totalEarnedReimbursement,
      totalTargetReimbursement,
      pendingReimbursement,
      negativeReimbursement,
      positiveReimbursement,
      inconclusiveReimbursement,
      reimbursementRatePercent
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
            สรุปผลการดำเนินงานตรวจคัดกรองด้วยชุดตรวจ FIT Test รหัสหัตถการ สปสช. 1B0060 (ผลลบ) และ 1B0061 (ผลบวก) | ค่าชดเชยตรวจคัดกรอง สปสช. 60 บาท/คน
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

      {/* Reimbursement Presentation Section (ค่าชดเชยตรวจคัดกรองมะเร็งลำไส้ใหญ่และลำไส้ตรง 60 บาท ต่อคน) */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden border border-emerald-500/30">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30 shadow-inner flex-shrink-0">
                <Banknote className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 text-[11px] font-semibold">
                    สปสช. กองทุนสร้างเสริมสุขภาพและป้องกันโรค (P&P)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30 text-[11px] font-bold flex items-center gap-1">
                    <Coins className="w-3 h-3 text-amber-300" />
                    ค่าชดเชย 60 บาท / คน
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  ค่าชดเชยตรวจคัดกรองมะเร็งลำไส้ใหญ่และไส้ตรง (FIT Test)
                </h3>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  การจัดสรรชดเชยค่าบริการตรวจคัดกรอง รหัส 1B0060 และ 1B0061 อัตรา 60 บาท ต่อประชากรเป้าหมายที่ได้รับการตรวจคัดกรอง
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 flex items-center gap-3 self-start sm:self-auto">
              <div className="text-right">
                <div className="text-[10px] text-emerald-200 uppercase tracking-wider font-semibold">อัตราชดเชยมาตรฐาน</div>
                <div className="text-base sm:text-lg font-bold text-white font-mono flex items-baseline gap-1 justify-end">
                  <span className="text-emerald-300">฿</span>
                  <span>60.00</span>
                  <span className="text-[11px] font-normal text-slate-300">/ คน</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Main Figures */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1: Earned / Realized */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-emerald-400/30 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-200">ค่าชดเชยที่ตรวจแล้ว (พร้อมส่งเบิก e-Claim)</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                  ตรวจแล้ว
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-300">
                  {stats.totalEarnedReimbursement.toLocaleString()}
                </span>
                <span className="text-sm font-medium text-white/80">บาท</span>
              </div>
              <div className="text-[11px] text-emerald-100/70 mt-1 flex items-center justify-between">
                <span>ผู้ตรวจแล้ว {stats.totalTested} คน × 60 บาท</span>
                <span className="font-mono text-emerald-300 font-bold">{stats.reimbursementRatePercent.toFixed(1)}%</span>
              </div>
            </div>

            {/* 2: Target / Total Estimated */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cyan-200">ประมาณการวงเงินชดเชยตามเป้าหมาย</span>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/30 text-cyan-200 text-[10px] font-bold">
                  เป้าหมาย 100%
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
                  {stats.totalTargetReimbursement.toLocaleString()}
                </span>
                <span className="text-sm font-medium text-white/80">บาท</span>
              </div>
              <div className="text-[11px] text-cyan-100/70 mt-1">
                เป้าหมายทั้งหมด {stats.totalRegistered} คน × 60 บาท
              </div>
            </div>

            {/* 3: Pending Remaining */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-200">วงเงินชดเชยส่วนที่รอการตรวจ</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/30 text-amber-200 text-[10px] font-bold">
                  รอตรวจ
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-300">
                  {stats.pendingReimbursement.toLocaleString()}
                </span>
                <span className="text-sm font-medium text-white/80">บาท</span>
              </div>
              <div className="text-[11px] text-amber-100/70 mt-1">
                คงเหลือรอการตรวจอีก {stats.pendingCount} คน × 60 บาท
              </div>
            </div>
          </div>

          {/* Progress Bar & Sub-Breakdown */}
          <div className="bg-black/25 rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-200 font-medium">ความก้าวหน้าการเบิกชดเชยงบประมาณ:</span>
                <span className="font-bold text-white font-mono text-sm">{stats.reimbursementRatePercent.toFixed(1)}%</span>
              </div>
              <span className="text-emerald-300/80 text-[11px]">
                ตรวจและพร้อมเบิกแล้ว ฿{stats.totalEarnedReimbursement.toLocaleString()} จากเป้าหมายรวม ฿{stats.totalTargetReimbursement.toLocaleString()} บาท
              </span>
            </div>

            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden p-0.5 border border-white/10">
              <div 
                className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 h-2 rounded-full transition-all duration-1000 shadow-sm"
                style={{ width: `${Math.min(stats.reimbursementRatePercent, 100)}%` }}
              ></div>
            </div>

            {/* Breakdown by FIT Result Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
              <div className="flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors rounded-xl px-3.5 py-2.5 border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <div>
                    <div className="text-emerald-200 font-medium">ผลลบ (1B0060)</div>
                    <div className="text-[11px] text-slate-300">{stats.negativeCount} ราย × 60 บาท</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-300 text-sm">
                  ฿{stats.negativeReimbursement.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors rounded-xl px-3.5 py-2.5 border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                  <div>
                    <div className="text-rose-200 font-medium">ผลบวก (1B0061)</div>
                    <div className="text-[11px] text-slate-300">{stats.positiveCount} ราย × 60 บาท (ส่งต่อ)</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-rose-300 text-sm">
                  ฿{stats.positiveReimbursement.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors rounded-xl px-3.5 py-2.5 border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <div>
                    <div className="text-slate-300 font-medium">ออกผลไม่ได้ (Inconclusive)</div>
                    <div className="text-[11px] text-slate-400">{stats.inconclusiveCount} ราย × 60 บาท</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-200 text-sm">
                  ฿{stats.inconclusiveReimbursement.toLocaleString()}
                </span>
              </div>
            </div>
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

              {/* Mobile Reimbursement Pill */}
              <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 bg-emerald-50/90 rounded-lg text-emerald-900 border border-emerald-200/60">
                <span className="flex items-center gap-1.5 font-medium">
                  <Banknote className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ค่าชดเชยตรวจคัดกรอง (60 บ./คน):</span>
                </span>
                <span className="font-mono font-bold text-emerald-800">
                  ฿{(v.totalTested * 60).toLocaleString()}
                </span>
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
                <th className="px-4 py-3 text-right text-emerald-800 bg-emerald-50/60 font-bold">ค่าชดเชย (60 บ./คน)</th>
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
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-800 bg-emerald-50/40">
                    ฿{(v.totalTested * 60).toLocaleString()}
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
                <td className="px-4 py-3 text-right text-emerald-800 font-mono font-bold bg-emerald-100/50">
                  ฿{stats.totalEarnedReimbursement.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center text-rose-700">ส่งต่อ {stats.positiveCount} ราย</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 5. Infographic & Reference Guideline Section (แนวทางการลงผลตรวจและชดเชย E-Claim 60 บาท) */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-emerald-50/30 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>แนวทางการลงผลตรวจและชดเชยค่าบริการตรวจคัดกรองมะเร็งลำไส้ใหญ่ในระบบ E-Claim</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  ชดเชย 60 บาท / คน
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                คู่มือการลงข้อมูล SpecialPP, ICD-10 และรหัส Claim หน้า F6 สำหรับหน่วยบริการ
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Main Visual Infographic Card Matching the Diagram */}
          <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Left Column: กลุ่มเป้าหมาย & ตราสัญลักษณ์ & เงื่อนไข Claim */}
              <div className="lg:col-span-4 space-y-4">
                {/* กลุ่มเป้าหมาย */}
                <div className="relative bg-white rounded-xl border border-amber-300 p-3.5 shadow-xs pl-12 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-10 bg-amber-500 text-white flex items-center justify-center font-bold text-[10px] [writing-mode:vertical-rl] rotate-180 tracking-wider">
                    กลุ่มเป้าหมาย
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    ผู้มีอายุ 50 - 70 ปี
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">
                    คนละ 1 ครั้งทุก 2 ปี
                  </div>
                </div>

                {/* E-Claim Seal */}
                <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-red-700 text-white rounded-2xl p-4 text-center shadow-sm border border-rose-800 relative">
                  <div className="inline-flex items-center justify-center px-2 py-0.5 bg-white text-rose-800 rounded font-black text-[10px] tracking-wider mb-1.5 shadow-2xs">
                    E-CLAIM
                  </div>
                  <div className="text-sm sm:text-base font-bold leading-snug">
                    ตรวจคัดกรองมะเร็งลำไส้ใหญ่และลำไส้ตรง
                  </div>
                </div>

                {/* เงื่อนไข Claim */}
                <div className="relative bg-white rounded-xl border border-teal-300 p-3.5 shadow-xs pl-12 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-10 bg-teal-600 text-white flex items-center justify-center font-bold text-[10px] [writing-mode:vertical-rl] rotate-180 tracking-wider">
                    เงื่อนไข Claim
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed">
                    ค่าบริการตรวจคัดกรองมะเร็งลำไส้ใหญ่และลำไส้ตรงด้วยวิธีการตรวจหาเลือดแฝงในอุจจาระ (FIT Test) และให้คำปรึกษาแนะนำ <strong>จ่ายแบบเหมาจ่ายในอัตรา 60 บาทต่อครั้ง</strong>
                  </div>
                </div>
              </div>

              {/* Center Column: ชดเชย 60 บาท (Wedge / Arrow) */}
              <div className="lg:col-span-2 flex flex-col items-center justify-center py-2 lg:py-0">
                <div className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white px-5 py-3 rounded-2xl shadow-md flex items-center gap-2 border border-pink-300 transform lg:scale-105">
                  <Coins className="w-5 h-5 text-amber-300" />
                  <div className="text-center">
                    <div className="text-[10px] text-pink-200 uppercase font-bold tracking-wider">ชดเชย</div>
                    <div className="text-xl font-black font-mono tracking-tight text-white">60 บาท</div>
                  </div>
                </div>
              </div>

              {/* Right Column: 4 Key Codes and Rules + Vertical Strip */}
              <div className="lg:col-span-6 flex flex-col sm:flex-row gap-3 items-stretch">
                <div className="flex-1 space-y-3">
                  {/* อาการสำคัญ */}
                  <div className="flex items-center gap-2 bg-amber-400 text-slate-900 rounded-2xl p-2.5 shadow-xs border border-amber-500">
                    <div className="w-9 h-9 rounded-xl bg-white/90 text-amber-700 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                      อาการ
                    </div>
                    <div className="text-xs font-bold leading-tight">
                      ตรวจคัดกรองมะเร็งลำไส้ใหญ่และลำไส้ตรง (Fit test)
                    </div>
                  </div>

                  {/* บันทึก อื่นๆ (SpecialPP) */}
                  <div className="flex items-center gap-2 bg-rose-600 text-white rounded-2xl p-2.5 shadow-xs border border-rose-700">
                    <div className="w-9 h-9 rounded-xl bg-white text-rose-700 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                      อื่นๆ
                    </div>
                    <div className="text-xs font-bold leading-tight">
                      <div>บันทึก SpecialPP:</div>
                      <div className="text-[11px] font-normal text-rose-100 mt-0.5">
                        <strong className="font-mono text-white bg-rose-800/60 px-1 py-0.2 rounded">1B0060</strong> ผลลบ / <strong className="font-mono text-white bg-rose-800/60 px-1 py-0.2 rounded">1B0061</strong> ผลบวก
                      </div>
                    </div>
                  </div>

                  {/* ICD 10 */}
                  <div className="flex items-center gap-2 bg-emerald-100 text-emerald-950 rounded-2xl p-2.5 shadow-xs border border-emerald-300">
                    <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                      ICD10
                    </div>
                    <div className="text-xs font-bold leading-tight">
                      <div className="font-mono text-emerald-900 font-black">Z12.1</div>
                      <div className="text-[11px] font-medium text-emerald-800 mt-0.5">
                        การตรวจคัดกรองพิเศษสำหรับเนื้องอกของลำไส้
                      </div>
                    </div>
                  </div>

                  {/* CLAIM */}
                  <div className="flex items-center gap-2 bg-indigo-900 text-white rounded-2xl p-2.5 shadow-xs border border-indigo-950">
                    <div className="w-9 h-9 rounded-xl bg-white text-indigo-900 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                      CLAIM
                    </div>
                    <div className="text-xs font-bold leading-tight">
                      <div className="font-mono text-amber-300 font-black">90005</div>
                      <div className="text-[11px] font-normal text-indigo-100 mt-0.5">
                        ค่าบริการคัดกรองมะเร็งลำไส้ใหญ่และลำไส้ตรง
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vertical Strip: ลงผลตรวจใน E-Claim หน้า F6 */}
                <div className="w-full sm:w-12 bg-slate-900 text-white rounded-2xl p-3 flex sm:flex-col items-center justify-center text-center font-bold text-xs tracking-wider shadow-sm sm:[writing-mode:vertical-rl] sm:rotate-180 border border-slate-800">
                  ลงผลตรวจใน E-Claim หน้า F6
                </div>
              </div>

            </div>
          </div>

          {/* Actual Embedded Image */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                รูปภาพต้นฉบับ: แนวทางการลงผลตรวจและชดเชยค่าบริการตรวจคัดกรอง E-Claim (60 บาท)
              </span>
              <span className="text-[11px] text-slate-400">
                สปสช. • อัตราเหมาจ่าย 60 บาท / ครั้ง
              </span>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-200/80 bg-white flex items-center justify-center p-2">
              <img
                src="/eclaim-fittest-guideline.jpg"
                alt="แนวทางการลงผลตรวจและชดเชยค่าบริการตรวจคัดกรองมะเร็งลำไส้ใหญ่และลำไส้ตรง E-Claim 60 บาท"
                className="w-full max-h-[600px] object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
