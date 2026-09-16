import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { PatientScreening } from '../types';

/**
 * Dimensions for sticker:
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
    width: 260,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
}

/**
 * Render a patient's sticker on an HTML5 canvas at 300 DPI
 * Includes:
 * 1. QR Code generated from HN
 * 2. Full Name (คำนำหน้า ชื่อ นามสกุล)
 * 3. HN (ชัดเจน ตัวหนา)
 * 4. ที่อยู่ บ้านเลขที่ หมู่ที่ (ตำบล/หมู่บ้าน)
 * 5. Hospital Header & Age/Sex for healthcare identification
 */
export async function renderStickerToCanvas(patient: PatientScreening): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH_PX;
  canvas.height = CANVAS_HEIGHT_PX;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context is not available');
  }

  // 1. Background (White)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, CANVAS_WIDTH_PX, CANVAS_HEIGHT_PX);

  // 2. Subtle outer border guide (light gray for laser cutter/scissors guide)
  ctx.strokeStyle = '#D1D5DB';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, CANVAS_WIDTH_PX - 2, CANVAS_HEIGHT_PX - 2);

  // 3. Generate & Draw QR Code on Left
  // QR box size: 245 x 245 px (approx 20.8 mm x 20.8 mm)
  const qrDataUrl = await generateHnQrCodeDataUrl(patient.hn);
  const qrImg = new Image();
  await new Promise<void>((resolve, reject) => {
    qrImg.onload = () => resolve();
    qrImg.onerror = reject;
    qrImg.src = qrDataUrl;
  });

  const qrSize = 255;
  const qrX = 20;
  const qrY = (CANVAS_HEIGHT_PX - qrSize) / 2;
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // Vertical separator hairline
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(qrX + qrSize + 15, 18);
  ctx.lineTo(qrX + qrSize + 15, CANVAS_HEIGHT_PX - 18);
  ctx.stroke();

  // 4. Draw Patient Text Data on Right
  const textX = qrX + qrSize + 30;
  let currentY = 48;

  // Header: Hospital and Screening Program
  ctx.fillStyle = '#047857'; // Deep emerald
  ctx.font = 'bold 26px "Prompt", "Sarabun", sans-serif';
  ctx.fillText('รพ.โพนนาแก้ว • FIT Test มะเร็งลำไส้ใหญ่', textX, currentY);

  // Row 2: HN (Very prominent) + Age/Gender
  currentY += 56;
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 50px "Prompt", "Sarabun", sans-serif';
  const hnLabel = `HN: ${patient.hn}`;
  ctx.fillText(hnLabel, textX, currentY);

  // Age & Gender badge beside HN
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 30px "Prompt", "Sarabun", sans-serif';
  const ageGender = `[อายุ ${patient.ageYears} ปี (${patient.gender})]`;
  const hnMetrics = ctx.measureText(hnLabel);
  ctx.fillText(ageGender, textX + hnMetrics.width + 20, currentY - 5);

  // Row 3: Full Name (ชื่อ-สกุล)
  currentY += 56;
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 44px "Prompt", "Sarabun", sans-serif';
  const fullName = `${patient.prefix}${patient.firstName} ${patient.lastName}`;
  ctx.fillText(fullName, textX, currentY);

  // Row 4: Address (ที่อยู่ บ้านเลขที่ หมู่ที่)
  currentY += 46;
  ctx.fillStyle = '#1F2937';
  ctx.font = 'bold 30px "Prompt", "Sarabun", sans-serif';
  
  let addressText = `บ้านเลขที่ ${patient.houseNo} หมู่ที่ ${patient.villageNo}`;
  if (patient.villageName) {
    addressText += ` (${patient.villageName})`;
  }
  if (patient.subdistrict) {
    addressText += ` ต.${patient.subdistrict}`;
  }
  ctx.fillText(addressText, textX, currentY);

  // Row 5: CID / Mini footer info
  currentY += 38;
  ctx.fillStyle = '#6B7280';
  ctx.font = 'normal 24px "Prompt", "Sarabun", sans-serif';
  const cidText = `เลขบัตร: ${patient.idCard.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5')} • สิทธิ: ${patient.benefitName || 'บัตรทอง'}`;
  ctx.fillText(cidText, textX, currentY);

  return canvas;
}

/**
 * Export Stickers to PDF:
 * Mode 'roll': Each page is exactly 70 mm x 25 mm (for barcode / thermal label printers)
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

  if (mode === 'roll') {
    // 70 mm x 25 mm landscape label
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
      doc.addImage(imgData, 'PNG', 0, 0, STICKER_WIDTH_MM, STICKER_HEIGHT_MM);

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
    // A4 width = 210mm. 2 columns of 70mm = 140mm.
    // Margin Left/Right = (210 - (70 * 2) - 10) / 2 = 30mm. Column Gap = 10mm.
    // A4 height = 297mm. 10 rows of 25mm = 250mm.
    // Margin Top = 12mm. Row Gap = 3.5mm.
    const marginLeft = 30;
    const colGap = 10;
    const marginTop = 12;
    const rowGap = 3.5;
    const labelsPerPage = 20;

    for (let i = 0; i < patients.length; i++) {
      const pageIndex = Math.floor(i / labelsPerPage);
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
      doc.addImage(imgData, 'PNG', x, y, STICKER_WIDTH_MM, STICKER_HEIGHT_MM);

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
