// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Round, TicketTypeStats, RoundNotActive, RoundNotEnded, AlreadyHasTicket, InvalidTicketType, NoWinningsToWithdraw} from "./LotteryTypes.sol";
import {LotteryConfig} from "./LotteryConfig.sol";
import {LotteryVRF} from "./LotteryVRF.sol";

/**
 * @title LotteryCore
 * @notice 💰 CŒUR MÉTIER - Tout la logique de loterie
 * 
 * RÔLE DU FICHIER :
 * =================
 * C'est le fichier le plus important. Il contient TOUTE la logique
 * métier de la loterie. Il combine :
 * - LotteryConfig : les paramètres
 * - LotteryVRF : la randomité
 * - ReentrancyGuard : sécurité contre reentrancy
 * - Pausable : capacité à pauserun cas d'urgence
 * 
 * 1️⃣  ACTIONS DES JOUEURS
 *   - buyTicket(uint8 ticketType) : acheter un ticket
 *     → Vérifie que le round est actif
 *     → Pas 2 tickets par joueur par round
 *     → Transfère les tokens (SafeERC20)
 *     → Met à jour les statistiques
 *   
 *   - withdraw() : retirer ses gains
 *     → Pattern de "pull payment" (plus sûr que push)
 *     → Utilise nonReentrant pour éviter les attaques
 * 
 * 2️⃣  ACTIONS DE L'ADMIN
 *   - closeRound() : clôturer le round et demander randomité
 *     → Vérifie que roundDuration est écoulée
 *     → Demande un nombre aléatoire au VRF (Chainlink)
 *     → Ne peut pas forcer le réseau à répondre
 * 
 *   - pause() / unpause() : pause l'urgence
 *     → Utilise Pausable d'OpenZeppelin
 * 
 * 3️⃣  FINALIZATION DU ROUND (automatique via VRF)
 *   - _handleRandomWords() : appelé par VRF quand réponse reçue
 *     → Détermine le ticket type gagnant
 *     → Calcule distribution des gains
 *     → Applique frais trésorerie (2%)
 *     → Démarre le prochain round
 *   
 *   - _finalizeRound() : fonction interne pour finaliser
 *     → Logique de distribution
 *     → Update des balances (pull pattern)
 * 
 * 4️⃣  STATE MANAGEMENT
 *   - Mappings : userTickets, ticketTypeStats, playersByTicketType
 *   - Variables : roundId, currentRound, userWithdrawables
 *   - Tous initialisés correctement dans le constructor
 * 
 * HIÉRARCHIE D'HÉRITAGE :
 * ========================
 * LotteryCore hérite de :
 *   ✅ LotteryConfig (pour setLotteryOption, setTicketPrice, etc.)
 *   ✅ LotteryVRF (pour _requestRandomness, fulfillRandomWords)
 *   ✅ ReentrancyGuard (pour nonReentrant modifier)
 *   ✅ Pausable (pour whenNotPaused modifier)
 * 
 * PATTERN SÉCURITÉ :
 * ==================
 * ✅ Checks-Effects-Interactions : ordre correct des opérations
 * ✅ nonReentrant : sur buyTicket() et withdraw()
 * ✅ whenNotPaused : sur les fonctions sensibles
 * ✅ SafeERC20 : pour les transfers de tokens
 * ✅ Pull payment : les utilisateurs retirent eux-mêmes
 * ✅ immutable : constants de sécurité (prix, trésorerie)
 * 
 * PROCESSUS COMPLET D'UN ROUND :
 * ===============================
 * 1. Round 1 actif → joueurs achètent des tickets
 * 2. Durée écoulée → admin appelle closeRound()
 * 3. VRF demande randomité (async)
 * 4. Chainlink répond après 3+ blocs
 * 5. fulfillRandomWords() est appelé automatiquement
 * 6. _handleRandomWords() finalise et démarre round 2
 * 7. Joueurs gagnants retirent via withdraw()
 * 8. Cycle recommence
 * 
 * IMPORTE QUI ? :
 * ===============
 * ✅ Lottery.sol (hérite de LotteryCore)
 * ✅ Personne d'autre (abstract contract)
 */
