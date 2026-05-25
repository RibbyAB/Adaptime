import { useState, useMemo } from 'react';
import TaskModal from '../components/TaskModal';
import { StatusBadge } from '../components/Badge';
import { diffColor, diffLabel, daysLeft } from '../utils/helpers';

const FILTERS = [
  ['all', 'Semua'],
  ['pending', 'Pending'],
  ['in-progress', 'Dikerjakan'],
  ['done', 'Selesai'],
  ['overdue', 'Overdue'],
];

export default function Tasks({ tasks, setTasks }) {
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [nid, setNid] = useState(100);

  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => t.status === 'overdue').length,
  };

  const filtered = useMemo(() =>
    tasks
      .filter(t => filter === 'all' || t.status === filter)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline)),
    [tasks, filter]
  );

  const saveTask = form => {
    if (modal === 'add') {
      setTasks(p => [...p, { ...form, id: nid }]);
      setNid(n => n + 1);
    } else {
      setTasks(p => p.map(t => t.id === modal.id ? { ...t, ...form } : t));
    }
    setModal(null);
  };

  const del = id => setTasks(p => p.filter(t => t.id !== id));

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 21, fontWeight: 800, color: '#E2ECFF' }}>📋 Task Management</h2>
        <button className="btn btn-primary" onClick={() => setModal('add')}>+ Tambah Task</button>
      </div>

      <div className="pill-tabs">
        {FILTERS.map(([k, lbl]) => (
          <div
            key={k}
            className={`pill-tab ${filter === k ? 'active' : ''}`}
            onClick={() => setFilter(k)}
          >
            {lbl} ({counts[k]})
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#3D5A7A' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
          <p style={{ fontSize: 14 }}>Tidak ada task di kategori ini</p>
        </div>
      ) : filtered.map(t => {
        const dl = daysLeft(t.deadline);
        return (
          <div key={t.id} className="task-card" onClick={() => setModal(t)}>
            <div style={{
              width: 3, borderRadius: 2, background: diffColor(t.difficulty),
              alignSelf: 'stretch', minHeight: 36, flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div className="task-name">{t.name}</div>
              <div className="task-meta">
                <span>📅 {t.deadline}</span>
                <span style={{ color: dl < 0 ? '#EF4444' : dl <= 1 ? '#F59E0B' : '#4B6A8A' }}>
                  {dl < 0 ? `⚠️ ${-dl}h terlambat` : dl === 0 ? '🔥 Hari ini!' : dl === 1 ? '⏰ Besok' : `${dl}h lagi`}
                </span>
                <span style={{ color: diffColor(t.difficulty) }}>◆ {diffLabel(t.difficulty)}</span>
                <span>⏱ {t.hours}j</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
              <StatusBadge status={t.status} />
              <button
                className="btn btn-danger"
                onClick={e => { e.stopPropagation(); del(t.id); }}
              >Hapus</button>
            </div>
          </div>
        );
      })}

      {tasks.filter(t => t.status === 'pending' && t.hours > 2).length > 0 && (
        <div style={{
          marginTop: 16, padding: '12px 16px',
          background: 'rgba(59,130,246,0.06)',
          border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: 10, fontSize: 12, color: '#60A5FA',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⚡</span>
          <span>
            Smart Scheduling akan membagi{' '}
            <strong>{tasks.filter(t => t.status === 'pending' && t.hours > 2).length}</strong>{' '}
            task besar secara otomatis ke slot waktu kosong sesuai level energimu.
          </span>
        </div>
      )}

      {modal && (
        <TaskModal
          task={modal === 'add' ? null : modal}
          onSave={saveTask}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
