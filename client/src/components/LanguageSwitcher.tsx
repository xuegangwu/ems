import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'zh', label: '中', title: '中文' },
  { code: 'en', label: 'EN', title: 'English' },
  { code: 'ja', label: '日', title: '日本語' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div style={{
      display: 'flex', gap: 2, padding: '3px 6px',
      background: 'rgba(255,255,255,0.06)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)',
    }}>
      {LANGS.map(lang => (
        <button
          key={lang.code}
          title={lang.title}
          onClick={() => i18n.changeLanguage(lang.code)}
          style={{
            padding: '3px 8px', border: 'none', borderRadius: 4, cursor: 'pointer',
            fontSize: 12, fontWeight: 600,
            background: i18n.language === lang.code ? 'rgba(0,212,170,0.2)' : 'transparent',
            color: i18n.language === lang.code ? '#00D4AA' : 'rgba(255,255,255,0.4)',
            transition: 'all 0.2s',
          }}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
