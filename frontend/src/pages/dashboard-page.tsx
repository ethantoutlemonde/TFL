"use client";

import { motion } from "motion/react";
import { Ticket, TrendingUp, Trophy, Calendar, ExternalLink, Clock, CheckCircle } from "lucide-react";

const userTickets = [
  {
    id: 1,
    drawNumber: 48,
    ticketNumber: "TKT-0x742d...a9f3",
    purchaseDate: "Oct 1, 2025",
    status: "active",
    amount: 0.01,
    drawDate: "Oct 15, 2025",
  },
  {
    id: 2,
    drawNumber: 48,
    ticketNumber: "TKT-0x8f1c...b2e7",
    purchaseDate: "Oct 1, 2025",
    status: "active",
    amount: 0.01,
    drawDate: "Oct 15, 2025",
  },
  {
    id: 3,
    drawNumber: 47,
    ticketNumber: "TKT-0x3a9e...c4d1",
    purchaseDate: "Sep 10, 2025",
    status: "completed",
    amount: 0.01,
    drawDate: "Sep 15, 2025",
    result: "lost",
  },
  {
    id: 4,
    drawNumber: 46,
    ticketNumber: "TKT-0x6d2f...e8a5",
    purchaseDate: "Aug 28, 2025",
    status: "completed",
    amount: 0.01,
    drawDate: "Sep 1, 2025",
    result: "lost",
  },
];

const stats = [
  {
    icon: Ticket,
    label: "Total Tickets",
    value: "4",
    color: "indigo",
  },
  {
    icon: TrendingUp,
    label: "Total Spent",
    value: "0.04 ETH",
    color: "violet",
  },
  {
    icon: Trophy,
    label: "Wins",
    value: "0",
    color: "cyan",
  },
  {
    icon: Calendar,
    label: "Active Draws",
    value: "1",
    color: "green",
  },
];

interface DashboardPageProps {
  onViewTicket: (ticketId: number) => void;
  onBuyTickets: () => void;
}

export function DashboardPage({ onViewTicket, onBuyTickets }: DashboardPageProps) {
  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-indigo-500/20 rounded-full blur-[128px]" />

        <div className="relative z-10 container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-2 mb-6 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
              <span className="text-sm text-zinc-400">Dashboard</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
              My Tickets
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl">
              Track your lottery entries and participation history
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="relative py-12 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center mb-4`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
                <div className="text-sm text-zinc-500 mb-1">{stat.label}</div>
                <div className="text-2xl font-black">{stat.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Tickets */}
      <section className="relative py-12 px-6">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-black tracking-tighter mb-2">Active Tickets</h2>
            <p className="text-zinc-400">Your entries for upcoming draws</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {userTickets.filter(t => t.status === 'active').map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="relative p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all overflow-hidden">
                  {/* Active indicator */}
                  <div className="absolute top-6 right-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs text-green-400 font-semibold tracking-wider uppercase">
                        Active
                      </span>
                    </div>
                  </div>

                  {/* Draw info */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center">
                        <Ticket className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-sm text-zinc-500">Draw #{ticket.drawNumber}</div>
                        <div className="font-semibold">First Draw</div>
                      </div>
                    </div>
                  </div>

                  {/* Ticket number */}
                  <div className="mb-6">
                    <div className="text-xs text-zinc-500 mb-2 tracking-wider uppercase">Ticket ID</div>
                    <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                      <p className="text-sm font-mono text-zinc-300">{ticket.ticketNumber}</p>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">Purchase Date</div>
                      <div className="text-sm font-semibold">{ticket.purchaseDate}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">Draw Date</div>
                      <div className="text-sm font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        {ticket.drawDate}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">Amount</div>
                      <div className="text-sm font-semibold">{ticket.amount} ETH</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">Status</div>
                      <div className="text-sm font-semibold text-green-400">Pending Draw</div>
                    </div>
                  </div>

                  {/* Action button */}
                  <motion.button
                    onClick={() => onViewTicket(ticket.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-sm font-semibold">View Details</span>
                    <ExternalLink className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Past Tickets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-black tracking-tighter mb-2">Past Tickets</h2>
            <p className="text-zinc-400">Your completed draw entries</p>
          </motion.div>

          <div className="space-y-4">
            {userTickets.filter(t => t.status === 'completed').map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                className="group"
              >
                <div className="relative p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                        <Ticket className="w-6 h-6 text-zinc-400" />
                      </div>
                      <div>
                        <div className="font-semibold mb-1">
                          Draw #{ticket.drawNumber} • {ticket.ticketNumber}
                        </div>
                        <div className="text-sm text-zinc-500">
                          Purchased {ticket.purchaseDate} • Draw {ticket.drawDate}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-zinc-500 mb-1">Result</div>
                        <div className="text-sm font-semibold text-zinc-400">Not Won</div>
                      </div>
                      <motion.button
                        onClick={() => onViewTicket(ticket.id)}
                        className="px-4 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="relative p-12 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-cyan-500/10 border border-zinc-800 rounded-3xl overflow-hidden text-center"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px]" />
            
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
                Ready for the Next Draw?
              </h2>
              <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
                Get your tickets now for Draw #48 and stand a chance to win the growing jackpot
              </p>
              <motion.button
                onClick={onBuyTickets}
                className="px-10 py-5 bg-white text-black rounded-full font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Buy Tickets Now
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
