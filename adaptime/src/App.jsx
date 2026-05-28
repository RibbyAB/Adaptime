import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { useTasks } from './hooks/useFirestore';
import { useSchedules } from './hooks/useFirestore';
import { useEnergy } from './hooks/useFirestore';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Schedule from './pages/Schedule';
import Energy from './pages/Energy';
import Analytics from './pages/Analytics';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState('dashboard');

  // Listen to Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const { tasks, addTask, updateTask, deleteTask } = useTasks(user?.uid);
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useSchedules(user?.uid);
  const { energy, setEnergy } = useEnergy(user?.uid);

  const handleLogout = () => signOut(auth);

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07101F', color: '#60A5FA', fontSize: 14 }}>
        ⏳ Memuat ADAPTIME...
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <div className="app-wrapper">
      <Sidebar view={view} setView={setView} user={user} onLogout={handleLogout} />
      <div className="main-content">
        {view === 'dashboard' && (
          <Dashboard tasks={tasks} schedules={schedules} energySettings={energy} user={user} setView={setView} />
        )}
        {view === 'tasks' && (
          <Tasks tasks={tasks} addTask={addTask} updateTask={updateTask} deleteTask={deleteTask} />
        )}
        {view === 'schedule' && (
          <Schedule schedules={schedules} addSchedule={addSchedule} updateSchedule={updateSchedule} deleteSchedule={deleteSchedule} />
        )}
        {view === 'energy' && (
          <Energy energySettings={energy} setEnergySettings={setEnergy} />
        )}
        {view === 'analytics' && (
          <Analytics tasks={tasks} schedules={schedules} energySettings={energy} />
        )}
      </div>
    </div>
  );
}
