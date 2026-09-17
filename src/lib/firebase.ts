import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore,
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { PatientScreening } from '../types';
import { INITIAL_PATIENTS } from '../mockData';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfigJson) : getApp();

// Use initializeFirestore with experimentalForceLongPolling to prevent
// "@firebase/firestore: Could not reach Cloud Firestore backend" and WebChannel stream disconnects
// behind reverse proxies and sandboxed iframes.
let db: ReturnType<typeof getFirestore>;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, firebaseConfigJson.firestoreDatabaseId || undefined);
} catch {
  // If already initialized with options in current runtime
  db = getFirestore(app, firebaseConfigJson.firestoreDatabaseId || undefined);
}

export const auth = getAuth(app);
export { app, db };

export const PATIENTS_COLLECTION = 'patients';

// Required error handling structures conforming to Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot as recommended by the Firebase Integration Skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection check: Client operating in offline mode or connecting.');
    }
    return false;
  }
}

// Execute connection verification asynchronously
if (typeof window !== 'undefined') {
  testConnection().catch(() => {});
}

/**
 * Subscribe to real-time updates from Cloud Firestore with auto-reconnect resilience
 */
export function subscribeToPatients(
  onUpdate: (patients: PatientScreening[]) => void,
  onError?: (error: Error) => void
) {
  const patientsRef = collection(db, PATIENTS_COLLECTION);
  let isCancelled = false;
  let activeUnsubscribe: (() => void) | null = null;
  let retryTimer: any = null;

  const startListening = () => {
    if (isCancelled) return;

    try {
      activeUnsubscribe = onSnapshot(
        patientsRef,
        (snapshot) => {
          if (isCancelled) return;
          if (snapshot.empty) {
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
          if (isCancelled) return;
          console.warn('Firestore real-time subscription update:', err.message);
          if (onError) onError(err);

          // Auto-reconnect after 4 seconds on transient network disconnect
          if (!isCancelled) {
            retryTimer = setTimeout(() => {
              if (!isCancelled) {
                startListening();
              }
            }, 4000);
          }
        }
      );
    } catch (err: any) {
      if (!isCancelled) {
        console.warn('Error starting onSnapshot:', err);
        if (onError) onError(err);
        retryTimer = setTimeout(() => {
          if (!isCancelled) {
            startListening();
          }
        }, 4000);
      }
    }
  };

  startListening();

  return () => {
    isCancelled = true;
    if (activeUnsubscribe) {
      activeUnsubscribe();
    }
    if (retryTimer) {
      clearTimeout(retryTimer);
    }
  };
}

/**
 * ลบข้อมูลผู้ป่วยทั้งหมดออกจาก Firestore (สำหรับเตรียมนำเข้าไฟล์ชุดใหม่)
 */
export async function clearAllPatientsFromFirestore() {
  const patientsRef = collection(db, PATIENTS_COLLECTION);
  try {
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
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.DELETE, PATIENTS_COLLECTION);
    }
    throw error;
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
  try {
    const batch = writeBatch(db);
    for (const patient of INITIAL_PATIENTS) {
      const docRef = doc(db, PATIENTS_COLLECTION, patient.id);
      batch.set(docRef, sanitizeForFirestore(patient));
    }
    await batch.commit();
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.WRITE, PATIENTS_COLLECTION);
    }
    throw error;
  }
}

/**
 * Add or update single patient
 */
export async function savePatientToFirestore(patient: PatientScreening) {
  const docRef = doc(db, PATIENTS_COLLECTION, patient.id);
  const cleanData = sanitizeForFirestore(patient);
  try {
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.WRITE, `${PATIENTS_COLLECTION}/${patient.id}`);
    }
    throw error;
  }
}

/**
 * Batch import patients (from Excel)
 */
export async function batchSavePatientsToFirestore(patients: PatientScreening[]) {
  const batchSize = 400;
  try {
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
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.WRITE, PATIENTS_COLLECTION);
    }
    throw error;
  }
}

/**
 * Delete patient from Firestore
 */
export async function deletePatientFromFirestore(patientId: string) {
  const docRef = doc(db, PATIENTS_COLLECTION, patientId);
  try {
    await deleteDoc(docRef);
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.DELETE, `${PATIENTS_COLLECTION}/${patientId}`);
    }
    throw error;
  }
}

/**
 * Reset all patient data back to initial hospital dataset
 */
export async function resetAllPatientsInFirestore() {
  const patientsRef = collection(db, PATIENTS_COLLECTION);
  try {
    const snap = await getDocs(patientsRef);
    const deleteBatch = writeBatch(db);
    snap.forEach((docSnap) => {
      deleteBatch.delete(docSnap.ref);
    });
    await deleteBatch.commit();
    await seedInitialPatients();
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.WRITE, PATIENTS_COLLECTION);
    }
    throw error;
  }
}
