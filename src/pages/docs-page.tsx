"use client";

import { motion } from "motion/react";
import { Code, Copy, Check, BookOpen, Zap, Lock, FileCode } from "lucide-react";
import { useState } from "react";

const codeExamples = {
  solidity: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract CryptoLotto is VRFConsumerBase {
    bytes32 internal keyHash;
    uint256 internal fee;
    uint256 public randomResult;
    
    address public owner;
    uint256 public ticketPrice = 0.01 ether;
    uint256 public currentDraw;
    
    struct Draw {
        uint256 id;
        uint256 prizePool;
        address[] participants;
        address winner;
        uint256 winningNumber;
        bool completed;
    }
    
    mapping(uint256 => Draw) public draws;
    mapping(address => uint256[]) public userTickets;
    
    event TicketPurchased(address indexed buyer, uint256 drawId);
    event DrawCompleted(uint256 indexed drawId, address winner, uint256 prize);
    event RandomnessRequested(bytes32 requestId);
    
    constructor(
        address _vrfCoordinator,
        address _linkToken,
        bytes32 _keyHash
    ) VRFConsumerBase(_vrfCoordinator, _linkToken) {
        owner = msg.sender;
        keyHash = _keyHash;
        fee = 0.1 * 10 ** 18; // 0.1 LINK
        currentDraw = 1;
        draws[currentDraw].id = currentDraw;
    }
    
    function buyTicket() external payable {
        require(msg.value == ticketPrice, "Incorrect ticket price");
        require(!draws[currentDraw].completed, "Draw already completed");
        
        draws[currentDraw].participants.push(msg.sender);
        draws[currentDraw].prizePool += msg.value;
        userTickets[msg.sender].push(currentDraw);
        
        emit TicketPurchased(msg.sender, currentDraw);
    }
    
    function requestRandomWinner() external onlyOwner {
        require(!draws[currentDraw].completed, "Draw already completed");
        require(draws[currentDraw].participants.length > 0, "No participants");
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK");
        
        bytes32 requestId = requestRandomness(keyHash, fee);
        emit RandomnessRequested(requestId);
    }
    
    function fulfillRandomness(bytes32 requestId, uint256 randomness) 
        internal override 
    {
        randomResult = randomness;
        uint256 winnerIndex = randomness % draws[currentDraw].participants.length;
        
        address winner = draws[currentDraw].participants[winnerIndex];
        uint256 prize = draws[currentDraw].prizePool;
        
        draws[currentDraw].winner = winner;
        draws[currentDraw].winningNumber = randomness;
        draws[currentDraw].completed = true;
        
        payable(winner).transfer(prize);
        
        emit DrawCompleted(currentDraw, winner, prize);
        
        // Start next draw
        currentDraw++;
        draws[currentDraw].id = currentDraw;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
}`,
  javascript: `import { ethers } from 'ethers';
import CryptoLottoABI from './CryptoLottoABI.json';

// Contract address on Ethereum Mainnet
const CONTRACT_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f38a9f3';

// Initialize contract connection
async function initContract() {
  // Connect to MetaMask
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  
  const signer = provider.getSigner();
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    CryptoLottoABI,
    signer
  );
  
  return contract;
}

// Buy a lottery ticket
async function buyTicket() {
  try {
    const contract = await initContract();
    const ticketPrice = ethers.utils.parseEther('0.01');
    
    const tx = await contract.buyTicket({
      value: ticketPrice
    });
    
    console.log('Transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Ticket purchased! Receipt:', receipt);
    
    return receipt;
  } catch (error) {
    console.error('Error buying ticket:', error);
    throw error;
  }
}

// Get current draw information
async function getCurrentDraw() {
  try {
    const contract = await initContract();
    const currentDrawId = await contract.currentDraw();
    const draw = await contract.draws(currentDrawId);
    
    return {
      id: draw.id.toNumber(),
      prizePool: ethers.utils.formatEther(draw.prizePool),
      participants: draw.participants.length,
      completed: draw.completed,
      winner: draw.winner
    };
  } catch (error) {
    console.error('Error fetching draw:', error);
    throw error;
  }
}

// Get user tickets
async function getUserTickets(address) {
  try {
    const contract = await initContract();
    const tickets = await contract.userTickets(address);
    
    return tickets.map(id => id.toNumber());
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw error;
  }
}

// Listen to events
function listenToEvents(contract) {
  // Ticket purchased event
  contract.on('TicketPurchased', (buyer, drawId) => {
    console.log(\`Ticket purchased by \${buyer} for draw #\${drawId}\`);
  });
  
  // Draw completed event
  contract.on('DrawCompleted', (drawId, winner, prize) => {
    console.log(\`Draw #\${drawId} completed!\`);
    console.log(\`Winner: \${winner}\`);
    console.log(\`Prize: \${ethers.utils.formatEther(prize)} ETH\`);
  });
}

export {
  initContract,
  buyTicket,
  getCurrentDraw,
  getUserTickets,
  listenToEvents
};`,
  api: `# CryptoLotto API Documentation

Base URL: https://api.cryptolotto.io/v1

## Authentication
All API requests require your wallet address to be signed.

### Get Current Draw
\`\`\`bash
GET /draws/current
\`\`\`

Response:
\`\`\`json
{
  "id": 48,
  "prizePool": "2847.65",
  "participants": 1847,
  "ticketPrice": "0.01",
  "drawDate": "2025-10-15T00:00:00Z",
  "status": "active"
}
\`\`\`

### Get Draw History
\`\`\`bash
GET /draws?limit=10&offset=0
\`\`\`

Response:
\`\`\`json
{
  "draws": [
    {
      "id": 47,
      "winner": "0x742d35Cc...",
      "prizePool": "1250.45",
      "participants": 1523,
      "drawDate": "2025-09-15T00:00:00Z",
      "txHash": "0x1a2b3c4d..."
    }
  ],
  "total": 47,
  "page": 1
}
\`\`\`

### Get User Tickets
\`\`\`bash
GET /users/:address/tickets
\`\`\`

Response:
\`\`\`json
{
  "tickets": [
    {
      "id": "TKT-0x742d...a9f3",
      "drawId": 48,
      "purchaseDate": "2025-10-01T12:00:00Z",
      "status": "active",
      "txHash": "0xabc123..."
    }
  ],
  "total": 4
}
\`\`\`

### Verify Transaction
\`\`\`bash
POST /verify
Content-Type: application/json

{
  "txHash": "0x1a2b3c4d5e6f...",
  "address": "0x742d35Cc..."
}
\`\`\`

Response:
\`\`\`json
{
  "verified": true,
  "ticket": {
    "id": "TKT-0x742d...a9f3",
    "drawId": 48,
    "timestamp": "2025-10-01T12:00:00Z"
  }
}
\`\`\``
};

const sections = [
  {
    icon: BookOpen,
    title: "Introduction",
    content: "CryptoLotto is a decentralized lottery platform built on Ethereum using Chainlink VRF for provably fair randomness. All draws are transparent, verifiable, and executed automatically via smart contracts."
  },
  {
    icon: Zap,
    title: "Quick Start",
    content: "Connect your MetaMask wallet, buy tickets with ETH, and wait for the draw. Winners are selected automatically using Chainlink VRF and prizes are distributed instantly to the winner's wallet."
  },
  {
    icon: Lock,
    title: "Security",
    content: "Our smart contracts are audited and use Chainlink VRF for cryptographically secure randomness. All code is open-source and verifiable on Etherscan. No human intervention is possible in the draw process."
  }
];

export function DocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'solidity' | 'javascript' | 'api'>('solidity');

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[128px]" />

        <div className="relative z-10 container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-2 mb-6 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
              <span className="text-sm text-zinc-400">Documentation</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
              Developer Docs
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl">
              Everything you need to integrate with CryptoLotto's smart contracts and API
            </p>
          </motion.div>
        </div>
      </section>

      {/* Overview Cards */}
      <section className="relative py-12 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <section.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-black mb-3">{section.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{section.content}</p>
              </motion.div>
            ))}
          </div>

          {/* Code Examples */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2 className="text-3xl font-black tracking-tighter mb-8">Code Examples</h2>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-zinc-800">
              <button
                onClick={() => setActiveTab('solidity')}
                className={`px-6 py-3 font-semibold transition-colors relative ${
                  activeTab === 'solidity' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <FileCode className="w-4 h-4 inline mr-2" />
                Smart Contract
                {activeTab === 'solidity' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('javascript')}
                className={`px-6 py-3 font-semibold transition-colors relative ${
                  activeTab === 'javascript' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Code className="w-4 h-4 inline mr-2" />
                JavaScript SDK
                {activeTab === 'javascript' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('api')}
                className={`px-6 py-3 font-semibold transition-colors relative ${
                  activeTab === 'api' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                API Reference
                {activeTab === 'api' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                  />
                )}
              </button>
            </div>

            {/* Code Block */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-cyan-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur" />
              <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
                {/* Code header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                      <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                    <span className="text-sm text-zinc-400 font-mono">
                      {activeTab === 'solidity' && 'CryptoLotto.sol'}
                      {activeTab === 'javascript' && 'integration.js'}
                      {activeTab === 'api' && 'api-reference.md'}
                    </span>
                  </div>
                  <motion.button
                    onClick={() => copyToClipboard(codeExamples[activeTab], activeTab)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {copiedCode === activeTab ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm text-zinc-400">Copy</span>
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Code content */}
                <div className="p-6 overflow-x-auto">
                  <pre className="text-sm font-mono leading-relaxed">
                    <code className="text-zinc-300">{codeExamples[activeTab]}</code>
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contract Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16"
          >
            <h2 className="text-3xl font-black tracking-tighter mb-8">Contract Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Contract Address</div>
                <div className="flex items-center justify-between p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                  <code className="text-sm font-mono text-zinc-300">0x742d35Cc6634C0532925a3b844Bc9e7595f38a9f3</code>
                  <button
                    onClick={() => copyToClipboard('0x742d35Cc6634C0532925a3b844Bc9e7595f38a9f3', 'contract')}
                    className="ml-2"
                  >
                    {copiedCode === 'contract' ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-zinc-400 hover:text-white transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Chainlink VRF Coordinator</div>
                <div className="flex items-center justify-between p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                  <code className="text-sm font-mono text-zinc-300">0x271682DEB8C4E0901D1a1550aD2e64D568E69909</code>
                  <button
                    onClick={() => copyToClipboard('0x271682DEB8C4E0901D1a1550aD2e64D568E69909', 'vrf')}
                    className="ml-2"
                  >
                    {copiedCode === 'vrf' ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-zinc-400 hover:text-white transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Network</div>
                <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                  <span className="text-sm font-semibold text-zinc-300">Ethereum Mainnet</span>
                </div>
              </div>

              <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Ticket Price</div>
                <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                  <span className="text-sm font-semibold text-zinc-300">0.01 ETH</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
