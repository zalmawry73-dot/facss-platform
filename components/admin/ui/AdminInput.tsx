import React, { forwardRef } from 'react';
import { type LucideIcon } from 'lucide-react';

export interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  isLtr?: boolean;
  icon?: LucideIcon;
}

const AdminInput = forwardRef<HTMLInputElement, AdminInputProps>(
  (
    {
      label,
      required,
      helperText,
      error,
      isLtr = false,
      icon: Icon,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

    const inputClasses = [
      'admin-input',
      isLtr ? 'admin-input-ltr' : '',
      error ? 'has-error' : '',
      Icon ? 'has-icon' : '',
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className="admin-form-group">
        {label && (
          <label htmlFor={inputId} className="admin-label">
            <span>{label}</span>
            {required && <span className="admin-label-required">*</span>}
          </label>
        )}

        <div style={{ position: 'relative', width: '100%' }}>
          {Icon && (
            <span
              style={{
                position: 'absolute',
                insetInlineStart: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: error ? '#DC2626' : 'var(--text-muted)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Icon size={16} />
            </span>
          )}

          <input
            {...props}
            ref={ref}
            id={inputId}
            className={inputClasses}
            style={
              Icon
                ? {
                    paddingInlineStart: '2.25rem',
                    ...props.style,
                  }
                : props.style
            }
          />
        </div>

        {error && <span className="admin-error-text">{error}</span>}
        {!error && helperText && <span className="admin-helper-text">{helperText}</span>}
      </div>
    );
  }
);

AdminInput.displayName = 'AdminInput';

export default AdminInput;
