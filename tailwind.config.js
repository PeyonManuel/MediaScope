// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}', // Adjust based on your project structure
  ],
  theme: {
    extend: {
      colors: {
        'brand-pink': {
          lightest: '#FFF1F2', // Very light pink bg
          light: '#FCE7F3', // Light pink for subtle elements
          DEFAULT: '#EC4899', // Main interactive pink (buttons, links)
          medium: '#DB2777', // Slightly darker pink
          dark: '#BE185D', // Darker pink for hover/active
          darkest: '#831843', // Very dark pink
        },
        'brand-gray': {
          light: '#F9FAFB', // Off-white bg
          medium: '#6B7280', // Medium gray text
          dark: '#374151', // Dark gray text/elements
          darkest: '#111827', // Very dark bg/text
        },
        // Add other colors as needed
      },
      // Optional: Add a custom font similar to Letterboxd if desired
      // fontFamily: {
      //   sans: ['Graphik', 'sans-serif'], // Example
      // },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // Provides better default form styling
  ],
};
