"use client";

import { motion } from "motion/react";
import { TrendingUp, Users, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export function JackpotSection() {
  const [jackpot, setJackpot] = useState(2847.65);
  const [tickets, setTickets] = useState(1847);

  useEffect(() => {
    const interval = setInterval(() => {
      setJackpot(prev => prev + Math.random() * 0.5);
      if (Math.random() > 0.7) {
        setTickets(prev => prev + 1);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const progress = Math.min((tickets / 5000) * 100, 100);

  return (
    <section className="relative py-32 px-6 overflow-hidden">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="inline-block px-4 py-2 mb-6 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
            <span className="text-sm text-zinc-400">Draw #1</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
            Current Jackpot
          </h2>
        </motion.div>

        {/* Main jackpot card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="relative p-12 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-cyan-500/10 border border-zinc-800 rounded-3xl overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px]" />
            
            <div className="relative">
              <div className="text-center mb-12">
                <div className="text-sm text-zinc-500 mb-4 tracking-wider uppercase">Total Prize Pool</div>
                <motion.div
                  className="text-7xl md:text-9xl font-black mb-4 bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent"
                  key={jackpot}
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {jackpot.toFixed(2)}
                </motion.div>
                <div className="text-2xl text-zinc-400">
                  ETH
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  ≈ ${(jackpot * 3200).toLocaleString()} USD
                </div>
              </div>

              {/* Progress bar */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="flex items-center justify-between mb-3 text-sm">
                  <span className="text-zinc-400">Tickets Sold: {tickets.toLocaleString()}</span>
                  <span className="text-zinc-400">Goal: 5,000</span>
                </div>
                <div className="relative h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className="text-sm text-zinc-500">Prize Pool</span>
                  </div>
                  <div className="text-2xl font-black">{jackpot.toFixed(2)} ETH</div>
                </div>

                <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-violet-400" />
                    </div>
                    <span className="text-sm text-zinc-500">Participants</span>
                  </div>
                  <div className="text-2xl font-black">{tickets.toLocaleString()}</div>
                </div>

                <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="text-sm text-zinc-500">Ticket Price</span>
                  </div>
                  <div className="text-2xl font-black">0.01 ETH</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent participants ticker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl"
        >
          <div className="text-xs text-zinc-500 mb-4 tracking-wider uppercase text-center">
            Recent Participants
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg"
              >
                <span className="text-sm font-mono text-zinc-400">
                  0x{Math.random().toString(16).substring(2, 10)}...
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
