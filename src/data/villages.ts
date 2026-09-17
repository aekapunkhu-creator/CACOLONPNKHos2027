export interface VillageItem {
  id: string; // unique code e.g. "NK-02"
  no: string; // หมู่ที่ e.g. "2"
  name: string; // ชื่อหมู่บ้าน e.g. "บ้านนาเดื่อ"
  fullName: string; // e.g. "บ้านนาเดื่อ"
  subdistrict: string; // ตำบล e.g. "นาแก้ว"
  healthCenter: string; // หน่วยบริการสาธารณสุข e.g. "PCU โรงพยาบาลโพนนาแก้ว"
}

export interface SubdistrictItem {
  name: string;
  villageCount: number;
  healthCenters: string[];
}

export interface HealthCenterItem {
  name: string;
  subdistrict: string;
  villageCount: number;
}

export const SUBDISTRICT_LIST: SubdistrictItem[] = [
  {
    name: 'นาแก้ว',
    villageCount: 4,
    healthCenters: ['PCU โรงพยาบาลโพนนาแก้ว']
  }
];

export const HEALTH_CENTER_LIST: HealthCenterItem[] = [
  { name: 'PCU โรงพยาบาลโพนนาแก้ว', subdistrict: 'นาแก้ว', villageCount: 4 }
];

export const PHON_NA_KAEO_VILLAGES: VillageItem[] = [
  { id: 'NK-02', no: '2', name: 'บ้านนาเดื่อ', fullName: 'บ้านนาเดื่อ', subdistrict: 'นาแก้ว', healthCenter: 'PCU โรงพยาบาลโพนนาแก้ว' },
  { id: 'NK-03', no: '3', name: 'บ้านกลาง', fullName: 'บ้านกลาง', subdistrict: 'นาแก้ว', healthCenter: 'PCU โรงพยาบาลโพนนาแก้ว' },
  { id: 'NK-10', no: '10', name: 'บ้านกลางใหม่', fullName: 'บ้านกลางใหม่', subdistrict: 'นาแก้ว', healthCenter: 'PCU โรงพยาบาลโพนนาแก้ว' },
  { id: 'NK-11', no: '11', name: 'บ้านนาเดื่อน้อย', fullName: 'บ้านนาเดื่อน้อย', subdistrict: 'นาแก้ว', healthCenter: 'PCU โรงพยาบาลโพนนาแก้ว' },
];

// Re-export as VILLAGE_LIST for backwards compatibility
export const VILLAGE_LIST = PHON_NA_KAEO_VILLAGES;
