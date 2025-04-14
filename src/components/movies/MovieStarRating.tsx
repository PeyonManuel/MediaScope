// src/components/ui/StarRating.tsx
import React, { useState } from 'react';
import styles from './MovieStarRating.module.css'; // Create this CSS module

interface StarRatingProps {
  currentRating: number | null; // Expects 1-10 scale (for half stars) or null
  maxRating?: number; // Max rating score (e.g., 10 for 5 stars)
  onRate: (newRating: number | null) => void; // Callback with 1-10 or null
  disabled?: boolean;
  iconSize?: string; // Optional: CSS size for stars
}

// Simple Star SVG
const StarIcon = ({ fillPercent }: { fillPercent: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={styles.starSvg}>
    <defs>
      <linearGradient id={`grad-${fillPercent}`}>
        <stop offset={`${fillPercent}%`} stopColor="currentColor" />
        <stop
          offset={`${fillPercent}%`}
          stopColor="var(--star-empty-color, #ccc)"
          stopOpacity="1"
        />
      </linearGradient>
    </defs>
    <path
      fill={`url(#grad-${fillPercent})`}
      stroke="var(--star-stroke-color, #aab)"
      strokeWidth="1"
      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
    />
  </svg>
);

const StarRating: React.FC<StarRatingProps> = ({
  currentRating,
  maxRating = 10, // Default to 10 (for 5 stars with halves)
  onRate,
  disabled = false,
  iconSize = '1.5rem', // Default size
}) => {
  // Hover state to show potential rating
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleSetRating = (ratingValue: number) => {
    if (disabled) return;
    // If clicking the same rating they already have, clear it
    if (currentRating === ratingValue) {
      onRate(null);
    } else {
      onRate(ratingValue);
    }
  };

  const handleMouseEnter = (ratingValue: number) => {
    if (disabled) return;
    setHoverRating(ratingValue);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setHoverRating(null);
  };

  const numStars = maxRating / 2; // Assuming 5 stars for maxRating=10

  return (
    <div
      className={`${styles.starRatingContainer} ${disabled ? styles.disabled : ''}`}
      onMouseLeave={handleMouseLeave}
      style={{ '--star-icon-size': iconSize } as React.CSSProperties} // Pass size via CSS var
    >
      {Array.from({ length: numStars }, (_, index) => {
        const ratingValueLeft = index * 2 + 1; // e.g., 1, 3, 5, 7, 9
        const ratingValueRight = index * 2 + 2; // e.g., 2, 4, 6, 8, 10

        const displayRating = hoverRating ?? currentRating; // Show hover rating if active, else current

        let fillPercentLeft = 0;
        if (displayRating && displayRating >= ratingValueLeft)
          fillPercentLeft = 100; // Full fill for left half

        let fillPercentRight = 0;
        if (displayRating && displayRating >= ratingValueRight)
          fillPercentRight = 100; // Full fill for right half

        // Handle partial fill for half-star if only left half is selected
        const isHalfSelectedOnly = displayRating === ratingValueLeft;

        return (
          <div key={index} className={styles.starWrapper}>
            {/* Render two halves for each star to handle half-star clicks/display */}
            <span
              className={styles.starHalf}
              onClick={() => handleSetRating(ratingValueLeft)}
              onMouseEnter={() => handleMouseEnter(ratingValueLeft)}
              aria-label={`Rate ${ratingValueLeft / 2} stars`}>
              <StarIcon fillPercent={fillPercentLeft} />
            </span>
            <span
              className={styles.starHalf}
              onClick={() => handleSetRating(ratingValueRight)}
              onMouseEnter={() => handleMouseEnter(ratingValueRight)}
              aria-label={`Rate ${ratingValueRight / 2} stars`}>
              {/* Show full fill if right half value is met, otherwise potentially empty */}
              {/* Special case: If only the left half is rated, right half is empty */}
              <StarIcon
                fillPercent={isHalfSelectedOnly ? 0 : fillPercentRight}
              />
            </span>
          </div>
        );
      })}
      {/* Optional: Clear Button */}
      {currentRating && !disabled && (
        <button
          onClick={() => onRate(null)}
          className={styles.clearButton}
          title="Clear rating">
          ×
        </button>
      )}
    </div>
  );
};

export default StarRating;
