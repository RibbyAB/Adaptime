import { useState } from 'react';
import { formatHour } from '../utils/scheduler';
import { diffColor } from '../utils/helpers';

export default function SessionCard({ session, onUpdate, isPast }) {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState(session.note || '');
  const [saving, setSaving] = useState(false);

  const checklist = session.checklist || [];
  const doneCount = checklist.filter(i => i.done).length;

  const toggleDone = async () => {
    setSaving(true);
    await onUpdate(session.id, { isDone: !session.isDone });
    setSaving(false);
  };

  const toggleCheckItem = async (itemId) => {
    const updated = checklist.map(i => i.id === itemId ? { ...i, done: !i.done } : i);
    await onUpdate(session.id, { checklist: updated });
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
        {/* Header row — click to expand */}
        <div
          onClick={() => setExpanded(p => !p)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer' }}
        >
          {/* Difficulty bar */}
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

            {/* Checklist */}
            {checklist.length > 0 && (
              <div style={{ marginTop: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#4B6A8A', fontWeight: 700, marginBottom: 6 }}>CHECKLIST SESI</div>
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

            {/* Note */}
            <div style={{ marginTop: checklist.length > 0 ? 0 : 10 }}>
              <div style={{ fontSize: 11, color: '#4B6A8A', fontWeight: 700, marginBottom: 5 }}>CATATAN SESI</div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                onBlur={saveNote}
                placeholder="Apa yang sudah dikerjakan? (opsional)"
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

      {/* Full modal */}
      {showModal && (
        <SessionModal
          session={session}
          note={note}
          setNote={setNote}
          onUpdate={onUpdate}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

function SessionModal({ session, note, setNote, onUpdate, onClose }) {
  const [localNote, setLocalNote] = useState(note);
  const [checklist, setChecklist] = useState(session.checklist || []);
  const [newItem, setNewItem]     = useState('');
  const [saving, setSaving]       = useState(false);

  const save = async () => {
    setSaving(true);
    await onUpdate(session.id, {
      note: localNote,
      checklist,
    });
    setNote(localNote);
    setSaving(false);
    onClose();
  };

  const toggleItem = (id) => {
    setChecklist(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    setChecklist(prev => [...prev, { id: Date.now(), text: newItem.trim(), done: false }]);
    setNewItem('');
  };

  const removeItem = (id) => setChecklist(prev => prev.filter(i => i.id !== id));

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

        {/* Session info */}
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

        {/* Mark done */}
        <div
          onClick={async () => { await onUpdate(session.id, { isDone: !session.isDone }); }}
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

        {/* Checklist */}
        <div className="form-group">
          <label style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Checklist Sesi</span>
            <span style={{ fontSize: 10, color: '#3D5A7A' }}>opsional</span>
          </label>
          {checklist.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <div
                onClick={() => toggleItem(item.id)}
                style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
                  border: `2px solid ${item.done ? '#10B981' : '#3D5A7A'}`,
                  background: item.done ? '#10B981' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {item.done && <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>✓</span>}
              </div>
              <span style={{ flex: 1, fontSize: 13, color: item.done ? '#3D5A7A' : '#A3C0E0', textDecoration: item.done ? 'line-through' : 'none' }}>
                {item.text}
              </span>
              <button className="btn btn-ghost" style={{ padding: '2px 7px', fontSize: 11, color: '#EF4444' }} onClick={() => removeItem(item.id)}>✕</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input
              className="inp"
              style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}
              placeholder="Tambah item checklist..."
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
            />
            <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={addItem}>+</button>
          </div>
        </div>

        {/* Note */}
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
            {saving ? '⏳ Menyimpan...' : '💾 Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
