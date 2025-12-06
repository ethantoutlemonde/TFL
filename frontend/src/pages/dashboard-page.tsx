"use client";

import { motion } from "motion/react";
import { useEffect } from "react";
import { Ticket, TrendingUp, Trophy, Calendar, ExternalLink, Clock, Wallet, AlertCircle, Coins } from "lucide-react";
import { useWallet } from '../hooks/useWallet';
import { 
  useLotteryInfo, 
  usePlayerHistoricalTickets,
  usePlayerWinnings,
  useWithdraw,
  useRoundInfo
} from '../hooks/useLotteryData';

interface DashboardPageProps {
  onViewTicket: (ticketId: number) => void;
  onBuyTickets: () => void;
}

const TICKET_TYPE_NAMES = ['', 'Pile', 'Face'];
const TICKET_COLORS = {
  1: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400', icon: 'text-green-400', emoji: '🎯' },
  2: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', icon: 'text-red-400', emoji: '🎲' },
};

// Map quantity to tier name
const QUANTITY_TO_TIER: { [key: number]: string } = {
  1: 'Bronze',
  2: 'Silver',
  5: 'Gold',
  10: 'Diamond',
  15: 'Platinum',
  20: 'Legend',
};

// Map tier to colors (like in buy-page)
const TIER_COLORS: { [key: string]: { bg: string; border: string; text: string; bgClass: string } } = {
  Bronze: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', bgClass: 'bg-amber-500' },
  Silver: { bg: 'bg-slate-500/20', border: 'border-slate-500/30', text: 'text-slate-300', bgClass: 'bg-slate-500' },
  Gold: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', bgClass: 'bg-yellow-500' },
  Diamond: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400', bgClass: 'bg-cyan-500' },
  Platinum: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400', bgClass: 'bg-purple-500' },
  Legend: { bg: 'bg-pink-500/20', border: 'border-pink-500/30', text: 'text-pink-400', bgClass: 'bg-pink-500' },
};

// Helper function to get color classes based on ticketType (Pile=1, Face=2)
function getTicketColorClasses(ticketType: number) {
  return TICKET_COLORS[ticketType as keyof typeof TICKET_COLORS] || TICKET_COLORS[1];
}

// Convert quantity to tier name - use minimum tier threshold
function quantityToTier(quantity: number): string {
  // Find the tier based on minimum threshold reached
  if (quantity >= 20) return 'Legend';
  if (quantity >= 15) return 'Platinum';
  if (quantity >= 10) return 'Diamond';
  if (quantity >= 5) return 'Gold';
  if (quantity >= 2) return 'Silver';
  return 'Bronze';
}

// Get tier color based on quantity
function getTierColorClasses(quantity: number) {
  const tierName = quantityToTier(quantity);
  return TIER_COLORS[tierName] || TIER_COLORS['Bronze'];
}

// Past Ticket Card Component
interface PastTicketCardProps {
  ticket: any;
  index: number;
  onViewTicket: (ticketId: number) => void;
}

