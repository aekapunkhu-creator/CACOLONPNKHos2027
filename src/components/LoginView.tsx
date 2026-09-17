import React, { useState } from 'react';
import { UserAccount } from '../types';
import { authenticateUser } from '../data/users';
import { Hospital, Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, Smartphone } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: UserAccount) => void;
  onOpenVhvMobileMode?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onOpenVhvMobileMode }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg('กรุณากรอกชื่อผู้ใช้งานและรหัสผ่านให้ครบถ้วน');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const user = authenticateUser(username, password);
      setIsLoading(false);

      if (user) {
        onLoginSuccess(user);
      } else {
        setErrorMsg('ชื่อผู้ใช้งาน (Username) หรือรหัสผ่าน (Password) ไม่ถูกต้อง');
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background visual accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100/20 overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6 sm:p-8 text-center relative">
          <div className="w-16 h-16 sm:w-18 sm:h-18 mx-auto rounded-2xl bg-white/10 backdrop-blur-md p-2 flex items-center justify-center border border-white/20 shadow-inner mb-3">
            <Hospital className="w-10 h-10 text-emerald-300" />
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            หน่วยบริการ โรงพยาบาลโพนนาแก้ว จ.สกลนคร
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            เข้าสู่ระบบคัดกรองมะเร็งลำไส้ใหญ่
          </h2>
          <p className="text-xs text-emerald-100/80 mt-1">
            FIT Test Screening Management System
          </p>
        </div>

        {/* Login Form: Strictly Username & Password Inputs (ไม่มีการกดเลือกรหัส) */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              ชื่อผู้ใช้งาน (Username) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="กรอก Username (เช่น admin หรือ pcu01)"
                autoCapitalize="none"
                autoCorrect="off"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm bg-slate-50/50"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              รหัสผ่าน (Password) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="กรอกรหัสผ่าน"
                required
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm bg-slate-50/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <span>กำลังตรวจสอบข้อมูล...</span>
            ) : (
              <span>เข้าสู่ระบบ (Login)</span>
            )}
          </button>

          {/* VHV Direct Mobile Link without Login */}
          {onOpenVhvMobileMode && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenVhvMobileMode}
                className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>สำหรับ อสม. บันทึกข้อมูลสุขภาพผ่านมือถือ (ไม่ต้อง Login)</span>
              </button>
            </div>
          )}

          {/* Hospital System Footnote */}
          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
            ระบบสารสนเทศคัดกรองมะเร็งลำไส้ใหญ่ โรงพยาบาลโพนนาแก้ว
            <div className="text-[11px] text-slate-400 mt-0.5">
              ติดต่อสอบถามสิทธิ์การใช้งานได้ที่กลุ่มงานเทคโนโลยีสารสนเทศ
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
