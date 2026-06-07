import { useState, useEffect, useCallback, useMemo } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { useTasks, useSchedules, useEnergy, useSessions, useWorkCap } from './hooks/useFirestore';
import { runScheduler } from './utils/scheduler';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Schedule from './pages/Schedule';
import Energy from './pages/Energy';
import Analytics from './pages/Analytics';
import CalendarView from './pages/CalendarView';
import Profile from './pages/Profile';

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function App() {
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState(() => {
    return localStorage.getItem('lastView') || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('lastView', view);
  }, [view]);
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  const { tasks,     addTask,     updateTask,     deleteTask     } = useTasks(user?.uid);
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useSchedules(user?.uid);
  const { energy: energySettings, setEnergy                      } = useEnergy(user?.uid);
  const { sessions,  replaceAllSessions, updateSession, deleteSession } = useSessions(user?.uid);
  const { workCap,   setWorkCap, getCapMap, defaultCap           } = useWorkCap(user?.uid);

  const overdueKey = useMemo(
    () => tasks.map(t => `${t.id}:${t.status}:${t.deadline}`).join(','),
    [tasks]
  );

  useEffect(() => {
    if (!tasks.length || !updateTask) return;
    const today = isoDate(new Date());
    tasks.forEach(t => {
      if ((t.status === 'pending' || t.status === 'in-progress') && t.deadline < today) {
        updateTask(t.id, { status: 'overdue' });
      }
    });
  }, [overdueKey, updateTask]);

  const doReschedule = useCallback(async () => {
    if (!user?.uid || tasks.length === 0) return;
    
    setRescheduling(true);
    const startTime = Date.now();
    
    try {
      const todayISO = isoDate(new Date());
      const capMap = (getCapMap ? getCapMap() : null) ?? {};

      // scheduler sekarang juga mengembalikan infeasibleTaskIds —
      // yaitu task pending/in-progress yang durasinya tidak muat sebelum deadline
      const { scheduled, infeasibleTaskIds } = runScheduler(
        tasks, schedules, energySettings, todayISO, 14, capMap,
        Date.now()   // nowMs — prevents scheduling sessions in the past
      );

      // ── Update status task yang tidak feasible ke 'overdue' ──────────────
      // Jalankan paralel untuk efisiensi, tapi batasi hanya task yang
      // belum overdue agar tidak trigger write Firestore yang tidak perlu
      if (infeasibleTaskIds.length > 0 && updateTask) {
        const updatePromises = infeasibleTaskIds
          .filter(id => {
            const t = tasks.find(t => t.id === id);
            return t && t.status !== 'overdue'; // hindari write duplikat
          })
          .map(id => updateTask(id, { status: 'overdue' }));

        await Promise.all(updatePromises);
      }
      // ─────────────────────────────────────────────────────────────────────

      await replaceAllSessions(scheduled);
    } catch (err) {
      console.error('Reschedule failed:', err);
    } finally {
      const elapsed = Date.now() - startTime;
      const minDuration = 1500;
      const delay = Math.max(0, minDuration - elapsed);
      
      setTimeout(() => {
        setRescheduling(false);
      }, delay);
    }
  }, [user, tasks, schedules, energySettings, getCapMap, replaceAllSessions, updateTask]);

  const uid         = user?.uid;
  const tasksLen    = tasks.length;
  const schedulesLen = schedules.length;

  useEffect(() => {
    if (uid && tasksLen > 0 && energySettings && !rescheduling) {
      doReschedule();
    }
  }, [uid, tasksLen, schedulesLen]);

  const handleLogout = () => signOut(auth);

  const handleApplyEnergyResult = async (result) => {
    await setEnergy(result);
    await doReschedule();
  };

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07101F', color: '#60A5FA', fontSize: 14 }}>
        ⏳ Memuat ADAPTIME...
      </div>
    );
  }

  if (!user) return <Auth />;

  const sharedProps = {
    tasks,
    schedules,
    energy: energySettings,
    sessions,
    onReschedule: doReschedule,
    rescheduling,
  };

  return (
    <div className="app-wrapper">
      <Sidebar view={view} setView={setView} user={user} onLogout={handleLogout} />
      <div className="main-content">
        {rescheduling && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
            background: 'rgba(59,130,246,0.15)', borderBottom: '1px solid rgba(59,130,246,0.3)',
            padding: '8px 0', textAlign: 'center', fontSize: 13, color: '#60A5FA',
          }}>
            ⚡ Menjadwalkan ulang...
          </div>
        )}

        {view === 'dashboard' && (
          <Dashboard
            {...sharedProps}
            energySettings={energySettings}
            user={user}
            setView={setView}
            defaultCap={defaultCap}
            workCap={workCap}
            updateTask={updateTask}
            updateSession={updateSession}
          />
        )}
        {view === 'tasks' && (
          <Tasks
            tasks={tasks}
            addTask={addTask}
            updateTask={updateTask}
            deleteTask={deleteTask}
            onReschedule={doReschedule}
          />
        )}
        {view === 'schedule' && (
          <Schedule
            schedules={schedules}
            addSchedule={addSchedule}
            updateSchedule={updateSchedule}
            deleteSchedule={deleteSchedule}
            onReschedule={doReschedule}
          />
        )}
        {view === 'energy' && (
          <Energy
            energySettings={energySettings}
            setEnergySettings={setEnergy}
            workCap={workCap}
            setWorkCap={setWorkCap}
            defaultCap={defaultCap}
            onReschedule={doReschedule}
          />
        )}
        {view === 'calendar' && (
          <CalendarView
            {...sharedProps}
            updateSession={updateSession}
            deleteSession={deleteSession}
            updateTask={updateTask}
          />
        )}
        {view === 'analytics' && (
          <Analytics {...sharedProps} />
        )}
        {view === 'profile' && (
          <Profile
            user={user}
            onApplyEnergyResult={handleApplyEnergyResult}
          />
        )}
      </div>
    </div>
  );
}