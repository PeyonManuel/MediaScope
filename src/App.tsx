import './App.css';
import React from 'react';
import LoginPage from './pages/login/LoginPage';
import { useSelector } from 'react-redux';
import { selectTheme } from './store/features/ui/uiSlice';
import RegisterPage from './pages/register/RegisterPage';
import HomePage from './pages/home/HomePage';
import BrowsePage from './pages/browse/BrowsePage';
import MovieDetailPage from './pages/movie/MovieDetailsPage';
import Header from './components/layout/Header.tsx';
import { Outlet } from '@tanstack/react-router'; // <--- IMPORT Outlet

const App = () => {
  const theme = useSelector(selectTheme);

  React.useEffect(() => {
    const root = document.documentElement; // Selects the <html> element
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]); // Re-run effect when theme changes

  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default App;
