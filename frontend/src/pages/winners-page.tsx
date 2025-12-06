"use client";

import { motion } from "motion/react";
import { Trophy, ExternalLink, Search, Filter } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useWinners } from "../hooks/useLotteryData";
import { ACTIVE_CONFIG } from "../config/contracts";

export function WinnersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDraw, setFilterDraw] = useState("all");

  const { winners, isLoading, error } = useWinners(8);

  // Snapshot data once loaded to avoid UI flicker/recomputes
  const [snapshot, setSnapshot] = useState<{
    flattened: typeof flattened;
    draws: number[];
    totalPrizes: number;
    largestWin: number;
  } | null>(null);

  const flattened = useMemo(() => {
    return winners.flatMap((round) =>
      round.winners.map((w, idx) => ({
        id: `${round.roundId}-${idx}`,
        wallet: w.address,
        amount: parseFloat(w.payoutFormatted),
        bet: parseFloat(w.betFormatted),
        date: round.endTime ? new Date(round.endTime * 1000).toLocaleDateString() : "",
        draw: round.roundId,
        winningTicketType: round.winningTicketType,
        prizePool: round.prizePoolFormatted,
      }))
    );
  }, [winners]);

  const filteredWinners = (snapshot ? snapshot.flattened : flattened).filter(winner => {
    const matchesSearch = winner.wallet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         winner.draw.toString().includes(searchTerm);
    const matchesFilter = filterDraw === "all" || winner.draw.toString() === filterDraw;
    return matchesSearch && matchesFilter;
  });

  const totalPrizes = flattened.reduce((sum, winner) => sum + (winner.amount || 0), 0);
  const largestWin = flattened.reduce((max, winner) => Math.max(max, winner.amount || 0), 0);
  const uniqueDraws = Array.from(new Set(flattened.map(w => w.draw))).sort((a, b) => b - a);

  useEffect(() => {
    if (!isLoading && !snapshot) {
      setSnapshot({
        flattened,
        draws: uniqueDraws,
        totalPrizes,
        largestWin,
      });
    }
  }, [isLoading, snapshot, flattened, uniqueDraws, totalPrizes, largestWin]);

  const data = snapshot ?? { flattened: [], draws: [], totalPrizes: 0, largestWin: 0 };

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
                <div className="text-3xl font-black">{snapshot ? data.flattened.length : "..."}</div>
              </div>
              <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                <div className="text-sm text-zinc-500 mb-2">Total Prizes Paid</div>
                <div className="text-3xl font-black">{snapshot ? data.totalPrizes.toFixed(4) : "..."} USDC</div>
              </div>
              <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl col-span-2 md:col-span-1">
                <div className="text-sm text-zinc-500 mb-2">Largest Win</div>
                <div className="text-3xl font-black">
                  {snapshot ? data.largestWin.toFixed(4) : "..."} USDC
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
                {/* {uniqueDraws.map(draw => (
                {(snapshot ? data.draws : uniqueDraws).map(draw => (
                  <option key={draw} value={draw}>Draw #{draw}</option>
                ))} */}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Winners List */}
      <section className="relative py-12 px-6">
        <div className="container mx-auto max-w-7xl">
          {error && (
            <div className="text-red-400 mb-4">Failed to load winners: {error.message}</div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {(snapshot ? filteredWinners : Array.from({ length: 4 })).map((winner: any, index: number) => (
              <motion.div
                key={!snapshot ? `skeleton-${index}` : winner.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="group"
              >
                <div className="relative p-8 bg-zinc-900 border border-zinc-800 rounded-3xl hover:border-zinc-700 transition-all h-full">
                  {/* Rank badge for top 3 */}
                  {snapshot && index < 3 && filterDraw === "all" && searchTerm === "" && (
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
                        <div className="text-sm text-zinc-500">Draw #{snapshot ? winner.draw : "-"}</div>
                        <div className="text-xs text-zinc-600">{snapshot ? winner.date : "Loading..."}</div>
                      </div>
                    </div>

                    <motion.a
                      href={!snapshot ? "#" : `${ACTIVE_CONFIG.EXPLORER_URL}/address/${winner.wallet}`}
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
                      <p className="text-sm font-mono text-zinc-300 break-all">{snapshot ? winner.wallet : "0x..."}</p>
                    </div>
                  </div>

                  {/* Prize amount */}
                  <div className="mb-6">
                    <div className="text-xs text-zinc-500 mb-2 tracking-wider uppercase">Prize Amount</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                        {snapshot ? winner.amount.toFixed(4) : "..."}
                      </span>
                      <span className="text-xl text-zinc-400">USDC</span>
                    </div>
                    {snapshot && (
                      <p className="text-sm text-zinc-500 mt-1">Bet: {winner.bet.toFixed(4)} USDC</p>
                    )}
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

          {snapshot && filteredWinners.length === 0 && (
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
