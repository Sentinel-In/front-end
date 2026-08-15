/* ============================================================
   UI Primitives — SPEC §6
   Button, Input, Select, Textarea, Toggle,
   Tooltip, Tabs, Accordion, FilterPills
   ============================================================ */

import { useState, useRef, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

// === Button ===

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  type?: 'button' | 'submit';
}

export function Button({
  children, onClick, variant = 'secondary', size = 'md',
  disabled = false, loading = false, icon, type = 'button',
}: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    borderRadius: 'var(--radius-ctl)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    border: 'none',
    whiteSpace: 'nowrap' as const,
    fontSize: size === 'sm' ? '12px' : size === 'lg' ? '14px' : '13px',
    padding: size === 'sm' ? '4px 10px' : size === 'lg' ? '10px 20px' : '6px 14px',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary:   { backgroundColor: 'var(--color-accent)', color: 'white' },
    secondary: { backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' },
    ghost:     { backgroundColor: 'transparent', color: 'var(--color-text-muted)' },
    danger:    { backgroundColor: 'color-mix(in srgb, var(--color-critical) 12%, transparent)', color: 'var(--color-critical)' },
  };

  return (
    <button
      type={type}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled}
      style={{ ...baseStyles, ...variantStyles[variant] }}
    >
      {loading ? (
        <span style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      ) : icon}
      {children}
    </button>
  );
}

// === Input ===

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export function Input({ value, onChange, placeholder, type = 'text', disabled, icon }: InputProps) {
  return (
    <div className="flex items-center gap-2" style={{
      padding: '6px 12px',
      backgroundColor: 'var(--color-surface-2)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-ctl)',
      opacity: disabled ? 0.5 : 1,
    }}>
      {icon && <span style={{ color: 'var(--color-text-dim)', flexShrink: 0 }}>{icon}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          flex: 1,
          background: 'none',
          border: 'none',
          outline: 'none',
          color: 'var(--color-text)',
          fontSize: '13px',
          fontFamily: 'var(--font-sans)',
        }}
      />
    </div>
  );
}

// === Select ===

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}

export function Select({ value, onChange, options, placeholder, disabled }: SelectProps) {
  return (
    <div style={{
      position: 'relative',
      opacity: disabled ? 0.5 : 1,
    }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          appearance: 'none',
          width: '100%',
          padding: '6px 32px 6px 12px',
          backgroundColor: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-ctl)',
          color: 'var(--color-text)',
          fontSize: '13px',
          fontFamily: 'var(--font-sans)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown
        size={14}
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--color-text-muted)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

// === Textarea ===

interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  minLength?: number;
}

export function Textarea({ value, onChange, placeholder, rows = 3, disabled, minLength }: TextareaProps) {
  const isValid = !minLength || value.length >= minLength;
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '8px 12px',
          backgroundColor: 'var(--color-surface-2)',
          border: `1px solid ${isValid ? 'var(--color-border)' : 'var(--color-critical)'}`,
          borderRadius: 'var(--radius-ctl)',
          color: 'var(--color-text)',
          fontSize: '13px',
          fontFamily: 'var(--font-sans)',
          resize: 'vertical',
          outline: 'none',
          opacity: disabled ? 0.5 : 1,
        }}
      />
      {minLength && (
        <div style={{ fontSize: '11px', color: isValid ? 'var(--color-text-dim)' : 'var(--color-critical)', marginTop: '4px' }}>
          {value.length}/{minLength} characters minimum
        </div>
      )}
    </div>
  );
}

// === Toggle ===

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className="inline-flex items-center gap-2" style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: '36px',
          height: '20px',
          borderRadius: 'var(--radius-pill)',
          backgroundColor: checked ? 'var(--color-accent)' : 'var(--color-surface-3)',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          position: 'relative',
          padding: 0,
          transition: 'background-color 150ms ease',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '18px' : '2px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: 'white',
            transition: 'left 150ms ease',
          }}
        />
      </button>
      {label && <span style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>{label}</span>}
    </label>
  );
}

// === Tooltip ===

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      style={{ position: 'relative', display: 'inline-flex' }}
    >
      {children}
      {show && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '4px 8px',
            backgroundColor: 'var(--color-surface-3)',
            border: '1px solid var(--color-border-2)',
            borderRadius: 'var(--radius-chip)',
            fontSize: '12px',
            color: 'var(--color-text)',
            whiteSpace: 'nowrap',
            zIndex: 50,
            pointerEvents: 'none',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}

// === Tabs ===

interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
}

export function Tabs({ items, defaultTab }: TabsProps) {
  const [active, setActive] = useState(defaultTab || items[0]?.id || '');
  const activeItem = items.find((i) => i.id === active);

  return (
    <div>
      <div className="flex items-center gap-1" style={{ borderBottom: '1px solid var(--color-border)', marginBottom: '16px' }}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            style={{
              padding: '8px 14px',
              border: 'none',
              borderBottom: `2px solid ${active === item.id ? 'var(--color-accent)' : 'transparent'}`,
              background: 'none',
              cursor: 'pointer',
              color: active === item.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
              fontSize: '13px',
              fontWeight: active === item.id ? 600 : 400,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {activeItem && activeItem.content}
    </div>
  );
}

// === Accordion ===

interface AccordionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function Accordion({ title, children, defaultOpen = false }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-panel)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full"
        style={{
          padding: '10px 14px',
          background: 'var(--color-surface-2)',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text)',
          fontSize: '13px',
          fontWeight: 500,
          fontFamily: 'var(--font-sans)',
          width: '100%',
          textAlign: 'left',
        }}
      >
        {title}
        <ChevronDown
          size={14}
          style={{
            color: 'var(--color-text-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 150ms ease',
          }}
        />
      </button>
      {open && <div style={{ padding: '12px 14px', borderTop: '1px solid var(--color-border)' }}>{children}</div>}
    </div>
  );
}

// === FilterPills ===

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterPillsProps {
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function FilterPills({ options, selected, onChange }: FilterPillsProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            onClick={() => toggle(opt.id)}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-pill)',
              border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
              backgroundColor: isSelected ? 'var(--color-accent-bg)' : 'transparent',
              color: isSelected ? 'var(--color-accent)' : 'var(--color-text-muted)',
              fontSize: '12px',
              fontWeight: isSelected ? 500 : 400,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span style={{ marginLeft: '4px', opacity: 0.6 }}>({opt.count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
