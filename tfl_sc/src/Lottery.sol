// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";

/**
 * @title Lottery
 * @notice Contrat de loterie Web3 quotidienne avec plusieurs camps et tirage aléatoire via Chainlink VRF
 * @dev Utilise un système de rounds avec distribution proportionnelle des gains
 */
contract Lottery is Ownable, ReentrancyGuard, Pausable, VRFConsumerBaseV2 {
    using SafeERC20 for IERC20;

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

    // ========== VARIABLES D'ÉTAT ==========

    // Token utilisé pour les paris (stablecoin)
    IERC20 public immutable paymentToken;
    
    // Prix d'un ticket en tokens (par défaut 5 USD avec 18 décimales)
    uint256 public ticketPrice = 5 * 10**18;
    
    // Durée d'un round en secondes (par défaut 24h)
    uint256 public roundDuration = 86400;
    
    // Nombre de types de tickets/camps disponibles
    uint8 public numberOfTicketTypes;
    
    // Adresse de la trésorerie
    address public treasury;
    
    // Pourcentage pour la trésorerie (2% = 200 basis points)
    uint256 public constant TREASURY_FEE_BPS = 200;
    uint256 public constant BASIS_POINTS = 10000;
    
    // ID du round actuel
    uint256 public currentRoundId;
    
    // Mapping des rounds
    mapping(uint256 => Round) public rounds;
    
    // Mapping: roundId => ticketType => stats
    mapping(uint256 => mapping(uint8 => TicketTypeStats)) public ticketTypeStats;
    
    // Mapping: roundId => user => ticketType (0 = pas de ticket)
    mapping(uint256 => mapping(address => uint8)) public userTickets;
    
    // Mapping: roundId => user => bool (a déjà acheté un ticket)
    mapping(uint256 => mapping(address => bool)) public hasTicket;
    
    // Mapping: roundId => ticketType => address[] (liste des joueurs par camp)
    mapping(uint256 => mapping(uint8 => address[])) public playersByTicketType;
    
    // Soldes retirables par utilisateur (pull pattern)
    mapping(address => uint256) public withdrawable;
    
    // Solde de la trésorerie
    uint256 public treasuryBalance;
    
    // Mapping VRF: requestId => roundId
    mapping(uint256 => uint256) public vrfRequestToRound;

    // Chainlink VRF
    VRFCoordinatorV2Interface public immutable vrfCoordinator;
    uint64 public immutable subscriptionId;
    bytes32 public immutable keyHash;
    uint32 public callbackGasLimit = 500000;
    uint16 public constant REQUEST_CONFIRMATIONS = 3;
    uint32 public constant NUM_WORDS = 1;

    // ========== ÉVÉNEMENTS ==========

    event RoundStarted(uint256 indexed roundId, uint256 startTime, uint256 endTime);
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

    // ========== CONSTRUCTEUR ==========

    /**
     * @notice Initialise le contrat de loterie
     * @param _paymentToken Adresse du token ERC20 utilisé pour les paris
     * @param _treasury Adresse de la trésorerie
     * @param _numberOfTicketTypes Nombre de camps/types de tickets disponibles
     * @param _vrfCoordinator Adresse du coordinateur Chainlink VRF
     * @param _subscriptionId ID de souscription Chainlink VRF
     * @param _keyHash Key hash pour Chainlink VRF
     */
    constructor(
        address _paymentToken,
        address _treasury,
        uint8 _numberOfTicketTypes,
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        if (_treasury == address(0)) revert InvalidTreasuryAddress();
        if (_numberOfTicketTypes < 2) revert InvalidTicketType();
        
        paymentToken = IERC20(_paymentToken);
        treasury = _treasury;
        numberOfTicketTypes = _numberOfTicketTypes;
        
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        
        // Démarrer le premier round
        _startNewRound();
    }

    // ========== FONCTIONS PUBLIQUES ==========

    /**
     * @notice Acheter un ticket pour le round actuel
     * @param ticketType Type de ticket/camp choisi (1 à numberOfTicketTypes)
     */
    function buyTicket(uint8 ticketType) external nonReentrant whenNotPaused {
        uint256 roundId = currentRoundId;
        Round storage round = rounds[roundId];
        
        // Vérifications
        if (!round.isActive) revert RoundNotActive();
        if (block.timestamp >= round.endTime) revert RoundNotActive();
        if (hasTicket[roundId][msg.sender]) revert AlreadyHasTicket();
        if (ticketType == 0 || ticketType > numberOfTicketTypes) revert InvalidTicketType();
        
        // Transférer les tokens du joueur vers le contrat
        paymentToken.safeTransferFrom(msg.sender, address(this), ticketPrice);
        
        // Enregistrer le ticket
        userTickets[roundId][msg.sender] = ticketType;
        hasTicket[roundId][msg.sender] = true;
        
        // Mettre à jour les statistiques
        ticketTypeStats[roundId][ticketType].totalAmount += ticketPrice;
        ticketTypeStats[roundId][ticketType].playerCount += 1;
        playersByTicketType[roundId][ticketType].push(msg.sender);
        
        round.totalTickets += 1;
        
        emit TicketPurchased(roundId, msg.sender, ticketType, ticketPrice);
    }

    /**
     * @notice Fermer le round actuel et demander un nombre aléatoire
     * @dev Peut être appelé par n'importe qui une fois le round terminé
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
        
        // Demander le nombre aléatoire
        requestRandomness();
    }

    /**
     * @notice Demander un nombre aléatoire via Chainlink VRF
     */
    function requestRandomness() public nonReentrant {
        uint256 roundId = currentRoundId;
        Round storage round = rounds[roundId];
        
        if (round.isActive) revert RoundNotActive();
        if (round.isFinalized) revert RoundAlreadyFinalized();
        
        uint256 requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            callbackGasLimit,
            NUM_WORDS
        );
        
        round.vrfRequestId = requestId;
        vrfRequestToRound[requestId] = roundId;
        
        emit RandomnessRequested(roundId, requestId);
    }

    /**
     * @notice Callback appelé par Chainlink VRF avec le nombre aléatoire
     * @param requestId ID de la requête VRF
     * @param randomWords Tableau de nombres aléatoires
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 roundId = vrfRequestToRound[requestId];
        if (roundId == 0) revert VRFRequestNotFound();
        
        Round storage round = rounds[roundId];
        if (round.isFinalized) return; // Déjà finalisé
        
        // Déterminer le type de ticket gagnant
        uint8 winningType = uint8((randomWords[0] % numberOfTicketTypes) + 1);
        round.winningTicketType = winningType;
        
        // Finaliser le round et distribuer les gains
        _finalizeRound(roundId, winningType);
    }

    /**
     * @notice Retirer ses gains accumulés
     */
    function withdraw() external nonReentrant {
        uint256 amount = withdrawable[msg.sender];
        if (amount == 0) revert NoWinningsToWithdraw();
        
        withdrawable[msg.sender] = 0;
        paymentToken.safeTransfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Retirer les fonds de la trésorerie (owner only)
     */
    function withdrawTreasury() external onlyOwner nonReentrant {
        uint256 amount = treasuryBalance;
        if (amount == 0) revert NoWinningsToWithdraw();
        
        treasuryBalance = 0;
        paymentToken.safeTransfer(treasury, amount);
        
        emit TreasuryWithdrawn(treasury, amount);
    }

    /**
     * @notice Démarrer manuellement un nouveau round
     * @dev Peut être utilisé si le round automatique ne démarre pas
     */
    function startNewRound() external onlyOwner {
        uint256 roundId = currentRoundId;
        Round storage round = rounds[roundId];
        
        if (round.isActive) revert RoundNotActive();
        if (!round.isFinalized) revert RoundAlreadyFinalized();
        
        _startNewRound();
    }

    // ========== FONCTIONS ADMIN ==========

    /**
     * @notice Modifier le prix d'un ticket
     * @param newPrice Nouveau prix en tokens (avec décimales)
     */
    function setTicketPrice(uint256 newPrice) external onlyOwner {
        if (newPrice == 0) revert InvalidPrice();
        uint256 oldPrice = ticketPrice;
        ticketPrice = newPrice;
        emit TicketPriceUpdated(oldPrice, newPrice);
    }

    /**
     * @notice Modifier la durée d'un round
     * @param newDuration Nouvelle durée en secondes
     */
    function setRoundDuration(uint256 newDuration) external onlyOwner {
        if (newDuration < 3600) revert InvalidDuration(); // Minimum 1 heure
        uint256 oldDuration = roundDuration;
        roundDuration = newDuration;
        emit RoundDurationUpdated(oldDuration, newDuration);
    }

    /**
     * @notice Modifier l'adresse de la trésorerie
     * @param newTreasury Nouvelle adresse de la trésorerie
     */
    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidTreasuryAddress();
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @notice Modifier la limite de gas pour le callback VRF
     * @param newLimit Nouvelle limite de gas
     */
    function setCallbackGasLimit(uint32 newLimit) external onlyOwner {
        callbackGasLimit = newLimit;
    }

    /**
     * @notice Mettre en pause le contrat
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Reprendre le contrat
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ========== FONCTIONS INTERNES ==========

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
        
        emit RoundStarted(roundId, block.timestamp, block.timestamp + roundDuration);
    }

    /**
     * @notice Finaliser un round et distribuer les gains
     * @param roundId ID du round à finaliser
     * @param winningType Type de ticket gagnant
     */
    function _finalizeRound(uint256 roundId, uint8 winningType) internal {
        Round storage round = rounds[roundId];
        round.isFinalized = true;
        
        TicketTypeStats storage winningStats = ticketTypeStats[roundId][winningType];
        
        // Si aucun gagnant, tout va à la trésorerie
        if (winningStats.playerCount == 0) {
            uint256 totalPool = 0;
            for (uint8 i = 1; i <= numberOfTicketTypes; i++) {
                totalPool += ticketTypeStats[roundId][i].totalAmount;
            }
            treasuryBalance += totalPool;
            emit RoundFinalized(roundId, winningType, 0);
            _startNewRound();
            return;
        }
        
        // Calculer le pool total des perdants
        uint256 losingPool = 0;
        for (uint8 i = 1; i <= numberOfTicketTypes; i++) {
            if (i != winningType) {
                losingPool += ticketTypeStats[roundId][i].totalAmount;
            }
        }
        
        // Frais de trésorerie (2%)
        uint256 treasuryFee = (losingPool * TREASURY_FEE_BPS) / BASIS_POINTS;
        treasuryBalance += treasuryFee;
        
        // Pool à distribuer (98% du pool perdant)
        uint256 prizePool = losingPool - treasuryFee;
        
        // Distribuer aux gagnants proportionnellement
        // Comme tous les tickets ont la même valeur, chaque gagnant reçoit la même part
        address[] storage winners = playersByTicketType[roundId][winningType];
        uint256 winningShare = prizePool / winners.length;
        
        for (uint256 i = 0; i < winners.length; i++) {
            address winner = winners[i];
            // Remboursement de la mise + part du prize pool
            withdrawable[winner] += ticketPrice + winningShare;
            emit WinningsDistributed(roundId, winner, ticketPrice + winningShare);
        }
        
        emit RoundFinalized(roundId, winningType, prizePool);
        
        // Démarrer le prochain round
        _startNewRound();
    }

    // ========== FONCTIONS DE LECTURE ==========

    /**
     * @notice Obtenir les informations détaillées d'un round
     * @param roundId ID du round
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
        
        poolAmounts = new uint256[](numberOfTicketTypes);
        playerCounts = new uint256[](numberOfTicketTypes);
        
        for (uint8 i = 1; i <= numberOfTicketTypes; i++) {
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
     * @notice Obtenir le ticket d'un utilisateur pour un round
     * @param roundId ID du round
     * @param user Adresse de l'utilisateur
     */
    function getUserTicket(uint256 roundId, address user) external view returns (uint8) {
        return userTickets[roundId][user];
    }

    /**
     * @notice Obtenir la liste des joueurs d'un camp pour un round
     * @param roundId ID du round
     * @param ticketType Type de ticket
     */
    function getPlayersByTicketType(uint256 roundId, uint8 ticketType) external view returns (address[] memory) {
        return playersByTicketType[roundId][ticketType];
    }
}