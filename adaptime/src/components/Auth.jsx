import { useState } from 'react';

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    setErr('');
    if (mode === 'register') {
      if (!name || !email || !pw) { setErr('Semua field wajib diisi'); return; }
      if (pw.length < 6) { setErr('Password minimal 6 karakter'); return; }
      onLogin({ name, email });
    } else {
      if (!email || !pw) { setErr('Email dan password wajib diisi'); return; }
      onLogin({ name: email.split('@')[0], email });
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <h1>⏰ ADAPTIME</h1>
          <p>Adaptive Energy-Based Smart Scheduling</p>
        </div>

        <div className="auth-tabs">
          <div
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setErr(''); }}
          >Masuk</div>
          <div
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setErr(''); }}
          >Daftar Akun</div>
        </div>

        {mode === 'register' && (
          <div className="form-group">
            <label>Nama Lengkap</label>
            <input
              className="inp"
              placeholder="Nama lengkap kamu"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
        )}

        <div className="form-group">
          <label>Email</label>
          <input
            className="inp"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            className="inp"
            type="password"
            placeholder="••••••••"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
          />
        </div>

        {err && (
          <div style={{
            color: '#EF4444', fontSize: 12, marginBottom: 12,
            padding: '8px 10px', background: 'rgba(239,68,68,0.07)', borderRadius: 7,
          }}>{err}</div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '11px', fontSize: 14, marginTop: 4 }}
          onClick={submit}
        >
          {mode === 'login' ? 'Masuk ke ADAPTIME' : 'Buat Akun Baru'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#3D5A7A' }}>
          {mode === 'login'
            ? 'Demo: masukkan email & password apapun'
            : 'Gratis selamanya · Tidak perlu kartu kredit'}
        </p>
      </div>
    </div>
  );
}
