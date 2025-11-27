"use client";

import { motion } from "motion/react";
import { Trophy, ExternalLink } from "lucide-react";

const pastWinners = [
  {
    wallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f38a9f3",
    amount: 1250.45,
    date: "Sep 15, 2025",
    draw: 47,
  },
  {
    wallet: "0x8f1c29Dd4512A9532821b6c833Fc9d7584f21b2e7",
    amount: 980.32,
    date: "Sep 01, 2025",
    draw: 46,
  },
  {
    wallet: "0x3a9e47Bb2839E9123745a1d922Ae8c6391d03c4d1",
    amount: 1567.89,
    date: "Aug 20, 2025",
    draw: 45,
  },
  {
    wallet: "0x6d2f83Ee9421F8534612c4e731Bf7d4982a14e8a5",
    amount: 2134.67,
    date: "Aug 05, 2025",
    draw: 44,
  },
];

export function WinnersSection() {
  return (
    <section className="relative py-32 px-6 overflow-hidden bg-zinc-950">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="inline-block px-4 py-2 mb-6 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
            <span className="text-sm text-zinc-400">Past Draws</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
            Recent Winners
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl">
            All payouts are instant, verified, and publicly traceable on the blockchain.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {pastWinners.map((winner, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="relative p-8 bg-zinc-900 border border-zinc-800 rounded-3xl hover:border-zinc-700 transition-all h-full">
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
                  <div className="text-xs text-zinc-500 mb-2 tracking-wider uppercase">Winner</div>
                  <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                    <p className="text-sm font-mono text-zinc-300 break-all">{winner.wallet}</p>
                  </div>
                </div>

                {/* Prize amount */}
                <div className="mb-6">
                  <div className="text-xs text-zinc-500 mb-2 tracking-wider uppercase">Prize</div>
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
                  <span className="text-xs text-green-400 font-semibold tracking-wider uppercase">Verified</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <motion.button
            className="px-8 py-4 border border-zinc-700 text-white rounded-full font-semibold hover:bg-zinc-900 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View All Winners on Explorer
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
