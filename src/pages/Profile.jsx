import { useState } from 'react';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { seedDemoData } from '../data/seed';

const ENERGY_TEST_QUESTIONS = [
  {
    id: 1,
    q: 'Kamu paling produktif bekerja di jam berapa?',
    opts: [
      { label: 'Pagi hari (06:00 – 10:00)', val: 'morning' },
      { label: 'Siang hari (10:00 – 14:00)', val: 'morning' },
      { label: 'Sore hari (14:00 – 19:00)', val: 'night' },
      { label: 'Malam hari (19:00 – 24:00)', val: 'night' },
    ],
  },
  {
    id: 2,
    q: 'Saat bangun tidur, kamu biasanya merasa…',
    opts: [
      { label: 'Langsung segar dan siap beraktivitas', val: 'morning' },
      { label: 'Perlu waktu tapi oke setelah mandi', val: 'morning' },
      { label: 'Ngantuk, butuh kopi dulu', val: 'night' },
      { label: 'Sangat berat, lebih suka tidur lagi', val: 'night' },
    ],
  },
  {
    id: 3,
    q: 'Kalau kamu punya tugas penting, kapan kamu mengerjakan?',
    opts: [
      { label: 'Pagi sebelum aktivitas lain', val: 'morning' },
      { label: 'Jam kerja normal siang hari', val: 'morning' },
      { label: 'Sore setelah semua urusan selesai', val: 'night' },
      { label: 'Malam / tengah malam', val: 'night' },
    ],
  },
  {
    id: 4,
    q: 'Di akhir pekan, kamu lebih sering…',
    opts: [
      { label: 'Bangun awal dan jalan pagi', val: 'morning' },
      { label: 'Bangun normal, berolahraga siang', val: 'morning' },
      { label: 'Bangun siang, aktif sore/malam', val: 'night' },
      { label: 'Tidur hingga siang, aktif malam', val: 'night' },
    ],
  },
  {
    id: 5,
    q: 'Ketika kamu bekerja hingga larut malam, kamu merasa…',
    opts: [
      { label: 'Terpaksa, idealnya selesai pagi', val: 'morning' },
      { label: 'Tidak efisien, kurang fokus', val: 'morning' },
      { label: 'Lebih fokus dari siang hari', val: 'night' },
      { label: 'Justru paling produktif malam', val: 'night' },
    ],
  },
];

