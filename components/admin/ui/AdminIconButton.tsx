'use client';

import React from 'react';
import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';
import { type AdminButtonVariant } from './AdminButton';

export interface AdminIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon | React.ReactNode;
  title?: string;
  tooltip?: string;
  variant?: AdminButtonVariant;
  size?: 'sm' | 'md';
  href?: string;
}

export default function AdminIconButton({
  icon: Icon,
  title,
  tooltip,
  variant = 'secondary',
  size = 'md',
  href,
  className = '',
  ...props
}: AdminIconButtonProps) {
  const dimension = size === 'sm' ? '30px' : '36px';
  const iconSize = size === 'sm' ? 14 : 17;
  const label = tooltip || title || '';

  const style: React.CSSProperties = {
    width: dimension,
    height: dimension,
    padding: 0,
    borderRadius: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const classes = [
    'admin-btn',
    `admin-btn-${variant}`,
    className,
  ].filter(Boolean).join(' ');

  const iconElement = React.isValidElement(Icon)
    ? Icon
    : Icon
    ? React.createElement(Icon as any, { size: iconSize })
    : null;

  if (href) {
    return (
      <Link href={href} className={classes} style={style} title={label} aria-label={label}>
        {iconElement}
      </Link>
    );
  }

  return (
    <button
      {...props}
      type={props.type || 'button'}
      className={classes}
      style={style}
      title={label}
      aria-label={label}
    >
      {iconElement}
    </button>
  );
}
