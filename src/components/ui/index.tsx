// src/components/ui/index.tsx
'use client';

import React from 'react';
import clsx from 'clsx';
import { Star } from 'lucide-react';

// ─── Button ─────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const btnBase =
  'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

const btnVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500',
  secondary:
    'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 focus:ring-gray-300',
  danger:
    'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 focus:ring-red-300',
  ghost: 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 focus:ring-gray-300',
};

const btnSizes: Record<ButtonSize, string> = {
  sm:  'text-xs px-3 py-1.5',
  md:  'text-sm px-4 py-2',
  lg:  'text-base px-5 py-2.5',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  loading,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(btnBase, btnVariants[variant], btnSizes[size], className)}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      )}
      {children}
    </button>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({ children, className, onClick, hover }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-gray-100 shadow-sm',
        hover && 'cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ─── Badge ───────────────────────────────────────────────────────────────────

type BadgeColor = 'green' | 'yellow' | 'red' | 'blue' | 'gray';

const badgeColors: Record<BadgeColor, string> = {
  green:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  yellow: 'bg-amber-50 text-amber-700 border-amber-200',
  red:    'bg-red-50 text-red-700 border-red-200',
  blue:   'bg-blue-50 text-blue-700 border-blue-200',
  gray:   'bg-gray-100 text-gray-600 border-gray-200',
};

export function Badge({
  color,
  children,
  className,
}: {
  color: BadgeColor;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        badgeColors[color],
        className
      )}
    >
      {children}
    </span>
  );
}

// ─── StarRating ──────────────────────────────────────────────────────────────

export function StarRating({
  value,
  onChange,
  size = 18,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  const [hovered, setHovered] = React.useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          className={clsx(
            'transition-colors',
            onChange ? 'cursor-pointer' : 'cursor-default'
          )}
          onMouseEnter={() => onChange && setHovered(i)}
          onMouseLeave={() => onChange && setHovered(0)}
          onClick={() => onChange?.(i)}
        >
          <Star
            size={size}
            className={clsx(
              (hovered || value) >= i
                ? 'fill-amber-400 text-amber-400'
                : 'fill-gray-200 text-gray-200'
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────

export const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(inputClass, props.className)} {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(inputClass, 'cursor-pointer', props.className)}
      {...props}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(inputClass, 'resize-none', props.className)}
      {...props}
    />
  );
}

// ─── FormField ───────────────────────────────────────────────────────────────

export function FormField({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export function Modal({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  // Close on Escape key
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className={clsx(
          'bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto',
          wide ? 'max-w-2xl' : 'max-w-lg'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2
            className="text-xl text-gray-900"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition p-1"
          >
            ✕
          </button>
        </div>
        <div className="px-6 pb-6 pt-4">{children}</div>
      </div>
    </div>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-400 mb-4">{description}</p>}
      {action}
    </div>
  );
}

// ─── ViabilityBadge ──────────────────────────────────────────────────────────

import type { ViabilityStatus } from '@/types';

const viabilityConfig: Record<
  ViabilityStatus,
  { color: BadgeColor; label: string }
> = {
  green:  { color: 'green',  label: '✓ Viável' },
  yellow: { color: 'yellow', label: '⚠ FHS Necessário' },
  red:    { color: 'red',    label: '✕ Inviável' },
};

export function ViabilityBadge({ status }: { status: ViabilityStatus }) {
  const cfg = viabilityConfig[status];
  return <Badge color={cfg.color}>{cfg.label}</Badge>;
}

// ─── MetricCard ──────────────────────────────────────────────────────────────

export function MetricCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'green' | 'red' | 'amber';
}) {
  const textColor =
    color === 'green'
      ? 'text-emerald-600'
      : color === 'red'
      ? 'text-red-600'
      : color === 'amber'
      ? 'text-amber-600'
      : 'text-gray-900';

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className={clsx('text-2xl font-semibold', textColor)}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── SectionHeader ───────────────────────────────────────────────────────────

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1
          className="text-2xl text-gray-900"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
