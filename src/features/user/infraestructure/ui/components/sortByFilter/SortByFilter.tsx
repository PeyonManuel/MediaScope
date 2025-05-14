import React, { useState, useRef, useEffect } from 'react';
import styles from './SortByFilter.module.css'; // Adjust path as needed

const SORT_OPTIONS = [
  {
    label: 'When watched/read',
    options: [
      { label: 'Newest first', value: 'watched-desc' },
      { label: 'Earliest first', value: 'watched-asc' },
    ],
  },
  {
    label: 'By Release Date',
    options: [
      { label: 'Newest first', value: 'release-desc' },
      { label: 'Earliest first', value: 'release-asc' },
    ],
  },
  {
    label: 'By Name',
    options: [
      { label: 'A-Z', value: 'name-asc' },
      { label: 'Z-A', value: 'name-desc' },
    ],
  },
  {
    label: 'By Average Rating',
    options: [
      { label: 'Highest first', value: 'avg-desc' },
      { label: 'Lowest first', value: 'avg-asc' },
    ],
  },
  {
    label: 'By Your Rating',
    options: [
      { label: 'Highest first', value: 'rating-desc' },
      { label: 'Lowest first', value: 'rating-asc' },
    ],
  },
];

export interface SortSelectProps {
  onChange: Function;
  value: string;
}

export default function SortSelect({ onChange, value }: SortSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Find current label
  const current = SORT_OPTIONS.flatMap((s) => s.options).find(
    (o) => o.value === value
  );

  return (
    <div className={styles.filtergroup} ref={ref}>
      <button
        className={styles.selectinput}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        type="button"
        tabIndex={0}>
        {current ? current.label : 'Sort by...'}
        <span className={styles.chevron}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ul className={styles.dropdown} role="listbox">
          {SORT_OPTIONS.map((section) => (
            <li key={section.label}>
              <div className={styles.sectionLabel}>{section.label}</div>
              <ul>
                {section.options.map((option) => (
                  <li
                    key={option.value}
                    className={`${styles.option} ${value === option.value ? styles.active : ''}`}
                    role="option"
                    aria-selected={value === option.value}
                    tabIndex={0}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}>
                    {option.label}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
