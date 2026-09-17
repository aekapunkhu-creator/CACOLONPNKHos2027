import * as XLSX from 'xlsx';
import { PatientScreening } from '../types';

export function exportScreeningToExcel(patients: PatientScreening[], filename = 'รายงานการคัดกรองมะเร็งลำไส้ใหญ่_รพ.โพนนาแก้ว.xlsx') {
  const data = patients.map((p, idx) => {
    let resultThai = 'ยังไม่ตรวจ';
    let codeThai = '-';
    if (p.fitResult === 'positive') {
      resultThai = 'Positive (ผลบวก)';
      codeThai = '1B0061';
    } else if (p.fitResult === 'negative') {
      resultThai = 'Negative (ผลลบ)';
      codeThai = '1B0060';
    } else if (p.fitResult === 'inconclusive') {
      resultThai = 'Inconclusive (ออกผลไม่ได้)';
      codeThai = '-';
    }

    const bp = (p.bloodPressureSys && p.bloodPressureDia) 
      ? `${p.bloodPressureSys}/${p.bloodPressureDia} mmHg`
      : '-';

    const waist = p.waistInch ? `${p.waistInch} นิ้ว (${p.waistCm || Math.round(p.waistInch * 2.54)} ซม.)` : (p.waistCm ? `${p.waistCm} ซม.` : '-');

    return {
      'ลำดับ': idx + 1,
      'HN': p.hn,
      'ชื่อ-สกุล': `${p.prefix}${p.firstName} ${p.lastName}`,
      'เลขที่บัตรประชาชน': p.idCard,
      'บ้านเลขที่': p.houseNo,
      'หมู่ที่': p.villageNo,
      'หมู่บ้าน': p.villageName || `หมู่ ${p.villageNo}`,
      'ตำบล': p.subdistrict || '-',
      'เพศ': p.gender,
      'อายุ (ปี)': p.ageYears,
      'อายุ (เดือน)': p.ageMonths,
      'สิทธิการรักษา': p.benefitName,
      'โรคประจำตัว': p.underlyingDisease || 'ไม่มี',
      'สถานะชุดตรวจ': p.kitStatus === 'tested' ? 'ตรวจแล้ว' : (p.kitStatus === 'received' ? 'ส่งชุดตรวจแล้ว' : 'ยังไม่ส่งชุดตรวจ'),
      'วันที่ส่งชุด/บันทึกสุขภาพ': p.kitReceivedDate || '-',
      'ส่วนสูง (ซม.)': p.heightCm || '-',
      'น้ำหนัก (กก.)': p.weightKg || '-',
      'รอบเอว': waist,
      'ความดันโลหิต': bp,
      'BMI': p.bmi ? p.bmi.toFixed(1) : '-',
      'ว/ด/ป ที่ตรวจแล็บ': p.testedDate || '-',
      'ผลตรวจคัดกรอง': resultThai,
      'รหัสเบิกจ่าย สปสช.': codeThai,
      'ผู้ตรวจ/เจ้าหน้าที่': p.testedBy || '-',
      'หมายเหตุ/ผู้บันทึก': p.notes || '-',
      'สถานะการส่งต่อส่องกล้อง': p.referral ? `ส่งต่อ รพ.สกลนคร (${p.referral.appointmentDate || 'รอนัด'})` : (p.fitResult === 'positive' ? 'รอส่งต่อ' : '-')
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  const colWidths = [
    { wch: 6 },  // ลำดับ
    { wch: 12 }, // HN
    { wch: 22 }, // ชื่อ-สกุล
    { wch: 18 }, // เลขบัตร
    { wch: 10 }, // บ้านเลขที่
    { wch: 8 },  // หมู่ที่
    { wch: 18 }, // หมู่บ้าน
    { wch: 14 }, // ตำบล
    { wch: 6 },  // เพศ
    { wch: 8 },  // อายุปี
    { wch: 8 },  // อายุเดือน
    { wch: 18 }, // สิทธิ
    { wch: 18 }, // โรคประจำตัว
    { wch: 16 }, // สถานะชุดตรวจ
    { wch: 12 }, // ส่วนสูง
    { wch: 12 }, // น้ำหนัก
    { wch: 14 }, // รอบเอว
    { wch: 14 }, // ความดัน
    { wch: 8 },  // BMI
    { wch: 18 }, // วันตรวจ
    { wch: 22 }, // ผลตรวจ
    { wch: 16 }, // รหัส
    { wch: 22 }, // ผู้ตรวจ
    { wch: 26 }, // ส่งต่อ
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ผลคัดกรอง FIT Test');

  XLSX.writeFile(workbook, filename);
}

export function downloadPatientTemplateExcel() {
  const templateData = [
    {
      'HN': '67-00150',
      'หมู่ที่': '1',
      'บ้านเลขที่': '99/1',
      'คำนำหน้า': 'นาย',
      'ชื่อ': 'สมศักดิ์',
      'นามสกุล': 'รักสงบ',
      'เพศ': 'ชาย',
      'อายุ(ปี)': 60,
      'อายุ (เดือน)': 2,
      'วันเกิด': '1966-07-15',
      'เลขที่บัตรประชาชน': '3470500999991',
      'รหัสสิทธิ': 'UCS',
      'สิทธิการรักษา': 'บัตรทอง (UC)',
      'โรคประจำตัว': 'ความดันโลหิตสูง'
    },
    {
      'HN': '67-00151',
      'หมู่ที่': '2',
      'บ้านเลขที่': '15/3',
      'คำนำหน้า': 'นาง',
      'ชื่อ': 'ปราณี',
      'นามสกุล': 'งามเลิศ',
      'เพศ': 'หญิง',
      'อายุ(ปี)': 55,
      'อายุ (เดือน)': 8,
      'วันเกิด': '1971-01-20',
      'เลขที่บัตรประชาชน': '3470500999992',
      'รหัสสิทธิ': 'OFC',
      'สิทธิการรักษา': 'ข้าราชการ/เบิกตรง',
      'โรคประจำตัว': 'ไม่มี'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  worksheet['!cols'] = [
    { wch: 12 }, // HN
    { wch: 8 },  // หมู่ที่
    { wch: 12 }, // บ้านเลขที่
    { wch: 10 }, // คำนำหน้า
    { wch: 16 }, // ชื่อ
    { wch: 16 }, // นามสกุล
    { wch: 8 },  // เพศ
    { wch: 10 }, // อายุ(ปี)
    { wch: 12 }, // อายุ (เดือน)
    { wch: 14 }, // วันเกิด
    { wch: 18 }, // บัตรประชาชน
    { wch: 10 }, // รหัสสิทธิ
    { wch: 18 }, // สิทธิการรักษา
    { wch: 20 }, // โรคประจำตัว
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_ลงทะเบียน');

  XLSX.writeFile(workbook, 'Template_ลงทะเบียนกลุ่มเป้าหมาย_FIT_Test_รพ.โพนนาแก้ว.xlsx');
}

export async function parseExcelPatients(file: File): Promise<PatientScreening[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('ไม่พบข้อมูลในไฟล์ Excel กรุณาตรวจสอบว่ามีข้อมูลในชีตแรก');
        }

        const villageNameMap: Record<string, string> = {
          '2': 'บ้านนาเดื่อ',
          '02': 'บ้านนาเดื่อ',
          '3': 'บ้านกลาง',
          '03': 'บ้านกลาง',
          '10': 'บ้านกลางใหม่',
          '11': 'บ้านนาเดื่อน้อย'
        };

        const patients: PatientScreening[] = rawRows.map((row, idx) => {
          // Normalize column lookups with regex tolerance for whitespace and symbols
          const getVal = (keys: string[]) => {
            for (const key of keys) {
              const cleanKey = key.toLowerCase().replace(/[\s_\-\(\)\/]/g, '');
              const matched = Object.keys(row).find(k => {
                const cleanK = k.toLowerCase().replace(/[\s_\-\(\)\/]/g, '');
                return cleanK === cleanKey || cleanK.includes(cleanKey);
              });
              if (matched && row[matched] !== undefined && row[matched] !== '') {
                return String(row[matched]).trim();
              }
            }
            return '';
          };

          // 1. HN
          let hn = getVal(['hn', 'เลขhn', 'hospitalnumber', 'hnno', 'pid']) || `67-${String(idx + 1).padStart(5, '0')}`;
          
          // 2. Village & Address
          let rawVillageNo = getVal(['หมู่ที่', 'หมู่', 'villageno', 'moo', 'villagenumber']) || '2';
          // Extract numeric digits if user wrote 'หมู่ 1' or 'ม.1'
          const villageMatch = rawVillageNo.match(/\d+/);
          let villageNo = '2';
          if (villageMatch) {
            villageNo = String(parseInt(villageMatch[0], 10));
          }
          const villageNameInput = getVal(['หมู่บ้าน', 'ชื่อหมู่บ้าน', 'villagename']);
          const villageName = villageNameMap[villageNo] || villageNameMap[rawVillageNo] || villageNameInput || `หมู่ที่ ${villageNo}`;
          const houseNo = getVal(['บ้านเลขที่', 'houseno', 'address', 'ที่อยู่']) || '-';
          const subdistrict = getVal(['ตำบล', 'subdistrict', 'tambon']) || 'นาแก้ว';

          // 3. Name parsing (Support combined 'ชื่อ-สกุล' or split 'ชื่อ' / 'นามสกุล')
          let prefix = getVal(['คำนำหน้า', 'คำนำหน้านาม', 'prefix', 'title', 'pname']);
          let firstName = getVal(['ชื่อ', 'firstname', 'fname', 'first_name']);
          let lastName = getVal(['นามสกุล', 'lastname', 'lname', 'last_name', 'surname']);

          const fullNameCombined = getVal(['ชื่อ-สกุล', 'ชื่อ - สกุล', 'ชื่อสกุล', 'ชื่อและนามสกุล', 'fullname', 'ptname', 'ชื่อผู้ป่วย']);
          if ((!firstName || firstName === 'ไม่ระบุชื่อ') && fullNameCombined) {
            let tempName = fullNameCombined.trim();
            const prefixes = ['นาย', 'นางสาว', 'น.ส.', 'นาง', 'เด็กชาย', 'ด.ช.', 'เด็กหญิง', 'ด.ญ.', 'พระครู', 'พระ', 'ร.ต.ต.', 'ร.ต.ท.', 'พ.ต.ท.', 'พ.ต.อ.'];
            for (const p of prefixes) {
              if (tempName.startsWith(p)) {
                prefix = p;
                tempName = tempName.substring(p.length).trim();
                break;
              }
            }
            const parts = tempName.split(/\s+/).filter(Boolean);
            if (parts.length >= 2) {
              firstName = parts[0];
              lastName = parts.slice(1).join(' ');
            } else if (parts.length === 1) {
              firstName = parts[0];
              lastName = '';
            }
          }

          if (!prefix) prefix = 'นาย';
          if (!firstName) firstName = `ผู้รับการตรวจ ${idx + 1}`;

          // 4. Gender
          const genderRaw = getVal(['เพศ', 'gender', 'sex']).toLowerCase();
          let gender: 'ชาย' | 'หญิง' = 'ชาย';
          if (prefix.includes('นาง') || prefix.includes('น.ส.') || genderRaw.includes('หญิง') || genderRaw === 'f' || genderRaw === 'female' || genderRaw === '2') {
            gender = 'หญิง';
          }

          // 5. Age & Birthdate
          const ageYears = parseInt(getVal(['อายุ(ปี)', 'อายุ', 'age', 'ageyears', 'อายุปี']) || '50', 10) || 50;
          const ageMonths = parseInt(getVal(['อายุ (เดือน)', 'อายุเดือน', 'agemonths', 'months']) || '0', 10) || 0;
          let birthDate = getVal(['วันเกิด', 'วันเดือนปีเกิด', 'birthdate', 'dob']) || '1970-01-01';

          // 6. National ID Card (Clean non-digits)
          let idCard = getVal(['เลขที่บัตรประชาชน', 'บัตรประชาชน', 'cid', 'idcard', 'เลขประจำตัวประชาชน', 'เลขบัตร']);
          idCard = idCard.replace(/[^0-9]/g, '');
          if (!idCard || idCard.length < 10) {
            idCard = `3470500${String(idx + 1).padStart(6, '0')}`;
          }

          // 7. Benefits & Medical History
          const benefitCode = getVal(['รหัสสิทธิ', 'benefitcode', 'pttype']) || 'UCS';
          const benefitName = getVal(['สิทธิการรักษา', 'สิทธิ', 'benefitname', 'pttypename']) || 'บัตรทอง (UC)';
          const underlyingDisease = getVal(['โรคประจำตัว', 'โรค', 'underlyingdisease', 'chronic']) || 'ไม่มี';

          // 8. Health Vitals if already filled in sheet
          const heightCm = parseFloat(getVal(['ส่วนสูง', 'height', 'ส่วนสูง (ซม.)', 'heightcm'])) || undefined;
          const weightKg = parseFloat(getVal(['น้ำหนัก', 'weight', 'น้ำหนัก (กก.)', 'weightkg'])) || undefined;
          const waistInchRaw = parseFloat(getVal(['รอบเอว(นิ้ว)', 'รอบเอวนิ้ว', 'รอบเอว'])) || undefined;
          const waistCmRaw = parseFloat(getVal(['รอบเอว(ซม.)', 'รอบเอวซม.', 'waistcm'])) || undefined;
          
          let waistInch = waistInchRaw;
          let waistCm = waistCmRaw;
          if (waistInch && !waistCm) {
            waistCm = Math.round(waistInch * 2.54);
          } else if (waistCm && !waistInch) {
            waistInch = Math.round(waistCm / 2.54);
          }

          let bmi: number | undefined = undefined;
          if (heightCm && weightKg && heightCm > 0) {
            const hM = heightCm / 100;
            bmi = parseFloat((weightKg / (hM * hM)).toFixed(1));
          }

          // Blood Pressure (Sys/Dia)
          let bloodPressureSys: number | undefined = undefined;
          let bloodPressureDia: number | undefined = undefined;
          const bpCombined = getVal(['ความดันโลหิต', 'ความดัน', 'bp', 'bloodpressure']);
          if (bpCombined && bpCombined.includes('/')) {
            const bpParts = bpCombined.split('/');
            bloodPressureSys = parseInt(bpParts[0].trim(), 10) || undefined;
            bloodPressureDia = parseInt(bpParts[1].trim(), 10) || undefined;
          } else {
            bloodPressureSys = parseInt(getVal(['sys', 'sbp', 'ความดันตัวบน']), 10) || undefined;
            bloodPressureDia = parseInt(getVal(['dia', 'dbp', 'ความดันตัวล่าง']), 10) || undefined;
          }

          // 9. Existing FIT Result if present in sheet
          const resultRaw = getVal(['ผลตรวจคัดกรอง', 'ผลตรวจ', 'ผล', 'fitresult', 'ผลfit', 'result']).toLowerCase();
          let fitResult: 'pending' | 'negative' | 'positive' | 'inconclusive' = 'pending';
          let kitStatus: 'not_received' | 'received' | 'tested' = 'not_received';
          let testedDate: string | undefined = undefined;

          if (resultRaw.includes('positive') || resultRaw.includes('ผลบวก') || resultRaw.includes('1b0061') || resultRaw.includes('+') || resultRaw === 'pos') {
            fitResult = 'positive';
            kitStatus = 'tested';
            testedDate = getVal(['วดปที่ตรวจ', 'วันตรวจ', 'testeddate', 'date']) || new Date().toISOString().split('T')[0];
          } else if (resultRaw.includes('negative') || resultRaw.includes('ผลลบ') || resultRaw.includes('1b0060') || resultRaw.includes('-') || resultRaw === 'neg') {
            fitResult = 'negative';
            kitStatus = 'tested';
            testedDate = getVal(['วดปที่ตรวจ', 'วันตรวจ', 'testeddate', 'date']) || new Date().toISOString().split('T')[0];
          } else if (resultRaw.includes('inconclusive') || resultRaw.includes('ออกผลไม่ได้') || resultRaw.includes('ไม่ชัดเจน')) {
            fitResult = 'inconclusive';
            kitStatus = 'tested';
            testedDate = getVal(['วดปที่ตรวจ', 'วันตรวจ', 'testeddate', 'date']) || new Date().toISOString().split('T')[0];
          } else {
            const statusRaw = getVal(['สถานะชุดตรวจ', 'สถานะ', 'kitstatus']).toLowerCase();
            if (statusRaw.includes('ตรวจแล้ว') || statusRaw.includes('tested')) {
              kitStatus = 'tested';
            } else if (statusRaw.includes('รับแล้ว') || statusRaw.includes('ส่งชุดตรวจแล้ว') || statusRaw.includes('received')) {
              kitStatus = 'received';
            }
          }

          const testedBy = getVal(['ผู้ตรวจ', 'เจ้าหน้าที่', 'testedby']) || undefined;

          const patientRecord: PatientScreening = {
            id: `pt-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            hn,
            villageNo,
            houseNo,
            villageName,
            subdistrict,
            prefix,
            firstName,
            lastName,
            gender,
            ageYears,
            ageMonths,
            birthDate,
            idCard,
            benefitCode,
            benefitName,
            underlyingDisease,
            kitStatus,
            fitResult
          };

          if (heightCm !== undefined && !isNaN(heightCm)) patientRecord.heightCm = heightCm;
          if (weightKg !== undefined && !isNaN(weightKg)) patientRecord.weightKg = weightKg;
          if (waistInch !== undefined && !isNaN(waistInch)) patientRecord.waistInch = waistInch;
          if (waistCm !== undefined && !isNaN(waistCm)) patientRecord.waistCm = waistCm;
          if (bloodPressureSys !== undefined && !isNaN(bloodPressureSys)) patientRecord.bloodPressureSys = bloodPressureSys;
          if (bloodPressureDia !== undefined && !isNaN(bloodPressureDia)) patientRecord.bloodPressureDia = bloodPressureDia;
          if (bmi !== undefined && !isNaN(bmi)) patientRecord.bmi = bmi;
          if (testedDate) patientRecord.testedDate = testedDate;
          if (testedBy) patientRecord.testedBy = testedBy;
          if (kitStatus !== 'not_received') patientRecord.kitReceivedDate = new Date().toISOString().split('T')[0];

          return patientRecord;
        });

        resolve(patients);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
