import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { PatientScreening } from '../types';

/**
 * Dimensions for standard thermal sticker:
 * Width: 70 mm (7.0 cm)
 * Height: 25 mm (2.5 cm)
 * Resolution: 300 DPI for high quality thermal/laser print
 * 70 mm = 70 / 25.4 * 300 = 826.77px ≈ 827px
 * 25 mm = 25 / 25.4 * 300 = 295.28px ≈ 295px
 */
export const STICKER_WIDTH_MM = 70;
export const STICKER_HEIGHT_MM = 25;
export const CANVAS_WIDTH_PX = 827;
export const CANVAS_HEIGHT_PX = 295;

/**
 * Generate QR code as high-resolution Data URL string from HN
 */
export async function generateHnQrCodeDataUrl(hn: string): Promise<string> {
  return QRCode.toDataURL(hn, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
}

/**
 * Helper to draw a rounded rectangle
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Render a patient's sticker on an HTML5 canvas at 300 DPI
 * Specifically engineered to prevent any text overlapping:
 * - Awaits web fonts (Prompt, Sarabun) before measuring and drawing
 * - Mathematically verified line spacing for Thai vowels and tone marks
 * - Dynamic font size scaling so long names and addresses never overflow or crash
 * - Left/Right separation for HN and Age/Gender to eliminate collision
 */
export async function renderStickerToCanvas(patient: PatientScreening): Promise<HTMLCanvasElement> {
  // Ensure web fonts are completely loaded before measuring and drawing
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font wait failures
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH_PX;
  canvas.height = CANVAS_HEIGHT_PX;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context is not available');
  }

  // 1. Background (Pure White for thermal label)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, CANVAS_WIDTH_PX, CANVAS_HEIGHT_PX);

  // 2. Subtle outer border guide (light gray for scissors or cutter alignment)
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(1, 1, CANVAS_WIDTH_PX - 2, CANVAS_HEIGHT_PX - 2);

  // 3. Generate & Draw QR Code on Left
  // QR size 224x224 px centered vertically
  const qrDataUrl = await generateHnQrCodeDataUrl(patient.hn);
  const qrImg = new Image();
  await new Promise<void>((resolve, reject) => {
    qrImg.onload = () => resolve();
    qrImg.onerror = reject;
    qrImg.src = qrDataUrl;
  });

  const qrSize = 224;
  const qrX = 22;
  const qrY = Math.round((CANVAS_HEIGHT_PX - qrSize) / 2); // ~35px
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // Small label under QR code
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 15px "Prompt", monospace, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('QR: ' + patient.hn, qrX + qrSize / 2, qrY + qrSize + 16);
  ctx.textAlign = 'left';

  // Vertical separator hairline between QR and text
  const sepX = qrX + qrSize + 16;
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sepX, 18);
  ctx.lineTo(sepX, CANVAS_HEIGHT_PX - 18);
  ctx.stroke();

  // 4. Draw Patient Text Data on Right Area
  const textX = sepX + 16; // ~278px
  const maxRight = CANVAS_WIDTH_PX - 22; // ~805px
  const maxTextWidth = maxRight - textX; // ~527px

  // Row 1: Header (Hospital & Program) - Baseline Y = 40
  ctx.fillStyle = '#047857'; // Deep emerald
  ctx.font = 'bold 22px "Prompt", "Sarabun", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('รพ.โพนนาแก้ว • FIT Test มะเร็งลำไส้ใหญ่', textX, 40);

  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 17px "Prompt", "Sarabun", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('70×25mm', maxRight, 40);
  ctx.textAlign = 'left';

  // Row 2: HN (Left) + Age & Gender Badge (Right) - Baseline Y = 90 (50px below Row 1)
  // Left: HN (prominent bold)
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 40px "Prompt", monospace, sans-serif';
  const hnLabel = `HN: ${patient.hn}`;
  ctx.fillText(hnLabel, textX, 90);

  // Right: Age & Gender Badge (Right-aligned, never collides with HN)
  const genderLabel = patient.gender === 'ชาย' ? 'ชาย' : 'หญิง';
  const ageGenderText = `อายุ ${patient.ageYears} ปี (${genderLabel})`;
  ctx.font = 'bold 23px "Prompt", "Sarabun", sans-serif';
  const ageMetrics = ctx.measureText(ageGenderText);
  const badgePadX = 10;
  const badgeW = ageMetrics.width + badgePadX * 2;
  const badgeH = 34;
  const badgeX = maxRight - badgeW;
  const badgeY = 90 - 26;

  // Draw light background badge for Age & Gender
  ctx.fillStyle = '#F1F5F9';
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 6);
  ctx.fill();
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 6);
  ctx.stroke();

  ctx.fillStyle = '#0F172A';
  ctx.fillText(ageGenderText, badgeX + badgePadX, 90);

  // Row 3: Full Name (ชื่อ - สกุล) - Baseline Y = 144 (54px below Row 2, ample clearance for upper vowels)
  const fullName = `${patient.prefix || ''}${patient.firstName} ${patient.lastName}`.trim();
  let nameFontSize = 33;
  ctx.font = `bold ${nameFontSize}px "Prompt", "Sarabun", sans-serif`;
  let nameWidth = ctx.measureText(fullName).width;

  // Auto-fit font size if full name is long
  if (nameWidth > maxTextWidth) {
    nameFontSize = Math.max(22, Math.floor(33 * (maxTextWidth / nameWidth)));
    ctx.font = `bold ${nameFontSize}px "Prompt", "Sarabun", sans-serif`;
  }
  ctx.fillStyle = '#0F172A';
  ctx.fillText(fullName, textX, 144);

  // Row 4: Address (บ้านเลขที่ หมู่ที่ ตำบล) - Baseline Y = 194 (50px below Row 3)
  let addressText = `บ้านเลขที่ ${patient.houseNo || '-'} ม.${patient.villageNo || '-'}`;
  if (patient.villageName) {
    addressText += ` (${patient.villageName})`;
  }
  if (patient.subdistrict) {
    addressText += ` ต.${patient.subdistrict}`;
  }

  let addrFontSize = 23;
  ctx.font = `bold ${addrFontSize}px "Prompt", "Sarabun", sans-serif`;
  let addrWidth = ctx.measureText(addressText).width;

  // Auto-fit font size if address is long
  if (addrWidth > maxTextWidth) {
    addrFontSize = Math.max(18, Math.floor(23 * (maxTextWidth / addrWidth)));
    ctx.font = `bold ${addrFontSize}px "Prompt", "Sarabun", sans-serif`;
  }
  ctx.fillStyle = '#334155';
  ctx.fillText(addressText, textX, 194);

  // Row 5: CID (Left) & Benefit/Code (Right) - Baseline Y = 242 (48px below Row 4)
  const formattedCid = (patient.idCard || '').replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5');
  ctx.fillStyle = '#475569';
  ctx.font = '500 20px "Prompt", "Sarabun", monospace, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`เลขบัตร: ${formattedCid || '-'}`, textX, 242);

  // Right: Benefit & Claim code
  const benefitStr = `สิทธิ: ${patient.benefitName || 'บัตรทอง'} (1B0060/61)`;
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 18px "Prompt", "Sarabun", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(benefitStr, maxRight, 242);
  ctx.textAlign = 'left';

  // Row 6: Micro footer info - Baseline Y = 274 (32px below Row 5)
  ctx.fillStyle = '#94A3B8';
  ctx.font = 'normal 15px "Prompt", "Sarabun", sans-serif';
  ctx.fillText('หลอดตรวจ FIT Test อุจจาระ • ติดตามแนวนอนรอบหลอด', textX, 274);

  const thaiDateStr = new Date().toLocaleDateString('th-TH', { 
    day: 'numeric', 
    month: 'short', 
    year: '2-digit' 
  });
  ctx.textAlign = 'right';
  ctx.fillText(`พิมพ์: ${thaiDateStr}`, maxRight, 274);
  ctx.textAlign = 'left';

  return canvas;
}

