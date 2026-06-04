import { useState } from 'react';
import { formatHour, SLOT_DEFINITIONS, DAYS } from '../utils/scheduler';
import { diffColor } from '../utils/helpers';
import SessionCard from '../components/SessionCard';

const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isoDate(d) {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function CalendarView({ tasks = [], schedules = [], sessions = [], onReschedule, rescheduling, updateSession }) {
  const todayISO = isoDate(new Date());
  const [weekStart, setWeekStart]     = useState(() => getMonday(new Date()));
  const [selectedDate, setSelectedDate] = useState(todayISO);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };
  const goToday  = () => { setWeekStart(getMonday(new Date())); setSelectedDate(todayISO); };

  const dayScheduled = sessions
    .filter(s => s.date === selectedDate)
    .sort((a, b) => a.startH - b.startH);

  const selectedDayJS  = new Date(selectedDate + 'T00:00:00');
  const selectedDayName = DAYS[selectedDayJS.getDay() === 0 ? 6 : selectedDayJS.getDay() - 1];

  const dayFixed = schedules
    .filter(s => s.day === selectedDayName)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const sessionsPerDay = {};
  sessions.forEach(s => {
    sessionsPerDay[s.date] = (sessionsPerDay[s.date] || 0) + 1;
  });

  const doneTasks = tasks.filter(t => t.status === 'done');

  const monthLabel = (() => {
    const months = new Set(weekDays.map(d => d.getMonth()));
    if (months.size === 1) return `${MONTHS_ID[weekDays[0].getMonth()]} ${weekDays[0].getFullYear()}`;
    return `${MONTHS_ID[weekDays[0].getMonth()]} – ${MONTHS_ID[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`;
  })();

  const isPast  = (dateStr) => dateStr < todayISO;
  const isToday = (dateStr) => dateStr === todayISO;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 21, fontWeight: 800, color: '#E2ECFF' }}>📆 Kalender Jadwal</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#4B6A8A', background: 'rgba(59,130,246,0.07)', padding: '3px 12px', borderRadius: 20, border: '1px solid rgba(59,130,246,0.12)' }}>
            {monthLabel}
          </span>
          <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={goToday}>Hari Ini</button>
          <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={onReschedule} disabled={rescheduling}>
            {rescheduling ? '⏳...' : '🔄 Jadwalkan Ulang'}
          </button>
        </div>
      </div>

      {/* Week navigator */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 14 }} onClick={prevWeek}>‹</button>
          <span style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#A3C0E0' }}>{monthLabel}</span>
          <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 14 }} onClick={nextWeek}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {weekDays.map(d => {
            const iso      = isoDate(d);
            const count    = sessionsPerDay[iso] || 0;
            const past     = isPast(iso);
            const today    = isToday(iso);
            const sel      = iso === selectedDate;
            const jsDay    = d.getDay();
            const dayLabel = DAYS[jsDay === 0 ? 6 : jsDay - 1].slice(0, 3);
            return (
              <div key={iso} onClick={() => setSelectedDate(iso)} style={{
                textAlign: 'center', padding: '10px 4px', borderRadius: 10, cursor: 'pointer',
                background: sel ? 'rgba(59,130,246,0.18)' : today ? 'rgba(16,185,129,0.08)' : 'rgba(11,22,45,0.5)',
                border: `1px solid ${sel ? 'rgba(59,130,246,0.4)' : today ? 'rgba(16,185,129,0.25)' : 'rgba(59,130,246,0.07)'}`,
                opacity: past && !today ? 0.6 : 1, transition: 'all .15s',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: sel ? '#60A5FA' : today ? '#10B981' : '#4B6A8A', marginBottom: 2 }}>{dayLabel}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: sel ? '#93C5FD' : today ? '#34D399' : '#7BA5C8' }}>{d.getDate()}</div>
                <div style={{ marginTop: 4, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', minHeight: 8 }}>
                  {count > 0 && Array.from({ length: Math.min(count, 4) }).map((_, i) => (
                    <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: past ? '#3D5A7A' : '#3B82F6' }} />
                  ))}
                  {count > 4 && <span style={{ fontSize: 8, color: '#4B6A8A' }}>+{count - 4}</span>}
                </div>
                {today && <div style={{ fontSize: 8, color: '#10B981', marginTop: 2, fontWeight: 700 }}>HARI INI</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚡ Smart Sessions</span>
            <span style={{ fontSize: 11, color: '#4B6A8A' }}>
              {isToday(selectedDate) ? 'Hari Ini' : isPast(selectedDate) ? '✅ Sudah Lewat' : `+${Math.ceil((new Date(selectedDate + 'T00:00:00') - new Date(todayISO + 'T00:00:00')) / 86400000)} hari`}
            </span>
          </div>
          {dayScheduled.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#3D5A7A', fontSize: 12 }}>
              {rescheduling ? '⏳ Menjadwalkan...' : isPast(selectedDate) ? '📭 Tidak ada sesi' : '🎉 Tidak ada task untuk hari ini'}
            </div>
          ) : SLOT_DEFINITIONS.map(slot => {
            const slotSessions = dayScheduled.filter(s => s.slotKey === slot.key);
            if (!slotSessions.length) return null;
            return (
              <div key={slot.key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#4B6A8A', fontWeight: 700, marginBottom: 6 }}>
                  {slot.icon} {slot.label}
                  <span style={{ fontSize: 10, color: '#3D5A7A', marginLeft: 4 }}>({formatHour(slot.startH)}–{formatHour(slot.endH)})</span>
                </div>
                {slotSessions.map(s => (
                  <SessionCard key={s.id} session={s} onUpdate={updateSession} isPast={isPast(selectedDate)} />
                ))}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📅 Jadwal Tetap — {selectedDayName}</div>
            {dayFixed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#3D5A7A', fontSize: 12 }}>Tidak ada jadwal tetap</div>
            ) : dayFixed.map(s => (
              <div key={s.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(59,130,246,0.05)' }}>
                <div style={{ minWidth: 44, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#60A5FA' }}>{s.startTime}</div>
                  <div style={{ fontSize: 10, color: '#3D5A7A' }}>{s.endTime}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#C8DCFF' }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: '#4B6A8A', marginTop: 2 }}>{s.type}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📊 Progress Minggu Ini</div>
            {(() => {
              const weekISOs       = weekDays.map(d => isoDate(d));
              const thisWeekSched  = sessions.filter(s => weekISOs.includes(s.date));
              const uniqueTasks    = new Set(thisWeekSched.map(s => s.taskId)).size;
              const totalSessions  = thisWeekSched.length;
              const totalHours     = thisWeekSched.reduce((acc, s) => acc + (s.endH - s.startH), 0);
              return (
                <>
                  {[
                    ['Task aktif', uniqueTasks, '#E2ECFF'],
                    ['Total sesi', totalSessions, '#E2ECFF'],
                    ['Total jam', `${Math.round(totalHours * 10) / 10}j`, '#10B981'],
                    ['Selesai', `${doneTasks.length} task`, '#34D399'],
                  ].map(([label, value, color]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                      <span style={{ color: '#7BA5C8' }}>{label}</span>
                      <span style={{ color, fontWeight: 700 }}>{value}</span>
                    </div>
                  ))}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
