import React, { useMemo, useState } from 'react';
import { PatientScreening, VillageSummary, UserAccount } from '../types';
import { VILLAGE_LIST } from '../mockData';
import { 
  Activity, 
  CheckCircle2, 
  AlertOctagon, 
  AlertTriangle,
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
  FileText,
  Stethoscope,
  MapPin,
  Clock,
  Printer,
  ChevronRight,
  HeartPulse,
  Share2,
  ExternalLink,
  Sparkles,
  UserPlus,
  FlaskConical
} from 'lucide-react';

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
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [activeSectionFilter, setActiveSectionFilter] = useState<'all' | 'screening' | 'referral' | 'colonoscopy' | 'gis'>('all');
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

  // Comprehensive Pipeline & Metrics Calculation covering all 8 modules
  const stats = useMemo(() => {
    const list = Array.isArray(patients) ? patients : [];
    const totalRegistered = list.length;
    
    // Module 1 & 2: Registration & Target Demographics
    const maleCount = list.filter(p => p.gender === 'ชาย').length;
    const femaleCount = list.filter(p => p.gender === 'หญิง').length;
    const age50to59 = list.filter(p => p.ageYears >= 50 && p.ageYears <= 59).length;
    const age60to70 = list.filter(p => p.ageYears >= 60 && p.ageYears <= 70).length;
    const ucsBenefitCount = list.filter(p => p.benefitCode === 'UCS' || p.benefitName?.includes('บัตรทอง')).length;
    const otherBenefitCount = totalRegistered - ucsBenefitCount;

    // Module 3 & 4: Kit Distribution & Sample Receiving & Vitals
    const kitsDistributed = list.filter(p => p.kitStatus === 'received' || p.kitStatus === 'tested').length;
    const kitsPendingDist = list.filter(p => p.kitStatus === 'not_received').length;
    const totalTested = list.filter(p => p.kitStatus === 'tested').length;
    const samplePendingReturn = kitsDistributed - totalTested;

    // Vitals from VHV
    const patientsWithBmi = list.filter(p => typeof p.bmi === 'number' && p.bmi > 0);
    const overweightCount = patientsWithBmi.filter(p => (p.bmi || 0) >= 23).length;
    const normalBmiCount = patientsWithBmi.length - overweightCount;
    
    const patientsWithBp = list.filter(p => typeof p.bloodPressureSys === 'number' && p.bloodPressureSys > 0);
    const highBpCount = patientsWithBp.filter(p => (p.bloodPressureSys || 0) >= 140 || (p.bloodPressureDia || 0) >= 90).length;
    const normalBpCount = patientsWithBp.length - highBpCount;

    // Module 5: FIT Lab Testing Results & Reimbursement
    const negativeCount = list.filter(p => p.fitResult === 'negative').length;
    const positiveCount = list.filter(p => p.fitResult === 'positive').length;
    const inconclusiveCount = list.filter(p => p.fitResult === 'inconclusive').length;
    const pendingCount = list.filter(p => p.fitResult === 'pending').length;

    const testRate = totalRegistered > 0 ? (totalTested / totalRegistered) * 100 : 0;
    const negativeRate = totalTested > 0 ? (negativeCount / totalTested) * 100 : 0;
    const positiveRate = totalTested > 0 ? (positiveCount / totalTested) * 100 : 0;
    const inconclusiveRate = totalTested > 0 ? (inconclusiveCount / totalTested) * 100 : 0;

    // Reimbursement (60 Baht per tested person)
    const REIMBURSEMENT_RATE = 60;
    const totalEarnedReimbursement = totalTested * REIMBURSEMENT_RATE;
    const totalTargetReimbursement = totalRegistered * REIMBURSEMENT_RATE;
    const pendingReimbursement = pendingCount * REIMBURSEMENT_RATE;
    const negativeReimbursement = negativeCount * REIMBURSEMENT_RATE;
    const positiveReimbursement = positiveCount * REIMBURSEMENT_RATE;
    const inconclusiveReimbursement = inconclusiveCount * REIMBURSEMENT_RATE;
    const reimbursementRatePercent = totalRegistered > 0 ? (totalTested / totalRegistered) * 100 : 0;

    // Module 6: Referral to Sakon Nakhon Hospital & Appointments
    const positiveList = list.filter(p => p.fitResult === 'positive');
    const referredList = positiveList.filter(p => p.referral || p.caTracking?.appointmentDate);
    const referredCount = referredList.length;
    const pendingReferralCount = positiveList.length - referredCount;

    // Overdue Tracking (> 7 days from positive date without appointment)
    const now = new Date();
    const overdueList = positiveList.filter(p => {
      const hasDate = p.caTracking?.appointmentDate || p.referral?.appointmentDate;
      if (hasDate) return false;
      const refDate = p.testedDate || p.caTracking?.fitPositiveDate;
      if (!refDate) return false;
      const diffDays = Math.floor((now.getTime() - new Date(refDate).getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 7;
    });
    const overdueCount = overdueList.length;

    // Module 7: Colonoscopy, Bowel Prep, Biopsy & Adenocarcinoma Registry
    const bowelPrepGood = list.filter(p => p.caTracking?.bowelPrepStatus === 'prep_completed').length;
    const bowelPrepMeds = list.filter(p => p.caTracking?.bowelPrepStatus === 'received_meds' || p.caTracking?.bowelPrepStatus === 'diet_restricted').length;
    const bowelPrepIssue = list.filter(p => p.caTracking?.bowelPrepStatus === 'problem_encountered').length;

    // Colonoscopy Findings
    const colonoscopyDoneList = list.filter(p => 
      p.caTracking?.status === 'colonoscopy_done' || 
      p.caTracking?.status === 'biopsy_reported' ||
      Boolean(p.caTracking?.colonoscopyFinding && p.caTracking.colonoscopyFinding !== 'pending')
    );
    const colonoscopyDoneCount = colonoscopyDoneList.length;
    const polypsCount = list.filter(p => p.caTracking?.colonoscopyFinding === 'polyps_removed').length;
    const massCount = list.filter(p => p.caTracking?.colonoscopyFinding === 'suspected_cancer').length;
    const normalColoCount = list.filter(p => p.caTracking?.colonoscopyFinding === 'normal').length;
    const refusedColoCount = list.filter(p => p.caTracking?.status === 'refused').length;

    // Biopsy / Cancer Pathology
    const adenoList = list.filter(p => p.caTracking?.biopsyResult === 'adenocarcinoma');
    const adenoCount = adenoList.length;
    const adenomaCount = list.filter(p => p.caTracking?.biopsyResult === 'tubular_adenoma' || p.caTracking?.biopsyResult === 'high_grade_dysplasia').length;
    const benignCount = list.filter(p => p.caTracking?.biopsyResult === 'benign_polyp').length;
    const pendingBiopsyCount = list.filter(p => p.caTracking?.biopsyResult === 'pending' && colonoscopyDoneList.some(c => c.id === p.id)).length;

    // Staging of Confirmed Adenocarcinoma
    const stage1 = adenoList.filter(p => p.caTracking?.cancerStaging?.includes('Stage I') && !p.caTracking?.cancerStaging?.includes('Stage IV')).length;
    const stage2 = adenoList.filter(p => p.caTracking?.cancerStaging?.includes('Stage II')).length;
    const stage3 = adenoList.filter(p => p.caTracking?.cancerStaging?.includes('Stage III')).length;
    const stage4 = adenoList.filter(p => p.caTracking?.cancerStaging?.includes('Stage IV')).length;
    const stageOther = adenoCount - (stage1 + stage2 + stage3 + stage4);

    // Module 7b & GIS Map Pinning Status
    const pinnedList = list.filter(p => typeof p.location?.lat === 'number' && typeof p.location?.lng === 'number' && p.location.lat !== 0);
    const pinnedPositiveList = positiveList.filter(p => typeof p.location?.lat === 'number' && typeof p.location?.lng === 'number' && p.location.lat !== 0);
    const unpinnedPositiveList = positiveList.filter(p => !p.location || !p.location.lat || p.location.lat === 0);
    const totalPinnedCount = pinnedList.length;
    const positivePinnedCount = pinnedPositiveList.length;
    const positiveUnpinnedCount = unpinnedPositiveList.length;
    const positivePinCoverageRate = positiveList.length > 0 ? (positivePinnedCount / positiveList.length) * 100 : 100;

    // Village Breakdown Calculation
    const villageMap: Record<string, VillageSummary & { pinnedCount: number; coloDoneCount: number; adenoCount: number }> = {};
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
        negativeRate: 0,
        pinnedCount: 0,
        coloDoneCount: 0,
        adenoCount: 0
      };
    });

    list.forEach(p => {
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
          negativeRate: 0,
          pinnedCount: 0,
          coloDoneCount: 0,
          adenoCount: 0
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

      if (p.location?.lat && p.location?.lng) {
        villageMap[vNo].pinnedCount += 1;
      }
      if (p.caTracking?.status === 'colonoscopy_done' || p.caTracking?.status === 'biopsy_reported') {
        villageMap[vNo].coloDoneCount += 1;
      }
      if (p.caTracking?.biopsyResult === 'adenocarcinoma') {
        villageMap[vNo].adenoCount += 1;
      }
    });

    const villageList = Object.values(villageMap).map(v => ({
      ...v,
      positiveRate: v.totalTested > 0 ? (v.positiveCount / v.totalTested) * 100 : 0,
      negativeRate: v.totalTested > 0 ? (v.negativeCount / v.totalTested) * 100 : 0
    })).sort((a, b) => parseInt(a.villageNo, 10) - parseInt(b.villageNo, 10));

    return {
      totalRegistered,
      maleCount,
      femaleCount,
      age50to59,
      age60to70,
      ucsBenefitCount,
      otherBenefitCount,
      kitsDistributed,
      kitsPendingDist,
      totalTested,
      samplePendingReturn,
      overweightCount,
      normalBmiCount,
      highBpCount,
      normalBpCount,
      negativeCount,
      positiveCount,
      inconclusiveCount,
      pendingCount,
      testRate,
      negativeRate,
      positiveRate,
      inconclusiveRate,
      REIMBURSEMENT_RATE,
      totalEarnedReimbursement,
      totalTargetReimbursement,
      pendingReimbursement,
      negativeReimbursement,
      positiveReimbursement,
      inconclusiveReimbursement,
      reimbursementRatePercent,
      referredCount,
      pendingReferralCount,
      overdueCount,
      overdueList,
      bowelPrepGood,
      bowelPrepMeds,
      bowelPrepIssue,
      colonoscopyDoneCount,
      polypsCount,
      massCount,
      normalColoCount,
      refusedColoCount,
      adenoCount,
      adenoList,
      adenomaCount,
      benignCount,
      pendingBiopsyCount,
      stage1,
      stage2,
      stage3,
      stage4,
      stageOther,
      totalPinnedCount,
      positivePinnedCount,
      positiveUnpinnedCount,
      positivePinCoverageRate,
      unpinnedPositiveList,
      villageList
    };
  }, [patients]);

  const handleCopyPublicPinLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const url = `${origin}${pathname}?mode=pin_house`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      alert('คัดลอกลิงก์ปักหมุดสำหรับ อสม. เรียบร้อยแล้ว:\n' + url + '\n(อสม. สามารถเปิดส่งพิกัดได้ทันทีโดยไม่ต้อง Login)');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner & Quick Filter Controls */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg mb-2 border border-emerald-200/60">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>ศูนย์ประสานงานคัดกรองมะเร็งลำไส้ใหญ่ โรงพยาบาลโพนนาแก้ว จ.สกลนคร</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Dashboard ศูนย์บัญชาการข้อมูลคัดกรองมะเร็งลำไส้ใหญ่และลำไส้ตรง (FIT Test Workload & Journey)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
              รายงานตัวชี้วัดครอบคลุมทุกขั้นตอน: ลงทะเบียนกลุ่มเป้าหมาย • รับชุดตรวจ • ผลแล็บ 1B0060/1B0061 • สปสช. 60 บาท • นัดหมาย รพ.สกลนคร • ผลส่องกล้อง & ชิ้นเนื้อ • แผนที่พิกัดบ้าน อสม.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateToTab('result-entry')}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
            >
              <FlaskConical className="w-4 h-4" />
              <span>บันทึกผลแล็บ</span>
            </button>
            <button
              onClick={() => onNavigateToTab('ca-colon-tracking')}
              className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Stethoscope className="w-4 h-4 text-teal-700" />
              <span>ติดตาม CA & Map Colon</span>
            </button>
            <button
              onClick={() => onNavigateToTab('referral')}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <span>ส่งต่อ ({stats.positiveCount})</span>
            </button>
          </div>
        </div>

        {/* Section Quick Jump Filter Pills */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-semibold mr-1">มุมมองข้อมูล:</span>
          {[
            { id: 'all', label: 'ทั้งหมด (ทุกขั้นตอน)' },
            { id: 'screening', label: '1. คัดกรอง & ผลตรวจ FIT' },
            { id: 'referral', label: '2. นัดหมายส่งต่อ รพ.สกลนคร' },
            { id: 'colonoscopy', label: '3. ส่องกล้อง & มะเร็ง CA Colon' },
            { id: 'gis', label: '4. แผนที่ GIS & พิกัดบ้าน' },
          ].map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSectionFilter(sec.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeSectionFilter === sec.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Visual Care Continuum Pipeline (Colorectal Cancer Funnel Steps 1-8) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <h3 className="font-bold text-slate-800 text-sm">
              เส้นทางการดูแลผู้ป่วยมะเร็งลำไส้ใหญ่ครบวงจร (Colorectal Cancer Care Continuum)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            คลิกที่แต่ละขั้นตอนเพื่อไปที่หน้านั้นทันที
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {/* Step 1: Registered */}
          <div 
            onClick={() => onNavigateToTab('registration')}
            className="p-3 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-100/60 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between text-[11px] text-blue-800 font-bold mb-1">
              <span>1. ลงทะเบียน</span>
              <UserPlus className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-900">{stats.totalRegistered}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">กลุ่มเป้าหมาย (คน)</div>
          </div>

          {/* Step 2: Kits Received */}
          <div 
            onClick={() => onNavigateToTab('sample-receive')}
            className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-100/60 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between text-[11px] text-indigo-800 font-bold mb-1">
              <span>2. รับชุดตรวจ</span>
              <PackageCheck className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-900">{stats.kitsDistributed}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">ส่งถึงมือผู้ป่วย</div>
          </div>

          {/* Step 3: Tested */}
          <div 
            onClick={() => onNavigateToTab('result-entry')}
            className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100/60 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between text-[11px] text-emerald-800 font-bold mb-1">
              <span>3. ตรวจแล็บ</span>
              <FlaskConical className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-700">{stats.totalTested}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">อัตรา {stats.testRate.toFixed(1)}%</div>
          </div>

          {/* Step 4: Positive */}
          <div 
            onClick={() => onNavigateToTab('referral')}
            className="p-3 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-100/60 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between text-[11px] text-rose-800 font-bold mb-1">
              <span>4. ผลบวก (1B0061)</span>
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl font-bold font-mono text-rose-700">{stats.positiveCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">พบเลือดแฝง ({stats.positiveRate.toFixed(1)}%)</div>
          </div>

          {/* Step 5: Referred */}
          <div 
            onClick={() => onNavigateToTab('referral')}
            className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-100/60 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between text-[11px] text-amber-800 font-bold mb-1">
              <span>5. นัดส่องกล้อง</span>
              <Clock className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-700">{stats.referredCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">รพ.สกลนคร</div>
          </div>

          {/* Step 6: Colonoscopy Completed */}
          <div 
            onClick={() => onNavigateToTab('ca-colon-tracking')}
            className="p-3 rounded-xl border border-teal-200 bg-teal-50/40 hover:bg-teal-100/60 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between text-[11px] text-teal-800 font-bold mb-1">
              <span>6. ส่องกล้องสำเร็จ</span>
              <Stethoscope className="w-3.5 h-3.5 text-teal-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl font-bold font-mono text-teal-700">{stats.colonoscopyDoneCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">พบติ่งเนื้อ {stats.polypsCount}</div>
          </div>

          {/* Step 7: Biopsy / Cancer Confirmed */}
          <div 
            onClick={() => onNavigateToTab('ca-colon-tracking')}
            className="p-3 rounded-xl border border-purple-200 bg-purple-50/40 hover:bg-purple-100/60 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between text-[11px] text-purple-800 font-bold mb-1">
              <span>7. มะเร็งลำไส้ใหญ่</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl font-bold font-mono text-purple-700">{stats.adenoCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">CA Colon (Adeno)</div>
          </div>

          {/* Step 8: GIS Home Pinned */}
          <div 
            onClick={() => onNavigateToTab('ca-colon-tracking')}
            className="p-3 rounded-xl border border-cyan-200 bg-cyan-50/40 hover:bg-cyan-100/60 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between text-[11px] text-cyan-800 font-bold mb-1">
              <span>8. พิกัดบ้าน GIS</span>
              <MapPin className="w-3.5 h-3.5 text-cyan-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl font-bold font-mono text-cyan-700">{stats.positivePinnedCount}/{stats.positiveCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">ครอบคลุม {stats.positivePinCoverageRate.toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* 3. Primary Metrics & Workload Section */}
      {(activeSectionFilter === 'all' || activeSectionFilter === 'screening') && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Registered Target */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">รวมเป้าหมายลงทะเบียน</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-800">{stats.totalRegistered}</span>
                <span className="text-xs text-slate-500 font-medium">คน</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">เป้าหมายทั้งอำเภอ:</span>
                <span className="font-semibold text-slate-700">10,774 ราย</span>
              </div>
            </div>

            {/* Card 2: Tested Workload */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">รวมตรวจคัดกรองแล้ว (Workload)</span>
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
                <span className="font-bold text-emerald-700">{stats.negativeRate.toFixed(1)}%</span>
              </div>
            </div>

            {/* Card 4: Positive 1B0061 */}
            <div 
              onClick={() => onNavigateToTab('ca-colon-tracking')}
              className="bg-white rounded-2xl p-5 border border-rose-200/90 bg-gradient-to-b from-rose-50/30 to-white shadow-xs cursor-pointer hover:border-rose-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-800 group-hover:underline">ผลบวก (Positive)</span>
                  <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-rose-100 text-rose-800 rounded font-mono font-bold">1B0061</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                  <AlertOctagon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-rose-600">{stats.positiveCount}</span>
                  <span className="text-xs text-slate-500 font-medium">คน</span>
                </div>
                <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
                  ติดตาม CA Colon ➔
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-rose-100 flex items-center justify-between text-xs">
                <span className="text-slate-600">ร้อยละผลบวก:</span>
                <span className="font-bold text-rose-700">{stats.positiveRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Reimbursement 60 Baht Presentation Card */}
          <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden border border-emerald-500/30">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30 shadow-inner shrink-0">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 text-[11px] font-semibold">
                        สปสช. กองทุนสร้างเสริมสุขภาพและป้องกันโรค (P&P)
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30 text-[11px] font-bold flex items-center gap-1">
                        <Coins className="w-3 h-3 text-amber-300" />
                        ชดเชย 60 บาท / คน
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      สรุปการเบิกชดเชยค่าบริการตรวจคัดกรองมะเร็งลำไส้ใหญ่และไส้ตรง (E-Claim)
                    </h3>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 text-right self-start sm:self-auto">
                  <div className="text-[10px] text-emerald-200 uppercase tracking-wider font-semibold">อัตราชดเชยมาตรฐาน</div>
                  <div className="text-base sm:text-lg font-bold text-white font-mono flex items-baseline gap-1 justify-end">
                    <span className="text-emerald-300">฿</span>
                    <span>60.00</span>
                    <span className="text-[11px] font-normal text-slate-300">/ คน</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-emerald-400/30">
                  <span className="text-xs font-semibold text-emerald-200">ค่าชดเชยที่ตรวจแล้ว (พร้อมส่งเบิก)</span>
                  <div className="mt-2 text-3xl font-extrabold font-mono text-emerald-300">
                    ฿{stats.totalEarnedReimbursement.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-100/70 mt-1">
                    ตรวจแล้ว {stats.totalTested} คน × 60 บาท ({stats.reimbursementRatePercent.toFixed(1)}%)
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
                  <span className="text-xs font-semibold text-cyan-200">ประมาณการวงเงินชดเชยตามเป้าหมาย</span>
                  <div className="mt-2 text-3xl font-extrabold font-mono text-white">
                    ฿{stats.totalTargetReimbursement.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-cyan-100/70 mt-1">
                    เป้าหมายทั้งหมด {stats.totalRegistered} คน × 60 บาท
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
                  <span className="text-xs font-semibold text-amber-200">วงเงินชดเชยส่วนที่รอการตรวจ</span>
                  <div className="mt-2 text-3xl font-extrabold font-mono text-amber-300">
                    ฿{stats.pendingReimbursement.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-amber-100/70 mt-1">
                    คงเหลือรอการตรวจอีก {stats.pendingCount} คน × 60 บาท
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 4. Section: Referral & Sakon Nakhon Hospital Appointment Management */}
      {(activeSectionFilter === 'all' || activeSectionFilter === 'referral') && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  การส่งต่อและนัดหมายส่องกล้อง รพ.สกลนคร (Referral & Appointments)
                </h3>
                <p className="text-xs text-slate-500">
                  สำหรับผู้มีผลตรวจ FIT Test เป็นบวก (1B0061) ที่ต้องเข้ารับการส่องกล้องตรวจลำไส้ใหญ่
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab('referral')}
              className="text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>ไปที่หน้านัดหมายและพิมพ์ใบส่งตัว</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs text-slate-500 font-medium">ผู้มีผลบวกทั้งหมด</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{stats.positiveCount} คน</div>
              <div className="text-[11px] text-slate-500 mt-1">ข้อบ่งชี้ 1B0061 ส่องกล้อง</div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80">
              <span className="text-xs text-emerald-700 font-medium">มีวันนัดส่องกล้องแล้ว</span>
              <div className="text-2xl font-bold font-mono text-emerald-800 mt-1">{stats.referredCount} คน</div>
              <div className="text-[11px] text-emerald-600 mt-1">ส่งต่อศูนย์ส่องกล้อง รพ.สกลนคร</div>
            </div>

            <div className={`p-4 rounded-xl border ${stats.overdueCount > 0 ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">เคสเกิน 7 วันยังไม่มีวันนัด</span>
                {stats.overdueCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded text-[10px] font-bold animate-pulse">
                    เร่งติดตาม
                  </span>
                )}
              </div>
              <div className={`text-2xl font-bold font-mono mt-1 ${stats.overdueCount > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
                {stats.overdueCount} คน
              </div>
              <div className="text-[11px] text-slate-500 mt-1">เกณฑ์มาตรฐาน สปสช. ไม่เกิน 7 วัน</div>
            </div>
          </div>

          {/* Overdue Alert Table if any cases exist */}
          {stats.overdueCount > 0 && (
            <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>รายชื่อผู้ป่วยผลบวกเกิน 7 วันที่ยังไม่ได้วันนัดหมายส่องกล้อง ({stats.overdueCount} ราย)</span>
              </div>
              <div className="divide-y divide-rose-200/60 bg-white rounded-lg border border-rose-200/80 overflow-hidden">
                {stats.overdueList.map(p => (
                  <div key={p.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-rose-50/40">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-rose-900">{p.hn}</span>
                      <span className="font-semibold text-slate-800">{p.prefix}{p.firstName} {p.lastName}</span>
                      <span className="text-slate-500">ม.{p.villageNo} {p.villageName}</span>
                      <span className="text-[11px] text-slate-400">โทร: {p.phone || '-'}</span>
                    </div>
                    <button
                      onClick={() => onNavigateToTab('ca-colon-tracking')}
                      className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded font-semibold text-[11px]"
                    >
                      เปิดบันทึกติดตาม ➔
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Section: Colonoscopy, Bowel Preparation & Biopsy Cancer Registry */}
      {(activeSectionFilter === 'all' || activeSectionFilter === 'colonoscopy') && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  การส่องกล้อง Colonoscopy, การเตรียมลำไส้ และผลตรวจชิ้นเนื้อ (Biopsy & Cancer Registry)
                </h3>
                <p className="text-xs text-slate-500">
                  สถิติผลการตรวจวินิจฉัยทางพยาธิวิทยาและการยืนยันมะเร็งลำไส้ใหญ่ (Adenocarcinoma)
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab('ca-colon-tracking')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>เปิดดูรายละเอียด CA Colon Tracking</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sub-grid of Findings & Bowel Prep */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500">ส่องกล้องสำเร็จแล้ว</div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{stats.colonoscopyDoneCount} ราย</div>
              <div className="text-[11px] text-slate-500 mt-1">จากผลบวกทั้งหมด {stats.positiveCount} ราย</div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-xs text-amber-800 font-semibold">พบติ่งเนื้อตัดออก (Polyp)</div>
              <div className="text-2xl font-bold font-mono text-amber-900 mt-1">{stats.polypsCount} ราย</div>
              <div className="text-[11px] text-amber-700 mt-1">ทำ Polypectomy สำเร็จ</div>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200">
              <div className="text-xs text-purple-800 font-semibold">ยืนยันมะเร็ง (Adenocarcinoma)</div>
              <div className="text-2xl font-bold font-mono text-purple-900 mt-1">{stats.adenoCount} ราย</div>
              <div className="text-[11px] text-purple-700 mt-1">เข้าสู่การรักษาต่อ รพ.ศูนย์</div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-xs text-emerald-800 font-semibold">เตรียมลำไส้สะอาดเรียบร้อย</div>
              <div className="text-2xl font-bold font-mono text-emerald-900 mt-1">{stats.bowelPrepGood} ราย</div>
              <div className="text-[11px] text-emerald-700 mt-1">รับยาระบาย {stats.bowelPrepMeds} ราย</div>
            </div>
          </div>

          {/* Cancer Staging Breakdown if Adeno cases exist */}
          {stats.adenoCount > 0 && (
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  การจำแนกระยะมะเร็งลำไส้ใหญ่ (Cancer Staging) ในผู้ป่วย {stats.adenoCount} ราย
                </span>
                <span className="text-[11px] text-purple-700 bg-white px-2 py-0.5 rounded-full border border-purple-200 font-medium">
                  รพ.สกลนคร
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-purple-200">
                  <div className="text-slate-500 text-[11px]">Stage I</div>
                  <div className="text-lg font-bold text-purple-900 font-mono mt-0.5">{stats.stage1}</div>
                  <div className="text-[10px] text-slate-400">ระยะเริ่มต้น</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-purple-200">
                  <div className="text-slate-500 text-[11px]">Stage II</div>
                  <div className="text-lg font-bold text-purple-900 font-mono mt-0.5">{stats.stage2}</div>
                  <div className="text-[10px] text-slate-400">ทะลุชั้นกล้ามเนื้อ</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-purple-200">
                  <div className="text-slate-500 text-[11px]">Stage III</div>
                  <div className="text-lg font-bold text-purple-900 font-mono mt-0.5">{stats.stage3}</div>
                  <div className="text-[10px] text-slate-400">ลามต่อมน้ำเหลือง</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-purple-200">
                  <div className="text-slate-500 text-[11px]">Stage IV</div>
                  <div className="text-lg font-bold text-purple-900 font-mono mt-0.5">{stats.stage4}</div>
                  <div className="text-[10px] text-slate-400">แพร่กระจาย</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-purple-200 col-span-2 sm:col-span-1">
                  <div className="text-slate-500 text-[11px]">รอยืนยันระยะ</div>
                  <div className="text-lg font-bold text-purple-900 font-mono mt-0.5">{stats.stageOther}</div>
                  <div className="text-[10px] text-slate-400">ระหว่างตรวจ CT/MRI</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Section: Map Colon & GIS Pinning Status */}
      {(activeSectionFilter === 'all' || activeSectionFilter === 'gis') && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  ระบบแผนที่และพิกัดบ้าน อสม. (Map Colon & GIS Pinning)
                </h3>
                <p className="text-xs text-slate-500">
                  ติดตามพิกัด GPS บ้านผู้ป่วยผลบวกและผู้ป่วยมะเร็งลำไส้ใหญ่ เพื่อให้อสม.และทีมปฐมภูมิลงเยี่ยมบ้าน
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyPublicPinLink}
                className="text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>แชร์ลิงก์ให้ อสม. ปักหมุด</span>
              </button>
              <button
                onClick={() => onNavigateToTab('ca-colon-tracking')}
                className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 bg-cyan-50 px-3 py-1.5 rounded-xl border border-cyan-200 flex items-center gap-1"
              >
                <span>เปิดดูแผนที่ Map Colon</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-cyan-50/60 border border-cyan-200">
              <span className="text-xs font-semibold text-cyan-800">ผู้ป่วยผลบวกที่ปักหมุดพิกัดแล้ว</span>
              <div className="text-2xl font-bold font-mono text-cyan-900 mt-1">
                {stats.positivePinnedCount} / {stats.positiveCount} คน
              </div>
              <div className="text-[11px] text-cyan-700 mt-1">
                ความครอบคลุม {stats.positivePinCoverageRate.toFixed(1)}%
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
              <span className="text-xs font-semibold text-amber-800">ยังไม่มีพิกัดบ้าน (รอ อสม. ส่ง)</span>
              <div className="text-2xl font-bold font-mono text-amber-900 mt-1">
                {stats.positiveUnpinnedCount} คน
              </div>
              <div className="text-[11px] text-amber-700 mt-1">
                สามารถส่งลิงก์ให้ อสม. ปักหมุดได้ทันที
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-600">พิกัดทั้งหมดในฐานข้อมูล</span>
              <div className="text-2xl font-bold font-mono text-slate-800 mt-1">
                {stats.totalPinnedCount} พิกัด
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                รวมกลุ่มเป้าหมายและผู้ป่วยทุกกลุ่ม
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Admin Quick Patient Search & Action Section */}
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

      {/* 8. Village Breakdown Table & Comparison (ข้อมูลคัดกรองแยกรายหมู่บ้าน) */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>ข้อมูลการคัดกรองมะเร็งลำไส้ใหญ่ แยกรายหมู่บ้าน (อ.โพนนาแก้ว)</span>
            </h3>
            <p className="text-xs text-slate-500">
              สรุปจำนวนเป้าหมาย ผลตรวจ 1B0060, 1B0061, การส่องกล้อง, ผล CA และพิกัดบ้านในแต่ละหมู่บ้าน
            </p>
          </div>
          <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full self-start sm:self-auto">
            ครอบคลุม {stats.villageList.length} หมู่บ้าน
          </span>
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 text-center">หมู่ที่</th>
                <th className="px-3 py-3">ชื่อหมู่บ้าน</th>
                <th className="px-3 py-3 text-right">เป้าหมาย</th>
                <th className="px-3 py-3 text-right">ตรวจแล้ว</th>
                <th className="px-3 py-3 text-right text-emerald-700">ผลลบ (-)</th>
                <th className="px-3 py-3 text-right text-rose-700">ผลบวก (+)</th>
                <th className="px-3 py-3 text-right">ร้อยละผลบวก</th>
                <th className="px-3 py-3 text-right text-teal-700">ส่องกล้องแล้ว</th>
                <th className="px-3 py-3 text-right text-purple-700">พบ CA</th>
                <th className="px-3 py-3 text-right text-cyan-700">พิกัดบ้าน</th>
                <th className="px-3 py-3 text-right text-emerald-800 bg-emerald-50/60 font-bold">ค่าชดเชย (60 บ.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {stats.villageList.map((v) => (
                <tr key={v.villageNo} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-3 py-3 text-center font-bold text-slate-700">
                    ม.{v.villageNo}
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-900">
                    {v.villageName}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-slate-700">
                    {v.totalRegistered}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-indigo-600">
                    {v.totalTested}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-emerald-600 bg-emerald-50/30">
                    {v.negativeCount}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-rose-600 bg-rose-50/30">
                    {v.positiveCount}
                  </td>
                  <td className="px-3 py-3 text-right font-bold">
                    <span className={v.positiveRate > 0 ? 'text-rose-600' : 'text-slate-400'}>
                      {v.positiveRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-teal-700">
                    {v.coloDoneCount}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-purple-700">
                    {v.adenoCount > 0 ? (
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                        {v.adenoCount}
                      </span>
                    ) : '0'}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-cyan-700">
                    {v.pinnedCount}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-emerald-800 bg-emerald-50/40">
                    ฿{(v.totalTested * 60).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td colSpan={2} className="px-3 py-3 text-right font-bold text-slate-800">
                  รวมทั้งสิ้น (โรงพยาบาลโพนนาแก้ว):
                </td>
                <td className="px-3 py-3 text-right font-bold">{stats.totalRegistered}</td>
                <td className="px-3 py-3 text-right text-indigo-700 font-bold">{stats.totalTested}</td>
                <td className="px-3 py-3 text-right text-emerald-700 font-bold">{stats.negativeCount}</td>
                <td className="px-3 py-3 text-right text-rose-700 font-bold">{stats.positiveCount}</td>
                <td className="px-3 py-3 text-right text-rose-700 font-bold">{stats.positiveRate.toFixed(1)}%</td>
                <td className="px-3 py-3 text-right text-teal-700 font-bold">{stats.colonoscopyDoneCount}</td>
                <td className="px-3 py-3 text-right text-purple-700 font-bold">{stats.adenoCount}</td>
                <td className="px-3 py-3 text-right text-cyan-700 font-bold">{stats.totalPinnedCount}</td>
                <td className="px-3 py-3 text-right text-emerald-800 font-mono font-bold bg-emerald-100/50">
                  ฿{stats.totalEarnedReimbursement.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 9. Infographic & Reference Guideline Section (แนวทางการลงผลตรวจและชดเชย E-Claim 60 บาท) */}
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
          {/* Main Visual Infographic Card Matching the Official Diagram */}
          <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Left Column: กลุ่มเป้าหมาย & ตราสัญลักษณ์ & เงื่อนไข Claim */}
              <div className="lg:col-span-4 space-y-4">
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

                <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-red-700 text-white rounded-2xl p-4 text-center shadow-sm border border-rose-800 relative">
                  <div className="inline-flex items-center justify-center px-2 py-0.5 bg-white text-rose-800 rounded font-black text-[10px] tracking-wider mb-1.5 shadow-2xs">
                    E-CLAIM
                  </div>
                  <div className="text-sm sm:text-base font-bold leading-snug">
                    ตรวจคัดกรองมะเร็งลำไส้ใหญ่และลำไส้ตรง
                  </div>
                </div>

                <div className="relative bg-white rounded-xl border border-teal-300 p-3.5 shadow-xs pl-12 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-10 bg-teal-600 text-white flex items-center justify-center font-bold text-[10px] [writing-mode:vertical-rl] rotate-180 tracking-wider">
                    เงื่อนไข Claim
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed">
                    ค่าบริการตรวจคัดกรองมะเร็งลำไส้ใหญ่และลำไส้ตรงด้วยวิธีการตรวจหาเลือดแฝงในอุจจาระ (FIT Test) และให้คำปรึกษาแนะนำ <strong>จ่ายแบบเหมาจ่ายในอัตรา 60 บาทต่อครั้ง</strong>
                  </div>
                </div>
              </div>

              {/* Center Column: ชดเชย 60 บาท */}
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
                    <div className="w-9 h-9 rounded-xl bg-white/90 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      อาการ
                    </div>
                    <div className="text-xs font-bold leading-tight">
                      ตรวจคัดกรองมะเร็งลำไส้ใหญ่และลำไส้ตรง (Fit test)
                    </div>
                  </div>

                  {/* บันทึก อื่นๆ (SpecialPP) */}
                  <div className="flex items-center gap-2 bg-rose-600 text-white rounded-2xl p-2.5 shadow-xs border border-rose-700">
                    <div className="w-9 h-9 rounded-xl bg-white text-rose-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
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
                    <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
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
                    <div className="w-9 h-9 rounded-xl bg-white text-indigo-900 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
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

          {/* Embedded Image */}
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
