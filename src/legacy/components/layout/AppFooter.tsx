// RID-09: Developer credits footer.
import React from 'react';
import mahdiLogo from '../../assets/mahdi-logo.asset.json';
import claimLogo from '@/assets/claim-manager-logo.png.asset.json';

const DEVELOPERS = [
  {
    id: 'ghaffari',
    name: 'مهندس محمدامین غفاری',
    role1: 'طراحی و توسعه فنی',
    role2: 'مدیر ادعا و قراردادهای صنعت ساخت',
    contactLabel: 'تماس',
    contactValue: '09128526773',
    email: '',
    avatarSrc: claimLogo.url as string,
  },
  {
    id: 'pourabdollah',
    name: 'دکتر مهدی پورعبداله',
    role1: 'طراحی و توسعه نرم‌افزاری',
    role2: 'مهندس داده و معمار محصول',
    contactLabel: 'تماس',
    contactValue: '09105557133',
    email: 'mahdi.poorabdollah@gmail.com',
    avatarSrc: mahdiLogo.url as string,
  },
];

const Avatar: React.FC<{ name: string; src: string | null }> = ({ name, src }) => {
  if (src) {
    return <img src={src} alt={name} className="h-16 w-16 rounded-full object-cover border-2 border-white/10" />;
  }
  const initial = name.replace(/^(مهندس|دکتر)\s+/, '').charAt(0);
  return (
    <div
      className="h-16 w-16 rounded-full flex items-center justify-center text-white font-black text-xl border-2 border-white/10 shadow-lg"
      style={{ background: '#2e7d32' }}
    >
      {initial}
    </div>
  );
};

const AppFooter: React.FC = () => {
  return (
    <footer
      className="w-full mt-12 no-print"
      style={{ background: '#1a2535', direction: 'rtl' }}
    >
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 md:gap-0">
          {DEVELOPERS.map((dev, idx) => (
            <React.Fragment key={dev.id}>
              <div className="flex items-center gap-4 px-6 flex-1 max-w-md justify-center md:justify-start group">
                <div className="transition-transform group-hover:scale-105">
                  <Avatar name={dev.name} src={dev.avatarSrc} />
                </div>
                <div className="flex flex-col gap-0.5 text-right">
                  <div className="text-white font-bold" style={{ fontSize: 15 }}>
                    {dev.name}
                  </div>
                  <div style={{ color: '#90caf9', fontSize: 12 }}>{dev.role1}</div>
                  <div style={{ color: '#b0bec5', fontSize: 11 }}>{dev.role2}</div>
                  {dev.contactValue && (
                    <a href={`tel:${dev.contactValue}`} className="flex items-center gap-1.5 mt-1 hover:opacity-80 transition-opacity" style={{ color: '#b0bec5', fontSize: 11 }} dir="ltr">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{dev.contactValue}</span>
                    </a>
                  )}
                  {dev.email && (
                    <a href={`mailto:${dev.email}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity" style={{ color: '#b0bec5', fontSize: 11 }} dir="ltr">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{dev.email}</span>
                    </a>
                  )}
                  {!dev.contactValue && !dev.email && (
                    <div style={{ color: '#b0bec5', fontSize: 11 }}>{dev.contactLabel}: —</div>
                  )}
                </div>
              </div>
              {idx === 0 && (
                <div
                  className="hidden md:block w-px self-stretch"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <div
          className="text-center mt-6 pt-4 border-t"
          style={{ color: '#607d8b', fontSize: 10, borderColor: 'rgba(255,255,255,0.08)' }}
        >
          © 1405 ClaimManager — تمام حقوق محفوظ است
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
