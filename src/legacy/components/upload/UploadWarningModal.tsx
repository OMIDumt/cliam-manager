// RID-10: One-time per-session upload warning modal.
// SESSION_KEY is checked on every UploadPage mount. Modal blocks all interaction
// until explicitly confirmed. Backdrop click and Escape key are disabled.
import React from 'react';

export const UPLOAD_WARNING_SESSION_KEY = 'claimmanager_upload_warning_v1';

interface UploadWarningModalProps {
  onConfirm: () => void;
}

const UploadWarningModal: React.FC<UploadWarningModalProps> = ({ onConfirm }) => {
  // Trap Escape key
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') e.preventDefault();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Body scroll lock
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(10, 20, 35, 0.82)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        direction: 'rtl',
      }}
      /* Intentionally NO onClick handler on backdrop — user must use button */
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="upload-warning-title"
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '36px 32px',
          maxWidth: 520,
          width: '90%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
          textAlign: 'right',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 48 }}>⚠️</span>
        </div>

        <h2
          id="upload-warning-title"
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#b71c1c',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          اخطار مهم
        </h2>

        <p
          style={{
            fontSize: 14,
            lineHeight: 2.0,
            color: '#37474f',
            marginBottom: 32,
            textAlign: 'justify',
          }}
        >
          با توجه به اینکه این نرم‌افزار از هوش مصنوعی بهره‌گیری می‌کند، آپلود اسناد
          نامرتبط، مخدوش، بدون ارتباط، نامفهوم یا نامشخص و موارد مشابه، منجر به ارائه
          خروجی نادرست خواهد شد.
          <br />
          <br />
          از این رو تهیه‌کنندگان این نرم‌افزار مسئولیتی در قبال چنین مشکلاتی
          نخواهند داشت.
        </p>

        <button
          onClick={onConfirm}
          style={{
            width: '100%',
            padding: '14px 0',
            background: '#1565c0',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-persian)',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#0d47a1')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#1565c0')}
        >
          متوجه شدم، ادامه می‌دهم
        </button>
      </div>
    </div>
  );
};

export default UploadWarningModal;
