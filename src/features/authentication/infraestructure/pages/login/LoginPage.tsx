import React from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import styles from './LoginPage.module.css'; // Import CSS Module
import { useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { SupabaseAuthenticationAdapter } from '../../persistence';
import { LoginUseCase } from '../../../application';

function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const navigate = useNavigate();
  // ADAPTER
  const supabaseAuthenticationAdapter = new SupabaseAuthenticationAdapter();
  // USE CASES
  const loginUseCase = new LoginUseCase(supabaseAuthenticationAdapter);

  const {
    mutate: performLogin,
    isPending: isLoading,
    error,
  } = useMutation({
    mutationFn: () => loginUseCase.execute({ email, password }),
    onSuccess: (data) => {
      console.log('User logged in!', data);
      navigate({ to: '/' });
    },
    onError: (error: Error) => {
      console.error('UI: LoginUseCase falló:', error);
    },
  });

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    performLogin();
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

        <form className={styles.form} onSubmit={(e) => handleLogin(e)}>
          {error && <div className={styles.errorMessage}>{error.message}</div>}

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
