// src/components/MovieStarRating/StarRating.tsx (Example path)
// Uses CSS clip-path for half-star rendering, includes StarRatingProps type

import React, { useState } from 'react';
import styles from './StarRating.module.css'; // Use the CSS module

// --- TypeScript Prop Types (Discriminated Union) ---
// (Props definition remains the same as before)
interface StarRatingBaseProps {
  currentRating: number | null;
  maxRating?: number;
  iconSize?: string;
}
interface StarRatingEnabledProps extends StarRatingBaseProps {
  disabled?: boolean;
  onRate: (newRating: number | null) => void;
}
interface StarRatingDisabledProps extends StarRatingBaseProps {
  disabled: true;
  onRate?: never;
}
export type StarRatingProps = StarRatingEnabledProps | StarRatingDisabledProps;
// --- End Prop Types ---

// --- SVG Icons for Stars (Only need Full and Empty now) ---
const StarIconFull: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}>
    <path
      fillRule="evenodd"
      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434L10.788 3.21Z"
      clipRule="evenodd"
    />
  </svg>
);

// --- REMOVED StarIconHalf ---

const StarIconEmpty: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
    />
  </svg>
);
// --- End SVG Icons ---

// --- Star Rating Component ---
const StarRating: React.FC<StarRatingProps> = (props) => {
  const {
    currentRating,
    maxRating = 10,
    onRate,
    disabled = false,
    iconSize = '1.25rem',
  } = props;

  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleSetRating = (ratingValue: number) => {
    if (!disabled && onRate) {
      onRate(currentRating === ratingValue ? null : ratingValue);
    }
  };

  const handleMouseEnter = (ratingValue: number) => {
    if (!disabled) {
      setHoverRating(ratingValue);
    }
  };
  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverRating(null);
    }
  };

  const numStars = Math.ceil(maxRating / 2);
  const displayRating =
    disabled ? currentRating : (hoverRating ?? currentRating);

  return (
    <div
      className={`${styles.starRatingContainer} ${disabled ? styles.disabled : ''}`}
      onMouseLeave={handleMouseLeave}
      style={{ '--star-icon-size': iconSize } as React.CSSProperties}
      role="radiogroup"
      aria-label={`Rating: ${currentRating ? `${currentRating / 2} out of ${maxRating / 2}` : 'Not rated'}`}
      aria-disabled={disabled}>
      {Array.from({ length: numStars }, (_, index) => {
        const starValue = index + 1;
        const ratingValueFull = starValue * 2;
        const ratingValueHalf = ratingValueFull - 1;

        // Determine the state based on displayRating
        let starState: 'empty' | 'half' | 'filled' = 'empty';
        if (displayRating && displayRating >= ratingValueFull) {
          starState = 'filled';
        } else if (displayRating && displayRating >= ratingValueHalf) {
          starState = 'half';
        }

        return (
          <button
            key={index}
            // Apply class based on state for CSS targeting
            className={`${styles.starButton} ${styles[starState]}`}
            onClick={
              !disabled ?
                (e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const isLeftHalfClick =
                    e.clientX - rect.left < rect.width / 2;
                  const valueToSet =
                    isLeftHalfClick ? ratingValueHalf : ratingValueFull;
                  console.log(
                    `Click detected: LeftHalf=${isLeftHalfClick}, Value to set=${valueToSet}`
                  );
                  handleSetRating(valueToSet);
                }
              : undefined
            }
            onMouseMove={
              !disabled ?
                (e: React.MouseEvent<HTMLButtonElement>) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const isLeftHalf = e.clientX - rect.left < rect.width / 2;
                  handleMouseEnter(
                    isLeftHalf ? ratingValueHalf : ratingValueFull
                  );
                }
              : undefined
            }
            aria-label={`Rate ${starValue} stars`}
            aria-checked={
              currentRating !== null && currentRating >= ratingValueFull ?
                'true'
              : currentRating === ratingValueHalf ?
                'mixed'
              : 'false'
            }
            disabled={disabled}
            type="button">
            {/* --- CHANGE: Always render Full icon inside, let CSS handle half --- */}
            {/* Render Full icon if state is 'filled' or 'half', Empty otherwise */}
            {starState === 'empty' ?
              <StarIconEmpty
                style={{
                  width: 'var(--star-icon-size)',
                  height: 'var(--star-icon-size)',
                }}
                className={styles.starSvg}
              />
            : <StarIconFull
                style={{
                  width: 'var(--star-icon-size)',
                  height: 'var(--star-icon-size)',
                }}
                className={styles.starSvg}
              />
            }
            {/* --- END CHANGE --- */}
          </button>
        );
      })}

      {/* Clear Button */}
      {!disabled && onRate && currentRating && (
        <button
          onClick={() => onRate(null)}
          className={styles.clearButton}
          title="Clear rating"
          aria-label="Clear rating"
          type="button">
          &times;
        </button>
      )}
    </div>
  );
};

export default StarRating;
