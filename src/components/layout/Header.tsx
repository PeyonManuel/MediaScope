// src/components/layout/Header.tsx
// NO CHANGES REQUIRED HERE - Keep the previous version

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, NavLink } from 'react-router-dom';
import { selectTheme, setTheme } from '../../store/features/ui/uiSlice'; // Adjust path
import styles from './Header.module.css';
import { sunSvg, moonSvg } from '../ui/svgs';

// --- SVG Icons (Keep these) ---
const SunIcon = () => sunSvg;
const MoonIcon = () => moonSvg;
// --- ---

function Header() {
  const currentTheme = useSelector(selectTheme);
  const dispatch = useDispatch();

  const handleThemeToggle = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    dispatch(setTheme(newTheme));
  };

  const ThemeIcon = currentTheme === 'light' ? MoonIcon : SunIcon;
  const nextThemeLabel = currentTheme === 'light' ? 'dark' : 'light';

  return (
    <header className={styles.header}>
      {/* Logo / Site Title (Stays on the left) */}
      <div className={styles.logo}>
        <Link to="/">CineScope</Link>
      </div>
      {/* New container for right-aligned items */}
      <div className={styles.rightSection}>
        {/* Navigation Links */}
        <nav className={styles.nav}>
          <ul>
            <li>
              <NavLink
                to="/browse"
                className={({ isActive }) => (isActive ? styles.active : '')}>
                Browse
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/login"
                className={({ isActive }) => (isActive ? styles.active : '')}>
                Login
              </NavLink>
            </li>
            {/* Other links */}
          </ul>
        </nav>

        {/* Header Controls Area */}
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
