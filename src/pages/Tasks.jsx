import { useState, useMemo } from 'react';
import TaskModal from '../components/TaskModal';
import ConfirmModal from '../components/ConfirmModal';
import { StatusBadge } from '../components/Badge';
import { diffColor, diffLabel, daysLeft, checkDeadlineFeasibility } from '../utils/helpers';

const FILTERS = [
  ['all', 'Semua'],
  ['pending', 'Pending'],
  ['in-progress', 'Dikerjakan'],
  ['done', 'Selesai'],
  ['overdue', 'Overdue'],
];

function formatHours(h) {
  const totalMin = Math.round((h || 0) * 60);
  const hours = Math.floor(totalMin / 60);
  const mins  = totalMin % 60;
  if (hours > 0 && mins > 0) return `${hours}j ${mins}m`;
  if (hours > 0) return `${hours}j`;
  return `${mins}m`;
}

// ── Feasibility warning banner per-task ──────────────────────────────────────
function FeasibilityWarning({ task, energy, isInfeasible }) {
  if (task.status === 'done' || task.status === 'overdue') return null;

  // If the scheduler flagged it infeasible, show that warning
  if (isInfeasible) {
    return (
      <div
        onClick={e => e.stopPropagation()}
        style={{
          marginTop: 7, padding: '7px 10px', borderRadius: 7,
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.22)',
          fontSize: 11, color: '#FCD34D',
          lineHeight: 1.5, display: 'flex', gap: 6, alignItems: 'flex-start',
        }}
      >
        <span style={{ flexShrink: 0 }}>⚠️</span>
        <span>Estimasi waktu task ini tidak muat dalam jadwal sebelum deadline. Pertimbangkan kurangi jam atau perpanjang deadline.</span>
      </div>
    );
  }

  const { feasible, availableHours, hoursNeeded, deficit, daysUntil } =
    checkDeadlineFeasibility(task, energy);
  if (feasible) return null;
  const isUrgent = daysUntil <= 1;
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        marginTop: 7, padding: '7px 10px', borderRadius: 7,
        background: isUrgent ? 'rgba(239,68,68,0.09)' : 'rgba(245,158,11,0.08)',
        border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.22)'}`,
        fontSize: 11,
        color: isUrgent ? '#FCA5A5' : '#FCD34D',
        lineHeight: 1.5, display: 'flex', gap: 6, alignItems: 'flex-start',
      }}
    >
      <span style={{ flexShrink: 0 }}>{isUrgent ? '🚨' : '⚠️'}</span>
      <span>
        {isUrgent
          ? <>Task ini butuh <strong>{formatHours(hoursNeeded)}</strong> tapi deadline {daysUntil === 0 ? 'hari ini' : 'besok'}. Kurangi scope atau minta perpanjangan.</>
          : <>Estimasi <strong>{formatHours(hoursNeeded)}</strong> melebihi waktu tersedia (~<strong>{formatHours(availableHours)}</strong>). Kekurangan <strong>{formatHours(deficit)}</strong> — pertimbangkan kurangi jam atau perpanjang deadline.</>
        }
      </span>
    </div>
  );
}

