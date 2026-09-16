import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { PatientScreening } from '../types';
import { INITIAL_PATIENTS } from '../mockData';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfigJson) : getApp();

// Use the specific databaseId provisioned by AI Studio
const db = getFirestore(app, firebaseConfigJson.firestoreDatabaseId || undefined);

export { app, db };

export const PATIENTS_COLLECTION = 'patients';

/**
 * Subscribe to real-time updates from Cloud Firestore
 */
export function subscribeToPatients(
  onUpdate: (patients: PatientScreening[]) => void,
  onError?: (error: Error) => void
) {
  const patientsRef = collection(db, PATIENTS_COLLECTION);

  return onSnapshot(
    patientsRef,
    (snapshot) => {
      if (snapshot.empty) {
        // เมื่อฐานข้อมูลว่างเปล่า (เช่น หลังลบข้อมูลเดิมออกเพื่อเตรียมนำเข้าใหม่) ให้ส่งค่าอาร์เรย์ว่าง ไม่ทำการ seed ข้อมูลซ้ำ
        onUpdate([]);
        return;
      }

      const list: PatientScreening[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as PatientScreening;
        list.push({ ...data, id: docSnap.id });
      });

      // Sort by creation or HN descending
      list.sort((a, b) => (b.hn || '').localeCompare(a.hn || ''));
      onUpdate(list);
    },
    (err) => {
      console.error('Firestore snapshot subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * ลบข้อมูลผู้ป่วยทั้งหมดออกจาก Firestore (สำหรับเตรียมนำเข้าไฟล์ชุดใหม่)
 */
export async function clearAllPatientsFromFirestore() {
  const patientsRef = collection(db, PATIENTS_COLLECTION);
  const snap = await getDocs(patientsRef);

  if (snap.empty) return;

  const docs = snap.docs;
  const chunkSize = 400;

  for (let i = 0; i < docs.length; i += chunkSize) {
    const chunk = docs.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    for (const docSnap of chunk) {
      batch.delete(docSnap.ref);
    }
    await batch.commit();
  }
}

/**
 * Helper to strip any undefined properties recursively
 * (Firestore throws an error if any field is undefined)
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        result[key] = sanitizeForFirestore(val);
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}

/**
 * Seed initial sample patients into Firestore (เฉพาะเมื่อผู้ใช้ต้องการทดสอบแบบกดปุ่มเอง)
 */
export async function seedInitialPatients() {
  const batch = writeBatch(db);
  for (const patient of INITIAL_PATIENTS) {
    const docRef = doc(db, PATIENTS_COLLECTION, patient.id);
    batch.set(docRef, sanitizeForFirestore(patient));
  }
  await batch.commit();
}

/**
 * Add or update single patient
 */
export async function savePatientToFirestore(patient: PatientScreening) {
  const docRef = doc(db, PATIENTS_COLLECTION, patient.id);
  const cleanData = sanitizeForFirestore(patient);
  await setDoc(docRef, cleanData, { merge: true });
}

/**
 * Batch import patients (from Excel)
 */
export async function batchSavePatientsToFirestore(patients: PatientScreening[]) {
  // Firestore batches max 500 writes
  const batchSize = 400;
  for (let i = 0; i < patients.length; i += batchSize) {
    const chunk = patients.slice(i, i + batchSize);
    const batch = writeBatch(db);
    for (const p of chunk) {
      const docRef = doc(db, PATIENTS_COLLECTION, p.id);
      const cleanData = sanitizeForFirestore(p);
      batch.set(docRef, cleanData, { merge: true });
    }
    await batch.commit();
  }
}

/**
 * Delete patient from Firestore
 */
export async function deletePatientFromFirestore(patientId: string) {
  const docRef = doc(db, PATIENTS_COLLECTION, patientId);
  await deleteDoc(docRef);
}

/**
 * Reset all patient data back to initial hospital dataset
 */
export async function resetAllPatientsInFirestore() {
  // Get all existing documents
  const patientsRef = collection(db, PATIENTS_COLLECTION);
  const snap = await getDocs(patientsRef);

  const deleteBatch = writeBatch(db);
  snap.forEach((docSnap) => {
    deleteBatch.delete(docSnap.ref);
  });
  await deleteBatch.commit();

  // Re-seed
  await seedInitialPatients();
}
