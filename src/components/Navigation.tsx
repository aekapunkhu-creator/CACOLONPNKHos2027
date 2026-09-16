import React from 'react';
import { 
  LayoutDashboard, 
  UserPlus, 
  PackageCheck, 
  FlaskConical, 
  FileText, 
  Users,
  Printer
} from 'lucide-react';

export type TabId = 
  | 'dashboard'
  | 'registration'
  | 'sticker-print'
  | 'sample-receive'
  | 'result-entry'
  | 'referral'
  | 'all-list';

interface NavigationProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  pendingKitCount: number;
  positiveCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  pendingKitCount,
  positiveCount
}) => {
  const tabs = [
    {
      id: 'dashboard' as TabId,
      name: '1. Dashboard',
      shortName: 'Dashboard',
      desc: 'Workload & สถิติ 1B0060/1B0061',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'registration' as TabId,
      name: '2. ลงทะเบียน',
      shortName: 'ลงทะเบียน',
      desc: 'นำเข้า Excel / Template / ฟอร์ม',
      icon: UserPlus,
      badge: null
    },
    {
      id: 'sticker-print' as TabId,
      name: '3. พิมพ์สติกเกอร์',
      shortName: 'สติกเกอร์',
      desc: 'ขนาด 7×2.5 cm + QR',
      icon: Printer,
      badge: null
    },
    {
      id: 'sample-receive' as TabId,
      name: '4. รับชุดตรวจ',
      shortName: 'รับชุดตรวจ',
      desc: 'สแกนรับ / นน. สส. เอว BP',
      icon: PackageCheck,
      badge: pendingKitCount > 0 ? `${pendingKitCount}` : null,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'result-entry' as TabId,
      name: '5. บันทึกผล FIT',
      shortName: 'บันทึกผล',
      desc: 'สแกน HN / แดง เขียว ดำ',
      icon: FlaskConical,
      badge: null
    },
    {
      id: 'referral' as TabId,
      name: '6. ส่งต่อส่องกล้อง',
      shortName: 'ส่งต่อ',
      desc: 'Positive → รพ.สกลนคร',
      icon: FileText,
      badge: positiveCount > 0 ? `${positiveCount}` : null,
      badgeColor: 'bg-rose-100 text-rose-700'
    },
    {
      id: 'all-list' as TabId,
      name: '7. รายชื่อทั้งหมด',
      shortName: 'รายชื่อ',
      desc: 'ตารางข้อมูลครบ & ส่งออก Excel',
      icon: Users,
      badge: null
    }
  ];

  return (
    <>
      {/* Top Desktop & Tablet Navigation */}
      <nav className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs ring-1 ring-emerald-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-emerald-100' : 'text-slate-400'}`} />
                  <div className="text-left leading-tight">
                    <div className="font-semibold">{tab.name}</div>
                    <div className={`text-[10px] hidden lg:block ${isActive ? 'text-emerald-200' : 'text-slate-400'}`}>
                      {tab.desc}
                    </div>
                  </div>

                  {tab.badge && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                        isActive ? 'bg-white text-emerald-800' : tab.badgeColor
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Phone Fixed Bottom Navigation Bar (สำหรับหน้าจอโทรศัพท์มือถือ) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1 shadow-lg no-print flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-lg flex-1 min-w-0 transition-colors relative ${
                isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
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
