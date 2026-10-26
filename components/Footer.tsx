'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  ShieldCheck, 
  MapPin, 
  Mail, 
  Globe, 
  Lock, 
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

export interface FooterActivityField {
  id?: string;
  key?: string;
  titleAr?: string | null;
  titleEn?: string | null;
  link?: string | null;
}

interface FooterProps {
  contactAddressAr?: string;
  contactAddressEn?: string;
  contactEmail?: string;
  brandData?: {
    primaryAr?: string;
    primaryEn?: string;
    secondaryAr?: string;
    secondaryEn?: string;
  };
  footerData?: {
    aboutAr?: string;
    aboutEn?: string;
    rightsAr?: string;
    rightsEn?: string;
    noticeAr?: string;
    noticeEn?: string;
    sloganAr?: string;
    sloganEn?: string;
  };
  activityFields?: FooterActivityField[];
}

export default function Footer({
  contactAddressAr,
  contactAddressEn,
  contactEmail,
  brandData,
  footerData,
  activityFields,
}: FooterProps = {}) {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const { t, locale, dir } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const isAr = locale === 'ar';
  const address = isAr ? (contactAddressAr || 'العاصمة عدن، الجمهورية اليمنية') : (contactAddressEn || 'Aden Capital, Republic of Yemen');
  const email = contactEmail || 'info@facss.org';

  const brandPrimary = (locale === 'ar' ? brandData?.primaryAr : brandData?.primaryEn) || (locale === 'ar' ? 'مركز الحلول المتكاملة' : 'Integrated Solutions Center');
  const brandSecondary = (locale === 'ar' ? brandData?.secondaryAr : brandData?.secondaryEn) || (locale === 'ar' ? 'للأمن والسلامة' : 'for Safety and Security');
  const sloganText = (locale === 'ar' ? footerData?.sloganAr : footerData?.sloganEn) || t.slogan;
  const footerAboutText = (locale === 'ar' ? footerData?.aboutAr : footerData?.aboutEn) || t.footerAbout;
  const footerRightsText = (locale === 'ar' ? footerData?.rightsAr : footerData?.rightsEn) || t.footerRights;
  const footerNoticeText = (locale === 'ar' ? footerData?.noticeAr : footerData?.noticeEn) || t.institutionalNotice;

  const renderedActivityFields = (activityFields && activityFields.length > 0)
    ? activityFields.map((f) => ({
        title: isAr ? (f.titleAr || f.titleEn || '') : (f.titleEn || f.titleAr || ''),
        href: f.link || (f.key ? `/services#${f.key}` : '/services'),
      }))
    : [];

  return (
    <footer className="site-footer" style={{ backgroundColor: 'var(--facss-green-950)', color: 'var(--text-on-dark)', borderTop: '1px solid var(--border-dark)' }}>
      <div className="container">
        <div className="footer-grid">
          {/* Col 1: Brand & Identity */}
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <img 
                src="/images/brand/logo-symbol-dark.png" 
                alt={t.siteTitle} 
                style={{ width: '48px', height: 'auto', objectFit: 'contain' }} 
              />
              <div>
                <h3 className="gold-text" style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--color-gold-400)' }}>
                  {brandPrimary}
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#E2E8F0', margin: '2px 0 0 0' }}>
                  {brandSecondary}
                </p>
              </div>
            </div>

            <div style={{ marginTop: '1.2rem', padding: '0.75rem', background: 'rgba(181, 146, 84, 0.08)', borderRadius: '8px', border: '1px solid var(--border-dark)' }}>
              <p style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-gold-light)', margin: 0 }}>
                {sloganText}
              </p>
            </div>

            <p style={{ marginTop: '1rem', fontSize: '0.86rem', color: 'var(--text-on-dark-muted)', lineHeight: 1.65 }}>
              {footerAboutText}
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
              <li><Link href="/verify">{t.verifyCertificate}</Link></li>
              <li><Link href="/request-service" style={{ color: 'var(--color-gold-light)', fontWeight: 700 }}>{t.navRequestService}</Link></li>
            </ul>
          </div>

          {/* Col 3: Approved Humanitarian Activity Fields */}
          <div>
            <h4 className="footer-heading">{t.servicesSectionTitle}</h4>
            {renderedActivityFields.length > 0 ? (
              <ul className="footer-links">
                {renderedActivityFields.map((field, idx) => (
                  <li key={idx}>
                    <Link href={field.href}>
                      {field.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.84rem', color: 'var(--text-on-dark-muted)', lineHeight: 1.6, margin: 0 }}>
                {isAr ? 'سيتم إدراج مجالات النشاط المعتمدة قريباً عبر لوحة الإدارة.' : 'Activity fields will be published soon via admin.'}
              </p>
            )}
          </div>

          {/* Col 4: Institutional Coordination */}
          <div>
            <h4 className="footer-heading">{t.contactTitle}</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem', color: 'var(--text-on-dark-muted)', padding: 0, margin: 0 }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <MapPin size={18} style={{ color: 'var(--color-gold)', flexShrink: 0, marginTop: '2px' }} />
                <span>{address}</span>
              </li>
              {email && (
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <Mail size={18} style={{ color: 'var(--color-gold)', flexShrink: 0, marginTop: '2px' }} />
                  <a href={`mailto:${email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {email}
                  </a>
                </li>
              )}
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <Globe size={18} style={{ color: 'var(--color-gold)', flexShrink: 0, marginTop: '2px' }} />
                <span>
                  {locale === 'ar' ? 'التواصل المؤسسي متاح عبر نموذج الاستفسارات بالموقع' : 'Institutional coordination via the official platform form'}
                </span>
              </li>
            </ul>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
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

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>{footerRightsText}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-gold-light)', fontSize: '0.82rem' }}>
              <ShieldCheck size={16} />
              <span>{footerNoticeText}</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
