'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  ShieldCheck, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Lock, 
  ArrowUpRight 
} from 'lucide-react';

export default function Footer() {
  const { t, locale } = useLanguage();
  const [footerSettings, setFooterSettings] = React.useState({
    email: 'info@facss-aden.com',
    phone: '+967 2 245 800',
    address: 'عدن، خور مكسر - الجمهورية اليمنية',
  });

  React.useEffect(() => {
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setFooterSettings({
            email: data.settings.OFFICIAL_EMAIL || 'info@facss-aden.com',
            phone: data.settings.OFFICIAL_PHONE || '+967 2 245 800',
            address: data.settings.OFFICIAL_ADDRESS || 'عدن، خور مكسر - الجمهورية اليمنية',
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="site-footer" style={{ backgroundColor: 'var(--facss-green-950)', color: 'var(--text-on-dark)', borderTop: '1px solid var(--border-dark)' }}>
      <div className="container">
        <div className="footer-grid">
          {/* Col 1: Brand & Slogans */}
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <img 
                src="/images/logo.png" 
                alt="FACSS Official Logo" 
                style={{ width: '56px', height: '56px', objectFit: 'contain' }} 
              />
              <div>
                <h3 className="gold-text" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {t.siteAcronym}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  {locale === 'ar' 
                    ? 'مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية' 
                    : 'Aden First Center for Security Services'}
                </p>
              </div>
            </div>

            <div style={{ marginTop: '1.2rem', padding: '0.75rem', background: 'rgba(197,155,39,0.08)', borderRadius: '8px', border: '1px solid rgba(197,155,39,0.2)' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-gold-light)', margin: 0 }}>
                {t.slogan}
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                {t.sloganSub}
              </p>
            </div>

            <p style={{ marginTop: '1rem', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {t.footerAbout}
            </p>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 className="footer-heading">{t.quickLinks}</h4>
            <ul className="footer-links">
              <li><Link href="/about">{t.navAbout}</Link></li>
              <li><Link href="/services">{t.navServices}</Link></li>
              <li><Link href="/training">{t.navTraining}</Link></li>
              <li><Link href="/research">{t.navResearch}</Link></li>
              <li><Link href="/contact">{t.navContact}</Link></li>
              <li><Link href="/request-service" style={{ color: 'var(--color-gold-light)', fontWeight: 700 }}>{t.navRequestService}</Link></li>
            </ul>
          </div>

          {/* Col 3: Operational Services */}
          <div>
            <h4 className="footer-heading">{t.securityServices}</h4>
            <ul className="footer-links">
              <li><Link href="/services/guarding-services">{t.footerGuardingLink}</Link></li>
              <li><Link href="/services/physical-security-assessment">{t.footerAssessmentLink}</Link></li>
              <li><Link href="/services/security-consultations">{t.footerConsultingLink}</Link></li>
              <li><Link href="/services/electronic-security-solutions">{t.footerElectronicLink}</Link></li>
              <li><Link href="/services/security-and-safety-training">{t.footerTrainingLink}</Link></li>
              <li><Link href="/services/security-risk-analysis">{t.footerRiskLink}</Link></li>
            </ul>
          </div>

          {/* Col 4: Institutional Contact Info */}
          <div>
            <h4 className="footer-heading">{t.contactTitle}</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <MapPin size={18} style={{ color: 'var(--color-gold)', flexShrink: 0, marginTop: '3px' }} />
                <span>
                  {locale === 'en' && footerSettings.address.includes('خور مكسر')
                    ? 'Aden Capital - Khor Maksar - Diplomatic District'
                    : footerSettings.address}
                </span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Mail size={18} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
                <span>{footerSettings.email}</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Phone size={18} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
                <span>{footerSettings.phone}</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Globe size={18} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
                <span>www.facss-aden.com</span>
              </li>
            </ul>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.6rem' }}>
              <Link href="/portal/client" className="btn btn-outline btn-sm" style={{ fontSize: '0.78rem' }}>
                <Lock size={13} />
                <span>{t.navClientPortal}</span>
              </Link>
              <Link href="/portal/trainee" className="btn btn-outline btn-sm" style={{ fontSize: '0.78rem' }}>
                <Lock size={13} />
                <span>{t.navTraineePortal}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Bottom Legal */}
        <div className="footer-bottom">
          <p>{t.footerRights}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-gold-light)' }}>
              <ShieldCheck size={16} />
              <span>{t.institutionalNotice}</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
