import React from 'react';

export interface AdminCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: React.ReactNode;
  helperText?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function AdminCheckbox({
  label,
  helperText,
  checked,
  onChange,
  disabled,
  id,
  className = '',
  ...props
}: AdminCheckboxProps) {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.85rem' }}>
      <label htmlFor={checkboxId} className={`admin-checkbox-wrap ${className}`}>
        <input
          {...props}
          type="checkbox"
          id={checkboxId}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="admin-checkbox"
        />
        <span>{label}</span>
      </label>
      {helperText && (
        <span className="admin-helper-text" style={{ paddingInlineStart: '1.65rem' }}>
          {helperText}
        </span>
      )}
    </div>
  );
}
