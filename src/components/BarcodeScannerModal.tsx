import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, RefreshCw, AlertCircle, Sparkles, Search } from 'lucide-react';
import { PatientScreening } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (hn: string) => void;
  title?: string;
  description?: string;
  patients?: PatientScreening[];
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'สแกน Barcode / QR Code',
  description = 'หันกล้องไปที่บาร์โค้ดหรือคิวอาร์โค้ด HN ผู้ป่วย',
  patients = []
}) => {
  const [manualHn, setManualHn] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'barcode-qr-reader-container';

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    let isMounted = true;

    const startScanner = async () => {
      setCameraError(null);
      try {
        // Wait for DOM to render the container
        await new Promise(resolve => setTimeout(resolve, 300));
        const element = document.getElementById(readerElementId);
        if (!element || !isMounted) return;

        // Formats to support both 1D hospital barcodes and 2D QR codes
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A
        ];

        const html5QrCode = new Html5Qrcode(readerElementId, {
          formatsToSupport,
          verbose: false
        });
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.333
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            handleCodeFound(decodedText);
          },
          () => {
            // Ignore scan attempt errors (continuous scanning)
          }
        );

        if (isMounted) {
          setIsCameraActive(true);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('Camera start issue:', err);
          setCameraError('ไม่สามารถเปิดกล้องได้ (โปรดตรวจสอบการอนุญาตใช้งานกล้อง หรือใช้การพิมพ์/เลือก HN ด้านล่าง)');
          setIsCameraActive(false);
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        // cleanup ignore
      }
      scannerRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleCodeFound = (code: string) => {
    // Clean up code - could be HN directly "67-00101" or URL or JSON
    let cleaned = code.trim();
    if (cleaned.includes('hn=')) {
      const match = cleaned.match(/hn=([^&]+)/i);
      if (match) cleaned = match[1];
    } else if (cleaned.startsWith('{') && cleaned.includes('hn')) {
      try {
        const parsed = JSON.parse(cleaned);
        if (parsed.hn) cleaned = parsed.hn;
      } catch (e) {
        // ignore
      }
    }

    // Play quick tone if possible
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.1;
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio not permitted
    }

    stopCamera();
    onScanSuccess(cleaned);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualHn.trim()) {
      stopCamera();
      onScanSuccess(manualHn.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Camera className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-xs text-emerald-100">{description}</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Camera Viewport */}
          <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-300 min-h-[260px] flex flex-col items-center justify-center text-white">
            <div id={readerElementId} className="w-full h-full"></div>

            {/* Overlay framing lines */}
            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-64 h-36 border-2 border-dashed border-emerald-400 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.5)] relative">
                  <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-red-500/70 animate-pulse"></div>
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs bg-slate-900/80 text-emerald-300 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    นำ Barcode หรือ QR Code ของ HN ให้อยู่ในกรอบ
                  </span>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="p-4 text-center max-w-sm">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-slate-300 mb-3">{cameraError}</p>
                <p className="text-xs text-emerald-300 font-medium">คุณสามารถค้นหา HN หรือกดเลือกผู้ป่วยจำลองด้านล่างได้ทันที</p>
              </div>
            )}
          </div>

          {/* Manual HN Input Option */}
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              หรือพิมพ์ค้นหาเลข HN / สแกนผ่านเครื่องอ่านบาร์โค้ด USB:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={manualHn}
                  onChange={(e) => setManualHn(e.target.value)}
                  placeholder="เช่น 67-00101 หรือ 3470500..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  autoFocus
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <button
                type="submit"
                disabled={!manualHn.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                เลือกผู้ป่วย
              </button>
            </div>
          </form>

          {/* Quick Click for Demo Patients */}
          {patients && patients.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  คลิกเลือก HN ทดสอบด่วน (Simulation):
                </span>
                <span className="text-[11px] text-slate-400">คลิกเพื่อจำลองการสแกน</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                {(patients || []).slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleCodeFound(p.hn)}
                    className="text-left p-2 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-xs group"
                  >
                    <div className="font-semibold text-slate-800 group-hover:text-emerald-700">
                      HN: {p.hn}
                    </div>
                    <div className="text-slate-500 truncate text-[11px]">
                      {p.prefix}{p.firstName} {p.lastName}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ม.{p.villageNo} {p.villageName}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};
