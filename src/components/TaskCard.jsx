import { useState } from 'react';
import { diffColor, daysLeft } from '../utils/helpers';
import { StatusBadge } from './Badge';

export default function TaskCard({ task, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving]     = useState(false);

  const dl        = daysLeft(task.deadline);
  const checklist = task.checklist || [];
  const doneCount = checklist.filter(i => i.done).length;

  const toggleCheckItem = async (itemId) => {
    const updated = checklist.map(i => i.id === itemId ? { ...i, done: !i.done } : i);
    setSaving(true);
    await onUpdate(task.id, { checklist: updated });
    setSaving(false);
  };

  const setStatus = async (status) => {
    setSaving(true);
    await onUpdate(task.id, { status });
    setSaving(false);
  };

  return (
    <div style={{
      borderRadius: 10, marginBottom: 8, overflow: 'hidden',
      border: `1px solid ${task.status === 'done' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.08)'}`,
      background: task.status === 'done' ? 'rgba(16,185,129,0.03)' : 'rgba(11,22,45,0.3)',
      transition: 'all .15s',
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(p => !p)}
        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', cursor: 'pointer' }}
      >
        <div style={{ width: 3, height: 36, borderRadius: 2, background: diffColor(task.difficulty), flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: task.status === 'done' ? '#34D399' : '#C8DCFF', textDecoration: task.status === 'done' ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {task.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <span style={{ fontSize: 11, color: dl <= 0 ? '#EF4444' : dl <= 2 ? '#F59E0B' : '#4B6A8A' }}>
              {dl < 0 ? `⚠️ ${-dl}h terlambat` : dl === 0 ? '🔥 Deadline hari ini!' : dl === 1 ? '⏰ Besok deadline' : `📅 ${dl} hari lagi`}
            </span>
            {checklist.length > 0 && (
              <span style={{ fontSize: 10, color: doneCount === checklist.length ? '#10B981' : '#4B6A8A' }}>
                ☑ {doneCount}/{checklist.length}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <StatusBadge status={task.status} />
          <span style={{ fontSize: 11, color: '#4B6A8A' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: '0 12px 12px 12px', borderTop: '1px solid rgba(59,130,246,0.07)' }}>

          {/* Description */}
          {task.description && (
            <div style={{ marginTop: 10, marginBottom: 10, fontSize: 12, color: '#7BA5C8', lineHeight: 1.5, background: 'rgba(59,130,246,0.04)', padding: '8px 10px', borderRadius: 7 }}>
              {task.description}
            </div>
          )}

          {/* Checklist */}
          {checklist.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: '#4B6A8A', fontWeight: 700, marginBottom: 6 }}>CHECKLIST</div>
              {checklist.map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleCheckItem(item.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer' }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                    border: `2px solid ${item.done ? '#10B981' : '#3D5A7A'}`,
                    background: item.done ? '#10B981' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item.done && <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 12, color: item.done ? '#3D5A7A' : '#A3C0E0', textDecoration: item.done ? 'line-through' : 'none' }}>
                    {item.text}
                  </span>
                </div>
              ))}
              {saving && <div style={{ fontSize: 10, color: '#4B6A8A', marginTop: 4 }}>Menyimpan...</div>}
            </div>
          )}

          {/* Status quick-change */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: '#4B6A8A', fontWeight: 700, marginBottom: 6 }}>UBAH STATUS</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                ['pending',     '⏳ Pending',    '#4B6A8A'],
                ['in-progress', '🔵 Dikerjakan', '#3B82F6'],
                ['done',        '✅ Selesai',     '#10B981'],
                ['overdue',     '🔴 Overdue',    '#EF4444'],
              ].map(([status, label, color]) => (
                <button
                  key={status}
                  onClick={() => setStatus(status)}
                  style={{
                    fontSize: 11, padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
                    background: task.status === status ? `${color}22` : 'transparent',
                    border: `1px solid ${task.status === status ? color : 'rgba(59,130,246,0.15)'}`,
                    color: task.status === status ? color : '#4B6A8A',
                    transition: 'all .12s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
