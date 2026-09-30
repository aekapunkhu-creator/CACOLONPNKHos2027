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
  HelpCircle
} from 'lucide-react';
import { PatientJourneyModal } from './PatientJourneyModal';
import { QuickCallLogModal } from './QuickCallLogModal';
import { QuickAppointmentModal } from './QuickAppointmentModal';
import { QuickColonoscopyModal } from './QuickColonoscopyModal';

interface CaColonTrackingViewProps {
  patients: PatientScreening[];
  onUpdatePatient: (updated: PatientScreening) => void;
}

export const CaColonTrackingView: React.FC<CaColonTrackingViewProps> = ({
  patients,
  onUpdatePatient
}) => {
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [onlyOverdue, setOnlyOverdue] = useState<boolean>(false);
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

      return true;
    });
  }, [positivePatients, searchTerm, statusFilter, subdistrictFilter, onlyOverdue, referenceDate]);

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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Title & Mission Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-emerald-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                ระบบติดตามผู้ป่วยสงสัยมะเร็งลำไส้ใหญ่ (CA Colon Active Tracking)
              </h2>
              <p className="text-teal-200/80 text-xs">
                โรงพยาบาลโพนนาแก้ว • ติดตามเชิงรุกผู้มีผล FIT Test เป็นบวก (Code 1B0061) ส่งต่อส่องกล้อง รพ.สกลนคร
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {stats.overdueCount > 0 && (
            <button
              onClick={() => setOnlyOverdue(!onlyOverdue)}
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
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                onlyOverdue
                  ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                  : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${onlyOverdue ? 'text-white' : 'text-rose-600'}`} />
              <span>เฉพาะเกิน 7 วัน</span>
            </button>

            {/* Clear Filters */}
            {(searchTerm || statusFilter !== 'all' || subdistrictFilter !== 'all' || onlyOverdue) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSubdistrictFilter('all');
                  setOnlyOverdue(false);
                }}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 hover:underline"
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
                  <td colSpan={7} className="text-center py-12 text-slate-500">
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
                  const { days: daysSinceFit, isOverdue } = getOverdueInfo(patient);
                  const fitDateStr = tracking?.fitPositiveDate || patient.testedDate?.slice(0, 10) || '-';
                  const appointmentDateStr = tracking?.appointmentDate || patient.referral?.appointmentDate;

                  return (
                    <tr 
                      key={patient.id}
                      className={`hover:bg-teal-50/40 transition-colors ${
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

                      {/* Name & Age */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {patient.prefix}{patient.firstName} {patient.lastName}
                        </div>
                        <div className="text-xs text-slate-500">
                          อายุ {patient.ageYears} ปี • เพศ{patient.gender} • {patient.benefitCode}
                        </div>
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
                            className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                          >
                            <PhoneCall className="w-4 h-4" />
                          </button>

                          {/* Quick Appointment */}
                          <button
                            type="button"
                            title="เลื่อนนัด / บันทึกนัดส่องกล้อง"
                            onClick={() => setAppointmentPatient(patient)}
                            className="p-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>

                          {/* Quick Colonoscopy */}
                          <button
                            type="button"
                            title="บันทึกผลส่องกล้อง & ชิ้นเนื้อ"
                            onClick={() => setColonoscopyPatient(patient)}
                            className="p-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                          >
                            <Activity className="w-4 h-4" />
                          </button>

                          {/* Detail / Patient Journey */}
                          <button
                            type="button"
                            title="ดูเส้นทางการดูแลผู้ป่วย (Patient Journey)"
                            onClick={() => setDetailPatient(patient)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1 transition-colors"
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
    </div>
  );
};
