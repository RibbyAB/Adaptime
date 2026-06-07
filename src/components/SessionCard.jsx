import { useState } from 'react';
import { formatHour } from '../utils/scheduler';
import { diffColor } from '../utils/helpers';

/**
 * SessionCard — shows a scheduled session.
 * Checklist comes from the TASK (shared), not the session.
 * Session notes remain session-specific (work log per sitting).
 */
export default function SessionCard({ session, task, onUpdate, onTaskUpdate, isPast }) {
  const [expanded, setExpanded]   = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [note, setNote]           = useState(session.note || '');
  const [saving, setSaving]       = useState(false);

  // Checklist lives on the task document
  const checklist = task?.checklist || [];
  const doneCount = checklist.filter(i => i.done).length;

  const toggleDone = async () => {
    setSaving(true);
    await onUpdate(session.id, { isDone: !session.isDone });
    setSaving(false);
  };

  // Toggle a checklist item on the TASK (not the session)
  const toggleCheckItem = async (itemId) => {
    if (!task) return;
    const updated = checklist.map(i => i.id === itemId ? { ...i, done: !i.done } : i);
    await onTaskUpdate(task.id, { checklist: updated });
  };

  const saveNote = async () => {
    setSaving(true);
    await onUpdate(session.id, { note });
    setSaving(false);
  };

  const dur = Math.round((session.endH - session.startH) * 60);

  return (
    <>
      <div style={{
        borderRadius: 10, marginBottom: 8, overflow: 'hidden',
        border: `1px solid ${session.isDone ? 'rgba(16,185,129,0.2)' : isPast ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.12)'}`,
        background: session.isDone ? 'rgba(16,185,129,0.04)' : isPast ? 'rgba(11,22,45,0.3)' : 'rgba(59,130,246,0.04)',
        opacity: isPast && !session.isDone ? 0.7 : 1,
        transition: 'all .15s',
      }}>
        {/* Header row */}
        <div onClick={() => setExpanded(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer' }}>
          <div style={{ width: 3, height: 36, borderRadius: 2, background: diffColor(session.difficulty), flexShrink: 0 }} />

          {/* Done checkbox */}
          <div
            onClick={e => { e.stopPropagation(); toggleDone(); }}
            style={{
              width: 20, height: 20, borderRadius: 5, flexShrink: 0, cursor: 'pointer',
              border: `2px solid ${session.isDone ? '#10B981' : '#3D5A7A'}`,
              background: session.isDone ? '#10B981' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s',
            }}
          >
            {session.isDone && <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>✓</span>}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: session.isDone ? '#34D399' : '#C8DCFF', textDecoration: session.isDone ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {session.taskName}
              {session.totalSessions > 1 && (
                <span style={{ fontSize: 10, color: '#4B6A8A', marginLeft: 6 }}>
                  Sesi {session.sessionNum}/{session.totalSessions}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#60A5FA', marginTop: 1 }}>
              {formatHour(session.startH)} – {formatHour(session.endH)}
              <span style={{ color: '#3D5A7A', marginLeft: 6 }}>({dur}m)</span>
              {checklist.length > 0 && (
                <span style={{ marginLeft: 8, color: doneCount === checklist.length ? '#10B981' : '#4B6A8A' }}>
                  ☑ {doneCount}/{checklist.length}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: '#3D5A7A' }}>⚡{session.energyLevel}/5</span>
            <span style={{ fontSize: 11, color: '#4B6A8A' }}>{expanded ? '▲' : '▼'}</span>
          </div>
        </div>

        {/* Expanded panel */}
        {expanded && (
          <div style={{ padding: '0 12px 12px 12px', borderTop: '1px solid rgba(59,130,246,0.08)' }}>

            {/* Task checklist — shared with Task Management */}
            {checklist.length > 0 && (
              <div style={{ marginTop: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#4B6A8A', fontWeight: 700, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <span>CHECKLIST TASK</span>
                  <span style={{ color: '#3D5A7A', fontWeight: 400 }}>{doneCount}/{checklist.length} selesai</span>
                </div>
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
              </div>
            )}

            {/* Session note — per-session work log */}
            <div style={{ marginTop: checklist.length > 0 ? 0 : 10 }}>
              <div style={{ fontSize: 11, color: '#4B6A8A', fontWeight: 700, marginBottom: 5 }}>CATATAN SESI</div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                onBlur={saveNote}
                placeholder="Apa yang sudah dikerjakan di sesi ini? (opsional)"
                rows={2}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(11,22,45,0.5)', border: '1px solid rgba(59,130,246,0.15)',
                  borderRadius: 7, color: '#A3C0E0', fontSize: 12, padding: '7px 10px',
                  resize: 'vertical', outline: 'none',
                }}
              />
              {saving && <span style={{ fontSize: 10, color: '#4B6A8A' }}>Menyimpan...</span>}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button
                className="btn btn-ghost"
                style={{ fontSize: 11, padding: '5px 12px', flex: 1 }}
                onClick={e => { e.stopPropagation(); toggleDone(); }}
              >
                {session.isDone ? '↩ Tandai Belum' : '✓ Tandai Selesai'}
              </button>
              <button
                className="btn btn-primary"
                style={{ fontSize: 11, padding: '5px 12px', flex: 1 }}
                onClick={e => { e.stopPropagation(); setShowModal(true); setExpanded(false); }}
              >
                📝 Detail Lengkap
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <SessionModal
          session={session}
          task={task}
          note={note}
          setNote={setNote}
          onUpdate={onUpdate}
          onTaskUpdate={onTaskUpdate}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

function SessionModal({ session, task, note, setNote, onUpdate, onTaskUpdate, onClose }) {
  const [localNote, setLocalNote] = useState(note);
  const [saving, setSaving]       = useState(false);

  // Checklist comes from task — read-live so it stays in sync
  const checklist = task?.checklist || [];
  const doneCount = checklist.filter(i => i.done).length;

  const toggleItem = async (id) => {
    if (!task) return;
    const updated = checklist.map(i => i.id === id ? { ...i, done: !i.done } : i);
    await onTaskUpdate(task.id, { checklist: updated });
  };

  const save = async () => {
    setSaving(true);
    await onUpdate(session.id, { note: localNote });
    setNote(localNote);
    setSaving(false);
    onClose();
  };

  const dur = Math.round((session.endH - session.startH) * 60);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 style={{ marginBottom: 4 }}>📝 {session.taskName}</h3>
            {session.totalSessions > 1 && (
              <div style={{ fontSize: 12, color: '#4B6A8A' }}>Sesi {session.sessionNum} dari {session.totalSessions}</div>
            )}
          </div>
          <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={onClose}>✕</button>
        </div>

        {/* Session info chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            [`🕐 ${formatHour(session.startH)} – ${formatHour(session.endH)}`, '#60A5FA'],
            [`⏱ ${dur} menit`, '#7BA5C8'],
            [`${session.slotIcon} ${session.slotLabel}`, '#7BA5C8'],
            [`⚡ Energi ${session.energyLevel}/5`, '#F59E0B'],
          ].map(([text, color]) => (
            <span key={text} style={{ fontSize: 11, color, background: 'rgba(59,130,246,0.06)', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(59,130,246,0.1)' }}>
              {text}
            </span>
          ))}
        </div>

        {/* Mark session done */}
        <div
          onClick={async () => await onUpdate(session.id, { isDone: !session.isDone })}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
            borderRadius: 9, marginBottom: 16, cursor: 'pointer',
            background: session.isDone ? 'rgba(16,185,129,0.08)' : 'rgba(59,130,246,0.06)',
            border: `1px solid ${session.isDone ? 'rgba(16,185,129,0.25)' : 'rgba(59,130,246,0.15)'}`,
          }}
        >
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            border: `2px solid ${session.isDone ? '#10B981' : '#3D5A7A'}`,
            background: session.isDone ? '#10B981' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {session.isDone && <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>✓</span>}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: session.isDone ? '#34D399' : '#7BA5C8' }}>
            {session.isDone ? 'Sesi ini sudah selesai' : 'Tandai sesi ini selesai'}
          </span>
        </div>

        {/* Task checklist — shared, reflects in Task Management */}
        {checklist.length > 0 && (
          <div className="form-group">
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Checklist Task</span>
              <span style={{ fontSize: 10, color: doneCount === checklist.length ? '#10B981' : '#3D5A7A' }}>
                {doneCount}/{checklist.length} selesai
              </span>
            </label>
            {checklist.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, cursor: 'pointer' }} onClick={() => toggleItem(item.id)}>
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${item.done ? '#10B981' : '#3D5A7A'}`,
                  background: item.done ? '#10B981' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.done && <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>✓</span>}
                </div>
                <span style={{ flex: 1, fontSize: 13, color: item.done ? '#3D5A7A' : '#A3C0E0', textDecoration: item.done ? 'line-through' : 'none' }}>
                  {item.text}
                </span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: '#3D5A7A', marginTop: 4 }}>
              💡 Perubahan checklist langsung tersimpan ke task
            </div>
          </div>
        )}

        {/* Session note */}
        <div className="form-group">
          <label style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Catatan Sesi</span>
            <span style={{ fontSize: 10, color: '#3D5A7A' }}>opsional</span>
          </label>
          <textarea
            className="inp"
            value={localNote}
            onChange={e => setLocalNote(e.target.value)}
            placeholder="Apa yang sudah dikerjakan di sesi ini?"
            rows={3}
            style={{ resize: 'vertical', fontSize: 13 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Batal</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={save} disabled={saving}>
            {saving ? '⏳ Menyimpan...' : '💾 Simpan Catatan'}
          </button>
        </div>
      </div>
    </div>
  );
}
