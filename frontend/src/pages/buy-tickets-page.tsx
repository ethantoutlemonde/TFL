"use client";

import { motion } from "motion/react";
import { Ticket, ShoppingCart, AlertCircle, Info, TrendingUp, Users, Check, Wallet, Coins } from "lucide-react";
import { useState, useEffect } from "react";
import { useWallet } from '../hooks/useWallet';
import { useLotteryInfo, useRoundInfo, useBuyTicket, useApproveToken, useTokenAllowance, useTokenBalance } from '../hooks/useLotteryData';
import { parseUnits } from 'viem';

interface BuyTicketsPageProps {
  onSuccess: () => void;
}

const QUANTITIES = [
  { id: 1, name: 'Bronze', multiplier: 1, emoji: '🥉' },
  { id: 2, name: 'Silver', multiplier: 2, emoji: '🥈' },
  { id: 3, name: 'Gold', multiplier: 5, emoji: '🥇' },
  { id: 4, name: 'Diamond', multiplier: 10, emoji: '💎' },
];

const CHOICE_TYPES = [
  { id: 1, name: 'Pile', emoji: '🎯' },
  { id: 2, name: 'Face', emoji: '🎲' },
];

export function BuyTicketsPage({ onSuccess }: BuyTicketsPageProps) {
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedChoice, setSelectedChoice] = useState(1);
  const [needsApproval, setNeedsApproval] = useState<boolean | null>(null);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const { account, isConnecting } = useWallet();
  const address = account ? (account as `0x${string}`) : undefined;
  const isConnected = !!account;

  const { currentRoundId, ticketPrice, ticketPriceRaw, isLoading: lotteryLoading } = useLotteryInfo();
  const { endTime, numberOfTickets, totalPrize, isLoading: roundLoading } = useRoundInfo(currentRoundId);
  
  const { balance: balanceRaw, balanceFormatted, isLoading: balanceLoading } = useTokenBalance(address);
  
  const { approve, isPending: approveLoading, isSuccess: approveSuccess } = useApproveToken();
  const { buyTicket, isPending: buyLoading, isSuccess: buySuccess, hash: buyHash } = useBuyTicket();

  const selectedQuantityObj = QUANTITIES.find(q => q.id === selectedQuantity) || QUANTITIES[0];
  const selectedChoiceObj = CHOICE_TYPES.find(c => c.id === selectedChoice) || CHOICE_TYPES[0];
  
  const ticketCost = ticketPriceRaw ? ticketPriceRaw * BigInt(selectedQuantityObj.multiplier) : 0n;
  const ticketCostFormatted = ticketPriceRaw ? parseFloat(ticketPrice) * selectedQuantityObj.multiplier : 0;

  // Fetch allowance only when user tries to purchase
  const { allowance: allowanceRaw, isLoading: allowanceLoading, refetch: refetchAllowance } = useTokenAllowance(
    isCheckingApproval ? address : undefined
  );

  useEffect(() => {
    if (allowanceRaw !== undefined && ticketCost > 0n) {
      setNeedsApproval(allowanceRaw < ticketCost);
      setIsCheckingApproval(false);
    }
  }, [allowanceRaw, ticketCost]);

  useEffect(() => {
    if (approveSuccess) {
      setTimeout(() => refetchAllowance(), 2000);
    }
  }, [approveSuccess, refetchAllowance]);

  useEffect(() => {
    if (buySuccess) {
      setTimeout(() => onSuccess(), 2000);
    }
  }, [buySuccess, onSuccess]);

  const handlePurchase = async () => {
    // Check approval only when clicking purchase
    if (needsApproval === null) {
      setIsCheckingApproval(true);
      return;
    }

    if (needsApproval) {
      const approvalAmount = parseUnits('1000000', 18);
      await approve(approvalAmount);
    } else {
      await buyTicket(selectedChoice, selectedQuantityObj.multiplier);
    }
  };

  const hasEnoughBalance = balanceRaw !== undefined && ticketCost > 0n && balanceRaw >= ticketCost;
  const isLoading = lotteryLoading || roundLoading || balanceLoading;
  const isPurchasing = approveLoading || buyLoading || isCheckingApproval || allowanceLoading;

  const now = Math.floor(Date.now() / 1000);
  const timeRemaining = Math.max(0, endTime - now);
  const minutesRemaining = Math.floor(timeRemaining / 60);
  const secondsRemaining = timeRemaining % 60;

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-20">
        <section className="relative py-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[128px]" />
          <div className="relative z-10 container mx-auto max-w-7xl text-center py-20">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <Wallet className="w-12 h-12 text-zinc-500" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter mb-4">Connect Your Wallet</h1>
              <p className="text-xl text-zinc-400 max-w-2xl mx-auto">Connect your wallet to purchase lottery tickets</p>
            </motion.div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[128px]" />
        <div className="relative z-10 container mx-auto max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-block px-4 py-2 mb-6 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
              <span className="text-sm text-zinc-400">Round #{currentRoundId}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">Buy Tickets</h1>
            <p className="text-xl text-zinc-400 max-w-2xl">Choose your ticket type and enter the draw!</p>
          </motion.div>
        </div>
      </section>

      {buySuccess && (
        <section className="relative py-4 px-6">
          <div className="container mx-auto max-w-7xl">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-500/30 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-green-400">Ticket Purchased!</div>
                  <div className="text-sm text-zinc-400">Tx: {buyHash?.slice(0, 10)}...{buyHash?.slice(-8)}</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      <section className="relative py-12 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl mb-6">
                {/* Quantity Selection */}
                <div className="mb-8">
                  <h2 className="text-2xl font-black mb-6">Choose Quantity</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {QUANTITIES.map((quantity) => {
                      const getQuantityClasses = (id: number, isSelected: boolean) => {
                        if (!isSelected) return 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600';
                        switch(id) {
                          case 1: return 'bg-amber-500/10 border-amber-500/20 border-2';
                          case 2: return 'bg-slate-500/10 border-slate-500/20 border-2';
                          case 3: return 'bg-yellow-500/10 border-yellow-500/20 border-2';
                          case 4: return 'bg-cyan-500/10 border-cyan-500/20 border-2';
                          default: return '';
                        }
                      };
                      const getQuantityTextColor = (id: number) => {
                        switch(id) {
                          case 1: return 'text-amber-400';
                          case 2: return 'text-slate-300';
                          case 3: return 'text-yellow-400';
                          case 4: return 'text-cyan-400';
                          default: return 'text-zinc-400';
                        }
                      };
                      return (
                        <motion.button
                          key={quantity.id}
                          onClick={() => setSelectedQuantity(quantity.id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`p-6 rounded-2xl border-2 transition-all ${getQuantityClasses(quantity.id, selectedQuantity === quantity.id)}`}
                        >
                          <div className="text-2xl mb-2">{quantity.emoji}</div>
                          <div className={`text-lg font-black ${selectedQuantity === quantity.id ? getQuantityTextColor(quantity.id) : 'text-zinc-400'} mb-1`}>{quantity.name}</div>
                          <div className={`text-sm ${selectedQuantity === quantity.id ? getQuantityTextColor(quantity.id) : 'text-zinc-400'}`}>{quantity.multiplier}x</div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Choice Selection (Pile/Face) */}
                <div className="mb-8">
                  <h2 className="text-2xl font-black mb-6">Choose Your Bet</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {CHOICE_TYPES.map((choice) => {
                      const getChoiceClasses = (id: number, isSelected: boolean) => {
                        if (!isSelected) return 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600';
                        switch(id) {
                          case 1: return 'bg-green-500/10 border-green-500/20 border-2';
                          case 2: return 'bg-red-500/10 border-red-500/20 border-2';
                          default: return '';
                        }
                      };
                      const getChoiceTextColor = (id: number) => {
                        switch(id) {
                          case 1: return 'text-green-400';
                          case 2: return 'text-red-400';
                          default: return 'text-zinc-400';
                        }
                      };
                      return (
                        <motion.button
                          key={choice.id}
                          onClick={() => setSelectedChoice(choice.id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`p-6 rounded-2xl border-2 transition-all ${getChoiceClasses(choice.id, selectedChoice === choice.id)}`}
                        >
                          <div className="text-3xl mb-3">{choice.emoji}</div>
                          <div className={`text-lg font-black ${selectedChoice === choice.id ? getChoiceTextColor(choice.id) : 'text-zinc-400'} mb-1`}>{choice.name}</div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Coins className="w-5 h-5 text-indigo-400" />
                      <span className="text-zinc-400">Your USDC Balance</span>
                    </div>
                    <span className={`font-bold ${hasEnoughBalance ? 'text-green-400' : 'text-red-400'}`}>
                      {isLoading ? '...' : `${parseFloat(balanceFormatted).toFixed(4)} USDC`}
                    </span>
                  </div>
                  {!hasEnoughBalance && !isLoading && (
                    <div className="mt-2 text-sm text-red-400">Insufficient balance. Need {ticketCostFormatted.toFixed(2)} USDC.</div>
                  )}
                </div>

                {needsApproval === true && hasEnoughBalance && (
                  <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-200/90">
                      <p className="font-semibold mb-1">Approval Required</p>
                      <p>Approve the lottery contract to spend your USDC tokens.</p>
                    </div>
                  </div>
                )}

                <motion.button
                  onClick={handlePurchase}
                  disabled={isPurchasing || !hasEnoughBalance || buySuccess}
                  className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-white text-black rounded-2xl font-black hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isCheckingApproval ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      Checking...
                    </>
                  ) : isPurchasing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      {approveLoading ? 'Approving...' : 'Purchasing...'}
                    </>
                  ) : buySuccess ? (
                    <><Check className="w-5 h-5" />Purchased!</>
                  ) : needsApproval === true ? (
                    <><Check className="w-5 h-5" />Approve USDC</>
                  ) : (
                    <><ShoppingCart className="w-5 h-5" />Buy Ticket</>
                  )}
                </motion.button>

                {approveSuccess && !buySuccess && (
                  <div className="mt-4 text-center text-sm text-green-400">Approved! Click to purchase.</div>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-zinc-300">
                    <p className="font-semibold mb-2">How it works:</p>
                    <ul className="space-y-1 list-disc list-inside text-zinc-400">
                      <li>Choose a ticket type</li>
                      <li>Winner selected via Chainlink VRF</li>
                      <li>Share pool with other winners</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-cyan-500/10 border border-zinc-800 rounded-3xl">
                <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Round #{currentRoundId}</div>
                <h3 className="text-3xl font-black mb-6">Prize Pool</h3>
                <div className="text-4xl font-black mb-2 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">{roundLoading ? '...' : totalPrize}</div>
                <div className="text-xl text-zinc-400 mb-6">USDC</div>
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm text-zinc-500">Total Tickets</span>
                    </div>
                    <div className="text-2xl font-black">{roundLoading ? '...' : numberOfTickets}</div>
                  </div>
                  <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-4 h-4 text-violet-400" />
                      <span className="text-sm text-zinc-500">Time Left</span>
                    </div>
                    <div className="text-2xl font-black">{timeRemaining > 0 ? `${minutesRemaining}m` : 'Ended'}</div>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl">
                <h3 className="text-lg font-black mb-4">Your Selection</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-zinc-500">Quantity</div>
                    <div className={`text-2xl font-black ${selectedQuantity === 1 ? 'text-amber-400' : selectedQuantity === 2 ? 'text-slate-300' : selectedQuantity === 3 ? 'text-yellow-400' : 'text-cyan-400'}`}>
                      {selectedQuantityObj.name} ({selectedQuantityObj.multiplier}x)
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">Bet</div>
                    <div className={`text-2xl font-black ${selectedChoice === 1 ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedChoiceObj.name}
                    </div>
                  </div>
                  <div><div className="text-sm text-zinc-500">Total Cost</div><div className="text-2xl font-black text-green-400">{ticketCostFormatted.toFixed(2)} USDC</div></div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl">
                <h3 className="text-lg font-black mb-4">Powered By</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center"><span className="text-xs font-black text-indigo-400">Ξ</span></div>
                    <div><div className="text-sm font-semibold">Ethereum Sepolia</div></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/20 flex items-center justify-center"><span className="text-xs font-black text-violet-400">CL</span></div>
                    <div><div className="text-sm font-semibold">Chainlink VRF v2.5</div></div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