function PastTicketCard({ ticket, index, onViewTicket }: PastTicketCardProps) {
  const roundInfo = useRoundInfo(ticket.roundId);
  
  // Determine if ticket won
  const ticketWon = roundInfo.isFinalized && roundInfo.winningTicketType === ticket.ticketType;
  const tierColor = getTierColorClasses(ticket.quantity);
  const tierEmoji = 
    quantityToTier(ticket.quantity) === 'Bronze' ? '🥉' : 
    quantityToTier(ticket.quantity) === 'Silver' ? '🥈' :
    quantityToTier(ticket.quantity) === 'Gold' ? '🥇' :
    quantityToTier(ticket.quantity) === 'Diamond' ? '💎' :
    quantityToTier(ticket.quantity) === 'Platinum' ? '👑' : '✨';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
      className="group relative"
    >
      <div className={`relative p-8 rounded-3xl overflow-hidden border transition-all ${
        ticketWon ? 'border-green-500/40' : 'border-red-500/40'
      }`}
           style={{
             background: ticketWon 
               ? `linear-gradient(135deg, rgb(34 197 94 / 0.25) 0%, rgb(34 197 94 / 0.1) 100%)`
               : `linear-gradient(135deg, rgb(239 68 68 / 0.25) 0%, rgb(239 68 68 / 0.1) 100%)`,
           }}>
        
        {/* Subtle background effect */}
        <div className={`absolute -bottom-40 -right-40 w-80 h-80 ${tierColor.bgClass} opacity-5 rounded-full blur-[100px]`} />
        
        {/* Result badge */}
        <div className="absolute top-6 right-6 z-10">
          {roundInfo.isFinalized ? (
            ticketWon ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-full backdrop-blur-sm">
                <span className="text-lg">🏆</span>
                <span className="text-xs text-green-300 font-bold tracking-wide uppercase">Won!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full backdrop-blur-sm">
                <span className="text-lg">❌</span>
                <span className="text-xs text-red-300 font-bold tracking-wide uppercase">Lost</span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/80 border border-zinc-700 rounded-full backdrop-blur-sm">
              <span className="text-xs text-zinc-400 font-bold tracking-wide uppercase">
                Pending
              </span>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="relative z-5">
          {/* Header with tier badge */}
          <div className="flex items-start gap-4 mb-6">
            <div className={`w-16 h-16 rounded-2xl ${tierColor.bg} border-2 ${tierColor.border} flex items-center justify-center flex-shrink-0`}>
              <span className="text-4xl">{tierEmoji}</span>
            </div>
            <div className="flex-1 pt-1">
              <div className="text-xs text-zinc-500 font-semibold tracking-widest uppercase mb-1">Round #{ticket.roundId}</div>
              <h3 className={`text-2xl font-black tracking-tight ${ticketWon ? 'text-green-400' : tierColor.text}`}>
                {TICKET_TYPE_NAMES[ticket.ticketType]}
              </h3>
              <div className={`text-sm font-bold ${ticketWon ? 'text-green-400/75' : tierColor.text + ' opacity-75'} mt-1`}>
                {quantityToTier(ticket.quantity)} Tier
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className={`grid grid-cols-3 gap-4 mb-6 p-4 rounded-2xl backdrop-blur-sm border ${
            ticketWon ? 'bg-green-500/10 border-green-500/20' : 'bg-black/30 border-white/5'
          }`}>
            <div>
              <div className="text-xs text-zinc-500 font-semibold mb-2 uppercase tracking-wider">Tier</div>
              <div className={`text-lg font-black ${tierColor.text}`}>
                {quantityToTier(ticket.quantity)}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 font-semibold mb-2 uppercase tracking-wider">Amount</div>
              <div className={`text-lg font-black ${tierColor.text}`}>{ticket.amount}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 font-semibold mb-2 uppercase tracking-wider">Result</div>
              <div className={`text-lg font-black ${ticketWon ? 'text-green-400' : 'text-red-400'}`}>
                {roundInfo.isFinalized ? (ticketWon ? '✓' : '✗') : '-'}
              </div>
            </div>
          </div>

          {/* Action button */}
          <motion.button
            onClick={() => onViewTicket(ticket.roundId)}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r ${tierColor.bg} border ${ticketWon ? 'border-green-500/50' : tierColor.border} rounded-xl font-bold transition-all hover:scale-105 active:scale-95`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Details</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export function DashboardPage({ onViewTicket, onBuyTickets }: DashboardPageProps) {
  const { account, isConnecting } = useWallet();
  const address = account ? (account as `0x${string}`) : undefined;
  const isConnected = !!account;
  
  // Récupérer les infos de la loterie
  const { currentRoundId, isLoading: lotteryLoading } = useLotteryInfo();
  
  // Récupérer tous les tickets du joueur (courant + historiques)
  const { tickets: allPlayerTickets, isLoading: ticketsLoading, refetch: refetchTickets } = usePlayerHistoricalTickets(address, currentRoundId);
  
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

  // Filtrer les tickets actifs et passés
  const activeTickets = allPlayerTickets.filter((t: any) => t.roundId === currentRoundId);
  const pastTickets = allPlayerTickets.filter((t: any) => t.roundId < currentRoundId);
  const totalTickets = allPlayerTickets.length;
  const totalSpent = allPlayerTickets.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
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
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-black font-bold rounded-full hover:from-green-400 hover:to-cyan-400 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
                {withdrawLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin inline-block mr-2" />
                    Withdrawing...
                  </>
                ) : 'Withdraw Now'}
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
              const isWinningsStat = stat.label === "Pending Winnings";
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`p-6 rounded-2xl transition-all ${
                    isWinningsStat && pendingWinningsNum > 0
                      ? 'bg-gradient-to-br from-green-500/20 to-cyan-500/20 border border-green-500/30 cursor-pointer hover:border-green-500/50'
                      : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
                  }`}
                  onClick={isWinningsStat && pendingWinningsNum > 0 ? handleWithdraw : undefined}
                >
                  <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-4`}>
                    <stat.icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <div className="text-sm text-zinc-500 mb-1">{stat.label}</div>
                  <div className={`text-2xl font-black ${isWinningsStat && pendingWinningsNum > 0 ? 'text-green-400' : ''}`}>
                    {isLoading ? '...' : stat.value}
                  </div>
                  {isWinningsStat && pendingWinningsNum > 0 && (
                    <div className="mt-3 text-xs text-green-400/75 font-semibold">
                      Click to withdraw
                    </div>
                  )}
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
              {activeTickets.map((ticket: any, index: number) => {
                const tierColor = getTierColorClasses(ticket.quantity);
                const tierEmoji = 
                  quantityToTier(ticket.quantity) === 'Bronze' ? '🥉' : 
                  quantityToTier(ticket.quantity) === 'Silver' ? '🥈' :
                  quantityToTier(ticket.quantity) === 'Gold' ? '🥇' :
                  quantityToTier(ticket.quantity) === 'Diamond' ? '💎' :
                  quantityToTier(ticket.quantity) === 'Platinum' ? '👑' : '✨';
                
                return (
                  <motion.div
                    key={`${ticket.roundId}-${ticket.ticketType}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="group relative"
                  >
                    <div className={`relative p-8 rounded-3xl overflow-hidden border transition-all hover:border-opacity-100 ${tierColor.border}`}
                         style={{
                           background: `linear-gradient(135deg, ${tierColor.bgClass}25 0%, ${tierColor.bgClass}10 100%)`,
                           borderColor: `${tierColor.bgClass}40`,
                         }}>
                      
                      {/* Animated background blur */}
                      <div className={`absolute -top-40 -right-40 w-80 h-80 ${tierColor.bgClass} opacity-10 rounded-full blur-[100px] animate-pulse`} />
                      
                      {/* Active indicator badge */}
                      <div className="absolute top-6 right-6 z-10">
                        <motion.div 
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500/15 border border-green-500/30 rounded-full backdrop-blur-sm"
                        >
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-xs text-green-300 font-bold tracking-wide uppercase">
                            Live
                          </span>
                        </motion.div>
                      </div>

                      {/* Main content */}
                      <div className="relative z-5">
                        {/* Header with tier badge */}
                        <div className="flex items-start gap-4 mb-6">
                          <motion.div 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className={`w-16 h-16 rounded-2xl ${tierColor.bg} border-2 ${tierColor.border} flex items-center justify-center flex-shrink-0`}
                          >
                            <span className="text-4xl">{tierEmoji}</span>
                          </motion.div>
                          <div className="flex-1 pt-1">
                            <div className="text-xs text-zinc-500 font-semibold tracking-widest uppercase mb-1">Round #{ticket.roundId}</div>
                            <h3 className={`text-2xl font-black tracking-tight ${tierColor.text}`}>
                              {TICKET_TYPE_NAMES[ticket.ticketType]}
                            </h3>
                            <div className={`text-sm font-bold ${tierColor.text} opacity-75 mt-1`}>
                              {quantityToTier(ticket.quantity)} Tier
                            </div>
                          </div>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-black/30 rounded-2xl backdrop-blur-sm border border-white/5">
                          <div>
                            <div className="text-xs text-zinc-500 font-semibold mb-2 uppercase tracking-wider">Tier</div>
                            <div className={`text-lg font-black ${tierColor.text}`}>
                              {quantityToTier(ticket.quantity)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-zinc-500 font-semibold mb-2 uppercase tracking-wider">Amount</div>
                            <div className={`text-lg font-black ${tierColor.text}`}>{ticket.amount}</div>
                          </div>
                          <div>
                            <div className="text-xs text-zinc-500 font-semibold mb-2 uppercase tracking-wider">Status</div>
                            <div className="text-lg font-black text-green-400">Pending</div>
                          </div>
                        </div>

                        {/* Action button */}
                        <motion.button
                          onClick={() => onViewTicket(ticket.roundId)}
                          className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r ${tierColor.bg} border ${tierColor.border} rounded-xl font-bold transition-all hover:scale-105 active:scale-95`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>View Details</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Past Tickets */}
          {pastTickets.length > 0 && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mb-8 mt-16"
              >
                <h2 className="text-3xl font-black tracking-tighter mb-2">Previous Rounds</h2>
                <p className="text-zinc-400">Your completed round entries</p>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-6">
                {pastTickets.map((ticket: any, index: number) => (
                  <PastTicketCard 
                    key={`${ticket.roundId}-${ticket.ticketType}`} 
                    ticket={ticket} 
                    index={index}
                    onViewTicket={onViewTicket}
                  />
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
