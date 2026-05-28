import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErr('');
    setLoading(true);
    try {
      if (mode === 'register') {
        if (!name.trim()) { setErr('Nama lengkap wajib diisi'); setLoading(false); return; }
        if (pw.length < 6) { setErr('Password minimal 6 karakter'); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(auth, email, pw);
        await updateProfile(cred.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email, pw);
      }
    } catch (e) {
      const msg = {
        'auth/email-already-in-use': 'Email sudah terdaftar',
        'auth/invalid-email': 'Format email tidak valid',
        'auth/weak-password': 'Password terlalu lemah (min 6 karakter)',
        'auth/user-not-found': 'Akun tidak ditemukan',
        'auth/wrong-password': 'Email atau password salah',
        'auth/invalid-credential': 'Email atau password salah',
        'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi nanti.',
      }[e.code] || 'Terjadi kesalahan. Coba lagi.';
      setErr(msg);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setErr('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setErr('Google sign-in gagal. Coba lagi.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="auth-screen">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <h1>⏰ ADAPTIME</h1>
          <p>Adaptive Energy-Based Smart Scheduling</p>
        </div>

        <div className="auth-tabs">
          <div className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setErr(''); }}>
            Masuk
          </div>
          <div className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setErr(''); }}>
            Daftar Akun
          </div>
        </div>

        {mode === 'register' && (
          <div className="form-group">
            <label>Nama Lengkap</label>
            <input className="inp" placeholder="Nama lengkap kamu" value={name} onChange={e => setName(e.target.value)} />
          </div>
        )}

        <div className="form-group">
          <label>Email</label>
          <input className="inp" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            className="inp" type="password" placeholder="••••••••"
            value={pw} onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {err && (
          <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12, padding: '8px 10px', background: 'rgba(239,68,68,0.07)', borderRadius: 7 }}>
            {err}
          </div>
        )}

        <button className="btn btn-primary" style={{ width: '100%', padding: '11px', fontSize: 14, marginTop: 4 }} onClick={handleSubmit} disabled={loading}>
          {loading ? '⏳ Loading...' : mode === 'login' ? 'Masuk ke ADAPTIME' : 'Buat Akun Baru'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(59,130,246,0.15)' }} />
          <span style={{ fontSize: 11, color: '#3D5A7A' }}>atau</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(59,130,246,0.15)' }} />
        </div>

        <button
          onClick={handleGoogle} disabled={loading}
          style={{
            width: '100%', padding: '10px', fontSize: 13, fontWeight: 600,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 9, color: '#E2ECFF', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Outfit, sans-serif',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Masuk dengan Google
        </button>
      </div>
    </div>
  );
}
