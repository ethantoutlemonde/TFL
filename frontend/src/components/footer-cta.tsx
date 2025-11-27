"use client";

import { motion } from "motion/react";
import { ArrowRight, Twitter, Github, Send } from "lucide-react";

interface FooterCTAProps {
  onBuyTickets: () => void;
}

export function FooterCTA({ onBuyTickets }: FooterCTAProps) {
  return (
    <footer className="relative py-32 px-6 overflow-hidden">
      <div className="container mx-auto max-w-7xl">
        {/* Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-none">
            Ready to
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Change Your Life?
            </span>
          </h2>

          <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of participants in the world's most transparent lottery. Connect your wallet and enter the draw now.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              onClick={onBuyTickets}
              className="group relative px-10 py-5 bg-white text-black rounded-full font-semibold overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Enter Draw Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>

            <motion.button
              className="px-10 py-5 border border-zinc-700 text-white rounded-full font-semibold hover:bg-zinc-900 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Read Documentation
            </motion.button>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="h-px bg-zinc-800 mb-16" />

        {/* Footer content */}
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div>
            <div className="text-2xl font-black tracking-tight mb-4">
              CRYPTOLOTTO
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">
              The first truly decentralized lottery platform built on blockchain.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              {['How it Works', 'Current Draw', 'Past Winners', 'Smart Contract'].map((link, i) => (
                <li key={i}>
                  <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              {['Documentation', 'API Reference', 'FAQ', 'Support'].map((link, i) => (
                <li key={i}>
                  <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Disclaimer'].map((link, i) => (
                <li key={i}>
                  <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-zinc-800">
          <p className="text-sm text-zinc-500">
            © 2025 CryptoLotto. Built on Ethereum.
          </p>

          <div className="flex items-center gap-4">
            {[
              { icon: Twitter, href: '#' },
              { icon: Github, href: '#' },
              { icon: Send, href: '#' },
            ].map((social, i) => (
              <motion.a
                key={i}
                href={social.href}
                className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-zinc-700 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <social.icon className="w-4 h-4 text-zinc-400" />
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
