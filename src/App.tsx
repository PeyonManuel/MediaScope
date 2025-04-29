import './App.css';
import React from 'react';
import { useSelector } from 'react-redux';
import { selectTheme } from './store/features/ui/uiSlice';
import Header from './shared/infraestructure/components/layout/Header';
import { Outlet, ScrollRestoration } from '@tanstack/react-router'; // <--- IMPORT Outlet
import { supabase } from './lib/supabaseClient';
import { setUserSession } from './features/authentication/infraestructure/store/authSlice';
import { useDispatch } from 'react-redux';

const App = () => {
  const theme = useSelector(selectTheme);
  const dispatch = useDispatch();
  React.useEffect(() => {
    const root = document.documentElement; // Selects the <html> element
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]); // Re-run effect when theme changes

  React.useEffect(() => {
    // Get initial session right away
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session fetch:', session);
      dispatch(setUserSession(session));
    });

    // Listen for future changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('onAuthStateChange triggered:', _event, session);
        dispatch(setUserSession(session)); // Update Redux store on change
      }
    );

    // Cleanup listener on component unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [dispatch]);

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
