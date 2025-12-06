"use client";

import { motion } from "motion/react";
import { 
  RefreshCw, 
  Clock, 
  Coins, 
  Users, 
  Trophy,
  Activity,
  CheckCircle,
  XCircle,
  Wallet,
  Info
} from "lucide-react";
import { useLotteryInfo, useRoundInfo, useTicketPool } from "../hooks/useLotteryData";
import { useWallet } from "../hooks/useWallet";
import { LOTTERY_ADDRESS, PAYMENT_TOKEN_ADDRESS } from "../config/contracts";

export function ContractInfoPage() {
  const { account } = useWallet();
  const address = account ? (account as `0x${string}`) : undefined;
  const isConnected = !!account;
  
  const { 
    currentRoundId, 
    ticketPrice,
    ticketPriceRaw,
    roundDuration, 
    numberOfTickets,
    treasuryFeePercent,
    isPaused,
    isLoading,
    error,
    refetch 
  } = useLotteryInfo();

  const { 
    startTime, 
    endTime, 
    isFinalized,
    winningTicketType,
    totalPrize 
  } = useRoundInfo(currentRoundId);

  // Pools pour chaque camp (on supporte jusqu'à 6 camps)
  const pool1 = useTicketPool(currentRoundId, 1);
  const pool2 = useTicketPool(currentRoundId, 2);
  const pool3 = useTicketPool(currentRoundId, 3);
  const pool4 = useTicketPool(currentRoundId, 4);
  const pool5 = useTicketPool(currentRoundId, 5);
  const pool6 = useTicketPool(currentRoundId, 6);

  const pools = [pool1, pool2, pool3, pool4, pool5, pool6].slice(0, numberOfTickets || 2);

  const now = Math.floor(Date.now() / 1000);
  const timeRemaining = endTime - now;
  const isRoundActive = timeRemaining > 0 && !isFinalized;

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "Terminé";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDate = (timestamp: number): string => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleString("fr-FR");
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black mb-2">📊 Contract Info</h1>
              <p className="text-zinc-400">
                Données en temps réel depuis le smart contract
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Rafraîchir
            </motion.button>
          </div>
        </motion.div>

        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50"
        >
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-zinc-400" />
            <span className="text-zinc-400">Wallet:</span>
            {isConnected ? (
              <span className="text-green-400 font-mono">{address}</span>
            ) : (
              <span className="text-yellow-400">Non connecté - Connectez votre wallet pour interagir</span>
            )}
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 rounded-xl border border-red-800 bg-red-900/20 text-red-400"
          >
            <p>Erreur: {error.message}</p>
          </motion.div>
        )}

        {/* Contract Addresses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Adresses des contrats
          </h2>
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <span className="text-zinc-400 w-40">Lottery:</span>
              <a 
                href={`https://sepolia.etherscan.io/address/${LOTTERY_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-blue-400 hover:text-blue-300 break-all"
              >
                {LOTTERY_ADDRESS}
              </a>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <span className="text-zinc-400 w-40">Payment Token:</span>
              <a 
                href={`https://sepolia.etherscan.io/address/${PAYMENT_TOKEN_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-blue-400 hover:text-blue-300 break-all"
              >
                {PAYMENT_TOKEN_ADDRESS}
              </a>
            </div>
          </div>
        </motion.div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Trophy className="w-6 h-6 text-yellow-400" />}
            label="Round actuel"
            value={`#${currentRoundId}`}
            delay={0.2}
          />
          <StatCard
            icon={<Coins className="w-6 h-6 text-green-400" />}
            label="Prix du ticket"
            value={`${ticketPrice} USDC`}
            delay={0.25}
          />
          <StatCard
            icon={<Users className="w-6 h-6 text-blue-400" />}
            label="Nombre de camps"
            value={numberOfTickets?.toString() || "0"}
            delay={0.3}
          />
          <StatCard
            icon={<Activity className="w-6 h-6 text-purple-400" />}
            label="Frais treasury"
            value={`${treasuryFeePercent}%`}
            delay={0.35}
          />
        </div>

        {/* Contract Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50"
        >
          <h2 className="text-xl font-bold mb-4">État du contrat</h2>
          <div className="flex items-center gap-4">
            {isPaused ? (
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="w-5 h-5" />
                <span>Contrat en pause</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>Contrat actif</span>
              </div>
            )}
            <div className="text-zinc-400">
              | Durée d'un round: {Math.floor((roundDuration || 0) / 60)} minutes
            </div>
          </div>
        </motion.div>

        {/* Current Round Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-8 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Round #{currentRoundId} - Détails
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <span className="text-zinc-400 text-sm">Statut</span>
              <p className="text-lg font-bold">
                {isFinalized ? (
                  <span className="text-green-400">✅ Finalisé</span>
                ) : isRoundActive ? (
                  <span className="text-yellow-400">🔥 En cours</span>
                ) : (
                  <span className="text-orange-400">⏳ En attente de finalisation</span>
                )}
              </p>
            </div>
            <div>
              <span className="text-zinc-400 text-sm">Temps restant</span>
              <p className="text-lg font-bold text-white">
                {isRoundActive ? formatTime(timeRemaining) : "Terminé"}
              </p>
            </div>
            <div>
              <span className="text-zinc-400 text-sm">Prize Pool</span>
              <p className="text-lg font-bold text-green-400">{totalPrize} USDC</p>
            </div>
            <div>
              <span className="text-zinc-400 text-sm">Début</span>
              <p className="text-white">{formatDate(startTime)}</p>
            </div>
            <div>
              <span className="text-zinc-400 text-sm">Fin</span>
              <p className="text-white">{formatDate(endTime)}</p>
            </div>
            {isFinalized && winningTicketType > 0 && (
              <div>
                <span className="text-zinc-400 text-sm">Camp gagnant</span>
                <p className="text-lg font-bold text-yellow-400">🏆 Camp {winningTicketType}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Pools by Camp */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50"
        >
          <h2 className="text-xl font-bold mb-4">💰 Répartition des mises par camp</h2>
          
          <div className="space-y-4">
            {pools.map((pool, index) => {
              const campNumber = index + 1;
              const colors = [
                "bg-blue-500",
                "bg-red-500", 
                "bg-green-500",
                "bg-yellow-500",
                "bg-purple-500",
                "bg-pink-500"
              ];
              const totalPool = pools.reduce((acc, p) => acc + parseFloat(p.poolAmount || "0"), 0);
              const percentage = totalPool > 0 
                ? (parseFloat(pool.poolAmount || "0") / totalPool * 100).toFixed(1) 
                : "0";
              
              return (
                <div key={campNumber} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-300">Camp {campNumber}</span>
                    <span className="text-zinc-400">
                      {pool.poolAmount} USDC ({percentage}%)
                    </span>
                  </div>
                  <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                      className={`h-full ${colors[index]} rounded-full`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          {pools.length === 0 && (
            <p className="text-zinc-500 text-center py-4">
              Aucun camp configuré
            </p>
          )}
        </motion.div>

        {/* Raw Data Debug */}
        <motion.details
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <summary className="cursor-pointer text-zinc-500 hover:text-zinc-300">
            🔧 Données brutes (debug)
          </summary>
          <pre className="mt-4 p-4 bg-zinc-900 rounded-lg text-xs text-zinc-400 overflow-auto">
            {JSON.stringify({
              currentRoundId,
              ticketPrice,
              ticketPriceRaw: ticketPriceRaw?.toString(),
              roundDuration,
              numberOfTickets,
              treasuryFeePercent,
              isPaused,
              round: {
                startTime,
                endTime,
                isFinalized,
                winningTicketType,
                totalPrize
              },
              pools: pools.map((p, i) => ({ camp: i + 1, amount: p.poolAmount }))
            }, null, 2)}
          </pre>
        </motion.details>
      </div>
    </div>
  );
}

// Composant StatCard
function StatCard({ 
  icon, 
  label, 
  value, 
  delay = 0 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50"
    >
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-zinc-400 text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </motion.div>
  );
}

export default ContractInfoPage;
