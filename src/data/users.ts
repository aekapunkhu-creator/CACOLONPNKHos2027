import { UserAccount } from '../types';

export const USER_ACCOUNTS: UserAccount[] = [
  {
    name: 'นายเอกพันธ์ ขันติ',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    roleTitle: 'ผู้ดูแลระบบ (Admin)',
    position: 'นักวิชาการสาธารณสุข'
  },
  {
    name: 'นางพิชญกร นามนนท์',
    username: 'pcu01',
    password: 'pnk11103',
    role: 'head',
    roleTitle: 'หัวหน้ากลุ่มงาน (Head)',
    position: 'พยาบาลวิชาชีพชำนาญการพิเศษ'
  },
  {
    name: 'นางแพรวนภา จันทร์ลาย',
    username: 'pcu02',
    password: 'pnk11103',
    role: 'officer',
    roleTitle: 'เจ้าหน้าที่ผู้ปฏิบัติงาน (Officer)',
    position: 'พยาบาลวิชาชีพชำนาญการ'
  },
  {
    name: 'น.ส.จริยา การุญ',
    username: 'pcu03',
    password: 'pnk11103',
    role: 'officer',
    roleTitle: 'เจ้าหน้าที่ผู้ปฏิบัติงาน (Officer)',
    position: 'พยาบาลวิชาชีพชำนาญการ'
  },
  {
    name: 'น.ส.กนกพร ใจส่อง',
    username: 'pcu04',
    password: 'pnk11103',
    role: 'officer',
    roleTitle: 'เจ้าหน้าที่ผู้ปฏิบัติงาน (Officer)',
    position: 'นักสาธารณสุขปฏิบัติการ'
  },
  {
    name: 'นายเอกพันธ์ ขันติ',
    username: 'pcu05',
    password: 'pnk11103',
    role: 'officer',
    roleTitle: 'เจ้าหน้าที่ผู้ปฏิบัติงาน (Officer)',
    position: 'นักวิชาการสาธารณสุข'
  },
  {
    name: 'น.ส.พิมลวรรณ สุพะสอน',
    username: 'pcu06',
    password: 'pnk11103',
    role: 'officer',
    roleTitle: 'เจ้าหน้าที่ผู้ปฏิบัติงาน (Officer)',
    position: 'นักวิชาการสาธารณสุข'
  },
  {
    name: 'น.ส.ปภัสสร พุทนา',
    username: 'pcu07',
    password: 'pnk11103',
    role: 'officer',
    roleTitle: 'เจ้าหน้าที่ผู้ปฏิบัติงาน (Officer)',
    position: 'พยาบาลวิชาชีพ'
  },
  {
    name: 'น.ส.ประภัสสร เรืองศรี',
    username: 'pcu08',
    password: 'pnk11103',
    role: 'officer',
    roleTitle: 'เจ้าหน้าที่ผู้ปฏิบัติงาน (Officer)',
    position: 'นักวิชาการสาธารณสุข'
  },
  {
    name: 'นางแสงฟ้า เหลืองชาลี',
    username: 'pcu09',
    password: 'pnk11103',
    role: 'officer',
    roleTitle: 'เจ้าหน้าที่ผู้ปฏิบัติงาน (Officer)',
    position: 'พนักงานผู้ช่วยเหลือคนไข้'
  },
  {
    name: 'น.ส.รุ่งนภา การนอก',
    username: 'pcu10',
    password: 'pnk11103',
    role: 'officer',
    roleTitle: 'เจ้าหน้าที่ผู้ปฏิบัติงาน (Officer)',
    position: 'พนักงานผู้ช่วยเหลือคนไข้'
  }
];

export function authenticateUser(usernameInput: string, passwordInput: string): UserAccount | null {
  const cleanUsername = usernameInput.trim().toLowerCase();
  const cleanPassword = passwordInput.trim();

  const found = USER_ACCOUNTS.find(
    (u) => u.username.toLowerCase() === cleanUsername && u.password === cleanPassword
  );

  return found || null;
}
