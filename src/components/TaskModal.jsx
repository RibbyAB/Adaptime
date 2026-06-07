import { useState, useMemo } from 'react';
import { diffColor, diffLabel, checkFeasibility } from '../utils/helpers';

const PREF_SESSION_OPTIONS = [
  { value: null, label: 'Auto (sistem pilihkan)' },
  { value: 0.5,  label: '30 menit' },
  { value: 1,    label: '1 jam' },
  { value: 1.5,  label: '1 jam 30 menit' },
  { value: 2,    label: '2 jam' },
  { value: 2.5,  label: '2 jam 30 menit' },
  { value: 3,    label: '3 jam' },
];

function ChecklistEditor({ items, onChange }) {
  const addItem    = () => onChange([...items, { id: Date.now(), text: '', done: false }]);
  const updateItem = (id, field, val) => onChange(items.map(i => i.id === id ? { ...i, [field]: val } : i));
  const removeItem = (id) => onChange(items.filter(i => i.id !== id));

  return (
    <div>
      {items.map(item => (
        <div key={item.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <div
            onClick={() => updateItem(item.id, 'done', !item.done)}
            style={{
              width: 18, height: 18, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
              border: `2px solid ${item.done ? '#10B981' : '#3D5A7A'}`,
              background: item.done ? '#10B981' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {item.done && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
          </div>
          <input
            className="inp"
            style={{ flex: 1, padding: '6px 10px', fontSize: 12, textDecoration: item.done ? 'line-through' : 'none', color: item.done ? '#3D5A7A' : undefined }}
            placeholder="Item checklist..."
            value={item.text}
            onChange={e => updateItem(item.id, 'text', e.target.value)}
          />
          <button
            className="btn btn-ghost"
            style={{ padding: '4px 7px', fontSize: 11, color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
            onClick={() => removeItem(item.id)}
          >✕</button>
        </div>
      ))}
      <button className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 12px', marginTop: 2 }} onClick={addItem}>
        + Tambah Item
      </button>
    </div>
  );
}

export default function TaskModal({ task, onSave, onClose, sessions = [] }) {
  const [f, setF] = useState(() => {
    if (!task) return {
      name: '', deadline: '', difficulty: 3,
      status: 'pending', timePref: 'morning',
      hours: 1, minutes: 0,
      prefSessionHours: null, description: '', checklist: [],
    };
    const totalMins = Math.round((task.hours || 0) * 60);
    return { ...task, hours: Math.floor(totalMins / 60), minutes: totalMins % 60 };
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  // ── Computed values ──────────────────────────────────────────────────────────
  const taskSessions    = sessions.filter(s => s.taskId === task?.id);
  const doneSessions    = taskSessions.filter(s => s.isDone);
  const doneHours       = doneSessions.reduce((acc, s) => acc + (s.endH - s.startH), 0);
  const doneHoursRound  = Math.round(doneHours * 100) / 100;

  // Hours floor: can't go below done session hours
  const totalHoursInput = (parseInt(f.hours) || 0) + (parseInt(f.minutes) || 0) / 60;
  const belowFloor      = task && doneHours > 0 && totalHoursInput < doneHours;

  // Live feasibility warning
  const feasibility = useMemo(() => {
    if (!f.deadline || totalHoursInput <= 0) return null;
    return checkFeasibility(f.deadline, totalHoursInput);
  }, [f.deadline, totalHoursInput]);

  const save = () => {
    if (!f.name.trim()) { alert('Nama task wajib diisi!'); return; }
    if (!f.deadline)    { alert('Deadline wajib diisi!'); return; }
    if (totalHoursInput < 0.25) { alert('Estimasi waktu minimal 15 menit!'); return; }
    if (belowFloor) {
      alert(`Kamu sudah menyelesaikan ${doneHoursRound}j dari task ini. Estimasi tidak bisa kurang dari ${doneHoursRound}j.`);
      return;
    }
    onSave({ ...f, hours: Math.round(totalHoursInput * 100) / 100 });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <h3>{task ? '✏️ Edit Task' : '➕ Tambah Task Baru'}</h3>

        <div className="form-group">
          <label>Nama Task *</label>
          <input className="inp" placeholder="Nama task kamu..." value={f.name} onChange={e => set('name', e.target.value)} />
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Deskripsi</span><span style={{ fontSize: 10, color: '#3D5A7A' }}>opsional</span>
          </label>
          <textarea
            className="inp" placeholder="Apa yang perlu dikerjakan? (opsional)"
            value={f.description || ''} onChange={e => set('description', e.target.value)}
            rows={2} style={{ resize: 'vertical', fontSize: 13 }}
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label>Deadline *</label>
            <input className="inp" type="date" value={f.deadline} onChange={e => set('deadline', e.target.value)} />
          </div>

          <div className="form-group">
            <label>Estimasi Waktu</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ flex: 1 }}>
                <input
                  className="inp" type="number" min="0" max="99" placeholder="0"
                  value={f.hours === 0 ? '' : f.hours}
                  onChange={e => set('hours', Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ textAlign: 'center' }}
                />
                <div style={{ fontSize: 10, color: '#3D5A7A', textAlign: 'center', marginTop: 2 }}>jam</div>
              </div>
              <div style={{ flex: 1 }}>
                <input
                  className="inp" type="number" min="0" max="59" placeholder="0"
                  value={f.minutes === 0 ? '' : f.minutes}
                  onChange={e => set('minutes', Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  style={{ textAlign: 'center' }}
                />
                <div style={{ fontSize: 10, color: '#3D5A7A', textAlign: 'center', marginTop: 2 }}>menit</div>
              </div>
            </div>
          </div>
        </div>

        {/* Hours floor warning */}
        {belowFloor && (
          <div style={{ fontSize: 12, color: '#F59E0B', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
            ⚠️ Kamu sudah menyelesaikan <strong>{doneHoursRound}j</strong> dari task ini. Estimasi tidak bisa dikurangi di bawah {doneHoursRound}j.
          </div>
        )}

        {/* Live feasibility warning */}
        {feasibility && !feasibility.feasible && (
          <div style={{ fontSize: 12, color: '#F97316', background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
            ⏰ Estimasi waktu (<strong>{totalHoursInput.toFixed(1)}j</strong>) melebihi sisa waktu sebelum deadline
            (<strong>{Math.max(0, feasibility.remainingHours).toFixed(1)}j</strong> tersisa).
            Task ini mungkin tidak bisa selesai tepat waktu.
          </div>
        )}

        <div className="form-group">
          <label>
            Tingkat Kesulitan:{' '}
            <span style={{ color: diffColor(f.difficulty) }}>{diffLabel(f.difficulty)} ({f.difficulty}/5)</span>
          </label>
          <input type="range" min="1" max="5" value={f.difficulty}
            onChange={e => set('difficulty', parseInt(e.target.value))}
            style={{ marginTop: 7, width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#3D5A7A', marginTop: 2 }}>
            <span>1 – Mudah</span><span>3 – Sedang</span><span>5 – Sulit</span>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label>Status</label>
            <select className="inp" value={f.status} onChange={e => set('status', e.target.value)}>
              <option value="pending">Pending</option>
              <option value="in-progress">Sedang Dikerjakan</option>
              <option value="done">Selesai</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="form-group">
            <label>Preferensi Waktu</label>
            <select className="inp" value={f.timePref} onChange={e => set('timePref', e.target.value)}>
              <option value="anytime">🕐 Bebas (00–24)</option>
              <option value="morning">🌅 Pagi (06–12)</option>
              <option value="afternoon">☀️ Siang (12–17)</option>
              <option value="evening">🌆 Sore (17–20)</option>
              <option value="night">🌙 Malam (20–24)</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#60A5FA', cursor: 'pointer', marginBottom: 12, userSelect: 'none' }}
          onClick={() => setShowAdvanced(p => !p)}>
          {showAdvanced ? '▼' : '▶'} Opsi Lanjutan
        </div>

        {showAdvanced && (
          <>
            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Preferensi Panjang Sesi</span>
                <span style={{ fontSize: 10, color: '#3D5A7A' }}>opsional</span>
              </label>
              <select className="inp"
                value={f.prefSessionHours ?? ''}
                onChange={e => set('prefSessionHours', e.target.value === '' ? null : parseFloat(e.target.value))}>
                {PREF_SESSION_OPTIONS.map(o => (
                  <option key={o.value ?? 'auto'} value={o.value ?? ''}>{o.label}</option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: '#3D5A7A', marginTop: 4 }}>
                Sistem akan membagi task menjadi sesi-sesi dengan panjang ini.
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Checklist Task</span>
                <span style={{ fontSize: 10, color: '#3D5A7A' }}>opsional</span>
              </label>
              <ChecklistEditor items={f.checklist || []} onChange={v => set('checklist', v)} />
              {(f.checklist || []).length > 0 && (
                <div style={{ fontSize: 11, color: '#3D5A7A', marginTop: 6 }}>
                  Centang item saat kamu selesai mengerjakannya.
                </div>
              )}
            </div>
          </>
        )}

        {/* Session progress summary (edit mode only) */}
        {task && taskSessions.length > 0 && (
          <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#60A5FA', marginBottom: 10 }}>
              📋 Progress Sesi ({doneSessions.length}/{taskSessions.length} selesai)
            </div>
            {taskSessions.sort((a, b) => a.date.localeCompare(b.date) || a.startH - b.startH).map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
                  border: `2px solid ${s.isDone ? '#10B981' : '#3D5A7A'}`,
                  background: s.isDone ? '#10B981' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {s.isDone && <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: s.isDone ? '#34D399' : '#A3C0E0', fontWeight: 500 }}>
                    Sesi {s.sessionNum} — {s.day}, {s.date}
                    <span style={{ color: '#3D5A7A', marginLeft: 6, fontSize: 11 }}>
                      {String(Math.floor(s.startH)).padStart(2,'0')}:{String(Math.round((s.startH%1)*60)).padStart(2,'0')}–{String(Math.floor(s.endH)).padStart(2,'0')}:{String(Math.round((s.endH%1)*60)).padStart(2,'0')}
                    </span>
                  </div>
                  {s.note?.trim() && (
                    <div style={{ fontSize: 11, color: '#4B6A8A', marginTop: 3, fontStyle: 'italic' }}>"{s.note.trim()}"</div>
                  )}
                  {(s.checklist || []).length > 0 && (
                    <div style={{ fontSize: 11, color: '#4B6A8A', marginTop: 2 }}>
                      ☑ {s.checklist.filter(c => c.done).length}/{s.checklist.length} checklist sesi
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Batal</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={save}>💾 Simpan Task</button>
        </div>
      </div>
    </div>
  );
}