export default function Profile({ user, onApplyEnergyResult }) {
  const [tab, setTab] = useState('profile');

  // Profile tab
  const [name, setName]     = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [errMsg, setErrMsg] = useState('');

  // Security tab
  const [resetSent, setResetSent] = useState(false);
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwErr, setPwErr]         = useState('');

  // Energy test tab
  const [answers, setAnswers]       = useState({});
  const [testDone, setTestDone]     = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [applied, setApplied]       = useState(false);

  // Demo data seeder state
  const [seeding, setSeeding]   = useState(false);
  const [seedDone, setSeedDone] = useState(false);
  const [seedErr, setSeedErr]   = useState('');

  // ─── Profile save ──
  const saveProfile = async () => {
    if (!name.trim()) { setErrMsg('Nama tidak boleh kosong'); return; }
    setSaving(true); setErrMsg('');
    try {
      await updateProfile(auth.currentUser, { displayName: name.trim() });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e) { setErrMsg('Gagal menyimpan: ' + e.message); }
    setSaving(false);
  };

  // ─── Reset password ──
  const sendReset = async () => {
    setPwErr(''); setPwSaving(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetSent(true);
    } catch (e) { setPwErr('Gagal mengirim email: ' + e.message); }
    setPwSaving(false);
  };

  // ─── Energy test ──
  const answerQ = (qId, optIdx) => {
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const submitTest = () => {
    let morningScore = 0, nightScore = 0;
    ENERGY_TEST_QUESTIONS.forEach(q => {
      const optIdx = answers[q.id];
      if (optIdx !== undefined) {
        if (q.opts[optIdx].val === 'morning') morningScore++;
        else nightScore++;
      }
    });
    const pref = morningScore > nightScore ? 'morning' : 'night';
    const result = {
      pref,
      morning:   pref === 'morning' ? 5 : 1,
      afternoon: pref === 'morning' ? 3 : 2,
      evening:   pref === 'morning' ? 2 : 3,
      night:     pref === 'morning' ? 1 : 5,
      morningScore, nightScore,
    };
    setTestResult(result);
    setTestDone(true);
  };

  const applyResult = async () => {
    if (!testResult || !onApplyEnergyResult) return;
    await onApplyEnergyResult(testResult);
    setApplied(true);
  };

  // ─── Demo data seeder ──
  const loadDemoData = async () => {
    if (!user?.uid) return;
    setSeedErr('');
    setSeeding(true);
    try {
      await seedDemoData(user.uid);
      setSeedDone(true);
      setTimeout(() => setSeedDone(false), 4000);
    } catch (e) {
      setSeedErr('Gagal memuat demo data: ' + e.message);
    }
    setSeeding(false);
  };

  const allAnswered = Object.keys(answers).length === ENERGY_TEST_QUESTIONS.length;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 21, fontWeight: 800, color: '#E2ECFF' }}>👤 Profil & Pengaturan</h2>
      </div>

      <div className="pill-tabs" style={{ marginBottom: 20 }}>
        {[['profile', '✏️ Edit Profil'], ['test', '🔋 Tes Energi'], ['security', '🔒 Keamanan'], ['demo', '🧪 Demo Data']].map(([k, lbl]) => (
          <div key={k} className={`pill-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{lbl}</div>
        ))}
      </div>

      {/* ── Profile Tab ── */}
      {tab === 'profile' && (
        <div className="card" style={{ maxWidth: 480 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>
              {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#E2ECFF' }}>{user?.displayName || 'Pengguna'}</div>
              <div style={{ fontSize: 12, color: '#4B6A8A' }}>{user?.email}</div>
            </div>
          </div>

          <div className="form-group">
            <label>Nama Tampilan</label>
            <input className="inp" placeholder="Nama lengkap kamu" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input className="inp" value={user?.email || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            <div style={{ fontSize: 11, color: '#3D5A7A', marginTop: 4 }}>Email tidak dapat diubah</div>
          </div>

          {errMsg && (
            <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12, padding: '8px 10px', background: 'rgba(239,68,68,0.07)', borderRadius: 7 }}>{errMsg}</div>
          )}

          <button className="btn btn-primary" style={{ width: '100%', padding: 11 }} onClick={saveProfile} disabled={saving}>
            {saving ? '⏳ Menyimpan...' : saved ? '✅ Tersimpan!' : '💾 Simpan Perubahan'}
          </button>
        </div>
      )}

      {/* ── Energy Test Tab ── */}
      {tab === 'test' && (
        <div>
          {!testDone ? (
            <div>
              <div className="card" style={{ marginBottom: 16, background: 'rgba(59,130,246,0.04)', borderColor: 'rgba(59,130,246,0.18)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#60A5FA', marginBottom: 6 }}>🔋 Tes Tipe Energi</div>
                <div style={{ fontSize: 12, color: '#7BA5C8', lineHeight: 1.6 }}>
                  Jawab {ENERGY_TEST_QUESTIONS.length} pertanyaan untuk menentukan tipe energimu: <strong style={{ color: '#93C5FD' }}>Morning Person</strong> atau <strong style={{ color: '#93C5FD' }}>Night Owl</strong>.
                </div>
              </div>

              {ENERGY_TEST_QUESTIONS.map((q, idx) => (
                <div key={q.id} className="card" style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#C8DCFF', marginBottom: 12 }}>
                    {idx + 1}. {q.q}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {q.opts.map((opt, i) => {
                      const selected = answers[q.id] === i;
                      return (
                        <div
                          key={i}
                          onClick={() => answerQ(q.id, i)}
                          style={{
                            padding: '9px 14px', borderRadius: 9, cursor: 'pointer',
                            border: `1px solid ${selected ? 'rgba(59,130,246,0.45)' : 'rgba(59,130,246,0.1)'}`,
                            background: selected ? 'rgba(59,130,246,0.14)' : 'rgba(11,22,45,0.3)',
                            fontSize: 13, color: selected ? '#93C5FD' : '#A3C0E0',
                            transition: 'all .15s',
                          }}
                        >
                          {selected ? '✓ ' : ''}{opt.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: 12, fontSize: 14 }}
                onClick={submitTest}
                disabled={!allAnswered}
              >
                {allAnswered ? '🔍 Lihat Hasil Tes' : `Jawab semua pertanyaan (${Object.keys(answers).length}/${ENERGY_TEST_QUESTIONS.length})`}
              </button>
            </div>
          ) : (
            <div>
              <div className="card" style={{ marginBottom: 16, textAlign: 'center', background: testResult.pref === 'morning' ? 'rgba(245,158,11,0.05)' : 'rgba(99,102,241,0.05)', borderColor: testResult.pref === 'morning' ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.2)' }}>
                <div style={{ fontSize: 48, marginBottom: 10 }}>{testResult.pref === 'morning' ? '🌅' : '🌙'}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: testResult.pref === 'morning' ? '#F59E0B' : '#A78BFA', marginBottom: 8 }}>
                  Kamu adalah {testResult.pref === 'morning' ? 'Morning Person!' : 'Night Owl!'}
                </div>
                <div style={{ fontSize: 12, color: '#7BA5C8', lineHeight: 1.6, marginBottom: 12 }}>
                  {testResult.pref === 'morning'
                    ? 'Kamu paling produktif di pagi dan siang hari. Sistem akan menjadwalkan tugas berat di slot pagi.'
                    : 'Kamu paling produktif di malam hari. Sistem akan menjadwalkan tugas berat di slot malam.'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#F59E0B' }}>{testResult.morningScore}</div>
                    <div style={{ fontSize: 11, color: '#4B6A8A' }}>Skor Pagi</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#A78BFA' }}>{testResult.nightScore}</div>
                    <div style={{ fontSize: 11, color: '#4B6A8A' }}>Skor Malam</div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>⚡ Distribusi Energi Hasil Tes</div>
                {[
                  { label: 'Pagi', key: 'morning', icon: '🌅', val: testResult.morning },
                  { label: 'Siang', key: 'afternoon', icon: '☀️', val: testResult.afternoon },
                  { label: 'Sore', key: 'evening', icon: '🌆', val: testResult.evening },
                  { label: 'Malam', key: 'night', icon: '🌙', val: testResult.night },
                ].map(s => (
                  <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ width: 60, fontSize: 12, color: '#7BA5C8' }}>{s.icon} {s.label}</span>
                    <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${s.val * 20}%`, background: s.val >= 4 ? '#10B981' : s.val >= 3 ? '#F59E0B' : '#EF4444', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: s.val >= 4 ? '#10B981' : s.val >= 3 ? '#F59E0B' : '#EF4444', minWidth: 28 }}>{s.val}/5</span>
                  </div>
                ))}
              </div>

              {applied ? (
                <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, fontSize: 13, color: '#34D399', textAlign: 'center' }}>
                  ✅ Pengaturan energi berhasil diterapkan! Smart scheduling akan menyesuaikan.
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setTestDone(false); setAnswers({}); setTestResult(null); setApplied(false); }}>
                    🔄 Ulangi Tes
                  </button>
                  <button className="btn btn-primary" style={{ flex: 2 }} onClick={applyResult}>
                    ✅ Terapkan ke Pengaturan Energi
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Security Tab ── */}
      {tab === 'security' && (
        <div style={{ maxWidth: 480 }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#7BA5C8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              📧 Reset Password via Email
            </div>
            <div style={{ fontSize: 12, color: '#4B6A8A', marginBottom: 14, lineHeight: 1.6 }}>
              Kirim link reset password ke <strong style={{ color: '#93C5FD' }}>{user?.email}</strong>. Cek inbox termasuk folder spam.
            </div>
            {resetSent ? (
              <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 9, fontSize: 13, color: '#34D399' }}>
                ✅ Email reset password sudah dikirim! Cek inbox kamu.
              </div>
            ) : (
              <>
                {pwErr && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 10, padding: '8px 10px', background: 'rgba(239,68,68,0.07)', borderRadius: 7 }}>{pwErr}</div>}
                <button className="btn btn-primary" style={{ width: '100%', padding: 11 }} onClick={sendReset} disabled={pwSaving}>
                  {pwSaving ? '⏳ Mengirim...' : '📧 Kirim Email Reset Password'}
                </button>
              </>
            )}
          </div>

          <div className="card" style={{ background: 'rgba(59,130,246,0.03)', borderColor: 'rgba(59,130,246,0.1)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#7BA5C8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.5px' }}>ℹ️ Informasi Akun</div>
            {[
              ['Email', user?.email || '-'],
              ['Nama', user?.displayName || '-'],
              ['Login via', user?.providerData?.[0]?.providerId === 'google.com' ? '🔵 Google' : '📧 Email/Password'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '7px 0', borderBottom: '1px solid rgba(59,130,246,0.06)' }}>
                <span style={{ color: '#4B6A8A' }}>{label}</span>
                <span style={{ color: '#A3C0E0', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Demo Data Tab ── */}
      {tab === 'demo' && (
        <div style={{ maxWidth: 480 }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#60A5FA', marginBottom: 10 }}>🧪 Data Demo ADAPTIME</div>
            <div style={{ fontSize: 12, color: '#7BA5C8', lineHeight: 1.7, marginBottom: 16 }}>
              Load data demo untuk langsung mencoba semua fitur ADAPTIME. Data demo berisi:
            </div>
            {[
              ['📋 12 task', 'Berbagai deadline, kesulitan, dan status (termasuk selesai & overdue)'],
              ['📅 11 jadwal tetap', 'Jadwal kuliah dan kerja paruh waktu realistis'],
              ['⚡ Pengaturan energi', 'Preset Morning Person sudah dikonfigurasi'],
              ['🤖 Auto scheduling', 'Smart scheduling akan berjalan otomatis setelah load'],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(59,130,246,0.06)' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#C8DCFF' }}>{title}</div>
                  <div style={{ fontSize: 11, color: '#4B6A8A', marginTop: 2 }}>{desc}</div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 12, color: '#F59E0B' }}>
              ⚠️ Perhatian: Tombol ini akan menghapus semua task dan jadwal yang ada, lalu menggantinya dengan data demo.
            </div>

            {seedErr && (
              <div style={{ marginTop: 10, color: '#EF4444', fontSize: 12, padding: '8px 10px', background: 'rgba(239,68,68,0.07)', borderRadius: 7 }}>{seedErr}</div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: 12, marginTop: 14, fontSize: 14 }}
              onClick={loadDemoData}
              disabled={seeding}
            >
              {seeding ? '⏳ Memuat data demo...' : seedDone ? '✅ Data demo berhasil dimuat!' : '🚀 Load Demo Data'}
            </button>

            {seedDone && (
              <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, fontSize: 12, color: '#34D399', textAlign: 'center' }}>
                ✅ Berhasil! Buka Dashboard atau Kalender untuk melihat hasilnya. Smart scheduling sedang berjalan...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
