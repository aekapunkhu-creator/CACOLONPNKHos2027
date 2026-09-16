import React from 'react';
import { PatientScreening } from '../types';

interface ReferralPrintDocumentProps {
  patients: PatientScreening[];
}

export const ReferralPrintDocument: React.FC<ReferralPrintDocumentProps> = ({ patients }) => {
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const formatThaiDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${d.getDate()} ${thaiMonths[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
    } catch {
      return dateStr;
    }
  };

  const todayStr = formatThaiDate(new Date().toISOString());

  return (
    <div className="print-only hidden font-sarabun text-slate-900 bg-white">
      {patients.map((p, index) => {
        const ref = p.referral;
        const bp = (p.bloodPressureSys && p.bloodPressureDia) ? `${p.bloodPressureSys}/${p.bloodPressureDia} mmHg` : 'ไม่ระบุ';
        const waist = p.waistInch ? `${p.waistInch} นิ้ว` : (p.waistCm ? `${p.waistCm} ซม.` : '-');

        return (
          <div 
            key={p.id} 
            className={`p-10 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col justify-between text-black bg-white ${
              index < patients.length - 1 ? 'page-break' : ''
            }`}
            style={{ fontSize: '15px', lineHeight: '1.6' }}
          >
            {/* Header / Hospital Crest */}
            <div>
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4">
                <div className="w-16 h-16 flex items-center justify-center border-2 border-slate-800 rounded-full text-xs font-bold text-center p-1">
                  ตรา รพ.
                </div>
                <div className="text-center flex-1">
                  <h2 className="text-2xl font-bold text-black">ใบส่งต่อผู้ป่วยเพื่อการรักษา / ส่องกล้องตรวจ (Referral Form)</h2>
                  <h3 className="text-lg font-semibold text-slate-800">โรงพยาบาลโพนนาแก้ว สำนักงานสาธารณสุขจังหวัดสกลนคร</h3>
                  <p className="text-xs text-slate-600">อ.โพนนาแก้ว จ.สกลนคร 47230 • โทรศัพท์ 042-759001-2</p>
                </div>
                <div className="text-right text-xs">
                  <div className="font-mono font-bold text-sm">เลขที่: {ref?.referralNo || `PNK-REF-2569-${String(index + 1).padStart(3, '0')}`}</div>
                  <div>วันที่ออกใบส่งต่อ: {todayStr}</div>
                </div>
              </div>

              {/* Destination */}
              <div className="mb-4 bg-slate-100 p-3 rounded border border-slate-300">
                <div className="font-bold text-base">
                  เรียน: ผู้อำนวยการโรงพยาบาลสกลนคร / หัวหน้าศูนย์ส่องกล้องระบบทางเดินอาหาร
                </div>
                <div className="text-sm text-slate-800 mt-0.5">
                  สถานที่ส่งต่อ: <strong>{ref?.destinationHospital || 'โรงพยาบาลสกลนคร'}</strong> ({ref?.department || 'ศูนย์ส่องกล้องระบบทางเดินอาหาร'})
                </div>
              </div>

              {/* Patient Info */}
              <div className="border border-slate-400 rounded p-4 mb-4 space-y-2 text-sm">
                <div className="font-bold text-base text-slate-900 border-b border-slate-300 pb-1">
                  ข้อมูลผู้ป่วย
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div><strong>HN:</strong> <span className="font-mono">{p.hn}</span></div>
                  <div><strong>เลขประจำตัวประชาชน:</strong> <span className="font-mono">{p.idCard}</span></div>
                  <div><strong>สิทธิการรักษา:</strong> {p.benefitName} ({p.benefitCode})</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div><strong>ชื่อ-สกุล:</strong> {p.prefix}{p.firstName} {p.lastName}</div>
                  <div><strong>เพศ:</strong> {p.gender}</div>
                  <div><strong>อายุ:</strong> {p.ageYears} ปี {p.ageMonths > 0 ? `${p.ageMonths} เดือน` : ''}</div>
                </div>
                <div>
                  <strong>ที่อยู่ตามทะเบียน:</strong> บ้านเลขที่ {p.houseNo} หมู่ {p.villageNo} {p.villageName} ตำบล{p.subdistrict || 'โพนนาแก้ว'} อำเภอโพนนาแก้ว จังหวัดสกลนคร
                </div>
                <div>
                  <strong>โรคประจำตัว:</strong> {p.underlyingDisease || 'ไม่มี'}
                </div>
              </div>

              {/* Vitals & Screening Result */}
              <div className="border border-slate-400 rounded p-4 mb-4 space-y-2 text-sm">
                <div className="font-bold text-base text-slate-900 border-b border-slate-300 pb-1">
                  ผลการตรวจคัดกรองมะเร็งลำไส้ใหญ่และลำไส้ตรง (FIT Test) & สัญญาณชีพ
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div><strong>ส่วนสูง:</strong> {p.heightCm ? `${p.heightCm} ซม.` : '-'}</div>
                  <div><strong>น้ำหนัก:</strong> {p.weightKg ? `${p.weightKg} กก.` : '-'}</div>
                  <div><strong>รอบเอว:</strong> {waist}</div>
                  <div><strong>BMI:</strong> {p.bmi || '-'} kg/m²</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>ความดันโลหิต (BP):</strong> {bp}</div>
                  <div><strong>วันที่ตรวจ FIT Test:</strong> {p.testedDate || todayStr}</div>
                </div>
                <div className="mt-2 p-3 bg-red-50 border border-red-300 rounded text-red-900">
                  <div className="font-bold text-base flex items-center gap-2">
                    ผลตรวจ FIT Test: <span className="text-red-700 underline">Positive (ผลบวก) รหัสหัตถการ 1B0061</span>
                  </div>
                  <div className="text-xs text-red-800 mt-1">
                    ข้อบ่งชี้: ตรวจพบเลือดแฝงในอุจจาระ (Fecal Immunochemical Test Positive) มีความเสี่ยงต่อติ่งเนื้อหรือมะเร็งลำไส้ใหญ่ จึงขอส่งต่อเพื่อทำหัตถการส่องกล้องตรวจลำไส้ใหญ่ (Colonoscopy)
                  </div>
                </div>
              </div>

              {/* Appointment & Preparation */}
              <div className="border border-slate-400 rounded p-4 mb-4 space-y-2 text-sm">
                <div className="font-bold text-base text-slate-900 border-b border-slate-300 pb-1">
                  กำหนดการนัดหมายและการเตรียมตัวก่อนส่องกล้อง (Colonoscopy Appointment)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>วันเวลานัดตรวจ:</strong> {formatThaiDate(ref?.appointmentDate)} เวลา {ref?.appointmentTime || '08:30'} น.</div>
                  <div><strong>สถานที่:</strong> {ref?.destinationHospital || 'โรงพยาบาลสกลนคร'}</div>
                </div>
                <div>
                  <strong>คำแนะนำการเตรียมลำไส้ (Bowel Preparation):</strong>
                  <p className="text-xs text-slate-700 mt-1 pl-3 border-l-2 border-slate-300">
                    {ref?.bowelPrepInstruction || 'รับประทานอาหารอ่อนย่อยง่าย งดผักผลไม้และอาหารมีกาก 3 วันก่อนวันนัด ดื่มยาระบายเตรียมลำไส้ตามคำแนะนำของเจ้าหน้าที่ และงดน้ำงดอาหารหลังเที่ยงคืนก่อนวันตรวจ'}
                  </p>
                </div>
              </div>
            </div>

            {/* Doctor Signature */}
            <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 gap-8 text-sm">
              <div className="text-xs text-slate-600">
                <p>* ผู้ป่วยโปรดนำใบส่งต่อนี้ พร้อมบัตรประจำตัวประชาชน ยาประจำตัวที่รับประทาน และผลตรวจ FIT Test ไปยื่น ณ จุดบริการ รพ.สกลนคร ในวันนัด</p>
              </div>

              <div className="text-center space-y-2">
                <div>ลงชื่อ..................................................................แพทย์ผู้ส่งต่อ</div>
                <div className="font-bold">({ref?.referralDoctor || 'นพ.อภิชาติ ปัญญาเลิศ'})</div>
                <div className="text-xs text-slate-600">แพทย์ประจำ โรงพยาบาลโพนนาแก้ว</div>
                <div className="text-xs text-slate-500">โทรประสานงานส่งต่อ: 042-759001 ต่อ 108</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
