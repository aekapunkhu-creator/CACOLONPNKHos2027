import React from 'react';
import { Activity, Hospital, Calendar, RotateCcw, Cloud, User, LogOut, Trash2 } from 'lucide-react';
import { UserAccount } from '../types';

interface HeaderProps {
  onResetData: () => void;
  onClearAllPatients?: () => void;
  totalRegistered: number;
  totalTested: number;
  isCloudConnected: boolean;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onResetData,
  onClearAllPatients,
  totalRegistered,
  totalTested,
  isCloudConnected,
  currentUser,
  onLogout
}) => {
  const today = new Date();
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const thaiDate = `${today.getDate()} ${thaiMonths[today.getMonth()]} ${today.getFullYear() + 543}`;

  return (
    <header className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 text-white shadow-md border-b border-emerald-900/40 no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="py-2.5 sm:py-3 flex items-center justify-between gap-2">
          
          {/* Logo & Hospital Title */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/10 backdrop-blur-md p-1.5 flex items-center justify-center border border-white/20 shadow-inner flex-shrink-0">
              <Hospital className="w-6 h-6 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] sm:text-[11px] font-semibold px-2 py-0.2 rounded-full whitespace-nowrap">
                  รพ.โพนนาแก้ว จ.สกลนคร
                </span>
                
                {/* Firebase Cloud Sync Badge */}
                <span className="inline-flex items-center gap-1 bg-cyan-950/60 border border-cyan-400/40 text-cyan-200 text-[10px] px-2 py-0.2 rounded-full font-medium shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                  <Cloud className="w-3 h-3 text-cyan-300" />
                  <span className="hidden sm:inline">Firebase Cloud</span> ซิงค์สด
                </span>
              </div>

              <h1 className="text-sm sm:text-lg font-bold tracking-tight text-white truncate mt-0.5">
                คัดกรองมะเร็งลำไส้ใหญ่ (FIT Test)
              </h1>
            </div>
          </div>

          {/* User Profile & Quick Stats */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            <div className="hidden lg:flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-700/50 rounded-xl px-2.5 py-1 text-xs text-emerald-200">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{thaiDate}</span>
            </div>

            <div className="hidden sm:flex items-center gap-1 bg-white/10 border border-white/15 rounded-lg sm:rounded-xl px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs">
              <Activity className="w-3.5 h-3.5 text-cyan-300" />
              <span>ตรวจ: <strong className="text-emerald-300 font-bold">{totalTested}</strong>/{totalRegistered}</span>
            </div>

            {/* Current Logged In User Pill */}
            {currentUser && (
              <div className="flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-xl px-2.5 py-1 text-xs">
                <div className="w-5 h-5 rounded-full bg-emerald-500/80 flex items-center justify-center text-white">
                  <User className="w-3 h-3" />
                </div>
                <div className="text-left leading-tight hidden sm:block">
                  <div className="font-semibold text-white truncate max-w-[120px]">{currentUser.name}</div>
                  <div className="text-[10px] text-emerald-200">{currentUser.roleTitle}</div>
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="ออกจากระบบ"
                    className="ml-1 p-1 hover:bg-white/20 text-slate-200 hover:text-white rounded-lg transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-300" />
                  </button>
                )}
              </div>
            )}

            {/* Admin Database Tools */}
            {currentUser?.role === 'admin' && (
              <div className="flex items-center gap-1">
                {onClearAllPatients && (
                  <button
                    onClick={onClearAllPatients}
                    title="ลบข้อมูลผู้ป่วยทั้งหมดเพื่อเตรียมนำเข้าใหม่ (ล้าง Firestore)"
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-rose-200 hover:text-white bg-rose-500/20 hover:bg-rose-600/40 border border-rose-400/30 rounded-lg sm:rounded-xl transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                    <span className="hidden xl:inline">ล้างข้อมูลผู้ป่วย</span>
                  </button>
                )}
                <button
                  onClick={onResetData}
                  title="รีเซ็ตเป็นข้อมูลตัวอย่างเริ่มต้นบน Firebase"
                  className="flex items-center gap-1 p-1.5 sm:px-2 sm:py-1 text-[11px] font-medium text-slate-200 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 rounded-lg sm:rounded-xl transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">รีเซ็ต DB ตัวอย่าง</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
