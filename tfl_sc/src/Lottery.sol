// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {LotteryCore} from "./LotteryCore.sol";

/**
 * @title Lottery
 * @notice 🎰 POINT D'ENTRÉE UNIQUE - Le contrat principal déployable
 * 
 * RÔLE DU FICHIER :
 * =================
 * Ce fichier est très simple intentionnellement. C'est la FAÇADE (facade pattern)
 * qui combine tous les modules. Son rôle est minimaliste :
 * 
 * 1️⃣  ENTRY POINT UNIQUE
 *   - C'est le seul contrat que les utilisateurs déploient
 *   - Toute la logique vient de l'héritage (LotteryCore)
 *   - Simple et claire : `new Lottery(...)`
 * 
 * 2️⃣  CONSTRUCTOR DELEGATION
 *   - Accepte les 5 paramètres nécessaires
 *   - Les transmet à LotteryCore via chaîne de constructeurs
 *   - LotteryCore → LotteryConfig (Ownable) → tout le reste
 * 
 * 3️⃣  HÉRITAGE COMPLET
 *   - Hérite de LotteryCore (direct)
 *   - LotteryCore hérite de LotteryConfig + LotteryVRF + sécurité
 *   - Donc Lottery a ACCÈS À :
 *     ✅ buyTicket() - des utilisateurs
 *     ✅ withdraw() - des utilisateurs
 *     ✅ closeRound() - de l'admin
 *     ✅ setLotteryOption() - de l'admin
 *     ✅ setTicketPrice() - de l'admin
 *     ✅ Tous les mappings et state
 * 
 * POURQUOI AVOIR UN FICHIER SI SIMPLE ?
 * ========================================
 * ✅ CLARITY : Les développeurs voient clairement la structure
 * ✅ DEPLOYMENT : Un seul contrat à déployer
 * ✅ UPGRADABILITY : Si besoin de proxy, facile de modifier
 * ✅ MODULARITY : Si on veut 2 versions (Lottery, LotteryV2), on peut
 * ✅ PATTERN STANDARD : OpenZeppelin, Aave, tous font pareil
 * 
 * HIÉRARCHIE COMPLÈTE :
 * =====================
 * 
 * ┌─ Lottery (34 lignes, déployable)
 * │
 * └─ LotteryCore (291 lignes, logique métier)
 *    │
 *    ├─ LotteryConfig (127 lignes, configuration)
 *    │  └─ Ownable (OpenZeppelin, admin)
 *    │
 *    ├─ LotteryVRF (80 lignes, VRF Chainlink)
 *    │  └─ VRFConsumerBaseV2 (Chainlink)
 *    │
 *    ├─ ReentrancyGuard (OpenZeppelin, sécurité)
 *    └─ Pausable (OpenZeppelin, urgence)
 * 
 * PLUS : LotteryTypes.sol (70 lignes, types partagés)
 * 
 * DÉPLOIEMENT :
 * =============
 * const lottery = new Lottery(
 *   paymentToken,          // ERC20 token pour les paiements
 *   treasuryAddress,       // Adresse recevant les frais
 *   chainlinkCoordinator,  // VRF coordinator
 *   vrfSubscriptionId,     // ID subscription Chainlink
 *   vrfKeyHash             // Key hash pour le gas lane
 * );
 * 
 * UTILISATION :
 * =============
 * ✅ const ticket = await lottery.buyTicket(1);
 * ✅ await lottery.closeRound();  // Admin
 * ✅ await lottery.withdraw();
 * ✅ await lottery.setLotteryOption(2);  // Admin
 * 
 * IMPORTE QUI ? :
 * ===============
 * ✅ Tests (déploient ce contrat)
 * ✅ Utilisateurs finaux (déploient ce contrat)
 * ✅ Personne d'autre
 */
contract Lottery is LotteryCore {
    
    /**
     * @notice Initialise le contrat de loterie
     * @param _paymentToken Adresse du token ERC20 utilisé pour les paris
     * @param _treasury Adresse de la trésorerie
     * @param _vrfCoordinator Adresse du coordinateur Chainlink VRF
     * @param _subscriptionId ID de souscription Chainlink VRF (uint256 pour v2.5)
     * @param _keyHash Key hash pour Chainlink VRF
     */
    constructor(
        address _paymentToken,
        address _treasury,
        address _vrfCoordinator,
        uint256 _subscriptionId,  // uint256 pour VRF v2.5
        bytes32 _keyHash
    ) LotteryCore(
        _paymentToken,
        _treasury,
        _vrfCoordinator,
        _subscriptionId,
        _keyHash
    ) {}
}
