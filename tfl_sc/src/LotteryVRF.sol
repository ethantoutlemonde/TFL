// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import {Round, VRFRequestNotFound, RoundAlreadyFinalized} from "./LotteryTypes.sol";

/**
 * @title LotteryVRF
 * @notice 🎲 INTÉGRATION VRF - Gère la randomité via Chainlink VRF
 * 
 * RÔLE DU FICHIER :
 * =================
 * Ce fichier ISOLE COMPLÈTEMENT la complexité Chainlink VRF du reste
 * du code. Il n'y a aucune logique métier ici, JUSTE l'intégration VRF.
 * Pattern utilisé par tous les protocoles (Chainlink, Band, Pyth).
 * 
 * 1️⃣  CONSTANTS IMMUABLES (déployement uniquement)
 *   - vrfCoordinator : adresse du coordinateur Chainlink
 *   - subscriptionId : ID de la subscription (funding)
 *   - keyHash : paramètre réseau (gas lane)
 *   → Marquées immutable = pas modifiables après déploiement
 * 
 * 2️⃣  DEMANDER DE LA RANDOMITÉ
 *   - _requestRandomness(uint256 roundId) : fonction interne
 *   → Demande 1 nombre aléatoire au coordinateur Chainlink
 *   → Le réseau va appeler fulfillRandomWords() plus tard
 * 
 * 3️⃣  RECEVOIR LA RÉPONSE (Callback)
 *   - fulfillRandomWords(uint256, uint256[] memory) : callback Chainlink
 *   → Appelé automatiquement par Chainlink 3 blocs après la demande
 *   → Trouve le round correspondant
 *   → Appelle _handleRandomWords() (implémentée dans LotteryCore)
 * 
 * PATTERN UTILISÉ :
 * =================
 * ✅ ADAPTER PATTERN : LotteryVRF adapte Chainlink à notre interface
 * ✅ TEMPLATE METHOD : fulfillRandomWords appelle _handleRandomWords()
 *                      (défini dans LotteryCore)
 * ✅ IMMUTABLE CONSTANTS : Sécurité + économie de gas
 * ✅ INTERNAL FUNCTIONS : Logique cachée, interface claire
 * 
 * AVANTAGES :
 * ===========
 * ✅ Si on change de fournisseur VRF, c'est un fichier à modifier
 * ✅ LotteryCore ne voit pas la complexité Chainlink
 * ✅ Facile à tester avec mock du coordinateur
 * ✅ Sécurité : on contrôle exactement quand VRF est appelé
 * 
 * IMPORTE QUI ? :
 * ===============
 * ✅ LotteryCore (hérite de LotteryVRF)
 * ✅ Lottery (hérite indirectement via LotteryCore)
 */
abstract contract LotteryVRF is VRFConsumerBaseV2 {
    
    VRFCoordinatorV2Interface public immutable vrfCoordinator;
    uint64 public immutable subscriptionId;
    bytes32 public immutable keyHash;
    uint32 public callbackGasLimit = 500000;
    
    uint16 public constant REQUEST_CONFIRMATIONS = 3;
    uint32 public constant NUM_WORDS = 1;

    // Mapping VRF: requestId => roundId
    mapping(uint256 => uint256) public vrfRequestToRound;
    
    // Mapping: roundId => Round
    mapping(uint256 => Round) public rounds;

    event RandomnessRequested(uint256 indexed roundId, uint256 requestId);

    constructor(
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
    }

    /**
     * @notice Demander un nombre aléatoire via Chainlink VRF
     */
    function _requestRandomness(uint256 roundId) internal {
        Round storage round = rounds[roundId];
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
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 roundId = vrfRequestToRound[requestId];
        if (roundId == 0) revert VRFRequestNotFound();
        
        _handleRandomWords(roundId, randomWords);
    }

    /**
     * @notice À implémenter par le contrat qui hérite
     */
    function _handleRandomWords(uint256 roundId, uint256[] memory randomWords) internal virtual;

    /**
     * @notice Modifier la limite de gas pour le callback VRF
     */
    function setCallbackGasLimit(uint32 newLimit) external virtual;
}
