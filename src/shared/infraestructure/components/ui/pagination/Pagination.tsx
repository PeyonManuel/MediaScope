import React from 'react';
import styles from './Pagination.module.css';

interface PaginationProps {
  /* ... same as before ... */ currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isDisabled?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  totalPages,
  currentPage,
  onPageChange,
  isDisabled,
}) => {
  // Go to the previous page if not already on the first page
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1); // Call the parent's handler with the new page number
    }
  };

  // Go to the next page if not already on the last page
  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1); // Call the parent's handler with the new page number
    }
  };

  // Prevent rendering if only 1 page or invalid totalPages
  if (totalPages <= 1 || !totalPages) {
    return null;
  }

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <button
        onClick={handlePrevious}
        disabled={currentPage <= 1 || isDisabled}
        className={styles.button}>
        {' '}
        &larr; Previous{' '}
      </button>
      <span className={styles.pageInfo}>
        {' '}
        Page {currentPage} of {totalPages}{' '}
      </span>
      <button
        onClick={handleNext}
        disabled={currentPage >= totalPages || isDisabled}
        className={styles.button}>
        {' '}
        Next &rarr;{' '}
      </button>
    </nav>
  );
};
export default Pagination;