export default function Tasks({ tasks, sessions = [], addTask, updateTask, updateSession, deleteTask, onToast, energy, infeasibleTaskIds = [] }) {
  const [filter, setFilter]               = useState('all');
  const [search, setSearch]               = useState('');
  const [modal, setModal]                 = useState(null);
  const [deleting, setDeleting]           = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const counts = {
    all:           tasks.length,
    pending:       tasks.filter(t => t.status === 'pending').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    done:          tasks.filter(t => t.status === 'done').length,
    overdue:       tasks.filter(t => t.status === 'overdue').length,
  };

  const infeasibleCount = useMemo(() =>
    tasks.filter(t => {
      if (t.status === 'done' || t.status === 'overdue') return false;
      return infeasibleTaskIds.includes(t.id) || !checkDeadlineFeasibility(t, energy).feasible;
    }).length,
    [tasks, energy, infeasibleTaskIds]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks
      .filter(t => filter === 'all' || t.status === filter)
      .filter(t => {
        if (!q) return true;
        return (
          t.name.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (t.deadline || '').includes(q)
        );
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }, [tasks, filter, search]);

  const saveTask = async (form) => {
    if (modal === 'add') {
      await addTask(form);
    } else {
      await updateTask(modal.id, form);
    }
    setModal(null);
  };

  const requestDelete = (e, task) => {
    e.stopPropagation();
    setConfirmTarget(task);
  };

  const confirmDelete = async () => {
    const task = confirmTarget;
    setConfirmTarget(null);
    setDeleting(task.id);
    try {
      await deleteTask(task.id);
      onToast?.(`"${task.name}" berhasil dihapus`, 'success');
    } catch (err) {
      console.error('Delete task failed:', err);
      onToast?.(`Gagal menghapus "${task.name}"`, 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusChange = async (e, task, newStatus) => {
    e.stopPropagation();
    if (updatingStatus === task.id) return;
    setUpdatingStatus(task.id);
    try {
      await updateTask(task.id, { status: newStatus });

      // If marking done from Tasks page, also mark all undone sessions as done
      if (newStatus === 'done' && updateSession) {
        const undone = sessions.filter(s => s.taskId === task.id && !s.isDone);
        await Promise.all(undone.map(s => updateSession(s.id, { isDone: true })));
      }

      // If un-doing (in-progress), un-mark sessions if all were done
      if (newStatus === 'in-progress' && updateSession) {
        const taskSessions = sessions.filter(s => s.taskId === task.id);
        const allWereDone  = taskSessions.every(s => s.isDone);
        if (allWereDone) {
          await Promise.all(taskSessions.map(s => updateSession(s.id, { isDone: false })));
        }
      }

      onToast?.(
        newStatus === 'done'
          ? `✅ "${task.name}" selesai!`
          : `▶ "${task.name}" sedang dikerjakan`,
        'success'
      );
    } catch (err) {
      console.error('Status update failed:', err);
      onToast?.('Gagal mengubah status', 'error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleCardClick = (task) => {
    if (updatingStatus === task.id || deleting === task.id) return;
    setModal(task);
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 21, fontWeight: 800, color: '#E2ECFF' }}>📋 Task Management</h2>
        <button className="btn btn-primary" onClick={() => setModal('add')}>+ Tambah Task</button>
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: 14, color: '#4B6A8A', pointerEvents: 'none',
        }}>🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari task berdasarkan nama, deskripsi, atau deadline..."
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(11,22,45,0.6)',
            border: `1px solid ${search ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.15)'}`,
            borderRadius: 10, color: '#C8DCFF',
            fontSize: 13, padding: '10px 12px 10px 36px',
            outline: 'none', transition: 'border-color .15s',
            fontFamily: 'Outfit, sans-serif',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
          onBlur={e => e.target.style.borderColor = search ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.15)'}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: '#4B6A8A',
              cursor: 'pointer', fontSize: 16, padding: '0 4px', lineHeight: 1,
            }}
          >✕</button>
        )}
      </div>

      {/* Infeasible banner */}
      {infeasibleCount > 0 && !search && (
        <div style={{
          marginBottom: 14, padding: '11px 14px',
          background: 'rgba(245,158,11,0.07)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 10, fontSize: 12, color: '#FCD34D',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⏱️</span>
          <span>
            <strong>{infeasibleCount} task</strong> memiliki estimasi yang melebihi sisa waktu sebelum deadline.
            Sistem tetap menjadwalkan semaksimal mungkin — pertimbangkan kurangi scope atau perpanjang deadline.
          </span>
        </div>
      )}

      {/* Filter tabs */}
      <div className="pill-tabs">
        {FILTERS.map(([k, lbl]) => (
          <div key={k} className={`pill-tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>
            {lbl} ({counts[k]})
          </div>
        ))}
      </div>

      {/* Search result info */}
      {search && (
        <div style={{ fontSize: 12, color: '#4B6A8A', marginBottom: 10 }}>
          {filtered.length === 0
            ? `Tidak ada hasil untuk "${search}"`
            : `${filtered.length} task ditemukan untuk "${search}"`}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#3D5A7A' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>{search ? '🔍' : '📭'}</div>
          <p style={{ fontSize: 14 }}>
            {search ? `Tidak ada task yang cocok dengan "${search}"` : 'Tidak ada task di kategori ini'}
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="btn btn-ghost"
              style={{ marginTop: 10, fontSize: 12 }}
            >Hapus pencarian</button>
          )}
        </div>
      ) : filtered.map(t => {
        const dl = daysLeft(t.deadline);
        const isUpdating = updatingStatus === t.id;
        const isDeleting = deleting === t.id;

        return (
          <div
            key={t.id}
            className="task-card"
            onClick={() => handleCardClick(t)}
            style={{ opacity: isDeleting ? 0.5 : 1, flexWrap: 'wrap' }}
          >
            <div style={{ width: 3, borderRadius: 2, background: diffColor(t.difficulty), alignSelf: 'stretch', minHeight: 36, flexShrink: 0 }} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="task-name" style={{ textDecoration: t.status === 'done' ? 'line-through' : 'none', color: t.status === 'done' ? '#4B6A8A' : '#E2ECFF' }}>
                {t.name}
              </div>
              <div className="task-meta">
                <span>📅 {t.deadline}</span>
                <span style={{ color: t.status === 'done' ? '#4B6A8A' : (dl < 0 ? '#EF4444' : dl <= 1 ? '#F59E0B' : '#4B6A8A') }}>
                  {t.status === 'done' ? '✅ Selesai'
                    : (dl < 0 ? `⚠️ ${-dl}h terlambat` : dl === 0 ? '🔥 Hari ini!' : dl === 1 ? '⏰ Besok' : `${dl}h lagi`)}
                </span>
                <span style={{ color: diffColor(t.difficulty) }}>◆ {diffLabel(t.difficulty)}</span>
                <span>⏱ {formatHours(t.hours)}</span>
                {(() => {
                  const taskSessions = sessions.filter(s => s.taskId === t.id);
                  if (taskSessions.length === 0) return null;
                  const doneSessions = taskSessions.filter(s => s.isDone).length;
                  return (
                    <span style={{ color: doneSessions === taskSessions.length ? '#10B981' : '#60A5FA' }}>
                      📋 {doneSessions}/{taskSessions.length} sesi
                    </span>
                  );
                })()}
              </div>
              <FeasibilityWarning task={t} energy={energy} isInfeasible={infeasibleTaskIds.includes(t.id)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <StatusBadge status={t.status} />
              <div style={{ display: 'flex', gap: 5 }}>
                {t.status !== 'done' && (
                  <button
                    className="btn btn-ghost"
                    style={{
                      padding: '4px 9px', fontSize: 11,
                      opacity: isUpdating ? 0.6 : 1,
                      cursor: isUpdating ? 'wait' : 'pointer',
                      minWidth: 72,
                      ...((t.status === 'in-progress') && !isUpdating ? {
                        color: '#10B981',
                        borderColor: 'rgba(16,185,129,0.3)',
                        background: 'rgba(16,185,129,0.07)',
                      } : {}),
                    }}
                    disabled={isUpdating}
                    onClick={e => handleStatusChange(e, t,
                      t.status === 'in-progress' ? 'done' : 'in-progress'
                    )}
                  >
                    {isUpdating
                      ? '⏳'
                      : t.status === 'in-progress'
                        ? '✓ Selesai'
                        : '▶ Mulai'}
                  </button>
                )}
                <button
                  className="btn btn-danger"
                  onClick={e => requestDelete(e, t)}
                  disabled={isDeleting || isUpdating}
                >
                  {isDeleting ? '...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Smart scheduling hint */}
      {!search && tasks.filter(t => t.status === 'pending' && t.hours > 2).length > 0 && (
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
          sessions={sessions}
          onSave={saveTask}
          onClose={() => setModal(null)}
        />
      )}

      {confirmTarget && (
        <ConfirmModal
          title="Hapus Task?"
          message={
            <>
              Task <strong style={{ color: '#E2ECFF' }}>"{confirmTarget.name}"</strong> akan dihapus
              permanen beserta semua sesi terjadwalnya.
              <br /><br />
              <span style={{ color: '#EF4444', fontSize: 12 }}>Tindakan ini tidak dapat dibatalkan.</span>
            </>
          }
          confirmLabel="Ya, Hapus"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  );
}
