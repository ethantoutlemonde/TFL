/**
 * Configuration des contrats déployés
 * Mise à jour automatique après chaque déploiement
 */

// Sepolia Testnet
export const SEPOLIA_CONFIG = {
  chainId: 11155111,
  chainName: "Sepolia",
  
  // Contrat Lottery (VRF v2.5)
  LOTTERY_ADDRESS: "0x8354BfBFe2Fad521Bf8A5DE2254a5bfe7337BbFd",
  
  // Token de paiement (USDC test)
  PAYMENT_TOKEN_ADDRESS: "0xbe72E441BF55620febc26715db68d3494213D8Cb",
  PAYMENT_TOKEN_SYMBOL: "USDC",
  PAYMENT_TOKEN_DECIMALS: 18,
  
  // VRF v2.5
  VRF_COORDINATOR: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
  VRF_SUBSCRIPTION_ID: "37803408183958024651964213932251977391893957803253892816600509470432480039047",
  
  // RPC (utiliser un RPC public ou configurer via variable d'environnement)
  RPC_URL: "https://ethereum-sepolia-rpc.publicnode.com",
  
  // Block Explorer
  EXPLORER_URL: "https://sepolia.etherscan.io",
};

// Ethereum Mainnet
export const MAINNET_CONFIG = {
  chainId: 1,
  chainName: "Ethereum Mainnet",
  
  // Contrat Lottery (VRF v2.5)
  // TODO: Remplacer par l'adresse du contrat Lottery sur mainnet
  LOTTERY_ADDRESS: "0x0000000000000000000000000000000000000000",
  
  // Token de paiement
  // TODO: Remplacer par l'adresse du token sur mainnet
  PAYMENT_TOKEN_ADDRESS: "0x0000000000000000000000000000000000000000",
  PAYMENT_TOKEN_SYMBOL: "TFL",
  PAYMENT_TOKEN_DECIMALS: 18,
  
  // VRF v2.5 Coordinator (mainnet)
  VRF_COORDINATOR: "0xD7f86b4b8Cae7D942340FF628F82735b7a20893a",
  VRF_SUBSCRIPTION_ID: "0", // TODO: Mettre ton Subscription ID
  
  // RPC (utiliser un RPC public ou configurer via variable d'environnement)
  RPC_URL: "https://eth.rpc.blxrbdn.com",
  
  // Block Explorer
  EXPLORER_URL: "https://etherscan.io",
};

// Config active (switch entre testnet et mainnet)
export const ACTIVE_CONFIG = SEPOLIA_CONFIG;

// Adresses raccourcies pour import facile
export const LOTTERY_ADDRESS = ACTIVE_CONFIG.LOTTERY_ADDRESS;
export const PAYMENT_TOKEN_ADDRESS = ACTIVE_CONFIG.PAYMENT_TOKEN_ADDRESS;
export const CHAIN_ID = ACTIVE_CONFIG.chainId;
