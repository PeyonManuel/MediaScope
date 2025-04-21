import React from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import styles from './LoginPage.module.css'; // Import CSS Module
import {
  selectAuthError,
  selectAuthLoading,
  setAuthError,
  setAuthLoading,
  setUserSession,
} from '../../store/features/auth/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../../lib/supabaseClient';

function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (
    event: React.FormEvent<HTMLFormElement>,
    email: string,
    password: string
  ) => {
    event.preventDefault();
    dispatch(setAuthLoading(true));
    dispatch(setAuthError(null));
    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

      if (signInError) {
        throw signInError;
      }
      dispatch(setUserSession(data.session));
      navigate('/'); // Navigate to home page after successful login
    } catch (error: any) {
      console.error('Login failed:', error.message);
      dispatch(setAuthError(error.message || 'An unknown error occurred.'));
    } finally {
      dispatch(setAuthLoading(false));
    }
  };

  return (
    // Apply styles using the imported 'styles' object
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        {/* Logo and Heading */}
        <div className={styles.logoContainer}>
          <span className={styles.logoPlaceholder}>CineScope</span>
        </div>
        <h2 className={styles.heading}>Sign in to your account</h2>

        <form
          className={styles.form}
          onSubmit={(e) => handleLogin(e, email, password)}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* Email Input with Floating Label */}
          <div className={styles.inputContainer}>
            <input
              id="email-address" // ID must match label's htmlFor
              name="email"
              type="email"
              autoComplete="email"
              required // For :valid selector (optional but good)
              className={styles.inputField}
              placeholder=" " // Important: Space placeholder!
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            {/* Label is now a sibling AFTER the input */}
            <label htmlFor="email-address" className={styles.label}>
              Email address
            </label>
          </div>

          {/* Password Input with Floating Label */}
          <div className={styles.inputContainer}>
            <input
              id="password" // ID must match label's htmlFor
              name="password"
              type="password"
              autoComplete="current-password"
              required // For :valid selector (optional but good)
              className={styles.inputField}
              placeholder=" " // Important: Space placeholder!
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            {/* Label is now a sibling AFTER the input */}
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className={styles.optionsRow}>
            {/* Optional: Remember me checkbox if needed */}
            <div className={styles.forgotPasswordLink}>
              <Link to="/forgot-password">Forgot your password?</Link>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={styles.button}>
              {isLoading && (
                <span className={styles.spinner} aria-hidden="true"></span>
              )}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* Link to Create Account */}
        <div className={styles.createAccountLink}>
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
