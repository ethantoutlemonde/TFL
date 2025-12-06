import React from 'react';
import { useLotteryInfo, useRoundInfo, useTicketPool } from '../hooks/useLotteryData';

/**
 * Composant qui affiche les statistiques de la lottery
 */
export function LotteryStats() {
  const { 
    currentRoundId, 
    ticketPrice, 
    roundDuration, 
    numberOfTickets,
    treasuryFeePercent,
    isPaused,
    isLoading 
  } = useLotteryInfo();

  const { 
    startTime, 
    endTime, 
    isFinalized,
    totalPrize 
  } = useRoundInfo(currentRoundId);

  // Récupérer les pools pour chaque camp (exemple avec 2 camps)
  const { poolAmount: pool1 } = useTicketPool(currentRoundId, 1);
  const { poolAmount: pool2 } = useTicketPool(currentRoundId, 2);

  if (isLoading) {
    return <div className="animate-pulse">Chargement...</div>;
  }

  const now = Math.floor(Date.now() / 1000);
  const timeRemaining = endTime - now;
  const isRoundActive = timeRemaining > 0 && !isFinalized;

  return (
    <div className="bg-gray-800 rounded-xl p-6 space-y-4">
      <h2 className="text-2xl font-bold text-white">📊 Statistiques Lottery</h2>
      
      {/* Status */}
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${isPaused ? 'bg-red-500' : 'bg-green-500'}`} />
        <span className="text-gray-300">
          {isPaused ? 'Contrat en pause' : 'Contrat actif'}
        </span>
      </div>

      {/* Info Round */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Round actuel" 
          value={`#${currentRoundId}`} 
        />
        <StatCard 
          label="Prix du ticket" 
          value={`${ticketPrice} USDC`} 
        />
        <StatCard 
          label="Nombre de camps" 
          value={numberOfTickets.toString()} 
        />
        <StatCard 
          label="Frais treasury" 
          value={`${treasuryFeePercent}%`} 
        />
      </div>

      {/* Round actuel */}
      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-lg font-semibold text-white mb-3">
          🎯 Round #{currentRoundId}
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard 
            label="Statut" 
            value={isFinalized ? '✅ Finalisé' : isRoundActive ? '🔥 En cours' : '⏳ Terminé'} 
          />
          <StatCard 
            label="Temps restant" 
            value={isRoundActive ? formatTime(timeRemaining) : 'Terminé'} 
          />
          <StatCard 
            label="Prize Pool" 
            value={`${totalPrize} USDC`} 
          />
        </div>

        {/* Pools par camp */}
        <div className="mt-4">
          <h4 className="text-sm text-gray-400 mb-2">Répartition des mises</h4>
          <div className="flex gap-4">
            <PoolBar label="Camp 1" amount={pool1} color="bg-blue-500" />
            <PoolBar label="Camp 2" amount={pool2} color="bg-red-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Composants utilitaires
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-700/50 rounded-lg p-3">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}

function PoolBar({ label, amount, color }: { label: string; amount: string; color: string }) {
  return (
    <div className="flex-1">
      <div className="flex justify-between text-sm text-gray-300 mb-1">
        <span>{label}</span>
        <span>{amount} USDC</span>
      </div>
      <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(100, parseFloat(amount) * 10)}%` }}
        />
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

export default LotteryStats;
