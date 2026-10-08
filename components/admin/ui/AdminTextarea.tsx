import React, { forwardRef } from 'react';

export interface AdminTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
}

const AdminTextarea = forwardRef<HTMLTextAreaElement, AdminTextareaProps>(
  (
    {
      label,
      required,
      helperText,
      error,
      className = '',
      id,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `textarea-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

    const textareaClasses = [
      'admin-textarea',
      error ? 'has-error' : '',
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

        <textarea
          {...props}
          ref={ref}
          id={inputId}
          rows={rows}
          className={textareaClasses}
        />

        {error && <span className="admin-error-text">{error}</span>}
        {!error && helperText && <span className="admin-helper-text">{helperText}</span>}
      </div>
    );
  }
);

AdminTextarea.displayName = 'AdminTextarea';

export default AdminTextarea;
