import { useEffect, useState } from 'react';
import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { formatUnits, parseUnits, type Abi } from 'viem';
import { LOTTERY_ADDRESS, PAYMENT_TOKEN_ADDRESS } from '../config/contracts';
import LotteryABI from '../abi/Lottery.json';
import ERC20ABI from '../abi/ERC20.json';

// Cast ABIs pour éviter les erreurs de typage
const lotteryAbi = LotteryABI as Abi;
const erc20Abi = ERC20ABI as Abi;

/**
 * Hook pour récupérer les infos de base de la Lottery
 */
export function useLotteryInfo() {
  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      {
        address: LOTTERY_ADDRESS as `0x${string}`,
        abi: LotteryABI,
        functionName: 'currentRoundId',
      },
      {
        address: LOTTERY_ADDRESS as `0x${string}`,
        abi: LotteryABI,
        functionName: 'ticketPrice',
      },
      {
        address: LOTTERY_ADDRESS as `0x${string}`,
        abi: LotteryABI,
        functionName: 'roundDuration',
      },
      {
        address: LOTTERY_ADDRESS as `0x${string}`,
        abi: LotteryABI,
        functionName: 'numberOfTickets',
      },
      {
        address: LOTTERY_ADDRESS as `0x${string}`,
        abi: LotteryABI,
        functionName: 'treasuryFeePercent',
      },
      {
        address: LOTTERY_ADDRESS as `0x${string}`,
        abi: LotteryABI,
        functionName: 'currentNumberOfTicketTypes',
      },
      {
        address: LOTTERY_ADDRESS as `0x${string}`,
        abi: LotteryABI,
        functionName: 'paused',
      },
    ],
    query: {
      // Only fetch when the page mounts; no polling or focus refetch
      refetchOnWindowFocus: false,
      refetchInterval: false,
      staleTime: Infinity,
    },
  });

  return {
    currentRoundId: data?.[0]?.result ? Number(data[0].result) : 0,
    ticketPrice: data?.[1]?.result ? formatUnits(data[1].result as bigint, 18) : '0',
    ticketPriceRaw: data?.[1]?.result as bigint | undefined,
    roundDuration: data?.[2]?.result ? Number(data[2].result) : 0,
    numberOfTickets: data?.[3]?.result ? Number(data[3].result) : 0,
    treasuryFeePercent: data?.[4]?.result ? Number(data[4].result) : 0,
    currentNumberOfTicketTypes: data?.[5]?.result ? Number(data[5].result) : 0,
    isPaused: data?.[6]?.result as boolean | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook pour récupérer les infos d'un round spécifique
 */
export function useRoundInfo(roundId: number) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: LOTTERY_ADDRESS as `0x${string}`,
    abi: LotteryABI,
    functionName: 'getRoundInfo',
    args: [BigInt(roundId)],
  });

  // Le retour de getRoundInfo() est un tuple
  const roundData = data as [bigint, bigint, boolean, boolean, bigint, bigint, bigint[], bigint[]] | undefined;
  const poolAmounts = roundData?.[6] ?? [];
  const totalPool = poolAmounts.reduce((acc, amount) => acc + (amount ?? 0n), 0n);

  return {
    startTime: roundData?.[0] ? Number(roundData[0]) : 0,
    endTime: roundData?.[1] ? Number(roundData[1]) : 0,
    isActive: roundData?.[2] ?? false,
    isFinalized: roundData?.[3] ?? false,
    winningTicketType: roundData?.[4] ? Number(roundData[4]) : 0,
    totalTickets: roundData?.[5] ? Number(roundData[5]) : 0,
    numberOfTickets: roundData?.[5] ? Number(roundData[5]) : 0,
    totalPool: formatUnits(totalPool, 18),
    totalPrize: formatUnits(totalPool, 18),
    poolAmounts,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook pour récupérer le pool d'un camp pour un round
 */
export function useTicketPool(roundId: number, ticketType: number) {
  const { data, isLoading, error } = useReadContract({
    address: LOTTERY_ADDRESS as `0x${string}`,
    abi: LotteryABI,
    functionName: 'ticketPools',
    args: [BigInt(roundId), ticketType],
  });

  return {
    poolAmount: data ? formatUnits(data as bigint, 18) : '0',
    poolAmountRaw: data as bigint | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook pour récupérer les gains d'un joueur
 */
export function usePlayerWinnings(playerAddress: string | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: LOTTERY_ADDRESS as `0x${string}`,
    abi: LotteryABI,
    functionName: 'pendingWithdrawals',
    args: playerAddress ? [playerAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!playerAddress,
    },
  });

  return {
    pendingWinnings: data ? formatUnits(data as bigint, 18) : '0',
    pendingWinningsRaw: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook pour récupérer le ticket d'un joueur dans un round
 */
export function usePlayerTicket(roundId: number, playerAddress: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: LOTTERY_ADDRESS as `0x${string}`,
    abi: LotteryABI,
    functionName: 'playerTickets',
    args: playerAddress ? [BigInt(roundId), playerAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!playerAddress,
    },
  });

  // playerTickets retourne (ticketType, amount)
  const ticketData = data as [number, bigint] | undefined;

  return {
    ticketType: ticketData?.[0] ?? 0,
    amount: ticketData?.[1] ? formatUnits(ticketData[1], 18) : '0',
    amountRaw: ticketData?.[1],
    hasTicket: (ticketData?.[1] ?? 0n) > 0n,
    isLoading,
    error,
  };
}

/**
 * Hook pour récupérer le ticket du joueur pour le round courant
 * (Plus rapide que de fetcher tous les rounds)
 */
export function usePlayerAllTickets(playerAddress: string | undefined, currentRoundId: number) {
  // Récupérer le type de ticket du joueur
  const { data: ticketType, isLoading: ticketsLoading, error: ticketsError, refetch: refetchTickets } = useReadContract({
    address: LOTTERY_ADDRESS as `0x${string}`,
    abi: lotteryAbi,
    functionName: 'userTickets',
    args: playerAddress ? [BigInt(currentRoundId), playerAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!playerAddress && currentRoundId > 0,
      staleTime: 1000 * 30, // 30 secondes avant refetch automatique
      gcTime: 1000 * 60 * 5, // Cache pendant 5 minutes
    },
  });

  // Récupérer le montant du pari (= quantité de tickets)
  const { data: betAmount, isLoading: betLoading, error: betError, refetch: refetchBet } = useReadContract({
    address: LOTTERY_ADDRESS as `0x${string}`,
    abi: lotteryAbi,
    functionName: 'userBetAmounts',
    args: playerAddress ? [BigInt(currentRoundId), playerAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!playerAddress && currentRoundId > 0,
      staleTime: Infinity, // Pas de refetch auto
      gcTime: 1000 * 60 * 5, // 5 min avant suppression du cache
    },
  });

  // Récupérer le prix du ticket pour calculer la quantité
  const { data: ticketPriceData, isLoading: priceLoading } = useReadContract({
    address: LOTTERY_ADDRESS as `0x${string}`,
    abi: lotteryAbi,
    functionName: 'ticketPrice',
    query: {
      enabled: !!playerAddress && currentRoundId > 0,
      staleTime: Infinity, // Prix ne change pas, pas besoin de refetch auto
      gcTime: 1000 * 60 * 5, // 5 min avant suppression du cache
    },
  });

  const ticketTypeNum = ticketType as number | undefined;
  const betAmountBigint = betAmount as bigint | undefined;
  const ticketPriceBigint = ticketPriceData as bigint | undefined;

  // Calculer la quantité = montant total / prix unitaire
  let quantity = 1;
  if (betAmountBigint && ticketPriceBigint && ticketPriceBigint > 0n) {
    quantity = Number(betAmountBigint / ticketPriceBigint);
  }

  // Créer un ticket unique avec la quantité
  const tickets = ticketTypeNum && ticketTypeNum > 0 ? [{
    roundId: currentRoundId,
    ticketType: ticketTypeNum,
    quantity: quantity,
    amount: betAmountBigint ? formatUnits(betAmountBigint, 18) : '0',
    amountRaw: betAmountBigint ?? 0n,
    hasTicket: true,
  }] : [];

  const refetchTickets_combined = () => {
    refetchTickets();
    refetchBet();
  };

  return { 
    tickets, 
    isLoading: ticketsLoading || betLoading || priceLoading, 
    error: ticketsError || betError, 
    refetch: refetchTickets_combined 
  };
}

/**
 * Hook pour approuver le token ERC20
 */
export function useApproveToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (amount: bigint) => {
    writeContract({
      address: PAYMENT_TOKEN_ADDRESS as `0x${string}`,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [LOTTERY_ADDRESS, amount],
    });
  };

  return { approve, hash, isPending, isConfirming, isSuccess, error };
}

