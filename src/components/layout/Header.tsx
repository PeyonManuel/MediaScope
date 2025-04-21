// src/components/layout/Header.tsx
// Refactored for TanStack Router

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
// --- CHANGE: Import Link from TanStack Router ---
import { Link } from '@tanstack/react-router';
// --- ---
import { selectTheme, setTheme } from '../../store/features/ui/uiSlice'; // Adjust path if needed
import styles from './Header.module.css';
import { sunSvg, moonSvg } from '../ui/svgs';

// --- SVG Icons (Keep these - No changes) ---
const SunIcon = () => sunSvg;
const MoonIcon = () => moonSvg;
// --- ---

function Header() {
  // --- Redux Logic (Keep this - No changes) ---
  const currentTheme = useSelector(selectTheme);
  const dispatch = useDispatch();

  const handleThemeToggle = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    console.log(newTheme);
    dispatch(setTheme(newTheme));
  };

  const ThemeIcon = currentTheme === 'light' ? MoonIcon : SunIcon;
  const nextThemeLabel = currentTheme === 'light' ? 'dark' : 'light';
  // --- ---

  return (
    <header role="banner" className={styles.header}>
      {/* Logo / Site Title (Uses TanStack Router Link) */}
      <div className={styles.logo}>
        {/* --- CHANGE: Uses TanStack Router Link --- */}
        <Link to="/">CineScope</Link>
        {/* --- --- */}
      </div>

      {/* New container for right-aligned items (No structural changes needed) */}
      <div className={styles.rightSection}>
        {/* Navigation Links (Uses TanStack Router Link + activeProps) */}
        <nav className={styles.nav}>
          <ul>
            <li>
              {/* --- CHANGE: Replaced NavLink with Link + activeProps --- */}
              <Link
                to="/browse"
                // Apply props when the link is active (or matches partially by default)
                activeProps={{ className: styles.active }}
                // Optional: Apply props when inactive (if needed)
                // inactiveProps={{ className: '' }}
              >
                Browse
              </Link>
              {/* --- --- */}
            </li>
            <li>
              {/* --- CHANGE: Replaced NavLink with Link + activeProps --- */}
              <Link to="/login" activeProps={{ className: styles.active }}>
                Login
              </Link>
              {/* --- --- */}
            </li>
            {/* Other links would follow the same pattern */}
          </ul>
        </nav>

        {/* Header Controls Area (No changes needed here) */}
        <div className={styles.controls}>
          <button
            onClick={handleThemeToggle}
            className={styles.themeToggleButton}
            aria-label={`Switch to ${nextThemeLabel} mode`}
            title={`Switch to ${nextThemeLabel} mode`}>
            <ThemeIcon />
          </button>
          {/* Other controls */}
        </div>
      </div>
      {/* End of rightSection container */}
    </header>
  );
}

export default Header;
