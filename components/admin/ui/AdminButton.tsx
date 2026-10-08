'use client';

import React from 'react';
import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';

export type AdminButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
export type AdminButtonSize = 'sm' | 'md' | 'lg';

interface AdminButtonBaseProps {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  icon?: LucideIcon | React.ReactNode;
  iconPosition?: 'start' | 'end';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

interface AdminButtonAsButtonProps extends AdminButtonBaseProps, React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: undefined;
}

interface AdminButtonAsLinkProps extends AdminButtonBaseProps {
  href: string;
  target?: string;
  rel?: string;
}

export type AdminButtonProps = AdminButtonAsButtonProps | AdminButtonAsLinkProps;

export default function AdminButton({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconPosition = 'start',
  loading = false,
  disabled = false,
  className = '',
  style,
  children,
  href,
  ...rest
}: AdminButtonProps) {
  const classes = [
    'admin-btn',
    `admin-btn-${variant}`,
    `admin-btn-${size}`,
    className,
  ].filter(Boolean).join(' ');

  const iconElement = loading ? (
    <span
      style={{
        display: 'inline-block',
        width: '14px',
        height: '14px',
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'adminSpin 0.75s linear infinite',
      }}
    />
  ) : React.isValidElement(Icon) ? (
    Icon
  ) : Icon ? (
    React.createElement(Icon as any, { size: size === 'sm' ? 14 : size === 'lg' ? 18 : 16 })
  ) : null;

  const content = (
    <>
      {iconPosition === 'start' && iconElement}
      {children && <span>{children}</span>}
      {iconPosition === 'end' && iconElement}
    </>
  );

  if (href) {
    const linkProps = rest as AdminButtonAsLinkProps;
    return (
      <Link
        href={href}
        className={classes}
        style={style}
        target={linkProps.target}
        rel={linkProps.rel}
        aria-disabled={disabled || loading}
      >
        {content}
      </Link>
    );
  }

  const btnProps = rest as AdminButtonAsButtonProps;
  return (
    <button
      {...btnProps}
      type={btnProps.type || 'button'}
      className={classes}
      disabled={disabled || loading}
    >
      {content}
    </button>
  );
}
