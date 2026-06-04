import { useState } from 'react';
import { DAYS } from '../utils/scheduler';
import { diffColor, diffLabel } from '../utils/helpers';

export default function SchedModal({ schedule, onSave, onClose }) {
  const [f, setF] = useState(schedule || {
    day: 'Senin', startTime: '08:00', endTime: '10:00',
    type: 'kelas', name: '', difficulty: 3,
  });

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const save = () => {
    if (!f.name.trim()) { alert('Nama kegiatan wajib diisi!'); return; }
    if (f.startTime >= f.endTime) { alert('Jam selesai harus lebih dari jam mulai!'); return; }
    onSave(f);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3>{schedule ? '✏️ Edit Jadwal' : '➕ Tambah Jadwal Tetap'}</h3>

        <div className="form-group">
          <label>Nama Kegiatan *</label>
          <input
            className="inp"
            placeholder="Nama kegiatan..."
            value={f.name}
            onChange={e => set('name', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Hari</label>
          <select className="inp" value={f.day} onChange={e => set('day', e.target.value)}>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label>Jam Mulai</label>
            <input className="inp" type="time" value={f.startTime} onChange={e => set('startTime', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Jam Selesai</label>
            <input className="inp" type="time" value={f.endTime} onChange={e => set('endTime', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>Tipe Aktivitas</label>
          <select className="inp" value={f.type} onChange={e => set('type', e.target.value)}>
            <option value="kelas">📚 Kelas</option>
            <option value="kerja">💼 Kerja</option>
            <option value="pribadi">🏃 Pribadi</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            Tingkat Kuras Energi:{' '}
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
            <span>1 – Ringan</span><span>3 – Sedang</span><span>5 – Berat</span>
          </div>
          <div style={{ fontSize: 11, color: '#3D5A7A', marginTop: 4 }}>
            Seberapa banyak kegiatan ini menguras energimu? Mempengaruhi slot setelahnya.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Batal</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={save}>💾 Simpan Jadwal</button>
        </div>
      </div>
    </div>
  );
}
