"use client";

import { motion } from "motion/react";
import { ShoppingCart, Zap, Trophy } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: ShoppingCart,
    title: "Buy Ticket",
    description: "Purchase your lottery ticket using Ethereum or other supported cryptocurrencies. Instant, secure, and borderless.",
  },
  {
    number: "02",
    icon: Zap,
    title: "Random Draw",
    description: "Provably fair randomness powered by Chainlink VRF oracle. Verifiable on-chain, impossible to manipulate.",
  },
  {
    number: "03",
    icon: Trophy,
    title: "Win & Get Paid",
    description: "Winner automatically receives funds directly to their wallet. No intermediaries, no delays, no trust needed.",
  },
];

export function HowItWorks() {
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
            <span className="text-sm text-zinc-400">How it Works</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
            Three Simple Steps
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl">
            Participate in the world's most transparent lottery in just a few clicks.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative p-8 h-full bg-zinc-900/50 border border-zinc-800 rounded-3xl hover:border-zinc-700 transition-all">
                {/* Step number */}
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-black border border-zinc-800 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-black text-zinc-600">{step.number}</span>
                </div>

                {/* Icon */}
                <div className="mb-8 mt-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-indigo-400" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-black mb-4">
                  {step.title}
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  {step.description}
                </p>

                {/* Hover effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/0 to-violet-500/0 group-hover:from-indigo-500/5 group-hover:to-violet-500/5 transition-all pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
