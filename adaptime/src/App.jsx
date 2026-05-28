import { useState, useEffect, useCallback } from 'react';
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

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function App() {
  const [user, setUser]           = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView]           = useState('dashboard');
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  const { tasks,     addTask,     updateTask,     deleteTask     } = useTasks(user?.uid);
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useSchedules(user?.uid);
  const { energy,    setEnergy                                   } = useEnergy(user?.uid);
  const { sessions,  replaceAllSessions, updateSession, deleteSession } = useSessions(user?.uid);
  const { workCap,   setWorkCap, getCapMap, defaultCap           } = useWorkCap(user?.uid);

  /**
   * Full reschedule — runs the algorithm and saves all sessions to Firestore.
   * Called on first load (when sessions are empty) and when user triggers reschedule.
   */
  const doReschedule = useCallback(async () => {
    if (!user?.uid || tasks.length === 0) return;
    setRescheduling(true);
    try {
      const todayISO  = isoDate(new Date());
      const capMap    = getCapMap ? getCapMap() : {};
      const { scheduled } = runScheduler(tasks, schedules, energy, todayISO, 14, capMap);
      await replaceAllSessions(scheduled);
    } catch (err) {
      console.error('Reschedule failed:', err);
    } finally {
      setRescheduling(false);
    }
  }, [user, tasks, schedules, energy, getCapMap, replaceAllSessions]);

  // Auto-reschedule when tasks or schedules change
  useEffect(() => {
    if (user && tasks.length > 0 && !rescheduling) {
      doReschedule();
    }
  }, [user?.uid, tasks.length, schedules.length]);

  const handleLogout = () => signOut(auth);

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07101F', color: '#60A5FA', fontSize: 14 }}>
        ⏳ Memuat ADAPTIME...
      </div>
    );
  }

  if (!user) return <Auth />;

  const sharedProps = { tasks, schedules, energy, sessions, onReschedule: doReschedule, rescheduling };

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

        {view === 'dashboard' && energy && (
          <Dashboard
            {...sharedProps}
            user={user}
            setView={setView}
            defaultCap={defaultCap}
            workCap={workCap}
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
            energySettings={energy}
            setEnergySettings={setEnergy}
            workCap={workCap}
            setWorkCap={setWorkCap}
            defaultCap={defaultCap}
            onReschedule={doReschedule}
          />
        )}
        {view === 'calendar' && energy && (
          <CalendarView
            {...sharedProps}
            updateSession={updateSession}
            deleteSession={deleteSession}
            updateTask={updateTask}
          />
        )}
        {view === 'analytics' && energy && (
          <Analytics {...sharedProps} />
        )}
      </div>
    </div>
  );
}
