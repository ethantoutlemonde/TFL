"use client";

import { motion } from "motion/react";
import { ArrowLeft, ExternalLink, Calendar, Clock, CheckCircle, Ticket, Copy, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useRoundInfo, usePlayerAllTickets } from "../hooks/useLotteryData";
import { LOTTERY_ADDRESS, ACTIVE_CONFIG } from "../config/contracts";

interface TicketDetailPageProps {
  ticketId: number | null;
  onBack: () => void;
}

export function TicketDetailPage({ ticketId, onBack }: TicketDetailPageProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { account } = useWallet();
  const address = account ? (account as `0x${string}`) : undefined;
  const roundId = ticketId ?? 0;

  const { startTime, endTime, isActive, isFinalized, winningTicketType, totalTickets, isLoading: roundLoading } = useRoundInfo(roundId);
  const { tickets, isLoading: ticketsLoading } = usePlayerAllTickets(address, roundId);

  // Since dashboard passes roundId, we fetch player's ticket for that round
  const playerTicket = useMemo(() => (tickets && tickets.length > 0 ? tickets[0] : undefined), [tickets]);

  if (!playerTicket && !roundLoading && !ticketsLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">No ticket found for this round</p>
          <button
            onClick={onBack}
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Go back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Header */}
      <section className="relative py-12 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[128px]" />

        <div className="relative z-10 container mx-auto max-w-5xl">
          <motion.button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: -5 }}
          >
            <ArrowLeft className="w-5 h-5" />
            Back to My Tickets
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-2 mb-6 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
              <span className="text-sm text-zinc-400">Ticket Details</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
              {playerTicket ? `Round #${playerTicket.roundId} — ${playerTicket.ticketType === 1 ? 'Pile' : 'Face'}` : `Round #${roundId}`}
            </h1>

            {/* Status badge */}
            {isActive && !isFinalized ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-green-400 font-semibold tracking-wider uppercase">
                  Active - Pending Draw
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-full">
                <CheckCircle className="w-4 h-4 text-zinc-400" />
                <span className="text-sm text-zinc-400 font-semibold tracking-wider uppercase">
                  Completed
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative py-12 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Purchase Info Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl"
              >
                <h2 className="text-2xl font-black mb-6">Purchase Information</h2>
                
                <div className="space-y-6">
                  <div>
                    <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Full Ticket ID</div>
                    <div className="flex items-center justify-between p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                      <code className="text-sm font-mono text-zinc-300 break-all">{playerTicket ? `${playerTicket.roundId}-${playerTicket.ticketType}-${playerTicket.quantity}` : `${roundId}`}</code>
                      <button
                        onClick={() => copyToClipboard(playerTicket ? `${playerTicket.roundId}-${playerTicket.ticketType}-${playerTicket.quantity}` : `${roundId}`, 'ticketId')}
                        className="ml-4 flex-shrink-0"
                      >
                        {copiedField === 'ticketId' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-zinc-400 hover:text-white transition-colors" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Draw Number</div>
                      <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                        <div className="text-lg font-semibold">#{roundId}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Amount Paid</div>
                      <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                        <div className="text-lg font-semibold">{playerTicket ? `${playerTicket.amount} ${ACTIVE_CONFIG.PAYMENT_TOKEN_SYMBOL}` : '-'}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Purchase Date</div>
                      <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                        <div className="text-sm font-semibold">{startTime ? new Date(startTime * 1000).toLocaleString() : '-'}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Draw Date</div>
                      <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl flex items-center gap-2">
                        <Clock className="w-4 h-4 text-zinc-400" />
                        <div className="text-sm font-semibold">{endTime ? new Date(endTime * 1000).toLocaleString() : '-'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Blockchain Info Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl"
              >
                <h2 className="text-2xl font-black mb-6">Blockchain Information</h2>
                
                <div className="space-y-6">
                  {/* <div>
                    <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Transaction Hash</div>
                    <div className="flex items-center justify-between p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                      <code className="text-xs font-mono text-zinc-300 break-all">-</code>
                      <button
                        onClick={() => copyToClipboard('-', 'txHash')}
                        className="ml-4 flex-shrink-0"
                      >
                        {copiedField === 'txHash' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-zinc-400 hover:text-white transition-colors" />
                        )}
                      </button>
                    </div>
                  </div> */}

                  <div>
                    <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">From Address</div>
                    <div className="flex items-center justify-between p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                      <code className="text-sm font-mono text-zinc-300 break-all">{address ?? '-'}</code>
                      <button
                        onClick={() => copyToClipboard(address ?? '-', 'fromAddress')}
                        className="ml-4 flex-shrink-0"
                      >
                        {copiedField === 'fromAddress' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-zinc-400 hover:text-white transition-colors" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Contract Address</div>
                    <div className="flex items-center justify-between p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                      <code className="text-sm font-mono text-zinc-300 break-all">{LOTTERY_ADDRESS}</code>
                      <button
                        onClick={() => copyToClipboard(LOTTERY_ADDRESS, 'contractAddress')}
                        className="ml-4 flex-shrink-0"
                      >
                        {copiedField === 'contractAddress' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-zinc-400 hover:text-white transition-colors" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* <div>
                    <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Block Number</div>
                    <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                      <div className="text-lg font-semibold">-</div>
                    </div>
                  </div> */}

                  <motion.a
                    href={`${ACTIVE_CONFIG.EXPLORER_URL}/address/${LOTTERY_ADDRESS}`}
                    className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="font-semibold">View on Etherscan</span>
                    <ExternalLink className="w-5 h-5" />
                  </motion.a>
                </div>
              </motion.div>

              {/* Result Card (if completed) */}
              {isFinalized && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl"
                >
                  <h2 className="text-2xl font-black mb-6">Draw Result</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Status</div>
                      <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                        <div className="text-lg font-semibold text-zinc-400">{playerTicket && winningTicketType === playerTicket.ticketType ? 'Won' : 'Not Won'}</div>
                      </div>
                    </div>

                    {/* {winningTicketType > 0 && (
                      <div>
                        <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Winner Address</div>
                        <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                          <div className="text-lg font-semibold">{winningTicketType === 1 ? 'Pile' : 'Face'}</div>
                        </div>
                      </div>
                    )} */}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Column - Quick Actions */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="p-6 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-cyan-500/10 border border-zinc-800 rounded-3xl"
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <Ticket className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-black mb-4">Ticket Status</h3>
                {isActive && !isFinalized ? (
                  <p className="text-sm text-zinc-400 mb-6">
                    Your ticket is active and entered in the upcoming draw. Winner will be selected on {endTime ? new Date(endTime * 1000).toLocaleString() : '-'}.
                  </p>
                ) : (
                  <p className="text-sm text-zinc-400 mb-6">
                    This draw has been completed. The winner was announced on {endTime ? new Date(endTime * 1000).toLocaleString() : '-'}.
                  </p>
                )}
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                  <div className="text-xs text-zinc-500 mb-1">Your Entry</div>
                  <div className="text-lg font-black">{playerTicket ? 'Confirmed' : 'No Entry'}</div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl"
              >
                <h3 className="text-lg font-black mb-4">Verification</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-zinc-300">On-chain verified</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-zinc-300">Chainlink VRF enabled</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-zinc-300">Smart contract executed</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
