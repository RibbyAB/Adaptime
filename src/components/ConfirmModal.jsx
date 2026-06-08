export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Hapus',
  cancelLabel  = 'Batal',
  onConfirm,
  onCancel,
  danger = true,
}) {
  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      style={{ zIndex: 1100 }}
    >
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>

        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: 14,
            background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
            border: `1px solid ${danger ? 'rgba(239,68,68,0.25)' : 'rgba(59,130,246,0.25)'}`,
            fontSize: 24,
          }}>
            {danger ? '🗑️' : '❓'}
          </div>
        </div>

        {/* Title */}
        <div style={{
          fontSize: 17, fontWeight: 800, color: '#E2ECFF',
          textAlign: 'center', marginBottom: 10,
          letterSpacing: '-0.3px',
        }}>
          {title}
        </div>

        {/* Message */}
        <div style={{
          fontSize: 13, color: '#7BA5C8', textAlign: 'center',
          lineHeight: 1.65, marginBottom: 24,
        }}>
          {message}
        </div>

        {/* Buttons — equal width, teks lebih jelas */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '11px 0',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'Outfit, sans-serif',
              borderRadius: 9,
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#93C5FD',
              transition: 'background .15s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseOut={e  => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '11px 0',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'Outfit, sans-serif',
              borderRadius: 9,
              cursor: 'pointer',
              background: danger
                ? 'linear-gradient(135deg,#B91C1C,#EF4444)'
                : 'linear-gradient(135deg,#1D4ED8,#3B82F6)',
              border: 'none',
              color: '#fff',
              boxShadow: danger
                ? '0 4px 14px rgba(239,68,68,0.35)'
                : '0 4px 14px rgba(59,130,246,0.35)',
              transition: 'opacity .15s',
            }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
            onMouseOut={e  => e.currentTarget.style.opacity = '1'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