/**
 * Hook pour acheter un ticket
 */
export function useBuyTicket() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const buyTicket = (ticketType: number, quantity: number = 1) => {
    writeContract({
      address: LOTTERY_ADDRESS as `0x${string}`,
      abi: LotteryABI,
      functionName: 'buyTicket',
      args: [ticketType, quantity],
    });
  };

  return { buyTicket, hash, isPending, isConfirming, isSuccess, error };
}

/**
 * Hook pour retirer les gains
 */
export function useWithdraw() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdraw = () => {
    writeContract({
      address: LOTTERY_ADDRESS as `0x${string}`,
      abi: LotteryABI,
      functionName: 'withdraw',
    });
  };

  return { withdraw, hash, isPending, isConfirming, isSuccess, error };
}

/**
 * Hook pour récupérer l'allowance du token
 */
export function useTokenAllowance(ownerAddress: string | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: PAYMENT_TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: ownerAddress ? [ownerAddress as `0x${string}`, LOTTERY_ADDRESS] : undefined,
    query: {
      enabled: !!ownerAddress,
    },
  });

  return {
    allowance: data as bigint | undefined,
    allowanceFormatted: data ? formatUnits(data as bigint, 18) : '0',
    isLoading,
    refetch,
  };
}

/**
 * Hook pour récupérer le solde du token
 */
