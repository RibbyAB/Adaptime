import { useState } from 'react';
import { diffColor, diffLabel } from '../utils/helpers';

export default function TaskModal({ task, onSave, onClose }) {
  const [f, setF] = useState(task || {
    name: '', deadline: '', difficulty: 3,
    status: 'pending', timePref: 'morning', hours: 2,
  });

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const save = () => {
    if (!f.name) { alert('Nama task wajib diisi!'); return; }
    if (!f.deadline) { alert('Deadline wajib diisi!'); return; }
    onSave(f);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
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

        <div className="grid-2">
          <div className="form-group">
            <label>Deadline *</label>
            <input className="inp" type="date" value={f.deadline} onChange={e => set('deadline', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Estimasi (jam)</label>
            <input
              className="inp" type="number" min="1" max="12"
              value={f.hours}
              onChange={e => set('hours', parseInt(e.target.value) || 1)}
            />
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
            style={{ marginTop: 7 }}
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

        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Batal</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={save}>💾 Simpan Task</button>
        </div>
      </div>
    </div>
  );
}
