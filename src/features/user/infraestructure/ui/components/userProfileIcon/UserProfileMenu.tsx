// src/components/layout/UserProfileMenu/UserProfileMenu.tsx (Example path)

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from '@tanstack/react-router'; // Use router Link/navigate
import styles from './UserProfileMenu.module.css';
import { selectCurrentUser } from '../../../../../authentication/infraestructure/store/authSlice';
import { supabase } from '../../../../../../shared/infraestructure/lib/supabaseClient';
import { DefaultAvatarIcon } from '../../../../../../shared/infraestructure/components/ui/svgs';

interface ProfileMenuData {
  user_id: string;
  username: string | null;
  avatar_url: string | null; // Assuming you add an avatar_url column
}

function UserProfileIcon() {
  const currentUser = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null); // Ref for detecting outside clicks

  // Query Key for fetching the specific user's profile
  const profileQueryKey = ['profile', currentUser?.id];

  // --- Query to fetch profile data (username, avatar_url) ---
  const {
    data: profileData,
    isLoading,
    // isError, // Optionally handle profile fetch errors
    // error,
  } = useQuery<ProfileMenuData | null, Error>({
    queryKey: profileQueryKey,
    queryFn: async (): Promise<ProfileMenuData | null> => {
      if (!currentUser) return null;
      console.log(`Fetching profile menu data for user: ${currentUser.id}`);
      const { data, error: dbError } = await supabase
        .from('profiles') // Use your actual table name
        .select('user_id, username, avatar_url') // Fetch only needed fields
        .eq('user_id', currentUser.id) // Filter by user_id
        .maybeSingle();

      if (dbError) {
        console.error('Error fetching profile for menu:', dbError);
        // Don't throw, just return null so menu shows fallback
        return null;
      }
      return data;
    },
    enabled: !!currentUser, // Only run when user is logged in
    staleTime: 1000 * 60 * 15, // Cache profile data for 15 minutes
    refetchOnWindowFocus: false, // Profile data unlikely to change often just by focusing
  });

  // --- Logout Handler ---
  const handleLogout = async () => {
    setIsMenuOpen(false); // Close menu first
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
      // Show error to user?
    } else {
      // onAuthStateChange listener in App.tsx will handle clearing Redux state
      // Optionally navigate to home or login page immediately
      navigate({ to: '/' });
    }
  };

  // --- Toggle Menu ---
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  // --- Close menu when clicking outside ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    // Add listener if menu is open
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]); // Re-run when menu open state changes

  // --- Render Logic ---
  if (!currentUser) {
    // Should not happen if rendered conditionally in Header, but good fallback
    return null;
  }

  const avatarSrc = profileData?.avatar_url;
  const username = profileData?.username || currentUser.email?.split('@')[0];
  const userId = profileData?.user_id || currentUser.email?.split('@')[0];

  const Avatar = ({ size }: { size: string }) =>
    avatarSrc ?
      <img
        src={avatarSrc}
        alt={`${username}'s avatar`}
        className={
          size === 'big' ? styles.avatarImage : styles.avatarImageSmall
        }
      />
    : <div className={styles.avatarPlaceholder} title={username}>
        <DefaultAvatarIcon />
      </div>;

  return (
    <div className={styles.profileMenuContainer} ref={menuRef}>
      <button
        className={styles.avatarButton}
        onClick={toggleMenu}
        aria-label="User menu"
        aria-expanded={isMenuOpen}
        aria-haspopup="true">
        {isLoading ?
          <div className={styles.avatarPlaceholder}></div> // Placeholder while loading
        : <Avatar size="big" />}
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className={styles.dropdownMenu} role="menu">
          <div className={styles.menuHeader}>
            Signed in as <br />
            <strong>{username}</strong>
          </div>
          <Link
            to="/edit/profile" // Link to the edit profile page
            className={styles.menuItem}
            role="menuitem"
            onClick={() => setIsMenuOpen(false)} // Close menu on click
          >
            Edit Profile
          </Link>
          <Link
            to={`/profile/${userId}`} // Example link to a public profile view page
            className={styles.menuItem}
            role="menuitem"
            onClick={() => setIsMenuOpen(false)}>
            View Profile
          </Link>
          <hr className={styles.menuDivider} />
          <button
            onClick={handleLogout}
            className={`${styles.menuItem} ${styles.menuItemButton}`}
            role="menuitem">
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default UserProfileIcon;
