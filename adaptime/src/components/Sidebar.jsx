const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'calendar',
    label: 'Kalender',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
      </svg>
    ),
  },
  {
    id: 'tasks',
    label: 'Task Management',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 11l3 3 7-7M5 12H3M5 6H3M5 18H3"/>
        <rect x="7" y="3" width="14" height="18" rx="2"/>
      </svg>
    ),
  },
  {
    id: 'schedule',
    label: 'Jadwal Tetap',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  {
    id: 'energy',
    label: 'Pengaturan Energi',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 20V10M12 20V4M6 20v-6"/>
      </svg>
    ),
  },
];

export default function Sidebar({ view, setView, user, onLogout }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <span>ADAPTIME</span>
        <em>BETA</em>
      </div>

      <div style={{ flex: 1 }}>
        {NAV_ITEMS.map(n => (
          <div
            key={n.id}
            className={`nav-item ${view === n.id ? 'active' : ''}`}
            onClick={() => setView(n.id)}
          >
            {n.icon}
            <span>{n.label}</span>
          </div>
        ))}
      </div>

      <div className="sidebar-bottom">
        <div className="user-info">
          <div className="user-avatar">
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-role">Mahasiswa</div>
          </div>
        </div>
        <div className="logout-btn" onClick={onLogout}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Logout
        </div>
      </div>
    </div>
  );
}
