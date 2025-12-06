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
  // Fetcher juste le round courant pour être rapide
  const { data: ticketType, isLoading: ticketsLoading, error: ticketsError, refetch: refetchTickets } = useReadContract({
    address: LOTTERY_ADDRESS as `0x${string}`,
    abi: lotteryAbi,
    functionName: 'userTickets',
    args: playerAddress ? [BigInt(currentRoundId), playerAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!playerAddress && currentRoundId > 0,
    },
  });

  const { data: betAmount, isLoading: betLoading, error: betError, refetch: refetchBet } = useReadContract({
    address: LOTTERY_ADDRESS as `0x${string}`,
    abi: lotteryAbi,
    functionName: 'userBetAmounts',
    args: playerAddress ? [BigInt(currentRoundId), playerAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!playerAddress && currentRoundId > 0,
    },
  });

  const ticketTypeNum = ticketType as number | undefined;
  const betAmountBigint = betAmount as bigint | undefined;

  const tickets = ticketTypeNum && ticketTypeNum > 0 ? [{
    roundId: currentRoundId,
    ticketType: ticketTypeNum,
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
    isLoading: ticketsLoading || betLoading, 
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

  const buyTicket = (ticketType: number) => {
    writeContract({
      address: LOTTERY_ADDRESS as `0x${string}`,
      abi: LotteryABI,
      functionName: 'buyTicket',
      args: [ticketType],
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
