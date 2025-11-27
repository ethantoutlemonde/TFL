"use client";

import { motion } from "motion/react";
import { Wallet, LogOut } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import type { PageType } from "../App";

interface NavigationProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { account, isConnecting, connect, disconnect } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-black/80 backdrop-blur-xl"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-12">
            <motion.button
              onClick={() => onNavigate('home')}
              className="text-2xl font-black tracking-tight"
              whileHover={{ scale: 1.02 }}
            >
              {/* CRYPTOLOTTO */}
              {/* find the logo in public folder */}
              <img src="/tfl.png" alt="tfl Preview" className="md:h-12 h-8"/>
            </motion.button>
            
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => onNavigate('home')}
                className={`text-sm transition-colors ${
                  currentPage === 'home' ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className={`text-sm transition-colors ${
                  currentPage === 'dashboard' ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                My Tickets
              </button>
              <button
                onClick={() => onNavigate('winners')}
                className={`text-sm transition-colors ${
                  currentPage === 'winners' ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Winners
              </button>
              <button
                onClick={() => onNavigate('docs')}
                className={`text-sm transition-colors ${
                  currentPage === 'docs' ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Docs
              </button>
            </div>
          </div>

          {account ? (
            <div className="flex items-center gap-2 md:gap-3">
              <div className="px-4 py-2 md:px-6 md:py-3 bg-zinc-900 border border-zinc-800 rounded-full">
                <span className="text-sm font-mono text-zinc-300">{formatAddress(account)}</span>
              </div>
              <motion.button
                onClick={disconnect}
                className="flex items-center gap-1 md:gap-2 px-4 py-3 md:px-6 md:py-3 border border-zinc-700 text-white rounded-full hover:bg-zinc-900 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            </div>
          ) : (
            <motion.button
              onClick={connect}
              disabled={isConnecting}
              className="flex items-center gap-1 md:gap-2 px-4 py-2 md:px-6 md:py-3 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Wallet className="w-4 h-4" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </motion.button>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
