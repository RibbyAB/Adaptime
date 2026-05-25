import { useState } from 'react';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Schedule from './pages/Schedule';
import Energy from './pages/Energy';
import Analytics from './pages/Analytics';
import { SEED_TASKS, SEED_SCHEDULES, DEFAULT_ENERGY } from './data/seed';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [tasks, setTasks] = useState(SEED_TASKS);
  const [schedules, setSchedules] = useState(SEED_SCHEDULES);
  const [energy, setEnergy] = useState(DEFAULT_ENERGY);

  if (!loggedIn) {
    return (
      <Auth onLogin={u => {
        setUser(u);
        setLoggedIn(true);
      }} />
    );
  }

  return (
    <div className="app-wrapper">
      <Sidebar
        view={view}
        setView={setView}
        user={user}
        onLogout={() => { setLoggedIn(false); setView('dashboard'); }}
      />
      <div className="main-content">
        {view === 'dashboard' && (
          <Dashboard
            tasks={tasks}
            schedules={schedules}
            energySettings={energy}
            user={user}
            setView={setView}
          />
        )}
        {view === 'tasks' && (
          <Tasks tasks={tasks} setTasks={setTasks} />
        )}
        {view === 'schedule' && (
          <Schedule schedules={schedules} setSchedules={setSchedules} />
        )}
        {view === 'energy' && (
          <Energy energySettings={energy} setEnergySettings={setEnergy} />
        )}
        {view === 'analytics' && (
          <Analytics tasks={tasks} />
        )}
      </div>
    </div>
  );
}
