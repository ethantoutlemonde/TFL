"use client";

import { motion } from "motion/react";
import { Shield, Lock, Eye, CheckCircle } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Immutable",
    description: "All transactions recorded on blockchain, unchangeable forever",
  },
  {
    icon: Eye,
    title: "Verifiable",
    description: "Chainlink VRF provides cryptographically secure random numbers",
  },
  {
    icon: Lock,
    title: "Trustless",
    description: "Smart contracts execute automatically without human intervention",
  },
  {
    icon: CheckCircle,
    title: "Traceable",
    description: "Every draw, ticket, and payout is publicly auditable on-chain",
  },
];

export function TransparencySection() {
  return (
    <section className="relative py-32 px-6 overflow-hidden bg-zinc-950">
      <div className="container mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left column - heading and features */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-2 mb-6 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
              <span className="text-sm text-zinc-400">Transparency & Security</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
              Built on
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Blockchain
              </span>
            </h2>
            
            <p className="text-xl text-zinc-400 mb-12 leading-relaxed">
              Complete transparency and unbreakable security powered by smart contracts and cryptographic verification.
            </p>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right column - blockchain visualization */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="relative"
                >
                  <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center">
                          <span className="text-sm font-black text-indigo-400">#{i + 1}</span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold">Block {12345 + i}</div>
                          <div className="text-xs text-zinc-500 font-mono">0x{Math.random().toString(16).substring(2, 10)}...</div>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500">
                        {i + 1}m ago
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${60 + (i * 8)}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: i * 0.1 + 0.3 }}
                        />
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-violet-500 to-cyan-500"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${40 + (i * 10)}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: i * 0.1 + 0.4 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Connection line */}
                  {i < 4 && (
                    <div className="absolute left-[25px] top-full w-0.5 h-4 bg-zinc-800" />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Chainlink badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="mt-8 p-6 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-2xl"
            >
              <div className="text-xs text-zinc-400 mb-2 tracking-wider uppercase">Powered by</div>
              <div className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Chainlink VRF
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
