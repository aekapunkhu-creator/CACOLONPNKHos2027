import React, { useState } from 'react';
import { PatientScreening, UserAccount } from '../types';
import { Trash2, AlertTriangle, X, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';

interface DeletePatientConfirmModalProps {
  patient: PatientScreening | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (patientId: string) => Promise<void> | void;
  currentUser?: UserAccount | null;
}

export const DeletePatientConfirmModal: React.FC<DeletePatientConfirmModalProps> = ({
  patient,
  isOpen,
  onClose,
  onConfirmDelete,
  currentUser
}) => {
  if (!isOpen || !patient) return null;

  const isAdmin = currentUser?.role === 'admin';
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setAuthError(null);

    // If not admin, require admin password verification (admin123)
    if (!isAdmin) {
      if (adminPassword.trim() !== 'admin123') {
        setAuthError('รหัสผ่านผู้ดูแลระบบ (Admin) ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        return;
      }
    }

    setIsDeleting(true);
    try {
      await onConfirmDelete(patient.id);
      onClose();
    } catch (err: any) {
      setAuthError('เกิดข้อผิดพลาดในการลบ: ' + (err?.message || err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 no-print animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-rose-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-700 to-red-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Trash2 className="w-5 h-5 text-rose-200" />
            </div>
            <div>
              <div className="text-xs font-semibold px-2 py-0.2 rounded-full bg-rose-500/30 text-rose-100 border border-rose-400/30 inline-block">
                ยืนยันการลบข้อมูลผู้ป่วย (Admin Delete)
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                ลบข้อมูลผู้รับการตรวจ
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 space-y-1">
              <p className="font-bold">คำเตือน: การลบนี้จะมีผลถาวร</p>
              <p className="text-rose-700">
                ข้อมูลของผู้ป่วยรายนี้จะถูกลบออกจากฐานข้อมูล Cloud Firebase และมีผลกับทุกเครื่องที่เชื่อมต่อทันที
              </p>
            </div>
          </div>

          {/* Patient Card Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                HN: {patient.hn}
              </span>
              <span className="text-slate-500">
                อายุ {patient.ageYears} ปี ({patient.gender})
              </span>
            </div>

            <div className="font-bold text-slate-800 text-sm">
              {patient.prefix}{patient.firstName} {patient.lastName}
            </div>

            <div className="text-slate-600 text-[11px]">
              ที่อยู่: บ้านเลขที่ {patient.houseNo || '-'} หมู่ {patient.villageNo} {patient.villageName} ต.{patient.subdistrict || 'โพนนาแก้ว'}
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-200 text-[11px]">
              <span>ผลตรวจ FIT Test:</span>
              {patient.fitResult === 'positive' && (
                <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                  ผลบวก (1B0061)
                </span>
              )}
              {patient.fitResult === 'negative' && (
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  ผลลบ (1B0060)
                </span>
              )}
              {patient.fitResult === 'inconclusive' && (
                <span className="font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                  ออกผลไม่ได้
                </span>
              )}
              {patient.fitResult === 'pending' && (
                <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  รอตรวจ
                </span>
              )}
            </div>
          </div>

          {/* Admin Verification if not logged in as admin */}
          {!isAdmin && (
            <div className="space-y-1.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <label className="block text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                ยืนยันรหัสผ่านผู้ดูแลระบบ (Admin Password)
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  if (authError) setAuthError(null);
                }}
                placeholder="กรอกรหัสผ่าน admin (admin123)"
                className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[10px] text-amber-700">
                คุณกำลังใช้งานในฐานะ {currentUser?.name || 'ผู้ใช้ทั่วไป'} กรุณากรอกรหัสผ่าน Admin เพื่อยืนยันการลบ
              </p>
            </div>
          )}

          {authError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
              {authError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'กำลังลบ...' : 'ยืนยันการลบ (Delete)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