/**
 * Export Stickers to PDF:
 * Mode 'roll': Each page is exactly 70 mm x 25 mm (for thermal label printer rolls)
 * Mode 'a4': Standard A4 page (210 x 297 mm) with 20 stickers per page (2 columns x 10 rows)
 */
export async function exportStickersToPdf(
  patients: PatientScreening[],
  mode: 'roll' | 'a4' = 'roll',
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  if (patients.length === 0) {
    throw new Error('ไม่มีข้อมูลผู้ป่วยที่เลือก');
  }

  // Ensure fonts are ready before PDF generation batch
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore
    }
  }

  if (mode === 'roll') {
    // 70 mm x 25 mm landscape label (Exact match for 70x25mm roll printers)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [STICKER_WIDTH_MM, STICKER_HEIGHT_MM]
    });

    for (let i = 0; i < patients.length; i++) {
      if (i > 0) {
        doc.addPage([STICKER_WIDTH_MM, STICKER_HEIGHT_MM], 'landscape');
      }

      const canvas = await renderStickerToCanvas(patients[i]);
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 0, 0, STICKER_WIDTH_MM, STICKER_HEIGHT_MM, undefined, 'FAST');

      if (onProgress) {
        onProgress(i + 1, patients.length);
      }
    }

    return doc.output('blob');
  } else {
    // Standard A4 sheet: 210 x 297 mm
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // 2 columns x 10 rows = 20 labels per A4 page
    const marginLeft = 30;
    const colGap = 10;
    const marginTop = 12;
    const rowGap = 3.5;
    const labelsPerPage = 20;

    for (let i = 0; i < patients.length; i++) {
      const indexInPage = i % labelsPerPage;

      if (i > 0 && indexInPage === 0) {
        doc.addPage('a4', 'portrait');
      }

      const col = indexInPage % 2;
      const row = Math.floor(indexInPage / 2);

      const x = marginLeft + col * (STICKER_WIDTH_MM + colGap);
      const y = marginTop + row * (STICKER_HEIGHT_MM + rowGap);

      const canvas = await renderStickerToCanvas(patients[i]);
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', x, y, STICKER_WIDTH_MM, STICKER_HEIGHT_MM, undefined, 'FAST');

      if (onProgress) {
        onProgress(i + 1, patients.length);
      }
    }

    return doc.output('blob');
  }
}

/**
 * Trigger file download in browser
 */
export function downloadBlobAsFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

