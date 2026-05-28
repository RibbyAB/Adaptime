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

const RULES = [
  ['⚡ Difficulty 4–5 (Sulit/Sangat Sulit)', '→ Dialokasikan ke slot dengan energi tinggi (4–5)', '#EF4444'],
  ['🔋 Difficulty 3 (Sedang)',               '→ Dialokasikan ke slot dengan energi sedang (3)',   '#F59E0B'],
  ['😌 Difficulty 1–2 (Mudah)',              '→ Bisa dikerjakan di slot dengan energi rendah (1–2)', '#10B981'],
];

const DEFAULT_ENERGY = { pref: 'morning', morning: 5, afternoon: 3, evening: 2, night: 1 };

export default function Energy({ energySettings, setEnergySettings }) {
  const update = async (k, v) => {
    await setEnergySettings({ ...energySettings, [k]: v });
  };

  const applyPreset = async (pref) => {
    if (pref === 'custom') {
      await setEnergySettings({ ...energySettings, pref: 'custom' });
    } else {
      await setEnergySettings(PRESETS[pref]);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 21, fontWeight: 800, color: '#E2ECFF' }}>⚡ Pengaturan Energi</h2>
        <button className="btn btn-ghost" onClick={() => setEnergySettings(DEFAULT_ENERGY)}>Reset Default</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#7BA5C8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.5px' }}>
          Tipe Preferensi
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['morning', '🌅 Morning Person'], ['night', '🌙 Night Owl'], ['custom', '⚙️ Custom']].map(([k, lbl]) => (
            <button key={k} className={`pref-btn ${energySettings.pref === k ? 'active' : ''}`} onClick={() => applyPreset(k)}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

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
              />
              <div className="energy-bar" style={{ marginTop: 6 }}>
                <div className="energy-fill" style={{ width: `${lv * 20}%`, background: energyColor(lv) }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#3D5A7A', marginTop: 3 }}>
                <span>Rendah (1)</span><span>Sedang (3)</span><span>Tinggi (5)</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ background: 'rgba(59,130,246,0.04)', borderColor: 'rgba(59,130,246,0.18)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#60A5FA', marginBottom: 10 }}>💡 Cara Kerja Energy Matching</div>
        {RULES.map(([t, d, c]) => (
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
