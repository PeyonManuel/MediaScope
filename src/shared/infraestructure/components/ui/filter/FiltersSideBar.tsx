// // src/features/movies/components/FiltersSidebar.tsx
// import React from 'react';
// import styles from './FiltersSidebar.module.css'; // Create this CSS file

// // Define sorting options matching TMDB API values
// const sortOptions = [
//   { value: 'popularity.desc', label: 'Popularity Descending' },
//   { value: 'popularity.asc', label: 'Popularity Ascending' },
//   { value: 'primary_release_date.desc', label: 'Release Date Descending' },
//   { value: 'primary_release_date.asc', label: 'Release Date Ascending' },
//   { value: 'vote_average.desc', label: 'Rating Descending' },
//   { value: 'vote_average.asc', label: 'Rating Ascending' },
//   { value: 'vote_count.desc', label: 'Vote Count Descending' },
// ];

// interface FiltersSidebarProps {
//   genres: Genre[] | undefined;
//   isLoadingGenres: boolean;
//   currentSortBy?: string;
//   currentGenres: string[];
//   currentMinVotes?: number; // <-- Add prop for min votes
//   onSortChange: (newSortBy: string) => void;
//   onGenreChange: (newSelectedGenreIds: string[]) => void;
//   onMinVotesChange: (newMinVotes: string) => void; // <-- Add handler prop
// }

// const FiltersSidebar: React.FC<FiltersSidebarProps> = ({
//   genres,
//   isLoadingGenres,
//   currentSortBy,
//   currentGenres,
//   currentMinVotes, // <-- Destructure prop
//   onSortChange,
//   onGenreChange,
//   onMinVotesChange, // <-- Destructure prop
// }) => {
//   const handleGenreCheckboxChange = (
//     event: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     const genreId = event.target.value;
//     const isChecked = event.target.checked;

//     let newSelectedGenres: string[];
//     if (isChecked) {
//       // Add genre ID if checked and not already present
//       newSelectedGenres = [...currentGenres, genreId];
//     } else {
//       // Remove genre ID if unchecked
//       newSelectedGenres = currentGenres.filter((id) => id !== genreId);
//     }
//     onGenreChange(newSelectedGenres);
//   };

//   const handleSortSelectChange = (
//     event: React.ChangeEvent<HTMLSelectElement>
//   ) => {
//     onSortChange(event.target.value);
//   };

//   const handleMinVotesChange = (
//     event: React.ChangeEvent<HTMLSelectElement>
//   ) => {
//     // Pass the selected option's value (which is a string like "0", "50", "100")
//     // directly to the handler function received via props.
//     onMinVotesChange(event.target.value);
//   };
//   const minVotesOptions = [
//     { value: '0', label: 'Any' },
//     { value: '50', label: '50+' },
//     { value: '100', label: '100+' },
//     { value: '250', label: '250+' },
//     { value: '500', label: '500+' },
//     { value: '1000', label: '1000+' },
//     { value: '5000', label: '5000+' },
//   ];
//   return (
//     <aside className={styles.sidebar}>
//       <div className={styles.filterGroup}>
//         <h3 className={styles.filterTitle}>Sort By</h3>
//         <select
//           className={styles.selectInput}
//           value={currentSortBy}
//           onChange={handleSortSelectChange}>
//           {sortOptions.map((option) => (
//             <option key={option.value} value={option.value}>
//               {option.label}
//             </option>
//           ))}
//         </select>
//       </div>

//       <div className={styles.filterGroup}>
//         <h3 className={styles.filterTitle}>Minimum Ratings</h3>
//         <label htmlFor="min-votes" className={styles.inputLabel}>
//           Minimum number of user ratings:
//         </label>
//         <select
//           id="min-votes-select"
//           name="minVotes"
//           className={styles.selectInput} // Reuse the select style
//           value={currentMinVotes} // Bind to the string value from props
//           onChange={handleMinVotesChange} // Attach the handler
//         >
//           {minVotesOptions.map((option) => (
//             <option key={option.value} value={option.value}>
//               {option.label}
//             </option>
//           ))}
//         </select>
//       </div>

//       <div className={styles.filterGroup}>
//         {/* ... (Genre list remains the same) ... */}
//         <h3 className={styles.filterTitle}>Genres</h3>
//         {isLoadingGenres ?
//           <p>Loading genres...</p> // Simple loading indicator
//         : <ul className={styles.genreList}>
//             {genres?.map((genre) => (
//               <li key={genre.id} className={styles.genreItem}>
//                 <input
//                   type="checkbox"
//                   id={`genre-${genre.id}`}
//                   value={genre.id.toString()}
//                   checked={currentGenres.includes(genre.id.toString())}
//                   onChange={handleGenreCheckboxChange}
//                   className={styles.checkboxInput}
//                 />
//                 <label htmlFor={`genre-${genre.id}`}>{genre.name}</label>
//               </li>
//             ))}
//             {!genres?.length && !isLoadingGenres && <p>No genres found.</p>}
//           </ul>
//         }
//       </div>

//       {/* --- Add More Filters Here --- */}
//     </aside>
//   );
// };

// export default FiltersSidebar;