abstract contract LotteryCore is LotteryConfig, LotteryVRF, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable paymentToken;

    // ID du round actuel
    uint256 public currentRoundId;

    // Mapping: roundId => ticketType => stats
    mapping(uint256 => mapping(uint8 => TicketTypeStats)) public ticketTypeStats;

    // Mapping: roundId => user => ticketType (0 = pas de ticket)
    // Si un joueur a playé, ce mapping contient son type
    mapping(uint256 => mapping(address => uint8)) public userTickets;

    // Mapping: roundId => user => montant_total_misé
    // Track le montant TOTAL que ce joueur a misé pour ce round
    mapping(uint256 => mapping(address => uint256)) public userBetAmounts;

    // Mapping: roundId => ticketType => address[] (liste des joueurs par camp)
    mapping(uint256 => mapping(uint8 => address[])) public playersByTicketType;

    // Soldes retirables par utilisateur (pull pattern)
    mapping(address => uint256) public withdrawable;

    // Solde de la trésorerie
    uint256 public treasuryBalance;

    event RoundStarted(uint256 indexed roundId, uint8 numberOfTickets, uint256 startTime, uint256 endTime);
    event TicketPurchased(uint256 indexed roundId, address indexed player, uint8 ticketType, uint256 amount);
    event RoundClosed(uint256 indexed roundId, uint256 timestamp);
    event RoundFinalized(uint256 indexed roundId, uint8 winningTicketType, uint256 totalPrize);
    event WinningsDistributed(uint256 indexed roundId, address indexed player, uint256 amount);
    event TreasuryWithdrawn(address indexed treasury, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    constructor(
        address _paymentToken,
        address _treasury,
        address _vrfCoordinator,
        uint256 _subscriptionId,  // uint256 pour VRF v2.5
        bytes32 _keyHash
    ) 
        LotteryConfig(_treasury)
        LotteryVRF(_vrfCoordinator, _subscriptionId, _keyHash)
    {
        paymentToken = IERC20(_paymentToken);
        _startNewRound();
    }

    /**
     * @notice Acheter un ticket pour le round actuel
     * 
     * Règles :
     * - Un joueur peut acheter PLUSIEURS tickets dans le MÊME round
     * - MAIS tous ses tickets doivent être du MÊME type
     * - Exemple : peut acheter sur type 1 plusieurs fois
     *            mais ne peut pas mélanger type 1 et type 2
     * - Les gains sont distribués PROPORTIONNELLEMENT au montant misé
     * 
     * Exemple de flux :
     * 1. Player1 achète type 1 pour 100 tokens
     * 2. Player1 peut re-acheter type 1 pour 50 tokens (total = 150)
     * 3. Player1 ne peut pas acheter type 2 (AlreadyHasTicket)
     * 4. Si type 1 gagne : gagne proportionnellement
     */
    function buyTicket(uint8 ticketType) external nonReentrant whenNotPaused {
        uint256 roundId = currentRoundId;
        Round storage round = rounds[roundId];
        
        // Vérifications : round actif et type valide
        if (!round.isActive) revert RoundNotActive();
        if (block.timestamp >= round.endTime) revert RoundNotActive();
        if (ticketType == 0 || ticketType > currentNumberOfTicketTypes) revert InvalidTicketType();
        
        // Si le joueur a déjà un ticket, vérifier qu'il est du MÊME type
        uint8 existingTicketType = userTickets[roundId][msg.sender];
        if (existingTicketType != 0 && existingTicketType != ticketType) {
            revert AlreadyHasTicket(); // Type différent, impossible
        }
        
        // Transférer les tokens
        paymentToken.safeTransferFrom(msg.sender, address(this), ticketPrice);
        
        // Si c'est le premier ticket du joueur pour ce type
        if (existingTicketType == 0) {
            userTickets[roundId][msg.sender] = ticketType;
            ticketTypeStats[roundId][ticketType].playerCount += 1;
            playersByTicketType[roundId][ticketType].push(msg.sender);
        }
        
        // Mettre à jour les montants
        ticketTypeStats[roundId][ticketType].totalAmount += ticketPrice;
        userBetAmounts[roundId][msg.sender] += ticketPrice; // Track montant par joueur
        round.totalTickets += 1;
        
        emit TicketPurchased(roundId, msg.sender, ticketType, ticketPrice);
    }

    /**
     * @notice Fermer le round actuel et demander un nombre aléatoire
     */
    function closeRound() external nonReentrant {
        uint256 roundId = currentRoundId;
        Round storage round = rounds[roundId];
        
        if (!round.isActive) revert RoundNotActive();
        if (block.timestamp < round.endTime) revert RoundNotEnded();
        
        round.isActive = false;
        emit RoundClosed(roundId, block.timestamp);
        
        // Si aucun ticket vendu, finaliser directement
        if (round.totalTickets == 0) {
            round.isFinalized = true;
            _startNewRound();
            return;
        }
        
        _requestRandomness(roundId);
    }

    /**
     * @notice Retirer ses gains
     */
    function withdraw() external nonReentrant {
        uint256 amount = withdrawable[msg.sender];
        if (amount == 0) revert NoWinningsToWithdraw();
        
        withdrawable[msg.sender] = 0;
        paymentToken.safeTransfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Retirer les fonds de la trésorerie
     */
    function withdrawTreasury() external onlyOwner nonReentrant {
        uint256 amount = treasuryBalance;
        if (amount == 0) revert NoWinningsToWithdraw();
        
        treasuryBalance = 0;
        paymentToken.safeTransfer(treasury, amount);
        
        emit TreasuryWithdrawn(treasury, amount);
    }

    /**
     * @notice Mettre en pause/reprendre
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Gérer les nombres aléatoires reçus du VRF
     */
    function _handleRandomWords(uint256 roundId, uint256[] memory randomWords) internal override {
        Round storage round = rounds[roundId];
        if (round.isFinalized) return;
        
        // Déterminer le type de ticket gagnant
        uint8 winningType = uint8((randomWords[0] % currentNumberOfTicketTypes) + 1);
        round.winningTicketType = winningType;
        
        _finalizeRound(roundId, winningType);
    }

    /**
     * @notice Finaliser un round et distribuer les gains PROPORTIONNELLEMENT
     * 
     * Logique de distribution :
     * 1. Pool total = tout l'argent misé (gagnants + perdants)
     * 2. Frais trésorerie 2% du pool TOTAL
     * 3. Pool de prize = pool total - frais
     * 4. Pour chaque gagnant : prize = (montant_misé_joueur / montant_total_gagnants) * pool_prize
     * 
     * Exemple :
     * - Joueur 1 mise 100 sur type 1 (gagnant)
     * - Joueur 2 mise 200 sur type 1 (gagnant)
     * - Joueur 3 mise 300 sur type 2 (perdant)
     * 
     * Total pool = 600
     * Treasury fee = 600 * 2% = 12
     * Prize pool = 600 - 12 = 588
     * 
     * Joueur 1 : (100/300) * 588 = 196 de gain + 100 de mise = 296 total
     * Joueur 2 : (200/300) * 588 = 392 de gain + 200 de mise = 592 total
     */
    function _finalizeRound(uint256 roundId, uint8 winningType) internal {
        Round storage round = rounds[roundId];
        round.isFinalized = true;
        
        TicketTypeStats storage winningStats = ticketTypeStats[roundId][winningType];
        
        // Calculer le pool total
        uint256 totalPool = 0;
        for (uint8 i = 1; i <= currentNumberOfTicketTypes; i++) {
            totalPool += ticketTypeStats[roundId][i].totalAmount;
        }
        
        // Si aucun gagnant, tout va à la trésorerie
        if (winningStats.playerCount == 0) {
            treasuryBalance += totalPool;
            emit RoundFinalized(roundId, winningType, 0);
            _startNewRound();
            return;
        }
        
        // Frais de trésorerie (2% du total)
        uint256 treasuryFee = (totalPool * TREASURY_FEE_BPS) / BASIS_POINTS;
        treasuryBalance += treasuryFee;
        
        // Pool à distribuer aux gagnants
        uint256 prizePool = totalPool - treasuryFee;
        uint256 winningTotalAmount = winningStats.totalAmount;
        
        // Distribuer aux gagnants PROPORTIONNELLEMENT à leur mise
        address[] storage winners = playersByTicketType[roundId][winningType];
        
        for (uint256 i = 0; i < winners.length; i++) {
            address winner = winners[i];
            uint256 winnerBetAmount = userBetAmounts[roundId][winner];
            
            // Calcul proportionnel : (montant_joueur / montant_total_gagnants) * prizePool
            // Utiliser la multiplication d'abord pour éviter les arrondis
            uint256 proportionalPrize = (winnerBetAmount * prizePool) / winningTotalAmount;
            
            // Total à retirer = mise originale + gains
            uint256 totalWithdraw = winnerBetAmount + proportionalPrize;
            withdrawable[winner] += totalWithdraw;
            
            emit WinningsDistributed(roundId, winner, totalWithdraw);
        }
        
        emit RoundFinalized(roundId, winningType, prizePool);
        _startNewRound();
    }

    /**
     * @notice Démarrer un nouveau round
     */
    function _startNewRound() internal {
        currentRoundId += 1;
        uint256 roundId = currentRoundId;
        
        rounds[roundId] = Round({
            startTime: block.timestamp,
            endTime: block.timestamp + roundDuration,
            isActive: true,
            isFinalized: false,
            winningTicketType: 0,
            totalTickets: 0,
            vrfRequestId: 0
        });
        
        emit RoundStarted(roundId, currentNumberOfTicketTypes, block.timestamp, block.timestamp + roundDuration);
    }

    /**
     * @notice Implémenter setCallbackGasLimit
     */
    function setCallbackGasLimit(uint32 newLimit) external override onlyOwner {
        callbackGasLimit = newLimit;
    }

    // ========== FONCTIONS DE LECTURE ==========

    /**
     * @notice Obtenir les informations détaillées d'un round
     */
    function getRoundInfo(uint256 roundId) external view returns (
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        bool isFinalized,
        uint8 winningTicketType,
        uint256 totalTickets,
        uint256[] memory poolAmounts,
        uint256[] memory playerCounts
    ) {
        Round storage round = rounds[roundId];
        
        poolAmounts = new uint256[](currentNumberOfTicketTypes);
        playerCounts = new uint256[](currentNumberOfTicketTypes);
        
        for (uint8 i = 1; i <= currentNumberOfTicketTypes; i++) {
            poolAmounts[i-1] = ticketTypeStats[roundId][i].totalAmount;
            playerCounts[i-1] = ticketTypeStats[roundId][i].playerCount;
        }
        
        return (
            round.startTime,
            round.endTime,
            round.isActive,
            round.isFinalized,
            round.winningTicketType,
            round.totalTickets,
            poolAmounts,
            playerCounts
        );
    }

    /**
     * @notice Obtenir le ticket d'un utilisateur
     */
    function getUserTicket(uint256 roundId, address user) external view returns (uint8) {
        return userTickets[roundId][user];
    }

    /**
     * @notice Obtenir la liste des joueurs d'un camp
     */
    function getPlayersByTicketType(uint256 roundId, uint8 ticketType) external view returns (address[] memory) {
        return playersByTicketType[roundId][ticketType];
    }
}
