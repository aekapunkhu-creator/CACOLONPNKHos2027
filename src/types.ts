export type FitResultType = 'positive' | 'negative' | 'inconclusive' | 'pending';

export type KitStatusType = 'not_received' | 'received' | 'tested';

export interface PatientScreening {
  id: string; // unique ID
  hn: string; // Hospital Number e.g. 67-00101
  villageNo: string; // หมู่ที่ e.g. "1", "2"
  houseNo: string; // บ้านเลขที่ e.g. "45/2"
  subdistrict?: string; // ตำบล e.g. "นาแก้ว", "โพนนาแก้ว"
  villageName?: string; // ชื่อหมู่บ้าน e.g. "บ้านโพนนาแก้ว"
  prefix: string; // คำนำหน้า e.g. "นาย", "นาง", "นางสาว"
  firstName: string; // ชื่อ
  lastName: string; // นามสกุล
  gender: 'ชาย' | 'หญิง'; // เพศ
  ageYears: number; // อายุ(ปี)
  ageMonths: number; // อายุ(เดือน)
  birthDate: string; // วันเกิด YYYY-MM-DD
  idCard: string; // เลขที่บัตรประชาชน 13 หลัก
  benefitCode: string; // รหัสสิทธิ e.g. "UCS", "OFC", "SSS"
  benefitName: string; // สิทธิการรักษา e.g. "บัตรทอง (UC)", "ข้าราชการ/เบิกตรง", "ประกันสังคม"
  underlyingDisease: string; // โรคประจำตัว e.g. "เบาหวาน, ความดัน", "ไม่มี"
  
  // หน้าที่ 3: รับชุดตรวจและข้อมูลสุขภาพ
  kitStatus: KitStatusType; // 'not_received' | 'received' | 'tested'
  kitReceivedDate?: string; // วันที่ส่งชุดตรวจ
  heightCm?: number; // ส่วนสูง (สส. ซม.)
  weightKg?: number; // น้ำหนัก (นน. กก.)
  waistInch?: number; // รอบเอว (นิ้ว)
  waistCm?: number; // รอบเอว (ซม.)
  bloodPressureSys?: number; // ความดันโลหิตบน
  bloodPressureDia?: number; // ความดันโลหิตล่าง
  bmi?: number; // ดัชนีมวลกาย

  // หน้าที่ 4: บันทึกผลตรวจ
  fitResult: FitResultType; // 'positive' (แดง 1B0061), 'negative' (เขียว 1B0060), 'inconclusive' (ดำ), 'pending'
  testedDate?: string; // ว/ด/ป ที่ตรวจ
  testedBy?: string; // เจ้าหน้าที่ห้องแล็บ/ผู้ตรวจ
  testLotNo?: string; // หมายเลข Lot ชุดตรวจ FIT Test
  notes?: string; // หมายเหตุเพิ่มเติม

  // หน้าที่ 5: การส่งต่อ Colonoscopy (เฉพาะ Positive)
  referral?: {
    referralNo: string; // เลขที่ใบส่งต่อ
    destinationHospital: string; // โรงพยาบาลสกลนคร
    department: string; // แผนกส่องกล้องทางเดินอาหาร (Endoscopy Center)
    appointmentDate: string; // วันที่นัดส่องกล้อง
    appointmentTime: string; // เวลานัด
    referralReason: string; // ข้อบ่งชี้: FIT Test ผลบวก (1B0061) คัดกรองมะเร็งลำไส้ใหญ่
    referralDoctor: string; // แพทย์ผู้สั่งตรวจ/ผู้ส่งต่อ
    bowelPrepInstruction: string; // คำแนะนำการเตรียมลำไส้
    status: 'pending_referral' | 'referred' | 'completed';
    createdDate: string;
  };
}

export interface VillageSummary {
  villageNo: string;
  villageName: string;
  totalRegistered: number;
  totalTested: number;
  negativeCount: number;
  positiveCount: number;
  inconclusiveCount: number;
  pendingCount: number;
  positiveRate: number; // percentage
  negativeRate: number; // percentage
}

export interface UserAccount {
  name: string;
  username: string;
  password: string;
  role: 'admin' | 'head' | 'officer';
  roleTitle: string;
  position: string;
}

