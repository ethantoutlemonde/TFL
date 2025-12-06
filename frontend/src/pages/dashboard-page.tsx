"use client";

import { motion } from "motion/react";
import { useEffect } from "react";
import { Ticket, TrendingUp, Trophy, Calendar, ExternalLink, Clock, Wallet, AlertCircle, Coins } from "lucide-react";
import { useWallet } from '../hooks/useWallet';
import { 
  useLotteryInfo, 
  usePlayerAllTickets, 
  usePlayerWinnings,
  useWithdraw 
} from '../hooks/useLotteryData';

interface DashboardPageProps {
  onViewTicket: (ticketId: number) => void;
  onBuyTickets: () => void;
}

const TICKET_TYPE_NAMES = ['', 'Bronze', 'Silver', 'Gold', 'Diamond'];
const TICKET_TYPE_COLORS = ['', 'amber', 'zinc', 'yellow', 'cyan'];

// Helper function to get ticket color classes
function getTicketColorClasses(ticketType: number) {
  const colorMap: { [key: number]: { bg: string; border: string; text: string; icon: string } } = {
    1: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'text-amber-400' },
    2: { bg: 'bg-zinc-500/20', border: 'border-zinc-400/30', text: 'text-zinc-300', icon: 'text-zinc-300' },
    3: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: 'text-yellow-400' },
    4: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400', icon: 'text-cyan-400' },
  };
  return colorMap[ticketType] || colorMap[1];
}

