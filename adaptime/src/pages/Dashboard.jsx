import { diffColor, energyColor, daysLeft } from '../utils/helpers';
import { StatusBadge, TypeBadge } from '../components/Badge';

const TIME_SLOTS = [
  { k: 'morning',   label: 'Pagi',  icon: '🌅', time: '06–12' },
  { k: 'afternoon', label: 'Siang', icon: '☀️', time: '12–17' },
  { k: 'evening',   label: 'Sore',  icon: '🌆', time: '17–20' },
  { k: 'night',     label: 'Malam', icon: '🌙', time: '20–24' },
];

export default function Dashboard({ tasks, schedules, energySettings, user, setView }) {
  const todaySched = schedules
    .filter(s => s.day === 'Senin')
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

  const prefLabel =
    energySettings.pref === 'morning' ? '🌅 Morning Person'
    : energySettings.pref === 'night' ? '🌙 Night Owl'
    : '⚙️ Custom';

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 26 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#E2ECFF', marginBottom: 3 }}>
          Halo, {(user?.name || 'Mahasiswa').split(' ')[0]} 👋
        </h1>
        <p style={{ color: '#4B6A8A', fontSize: 13 }}>Senin, 25 Mei 2026 · Selamat bekerja keras!</p>
      </div>

      {/* Energy bar */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>⚡ Level Energi Hari Ini</span>
          <span style={{
            fontSize: 11, color: '#4B6A8A',
            background: 'rgba(59,130,246,0.08)',
            padding: '2px 10px', borderRadius: 20,
            border: '1px solid rgba(59,130,246,0.15)',
          }}>{prefLabel}</span>
        </div>
        <div className="grid-4">
          {TIME_SLOTS.map(s => {
            const lv = energySettings[s.k];
            return (
              <div key={s.k} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>{s.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#7BA5C8', marginBottom: 1 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: '#3D5A7A', marginBottom: 7 }}>{s.time}</div>
                <div className="energy-bar">
                  <div className="energy-fill" style={{ width: `${lv * 20}%`, background: energyColor(lv) }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: energyColor(lv), marginTop: 3 }}>{lv}/5</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today schedule & urgent tasks */}
      <div className="grid-2" style={{ marginBottom: 14 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>📅 Jadwal Hari Ini (Senin)</span>
            <span style={{ fontSize: 11, color: '#60A5FA', cursor: 'pointer' }} onClick={() => setView('schedule')}>
              Lihat semua →
            </span>
          </div>
          {todaySched.length === 0 ? (
            <p style={{ color: '#3D5A7A', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>Tidak ada jadwal</p>
          ) : todaySched.map(s => (
            <div key={s.id} style={{
              display: 'flex', gap: 10, padding: '9px 0',
              borderBottom: '1px solid rgba(59,130,246,0.05)',
            }}>
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

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>🔥 Task Mendesak</span>
            <span style={{ fontSize: 11, color: '#60A5FA', cursor: 'pointer' }} onClick={() => setView('tasks')}>
              Lihat semua →
            </span>
          </div>
          {urgent.length === 0 ? (
            <p style={{ color: '#3D5A7A', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
              Semua task sudah selesai! 🎉
            </p>
          ) : urgent.map(t => {
            const dl = daysLeft(t.deadline);
            return (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 0', borderBottom: '1px solid rgba(59,130,246,0.05)',
              }}>
                <div style={{ width: 3, height: 34, borderRadius: 2, background: diffColor(t.difficulty), flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#C8DCFF', marginBottom: 2 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: dl <= 0 ? '#EF4444' : dl <= 2 ? '#F59E0B' : '#4B6A8A' }}>
                    {dl < 0 ? `⚠️ ${-dl}h terlambat` : dl === 0 ? '🔥 Deadline hari ini!' : dl === 1 ? '⏰ Besok deadline' : `📅 ${dl} hari lagi`}
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>
            );
          })}
        </div>
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
