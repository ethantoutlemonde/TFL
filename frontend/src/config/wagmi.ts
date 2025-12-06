import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

/**
 * Configuration Wagmi pour la connexion wallet
 */
export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [
    injected(),
  ],
  transports: {
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
  },
});

// Types pour TypeScript
declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
