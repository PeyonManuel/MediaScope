import './App.css';
import React from 'react';
import LoginPage from './pages/login/LoginPage';
import { useSelector } from 'react-redux';
import { selectTheme } from './store/features/ui/uiSlice';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from './components/layout/Header';
import RegisterPage from './pages/register/RegisterPage';
import HomePage from './pages/home/HomePage';
import BrowsePage from './pages/browse/BrowsePage';
import MovieDetailPage from './pages/movie/MovieDetailsPage';

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
    <div>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="login" element={<LoginPage />}></Route>
          <Route path="register" element={<RegisterPage />}></Route>
          <Route path="/" element={<HomePage />}></Route>
          <Route path="/browse" element={<BrowsePage />}></Route>
          <Route path="/movie/:movieId" element={<MovieDetailPage />}></Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
