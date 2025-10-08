"use client";

import { motion } from "motion/react";
import { Minus, Plus, Ticket, ShoppingCart, AlertCircle, Info, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { useWallet } from "../hooks/useWallet";

interface BuyTicketsPageProps {
  onSuccess: () => void;
}

export function BuyTicketsPage({ onSuccess }: BuyTicketsPageProps) {
  const [ticketCount, setTicketCount] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { account, connect } = useWallet();

  const ticketPrice = 0.01;
  const totalCost = ticketPrice * ticketCount;
  const gasFee = 0.0015; // Estimated
  const totalWithGas = totalCost + gasFee;

  const currentDraw = {
    id: 48,
    prizePool: 2847.65,
    participants: 1847,
    drawDate: "Oct 15, 2025",
    daysLeft: 14,
  };

  const increaseCount = () => {
    if (ticketCount < 100) setTicketCount(ticketCount + 1);
  };

  const decreaseCount = () => {
    if (ticketCount > 1) setTicketCount(ticketCount - 1);
  };

  const handlePurchase = async () => {
    if (!account) {
      await connect();
      return;
    }

    setIsPurchasing(true);
    
    // Simulate blockchain transaction
    setTimeout(() => {
      setIsPurchasing(false);
      onSuccess();
    }, 3000);
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[128px]" />

        <div className="relative z-10 container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-2 mb-6 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
              <span className="text-sm text-zinc-400">Current Draw</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
              Buy Tickets
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl">
              Enter the draw for a chance to win {currentDraw.prizePool.toFixed(2)} ETH
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative py-12 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Purchase Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl mb-6"
              >
                <h2 className="text-2xl font-black mb-6">Select Number of Tickets</h2>

                {/* Ticket Counter */}
                <div className="mb-8">
                  <div className="flex items-center justify-center gap-6 mb-6">
                    <motion.button
                      onClick={decreaseCount}
                      disabled={ticketCount <= 1}
                      className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Minus className="w-6 h-6" />
                    </motion.button>

                    <div className="text-center">
                      <div className="text-6xl font-black mb-2">{ticketCount}</div>
                      <div className="text-sm text-zinc-500">Ticket{ticketCount > 1 ? 's' : ''}</div>
                    </div>

                    <motion.button
                      onClick={increaseCount}
                      disabled={ticketCount >= 100}
                      className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus className="w-6 h-6" />
                    </motion.button>
                  </div>

                  {/* Quick select buttons */}
                  <div className="flex gap-3 justify-center">
                    {[1, 5, 10, 25].map((count) => (
                      <button
                        key={count}
                        onClick={() => setTicketCount(count)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                          ticketCount === count
                            ? 'bg-indigo-500 text-white'
                            : 'bg-zinc-800 border border-zinc-700 hover:bg-zinc-700'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 p-6 bg-zinc-800/50 border border-zinc-700 rounded-2xl mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Ticket Price</span>
                    <span className="font-semibold">{ticketPrice} ETH × {ticketCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Subtotal</span>
                    <span className="font-semibold">{totalCost.toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Estimated Gas Fee</span>
                    <span className="font-semibold">{gasFee.toFixed(4)} ETH</span>
                  </div>
                  <div className="h-px bg-zinc-700 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-black">Total</span>
                    <div className="text-right">
                      <div className="text-2xl font-black">{totalWithGas.toFixed(4)} ETH</div>
                      <div className="text-sm text-zinc-500">≈ ${(totalWithGas * 3200).toFixed(2)} USD</div>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-200/90">
                    <p className="font-semibold mb-1">Please note:</p>
                    <p>All ticket purchases are final and non-refundable. Make sure you have enough ETH in your wallet to cover the total cost including gas fees.</p>
                  </div>
                </div>

                {/* Purchase Button */}
                <motion.button
                  onClick={handlePurchase}
                  disabled={isPurchasing}
                  className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-white text-black rounded-2xl font-black hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isPurchasing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      Processing Transaction...
                    </>
                  ) : account ? (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      Purchase {ticketCount} Ticket{ticketCount > 1 ? 's' : ''}
                    </>
                  ) : (
                    <>
                      Connect Wallet to Continue
                    </>
                  )}
                </motion.button>
              </motion.div>

              {/* Info Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl"
              >
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-zinc-300">
                    <p className="font-semibold mb-2">How it works:</p>
                    <ul className="space-y-1 list-disc list-inside text-zinc-400">
                      <li>Each ticket costs {ticketPrice} ETH and gives you one entry into the draw</li>
                      <li>Winner is selected using Chainlink VRF for provably fair randomness</li>
                      <li>Prize is automatically transferred to winner's wallet</li>
                      <li>All transactions are verifiable on the blockchain</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Draw Info */}
            <div className="space-y-6">
              {/* Current Draw Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="p-6 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-cyan-500/10 border border-zinc-800 rounded-3xl"
              >
                <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Draw #{currentDraw.id}</div>
                <h3 className="text-3xl font-black mb-6">Current Jackpot</h3>
                
                <div className="mb-6">
                  <div className="text-5xl font-black mb-2 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                    {currentDraw.prizePool.toFixed(2)}
                  </div>
                  <div className="text-xl text-zinc-400">ETH</div>
                  <div className="text-sm text-zinc-500 mt-1">
                    ≈ ${(currentDraw.prizePool * 3200).toLocaleString()} USD
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm text-zinc-500">Participants</span>
                    </div>
                    <div className="text-2xl font-black">{currentDraw.participants.toLocaleString()}</div>
                  </div>

                  <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-4 h-4 text-violet-400" />
                      <span className="text-sm text-zinc-500">Days Until Draw</span>
                    </div>
                    <div className="text-2xl font-black">{currentDraw.daysLeft}</div>
                  </div>
                </div>
              </motion.div>

              {/* Your Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl"
              >
                <h3 className="text-lg font-black mb-4">Your Entry</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-zinc-500 mb-1">Tickets Purchasing</div>
                    <div className="text-2xl font-black">{ticketCount}</div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500 mb-1">Win Probability</div>
                    <div className="text-2xl font-black">
                      {((ticketCount / (currentDraw.participants + ticketCount)) * 100).toFixed(4)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500 mb-1">Potential Prize</div>
                    <div className="text-2xl font-black">{currentDraw.prizePool.toFixed(2)} ETH</div>
                  </div>
                </div>
              </motion.div>

              {/* Blockchain Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl"
              >
                <h3 className="text-lg font-black mb-4">Powered By</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center">
                      <span className="text-xs font-black text-indigo-400">Ξ</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Ethereum</div>
                      <div className="text-xs text-zinc-500">Mainnet</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/20 flex items-center justify-center">
                      <span className="text-xs font-black text-violet-400">CL</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Chainlink VRF</div>
                      <div className="text-xs text-zinc-500">Verifiable Randomness</div>
                    </div>
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
