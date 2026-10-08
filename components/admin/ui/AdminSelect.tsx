import React, { forwardRef } from 'react';

export interface AdminSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  options?: AdminSelectOption[];
}

const AdminSelect = forwardRef<HTMLSelectElement, AdminSelectProps>(
  (
    {
      label,
      required,
      helperText,
      error,
      options,
      children,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `select-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

    const selectClasses = [
      'admin-select',
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

        <select
          {...props}
          ref={ref}
          id={inputId}
          className={selectClasses}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        {error && <span className="admin-error-text">{error}</span>}
        {!error && helperText && <span className="admin-helper-text">{helperText}</span>}
      </div>
    );
  }
);

AdminSelect.displayName = 'AdminSelect';

export default AdminSelect;
