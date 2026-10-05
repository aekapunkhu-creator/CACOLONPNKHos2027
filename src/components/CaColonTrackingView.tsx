import React, { useState, useMemo } from 'react';
import { 
  PatientScreening, 
  CaColonStatus, 
  CaColonTracking 
} from '../types';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  Clock, 
  Phone, 
  Calendar, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  PhoneCall, 
  Plus, 
  RefreshCw, 
  FileSpreadsheet, 
  UserCheck, 
  ChevronRight,
  Stethoscope,
  Microscope,
  HelpCircle,
  MapPin,
  Share2,
  Copy,
  MessageCircle,
  X,
  ExternalLink,
  Compass,
  QrCode
} from 'lucide-react';
import { PatientJourneyModal } from './PatientJourneyModal';
import { QuickCallLogModal } from './QuickCallLogModal';
import { QuickAppointmentModal } from './QuickAppointmentModal';
import { QuickColonoscopyModal } from './QuickColonoscopyModal';
import { MapColonView } from './MapColonView';

interface CaColonTrackingViewProps {
  patients: PatientScreening[];
  initialHn?: string;
  initialSubView?: 'table' | 'map';
  onUpdatePatient: (updated: PatientScreening) => Promise<void> | void;
  onNavigateToReferral?: (hn: string) => void;
  onNavigateToMap?: (hn: string) => void;
  isWidescreen16x9?: boolean;
}