export function useTokenBalance(ownerAddress: string | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: PAYMENT_TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20ABI,
    functionName: 'balanceOf',
    args: ownerAddress ? [ownerAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!ownerAddress,
    },
  });

  return {
    balance: data as bigint | undefined,
    balanceFormatted: data ? formatUnits(data as bigint, 18) : '0',
    isLoading,
    refetch,
  };
}

/**
 * Hook pour récupérer les infos des rounds finalisés (pour Winners)
 */
export function useFinalizedRounds(currentRoundId: number, limit: number = 10) {
  const roundIds = Array.from(
    { length: Math.min(currentRoundId, limit) }, 
    (_, i) => currentRoundId - i
  ).filter(id => id > 0);

  const contracts = roundIds.map(roundId => ({
    address: LOTTERY_ADDRESS as `0x${string}`,
    abi: lotteryAbi,
    functionName: 'getRoundInfo',
    args: [BigInt(roundId)],
  }));

  const { data, isLoading, error, refetch } = useReadContracts({ contracts });

  const rounds = data?.map((result, index) => {
    const roundData = result.result as [bigint, bigint, boolean, boolean, bigint, bigint, bigint[], bigint[]] | undefined;
    if (!roundData) return undefined;
    const poolAmounts = roundData[6] ?? [];
    const totalPool = poolAmounts.reduce((acc, amount) => acc + (amount ?? 0n), 0n);
    return {
      roundId: roundIds[index],
      startTime: roundData?.[0] ? Number(roundData[0]) : 0,
      endTime: roundData?.[1] ? Number(roundData[1]) : 0,
      isActive: roundData?.[2] ?? false,
      isFinalized: roundData?.[3] ?? false,
      winningTicketType: roundData?.[4] ? Number(roundData[4]) : 0,
      totalTickets: roundData?.[5] ? Number(roundData[5]) : 0,
      totalPool: formatUnits(totalPool, 18),
      poolAmounts,
      playerCounts: roundData[7] ?? [],
    };
  }).filter(r => r && r.isFinalized) ?? [];

  return { rounds: rounds as typeof rounds, isLoading, error, refetch };
}

