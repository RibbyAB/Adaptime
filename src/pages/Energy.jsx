import { useState, useRef } from 'react';
import { energyColor } from '../utils/helpers';

const SLOTS = [
  { k: 'morning',   label: 'Pagi',  icon: '🌅', time: '06:00 – 12:00', desc: 'Cocok untuk task berat jika morning person' },
  { k: 'afternoon', label: 'Siang', icon: '☀️', time: '12:00 – 17:00', desc: 'Energi sedang, cocok untuk task menengah' },
  { k: 'evening',   label: 'Sore',  icon: '🌆', time: '17:00 – 20:00', desc: 'Energi mulai turun setelah aktivitas' },
  { k: 'night',     label: 'Malam', icon: '🌙', time: '20:00 – 24:00', desc: 'Cocok untuk task berat jika night owl' },
];

const PRESETS = {
  morning: { pref: 'morning', morning: 5, afternoon: 3, evening: 2, night: 1 },
  night:   { pref: 'night',   morning: 1, afternoon: 2, evening: 3, night: 5 },
};

const DEFAULT_ENERGY = { pref: 'morning', morning: 5, afternoon: 3, evening: 2, night: 1 };
const RECOMMENDED_CAP = 8;
const OVERWORK_THRESHOLD = 10;

export default function Energy({ energySettings = {}, setEnergySettings, workCap = {}, setWorkCap, defaultCap = 8, onReschedule }) {
  const [capInput, setCapInput]       = useState(defaultCap || 8);
  const [overrideDay, setOverrideDay] = useState('');
  const [overrideCap, setOverrideCap] = useState(8);
  const [saving, setSaving]           = useState(false);

  const rescheduleTimerRef = useRef(null);

  const update = async (k, v) => {
    await setEnergySettings({ ...energySettings, [k]: v });
    // Debounce reschedule — wait 1.5s after last slider move
    if (rescheduleTimerRef.current) clearTimeout(rescheduleTimerRef.current);
    rescheduleTimerRef.current = setTimeout(() => {
      onReschedule?.();
    }, 1500);
  };

  // BUG FIX: await onReschedule so UI doesn't flash inconsistently
  const applyPreset = async (pref) => {
    setSaving(true);
    if (pref === 'custom') {
      await setEnergySettings({ ...energySettings, pref: 'custom' });
    } else {
      await setEnergySettings(PRESETS[pref]);
    }
    await onReschedule?.();
    setSaving(false);
  };

  const saveDefaultCap = async () => {
    setSaving(true);
    await setWorkCap({ ...workCap, default: parseFloat(capInput) || 8 });
    await onReschedule?.();
    setSaving(false);
  };

  const addDayOverride = async () => {
    if (!overrideDay) return;
    const overrides = { ...(workCap?.overrides || {}), [overrideDay]: parseFloat(overrideCap) || 8 };
    setSaving(true);
    await setWorkCap({ ...workCap, overrides });
    await onReschedule?.();
    setSaving(false);
    setOverrideDay('');
  };

  const removeDayOverride = async (date) => {
    const overrides = { ...(workCap?.overrides || {}) };
    delete overrides[date];
    await setWorkCap({ ...workCap, overrides });
    await onReschedule?.();
  };

  const overrides = workCap?.overrides || {};

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 21, fontWeight: 800, color: '#E2ECFF' }}>⚡ Pengaturan Energi & Kapasitas</h2>
        <button className="btn btn-ghost" onClick={() => setEnergySettings(DEFAULT_ENERGY)} disabled={saving}>Reset Default</button>
      </div>

      {/* Work hour cap */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#7BA5C8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.5px' }}>
          ⏱️ Batas Jam Kegiatan per Hari
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: '#7BA5C8', display: 'block', marginBottom: 4 }}>Default (semua hari)</label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                className="inp"
                type="number" min="1" max="24" step="0.5"
                value={capInput}
                onChange={e => setCapInput(e.target.value)}
                style={{ width: 80, textAlign: 'center' }}
              />
              <span style={{ fontSize: 12, color: '#4B6A8A' }}>jam/hari</span>
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: 12 }}
            onClick={saveDefaultCap}
            disabled={saving}
          >
            {saving ? '...' : 'Simpan'}
          </button>
        </div>

        {parseFloat(capInput) > OVERWORK_THRESHOLD && (
          <div style={{ fontSize: 12, color: '#F59E0B', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
            ⚠️ {parseFloat(capInput)} jam/hari melebihi batas yang direkomendasikan ({RECOMMENDED_CAP} jam). Hindari kelelahan berlebihan!
          </div>
        )}

        <div style={{ fontSize: 11, color: '#3D5A7A' }}>
          Rekomendasi: {RECOMMENDED_CAP} jam/hari. Sistem tidak akan menjadwalkan lebih dari batas ini.
        </div>

        <div style={{ marginTop: 16, borderTop: '1px solid rgba(59,130,246,0.08)', paddingTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7BA5C8', marginBottom: 10 }}>Override per Tanggal</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <input
              className="inp"
              type="date"
              value={overrideDay}
              onChange={e => setOverrideDay(e.target.value)}
              style={{ flex: 1, minWidth: 140 }}
            />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                className="inp"
                type="number" min="1" max="24" step="0.5"
                value={overrideCap}
                onChange={e => setOverrideCap(e.target.value)}
                style={{ width: 70, textAlign: 'center' }}
              />
              <span style={{ fontSize: 12, color: '#4B6A8A' }}>jam</span>
            </div>
            <button className="btn btn-primary" style={{ fontSize: 12, padding: '7px 14px' }} onClick={addDayOverride}>
              + Tambah
            </button>
          </div>
          {Object.entries(overrides).length === 0 ? (
            <div style={{ fontSize: 11, color: '#3D5A7A' }}>Belum ada override. Default berlaku untuk semua hari.</div>
          ) : Object.entries(overrides).sort().map(([date, cap]) => (
            <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '5px 0', borderBottom: '1px solid rgba(59,130,246,0.05)' }}>
              <span style={{ color: '#A3C0E0' }}>{date}</span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ color: cap > OVERWORK_THRESHOLD ? '#F59E0B' : '#10B981', fontWeight: 700 }}>{cap} jam</span>
                <button className="btn btn-danger" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => removeDayOverride(date)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Energy preset */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#7BA5C8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.5px' }}>
          Tipe Preferensi
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['morning', '🌅 Morning Person'], ['night', '🌙 Night Owl'], ['custom', '⚙️ Custom']].map(([k, lbl]) => (
            <button key={k} className={`pref-btn ${energySettings.pref === k ? 'active' : ''}`} onClick={() => applyPreset(k)} disabled={saving}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Energy sliders */}
      <div style={{ marginBottom: 16 }}>
        {SLOTS.map(sl => {
          const lv = energySettings[sl.k] ?? 3;
          return (
            <div key={sl.k} className="sched-slot">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#A3C0E0' }}>{sl.icon} {sl.label}</span>
                  <span style={{ fontSize: 11, color: '#3D5A7A', marginLeft: 8 }}>{sl.time}</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: energyColor(lv), minWidth: 28, textAlign: 'right' }}>{lv}/5</span>
              </div>
              <input
                type="range" min="1" max="5" value={lv}
                onChange={e => update(sl.k, parseInt(e.target.value))}
                onMouseUp={() => update('pref', 'custom')}
                style={{ width: '100%' }}
              />
              <div className="energy-bar" style={{ marginTop: 6 }}>
                <div className="energy-fill" style={{ width: `${lv * 20}%`, background: energyColor(lv) }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#3D5A7A', marginTop: 3 }}>
                <span>Rendah (1)</span><span>Sedang (3)</span><span>Tinggi (5)</span>
              </div>
              <div style={{ fontSize: 11, color: '#3D5A7A', marginTop: 4 }}>{sl.desc}</div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ background: 'rgba(59,130,246,0.04)', borderColor: 'rgba(59,130,246,0.18)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#60A5FA', marginBottom: 10 }}>💡 Cara Kerja Sistem Energi</div>
        {[
          ['⚡ Task sulit (4–5)', '→ Slot energi tinggi. Menguras lebih banyak energi per sesi.', '#EF4444'],
          ['🔋 Task sedang (3)',  '→ Slot energi sedang. Drainase moderat.',                     '#F59E0B'],
          ['😌 Task mudah (1–2)', '→ Bisa di slot energi rendah. Drainase minimal.',             '#10B981'],
          ['📅 Jadwal tetap',    '→ Juga menguras energi slot sesuai rating kesulitannya.',      '#60A5FA'],
        ].map(([t, d, c]) => (
          <div key={t} style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: '1px solid rgba(59,130,246,0.06)' }}>
            <div style={{ width: 4, background: c, borderRadius: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#C8DCFF' }}>{t}</div>
              <div style={{ fontSize: 11, color: '#4B6A8A', marginTop: 1 }}>{d}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}