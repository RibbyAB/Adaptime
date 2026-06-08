import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { useTasks, useSchedules, useEnergy, useSessions, useWorkCap, useSchedulingPrefs } from './hooks/useFirestore';
import { runScheduler, findNextAvailableSlot } from './utils/scheduler';
import { useToast, ToastContainer } from './components/Toast';
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
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function App() {
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState(() => localStorage.getItem('lastView') || 'dashboard');
  const [rescheduling, setRescheduling]               = useState(false);
  const [showInfeasiblePopup, setShowInfeasiblePopup] = useState(false);
  const [pendingInfeasibleIds, setPendingInfeasibleIds] = useState([]);
  const [infeasibleTaskIds, setInfeasibleTaskIds]     = useState([]);

  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => { localStorage.setItem('lastView', view); }, [view]);

  useEffect(() => {
    return onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); });
  }, []);

  const { tasks,     addTask,     updateTask,     deleteTask     } = useTasks(user?.uid);
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useSchedules(user?.uid);
  const { energy: energySettings, setEnergy                      } = useEnergy(user?.uid);
  const { sessions, loading: sessionsLoading, replaceAllSessions, updateSession, deleteSession } = useSessions(user?.uid);
  const { workCap,  setWorkCap, getCapMap, defaultCap            } = useWorkCap(user?.uid);
  const { prefs,    setPrefs                                      } = useSchedulingPrefs(user?.uid);

  // ── Auto-overdue ──────────────────────────────────────────────────────────
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
  }, [overdueKey]);

  // ── Core reschedule ───────────────────────────────────────────────────────
  const doReschedule = useCallback(async () => {
    if (!user?.uid || tasks.length === 0) return;
    setRescheduling(true);
    const startTime = Date.now();
    try {
      const todayISO = isoDate(new Date());
      const capMap   = getCapMap ? getCapMap() : {};
      const { scheduled, infeasibleTaskIds } = runScheduler(
        tasks, schedules, energySettings, todayISO, 14, capMap,
        prefs.overduePriority || 'unset',
        sessions
      );

      if (infeasibleTaskIds.length > 0) {
        setInfeasibleTaskIds(infeasibleTaskIds);

        if (prefs.overduePriority === 'unset' && !prefs.infeasiblePopupSeen) {
          setPendingInfeasibleIds(infeasibleTaskIds);
          setShowInfeasiblePopup(true);
        }
      } else {
        setInfeasibleTaskIds([]);
      }

      await replaceAllSessions(scheduled);
    } catch (err) {
      console.error('Reschedule failed:', err);
      addToast('Gagal menjadwalkan ulang', 'error');
    } finally {
      const elapsed = Date.now() - startTime;
      setTimeout(() => setRescheduling(false), Math.max(0, 1500 - elapsed));
    }
  }, [user, tasks, schedules, energySettings, getCapMap, replaceAllSessions, prefs, sessions, updateTask]);

  // ── Catch-up session (un-check past session) ──────────────────────────────
  const handleUncheckedPastSession = useCallback(async (session) => {
    const todayISO   = isoDate(new Date());
    const capMap     = getCapMap ? getCapMap() : {};
    const hoursNeeded = session.endH - session.startH;

    const slot = findNextAvailableSlot(
      hoursNeeded, schedules, energySettings, sessions, todayISO, 14, capMap
    );

    if (slot) {
      await replaceAllSessions([
        ...sessions.filter(s => s.id !== session.id),
        {
          taskId:        session.taskId,
          taskName:      session.taskName,
          difficulty:    session.difficulty,
          day:           slot.day,
          date:          slot.date,
          slotKey:       slot.slotKey,
          slotLabel:     slot.slotLabel,
          slotIcon:      slot.slotIcon,
          startH:        slot.startH,
          endH:          slot.endH,
          sessionNum:    session.sessionNum,
          totalSessions: session.totalSessions,
          energyLevel:   slot.energyLevel,
          isDone:        false,
          note:          '',
          checklist:     [],
        },
      ]);
    } else {
      await doReschedule();
    }
  }, [schedules, energySettings, sessions, getCapMap, replaceAllSessions, doReschedule]);

  // ── Stable reschedule trigger ─────────────────────────────────────────────
  const taskHash = useMemo(
    () => tasks.map(t => `${t.id}:${t.deadline}:${t.hours}:${t.difficulty}:${t.timePref}`).sort().join('|'),
    [tasks]
  );
  const schedHash = useMemo(
    () => schedules.map(s => `${s.id}:${s.day}:${s.startTime}:${s.endTime}`).sort().join('|'),
    [schedules]
  );
  const energyHash = useMemo(
    () => energySettings ? JSON.stringify(energySettings) : '',
    [energySettings]
  );
  const prevHashRef = useRef('');

  useEffect(() => {
    if (!user?.uid || tasks.length === 0 || !energySettings) return;
    const hash = `${taskHash}||${schedHash}||${energyHash}`;
    if (hash === prevHashRef.current) return;
    prevHashRef.current = hash;
    doReschedule();
  }, [user?.uid, taskHash, schedHash, energyHash]);

  const handleLogout = () => signOut(auth);

  const handleApplyEnergyResult = async (result) => {
    await setEnergy(result);
    await doReschedule();
  };

  // ── Infeasible popup ──────────────────────────────────────────────────────
  const handleSetPriority = async (priority) => {
    await setPrefs({ overduePriority: priority, infeasiblePopupSeen: true });
    setShowInfeasiblePopup(false);
    await doReschedule();
  };

  const handleDismissPopup = async () => {
    await setPrefs({ infeasiblePopupSeen: true });
    setShowInfeasiblePopup(false);
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
    tasks, schedules, energy: energySettings, sessions,
    onReschedule: doReschedule, rescheduling,
    infeasibleTaskIds,
  };

  return (
    <div className="app-wrapper">
      <Sidebar view={view} setView={setView} user={user} onLogout={handleLogout} />
      <div className="main-content">
        {rescheduling && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 998,
            background: 'rgba(59,130,246,0.15)', borderBottom: '1px solid rgba(59,130,246,0.3)',
            padding: '8px 0', textAlign: 'center', fontSize: 13, color: '#60A5FA',
          }}>
            ⚡ Menjadwalkan ulang...
          </div>
        )}

        {/* ── Infeasible popup ── */}
        {showInfeasiblePopup && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: '#0A1528', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 14, padding: 28, maxWidth: 440, width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#FCD34D', marginBottom: 8 }}>
                Ada Task yang Tidak Bisa Dijadwalkan
              </div>
              <div style={{ fontSize: 13, color: '#7BA5C8', lineHeight: 1.6, marginBottom: 20 }}>
                {pendingInfeasibleIds.length} task sudah melewati atau tidak cukup waktu sebelum deadline-nya.
                Sistem bisa mengutamakan task-task ini, atau tetap fokus ke task yang masih tepat waktu.
              </div>
              <div style={{ fontSize: 12, color: '#4B6A8A', marginBottom: 16, fontStyle: 'italic' }}>
                Kamu bisa mengubah preferensi ini kapan saja di halaman Analytics.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => handleSetPriority('overdue')}
                  style={{ padding: '11px 16px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#FCD34D', textAlign: 'left' }}
                >
                  ⏫ Utamakan task overdue — jadwalkan mereka lebih dulu
                </button>
                <button
                  onClick={() => handleSetPriority('current')}
                  style={{ padding: '11px 16px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60A5FA', textAlign: 'left' }}
                >
                  📅 Utamakan task tepat waktu — fokus ke yang masih bisa diselesaikan
                </button>
                <button
                  onClick={handleDismissPopup}
                  style={{ padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontSize: 12, background: 'transparent', border: '1px solid rgba(59,130,246,0.1)', color: '#4B6A8A' }}
                >
                  Nanti saja — biarkan sistem memutuskan
                </button>
              </div>
            </div>
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
            sessions={sessions}
            addTask={addTask}
            updateTask={updateTask}
            updateSession={updateSession}
            deleteTask={deleteTask}
            energy={energySettings}
            onReschedule={doReschedule}
            onToast={addToast}
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
            sessionsLoading={sessionsLoading}
            updateSession={updateSession}
            deleteSession={deleteSession}
            updateTask={updateTask}
            onUncheckedPastSession={handleUncheckedPastSession}
          />
        )}
        {view === 'analytics' && (
          <Analytics
            {...sharedProps}
            prefs={prefs}
            setPrefs={setPrefs}
            onReschedule={doReschedule}
          />
        )}
        {view === 'profile' && (
          <Profile user={user} onApplyEnergyResult={handleApplyEnergyResult} />
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
