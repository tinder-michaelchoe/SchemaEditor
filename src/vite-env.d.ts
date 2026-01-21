/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LITELLM_TOKEN: string
  // add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
