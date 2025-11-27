"use client";

import { motion } from "motion/react";
import { ArrowLeft, ExternalLink, Calendar, Clock, CheckCircle, Ticket, Copy, Check } from "lucide-react";
import { useState } from "react";

const ticketData = [
  {
    id: 1,
    drawNumber: 48,
    ticketNumber: "TKT-0x742d...a9f3",
    fullTicketId: "TKT-0x742d35Cc6634C0532925a3b844Bc9e7595f38a9f3",
    purchaseDate: "Oct 1, 2025 12:34 PM",
    status: "active",
    amount: 0.01,
    drawDate: "Oct 15, 2025 00:00 AM",
    txHash: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z",
    blockNumber: 18234567,
    fromAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f38a9f3",
    contractAddress: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
  },
  {
    id: 2,
    drawNumber: 48,
    ticketNumber: "TKT-0x8f1c...b2e7",
    fullTicketId: "TKT-0x8f1c29Dd4512A9532821b6c833Fc9d7584f21b2e7",
    purchaseDate: "Oct 1, 2025 03:22 PM",
    status: "active",
    amount: 0.01,
    drawDate: "Oct 15, 2025 00:00 AM",
    txHash: "0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a",
    blockNumber: 18234589,
    fromAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f38a9f3",
    contractAddress: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
  },
  {
    id: 3,
    drawNumber: 47,
    ticketNumber: "TKT-0x3a9e...c4d1",
    fullTicketId: "TKT-0x3a9e47Bb2839E9123745a1d922Ae8c6391d03c4d1",
    purchaseDate: "Sep 10, 2025 08:15 AM",
    status: "completed",
    amount: 0.01,
    drawDate: "Sep 15, 2025 00:00 AM",
    result: "lost",
    txHash: "0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b",
    blockNumber: 18134567,
    fromAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f38a9f3",
    contractAddress: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
    winnerAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f38a9f3",
  },
  {
    id: 4,
    drawNumber: 46,
    ticketNumber: "TKT-0x6d2f...e8a5",
    fullTicketId: "TKT-0x6d2f83Ee9421F8534612c4e731Bf7d4982a14e8a5",
    purchaseDate: "Aug 28, 2025 06:45 PM",
    status: "completed",
    amount: 0.01,
    drawDate: "Sep 1, 2025 00:00 AM",
    result: "lost",
    txHash: "0x4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c",
    blockNumber: 18034567,
    fromAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f38a9f3",
    contractAddress: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
    winnerAddress: "0x8f1c29Dd4512A9532821b6c833Fc9d7584f21b2e7",
  },
];

interface TicketDetailPageProps {
  ticketId: number | null;
  onBack: () => void;
}

export function TicketDetailPage({ ticketId, onBack }: TicketDetailPageProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const ticket = ticketData.find(t => t.id === ticketId);

  if (!ticket) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Ticket not found</p>
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
              {ticket.ticketNumber}
            </h1>

            {/* Status badge */}
            {ticket.status === 'active' ? (
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
                      <code className="text-sm font-mono text-zinc-300 break-all">{ticket.fullTicketId}</code>
                      <button
                        onClick={() => copyToClipboard(ticket.fullTicketId, 'ticketId')}
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
                        <div className="text-lg font-semibold">#{ticket.drawNumber}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Amount Paid</div>
                      <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                        <div className="text-lg font-semibold">{ticket.amount} ETH</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Purchase Date</div>
                      <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                        <div className="text-sm font-semibold">{ticket.purchaseDate}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Draw Date</div>
                      <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl flex items-center gap-2">
                        <Clock className="w-4 h-4 text-zinc-400" />
                        <div className="text-sm font-semibold">{ticket.drawDate}</div>
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
                  <div>
                    <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Transaction Hash</div>
                    <div className="flex items-center justify-between p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                      <code className="text-xs font-mono text-zinc-300 break-all">{ticket.txHash}</code>
                      <button
                        onClick={() => copyToClipboard(ticket.txHash, 'txHash')}
                        className="ml-4 flex-shrink-0"
                      >
                        {copiedField === 'txHash' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-zinc-400 hover:text-white transition-colors" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">From Address</div>
                    <div className="flex items-center justify-between p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                      <code className="text-sm font-mono text-zinc-300 break-all">{ticket.fromAddress}</code>
                      <button
                        onClick={() => copyToClipboard(ticket.fromAddress, 'fromAddress')}
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
                      <code className="text-sm font-mono text-zinc-300 break-all">{ticket.contractAddress}</code>
                      <button
                        onClick={() => copyToClipboard(ticket.contractAddress, 'contractAddress')}
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

                  <div>
                    <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Block Number</div>
                    <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                      <div className="text-lg font-semibold">{ticket.blockNumber.toLocaleString()}</div>
                    </div>
                  </div>

                  <motion.a
                    href="#"
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
              {ticket.status === 'completed' && (
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
                        <div className="text-lg font-semibold text-zinc-400">Not Won</div>
                      </div>
                    </div>

                    {ticket.winnerAddress && (
                      <div>
                        <div className="text-sm text-zinc-500 mb-2 tracking-wider uppercase">Winner Address</div>
                        <div className="flex items-center justify-between p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                          <code className="text-sm font-mono text-zinc-300 break-all">{ticket.winnerAddress}</code>
                          <button
                            onClick={() => copyToClipboard(ticket.winnerAddress!, 'winnerAddress')}
                            className="ml-4 flex-shrink-0"
                          >
                            {copiedField === 'winnerAddress' ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-zinc-400 hover:text-white transition-colors" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
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
                {ticket.status === 'active' ? (
                  <p className="text-sm text-zinc-400 mb-6">
                    Your ticket is active and entered in the upcoming draw. Winner will be selected on {ticket.drawDate}.
                  </p>
                ) : (
                  <p className="text-sm text-zinc-400 mb-6">
                    This draw has been completed. The winner was announced on {ticket.drawDate}.
                  </p>
                )}
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                  <div className="text-xs text-zinc-500 mb-1">Your Entry</div>
                  <div className="text-lg font-black">Confirmed</div>
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
