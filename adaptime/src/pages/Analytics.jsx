import { diffColor, diffLabel } from '../utils/helpers';

export default function Analytics({ tasks }) {
  const total   = tasks.length;
  const done    = tasks.filter(t => t.status === 'done').length;
  const rate    = total > 0 ? Math.round(done / total * 100) : 0;
  const overdue = tasks.filter(t => t.status === 'overdue').length;
  const inProg  = tasks.filter(t => t.status === 'in-progress').length;

  const timeProd = ['morning', 'afternoon', 'evening', 'night'].map(tp => ({
    lbl:  { morning: 'Pagi', afternoon: 'Siang', evening: 'Sore', night: 'Malam' }[tp],
    icon: { morning: '🌅', afternoon: '☀️', evening: '🌆', night: '🌙' }[tp],
    done:  tasks.filter(t => t.timePref === tp && t.status === 'done').length,
    total: tasks.filter(t => t.timePref === tp).length,
  }));

  const diffData = [1, 2, 3, 4, 5].map(d => ({
    lbl:   diffLabel(d),
    d,
    cnt:   tasks.filter(t => t.difficulty === d).length,
    color: diffColor(d),
  }));

  const maxBar = Math.max(...timeProd.map(t => t.total), 1);

  const summaryCards = [
    { lbl: 'Total Task',      v: total,  c: '#60A5FA', i: '📋' },
    { lbl: 'Completion Rate', v: `${rate}%`, c: '#10B981', i: '📈' },
    { lbl: 'Task Selesai',    v: done,   c: '#34D399', i: '✅' },
    { lbl: 'Overdue',         v: overdue, c: '#EF4444', i: '⚠️' },
  ];

  const insights = [
    {
      i: '🎯', t: 'Jam Paling Produktif',
      d: `Waktu ${[...timeProd].sort((a, b) => b.done - a.done)[0]?.lbl || 'Pagi'} paling banyak task diselesaikan`,
    },
    {
      i: '📉', t: 'Perlu Ditingkatkan',
      d: overdue > 0 ? `${overdue} task sudah overdue, perlu diselesaikan segera!` : 'Tidak ada task overdue, bagus!',
    },
    {
      i: '⚡', t: 'Task Berat Tersisa',
      d: `${tasks.filter(t => t.difficulty >= 4 && t.status === 'pending').length} task sulit/sangat sulit masih pending`,
    },
    {
      i: '✨', t: 'Saran Smart Schedule',
      d: `${tasks.filter(t => t.status === 'pending').length} task pending siap dijadwalkan otomatis`,
    },
  ];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 21, fontWeight: 800, color: '#E2ECFF' }}>📊 Analytics & Insights</h2>
        <span style={{
          fontSize: 12, color: '#4B6A8A',
          background: 'rgba(59,130,246,0.07)',
          padding: '3px 10px', borderRadius: 20,
          border: '1px solid rgba(59,130,246,0.12)',
        }}>Mei 2026</span>
      </div>

      {/* Summary cards */}
      <div className="grid-4" style={{ marginBottom: 16 }}>
        {summaryCards.map(s => (
          <div key={s.lbl} className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
            <div style={{ fontSize: 22, marginBottom: 2 }}>{s.i}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 11, color: '#4B6A8A', fontWeight: 500, marginTop: 1 }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Progress Keseluruhan</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#10B981' }}>{rate}%</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${rate}%`,
            background: 'linear-gradient(90deg,#1D4ED8,#10B981)',
            borderRadius: 4, transition: 'width .8s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#3D5A7A', marginTop: 5 }}>
          <span>{done} selesai</span>
          <span>{inProg} dikerjakan</span>
          <span>{overdue} overdue</span>
        </div>
      </div>

      <div className="grid-2">
        {/* Productivity by time */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>⏰ Produktivitas per Waktu</div>
          {timeProd.map(tp => (
            <div key={tp.lbl} style={{ marginBottom: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: '#A3C0E0', fontWeight: 600 }}>{tp.icon} {tp.lbl}</span>
                <span style={{ color: '#4B6A8A' }}>{tp.done}/{tp.total}</span>
              </div>
              <div className="energy-bar">
                <div style={{
                  height: '100%', width: `${tp.total / maxBar * 100}%`,
                  background: 'rgba(59,130,246,0.25)', borderRadius: 3, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: tp.total > 0 ? `${tp.done / tp.total * 100}%` : '0%',
                    background: '#10B981', borderRadius: 3,
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Difficulty distribution */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>◆ Distribusi Kesulitan</div>
          {diffData.map(d => (
            <div key={d.d} style={{ marginBottom: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: d.color, fontWeight: 600 }}>{d.lbl}</span>
                <span style={{ color: '#4B6A8A' }}>{d.cnt} task</span>
              </div>
              <div className="energy-bar">
                <div className="energy-fill" style={{
                  width: total > 0 ? `${d.cnt / total * 100}%` : '0%',
                  background: d.color + '80',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insight cards */}
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {insights.map(ins => (
          <div key={ins.t} style={{
            background: 'rgba(11,22,45,0.5)', borderRadius: 10, padding: 14,
            border: '1px solid rgba(59,130,246,0.07)',
          }}>
            <div style={{ fontSize: 20, marginBottom: 5 }}>{ins.i}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#C8DCFF', marginBottom: 3 }}>{ins.t}</div>
            <div style={{ fontSize: 11, color: '#4B6A8A', lineHeight: 1.5 }}>{ins.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
