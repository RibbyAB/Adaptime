import { useState } from 'react';
import { diffColor, diffLabel } from '../utils/helpers';

const PREF_SESSION_OPTIONS = [
  { value: null,  label: 'Auto (sistem pilihkan)' },
  { value: 0.5,   label: '30 menit' },
  { value: 1,     label: '1 jam' },
  { value: 1.5,   label: '1 jam 30 menit' },
  { value: 2,     label: '2 jam' },
  { value: 2.5,   label: '2 jam 30 menit' },
  { value: 3,     label: '3 jam' },
];

function ChecklistEditor({ items, onChange }) {
  const addItem  = () => onChange([...items, { id: Date.now(), text: '', done: false }]);
  const updateItem = (id, field, val) => onChange(items.map(i => i.id === id ? { ...i, [field]: val } : i));
  const removeItem = (id) => onChange(items.filter(i => i.id !== id));

  return (
    <div>
      {items.map(item => (
        <div key={item.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          {/* Checkbox to mark done */}
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
          {/* X to delete */}
          <button
            className="btn btn-ghost"
            style={{ padding: '4px 7px', fontSize: 11, color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
            onClick={() => removeItem(item.id)}
          >✕</button>
        </div>
      ))}
      <button
        className="btn btn-ghost"
        style={{ fontSize: 12, padding: '5px 12px', marginTop: 2 }}
        onClick={addItem}
      >+ Tambah Item</button>
    </div>
  );
}

export default function TaskModal({ task, onSave, onClose }) {
  const [f, setF] = useState(task || {
    name: '', deadline: '', difficulty: 3,
    status: 'pending', timePref: 'morning',
    hours: 1, minutes: 0,
    prefSessionHours: null,
    description: '',
    checklist: [],
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const save = () => {
    if (!f.name.trim()) { alert('Nama task wajib diisi!'); return; }
    if (!f.deadline) { alert('Deadline wajib diisi!'); return; }
    // Convert hours + minutes to decimal hours
    const totalHours = (parseInt(f.hours) || 0) + (parseInt(f.minutes) || 0) / 60;
    if (totalHours < 0.25) { alert('Estimasi waktu minimal 15 menit!'); return; }
    onSave({ ...f, hours: Math.round(totalHours * 100) / 100 });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <h3>{task ? '✏️ Edit Task' : '➕ Tambah Task Baru'}</h3>

        <div className="form-group">
          <label>Nama Task *</label>
          <input
            className="inp"
            placeholder="Nama task kamu..."
            value={f.name}
            onChange={e => set('name', e.target.value)}
          />
        </div>

        {/* Description — optional */}
        <div className="form-group">
          <label style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Deskripsi</span>
            <span style={{ fontSize: 10, color: '#3D5A7A' }}>opsional</span>
          </label>
          <textarea
            className="inp"
            placeholder="Apa yang perlu dikerjakan? (opsional)"
            value={f.description || ''}
            onChange={e => set('description', e.target.value)}
            rows={2}
            style={{ resize: 'vertical', fontSize: 13 }}
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label>Deadline *</label>
            <input className="inp" type="date" value={f.deadline} onChange={e => set('deadline', e.target.value)} />
          </div>

          {/* Hours + Minutes input — FIX for decimal issue */}
          <div className="form-group">
            <label>Estimasi Waktu</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ flex: 1 }}>
                <input
                  className="inp"
                  type="number" min="0" max="99" placeholder="0"
                  value={f.hours === 0 ? '' : f.hours}
                  onChange={e => set('hours', Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ textAlign: 'center' }}
                />
                <div style={{ fontSize: 10, color: '#3D5A7A', textAlign: 'center', marginTop: 2 }}>jam</div>
              </div>
              <div style={{ flex: 1 }}>
                <input
                  className="inp"
                  type="number" min="0" max="59" placeholder="0"
                  value={f.minutes === 0 ? '' : f.minutes}
                  onChange={e => set('minutes', Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  style={{ textAlign: 'center' }}
                />
                <div style={{ fontSize: 10, color: '#3D5A7A', textAlign: 'center', marginTop: 2 }}>menit</div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>
            Tingkat Kesulitan:{' '}
            <span style={{ color: diffColor(f.difficulty) }}>
              {diffLabel(f.difficulty)} ({f.difficulty}/5)
            </span>
          </label>
          <input
            type="range" min="1" max="5"
            value={f.difficulty}
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
              <option value="morning">🌅 Pagi (06–12)</option>
              <option value="afternoon">☀️ Siang (12–17)</option>
              <option value="evening">🌆 Sore (17–20)</option>
              <option value="night">🌙 Malam (20–24)</option>
            </select>
          </div>
        </div>

        {/* Advanced options toggle */}
        <div
          style={{ fontSize: 12, color: '#60A5FA', cursor: 'pointer', marginBottom: 12, userSelect: 'none' }}
          onClick={() => setShowAdvanced(p => !p)}
        >
          {showAdvanced ? '▼' : '▶'} Opsi Lanjutan
        </div>

        {showAdvanced && (
          <>
            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Preferensi Panjang Sesi</span>
                <span style={{ fontSize: 10, color: '#3D5A7A' }}>opsional</span>
              </label>
              <select
                className="inp"
                value={f.prefSessionHours ?? ''}
                onChange={e => set('prefSessionHours', e.target.value === '' ? null : parseFloat(e.target.value))}
              >
                {PREF_SESSION_OPTIONS.map(o => (
                  <option key={o.value ?? 'auto'} value={o.value ?? ''}>{o.label}</option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: '#3D5A7A', marginTop: 4 }}>
                Sistem akan membagi task menjadi sesi-sesi dengan panjang ini.
              </div>
            </div>

            {/* Checklist — optional */}
            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Checklist Task</span>
                <span style={{ fontSize: 10, color: '#3D5A7A' }}>opsional</span>
              </label>
              <ChecklistEditor
                items={f.checklist || []}
                onChange={v => set('checklist', v)}
              />
              {(f.checklist || []).length > 0 && (
                <div style={{ fontSize: 11, color: '#3D5A7A', marginTop: 6 }}>
                  Task otomatis selesai jika semua item diceklis.
                </div>
              )}
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Batal</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={save}>💾 Simpan Task</button>
        </div>
      </div>
    </div>
  );
}
