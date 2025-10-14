interface ImportMetaEnv {
  readonly VITE_TREASURY_ADDRESS: string;
  readonly VITE_CONTRACT_ADDRESS: string;
  readonly VITE_CONTRACT_NAME: string;
  readonly VITE_STACKS_NETWORK: string;
  readonly VITE_RPC_URL: string;
  readonly VITE_REST_URL: string;
  // Add any other env variables here if needed
  readonly VITE_STACKS_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
