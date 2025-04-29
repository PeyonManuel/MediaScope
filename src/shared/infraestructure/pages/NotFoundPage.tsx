// src/pages/NotFoundPage/NotFoundPage.tsx (Example path)

import React from 'react';
import { Link } from '@tanstack/react-router'; // Import Link for navigation
import styles from './NotFoundPage.module.css'; // CSS Module
// Placeholder image URL - Replace with an actual image URL if desired
// Using placehold.co to generate a placeholder
const DANIEL_PLAINVIEW_PLACEHOLDER =
  'https://industrialscripts.com/wp-content/uploads/2022/08/Daniel-and-Eli-There-Will-Be-Blood.jpg';
function NotFoundPage() {
  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <img
          src={DANIEL_PLAINVIEW_PLACEHOLDER}
          alt="Daniel Plainview drinking your milkshake"
          className={styles.image}
          // Basic error handling for the image
          onError={(e) => {
            e.currentTarget.src =
              'https://placehold.co/600x400/cccccc/9ca3af/png?text=Image+Not+Found';
            e.currentTarget.alt = 'Placeholder image';
          }}
        />
        <h1 className={styles.title}>DRAAAIINED!</h1>
        <p className={styles.quote}>
          We searched this land, route by route... this page is drained. There's
          no content on it.
        </p>
        <p className={styles.message}>
          Looks like you've hit a dry spot. Best head back to richer lands.
        </p>
        <Link to="/" className={styles.homeLink}>
          Go back to the Homepage
        </Link>
      </div>
    </main>
  );
}

export default NotFoundPage;