export function DashboardPage({ onViewTicket, onBuyTickets }: DashboardPageProps) {
  const { account, isConnecting } = useWallet();
  const address = account ? (account as `0x${string}`) : undefined;
  const isConnected = !!account;
  
  // Récupérer les infos de la loterie
  const { currentRoundId, isLoading: lotteryLoading } = useLotteryInfo();
  
  // Récupérer tous les tickets du joueur
  const { tickets, isLoading: ticketsLoading, refetch: refetchTickets } = usePlayerAllTickets(address, currentRoundId);
  
  // Récupérer les gains du joueur
  const { pendingWinnings, isLoading: winningsLoading, refetch: refetchWinnings } = usePlayerWinnings(address);
  
  // Hook pour retirer les gains
  const { withdraw, isPending: withdrawLoading, isSuccess: withdrawSuccess, hash: withdrawHash } = useWithdraw();

  // Refetch tickets au chargement de la page
  useEffect(() => {
    if (isConnected && currentRoundId > 0) {
      refetchTickets();
      refetchWinnings();
    }
  }, [isConnected, currentRoundId]);

  const handleWithdraw = async () => {
    if (parseFloat(pendingWinnings) > 0) {
      await withdraw();
    }
  };

  // Calculer les stats
  const totalTickets = tickets.length;
  const activeTickets = tickets.filter(t => t.roundId === currentRoundId);
  const pastTickets = tickets.filter(t => t.roundId < currentRoundId);
  const totalSpent = tickets.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const pendingWinningsNum = parseFloat(pendingWinnings);

  const stats = [
    {
      icon: Ticket,
      label: "Total Tickets",
      value: totalTickets.toString(),
      color: "indigo",
    },
    {
      icon: TrendingUp,
      label: "Total Spent",
      value: `${totalSpent.toFixed(2)} TFL`,
      color: "violet",
    },
    {
      icon: Trophy,
      label: "Pending Winnings",
      value: `${pendingWinningsNum.toFixed(2)} TFL`,
      color: "cyan",
    },
    {
      icon: Calendar,
      label: "Active Rounds",
      value: activeTickets.length > 0 ? "1" : "0",
      color: "green",
    },
  ];

  const isLoading = lotteryLoading || ticketsLoading || winningsLoading;

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
              {isConnected && address ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}` : "Connect your wallet to view your tickets"}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pending Winnings Banner */}
      {pendingWinningsNum > 0 && (
        <section className="relative py-4 px-6">
          <div className="container mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-green-400">
                    You have {pendingWinningsNum.toFixed(4)} TFL to withdraw!
                  </div>
                  <div className="text-sm text-zinc-400">
                    Claim your winnings now
                  </div>
                </div>
              </div>
              <motion.button
                onClick={handleWithdraw}
                disabled={withdrawLoading}
                className="px-8 py-3 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {withdrawLoading ? 'Withdrawing...' : 'Withdraw Now'}
              </motion.button>
            </motion.div>
            {withdrawSuccess && withdrawHash && (
              <div className="mt-2 text-center text-sm text-green-400">
                ✓ Withdrawal successful! Tx: {withdrawHash.slice(0, 10)}...
              </div>
            )}
          </div>
        </section>
      )}

      {/* Stats Grid */}
      <section className="relative py-12 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const colorClasses: { [key: string]: { bg: string; border: string; text: string } } = {
                indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400' },
                violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400' },
                cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
                green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
              };
              const colors = colorClasses[stat.color] || colorClasses.indigo;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-4`}>
                    <stat.icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <div className="text-sm text-zinc-500 mb-1">{stat.label}</div>
                  <div className="text-2xl font-black">
                    {isLoading ? '...' : stat.value}
                  </div>
                </motion.div>
              );
            })}
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
            <p className="text-zinc-400">Your entries for Round #{currentRoundId}</p>
          </motion.div>

          {isLoading ? (
            <div className="text-center py-12 text-zinc-500">Loading tickets...</div>
          ) : activeTickets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 bg-zinc-900/50 border border-zinc-800 rounded-2xl"
            >
              <Ticket className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
              <p className="text-zinc-400 mb-4">No active tickets for the current round</p>
              <motion.button
                onClick={onBuyTickets}
                className="px-6 py-3 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-400 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Buy Tickets Now
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {activeTickets.map((ticket, index) => (
                <motion.div
                  key={`${ticket.roundId}-${ticket.ticketType}`}
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
                        <div className={`w-12 h-12 rounded-xl ${getTicketColorClasses(ticket.ticketType).bg} border ${getTicketColorClasses(ticket.ticketType).border} flex items-center justify-center`}>
                          <Ticket className={`w-6 h-6 ${getTicketColorClasses(ticket.ticketType).icon}`} />
                        </div>
                        <div>
                          <div className="text-sm text-zinc-500">Round #{ticket.roundId}</div>
                          <div className="font-semibold">{TICKET_TYPE_NAMES[ticket.ticketType]} Ticket</div>
                        </div>
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Ticket Type</div>
                        <div className={`text-sm font-semibold ${getTicketColorClasses(ticket.ticketType).text}`}>
                          {TICKET_TYPE_NAMES[ticket.ticketType]}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Amount Staked</div>
                        <div className="text-sm font-semibold">{ticket.amount} TFL</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Status</div>
                        <div className="text-sm font-semibold text-green-400">Pending Draw</div>
                      </div>
                    </div>

                    {/* Action button */}
                    <motion.button
                      onClick={() => onViewTicket(ticket.roundId)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-sm font-semibold">View Round Details</span>
                      <ExternalLink className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Past Tickets */}
          {pastTickets.length > 0 && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mb-8 mt-12"
              >
                <h2 className="text-3xl font-black tracking-tighter mb-2">Past Tickets</h2>
                <p className="text-zinc-400">Your completed round entries</p>
              </motion.div>

              <div className="space-y-4">
                {pastTickets.map((ticket, index) => (
                  <motion.div
                    key={`${ticket.roundId}-${ticket.ticketType}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                    className="group"
                  >
                    <div className="relative p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl ${getTicketColorClasses(ticket.ticketType).bg} border ${getTicketColorClasses(ticket.ticketType).border} flex items-center justify-center flex-shrink-0`}>
                            <Ticket className={`w-6 h-6 ${getTicketColorClasses(ticket.ticketType).icon}`} />
                          </div>
                          <div>
                            <div className="font-semibold mb-1">
                              Round #{ticket.roundId} • {TICKET_TYPE_NAMES[ticket.ticketType]}
                            </div>
                            <div className="text-sm text-zinc-500">
                              Staked: {ticket.amount} TFL
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-zinc-500 mb-1">Status</div>
                            <div className="text-sm font-semibold text-zinc-400">Completed</div>
                          </div>
                          <motion.button
                            onClick={() => onViewTicket(ticket.roundId)}
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
            </>
          )}
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
                Ready for Round #{currentRoundId}?
              </h2>
              <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
                Get your tickets now and stand a chance to win the growing jackpot
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