export const CaColonTrackingView: React.FC<CaColonTrackingViewProps> = ({
  patients,
  initialHn,
  initialSubView = 'table',
  onUpdatePatient,
  onNavigateToReferral,
  onNavigateToMap,
  isWidescreen16x9 = true
}) => {
  // Sub-view toggle: 'table' vs 'map' (Map Colon moved into CA Colon tracking page)
  const [subView, setSubView] = useState<'table' | 'map'>(initialSubView);
  const [targetMapHn, setTargetMapHn] = useState<string | undefined>(initialHn);

  // Sync if initialSubView or initialHn changes externally
  React.useEffect(() => {
    if (initialSubView) setSubView(initialSubView);
  }, [initialSubView]);

  React.useEffect(() => {
    if (initialHn) setTargetMapHn(initialHn);
  }, [initialHn]);

  // VHV Public Pin Share Modal state
  const [sharingVhvPatient, setSharingVhvPatient] = useState<PatientScreening | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showQrCode, setShowQrCode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [onlyOverdue, setOnlyOverdue] = useState<boolean>(false);
  const [onlyAdeno, setOnlyAdeno] = useState<boolean>(false);
  const [subdistrictFilter, setSubdistrictFilter] = useState<string>('all');

  // Modal states
  const [detailPatient, setDetailPatient] = useState<PatientScreening | null>(null);
  const [callLogPatient, setCallLogPatient] = useState<PatientScreening | null>(null);
  const [appointmentPatient, setAppointmentPatient] = useState<PatientScreening | null>(null);
  const [colonoscopyPatient, setColonoscopyPatient] = useState<PatientScreening | null>(null);

  // System reference date for age / overdue calculation
  const referenceDate = useMemo(() => new Date('2026-09-21'), []);

  // Filter only positive FIT test patients (or referral cases)
  const positivePatients = useMemo(() => {
    return patients.filter(p => p.fitResult === 'positive' || p.referral !== undefined || p.caTracking !== undefined);
  }, [patients]);

  // Helper function to calculate overdue days
  const getOverdueInfo = (patient: PatientScreening) => {
    const fitDateStr = patient.caTracking?.fitPositiveDate || patient.testedDate?.slice(0, 10);
    if (!fitDateStr) return { days: 0, isOverdue: false };

    const fitDate = new Date(fitDateStr);
    const diffTime = Math.max(0, referenceDate.getTime() - fitDate.getTime());
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const status = patient.caTracking?.status || 'pending_contact';
    const isOverdue = days > 7 && (status === 'pending_contact' || status === 'contacted' || status === 'cannot_contact');

    return { days, isOverdue };
  };

  // Filtered patients list
  const filteredPatients = useMemo(() => {
    return positivePatients.filter(p => {
      // 1. Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const fullName = `${p.prefix || ''}${p.firstName} ${p.lastName}`.toLowerCase();
        const hn = (p.hn || '').toLowerCase();
        const phone = (p.phone || '').toLowerCase();
        const idCard = (p.idCard || '').toLowerCase();
        const village = (p.villageName || '').toLowerCase();

        if (!fullName.includes(term) && !hn.includes(term) && !phone.includes(term) && !idCard.includes(term) && !village.includes(term)) {
          return false;
        }
      }

      // 2. Status filter
      const currentStatus = p.caTracking?.status || 'pending_contact';
      if (statusFilter !== 'all' && currentStatus !== statusFilter) {
        return false;
      }

      // 3. Subdistrict filter
      if (subdistrictFilter !== 'all' && (p.subdistrict || 'นาแก้ว') !== subdistrictFilter) {
        return false;
      }

      // 4. Overdue filter
      if (onlyOverdue) {
        const { isOverdue } = getOverdueInfo(p);
        if (!isOverdue) return false;
      }

      // 5. Only Adenocarcinoma filter
      if (onlyAdeno && p.caTracking?.biopsyResult !== 'adenocarcinoma') {
        return false;
      }

      return true;
    });
  }, [positivePatients, searchTerm, statusFilter, subdistrictFilter, onlyOverdue, onlyAdeno, referenceDate]);

  // Statistics
  const stats = useMemo(() => {
    let total = positivePatients.length;
    let overdueCount = 0;
    let pendingContact = 0;
    let scheduled = 0;
    let completed = 0;
    let refusedOrLost = 0;

    positivePatients.forEach(p => {
      const { isOverdue } = getOverdueInfo(p);
      if (isOverdue) overdueCount++;

      const status = p.caTracking?.status || 'pending_contact';
      if (status === 'pending_contact' || status === 'contacted') {
        pendingContact++;
      } else if (status === 'scheduled' || status === 'prep_in_progress') {
        scheduled++;
      } else if (status === 'colonoscopy_done' || status === 'biopsy_reported') {
        completed++;
      } else if (status === 'refused' || status === 'cannot_contact') {
        refusedOrLost++;
      }
    });

    return { total, overdueCount, pendingContact, scheduled, completed, refusedOrLost };
  }, [positivePatients, referenceDate]);

  // Status Badge Helper
  const renderStatusBadge = (status?: CaColonStatus) => {
    switch (status) {
      case 'pending_contact':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-700" />
            รอติดต่อแจ้งผล
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <Phone className="w-3 h-3 text-blue-700" />
            ติดต่อแล้ว / รอนัด
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
            <Calendar className="w-3 h-3 text-purple-700" />
            นัดส่องกล้องแล้ว
          </span>
        );
      case 'prep_in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-900 border border-cyan-300">
            <Activity className="w-3 h-3 text-cyan-700" />
            กำลังเตรียมตัว/รับยา
          </span>
        );
      case 'colonoscopy_done':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
            <Activity className="w-3 h-3 text-indigo-700" />
            ส่องกล้องแล้ว (รอผลชิ้นเนื้อ)
          </span>
        );
      case 'biopsy_reported':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            ผลชิ้นเนื้อออกแล้ว
          </span>
        );
      case 'refused':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <AlertTriangle className="w-3 h-3 text-rose-700" />
            ปฏิเสธการส่องกล้อง
          </span>
        );
      case 'cannot_contact':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">
            <AlertCircle className="w-3 h-3 text-slate-600" />
            ติดต่อไม่ได้
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-700" />
            รอติดต่อแจ้งผล
          </span>
        );
    }
  };

  // Helper function to render bowel prep badge
  const renderPrepBadge = (prepStatus?: string) => {
    switch (prepStatus) {
      case 'received_meds':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            💊 รับยาระบายแล้ว
          </span>
        );
      case 'diet_restricted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            🥗 เริ่มงดกากใยแล้ว
          </span>
        );
      case 'prep_completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            ✅ ทานยาครบ/ใสแล้ว
          </span>
        );
      case 'problem_encountered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            ⚠️ มีปัญหาการทานยา
          </span>
        );
      default:
        return null;
    }
  };

  // Filter Adenocarcinoma patients
  const adenoPatients = useMemo(() => {
    return patients.filter(p => p.caTracking?.biopsyResult === 'adenocarcinoma');
  }, [patients]);

  const getVhvPublicPinUrl = (p: PatientScreening) => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      return `${origin}${pathname}?mode=pin_house&hn=${encodeURIComponent(p.hn)}`;
    }
    return `?mode=pin_house&hn=${encodeURIComponent(p.hn)}`;
  };

  const handleShareVhvPinToLine = (p: PatientScreening) => {
    const pinUrl = getVhvPublicPinUrl(p);
    const isAdeno = p.caTracking?.biopsyResult === 'adenocarcinoma';
    const text = `📍 ขอความอนุเคราะห์ อสม. หรือเจ้าหน้าที่ ช่วยกดส่งพิกัด GPS บ้านผู้ป่วย (ไม่ต้อง Login):\n` +
      `👤 ผู้ป่วย: ${p.prefix}${p.firstName} ${p.lastName} (HN: ${p.hn})\n` +
      `🏠 ที่อยู่: บ้านเลขที่ ${p.houseNo} ม.${p.villageNo} ${p.villageName || ''} ต.${p.subdistrict || 'นาแก้ว'}\n` +
      `🎗️ การวินิจฉัย: ${isAdeno ? 'มะเร็งลำไส้ใหญ่ (Adenocarcinoma) ' + (p.caTracking?.cancerStaging || '') : 'กลุ่มคัดกรอง FIT ผลบวก'}\n` +
      `🏥 รพ.โพนนาแก้ว\n` +
      `👉 กดลิงก์นี้บนมือถือเพื่อปักหมุด GPS บ้านผู้ป่วย:\n${pinUrl}`;
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900/90 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm border border-emerald-500/30 animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Title & Mission Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-emerald-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                ระบบติดตามผู้ป่วยสงสัยมะเร็งลำไส้ใหญ่ (CA Colon Active Tracking & Map)
              </h2>
              <p className="text-teal-200/80 text-xs">
                โรงพยาบาลโพนนาแก้ว • ติดตามเชิงรุกผู้มีผล FIT Test เป็นบวก (Code 1B0061) และแผนที่พิกัดบ้านผู้ป่วยมะเร็งลำไส้ใหญ่
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {stats.overdueCount > 0 && (
            <button
              onClick={() => {
                setSubView('table');
                setOnlyOverdue(!onlyOverdue);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
                onlyOverdue
                  ? 'bg-rose-500 text-white ring-2 ring-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>เคสเกิน 7 วัน ({stats.overdueCount} ราย)</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-View Switcher: Table vs Map Colon */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setSubView('table')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              subView === 'table'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-emerald-700" />
            <span>ตารางติดตาม (Patient Journey Table)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('map')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              subView === 'map'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>แผนที่พิกัดบ้าน (Map Colon)</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              subView === 'map' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
            }`}>
              {adenoPatients.length} ราย
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>รวมมุมมองตารางคลินิกและแผนที่พิกัดบ้าน อสม. ไว้ในหน้าเดียว</span>
        </div>
      </div>

      {/* Map Colon Sub-View */}
      {subView === 'map' ? (
        <MapColonView
          patients={patients}
          initialHn={targetMapHn}
          onUpdatePatient={onUpdatePatient}
          onNavigateToReferral={onNavigateToReferral}
          onNavigateToTracking={() => setSubView('table')}
          isWidescreen16x9={isWidescreen16x9}
        />
      ) : (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Positive */}
        <div 
          onClick={() => { setStatusFilter('all'); setOnlyOverdue(false); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'all' && !onlyOverdue
              ? 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-semibold text-slate-500">เคส FIT บวกทั้งหมด</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[11px] text-teal-700 font-medium mt-1">เป้าหมายติดตาม 100%</div>
        </div>

        {/* Overdue Alert Card */}
        <div 
          onClick={() => setOnlyOverdue(!onlyOverdue)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            onlyOverdue
              ? 'bg-rose-100 border-rose-500 ring-2 ring-rose-500/30'
              : 'bg-rose-50/80 border-rose-200 hover:border-rose-300'
          }`}
        >
          <div className="text-xs font-bold text-rose-800 flex items-center justify-between">
            <span>เกินกำหนด 7 วัน</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1">{stats.overdueCount}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">ต้องเร่งติดต่อทันที ⚠️</div>
        </div>

        {/* Pending Contact */}
        <div 
          onClick={() => { setStatusFilter('pending_contact'); setOnlyOverdue(false); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'pending_contact'
              ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-semibold text-slate-500">รอติดต่อ / รอนัด</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{stats.pendingContact}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">ประสานงานผู้ป่วย</div>
        </div>

        {/* Scheduled */}
        <div 
          onClick={() => { setStatusFilter('scheduled'); setOnlyOverdue(false); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'scheduled'
              ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-semibold text-slate-500">นัดส่องกล้องแล้ว</div>
          <div className="text-2xl font-black text-purple-700 mt-1">{stats.scheduled}</div>
          <div className="text-[11px] text-purple-700 font-medium mt-1">เตรียมลำไส้ / รพ.สกลนคร</div>
        </div>

        {/* Completed */}
        <div 
          onClick={() => { setStatusFilter('colonoscopy_done'); setOnlyOverdue(false); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'colonoscopy_done'
              ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-semibold text-slate-500">ส่องกล้อง / ได้ผลชิ้นเนื้อ</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{stats.completed}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">วินิจฉัยและดูแลต่อเนื่อง</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วย ชื่อ, นามสกุล, HN, เบอร์โทรศัพท์, หรือชื่อหมู่บ้าน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white text-slate-800 placeholder:text-slate-400 transition-all"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-3 pr-8 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-700 cursor-pointer"
              >
                <option value="all">🔍 ทุกสถานะ ({positivePatients.length})</option>
                <option value="pending_contact">🟡 รอติดต่อแจ้งผล</option>
                <option value="contacted">🔵 ติดต่อสำเร็จ / รอนัด</option>
                <option value="scheduled">🟣 นัดส่องกล้องแล้ว</option>
                <option value="prep_in_progress">💊 กำลังเตรียมตัว/รับยา</option>
                <option value="colonoscopy_done">🔬 ส่องกล้องเรียบร้อย</option>
                <option value="biopsy_reported">🟢 ผลชิ้นเนื้อออกแล้ว</option>
                <option value="refused">🔴 ปฏิเสธการส่องกล้อง</option>
                <option value="cannot_contact">⚪ ติดต่อไม่ได้</option>
              </select>
            </div>

            {/* Subdistrict filter */}
            <div className="relative">
              <select
                value={subdistrictFilter}
                onChange={(e) => setSubdistrictFilter(e.target.value)}
                className="pl-3 pr-8 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-700 cursor-pointer"
              >
                <option value="all">📍 ทุกตำบล</option>
                <option value="นาแก้ว">ต.นาแก้ว</option>
                <option value="บ้านแป้น">ต.บ้านแป้น</option>
                <option value="โพนแพง">ต.โพนแพง</option>
                <option value="เชียงสือ">ต.เชียงสือ</option>
              </select>
            </div>

            {/* Overdue Toggle button */}
            <button
              type="button"
              onClick={() => setOnlyOverdue(!onlyOverdue)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                onlyOverdue
                  ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                  : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${onlyOverdue ? 'text-white' : 'text-rose-600'}`} />
              <span>เฉพาะเกิน 7 วัน</span>
            </button>

            {/* Adenocarcinoma Filter button */}
            <button
              type="button"
              onClick={() => setOnlyAdeno(!onlyAdeno)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                onlyAdeno
                  ? 'bg-rose-700 border-rose-700 text-white shadow-xs ring-2 ring-rose-300'
                  : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
              }`}
            >
              <span>🎗️ มะเร็งลำไส้ใหญ่ (Adenocarcinoma)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                onlyAdeno ? 'bg-white text-rose-900' : 'bg-rose-200 text-rose-900'
              }`}>
                {adenoPatients.length}
              </span>
            </button>

            {/* Clear Filters */}
            {(searchTerm || statusFilter !== 'all' || subdistrictFilter !== 'all' || onlyOverdue || onlyAdeno) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSubdistrictFilter('all');
                  setOnlyOverdue(false);
                  setOnlyAdeno(false);
                }}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div>
            แสดงผล <strong>{filteredPatients.length}</strong> รายการ จากผู้ป่วย FIT บวกทั้งหมด {positivePatients.length} ราย
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              แถบสีแดง = เกินกำหนด 7 วันยังไม่ได้นัด
            </span>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4 whitespace-nowrap">HN / ที่อยู่</th>
                <th className="py-3.5 px-4 whitespace-nowrap">ชื่อ-นามสกุล / เพศ / อายุ</th>
                <th className="py-3.5 px-4 whitespace-nowrap">พิกัดบ้าน GPS (Lat, Lng)</th>
                <th className="py-3.5 px-4 whitespace-nowrap">เบอร์โทรศัพท์</th>
                <th className="py-3.5 px-4 whitespace-nowrap">วันที่ผล FIT ออก</th>
                <th className="py-3.5 px-4 whitespace-nowrap">สถานะปัจจุบัน & Clinical Notes</th>
                <th className="py-3.5 px-4 whitespace-nowrap">วันนัดส่องกล้อง & เตรียมตัว</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">การดำเนินการ (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">ไม่พบข้อมูลตามเงื่อนไขการค้นหา</p>
                      <p className="text-xs text-slate-400">ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const tracking = patient.caTracking;
                  const isAdeno = tracking?.biopsyResult === 'adenocarcinoma';
                  const hasPin = Boolean(patient.location && patient.location.lat && patient.location.lng);
                  const { days: daysSinceFit, isOverdue } = getOverdueInfo(patient);
                  const fitDateStr = tracking?.fitPositiveDate || patient.testedDate?.slice(0, 10) || '-';
                  const appointmentDateStr = tracking?.appointmentDate || patient.referral?.appointmentDate;

                  return (
                    <tr 
                      key={patient.id}
                      className={`hover:bg-teal-50/40 transition-colors ${
                        isAdeno ? 'bg-rose-50/20' : ''
                      } ${
                        isOverdue ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      {/* HN */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          {isOverdue && (
                            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" title="เคสเกินกำหนด"></span>
                          )}
                          <span>{patient.hn}</span>
                        </div>
                        <div className="text-[11px] font-normal text-slate-400">
                          ม.{patient.villageNo} {patient.villageName}
                        </div>
                      </td>

                      {/* Name & Age & Adeno diagnosis */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span>{patient.prefix}{patient.firstName} {patient.lastName}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          อายุ {patient.ageYears} ปี • เพศ{patient.gender} • {patient.benefitCode}
                        </div>
                        {isAdeno && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                              <span>🎗️ มะเร็งลำไส้ใหญ่ (Adenocarcinoma)</span>
                              {tracking?.cancerStaging && (
                                <span className="font-semibold text-rose-900">• {tracking.cancerStaging}</span>
                              )}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* GPS Coordinates (Lat, Lng) & Pin Status */}
                      <td className="py-3 px-4">
                        {hasPin && patient.location?.lat && patient.location?.lng ? (
                          <div className="space-y-1">
                            <div className="font-mono text-xs font-bold text-slate-900 flex items-center gap-1">
                              <Compass className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span className="text-emerald-800">
                                {patient.location.lat.toFixed(6)}, {patient.location.lng.toFixed(6)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px]">
                              <button
                                type="button"
                                onClick={() => {
                                  const coords = `${patient.location?.lat?.toFixed(6)}, ${patient.location?.lng?.toFixed(6)}`;
                                  navigator.clipboard.writeText(coords);
                                  showToast(`คัดลอกพิกัด Lat, Lng แล้ว: ${coords}`);
                                }}
                                className="text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                                title="คัดลอกพิกัด Latitude, Longitude"
                              >
                                <Copy className="w-3 h-3" />
                                <span>คัดลอก</span>
                              </button>
                              <span className="text-slate-300">•</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetMapHn(patient.hn);
                                  setSubView('map');
                                }}
                                className="text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                                title="เปิดดูบนแผนที่ Map Colon"
                              >
                                <MapPin className="w-3 h-3" />
                                <span>ดูแผนที่</span>
                              </button>
                              <span className="text-slate-300">•</span>
                              <button
                                type="button"
                                onClick={() => setSharingVhvPatient(patient)}
                                className="text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                                title="แชร์ลิงก์ให้ อสม."
                              >
                                <Share2 className="w-3 h-3" />
                                <span>แชร์</span>
                              </button>
                            </div>
                            {patient.location.landmark && (
                              <div className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50 truncate max-w-[190px]" title={patient.location.landmark}>
                                🚩 {patient.location.landmark}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                              <span>ยังไม่ระบุพิกัด</span>
                            </span>
                            <div>
                              <button
                                type="button"
                                onClick={() => setSharingVhvPatient(patient)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
                                title="ปักหมุดแผนที่ไม่ได้? แชร์ลิงก์ให้ อสม./เจ้าหน้าที่ กดส่งพิกัดขึ้นมา โดยไม่ต้อง Login"
                              >
                                <Share2 className="w-3 h-3" />
                                <span>แชร์ให้ อสม. ปักหมุด</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4">
                        {patient.phone ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${patient.phone.replace(/[^0-9]/g, '')}`}
                              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              {patient.phone}
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">ไม่มีเบอร์โทร</span>
                        )}
                      </td>

                      {/* FIT Date with Overdue Highlight */}
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-slate-800">
                          {fitDateStr}
                        </div>
                        {isOverdue ? (
                          <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white shadow-2xs">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{daysSinceFit} วันที่แล้ว (เกิน 7 วัน ⚠️)</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {daysSinceFit} วันที่ผ่านมา
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        <div>
                          {renderStatusBadge(tracking?.status)}
                        </div>
                        {tracking?.clinicalNotes && (
                          <div className="text-[11px] text-slate-600 mt-1.5 line-clamp-2 max-w-[280px] xl:max-w-[360px] 2xl:max-w-[460px] bg-slate-50 p-1.5 rounded-lg border border-slate-200/60" title={tracking.clinicalNotes}>
                            <span className="font-semibold text-slate-700">📝 โน้ต:</span> {tracking.clinicalNotes}
                          </div>
                        )}
                      </td>

                      {/* Appointment & Bowel Prep Status */}
                      <td className="py-3 px-4 text-xs">
                        {appointmentDateStr ? (
                          <div className="space-y-1">
                            <div className="font-bold text-purple-950 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                              <span>{appointmentDateStr} {tracking?.appointmentTime || patient.referral?.appointmentTime || ''}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {tracking?.hospitalName || patient.referral?.destinationHospital || 'รพ.สกลนคร'}
                            </div>
                            {/* Preparation status tag */}
                            {tracking?.bowelPrepStatus && (
                              <div className="mt-1">
                                {renderPrepBadge(tracking.bowelPrepStatus)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-slate-400 italic text-xs block">ยังไม่นัดหมาย</span>
                            {tracking?.bowelPrepStatus && (
                              <div className="mt-0.5">
                                {renderPrepBadge(tracking.bowelPrepStatus)}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Call */}
                          <button
                            type="button"
                            title="บันทึกการโทรติดต่อ"
                            onClick={() => setCallLogPatient(patient)}
                            className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <PhoneCall className="w-4 h-4" />
                          </button>

                          {/* Quick Appointment */}
                          <button
                            type="button"
                            title="เลื่อนนัด / บันทึกนัดส่องกล้อง"
                            onClick={() => setAppointmentPatient(patient)}
                            className="p-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>

                          {/* Quick Colonoscopy */}
                          <button
                            type="button"
                            title="บันทึกผลส่องกล้อง & ชิ้นเนื้อ"
                            onClick={() => setColonoscopyPatient(patient)}
                            className="p-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Activity className="w-4 h-4" />
                          </button>

                          {/* Map Colon Navigation - ALWAYS ACTIVE */}
                          <button
                            type="button"
                            title={isAdeno 
                              ? "เปิดแผนที่พิกัดบ้านผู้ป่วยมะเร็งลำไส้ใหญ่ (Map Colon)" 
                              : "เปิดแผนที่และปักหมุดบ้าน (Map Colon)"}
                            onClick={() => {
                              setTargetMapHn(patient.hn);
                              setSubView('map');
                              if (onNavigateToMap) onNavigateToMap(patient.hn);
                            }}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isAdeno
                                ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-300 ring-2 ring-rose-400/30'
                                : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                            }`}
                          >
                            <MapPin className="w-4 h-4" />
                          </button>

                          {/* Share VHV Public Pin Link */}
                          <button
                            type="button"
                            title="แชร์ลิงก์ให้ อสม./เจ้าหน้าที่ กดส่งพิกัดขึ้นมา (ไม่ต้อง Login)"
                            onClick={() => setSharingVhvPatient(patient)}
                            className="p-1.5 text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          {/* Detail / Patient Journey */}
                          <button
                            type="button"
                            title="ดูเส้นทางการดูแลผู้ป่วย (Patient Journey)"
                            onClick={() => setDetailPatient(patient)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                            <span>ดูไทม์ไลน์</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* MODALS */}

      {/* 1. Patient Journey Detail Modal */}
      {detailPatient && (
        <PatientJourneyModal
          patient={detailPatient}
          onClose={() => setDetailPatient(null)}
          onUpdatePatient={(updated) => {
            onUpdatePatient(updated);
            setDetailPatient(updated);
          }}
          onOpenCallLog={() => {
            setCallLogPatient(detailPatient);
          }}
          onOpenAppointment={() => {
            setAppointmentPatient(detailPatient);
          }}
          onOpenColonoscopy={() => {
            setColonoscopyPatient(detailPatient);
          }}
        />
      )}

      {/* 2. Quick Call Log Modal */}
      {callLogPatient && (
        <QuickCallLogModal
          patient={callLogPatient}
          onClose={() => setCallLogPatient(null)}
          onSave={(updated) => {
            onUpdatePatient(updated);
            if (detailPatient && detailPatient.id === updated.id) {
              setDetailPatient(updated);
            }
          }}
        />
      )}

      {/* 3. Quick Appointment Modal */}
      {appointmentPatient && (
        <QuickAppointmentModal
          patient={appointmentPatient}
          onClose={() => setAppointmentPatient(null)}
          onSave={(updated) => {
            onUpdatePatient(updated);
            if (detailPatient && detailPatient.id === updated.id) {
              setDetailPatient(updated);
            }
          }}
        />
      )}

      {/* 4. Quick Colonoscopy Modal */}
      {colonoscopyPatient && (
        <QuickColonoscopyModal
          patient={colonoscopyPatient}
          onClose={() => setColonoscopyPatient(null)}
          onSave={(updated) => {
            onUpdatePatient(updated);
            if (detailPatient && detailPatient.id === updated.id) {
              setDetailPatient(updated);
            }
          }}
        />
      )}

      {/* 5. VHV Public Pin Share Modal (ปักหมุดแผนที่ไม่ได้ แชร์ลิงก์ให้ อสม./เจ้าหน้าที่ กดส่งพิกัดขึ้นมา โดยไม่ต้อง Login) */}
      {sharingVhvPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scale-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-teal-200">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">แชร์ลิงก์ปักหมุดบ้านผู้ป่วย</h3>
                  <p className="text-[11px] text-teal-200">
                    ให้ อสม. หรือเจ้าหน้าที่ กดส่งพิกัดขึ้นมา <strong className="text-white underline">โดยไม่ต้อง Login</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSharingVhvPatient(null);
                  setShowQrCode(false);
                }}
                className="text-teal-200 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              {/* Patient summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-900">
                    {sharingVhvPatient.prefix}{sharingVhvPatient.firstName} {sharingVhvPatient.lastName}
                  </div>
                  <span className="font-mono text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                    HN: {sharingVhvPatient.hn}
                  </span>
                </div>
                <div className="text-slate-600 mt-1">
                  🏠 ที่อยู่: บ้านเลขที่ {sharingVhvPatient.houseNo} ม.{sharingVhvPatient.villageNo} {sharingVhvPatient.villageName || ''} ต.{sharingVhvPatient.subdistrict || 'นาแก้ว'} อ.โพนนาแก้ว
                </div>
                {sharingVhvPatient.caTracking?.biopsyResult === 'adenocarcinoma' && (
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    <span>🎗️ มะเร็งลำไส้ใหญ่ (Adenocarcinoma)</span>
                    {sharingVhvPatient.caTracking.cancerStaging && <span>({sharingVhvPatient.caTracking.cancerStaging})</span>}
                  </div>
                )}
              </div>

              {/* Status & Coordinates */}
              {sharingVhvPatient.location?.lat && sharingVhvPatient.location?.lng ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                  <div className="font-bold text-emerald-800 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Compass className="w-4 h-4 text-emerald-700" />
                      <span>มีพิกัดบ้านในระบบแล้ว</span>
                    </span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                      พร้อมใช้งาน
                    </span>
                  </div>
                  <div className="font-mono text-slate-800 pt-1 flex justify-between">
                    <span>Latitude (ละติจูด):</span>
                    <strong>{sharingVhvPatient.location.lat.toFixed(6)}</strong>
                  </div>
                  <div className="font-mono text-slate-800 flex justify-between">
                    <span>Longitude (ลองจิจูด):</span>
                    <strong>{sharingVhvPatient.location.lng.toFixed(6)}</strong>
                  </div>
                  <p className="text-[10px] text-emerald-700 pt-1">
                    หากตำแหน่งยังไม่แม่นยำ สามารถส่งลิงก์ให้ อสม. ไปยืนหน้าบ้านแล้วกดอัปเดตใหม่ได้
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>ผู้ป่วยท่านนี้ยังไม่มีพิกัดบ้าน (ปักหมุดแผนที่ไม่ได้)</span>
                  </div>
                  <p className="text-[11px] text-amber-800/90 leading-relaxed">
                    ส่งลิงก์นี้ให้ อสม. หรือญาติผู้ป่วย เปิดผ่าน LINE หรือเบราว์เซอร์บนมือถือเพื่อกด <strong>"ดึงพิกัด GPS ขณะอยู่หน้าบ้าน"</strong> แล้วส่งพิกัดเข้าสู่ระบบได้ทันที <strong>โดยไม่ต้อง Login</strong>
                  </p>
                </div>
              )}

              {/* Public URL Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  🔗 ลิงก์สำหรับ อสม. (ไม่ต้อง Login)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={getVhvPublicPinUrl(sharingVhvPatient)}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const url = getVhvPublicPinUrl(sharingVhvPatient);
                      navigator.clipboard.writeText(url);
                      setCopiedLink(true);
                      showToast('คัดลอกลิงก์ปักหมุดสำหรับ อสม. สำเร็จ!');
                      setTimeout(() => setCopiedLink(false), 2500);
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex-shrink-0 transition-colors cursor-pointer"
                  >
                    {copiedLink ? 'คัดลอกแล้ว ✓' : 'คัดลอก'}
                  </button>
                </div>
              </div>

              {/* Share Actions */}
              <div className="space-y-2 pt-1">
                {/* 1. LINE Share Button */}
                <button
                  type="button"
                  onClick={() => handleShareVhvPinToLine(sharingVhvPatient)}
                  className="w-full py-2.5 px-4 bg-[#06c755] hover:bg-[#05b34c] text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>แชร์เข้า LINE ทันที (พร้อมข้อความขอพิกัด)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  {/* QR Code toggle */}
                  <button
                    type="button"
                    onClick={() => setShowQrCode(!showQrCode)}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-slate-600" />
                    <span>{showQrCode ? 'ซ่อน QR Code' : 'แสดง QR Code'}</span>
                  </button>

                  {/* Test open button */}
                  <button
                    type="button"
                    onClick={() => {
                      const url = getVhvPublicPinUrl(sharingVhvPatient);
                      window.open(url, '_blank');
                    }}
                    className="py-2 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-teal-200 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-teal-600" />
                    <span>ทดสอบเปิดหน้าปักหมุด</span>
                  </button>
                </div>

                {/* QR Code Display */}
                {showQrCode && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 animate-fade-in">
                    <div className="bg-white p-2 rounded-xl shadow-xs border border-slate-200">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(getVhvPublicPinUrl(sharingVhvPatient))}`}
                        alt="QR Code สำหรับปักหมุดบ้าน"
                        className="w-40 h-40 object-contain"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 text-center">
                      ให้ อสม. หรือเจ้าหน้าที่ใช้กล้องโทรศัพท์มือถือสแกนเพื่อเปิดหน้าส่งพิกัดได้ทันที
                    </p>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="pt-2 flex justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSharingVhvPatient(null);
                    setShowQrCode(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
