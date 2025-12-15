// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IVRFCoordinatorV2Plus} from "@chainlink/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {Round, VRFRequestNotFound, RoundAlreadyFinalized} from "./LotteryTypes.sol";

/**
 * @title LotteryVRF
 * @notice Intégration VRF v2.5 - gère la randomité via Chainlink VRF
 * 
 * RÔLE DU FICHIER :
 * =================
 * Ce fichier ISOLE COMPLÈTEMENT la complexité Chainlink VRF du reste
 * du code. Il n'y a aucune logique métier ici, JUSTE l'intégration VRF.
 * Pattern utilisé par tous les protocoles (Chainlink, Band, Pyth).
 * 
 * VERSION VRF v2.5 :
 * ==================
 * Attention : cette version utilise VRF v2.5 avec subscriptionId en uint256
 *             (au lieu de uint64 pour VRF v2 classique)
 * 
 * 1. CONSTANTS IMMUABLES (déploiement uniquement)
 *   - vrfCoordinator : adresse du coordinateur Chainlink
 *   - subscriptionId : ID de la subscription (uint256 pour v2.5)
 *   - keyHash : paramètre réseau (gas lane)
 *   → Marquées immutable = pas modifiables après déploiement
 * 
 * 2. DEMANDER DE LA RANDOMITÉ
 *   - _requestRandomness(uint256 roundId) : fonction interne
 *   → Demande 1 nombre aléatoire au coordinateur Chainlink
 *   → Le réseau va appeler rawFulfillRandomWords() plus tard
 * 
 * 3. RECEVOIR LA RÉPONSE (callback)
 *   - rawFulfillRandomWords() : callback Chainlink (entry point)
 *   - fulfillRandomWords() : traitement interne
 *   → Appelé automatiquement par Chainlink 3 blocs après la demande
 *   → Trouve le round correspondant
 *   → Appelle _handleRandomWords() (implémentée dans LotteryCore)
 * 
 * PATTERN UTILISÉ :
 * =================
 * - Adapter pattern : LotteryVRF adapte Chainlink à notre interface
 * - Template method : fulfillRandomWords appelle _handleRandomWords()
 *                     (défini dans LotteryCore)
 * - Immutable constants : sécurité + économie de gas
 * - Internal functions : logique cachée, interface claire
 * 
 * AVANTAGES :
 * ===========
 * - Si on change de fournisseur VRF, c'est un fichier à modifier
 * - LotteryCore ne voit pas la complexité Chainlink
 * - Facile à tester avec mock du coordinateur
 * - Sécurité : on contrôle exactement quand VRF est appelé
 * 
 * IMPORTE QUI ? :
 * ===============
 * - LotteryCore (hérite de LotteryVRF)
 * - Lottery (hérite indirectement via LotteryCore)
 */
abstract contract LotteryVRF {
    
    /// @notice Erreur si l'appelant n'est pas le VRF Coordinator
    error OnlyCoordinatorCanFulfill(address have, address want);
    
    IVRFCoordinatorV2Plus public immutable vrfCoordinator;
    uint256 public immutable subscriptionId;  // uint256 pour VRF v2.5
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
        uint256 _subscriptionId,  // uint256 pour VRF v2.5
        bytes32 _keyHash
    ) {
        vrfCoordinator = IVRFCoordinatorV2Plus(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
    }

    /**
     * @notice Demander un nombre aléatoire via Chainlink VRF v2.5
     */
    function _requestRandomness(uint256 roundId) internal {
        Round storage round = rounds[roundId];
        if (round.isFinalized) revert RoundAlreadyFinalized();
        
        // VRF v2.5 utilise une struct pour la requête
        uint256 requestId = vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: subscriptionId,
                requestConfirmations: REQUEST_CONFIRMATIONS,
                callbackGasLimit: callbackGasLimit,
                numWords: NUM_WORDS,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );
        
        round.vrfRequestId = requestId;
        vrfRequestToRound[requestId] = roundId;
        
        emit RandomnessRequested(roundId, requestId);
    }

    /**
     * @notice Entry point pour le callback VRF - appelé par le Coordinator
     * @dev Vérifie que l'appelant est bien le VRF Coordinator
     */
    function rawFulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external {
        if (msg.sender != address(vrfCoordinator)) {
            revert OnlyCoordinatorCanFulfill(msg.sender, address(vrfCoordinator));
        }
        fulfillRandomWords(requestId, randomWords);
    }

    /**
     * @notice Callback interne pour traiter le nombre aléatoire
     */
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal {
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
