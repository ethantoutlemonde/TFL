"use client";

import { motion } from "motion/react";
import { Trophy, ExternalLink, Search, Filter } from "lucide-react";
import { useState } from "react";

const allWinners = [
  {
    id: 1,
    wallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f38a9f3",
    amount: 1250.45,
    date: "Sep 15, 2025",
    draw: 47,
    txHash: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z",
  },
  {
    id: 2,
    wallet: "0x8f1c29Dd4512A9532821b6c833Fc9d7584f21b2e7",
    amount: 980.32,
    date: "Sep 01, 2025",
    draw: 46,
    txHash: "0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a",
  },
  {
    id: 3,
    wallet: "0x3a9e47Bb2839E9123745a1d922Ae8c6391d03c4d1",
    amount: 1567.89,
    date: "Aug 20, 2025",
    draw: 45,
    txHash: "0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b",
  },
  {
    id: 4,
    wallet: "0x6d2f83Ee9421F8534612c4e731Bf7d4982a14e8a5",
    amount: 2134.67,
    date: "Aug 05, 2025",
    draw: 44,
    txHash: "0x4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c",
  },
  {
    id: 5,
    wallet: "0x9f2a81Bb3947E8234856c2e833Gd0e7692f14d5b2",
    amount: 875.23,
    date: "Jul 22, 2025",
    draw: 43,
    txHash: "0x5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d",
  },
  {
    id: 6,
    wallet: "0x1b3e92Cc4058F9345967d3f944He1f8703g25f6c3",
    amount: 1789.45,
    date: "Jul 08, 2025",
    draw: 42,
    txHash: "0x6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e",
  },
  {
    id: 7,
    wallet: "0x2c4f03Dd5169G0456078e4g055If2g9814h36g7d4",
    amount: 2456.78,
    date: "Jun 25, 2025",
    draw: 41,
    txHash: "0x7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f",
  },
  {
    id: 8,
    wallet: "0x3d5g14Ee6270H1567189f5h166Jg3h0925i47h8e5",
    amount: 1123.90,
    date: "Jun 10, 2025",
    draw: 40,
    txHash: "0x8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g",
  },
];

export function WinnersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDraw, setFilterDraw] = useState("all");

  const filteredWinners = allWinners.filter(winner => {
    const matchesSearch = winner.wallet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         winner.draw.toString().includes(searchTerm);
    const matchesFilter = filterDraw === "all" || winner.draw.toString() === filterDraw;
    return matchesSearch && matchesFilter;
  });

  const totalPrizes = allWinners.reduce((sum, winner) => sum + winner.amount, 0);

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-[128px]" />

        <div className="relative z-10 container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-2 mb-6 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
              <span className="text-sm text-zinc-400">Winners Hall of Fame</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
              Past Winners
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mb-12">
              Verified winners with instant payouts. All transactions are publicly auditable on the blockchain.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl">
              <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                <div className="text-sm text-zinc-500 mb-2">Total Winners</div>
                <div className="text-3xl font-black">{allWinners.length}</div>
              </div>
              <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                <div className="text-sm text-zinc-500 mb-2">Total Prizes Paid</div>
                <div className="text-3xl font-black">{totalPrizes.toFixed(2)} ETH</div>
              </div>
              <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl col-span-2 md:col-span-1">
                <div className="text-sm text-zinc-500 mb-2">Largest Win</div>
                <div className="text-3xl font-black">
                  {Math.max(...allWinners.map(w => w.amount)).toFixed(2)} ETH
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="relative py-12 px-6 bg-zinc-950">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search by wallet address or draw number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <select
                value={filterDraw}
                onChange={(e) => setFilterDraw(e.target.value)}
                className="pl-12 pr-8 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
              >
                <option value="all">All Draws</option>
                {Array.from(new Set(allWinners.map(w => w.draw))).sort((a, b) => b - a).map(draw => (
                  <option key={draw} value={draw}>Draw #{draw}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Winners List */}
      <section className="relative py-12 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-6">
            {filteredWinners.map((winner, index) => (
              <motion.div
                key={winner.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="group"
              >
                <div className="relative p-8 bg-zinc-900 border border-zinc-800 rounded-3xl hover:border-zinc-700 transition-all h-full">
                  {/* Rank badge for top 3 */}
                  {index < 3 && filterDraw === "all" && searchTerm === "" && (
                    <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center border-4 border-black">
                      <span className="text-sm font-black">#{index + 1}</span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-sm text-zinc-500">Draw #{winner.draw}</div>
                        <div className="text-xs text-zinc-600">{winner.date}</div>
                      </div>
                    </div>

                    <motion.a
                      href="#"
                      className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ExternalLink className="w-4 h-4 text-zinc-400" />
                    </motion.a>
                  </div>

                  {/* Winner address */}
                  <div className="mb-6">
                    <div className="text-xs text-zinc-500 mb-2 tracking-wider uppercase">Winner Address</div>
                    <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                      <p className="text-sm font-mono text-zinc-300 break-all">{winner.wallet}</p>
                    </div>
                  </div>

                  {/* Transaction hash */}
                  <div className="mb-6">
                    <div className="text-xs text-zinc-500 mb-2 tracking-wider uppercase">Transaction Hash</div>
                    <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                      <p className="text-xs font-mono text-zinc-400 break-all">{winner.txHash}</p>
                    </div>
                  </div>

                  {/* Prize amount */}
                  <div className="mb-6">
                    <div className="text-xs text-zinc-500 mb-2 tracking-wider uppercase">Prize Amount</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                        {winner.amount.toFixed(2)}
                      </span>
                      <span className="text-xl text-zinc-400">ETH</span>
                    </div>
                    <p className="text-sm text-zinc-500 mt-1">
                      ≈ ${(winner.amount * 3200).toLocaleString()} USD
                    </p>
                  </div>

                  {/* Verification badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-xs text-green-400 font-semibold tracking-wider uppercase">Verified On-Chain</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredWinners.length === 0 && (
            <div className="text-center py-20">
              <div className="text-zinc-500 mb-4">No winners found matching your search</div>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterDraw("all");
                }}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
