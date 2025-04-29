import { useSelector, useDispatch } from 'react-redux';
import { Link, useRouter } from '@tanstack/react-router';
import { selectTheme, setTheme } from '../../../../store/features/ui/uiSlice'; // Adjust path if needed
import styles from './Header.module.css';
import { BackArrowIcon, sunSvg, moonSvg } from '../ui/svgs'; // Adjust path for BackArrowIcon
import { selectCurrentSession } from '../../../../features/authentication/infraestructure/store/authSlice';
import UserProfileIcon from '../../../../features/user/infraestructure/ui/components/userProfileIcon/UserProfileMenu';

// Theme Icons (no change)
const SunIcon = () => sunSvg;
const MoonIcon = () => moonSvg;

function Header() {
  const currentTheme = useSelector(selectTheme);
  const currentSession = useSelector(selectCurrentSession);
  const dispatch = useDispatch();
  const router = useRouter();
  const handleThemeToggle = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    dispatch(setTheme(newTheme));
  };
  const ThemeIcon = currentTheme === 'light' ? MoonIcon : SunIcon;
  const nextThemeLabel = currentTheme === 'light' ? 'dark' : 'light';

  const handleGoBack = () => {
    // Use the history object from the router instance
    router.history.back();
  };
  // --- ---

  return (
    <header role="banner" className={styles.header}>
      {/* --- NEW: Back Button Added --- */}
      <button
        onClick={handleGoBack}
        className={styles.backButton} // Add styles for this button
        title="Go Back"
        aria-label="Go back to previous page">
        <BackArrowIcon />
        {/* <span>Back</span> */}
      </button>

      <div className={styles.logo}>
        <Link to="/">CineScope</Link>
      </div>

      {/* Right Section (no change) */}
      <div className={styles.rightSection}>
        <nav className={styles.nav}>
          <ul>
            <li>
              <Link
                to="/browse"
                search={{ page: 1 }}
                activeProps={{ className: styles.active }}>
                Browse
              </Link>
            </li>
            <li>
              <Link to="/search" activeProps={{ className: styles.active }}>
                Search
              </Link>
            </li>
            {currentSession ?
              <li>
                <UserProfileIcon />
              </li>
            : <li>
                <Link to="/login" activeProps={{ className: styles.active }}>
                  Login
                </Link>
              </li>
            }
          </ul>
        </nav>

        <div className={styles.controls}>
          <button
            onClick={handleThemeToggle}
            className={styles.themeToggleButton} // Keep existing styles separate
            aria-label={`Switch to ${nextThemeLabel} mode`}
            title={`Switch to ${nextThemeLabel} mode`}>
            <ThemeIcon />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
