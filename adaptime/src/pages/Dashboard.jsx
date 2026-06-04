import { diffColor, energyColor, daysLeft } from '../utils/helpers';
import { TypeBadge } from '../components/Badge';
import SessionCard from '../components/SessionCard';
import TaskCard from '../components/TaskCard';
import { formatHour, SLOT_DEFINITIONS } from '../utils/scheduler';

const DAYS = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];

function getTodayName() {
  const d = new Date().getDay();
  return DAYS[d === 0 ? 6 : d - 1];
}

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function Dashboard({ tasks = [], schedules = [], energySettings = {}, sessions = [], user, setView, onReschedule, rescheduling, defaultCap, updateTask, updateSession }) {
  const todayName = getTodayName();
  const todayISO  = isoDate(new Date());

  const todaySched = schedules
    .filter(s => s.day === todayName)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const urgent = tasks
    .filter(t => t.status !== 'done' && t.status !== 'overdue')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 4);

  const stats = [
    { label: 'Total Task',  value: tasks.length,                                        color: '#60A5FA' },
    { label: 'Selesai',     value: tasks.filter(t => t.status === 'done').length,        color: '#10B981' },
    { label: 'Dikerjakan',  value: tasks.filter(t => t.status === 'in-progress').length, color: '#3B82F6' },
    { label: 'Overdue',     value: tasks.filter(t => t.status === 'overdue').length,     color: '#EF4444' },
  ];

  // Use Firestore sessions instead of computing on the fly
  const todayScheduled = (sessions || [])
    .filter(s => s.date === todayISO)
    .sort((a, b) => a.startH - b.startH);

  // Total work hours today from sessions
  const todayWorkHours = todayScheduled.reduce((acc, s) => acc + (s.endH - s.startH), 0);
  const capWarning = defaultCap && todayWorkHours > defaultCap;

  const prefLabel =
    energySettings?.pref === 'morning' ? '🌅 Morning Person'
    : energySettings?.pref === 'night' ? '🌙 Night Owl'
    : '⚙️ Custom';

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Selamat pagi' : now.getHours() < 17 ? 'Selamat siang' : now.getHours() < 20 ? 'Selamat sore' : 'Selamat malam';
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#E2ECFF', marginBottom: 3 }}>
            {greeting}, {(user?.displayName || user?.email?.split('@')[0] || 'User').split(' ')[0]} 👋
          </h1>
          <p style={{ color: '#4B6A8A', fontSize: 13 }}>{dateStr}</p>
        </div>
        <button
          className="btn btn-ghost"
          style={{ fontSize: 12, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={onReschedule}
          disabled={rescheduling}
        >
          {rescheduling ? '⏳ ...' : '🔄 Jadwalkan Ulang'}
        </button>
      </div>

      {/* Overwork warning */}
      {capWarning && (
        <div className="card" style={{ marginBottom: 14, borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.04)' }}>
          <div style={{ fontSize: 13, color: '#F59E0B', fontWeight: 700 }}>
            ⚠️ Hari ini terjadwal {Math.round(todayWorkHours * 10) / 10} jam — melebihi batas {defaultCap} jam/hari. Pertimbangkan untuk istirahat.
          </div>
        </div>
      )}

      {/* Energy bar */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>⚡ Level Energi Hari Ini</span>
          <span style={{ fontSize: 11, color: '#4B6A8A', background: 'rgba(59,130,246,0.08)', padding: '2px 10px', borderRadius: 20, border: '1px solid rgba(59,130,246,0.15)' }}>
            {prefLabel}
          </span>
        </div>
        <div className="grid-4">
          {SLOT_DEFINITIONS.map(s => {
            const lv = energySettings[s.key] ?? 3;
            return (
              <div key={s.key} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>{s.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#7BA5C8', marginBottom: 1 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: '#3D5A7A', marginBottom: 7 }}>{s.startH}–{s.endH}</div>
                <div className="energy-bar">
                  <div className="energy-fill" style={{ width: `${lv * 20}%`, background: energyColor(lv) }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: energyColor(lv), marginTop: 3 }}>{lv}/5</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 14 }}>
        {/* Today's fixed schedule */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>📅 Jadwal Hari Ini ({todayName})</span>
            <span style={{ fontSize: 11, color: '#60A5FA', cursor: 'pointer' }} onClick={() => setView('schedule')}>Lihat semua →</span>
          </div>
          {todaySched.length === 0 ? (
            <p style={{ color: '#3D5A7A', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>Tidak ada jadwal tetap hari ini</p>
          ) : todaySched.map(s => (
            <div key={s.id} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(59,130,246,0.05)' }}>
              <div style={{ minWidth: 46, textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#60A5FA' }}>{s.startTime}</div>
                <div style={{ fontSize: 10, color: '#3D5A7A' }}>{s.endTime}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#C8DCFF', marginBottom: 3 }}>{s.name}</div>
                <TypeBadge type={s.type} />
              </div>
            </div>
          ))}
        </div>

        {/* Urgent tasks */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>🔥 Task Mendesak</span>
            <span style={{ fontSize: 11, color: '#60A5FA', cursor: 'pointer' }} onClick={() => setView('tasks')}>Lihat semua →</span>
          </div>
          {urgent.length === 0 ? (
            <p style={{ color: '#3D5A7A', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>Semua task sudah selesai! 🎉</p>
          ) : urgent.map(t => (
            <TaskCard key={t.id} task={t} onUpdate={updateTask} />
          ))}
        </div>
      </div>

      {/* Smart Schedule for today from Firestore */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>⚡ Smart Schedule Hari Ini</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {todayWorkHours > 0 && (
              <span style={{ fontSize: 11, color: capWarning ? '#F59E0B' : '#10B981' }}>
                {Math.round(todayWorkHours * 10) / 10}j terjadwal
              </span>
            )}
            <span
              style={{ fontSize: 11, color: '#60A5FA', cursor: 'pointer' }}
              onClick={() => setView('calendar')}
            >
              Lihat kalender →
            </span>
          </div>
        </div>
        {todayScheduled.length === 0 ? (
          <p style={{ color: '#3D5A7A', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
            {rescheduling ? '⏳ Menjadwalkan...' : 'Tidak ada sesi hari ini. Tambah task untuk memulai!'}
          </p>
        ) : todayScheduled.map(s => (
          <SessionCard key={s.id} session={s} onUpdate={updateSession} isPast={false} />
        ))}
      </div>

      {/* Stats */}
      <div className="grid-4">
        {stats.map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#4B6A8A', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
