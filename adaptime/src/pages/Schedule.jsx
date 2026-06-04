import { useState } from 'react';
import SchedModal from '../components/SchedModal';
import { TypeBadge } from '../components/Badge';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const TYPE_COLORS = { kelas: '#8B5CF6', kerja: '#3B82F6', pribadi: '#10B981' };

export default function Schedule({ schedules, addSchedule, updateSchedule, deleteSchedule }) {
  const [modal, setModal] = useState(null);
  const [selDay, setSelDay] = useState(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);

  const save = async (form) => {
    if (modal === 'add') {
      await addSchedule(form);
    } else {
      await updateSchedule(modal.id, form);
    }
    setModal(null);
  };

  const del = async (id) => await deleteSchedule(id);

  const daySched = schedules
    .filter(s => s.day === selDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const hasConflict = (s1, s2) =>
    s1.id !== s2.id && s1.day === s2.day &&
    s1.startTime < s2.endTime && s2.startTime < s1.endTime;

  const conflicts = new Set();
  schedules.forEach(a => schedules.forEach(b => {
    if (hasConflict(a, b)) { conflicts.add(a.id); conflicts.add(b.id); }
  }));

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 21, fontWeight: 800, color: '#E2ECFF' }}>📅 Jadwal Tetap</h2>
        <button className="btn btn-primary" onClick={() => setModal('add')}>+ Tambah Jadwal</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 20 }}>
        {DAYS.map(d => (
          <div key={d} onClick={() => setSelDay(d)} style={{
            textAlign: 'center', padding: '8px 4px', borderRadius: 9, cursor: 'pointer',
            background: selDay === d ? 'rgba(59,130,246,0.13)' : 'rgba(11,22,45,0.5)',
            border: `1px solid ${selDay === d ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.07)'}`,
            transition: 'all .15s',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: selDay === d ? '#60A5FA' : '#4B6A8A' }}>{d.slice(0, 3)}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: selDay === d ? '#93C5FD' : '#7BA5C8', marginTop: 2 }}>
              {schedules.filter(s => s.day === d).length}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 14, fontSize: 14, fontWeight: 700, color: '#A3C0E0' }}>
        Jadwal {selDay} ({daySched.length} kegiatan)
        {daySched.some(s => conflicts.has(s.id)) && (
          <span style={{ marginLeft: 8, fontSize: 11, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.2)' }}>
            ⚠️ Ada konflik jadwal
          </span>
        )}
      </div>

      {daySched.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
          <p style={{ color: '#3D5A7A', fontSize: 13 }}>Belum ada jadwal untuk hari {selDay}</p>
          <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={() => setModal('add')}>Tambah Jadwal</button>
        </div>
      ) : daySched.map(s => (
        <div key={s.id} style={{
          display: 'flex', marginBottom: 9, borderRadius: 11, overflow: 'hidden',
          border: `1px solid ${conflicts.has(s.id) ? 'rgba(245,158,11,0.25)' : 'rgba(59,130,246,0.09)'}`,
        }}>
          <div style={{ width: 5, background: TYPE_COLORS[s.type] || '#60A5FA', flexShrink: 0 }} />
          <div style={{ flex: 1, padding: '12px 14px', background: 'rgba(11,22,45,0.5)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ minWidth: 52, textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#60A5FA' }}>{s.startTime}</div>
              <div style={{ fontSize: 9, color: '#3D5A7A' }}>s/d</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#60A5FA' }}>{s.endTime}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#C8DCFF', marginBottom: 3 }}>
                {conflicts.has(s.id) && <span style={{ color: '#F59E0B', marginRight: 4 }}>⚠️</span>}
                {s.name}
              </div>
              <TypeBadge type={s.type} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost" style={{ padding: '5px 11px', fontSize: 12 }} onClick={() => setModal(s)}>Edit</button>
              <button className="btn btn-danger" onClick={() => del(s.id)}>Hapus</button>
            </div>
          </div>
        </div>
      ))}

      {modal && (
        <SchedModal
          schedule={modal === 'add' ? null : modal}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
