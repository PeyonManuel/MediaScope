// src/env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_TITLE: string;
  // Add other environment variables here as needed
  // Example for a boolean variable:
  // readonly VITE_DEBUG_MODE: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
