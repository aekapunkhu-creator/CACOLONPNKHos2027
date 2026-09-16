import React, { useState } from 'react';
import { PatientScreening, FitResultType } from '../types';
import { exportScreeningToExcel } from '../utils/excel';
import { VILLAGE_LIST } from '../mockData';
import { 
  FileSpreadsheet, 
  Search, 
  Download, 
  Filter, 
  CheckCircle2, 
  AlertOctagon, 
  HelpCircle,
  Clock,
  Send,
  Printer
} from 'lucide-react';

interface AllScreeningListViewProps {
  patients: PatientScreening[];
  onNavigateToReferral: (hn: string) => void;
}

export const AllScreeningListView: React.FC<AllScreeningListViewProps> = ({
  patients,
  onNavigateToReferral
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResult, setFilterResult] = useState<string>('all');
  const [filterVillage, setFilterVillage] = useState<string>('all');

  const filteredPatients = patients.filter((p) => {
    // Text search
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchHn = p.hn.toLowerCase().includes(q);
      const matchName = `${p.prefix}${p.firstName} ${p.lastName}`.toLowerCase().includes(q);
      const matchIdCard = p.idCard.includes(q);
      const matchHouse = p.houseNo.toLowerCase().includes(q);
      if (!matchHn && !matchName && !matchIdCard && !matchHouse) return false;
    }

    // Result filter
    if (filterResult !== 'all') {
      if (filterResult === 'pending' && p.fitResult !== 'pending') return false;
      if (filterResult === 'positive' && p.fitResult !== 'positive') return false;
      if (filterResult === 'negative' && p.fitResult !== 'negative') return false;
      if (filterResult === 'inconclusive' && p.fitResult !== 'inconclusive') return false;
    }

    // Village filter
    if (filterVillage !== 'all' && p.villageNo !== filterVillage) {
      return false;
    }

    return true;
  });

  const handleExportExcel = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    exportScreeningToExcel(filteredPatients, `รายชื่อผู้คัดกรองมะเร็งลำไส้ใหญ่_รพ.โพนนาแก้ว_${todayStr}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner & Excel Export */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-md mb-2">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              หน้าที่ 6: รายงานรายชื่อผู้รับการคัดกรองทั้งหมด
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              แสดงรายชื่อคัดกรองทั้งหมด & ส่งออกเป็นไฟล์ Excel
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              ตารางข้อมูลครบถ้วน: HN, ชื่อ-สกุล, เลขที่บัตรประชาชน, บ้านเลขที่, ส่วนสูง, น้ำหนัก, รอบเอว, ความดันโลหิต, ว/ด/ป ที่ตรวจ และผลตรวจคัดกรอง
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2 self-start md:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออกเป็นไฟล์ Excel (.xlsx)</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหา HN / ชื่อ-สกุล / เลขบัตร ปชช. / บ้านเลขที่..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Filter by Result */}
          <div>
            <select
              value={filterResult}
              onChange={(e) => setFilterResult(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">ผลตรวจทั้งหมด ({patients.length})</option>
              <option value="positive">เฉพาะ ผลบวก Positive (1B0061)</option>
              <option value="negative">เฉพาะ ผลลบ Negative (1B0060)</option>
              <option value="inconclusive">เฉพาะ ออกผลไม่ได้ (Inconclusive)</option>
              <option value="pending">เฉพาะ ยังไม่ได้ตรวจ/รอผล</option>
            </select>
          </div>

          {/* Filter by Village */}
          <div>
            <select
              value={filterVillage}
              onChange={(e) => setFilterVillage(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">ทุกหมู่บ้าน (อ.โพนนาแก้ว)</option>
              {VILLAGE_LIST.map((v) => (
                <option key={v.no} value={v.no}>
                  หมู่ {v.no} {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Mobile Card View for Phones + Table View for Desktop */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-600 font-medium">
            แสดง <strong className="text-slate-900 font-bold">{filteredPatients.length}</strong> จากทั้งหมด {patients.length} รายการ
          </span>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Positive: {filteredPatients.filter(p => p.fitResult === 'positive').length}
            </span>
            <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Negative: {filteredPatients.filter(p => p.fitResult === 'negative').length}
            </span>
          </div>
        </div>

        {/* 1. Mobile Card List (แสดงเฉพาะหน้าจอมือถือ sm:hidden เพื่อความสะดวกสูงสุด) */}
        <div className="sm:hidden divide-y divide-slate-100">
          {filteredPatients.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              ไม่พบข้อมูลผู้รับการตรวจคัดกรองตามเงื่อนไขที่ระบุ
            </div>
          ) : (
            filteredPatients.map((p, index) => {
              const waist = p.waistInch ? `${p.waistInch} นิ้ว` : (p.waistCm ? `${p.waistCm} ซม.` : '-');
              const bp = (p.bloodPressureSys && p.bloodPressureDia) ? `${p.bloodPressureSys}/${p.bloodPressureDia}` : '-';

              return (
                <div key={p.id} className="p-3.5 space-y-2 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      HN: {p.hn}
                    </span>
                    <div>
                      {p.fitResult === 'positive' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                          Positive (1B0061)
                        </span>
                      ) : p.fitResult === 'negative' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Negative (1B0060)
                        </span>
                      ) : p.fitResult === 'inconclusive' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900 text-white">
                          Inconclusive
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
                          รอผลตรวจ
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div className="font-bold text-slate-900 text-sm">
                      {p.prefix}{p.firstName} {p.lastName}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      อายุ {p.ageYears} ปี ({p.gender})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <div><span className="text-slate-400">เลขบัตร:</span> <span className="font-mono">{p.idCard}</span></div>
                    <div><span className="text-slate-400">ที่อยู่:</span> {p.houseNo} ม.{p.villageNo}</div>
                    <div><span className="text-slate-400">สส./นน.:</span> {p.heightCm || '-'}ซม. / {p.weightKg || '-'}กก.</div>
                    <div><span className="text-slate-400">เอว:</span> {waist}</div>
                    <div><span className="text-slate-400">BP:</span> <span className="font-mono">{bp}</span></div>
                    <div><span className="text-slate-400">วันที่ตรวจ:</span> {p.testedDate || '-'}</div>
                  </div>

                  {p.fitResult === 'positive' && (
                    <button
                      type="button"
                      onClick={() => onNavigateToReferral(p.hn)}
                      className="w-full mt-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>เปิดใบส่งตัวส่องกล้อง รพ.สกลนคร</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 2. Desktop / Tablet Table View (hidden sm:block) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/90 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 text-center">ลำดับ</th>
                <th className="px-3 py-3">HN</th>
                <th className="px-4 py-3">ชื่อ-สกุล</th>
                <th className="px-3 py-3">เลขที่บัตรประชาชน</th>
                <th className="px-3 py-3">บ้านเลขที่</th>
                <th className="px-3 py-3 text-right">ส่วนสูง</th>
                <th className="px-3 py-3 text-right">น้ำหนัก</th>
                <th className="px-3 py-3 text-right">รอบเอว</th>
                <th className="px-3 py-3 text-center">ความดันโลหิต</th>
                <th className="px-3 py-3">ว/ด/ป ที่ตรวจ</th>
                <th className="px-3 py-3 text-center">ผลตรวจคัดกรอง</th>
                <th className="px-3 py-3 text-center">ส่งต่อ Colonoscopy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-slate-400">
                    ไม่พบข้อมูลผู้รับการตรวจคัดกรองตามเงื่อนไขที่ระบุ
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p, index) => {
                  const waist = p.waistInch ? `${p.waistInch} นิ้ว` : (p.waistCm ? `${p.waistCm} ซม.` : '-');
                  const bp = (p.bloodPressureSys && p.bloodPressureDia) ? `${p.bloodPressureSys}/${p.bloodPressureDia}` : '-';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-3 text-center text-slate-400 font-mono">
                        {index + 1}
                      </td>
                      <td className="px-3 py-3 font-mono font-bold text-emerald-800 whitespace-nowrap">
                        {p.hn}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                        {p.prefix}{p.firstName} {p.lastName}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {p.gender} | อายุ {p.ageYears} ปี
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-slate-700 whitespace-nowrap">
                        {p.idCard}
                      </td>
                      <td className="px-3 py-3 text-slate-700 whitespace-nowrap">
                        {p.houseNo} ม.{p.villageNo}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-700">
                        {p.heightCm ? `${p.heightCm} ซม.` : '-'}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-700">
                        {p.weightKg ? `${p.weightKg} กก.` : '-'}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-700 whitespace-nowrap">
                        {waist}
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-slate-700 whitespace-nowrap">
                        {bp}
                      </td>
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                        {p.testedDate || '-'}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {p.fitResult === 'positive' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                            Positive (1B0061)
                          </span>
                        ) : p.fitResult === 'negative' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                            Negative (1B0060)
                          </span>
                        ) : p.fitResult === 'inconclusive' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-900 text-white">
                            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                            Inconclusive
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            รอผลตรวจ
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {p.fitResult === 'positive' ? (
                          <button
                            type="button"
                            onClick={() => onNavigateToReferral(p.hn)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg transition-colors"
                            title="ดูใบส่งต่อส่องกล้อง รพ.สกลนคร"
                          >
                            <Send className="w-3 h-3" />
                            ใบส่งต่อ รพ.สกลนคร
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
