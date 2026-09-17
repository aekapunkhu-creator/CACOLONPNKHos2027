import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Smartphone, QrCode, Copy, Check, ExternalLink, ShieldCheck, HeartHandshake } from 'lucide-react';

interface AsmQrShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMobileView?: () => void;
}

export const AsmQrShareModal: React.FC<AsmQrShareModalProps> = ({
  isOpen,
  onClose,
  onOpenMobileView
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Generate mobile URL with query parameter ?mode=vhv_vitals
  const vhvUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?mode=vhv_vitals`
    : '';

  useEffect(() => {
    if (!isOpen || !vhvUrl) return;

    QRCode.toDataURL(vhvUrl, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#065f46', // deep emerald
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Failed to generate QR for VHV:', err));
  }, [isOpen, vhvUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && vhvUrl) {
        await navigator.clipboard.writeText(vhvUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (e) {
      console.error('Copy link failed:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-emerald-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <Smartphone className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>สำหรับ อสม. ในพื้นที่</span>
              </div>
              <h3 className="text-base font-bold text-white">
                ลิงก์ & QR Code บันทึกข้อมูลสุขภาพ (ไม่ต้อง Login)
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-emerald-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-center">
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-xs text-emerald-900 text-left space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>ความปลอดภัยและความเป็นส่วนตัว:</span>
            </div>
            <p className="text-emerald-700 leading-relaxed pl-6">
              อสม. สามารถเปิดหน้านี้ผ่านโทรศัพท์มือถือ เพื่อสแกน QR บนสติกเกอร์หลอดตรวจ หรือค้นหาชื่อผู้ป่วย และบันทึกสัญญาณชีพ (ส่วนสูง, น้ำหนัก, รอบเอว, ความดันโลหิต) ได้ทันที <strong>โดยไม่ต้องล็อกอินเข้าระบบ</strong> และไม่สามารถเข้าถึงหน้าผลแล็บหรือการตั้งค่าอื่น ๆ ได้
            </p>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="p-3 bg-white rounded-2xl border-2 border-emerald-400 shadow-md inline-block">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code สำหรับ อสม."
                  className="w-56 h-56 object-contain rounded-lg"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center bg-slate-50 rounded-lg text-slate-400 text-xs">
                  กำลังสร้าง QR Code...
                </div>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-600 mt-2 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              ให้ อสม. เปิดกล้องโทรศัพท์มือถือ หรือ LINE สแกนเพื่อเข้าใช้งาน
            </p>
          </div>

          {/* URL Display & Copy */}
          <div className="space-y-2 text-left">
            <label className="block text-xs font-medium text-slate-700">
              ลิงก์สำหรับส่งเข้ากลุ่ม LINE อสม.
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={vhvUrl}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-600 select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs flex-shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
          {onOpenMobileView && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenMobileView();
              }}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>เปิดดูหน้าจอมือถือ อสม. ทันที</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
