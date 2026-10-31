import React from 'react';
import { 
  LayoutDashboard, 
  UserPlus, 
  PackageCheck, 
  FlaskConical, 
  FileText, 
  Users,
  Printer,
  Stethoscope,
  MapPin,
  ChevronRight,
  Share2,
  Calendar,
  Building2
} from 'lucide-react';
import { UserAccount } from '../types';

export type TabId = 
  | 'dashboard'
  | 'registration'
  | 'sticker-print'
  | 'sample-receive'
  | 'result-entry'
  | 'referral'
  | 'ca-colon-tracking'
  | 'map-colon'
  | 'all-list';

interface NavigationProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  pendingKitCount: number;
  positiveCount: number;
  overdueCount?: number;
  isWidescreen16x9?: boolean;
  currentUser?: UserAccount | null;
  totalRegistered?: number;
  totalTested?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  pendingKitCount,
  positiveCount,
  overdueCount = 0,
  isWidescreen16x9 = true,
  currentUser,
  totalRegistered = 0,
  totalTested = 0
}) => {
  const tabs = [
    {
      id: 'dashboard' as TabId,
      step: '1',
      name: 'Dashboard ภาพรวม',
      shortName: 'Dashboard',
      desc: 'Workload & สถิติ 1B0060/1B0061',
      icon: LayoutDashboard,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'registration' as TabId,
      step: '2',
      name: 'ลงทะเบียนกลุ่มเป้าหมาย',
      shortName: 'ลงทะเบียน',
      desc: 'นำเข้า Excel / บันทึกฟอร์ม',
      icon: UserPlus,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'sticker-print' as TabId,
      step: '3',
      name: 'พิมพ์สติกเกอร์หลอด',
      shortName: 'สติกเกอร์',
      desc: 'ขนาด 7×2.5 cm + บาร์โค้ด QR',
      icon: Printer,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'sample-receive' as TabId,
      step: '4',
      name: 'รับชุดตรวจ & สัญญาณชีพ',
      shortName: 'รับชุดตรวจ',
      desc: 'สแกนรับ / นน. สส. BP อสม.',
      icon: PackageCheck,
      badge: pendingKitCount > 0 ? `${pendingKitCount}` : null,
      badgeColor: 'bg-amber-100 text-amber-800 border border-amber-300'
    },
    {
      id: 'result-entry' as TabId,
      step: '5',
      name: 'บันทึกผลแล็บ FIT Test',
      shortName: 'บันทึกผล',
      desc: 'สแกน HN / แดง เขียว ดำ (1B0060/61)',
      icon: FlaskConical,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'referral' as TabId,
      step: '6',
      name: 'ส่งต่อส่องกล้อง',
      shortName: 'ส่งต่อ',
      desc: 'Positive → รพ.สกลนคร / ใบส่งตัว',
      icon: FileText,
      badge: positiveCount > 0 ? `${positiveCount}` : null,
      badgeColor: 'bg-rose-100 text-rose-700 border border-rose-300'
    },
    {
      id: 'ca-colon-tracking' as TabId,
      step: '7',
      name: 'ติดตาม CA & Map Colon',
      shortName: 'ติดตาม CA & Map',
      desc: 'ส่องกล้อง, ผลชิ้นเนื้อ & แผนที่ GIS',
      icon: Stethoscope,
      badge: overdueCount > 0 ? `${overdueCount} เกินนัด` : (positiveCount > 0 ? `${positiveCount}` : null),
      badgeColor: overdueCount > 0 ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-100 text-amber-800 border border-amber-300'
    },
    {
      id: 'all-list' as TabId,
      step: '8',
      name: 'รายชื่อเวชระเบียนทั้งหมด',
      shortName: 'รายชื่อ',
      desc: 'ตารางข้อมูลครบวงจร & ส่งออก Excel',
      icon: Users,
      badge: totalRegistered > 0 ? `${totalRegistered}` : null,
      badgeColor: 'bg-slate-100 text-slate-700'
    }
  ];

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
    <>
      {/* Desktop & Tablet Left Sidebar Navigation (ย้ายแท็บมาอยู่ข้างซ้าย) */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 bg-white border-r border-slate-200 shadow-2xs z-30 no-print sticky top-0 self-start h-[calc(100vh-60px)] overflow-y-auto scrollbar-thin">
        {/* Sidebar Header Section */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              ขั้นตอนระบบงาน (Workflow)
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              8 ขั้นตอน
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>รพ.โพนนาแก้ว สกลนคร</span>
            <span className="font-mono text-emerald-700 font-bold">สปสช. 60 บ.</span>
          </div>
        </div>

        {/* Tab Item List */}
        <nav className="p-2 space-y-1 flex-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-700 to-teal-800 text-white shadow-sm ring-1 ring-emerald-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                {/* Step number badge / icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Tab Titles */}
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-800'
                    }`}>
                      #{tab.step}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold truncate">
                      {tab.name.replace(/^\d+\.\s*/, '')}
                    </span>
                  </div>
                  <div className={`text-[11px] truncate mt-0.5 ${
                    isActive ? 'text-emerald-100/90' : 'text-slate-400 group-hover:text-slate-500'
                  }`}>
                    {tab.desc}
                  </div>
                </div>

                {/* Badge if present */}
                {tab.badge && (
                  <span
                    className={`ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full shrink-0 shadow-2xs ${
                      isActive ? 'bg-white text-emerald-800 font-extrabold' : tab.badgeColor
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}

                {/* Active arrow indicator */}
                {isActive && (
                  <ChevronRight className="w-4 h-4 text-emerald-200 shrink-0 ml-1" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Widget */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2 mt-auto">
          {/* Quick Progress Box */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span>ความคืบหน้าการตรวจ</span>
              <span className="font-mono font-bold text-emerald-700">
                {totalRegistered > 0 ? `${((totalTested / totalRegistered) * 100).toFixed(0)}%` : '0%'}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${totalRegistered > 0 ? Math.min((totalTested / totalRegistered) * 100, 100) : 0}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>ตรวจแล้ว: <strong className="text-slate-800">{totalTested}</strong> คน</span>
              <span>เป้าหมาย: <strong className="text-slate-800">{totalRegistered}</strong></span>
            </div>
          </div>

          {/* Quick Action: Share Pinning URL to VHV / อสม. */}
          <button
            type="button"
            onClick={handleCopyPublicPinLink}
            title="แชร์ลิงก์ให้ อสม. หรือเจ้าหน้าที่ส่งพิกัดบ้านผู้ป่วย (ไม่ต้อง Login)"
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>ลิงก์แชร์ อสม. ปักหมุดบ้าน</span>
          </button>
        </div>
      </aside>

      {/* Mobile Phone Fixed Bottom Navigation Bar (สำหรับหน้าจอโทรศัพท์มือถือ sm:hidden) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg no-print flex items-center gap-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg flex-shrink-0 min-w-[58px] transition-colors relative ${
                isActive ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-700 scale-110' : 'text-slate-400'}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 px-1 py-0.1 bg-rose-500 text-white text-[9px] font-bold rounded-full min-w-[14px] text-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[9px] truncate max-w-full mt-0.5 ${isActive ? 'font-bold text-emerald-800' : 'font-normal'}`}>
                {tab.shortName}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};

