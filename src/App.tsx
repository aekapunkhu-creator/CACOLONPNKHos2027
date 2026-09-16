import React, { useState, useEffect } from 'react';
import { PatientScreening, UserAccount } from './types';
import { INITIAL_PATIENTS } from './mockData';
import { 
  subscribeToPatients, 
  savePatientToFirestore, 
  batchSavePatientsToFirestore, 
  deletePatientFromFirestore, 
  resetAllPatientsInFirestore,
  clearAllPatientsFromFirestore
} from './lib/firebase';
import { Header } from './components/Header';
import { Navigation, TabId } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { RegistrationView } from './components/RegistrationView';
import { SampleReceiveView } from './components/SampleReceiveView';
import { ResultEntryView } from './components/ResultEntryView';
import { ReferralView } from './components/ReferralView';
import { AllScreeningListView } from './components/AllScreeningListView';
import { ReferralPrintDocument } from './components/ReferralPrintDocument';
import { LoginView } from './components/LoginView';
import { Cloud, CheckCircle2, Smartphone, ShieldCheck, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'pnk_hospital_fit_screening_v1';
const AUTH_KEY = 'pnk_current_auth_user';

export default function App() {
  // Authentication State: Check if user is already logged in
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const savedAuth = localStorage.getItem(AUTH_KEY);
      if (savedAuth) {
        return JSON.parse(savedAuth);
      }
    } catch (e) {
      console.warn('Failed to load user auth from storage:', e);
    }
    return null;
  });

  // Load initial patients: default to [] ready for fresh import
  const [patients, setPatients] = useState<PatientScreening[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If cached data contains legacy mock dummy records, clean them
          const hasOldMock = parsed.some(p => p.id === 'pt-001' || p.hn === '67-00101');
          if (!hasOldMock) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [targetHnForNextTab, setTargetHnForNextTab] = useState<string | undefined>(undefined);
  const [patientsToPrint, setPatientsToPrint] = useState<PatientScreening[]>([]);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [cloudSyncToast, setCloudSyncToast] = useState<string | null>(null);

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to save user session:', e);
    }
    setCloudSyncToast(`ยินดีต้อนรับ ${user.name} (${user.roleTitle})`);
    setTimeout(() => setCloudSyncToast(null), 3500);
  };

  const handleLogout = () => {
    if (window.confirm(`คุณต้องการออกจากระบบ ใช่หรือไม่?\nชื่อผู้ใช้งาน: ${currentUser?.name}`)) {
      setCurrentUser(null);
      try {
        localStorage.removeItem(AUTH_KEY);
      } catch {}
    }
  };

  // Real-time Firestore synchronization & Auto-purge legacy mock data
  useEffect(() => {
    const unsubscribe = subscribeToPatients(
      async (cloudPatients) => {
        // Detect if Firestore currently holds the old mock demo data (e.g. pt-001 or 67-00101)
        const hasLegacyMock = cloudPatients.some(p => p.id === 'pt-001' || p.hn === '67-00101');
        if (hasLegacyMock) {
          console.log('Detected legacy mock patients in Firestore. Clearing to prepare for fresh real import...');
          try {
            await clearAllPatientsFromFirestore();
            setPatients([]);
            try {
              localStorage.removeItem(STORAGE_KEY);
            } catch {}
            setCloudSyncToast('ล้างข้อมูลตัวอย่างเดิมเรียบร้อยแล้ว ฐานข้อมูลพร้อมนำเข้าข้อมูลจริง');
            setTimeout(() => setCloudSyncToast(null), 4000);
            return;
          } catch (e) {
            console.error('Failed to auto-purge legacy patients:', e);
          }
        }

        setPatients(cloudPatients);
        setIsCloudConnected(true);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudPatients));
        } catch {}
      },
      (error) => {
        console.warn('Firestore subscription status:', error);
        setIsCloudConnected(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handler to clear all patient data from Cloud Firestore
  const handleClearAllPatients = async () => {
    if (window.confirm('คุณต้องการลบข้อมูลผู้ป่วยทั้งหมดออกจากระบบ Firebase Cloud เพื่อเตรียมนำเข้าไฟล์ Excel ชุดใหม่ ใช่หรือไม่?\n\nคำเตือน: ข้อมูลผู้ป่วยทั้งหมดจะถูกลบออกจากฐานข้อมูล และมีผลกับทุกเครื่องที่เชื่อมต่อทันที')) {
      try {
        await clearAllPatientsFromFirestore();
        setPatients([]);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
        setCloudSyncToast('ลบข้อมูลผู้ป่วยเดิมทั้งหมดเรียบร้อยแล้ว พร้อมสำหรับการนำเข้าข้อมูลใหม่');
        setTimeout(() => setCloudSyncToast(null), 4000);
      } catch (err) {
        console.error('Error clearing all patients:', err);
        alert('เกิดข้อผิดพลาดในการลบข้อมูล: ' + err);
      }
    }
  };

  // Handlers for Firestore updates
  const handleResetData = async () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นของโรงพยาบาลโพนนาแก้ว บนระบบ Firebase Cloud ใช่หรือไม่? ข้อมูลจะถูกรีเซ็ตตรงกันทุกเครื่องทันที')) {
      try {
        await resetAllPatientsInFirestore();
        setCloudSyncToast('รีเซ็ตข้อมูลบน Cloud Firebase เรียบร้อย ข้อมูลตรงกันทุกเครื่อง');
        setTimeout(() => setCloudSyncToast(null), 3500);
      } catch (e) {
        console.error('Reset error:', e);
        setPatients(INITIAL_PATIENTS);
      }
      setActiveTab('dashboard');
    }
  };

  const handleAddPatient = async (newPatient: PatientScreening) => {
    // Optimistic local update
    setPatients(prev => [newPatient, ...prev]);
    try {
      await savePatientToFirestore(newPatient);
      setCloudSyncToast(`บันทึก HN: ${newPatient.hn} ขึ้น Firebase สำเร็จ (ซิงค์ทุกเครื่องทันที)`);
      setTimeout(() => setCloudSyncToast(null), 3000);
    } catch (err) {
      console.error('Error saving patient to Firestore:', err);
    }
  };

  const handleImportPatients = async (importedList: PatientScreening[]) => {
    // Optimistic local update
    setPatients(prev => [...importedList, ...prev]);
    try {
      await batchSavePatientsToFirestore(importedList);
      setCloudSyncToast(`นำเข้าผู้ป่วย ${importedList.length} คน ขึ้น Firebase เรียบร้อย`);
      setTimeout(() => setCloudSyncToast(null), 3500);
    } catch (err) {
      console.error('Batch save error:', err);
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (window.confirm('คุณต้องการลบข้อมูลผู้ป่วยรายนี้ใช่หรือไม่? การลบจะมีผลกับทุกเครื่องที่เชื่อมต่อ')) {
      setPatients(prev => prev.filter(p => p.id !== id));
      try {
        await deletePatientFromFirestore(id);
        setCloudSyncToast('ลบข้อมูลบน Cloud Firebase สำเร็จ');
        setTimeout(() => setCloudSyncToast(null), 2500);
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  const handleUpdatePatient = async (updated: PatientScreening) => {
    setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
    try {
      await savePatientToFirestore(updated);
      setCloudSyncToast(`อัปเดตข้อมูล HN: ${updated.hn} บน Cloud Firebase สำเร็จ (ซิงค์ทุกเครื่องทันที)`);
      setTimeout(() => setCloudSyncToast(null), 3000);
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  // Navigations with context
  const handleNavigateToResult = (hn: string) => {
    setTargetHnForNextTab(hn);
    setActiveTab('result-entry');
  };

  const handleNavigateToReferral = (hn?: string) => {
    setTargetHnForNextTab(hn);
    setActiveTab('referral');
  };

  // Print Handlers
  const handlePrintIndividual = (patient: PatientScreening) => {
    setPatientsToPrint([patient]);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintAll = () => {
    const positiveList = patients.filter(p => p.fitResult === 'positive');
    setPatientsToPrint(positiveList);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Metric counts
  const totalRegistered = patients.length;
  const totalTested = patients.filter(p => p.kitStatus === 'tested').length;
  const pendingKitCount = patients.filter(p => p.kitStatus === 'not_received').length;
  const positiveCount = patients.filter(p => p.fitResult === 'positive').length;

  // If user is not authenticated, show strictly the login screen
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-prompt">
      {/* Top Banner Header */}
      <Header
        onResetData={handleResetData}
        onClearAllPatients={handleClearAllPatients}
        totalRegistered={totalRegistered}
        totalTested={totalTested}
        isCloudConnected={isCloudConnected}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Primary Navigation Tabs (Desktop top bar + Mobile bottom bar) */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setTargetHnForNextTab(undefined);
        }}
        pendingKitCount={pendingKitCount}
        positiveCount={positiveCount}
      />

      {/* Cloud Sync Toast Notification */}
      {cloudSyncToast && (
        <div className="fixed top-14 sm:top-18 right-3 left-3 sm:left-auto sm:right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs flex items-center gap-2 animate-fade-in no-print">
          <Cloud className="w-4 h-4 text-cyan-400 flex-shrink-0 animate-pulse" />
          <span className="flex-1 font-medium">{cloudSyncToast}</span>
        </div>
      )}

      {/* Main Content Area - pb-24 on mobile ensures bottom navigation doesn't overlap content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 sm:pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView
            patients={patients}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'registration' && (
          <RegistrationView
            patients={patients}
            onAddPatient={handleAddPatient}
            onImportPatients={handleImportPatients}
            onDeletePatient={handleDeletePatient}
            onClearAllPatients={handleClearAllPatients}
          />
        )}

        {activeTab === 'sample-receive' && (
          <SampleReceiveView
            patients={patients}
            onUpdatePatient={handleUpdatePatient}
            onNavigateToResult={handleNavigateToResult}
          />
        )}

        {activeTab === 'result-entry' && (
          <ResultEntryView
            patients={patients}
            initialHn={targetHnForNextTab}
            onUpdatePatient={handleUpdatePatient}
            onNavigateToReferral={handleNavigateToReferral}
            currentUserName={currentUser.name}
          />
        )}

        {activeTab === 'referral' && (
          <ReferralView
            patients={patients}
            initialHn={targetHnForNextTab}
            onUpdatePatient={handleUpdatePatient}
            onPrintIndividual={handlePrintIndividual}
            onPrintAll={handlePrintAll}
          />
        )}

        {activeTab === 'all-list' && (
          <AllScreeningListView
            patients={patients}
            onNavigateToReferral={handleNavigateToReferral}
          />
        )}
      </main>

      {/* Printable Referral Form Document (hidden on screen, active on Ctrl+P/print) */}
      <ReferralPrintDocument patients={patientsToPrint.length > 0 ? patientsToPrint : patients.filter(p => p.fitResult === 'positive')} />

      {/* Desktop Footer (Hidden on mobile phones to save screen estate) */}
      <footer className="hidden sm:block bg-white border-t border-slate-200 py-3.5 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              หน่วยบริการ <strong>โรงพยาบาลโพนนาแก้ว จ.สกลนคร</strong> • ระบบคัดกรอง FIT Test มะเร็งลำไส้ใหญ่
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1 text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded font-mono text-[11px]">
              <Cloud className="w-3 h-3" /> Cloud Firestore: ซิงค์สดทุกเครื่อง
            </span>
            <span>1B0060 (ผลลบ) / 1B0061 (ผลบวก)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
