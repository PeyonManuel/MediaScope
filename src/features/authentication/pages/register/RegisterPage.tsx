import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import styles from './RegisterPage.module.css'; // Use the renamed CSS module import

import { useMutation } from '@tanstack/react-query';
import {
  eyeClosedIcon,
  eyeOpenIcon,
} from '../../../../shared/infraestructure/components/ui/svgs';
import { SupabaseAuthenticationAdapter } from '../../infraestructure/persistence';
import { RegisterUseCase } from '../../application';

const EyeOpenIcon = () => eyeOpenIcon;

const EyeClosedIcon = () => eyeClosedIcon;

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const supabaseAuthenticationAdapter = new SupabaseAuthenticationAdapter();
  const registerPort = new RegisterUseCase(supabaseAuthenticationAdapter);

  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Toggle handlers
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const togglePasswordConfirmVisibility = () =>
    setShowPasswordConfirm(!showPasswordConfirm);

  const {
    mutate: performRegister,
    isPending: isLoading,
    error,
  } = useMutation({
    mutationKey: ['register'],
    mutationFn: () =>
      registerPort.execute({
        email,
        password,
        userName,
      }),
    onSuccess: (data) => {
      if (data.user && data.session === null) {
        setSuccessMessage(
          'Registration successful! Please check your email for the confirmation link.'
        );
      } else if (data.user && data.session) {
        setSuccessMessage('Registration successful!');
        navigate({ to: '/' });
      }
    },
    onError: (error) => {
      console.error('Registration failed:', error.message);
      let displayError = 'An unknown error occurred during registration.';
      if (error.message?.includes('User already registered')) {
        displayError = 'This email is already registered. Try logging in.';
      } else if (
        error.message?.includes('Password should be at least 6 characters')
      ) {
        displayError = 'Password must be at least 6 characters long.';
      } else if (error.message) {
        displayError = error.message;
      }
    },
  });

  const handleRegister = async (
    event: React.FormEvent<HTMLFormElement>,
    email: string,
    password: string,
    passwordConfirm: string,
    setSuccessMessage: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    event.preventDefault();
    performRegister();
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        {/* Logo and Heading */}
        <div className={styles.logoContainer}>
          <span className={styles.logoPlaceholder}>CineScope</span>{' '}
        </div>
        <h2 className={styles.heading}> Create your account </h2>

        <form
          className={styles.form}
          onSubmit={(e) =>
            handleRegister(
              e,
              email,
              password,
              passwordConfirm,
              setSuccessMessage
            )
          }>
          {error && <div className={styles.errorMessage}>{error.message}</div>}
          {successMessage && (
            <div className={styles.successMessage}>{successMessage}</div>
          )}

          {/* UserName Input */}
          <div className={styles.inputContainer}>
            <input
              id="UserName"
              name="UserName"
              type="text"
              required
              className={styles.inputField}
              placeholder=" "
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={isLoading}
            />
            <label htmlFor="email-address" className={styles.label}>
              {' '}
              UserName{' '}
            </label>
          </div>
          {/* Email Input */}
          <div className={styles.inputContainer}>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={styles.inputField}
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <label htmlFor="email-address" className={styles.label}>
              {' '}
              Email address{' '}
            </label>
          </div>

          {/* Password Input */}
          <div className={styles.inputContainer}>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'} // Toggle type
              autoComplete="new-password"
              required
              className={styles.inputField} // Add specific class if padding needs adjustment
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <label htmlFor="password" className={styles.label}>
              {' '}
              Password{' '}
            </label>
            {/* Visibility Toggle Button */}
            <button
              type="button" // Prevent form submission
              className={styles.passwordToggleBtn}
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'} // Tooltip
            >
              {showPassword ?
                <EyeClosedIcon />
              : <EyeOpenIcon />}
            </button>
          </div>

          {/* Confirm Password Input */}
          <div className={styles.inputContainer}>
            <input
              id="password-confirm"
              name="passwordConfirm"
              type={showPasswordConfirm ? 'text' : 'password'} // Toggle type
              autoComplete="new-password"
              required
              className={styles.inputField} // Add specific class if padding needs adjustment
              placeholder=" "
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              disabled={isLoading}
            />
            <label htmlFor="password-confirm" className={styles.label}>
              {' '}
              Confirm Password{' '}
            </label>
            {/* Visibility Toggle Button */}
            <button
              type="button" // Prevent form submission
              className={styles.passwordToggleBtn}
              onClick={togglePasswordConfirmVisibility}
              aria-label={
                showPasswordConfirm ? 'Hide password' : 'Show password'
              }
              title={showPasswordConfirm ? 'Hide password' : 'Show password'} // Tooltip
            >
              {showPasswordConfirm ?
                <EyeClosedIcon />
              : <EyeOpenIcon />}
            </button>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !!successMessage}
              className={styles.button}>
              {isLoading && (
                <span className={styles.spinner} aria-hidden="true"></span>
              )}
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>

        {/* Link to Login Page */}
        <div className={styles.createAccountLink}>
          Already have an account? <Link to="/login"> Sign In </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
