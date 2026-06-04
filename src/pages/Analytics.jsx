import { useState } from 'react';
import { diffColor, diffLabel } from '../utils/helpers';

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(now); mon.setDate(now.getDate() + diff); mon.setHours(0,0,0,0);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999);
  return { start: isoDate(mon), end: isoDate(sun) };
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: isoDate(start), end: isoDate(end) };
}

export default function Analytics({ tasks = [], schedules = [], energy = {}, sessions = [] }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'week' | 'month'

  // Filter tasks by date range
  const filterRange = filter === 'week' ? getWeekRange() : filter === 'month' ? getMonthRange() : null;

  const filteredTasks = filterRange
    ? tasks.filter(t => t.deadline >= filterRange.start && t.deadline <= filterRange.end)
    : tasks;

  const filteredSessions = filterRange
    ? sessions.filter(s => s.date >= filterRange.start && s.date <= filterRange.end)
    : sessions;

  const total   = filteredTasks.length;
  const done    = filteredTasks.filter(t => t.status === 'done').length;
  const rate    = total > 0 ? Math.round(done / total * 100) : 0;
  const overdue = filteredTasks.filter(t => t.status === 'overdue').length;
  const inProg  = filteredTasks.filter(t => t.status === 'in-progress').length;

  const weekRange = getWeekRange();
  const weekDone  = tasks.filter(t => t.status === 'done' && t.deadline >= weekRange.start && t.deadline <= weekRange.end).length;

  const timeProd = ['morning', 'afternoon', 'evening', 'night'].map(tp => ({
    lbl:  { morning: 'Pagi', afternoon: 'Siang', evening: 'Sore', night: 'Malam' }[tp],
    icon: { morning: '🌅', afternoon: '☀️', evening: '🌆', night: '🌙' }[tp],
    done:  filteredTasks.filter(t => t.timePref === tp && t.status === 'done').length,
    total: filteredTasks.filter(t => t.timePref === tp).length,
  }));

  const diffData = [1, 2, 3, 4, 5].map(d => ({
    lbl: diffLabel(d), d,
    cnt: filteredTasks.filter(t => t.difficulty === d).length,
    color: diffColor(d),
  }));

  const maxBar = Math.max(...timeProd.map(t => t.total), 1);
  const mostProductiveTime = [...timeProd].sort((a, b) => b.done - a.done)[0];

  const totalHours = filteredSessions.reduce((acc, s) => acc + (s.endH - s.startH), 0);

  const summaryCards = [
    { lbl: 'Total Task',      v: total,      c: '#60A5FA', i: '📋' },
    { lbl: 'Completion Rate', v: `${rate}%`, c: '#10B981', i: '📈' },
    { lbl: 'Task Selesai',    v: done,       c: '#34D399', i: '✅' },
    { lbl: 'Overdue',         v: overdue,    c: '#EF4444', i: '⚠️' },
  ];

  const insights = [
    {
      i: '🎯', t: 'Jam Paling Produktif',
      d: mostProductiveTime?.done > 0
        ? `Waktu ${mostProductiveTime.lbl} paling banyak task diselesaikan (${mostProductiveTime.done} task)`
        : 'Belum ada data produktivitas',
    },
    {
      i: '📉', t: 'Perlu Ditingkatkan',
      d: overdue > 0 ? `${overdue} task sudah overdue, perlu diselesaikan segera!` : 'Tidak ada task overdue 🎉',
    },
    {
      i: '⚡', t: 'Task Berat Tersisa',
      d: `${tasks.filter(t => t.difficulty >= 4 && t.status === 'pending').length} task sulit/sangat sulit masih pending`,
    },
    {
      i: '🗓️', t: 'Smart Schedule',
      d: `${filteredSessions.length} sesi terjadwal, total ${Math.round(totalHours * 10) / 10} jam`,
    },
    {
      i: '📅', t: 'Task Selesai Minggu Ini',
      d: `${weekDone} task berhasil diselesaikan minggu berjalan`,
    },
    {
      i: '⏱️', t: 'Rata-rata Produktivitas',
      d: total > 0
        ? `${rate}% completion rate — ${rate >= 70 ? 'sangat baik!' : rate >= 40 ? 'cukup baik, terus tingkatkan' : 'perlu peningkatan'}`
        : 'Belum ada data',
    },
  ];

  const exportCSV = () => {
    const header = 'Nama Task,Deadline,Difficulty,Status,Preferensi Waktu,Estimasi Jam';
    const rows = filteredTasks.map(t =>
      `"${t.name}","${t.deadline}",${t.difficulty},"${t.status}","${t.timePref}",${t.hours}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `adaptime-analytics-${isoDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to JSON
  const exportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      filter,
      summary: { total, done, overdue, completionRate: rate, totalScheduledHours: Math.round(totalHours * 10) / 10 },
      tasks: filteredTasks.map(t => ({ name: t.name, deadline: t.deadline, difficulty: t.difficulty, status: t.status, hours: t.hours })),
      sessions: filteredSessions.length,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `adaptime-analytics-${isoDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 21, fontWeight: 800, color: '#E2ECFF' }}>📊 Analytics & Insights</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#4B6A8A', background: 'rgba(59,130,246,0.07)', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(59,130,246,0.12)' }}>
            {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </span>
          {/* Export button */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost"
              style={{ padding: '5px 12px', fontSize: 12 }}
              onClick={() => setShowExportMenu(p => !p)}
            >
              📥 Export
            </button>
            {showExportMenu && (
              <div style={{
                position: 'absolute', right: 0, top: '110%', zIndex: 100,
                background: '#0A1528', border: '1px solid rgba(59,130,246,0.22)',
                borderRadius: 10, padding: 6, minWidth: 160,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}>
                <div
                  onClick={() => { exportCSV(); setShowExportMenu(false); }}
                  style={{ padding: '8px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: '#A3C0E0', display: 'flex', alignItems: 'center', gap: 8 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  📄 Export CSV
                </div>
                <div
                  onClick={() => { exportJSON(); setShowExportMenu(false); }}
                  style={{ padding: '8px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: '#A3C0E0', display: 'flex', alignItems: 'center', gap: 8 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  📋 Export JSON
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="pill-tabs" style={{ marginBottom: 16 }}>
        {[['all', 'Semua Data'], ['week', 'Minggu Ini'], ['month', 'Bulan Ini']].map(([k, lbl]) => (
          <div key={k} className={`pill-tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{lbl}</div>
        ))}
      </div>

      {total === 0 && filter !== 'all' ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 0', color: '#3D5A7A' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
          <p style={{ fontSize: 14 }}>Belum ada data untuk ditampilkan pada periode ini</p>
        </div>
      ) : (
        <>
          <div className="grid-4" style={{ marginBottom: 16 }}>
            {summaryCards.map(s => (
              <div key={s.lbl} className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
                <div style={{ fontSize: 22, marginBottom: 2 }}>{s.i}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 11, color: '#4B6A8A', fontWeight: 500, marginTop: 1 }}>{s.lbl}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Progress Keseluruhan</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#10B981' }}>{rate}%</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${rate}%`, background: 'linear-gradient(90deg,#1D4ED8,#10B981)', borderRadius: 4, transition: 'width .8s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#3D5A7A', marginTop: 5 }}>
              <span>{done} selesai</span><span>{inProg} dikerjakan</span><span>{overdue} overdue</span>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 14 }}>
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>⏰ Produktivitas per Waktu</div>
              {timeProd.map(tp => (
                <div key={tp.lbl} style={{ marginBottom: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: '#A3C0E0', fontWeight: 600 }}>{tp.icon} {tp.lbl}</span>
                    <span style={{ color: '#4B6A8A' }}>{tp.done}/{tp.total}</span>
                  </div>
                  <div className="energy-bar">
                    <div style={{ height: '100%', width: `${tp.total / maxBar * 100}%`, background: 'rgba(59,130,246,0.25)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: tp.total > 0 ? `${tp.done / tp.total * 100}%` : '0%', background: '#10B981', borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>◆ Distribusi Kesulitan</div>
              {diffData.map(d => (
                <div key={d.d} style={{ marginBottom: 11 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: d.color, fontWeight: 600 }}>{d.lbl}</span>
                    <span style={{ color: '#4B6A8A' }}>{d.cnt} task</span>
                  </div>
                  <div className="energy-bar">
                    <div className="energy-fill" style={{ width: total > 0 ? `${d.cnt / total * 100}%` : '0%', background: d.color + '80' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {insights.map(ins => (
              <div key={ins.t} style={{ background: 'rgba(11,22,45,0.5)', borderRadius: 10, padding: 14, border: '1px solid rgba(59,130,246,0.07)' }}>
                <div style={{ fontSize: 20, marginBottom: 5 }}>{ins.i}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#C8DCFF', marginBottom: 3 }}>{ins.t}</div>
                <div style={{ fontSize: 11, color: '#4B6A8A', lineHeight: 1.5 }}>{ins.d}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
