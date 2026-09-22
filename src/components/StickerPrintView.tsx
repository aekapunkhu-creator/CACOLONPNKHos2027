import React, { useState, useEffect, useMemo } from 'react';
import { 
  Printer, 
  FileDown, 
  Search, 
  CheckSquare, 
  Square, 
  QrCode, 
  Eye, 
  CheckCircle2, 
  Loader2, 
  Tag, 
  SlidersHorizontal,
  FileText,
  RotateCcw,
  Sparkles,
  Info,
  Edit3,
  Trash2,
  Copy,
  Plus,
  Minus,
  Layers
} from 'lucide-react';
import { PatientScreening, UserAccount } from '../types';
import { VILLAGE_LIST } from '../data/villages';
import { 
  generateHnQrCodeDataUrl, 
  exportStickersToPdf, 
  downloadBlobAsFile,
  renderStickerToCanvas,
  STICKER_WIDTH_MM,
  STICKER_HEIGHT_MM
} from '../utils/stickerGenerator';

interface StickerPrintViewProps {
  patients: PatientScreening[];
  initialSelectedHn?: string;
  onEditPatient?: (patient: PatientScreening) => void;
  onDeletePatient?: (patient: PatientScreening) => void;
  currentUser?: UserAccount | null;
}

export const StickerPrintView: React.FC<StickerPrintViewProps> = ({
  patients,
  initialSelectedHn,
  onEditPatient,
  onDeletePatient,
  currentUser
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Selected IDs for batch printing
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const list = Array.isArray(patients) ? patients : [];
    if (initialSelectedHn) {
      const match = list.find(p => p.hn === initialSelectedHn);
      return match ? new Set([match.id]) : new Set(list.slice(0, 20).map(p => p.id));
    }
    // Default select all or first 20
    return new Set(list.map(p => p.id));
  });

  // Keep selection in sync when initialSelectedHn changes
  useEffect(() => {
    if (initialSelectedHn) {
      const match = patients.find(p => p.hn === initialSelectedHn);
      if (match) {
        setSelectedIds(new Set([match.id]));
        setSearchQuery(initialSelectedHn);
      }
    }
  }, [initialSelectedHn, patients]);

  // QR Code Cache for preview cards (id -> dataUrl)
  const [qrCache, setQrCache] = useState<Record<string, string>>({});

  // PDF Export loading state
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportMode, setExportMode] = useState<'roll' | 'a4'>('roll');
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);

  // Zoom / Inspect Modal
  const [inspectedPatient, setInspectedPatient] = useState<PatientScreening | null>(null);
  const [inspectedCanvasUrl, setInspectedCanvasUrl] = useState<string | null>(null);

  // Render high-res sticker preview when modal opens
  useEffect(() => {
    if (inspectedPatient) {
      let active = true;
      renderStickerToCanvas(inspectedPatient).then(canvas => {
        if (active) {
          setInspectedCanvasUrl(canvas.toDataURL('image/png'));
        }
      }).catch(err => {
        console.error('Error rendering inspected sticker canvas:', err);
      });
      return () => {
        active = false;
      };
    } else {
      setInspectedCanvasUrl(null);
    }
  }, [inspectedPatient]);

  // Sticker Copies Configuration before print
  const [copiesPerPatient, setCopiesPerPatient] = useState<number>(2);
  const [customPatientCopies, setCustomPatientCopies] = useState<Record<string, number>>({});
  const [singleModalCopies, setSingleModalCopies] = useState<number>(1);

  // Print Mode configuration for browser print
  const [printLayout, setPrintLayout] = useState<'roll' | 'a4'>('roll');

  // Filtered patients list
  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      // Village filter
      if (selectedVillage !== 'all') {
        const match = patient.villageNo === selectedVillage || (!isNaN(parseInt(patient.villageNo, 10)) && parseInt(patient.villageNo, 10) === parseInt(selectedVillage, 10));
        if (!match) return false;
      }

      // Status filter
      if (selectedStatus === 'not_received' && patient.kitStatus !== 'not_received') return false;
      if (selectedStatus === 'received' && patient.kitStatus === 'not_received') return false;

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const fullName = `${patient.prefix}${patient.firstName} ${patient.lastName}`.toLowerCase();
        const hn = patient.hn.toLowerCase();
        const idCard = patient.idCard || '';
        const houseNo = patient.houseNo || '';
        const village = `ม.${patient.villageNo}`;
        
        return (
          fullName.includes(query) ||
          hn.includes(query) ||
          idCard.includes(query) ||
          houseNo.includes(query) ||
          village.includes(query)
        );
      }

      return true;
    });
  }, [patients, selectedVillage, selectedStatus, searchQuery]);

  // Selected patients list
  const selectedPatientsList = useMemo(() => {
    return patients.filter(p => selectedIds.has(p.id));
  }, [patients, selectedIds]);

  // Available villages for filter dropdown
  const villageList = useMemo(() => {
    const set = new Set<string>();
    patients.forEach(p => {
      if (p.villageNo) set.add(p.villageNo);
    });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [patients]);

  // Generate QR codes for the first visible batch of patients in preview
  useEffect(() => {
    let isCancelled = false;
    const list = Array.isArray(filteredPatients) ? filteredPatients : [];
    const toGenerate = list.slice(0, 30).filter(p => !qrCache[p.id]);

    if (toGenerate.length === 0) return;

    Promise.all(
      toGenerate.map(async (p) => {
        try {
          const url = await generateHnQrCodeDataUrl(p.hn);
          return { id: p.id, url };
        } catch (e) {
          console.error('Failed to generate QR for preview:', e);
          return null;
        }
      })
    ).then(results => {
      if (isCancelled) return;
      setQrCache(prev => {
        const next = { ...prev };
        results.forEach(res => {
          if (res) next[res.id] = res.url;
        });
        return next;
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [filteredPatients, qrCache]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredPatients.forEach(p => next.add(p.id));
      return next;
    });
  };

  const handleDeselectAllFiltered = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredPatients.forEach(p => next.delete(p.id));
      return next;
    });
  };

  const handleClearAllSelection = () => {
    setSelectedIds(new Set());
  };

  // Helper: Get expanded patient list based on configured copies per person
  const expandedPatientsToPrint = useMemo(() => {
    const result: Array<{ patient: PatientScreening; copyIndex: number; totalCopies: number }> = [];
    selectedPatientsList.forEach(patient => {
      const copies = customPatientCopies[patient.id] !== undefined ? customPatientCopies[patient.id] : copiesPerPatient;
      for (let c = 1; c <= Math.max(1, copies); c++) {
        result.push({ patient, copyIndex: c, totalCopies: copies });
      }
    });
    return result;
  }, [selectedPatientsList, customPatientCopies, copiesPerPatient]);

  const totalStickersCount = expandedPatientsToPrint.length;

  const handleUpdatePatientCopies = (patientId: string, count: number) => {
    setCustomPatientCopies(prev => ({
      ...prev,
      [patientId]: Math.max(1, Math.min(20, count))
    }));
  };

  // PDF Export Handler
  const handleExportPdf = async (mode: 'roll' | 'a4') => {
    if (selectedPatientsList.length === 0) {
      alert('กรุณาเลือกผู้ป่วยอย่างน้อย 1 รายการเพื่อพิมพ์หรือส่งออกสติกเกอร์');
      return;
    }

    const itemsToExport = expandedPatientsToPrint.map(item => item.patient);

    setIsExportingPdf(true);
    setExportMode(mode);
    setExportProgress({ current: 0, total: itemsToExport.length });

    try {
      const blob = await exportStickersToPdf(
        itemsToExport,
        mode,
        (current, total) => {
          setExportProgress({ current, total });
        }
      );

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = mode === 'roll'
        ? `Sticker-Roll-70x25mm-${itemsToExport.length}labels-${timestamp}.pdf`
        : `Sticker-A4Sheet-${itemsToExport.length}labels-${timestamp}.pdf`;

      downloadBlobAsFile(blob, filename);
    } catch (err: any) {
      console.error('Export sticker PDF error:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF: ' + (err?.message || err));
    } finally {
      setIsExportingPdf(false);
      setExportProgress(null);
    }
  };

  // Direct single-patient PDF export
  const handleExportSinglePdf = async (patient: PatientScreening, copies: number = 1) => {
    setIsExportingPdf(true);
    setExportMode('roll');
    try {
      const singleList: PatientScreening[] = [];
      for (let i = 0; i < copies; i++) {
        singleList.push(patient);
      }
      const blob = await exportStickersToPdf(singleList, 'roll');
      downloadBlobAsFile(blob, `Sticker-${patient.hn}-${patient.firstName}-${copies}labels.pdf`);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err?.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Direct Browser Print
  const handleDirectPrint = (layout: 'roll' | 'a4') => {
    if (selectedPatientsList.length === 0) {
      alert('กรุณาเลือกผู้ป่วยอย่างน้อย 1 รายการเพื่อพิมพ์สติกเกอร์');
      return;
    }
    setPrintLayout(layout);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div>
      {/* Dynamic @media print @page style for browser printing */}
      <style>{`
        @media print {
          @page {
            size: ${printLayout === 'roll' ? '70mm 25mm' : 'A4 portrait'};
            margin: ${printLayout === 'roll' ? '0' : '4mm'};
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
        }
      `}</style>

      {/* Screen Interactive UI (Hidden during direct print) */}
      <div className="no-print space-y-6">
        {/* 1. Header & Technical Specification Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-2xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold backdrop-blur-xs border border-emerald-400/30">
                <Tag className="w-3.5 h-3.5" />
                <span>พิมพ์สติกเกอร์หลอดเก็บสิ่งส่งตรวจ (Specimen Tube Labels)</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <Printer className="w-6 h-6 text-emerald-400" />
                ระบบพิมพ์สติกเกอร์ ขนาด 7.0 cm × 2.5 cm
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                สติกเกอร์มาตรฐานพร้อม <strong>QR Code จากเลข HN</strong>, <strong>ชื่อ-สกุล</strong>, <strong>เลข HN ชัดเจน</strong> และ <strong>ที่อยู่บ้านเลขที่ หมู่ที่</strong> สำหรับติดบนหลอดเก็บอุจจาระ FIT Test และซองส่งตรวจ รองรับทั้งเครื่องพิมพ์ฉลากความร้อนแบบม้วน (Thermal) และเครื่องพิมพ์ทั่วไป (กระดาษ A4)
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-[11px] text-emerald-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>ปรับปรุงใหม่: ตัวอักษรคมชัด ไม่ซ้อนทับกัน เว้นระยะสระ-วรรณยุกต์ภาษาไทยอย่างสมบูรณ์ และมีระบบ Auto-Scaling ปรับขนาดย่ออัตโนมัติ</span>
              </div>
            </div>

            {/* Quick Specifications Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 text-xs space-y-1.5 min-w-[240px] flex-shrink-0">
              <div className="font-semibold text-emerald-300 flex items-center gap-1.5 pb-1 border-b border-white/10">
                <Info className="w-3.5 h-3.5" />
                มาตรฐานขนาดฉลาก (Label Specs)
              </div>
              <div className="flex justify-between text-slate-200">
                <span className="text-slate-300">ขนาด:</span>
                <span className="font-mono font-bold text-white">ยาว 7 cm × กว้าง 2.5 cm</span>
              </div>
              <div className="flex justify-between text-slate-200">
                <span className="text-slate-300">ขนาดมิลลิเมตร:</span>
                <span className="font-mono text-emerald-200">70 mm × 25 mm</span>
              </div>
              <div className="flex justify-between text-slate-200">
                <span className="text-slate-300">บาร์โค้ด:</span>
                <span className="font-semibold text-cyan-200">2D QR Code (HN)</span>
              </div>
              <div className="flex justify-between text-slate-200">
                <span className="text-slate-300">ความละเอียด:</span>
                <span className="font-mono text-slate-200">300 DPI High-Res</span>
              </div>
            </div>
          </div>
        </div>

      {/* 2. Top Action & Export Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Selection Counter */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>เลือกสติกเกอร์ที่ต้องการพิมพ์:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                  {selectedPatientsList.length} / {patients.length} รายการ
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                เลือกทั้งหมดหรือเลือกเฉพาะบุคคล/หมู่บ้าน แล้วกดส่งออก PDF หรือสั่งพิมพ์ได้ทันที
              </p>
            </div>
          </div>

          {/* Right: Export & Print Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Export Roll PDF (70x25mm) */}
            <button
              type="button"
              onClick={() => handleExportPdf('roll')}
              disabled={isExportingPdf || selectedPatientsList.length === 0}
              title="สร้างไฟล์ PDF ขนาด 70x25 mm สำหรับเครื่องพิมพ์สติกเกอร์ความร้อน (Thermal Label Printer)"
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
            >
              {isExportingPdf && exportMode === 'roll' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังสร้าง PDF ({exportProgress?.current || 0}/{exportProgress?.total || 0})...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-emerald-200" />
                  <span>ส่งออก PDF ม้วน (70×25 mm)</span>
                </>
              )}
            </button>

            {/* Export A4 Sheet PDF (20 labels/page) */}
            <button
              type="button"
              onClick={() => handleExportPdf('a4')}
              disabled={isExportingPdf || selectedPatientsList.length === 0}
              title="สร้างไฟล์ PDF ขนาด A4 (20 ป้ายต่อแผ่น) สำหรับพิมพ์ด้วยเครื่องพิมพ์ทั่วไปบนกระดาษสติกเกอร์ A4"
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
            >
              {isExportingPdf && exportMode === 'a4' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังสร้าง PDF A4...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-teal-200" />
                  <span>ส่งออก PDF รวม A4 (20 ป้าย/แผ่น)</span>
                </>
              )}
            </button>

            {/* Direct Browser Print (Roll) */}
            <button
              type="button"
              onClick={() => handleDirectPrint('roll')}
              disabled={selectedPatientsList.length === 0}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>สั่งพิมพ์ทันที</span>
            </button>
          </div>
        </div>

        {/* 2.5 Quantity & Copies Configuration Bar before Printing */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 rounded-2xl border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-950 flex flex-wrap items-center gap-2">
                <span>กำหนดจำนวนสติกเกอร์ก่อนพิมพ์ (Copies per Person)</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200/90 text-emerald-900 text-[11px] font-extrabold">
                  พิมพ์คนละ {copiesPerPatient} ดวง
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                เลือกจำนวนดวงต่อคน: <strong>1 ดวง</strong> (ติดหลอดตรวจ) • <strong>2 ดวง</strong> (ติดหลอด + ซองส่งตรวจ/ใบนำส่ง) • <strong>3 ดวง</strong> (ติดแฟ้มประวัติ)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Presets 1, 2, 3, 4, 5 */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-emerald-300 shadow-2xs">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setCopiesPerPatient(num);
                    setCustomPatientCopies({});
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    copiesPerPatient === num
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {num} ดวง
                </button>
              ))}
            </div>

            {/* Custom +/- controls */}
            <div className="flex items-center border border-emerald-300 bg-white rounded-xl overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setCopiesPerPatient(Math.max(1, copiesPerPatient - 1))}
                className="px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                title="ลดจำนวนดวงสติกเกอร์"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min={1}
                max={20}
                value={copiesPerPatient}
                onChange={(e) => setCopiesPerPatient(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="w-12 text-center text-xs font-bold text-emerald-900 border-none focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setCopiesPerPatient(Math.min(20, copiesPerPatient + 1))}
                className="px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                title="เพิ่มจำนวนดวงสติกเกอร์"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Total stickers computed badge */}
            <div className="px-3.5 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 flex-shrink-0">
              <Layers className="w-3.5 h-3.5 text-emerald-300" />
              <span>ยอดพิมพ์รวม:</span>
              <span className="font-mono text-sm underline decoration-emerald-400 decoration-2">
                {totalStickersCount}
              </span>
              <span>ดวง</span>
            </div>
          </div>
        </div>

        {/* 3. Filters & Quick Selection Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหา HN / ชื่อ / เลขบัตร..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            {/* Village Selector */}
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">ทุกหมู่บ้าน ({patients.length})</option>
              {villageList.map(v => {
                const villageObj = VILLAGE_LIST.find(item => item.no === v || parseInt(item.no, 10) === parseInt(v, 10));
                const count = patients.filter(p => p.villageNo === v || parseInt(p.villageNo, 10) === parseInt(v, 10)).length;
                return (
                  <option key={v} value={v}>
                    หมู่ {v} {villageObj?.name || ''} ({count} คน)
                  </option>
                );
              })}
            </select>

            {/* Kit Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">สถานะชุดตรวจ: ทั้งหมด</option>
              <option value="not_received">ยังไม่ได้รับชุดตรวจ</option>
              <option value="received">ได้รับชุดตรวจแล้ว</option>
            </select>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>เลือกที่แสดง ({filteredPatients.length})</span>
            </button>

            <button
              type="button"
              onClick={handleDeselectAllFiltered}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors flex items-center gap-1.5"
            >
              <Square className="w-3.5 h-3.5 text-slate-400" />
              <span>ยกเลิกที่แสดง</span>
            </button>

            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={handleClearAllSelection}
                className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-medium transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ล้างทั้งหมด</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Main Sticker Preview Canvas Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-600 px-1">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>ตัวอย่างสติกเกอร์จริง (อัตราส่วนจริง 7.0 × 2.5 ซม. / 70 × 25 มม.)</span>
            <span className="text-slate-400">({filteredPatients.length} รายการที่ตรงเงื่อนไข)</span>
          </div>
          <span className="text-slate-500 hidden sm:inline">
            คลิกที่การ์ดเพื่อเลือก/ยกเลิก หรือกดปุ่ม <strong>ซูมตรวจ</strong> เพื่อดูขนาดเท่าของจริง
          </span>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700 text-sm">ไม่พบข้อมูลผู้ป่วยที่ตรงกับการค้นหา</p>
            <p className="text-xs text-slate-400 mt-1">
              ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองหมู่บ้านเป็น "ทุกหมู่บ้าน"
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPatients.map((patient) => {
              const isSelected = selectedIds.has(patient.id);
              const qrUrl = qrCache[patient.id];

              return (
                <div
                  key={patient.id}
                  className={`bg-white rounded-2xl border transition-all duration-150 overflow-hidden shadow-xs hover:shadow-md ${
                    isSelected 
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top card action bar */}
                  <div className="px-3.5 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(patient.id)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <span className="font-bold text-slate-700">HN: {patient.hn}</span>
                    </label>

                    <div className="flex items-center gap-1">
                      {onEditPatient && (
                        <button
                          type="button"
                          onClick={() => onEditPatient(patient)}
                          title="แก้ไขข้อมูลผู้ป่วย (Admin)"
                          className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeletePatient && (
                        <button
                          type="button"
                          onClick={() => onDeletePatient(patient)}
                          title="ลบข้อมูลผู้ป่วย (Admin)"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setInspectedPatient(patient)}
                        title="ดูขนาดจริง 7x2.5 cm"
                        className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportSinglePdf(patient)}
                        title="ดาวน์โหลด PDF เฉพาะรายนี้"
                        className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded text-[11px] transition-colors flex items-center gap-1"
                      >
                        <FileDown className="w-3 h-3" />
                        <span>PDF เดี่ยว</span>
                      </button>
                    </div>
                  </div>

                  {/* Visual Sticker Simulation (Aspect Ratio 70mm x 25mm = 2.8 : 1) */}
                  <div 
                    onClick={() => handleToggleSelect(patient.id)}
                    className="p-3.5 cursor-pointer bg-white relative group"
                  >
                    <div 
                      className="border border-slate-300 rounded-lg p-2.5 bg-white flex items-center gap-3 relative shadow-inner overflow-hidden"
                      style={{ minHeight: '105px' }}
                    >
                      {/* Left: QR Code from HN */}
                      <div className="w-[82px] h-[82px] bg-slate-50 border border-slate-200 rounded flex-shrink-0 flex items-center justify-center p-1 relative">
                        {qrUrl ? (
                          <img 
                            src={qrUrl} 
                            alt={`QR HN ${patient.hn}`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 text-[10px]">
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                          </div>
                        )}
                        <span className="absolute -bottom-1 text-[8px] bg-slate-900 text-white font-mono px-1 rounded">
                          QR:HN
                        </span>
                      </div>

                      {/* Right: Data Content */}
                      <div className="flex-1 min-w-0 space-y-0.5 text-left">
                        {/* Header note */}
                        <div className="text-[10px] font-bold text-emerald-800 tracking-tight flex items-center justify-between">
                          <span>รพ.โพนนาแก้ว • FIT Test</span>
                          <span className="text-[9px] text-slate-500 font-normal">7×2.5cm</span>
                        </div>

                        {/* HN and Age */}
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-black text-slate-950 font-mono tracking-tight">
                            HN: {patient.hn}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-600">
                            {patient.ageYears}ปี ({patient.gender === 'ชาย' ? 'ช' : 'ญ'})
                          </span>
                        </div>

                        {/* Full Name */}
                        <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {patient.prefix}{patient.firstName} {patient.lastName}
                        </div>

                        {/* Address (บ้านเลขที่ หมู่ที่) */}
                        <div className="text-[11px] font-medium text-slate-700 truncate">
                          บ้านเลขที่ {patient.houseNo} ม.{patient.villageNo} {patient.villageName ? `(${patient.villageName})` : ''} {patient.subdistrict ? `ต.${patient.subdistrict}` : ''}
                        </div>

                        {/* Masked ID / Benefit */}
                        <div className="text-[9px] text-slate-400 font-mono truncate">
                          ID: {patient.idCard.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5')}
                        </div>
                      </div>

                      {/* Selection Badge Checkmark */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Detailed Inspection / 100% Scale Modal */}
      {inspectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">ตรวจสอบตัวอย่างสติกเกอร์ขนาดจริง</h3>
                  <p className="text-xs text-slate-500">HN: {inspectedPatient.hn} • {inspectedPatient.prefix}{inspectedPatient.firstName} {inspectedPatient.lastName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedPatient(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* High-Resolution Live Canvas Real Scale Preview (70mm x 25mm) */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-600 flex justify-between">
                <span>ขนาดสติกเกอร์มาตรฐาน: 70 มม. × 25 มม. (7.0 × 2.5 ซม.)</span>
                <span className="text-emerald-700 font-bold">ความละเอียด 300 DPI คมชัดทุกพิกเซล</span>
              </div>

              {/* Exact physical size container with high-res Canvas rendering */}
              <div className="p-4 sm:p-6 bg-slate-100 rounded-2xl flex flex-col items-center justify-center border border-slate-200">
                {inspectedCanvasUrl ? (
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-300">
                      <img 
                        src={inspectedCanvasUrl} 
                        alt={`Sticker ${inspectedPatient.hn}`} 
                        className="w-[380px] max-w-full h-auto rounded border border-slate-200 block"
                      />
                    </div>
                    <div className="mt-2.5 text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>แสดงผลจริงจากตัวประมวลผล PDF/Roll Printer: ตัวหนังสือคมชัด ไม่ทับซ้อน จัดวางอย่างสมบูรณ์</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-[350px] h-[125px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    <span className="text-xs text-slate-500">กำลังประมวลผลตัวอย่างสติกเกอร์ความละเอียดสูง...</span>
                  </div>
                )}

                <div className="text-[11px] text-slate-500 mt-3 text-center">
                  💡 ข้อมูลใน QR Code คือเลขประจำตัวผู้ป่วย (HN): <code className="bg-white px-2 py-0.5 rounded border border-slate-300 font-bold font-mono text-emerald-700">{inspectedPatient.hn}</code> สามารถใช้กล้องมือถือหรือเครื่องสแกนบาร์โค้ดยิงเพื่อค้นหาประวัติได้ทันที
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">จำนวนดวง:</span>
                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setSingleModalCopies(Math.max(1, singleModalCopies - 1))}
                    className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    -
                  </button>
                  <span className="px-2.5 py-1 text-xs font-mono font-bold text-emerald-800">
                    {singleModalCopies} ดวง
                  </span>
                  <button
                    type="button"
                    onClick={() => setSingleModalCopies(Math.min(20, singleModalCopies + 1))}
                    className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInspectedPatient(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  ปิดหน้าต่าง
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExportSinglePdf(inspectedPatient, singleModalCopies);
                    setInspectedPatient(null);
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <FileDown className="w-4 h-4" />
                  <span>ดาวน์โหลด PDF ({singleModalCopies} ดวง)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* 6. Hidden Printable Sticker Section for Direct Browser Print (@media print) */}
      <div className="hidden print-only">
        {printLayout === 'roll' ? (
          // Continuous Roll layout: Each sticker is 70mm x 25mm on its own page
          <div className="sticker-roll-print-container">
            {expandedPatientsToPrint.map((item, idx) => {
              const patient = item.patient;
              const formattedCid = (patient.idCard || '').replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5');
              return (
                <div 
                  key={`print-roll-${patient.id}-copy-${item.copyIndex}-${idx}`}
                  className="sticker-label-roll page-break"
                  style={{
                    width: '70mm',
                    height: '25mm',
                    maxHeight: '25mm',
                    padding: '1.6mm 2mm',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2.5mm',
                    fontFamily: '"Prompt", "Sarabun", sans-serif',
                    overflow: 'hidden',
                    backgroundColor: '#ffffff',
                    pageBreakAfter: 'always',
                    breakAfter: 'page'
                  }}
                >
                  {/* Left: QR Code with label */}
                  {qrCache[patient.id] && (
                    <div style={{ width: '21.5mm', height: '21.5mm', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <img 
                        src={qrCache[patient.id]} 
                        alt={patient.hn} 
                        style={{ width: '19mm', height: '19mm', objectFit: 'contain' }} 
                      />
                      <span style={{ fontSize: '5pt', color: '#64748B', fontFamily: 'monospace', fontWeight: 'bold' }}>
                        QR: {patient.hn}
                      </span>
                    </div>
                  )}

                  {/* Vertical hairline divider */}
                  <div style={{ width: '1px', height: '21.5mm', backgroundColor: '#E2E8F0', flexShrink: 0 }} />

                  {/* Right: Text Details organized with flexbox space-between */}
                  <div style={{ flex: 1, minWidth: 0, height: '21.5mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {/* Row 1: Hospital Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.5pt', fontWeight: 'bold', color: '#047857', lineHeight: 1.1 }}>
                      <span>รพ.โพนนาแก้ว • FIT Test</span>
                      <span style={{ fontSize: '5.5pt', color: '#64748B', fontWeight: 'normal' }}>
                        {item.totalCopies > 1 ? `[${item.copyIndex}/${item.totalCopies}] 70×25mm` : '70×25mm'}
                      </span>
                    </div>

                    {/* Row 2: HN (Left) + Age/Sex (Right) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', lineHeight: 1.1 }}>
                      <span style={{ fontSize: '11pt', fontWeight: '900', color: '#000000', fontFamily: 'monospace', letterSpacing: '-0.3px' }}>
                        HN: {patient.hn}
                      </span>
                      <span style={{ fontSize: '6.5pt', fontWeight: 'bold', color: '#0F172A', backgroundColor: '#F1F5F9', padding: '0.3mm 1.5mm', borderRadius: '1mm', border: '0.3px solid #CBD5E1' }}>
                        อายุ {patient.ageYears} ปี ({patient.gender === 'ชาย' ? 'ช' : 'ญ'})
                      </span>
                    </div>

                    {/* Row 3: Full Name (Sharp & Bold) */}
                    <div style={{ fontSize: '8.5pt', fontWeight: 'bold', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.15 }}>
                      {patient.prefix}{patient.firstName} {patient.lastName}
                    </div>

                    {/* Row 4: Address */}
                    <div style={{ fontSize: '6.5pt', fontWeight: '500', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.15 }}>
                      บ้านเลขที่ {patient.houseNo || '-'} ม.{patient.villageNo || '-'} {patient.villageName ? `(${patient.villageName})` : ''} {patient.subdistrict ? `ต.${patient.subdistrict}` : ''}
                    </div>

                    {/* Row 5: CID + Benefit Code */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '5.5pt', color: '#475569', lineHeight: 1.1 }}>
                      <span style={{ fontFamily: 'monospace' }}>
                        เลขบัตร: {formattedCid || '-'}
                      </span>
                      <span style={{ fontWeight: 'bold', color: '#047857' }}>
                        {patient.benefitName || 'บัตรทอง'} (1B0060/61)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // A4 Grid Layout: 2 columns x 10 rows per sheet (20 labels/page)
          <div className="sticker-a4-sheet-container" style={{ padding: '5mm', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3.5mm 10mm', justifyContent: 'center' }}>
              {expandedPatientsToPrint.map((item, idx) => {
                const patient = item.patient;
                const formattedCid = (patient.idCard || '').replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5');
                const isNewPage = idx > 0 && idx % 20 === 0;
                return (
                  <div 
                    key={`print-a4-${patient.id}-copy-${item.copyIndex}-${idx}`}
                    className={`sticker-label-a4 ${isNewPage ? 'page-break' : ''}`}
                    style={{
                      width: '70mm',
                      height: '25mm',
                      maxHeight: '25mm',
                      border: '0.4px dashed #94A3B8',
                      padding: '1.6mm 2mm',
                      boxSizing: 'border-box',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2.5mm',
                      fontFamily: '"Prompt", "Sarabun", sans-serif',
                      overflow: 'hidden',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    {qrCache[patient.id] && (
                      <div style={{ width: '21.5mm', height: '21.5mm', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <img 
                          src={qrCache[patient.id]} 
                          alt={patient.hn} 
                          style={{ width: '19mm', height: '19mm', objectFit: 'contain' }} 
                        />
                        <span style={{ fontSize: '5pt', color: '#64748B', fontFamily: 'monospace', fontWeight: 'bold' }}>
                          QR: {patient.hn}
                        </span>
                      </div>
                    )}
                    <div style={{ width: '1px', height: '21.5mm', backgroundColor: '#E2E8F0', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0, height: '21.5mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.5pt', fontWeight: 'bold', color: '#047857', lineHeight: 1.1 }}>
                        <span>รพ.โพนนาแก้ว • FIT Test</span>
                        <span style={{ fontSize: '5.5pt', color: '#64748B' }}>70×25mm</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', lineHeight: 1.1 }}>
                        <span style={{ fontSize: '10.5pt', fontWeight: '900', color: '#000000', fontFamily: 'monospace' }}>
                          HN: {patient.hn}
                        </span>
                        <span style={{ fontSize: '6.5pt', fontWeight: 'bold', color: '#0F172A' }}>
                          อายุ {patient.ageYears} ปี ({patient.gender === 'ชาย' ? 'ช' : 'ญ'})
                        </span>
                      </div>
                      <div style={{ fontSize: '8.5pt', fontWeight: 'bold', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.15 }}>
                        {patient.prefix}{patient.firstName} {patient.lastName}
                      </div>
                      <div style={{ fontSize: '6.5pt', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.15 }}>
                        บ้านเลขที่ {patient.houseNo || '-'} ม.{patient.villageNo || '-'} {patient.villageName ? `(${patient.villageName})` : ''}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '5.5pt', color: '#64748B', lineHeight: 1.1 }}>
                        <span>ID: {formattedCid || '-'}</span>
                        <span style={{ color: '#047857', fontWeight: 'bold' }}>{patient.benefitName || 'บัตรทอง'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
