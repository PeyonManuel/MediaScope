import { StrictMode } from 'react';
import './index.css';
import App from './App';
import {
  // browseRoute,
  loginRoute,
  indexRoute,
  registerRoute,
  itemRoute,
  forgotPasswordRoute,
  searchRoute,
  editProfileRoute,
  viewProfileRoute,
} from './routes/routes';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import {
  RouterProvider,
  createRouter,
  createRootRoute,
} from '@tanstack/react-router';
import ReactDOM from 'react-dom/client';
import NotFoundPage from './shared/infraestructure/pages/NotFoundPage';

const queryClient = new QueryClient();

export const rootRoute = createRootRoute({
  component: () => (
    <>
      <App />
      <TanStackRouterDevtools />
    </>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  // browseRoute,
  itemRoute,
  forgotPasswordRoute,
  searchRoute,
  editProfileRoute,
  viewProfileRoute,
]);

const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundPage,
  scrollRestoration: true,
  context: {
    queryClient: queryClient,
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <QueryClientProvider client={queryClient}>
      <StrictMode>
        <Provider store={store}>
          <RouterProvider router={router} />
        </Provider>
      </StrictMode>
    </QueryClientProvider>
  );
}
