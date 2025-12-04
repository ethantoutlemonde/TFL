// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {LotteryOption, InvalidLotteryOption, LotteryOptionChanged} from "./LotteryTypes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LotteryConfig
 * @notice ⚙️  CONFIGURATION - Gère tous les paramètres et options de loterie
 * 
 * RÔLE DU FICHIER :
 * =================
 * Ce fichier centralise TOUTE la configuration du système. Il ne contient
 * QUE la logique de configuration, pas la logique métier. Responsabilités :
 * 
 * 1️⃣  DÉFINIR LES OPTIONS (3 options)
 *   - option2Camps : 2 camps (ticket type 1 ou 2)
 *   - option6Camps : 6 camps (ticket type 1 à 6)
 *   - optionRandom : aléatoire (2-6 camps générés)
 *   → Le propriétaire peut CHANGER d'option à tout moment
 * 
 * 2️⃣  GÉRER LES PARAMÈTRES GLOBAUX
 *   - ticketPrice : prix d'un ticket en ERC20
 *   - roundDuration : durée d'un round en secondes
 *   - treasury : adresse recevant les frais (2%)
 *   - currentNumberOfTicketTypes : nombre de camps actifs
 * 
 * 3️⃣  FUNCTIONS D'ADMINISTRATION
 *   - setLotteryOption(uint8) : change l'option (1, 2, ou 3)
 *   - setTicketPrice(uint256) : change le prix
 *   - setRoundDuration(uint256) : change la durée
 *   - setTreasury(address) : change la trésorerie
 *   → Toutes protégées par onlyOwner
 * 
 * AVANTAGES :
 * ===========
 * ✅ Séparation des responsabilités (config ≠ logique)
 * ✅ Facile de modifier les paramètres sans toucher au core
 * ✅ Les propriétés métier héritent de cette config
 * ✅ Pattern utilisé par Aave (LendingPoolConfigurator)
 * ✅ Abstract contract (pas déployable, utilisé par héritage)
 * 
 * HIÉRARCHIE :
 * ============
 * LotteryConfig (abstract)
 *   ↓ héritée par
 * LotteryCore (abstract)
 *   ↓ héritée par
 * Lottery (contract final, déployable)
 */
abstract contract LotteryConfig is Ownable {
    
    // Configurations disponibles
    LotteryOption public option2Camps;
    LotteryOption public option6Camps;
    LotteryOption public optionRandom;
    
    // Option actuelle
    uint8 public currentOptionId; // 1 = 2 camps, 2 = 6 camps, 3 = random
    uint8 public currentNumberOfTicketTypes;

    // Prix d'un ticket en tokens
    uint256 public ticketPrice = 1 * 10**18;
    
    // Durée d'un round en secondes (24h)
    uint256 public roundDuration = 900;
    
    // Trésorerie
    address public treasury;
    uint256 public constant TREASURY_FEE_BPS = 200;
    uint256 public constant BASIS_POINTS = 10000;

    constructor(address _treasury) Ownable(msg.sender) {
        if (_treasury == address(0)) revert InvalidLotteryOption();
        treasury = _treasury;
        
        // Initialiser les options
        option2Camps = LotteryOption({
            numberOfTicketTypes: 2,
            optionName: "2 Camps",
            isActive: true
        });
        
        option6Camps = LotteryOption({
            numberOfTicketTypes: 6,
            optionName: "6 Camps",
            isActive: true
        });
        
        optionRandom = LotteryOption({
            numberOfTicketTypes: 0, // Sera défini par random
            optionName: "Random",
            isActive: false
        });
        
        // Utiliser 2 camps par défaut
        _setLotteryOption(1);
    }

    /**
     * @notice Changer l'option de loterie
     * @param optionId 1 = 2 camps, 2 = 6 camps, 3 = random
     */
    function setLotteryOption(uint8 optionId) external onlyOwner {
        _setLotteryOption(optionId);
    }

    function _setLotteryOption(uint8 optionId) internal {
        if (optionId < 1 || optionId > 3) revert InvalidLotteryOption();
        
        LotteryOption storage selectedOption;
        
        if (optionId == 1) {
            selectedOption = option2Camps;
        } else if (optionId == 2) {
            selectedOption = option6Camps;
        } else {
            selectedOption = optionRandom;
        }
        
        if (!selectedOption.isActive && optionId != 3) revert InvalidLotteryOption();
        
        currentOptionId = optionId;
        currentNumberOfTicketTypes = selectedOption.numberOfTicketTypes;
        
        emit LotteryOptionChanged(currentNumberOfTicketTypes, selectedOption.optionName);
    }

    /**
     * @notice Modifier le prix d'un ticket
     */
    function setTicketPrice(uint256 newPrice) external onlyOwner {
        if (newPrice == 0) revert InvalidLotteryOption();
        ticketPrice = newPrice;
    }

    /**
     * @notice Modifier la durée d'un round
     */
    function setRoundDuration(uint256 newDuration) external onlyOwner {
        if (newDuration < 3600) revert InvalidLotteryOption(); // Min 1h
        roundDuration = newDuration;
    }

    /**
     * @notice Modifier la trésorerie
     */
    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidLotteryOption();
        treasury = newTreasury;
    }

    /**
     * @notice Activer/désactiver une option
     */
    function setOptionActive(uint8 optionId, bool active) external onlyOwner {
        if (optionId < 1 || optionId > 3) revert InvalidLotteryOption();
        
        if (optionId == 1) {
            option2Camps.isActive = active;
        } else if (optionId == 2) {
            option6Camps.isActive = active;
        } else {
            optionRandom.isActive = active;
        }
    }
}