/**
 * Hook pour récupérer les gagnants réels on-chain pour les derniers rounds finalisés
 */
export function useWinners(limit: number = 5) {
  const { currentRoundId, treasuryFeePercent } = useLotteryInfo();
  const publicClient = usePublicClient();

  const roundIds = Array.from({ length: Math.min(currentRoundId, limit) }, (_, i) => currentRoundId - i).filter(id => id > 0);

  const { data, isLoading: roundsLoading, error: roundsError } = useReadContracts({
    contracts: roundIds.map((roundId) => ({
      address: LOTTERY_ADDRESS as `0x${string}`,
      abi: lotteryAbi,
      functionName: 'getRoundInfo',
      args: [BigInt(roundId)],
    })),
    query: {
      // Load once when the page opens; no background refresh
      refetchOnWindowFocus: false,
      refetchInterval: false,
      staleTime: Infinity,
    },
  });

  const [winners, setWinners] = useState<Array<{
    roundId: number;
    winningTicketType: number;
    totalPoolFormatted: string;
    prizePoolFormatted: string;
    endTime: number;
    winners: Array<{ address: string; betFormatted: string; payoutFormatted: string }>;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchWinners = async () => {
      if (!publicClient || !data) return;
      setIsLoading(true);
      try {
        const finalized = data
          .map((res, idx) => ({ result: res.result, roundId: roundIds[idx] }))
          .filter((item) => {
            const roundData = item.result as [bigint, bigint, boolean, boolean, bigint, bigint, bigint[], bigint[]] | undefined;
            return roundData ? (roundData[3] ?? false) : false;
          });

        const processed = await Promise.all(finalized.map(async ({ result, roundId }) => {
          const roundData = result as [bigint, bigint, boolean, boolean, bigint, bigint, bigint[], bigint[]];
          const winningTicketType = roundData[4] ? Number(roundData[4]) : 0;
          const endTime = Number(roundData[1] ?? 0n);
          if (winningTicketType === 0) {
            return {
              roundId,
              winningTicketType,
              totalPoolFormatted: '0',
              prizePoolFormatted: '0',
              endTime,
              winners: [],
            };
          }

          const poolAmounts = roundData[6] ?? [];
          const totalPool = poolAmounts.reduce((acc, amount) => acc + (amount ?? 0n), 0n);
          const treasuryFee = (totalPool * BigInt(treasuryFeePercent)) / 10000n;
          const prizePool = totalPool - treasuryFee;
          const winningTotalAmount = poolAmounts[winningTicketType - 1] ?? 0n;

          const players = await publicClient.readContract({
            address: LOTTERY_ADDRESS as `0x${string}`,
            abi: lotteryAbi,
            functionName: 'getPlayersByTicketType',
            args: [BigInt(roundId), BigInt(winningTicketType)],
          }) as string[];

          const playersWithAmounts = await Promise.all(players.map(async (address) => {
            const bet = await publicClient.readContract({
              address: LOTTERY_ADDRESS as `0x${string}`,
              abi: lotteryAbi,
              functionName: 'userBetAmounts',
              args: [BigInt(roundId), address as `0x${string}`],
            }) as bigint;

            const share = winningTotalAmount > 0n ? (bet * prizePool) / winningTotalAmount : 0n;
            const payout = bet + share;

            return {
              address,
              betFormatted: formatUnits(bet, 18),
              payoutFormatted: formatUnits(payout, 18),
            };
          }));

          return {
            roundId,
            winningTicketType,
            totalPoolFormatted: formatUnits(totalPool, 18),
            prizePoolFormatted: formatUnits(prizePool, 18),
            endTime,
            winners: playersWithAmounts,
          };
        }));

        setWinners(processed);
        setError(null);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWinners();
  }, [data, publicClient, roundIds, treasuryFeePercent]);

  return { winners, isLoading: isLoading || roundsLoading, error: error || roundsError };
}
