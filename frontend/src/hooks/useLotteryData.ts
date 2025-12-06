import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
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
        functionName: 'paused',
      },
    ],
    query: {
      staleTime: Infinity, // Données restent fraîches jusqu'au refetch manuel
      gcTime: 1000 * 60 * 5, // 5 minutes avant suppression du cache
    },
  });

  return {
    currentRoundId: data?.[0]?.result ? Number(data[0].result) : 0,
    ticketPrice: data?.[1]?.result ? formatUnits(data[1].result as bigint, 18) : '0',
    ticketPriceRaw: data?.[1]?.result as bigint | undefined,
    roundDuration: data?.[2]?.result ? Number(data[2].result) : 0,
    numberOfTickets: data?.[3]?.result ? Number(data[3].result) : 0,
    treasuryFeePercent: data?.[4]?.result ? Number(data[4].result) : 0,
    isPaused: data?.[5]?.result as boolean | undefined,
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
    functionName: 'rounds',
    args: [BigInt(roundId)],
  });

  // Le retour de rounds() est un tuple
  const roundData = data as [bigint, bigint, bigint, boolean, bigint, bigint, bigint] | undefined;

  return {
    startTime: roundData?.[0] ? Number(roundData[0]) : 0,
    endTime: roundData?.[1] ? Number(roundData[1]) : 0,
    numberOfTickets: roundData?.[2] ? Number(roundData[2]) : 0,
    isFinalized: roundData?.[3] ?? false,
    winningTicketType: roundData?.[4] ? Number(roundData[4]) : 0,
    vrfRequestId: roundData?.[5],
    totalPrize: roundData?.[6] ? formatUnits(roundData[6], 18) : '0',
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
    functionName: 'rounds',
    args: [BigInt(roundId)],
  }));

  const { data, isLoading, error, refetch } = useReadContracts({ contracts });

  const rounds = data?.map((result, index) => {
    const roundData = result.result as [bigint, bigint, bigint, boolean, bigint, bigint, bigint] | undefined;
    return {
      roundId: roundIds[index],
      startTime: roundData?.[0] ? Number(roundData[0]) : 0,
      endTime: roundData?.[1] ? Number(roundData[1]) : 0,
      numberOfTickets: roundData?.[2] ? Number(roundData[2]) : 0,
      isFinalized: roundData?.[3] ?? false,
      winningTicketType: roundData?.[4] ? Number(roundData[4]) : 0,
      totalPrize: roundData?.[6] ? formatUnits(roundData[6], 18) : '0',
    };
  }).filter(r => r.isFinalized) ?? [];

  return { rounds, isLoading, error, refetch };
}

/**
 * Hook pour récupérer les tickets historiques du joueur pour TOUS les rounds
 * Boucle sur les rounds passés et récupère les infos du joueur
 */
export function usePlayerHistoricalTickets(playerAddress: string | undefined, currentRoundId: number) {
  // On va récupérer les infos pour chaque round passé
  // Pour simplifier, on va faire des queries pour les derniers N rounds (ex: 10)
  const maxPastRounds = 10;
  const startRound = Math.max(1, currentRoundId - maxPastRounds);
  
  const roundIds = Array.from({ length: currentRoundId - startRound }, (_, i) => startRound + i);

  // Récupérer les types de tickets pour tous les rounds
  const ticketsData = useReadContracts({
    contracts: roundIds.map(roundId => ({
      address: LOTTERY_ADDRESS as `0x${string}`,
      abi: lotteryAbi,
      functionName: 'userTickets',
      args: playerAddress ? [BigInt(roundId), playerAddress as `0x${string}`] : undefined,
    })),
    query: {
      enabled: !!playerAddress && roundIds.length > 0,
      staleTime: Infinity,
      gcTime: 1000 * 60 * 10, // 10 min cache
    },
  });

  // Récupérer les montants de paris pour tous les rounds
  const betAmountsData = useReadContracts({
    contracts: roundIds.map(roundId => ({
      address: LOTTERY_ADDRESS as `0x${string}`,
      abi: lotteryAbi,
      functionName: 'userBetAmounts',
      args: playerAddress ? [BigInt(roundId), playerAddress as `0x${string}`] : undefined,
    })),
    query: {
      enabled: !!playerAddress && roundIds.length > 0,
      staleTime: Infinity,
      gcTime: 1000 * 60 * 10,
    },
  });

  // Récupérer le prix du ticket une fois
  const { data: ticketPriceData } = useReadContract({
    address: LOTTERY_ADDRESS as `0x${string}`,
    abi: lotteryAbi,
    functionName: 'ticketPrice',
    query: {
      enabled: !!playerAddress,
      staleTime: Infinity,
      gcTime: 1000 * 60 * 10,
    },
  });

  const ticketPriceBigint = ticketPriceData as bigint | undefined;

  // Combiner les données
  const tickets = roundIds
    .map((roundId, index) => {
      const ticketType = ticketsData.data?.[index]?.result as number | undefined;
      const betAmount = betAmountsData.data?.[index]?.result as bigint | undefined;

      if (!ticketType || ticketType === 0 || !betAmount) {
        return null;
      }

      // Calculer la quantité
      let quantity = 1;
      if (ticketPriceBigint && ticketPriceBigint > 0n) {
        quantity = Number(betAmount / ticketPriceBigint);
      }

      return {
        roundId,
        ticketType,
        quantity,
        amount: formatUnits(betAmount, 18),
        amountRaw: betAmount,
        hasTicket: true,
      };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);

  return {
    tickets,
    isLoading: ticketsData.isLoading || betAmountsData.isLoading,
    error: ticketsData.error || betAmountsData.error,
    refetch: async () => {
      await ticketsData.refetch();
      await betAmountsData.refetch();
    },
  };
}
