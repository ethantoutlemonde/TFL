// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LotteryTypes
 * @notice 📦 TYPES PARTAGÉS - Définitions centralisées de toutes les structures
 * 
 * RÔLE DU FICHIER :
 * ================
 * Ce fichier est la "source unique de vérité" pour tous les types utilisés
 * dans le système de loterie. Il contient :
 * 
 * 1️⃣  STRUCTURES (struct)
 *   - Round : définition complète d'un round de loterie
 *   - TicketTypeStats : statistiques par type de ticket
 *   - LotteryOption : configuration d'une option de loterie
 * 
 * 2️⃣  ERREURS PERSONNALISÉES (error)
 *   - RoundNotActive : le round n'est pas actif
 *   - RoundNotEnded : le round n'est pas terminé
 *   - InvalidTicketType : type de ticket invalide
 *   - AlreadyHasTicket : joueur a déjà un ticket pour ce round
 *   - ... (12 erreurs au total)
 * 
 * 3️⃣  ÉVÉNEMENTS (event)
 *   - RoundStarted : un nouveau round commence
 *   - TicketBought : un ticket a été acheté
 *   - RoundFinalized : un round est finalisé avec distribution
 *   - ... (11 événements au total)
 * 
 * AVANTAGES :
 * ===========
 * ✅ Pas de duplication de code
 * ✅ Un seul endroit pour modifier les structures
 * ✅ Tous les fichiers utilisent les mêmes types
 * ✅ Facile à auditer les types utilisés
 * ✅ Pattern utilisé par OpenZeppelin, Aave, Uniswap
 * 
 * IMPORTE QUI ? :
 * ===============
 * ✅ LotteryConfig.sol   (utilise LotteryOption)
 * ✅ LotteryCore.sol     (utilise Round, TicketTypeStats, erreurs, événements)
 * ✅ LotteryVRF.sol      (utilise Round)
 * ✅ Tests              (importe les structures pour vérifier)
 */

// ========== STRUCTURES ==========

/**
 * @dev Structure représentant un round de loterie
 */
struct Round {
    uint256 startTime;           // Timestamp de début du round
    uint256 endTime;             // Timestamp de fin du round
    bool isActive;               // Le round est-il actif ?
    bool isFinalized;            // Le round est-il finalisé ?
    uint8 winningTicketType;     // Type de ticket gagnant (0 = pas encore tiré)
    uint256 totalTickets;        // Nombre total de tickets vendus
    uint256 vrfRequestId;        // ID de la requête VRF Chainlink
}

/**
 * @dev Structure pour les statistiques d'un camp dans un round
 */
struct TicketTypeStats {
    uint256 totalAmount;         // Montant total misé sur ce camp
    uint256 playerCount;         // Nombre de joueurs dans ce camp
}

/**
 * @dev Configuration d'une option de loterie (2, 6, ou random)
 */
struct LotteryOption {
    uint8 numberOfTicketTypes;   // Nombre de camps (2, 6, ou calculé pour random)
    string optionName;           // Nom lisible ("2 Camps", "6 Camps", "Random")
    bool isActive;               // Cette option est-elle disponible ?
}

// ========== ERREURS ==========

error RoundNotActive();
error RoundNotEnded();
error RoundAlreadyFinalized();
error AlreadyHasTicket();
error InvalidTicketType();
error InsufficientAllowance();
error NoWinningsToWithdraw();
error InvalidTreasuryAddress();
error InvalidPrice();
error InvalidDuration();
error VRFRequestNotFound();
error InvalidLotteryOption();
error LotteryOptionNotActive();

// ========== ÉVÉNEMENTS ==========

event RoundStarted(uint256 indexed roundId, uint8 numberOfTickets, uint256 startTime, uint256 endTime);
event TicketPurchased(uint256 indexed roundId, address indexed player, uint8 ticketType, uint256 amount);
event RoundClosed(uint256 indexed roundId, uint256 timestamp);
event RandomnessRequested(uint256 indexed roundId, uint256 requestId);
event RoundFinalized(uint256 indexed roundId, uint8 winningTicketType, uint256 totalPrize);
event WinningsDistributed(uint256 indexed roundId, address indexed player, uint256 amount);
event TreasuryWithdrawn(address indexed treasury, uint256 amount);
event Withdrawn(address indexed user, uint256 amount);
event TicketPriceUpdated(uint256 oldPrice, uint256 newPrice);
event RoundDurationUpdated(uint256 oldDuration, uint256 newDuration);
event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
event LotteryOptionChanged(uint8 newNumberOfTickets, string optionName);
