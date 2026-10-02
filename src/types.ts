export type FitResultType = 'positive' | 'negative' | 'inconclusive' | 'pending';

export type KitStatusType = 'not_received' | 'received' | 'tested';

export type CaColonStatus = 
  | 'pending_contact'      // รอติดต่อแจ้งผล (เกิน 7 วันจะเตือนสีแดง)
  | 'contacted'            // ติดต่อสำเร็จ / รอยืนยันวันนัด
  | 'scheduled'            // นัดส่องกล้องแล้ว (รอวันตรวจ)
  | 'prep_in_progress'     // กำลังเตรียมลำไส้ / รับยาระบายแล้ว
  | 'colonoscopy_done'     // ส่องกล้องเรียบร้อย (รอผลชิ้นเนื้อ)
  | 'biopsy_reported'      // ผลชิ้นเนื้อออกแล้ว / มีแผนรักษา
  | 'refused'              // ผู้ป่วยปฏิเสธการส่องกล้อง
  | 'cannot_contact';      // ติดต่อไม่ได้ (ติดตาม อสม./ผู้นำชุมชน)

export type BowelPrepStatus = 
  | 'not_started'          // ยังไม่เริ่มเตรียม
  | 'received_meds'        // ได้รับยาระบายแล้ว (Swiff/Klean-Prep)
  | 'diet_restricted'      // เริ่มงดผักผลไม้กากใยแล้ว (3 วันก่อนตรวจ)
  | 'prep_completed'       // ดื่มยาระบายครบ ถ่ายเป็นน้ำใสแล้ว
  | 'problem_encountered'; // มีปัญหาการทานยา/อาเจียน

export type ColonoscopyFinding = 
  | 'pending'              // รอผลส่องกล้อง
  | 'normal'               // ผลปกติ ไม่พบพยาธิสภาพ
  | 'polyps_removed'       // พบติ่งเนื้อและตัดออกแล้ว (Polypectomy)
  | 'suspected_cancer'     // พบก้อนเนื้อสงสัยมะเร็ง (Mass / Tumor)
  | 'ulcer_inflammation'   // แผลหรือการอักเสบ (Colitis / Ulcer)
  | 'stricture'            // ลำไส้ตีบแคบ ส่องกล้องไม่ผ่าน
  | 'other';               // อื่นๆ

export type BiopsyResult = 
  | 'pending'              // รอผลทางพยาธิวิทยา (Lab รพ.ศูนย์)
  | 'benign_polyp'         // ติ่งเนื้อชนิดธรรมดา (Hyperplastic)
  | 'tubular_adenoma'      // Tubular / Tubulovillous Adenoma
  | 'high_grade_dysplasia' // Adenoma with High-Grade Dysplasia
  | 'adenocarcinoma'       // มะเร็งลำไส้ใหญ่ (Adenocarcinoma)
  | 'not_indicated'        // ไม่ได้ตัดชิ้นเนื้อ (ตรวจปกติ)
  | 'other';

export interface CallLogEntry {
  id: string;
  date: string;
  caller: string;
  phone: string;
  outcome: 'answered_agreed' | 'answered_hesitant' | 'answered_refused' | 'no_answer' | 'wrong_number' | 'busy';
  notes: string;
}

export interface CaColonTracking {
  status: CaColonStatus;
  fitPositiveDate?: string;
  
  // ขั้นตอนที่ 2: การติดต่อ
  contactDate?: string;
  contactOfficer?: string;
  contactNotes?: string;
  callLogs?: CallLogEntry[];

  // ขั้นตอนที่ 3: วันเวลานัด & เตรียมตัว
  appointmentDate?: string;
  appointmentTime?: string;
  hospitalName?: string;
  department?: string;
  bowelPrepStatus?: BowelPrepStatus;
  bowelPrepNotes?: string;
  companionName?: string;
  companionPhone?: string;

  // ขั้นตอนที่ 4: ผลการส่องกล้อง
  colonoscopyDate?: string;
  colonoscopyHospital?: string;
  colonoscopyDoctor?: string;
  colonoscopyFinding?: ColonoscopyFinding;
  colonoscopyDetails?: string;
  polypCount?: number;
  polypSizeLocation?: string;

  // ขั้นตอนที่ 5: ผลชิ้นเนื้อและการวินิจฉัย
  biopsyDate?: string;
  biopsyResult?: BiopsyResult;
  biopsyDetails?: string;
  cancerStaging?: string;
  treatmentPlan?: string;

  // Clinical Notes ทั่วไป (เช่น เหตุผลปฏิเสธ, ข้อห้าม, โรคประจำตัว)
  clinicalNotes?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface PatientScreening {
  id: string; // unique ID
  hn: string; // Hospital Number e.g. 67-00101
  villageNo: string; // หมู่ที่ e.g. "1", "2"
  houseNo: string; // บ้านเลขที่ e.g. "45/2"
  subdistrict?: string; // ตำบล e.g. "นาแก้ว", "บ้านแป้น"
  villageName?: string; // ชื่อหมู่บ้าน e.g. "นาเดื่อ"
  healthCenter?: string; // หน่วยบริการสาธารณสุข e.g. "PCU โรงพยาบาลโพนนาแก้ว"
  prefix: string; // คำนำหน้า e.g. "นาย", "นาง", "นางสาว"
  firstName: string; // ชื่อ
  lastName: string; // นามสกุล
  gender: 'ชาย' | 'หญิง'; // เพศ
  ageYears: number; // อายุ(ปี)
  ageMonths: number; // อายุ(เดือน)
  birthDate: string; // วันเกิด YYYY-MM-DD
  idCard: string; // เลขที่บัตรประชาชน 13 หลัก
  phone?: string; // เบอร์โทรศัพท์สำหรับติดต่อ
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

  // หน้าติดตาม ผู้ป่วยสงสัย/CA Colon (Patient Journey & Clinical Tracking)
  caTracking?: CaColonTracking;

  // แผนที่บ้านผู้ป่วย (Map Colon: พิกัดบ้าน & อสม. ผู้ดูแล)
  location?: PatientLocation;
}

export interface PatientLocation {
  lat: number;
  lng: number;
  addressDetails?: string; // รายละเอียดบ้าน/จุดสังเกต
  landmark?: string; // จุดสังเกตเด่น เช่น ใกล้วัด, ตรงข้ามโรงเรียน
  osmName?: string; // อสม. ผู้รับผิดชอบ/ผู้ดูแล
  osmPhone?: string; // เบอร์โทร อสม.
  visitStatus?: 'not_visited' | 'visited' | 'followup_needed'; // สถานะการลงเยี่ยมบ้าน
  visitNotes?: string; // บันทึกการลงพื้นที่เยี่ยมบ้าน
  updatedAt?: string;
  updatedBy?: string;
}

export interface VillageSummary {
  villageId?: string;
  villageNo: string;
  villageName: string;
  subdistrict?: string;
  healthCenter?: string;
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

