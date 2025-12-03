// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Lottery} from "../src/Lottery.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title InteractLottery
 * @notice Scripts d'interaction avec le contrat Lottery déployé
 * 
 * CONFIGURATION :
 * ===============
 * Définir dans .env :
 *   LOTTERY_ADDRESS=0x96ACe24911D3a968fdA1486e4B752a484BAdC812
 *   PAYMENT_TOKEN=0x947888B15f1a5dD02ADd66a24a5F1c6dBBcCf235
 * 
 * USAGE :
 * =======
 * 
 * # Voir les infos du contrat
 * forge script script/InteractLottery.s.sol --tc GetLotteryInfo --rpc-url $SEPOLIA_RPC_URL
 * 
 * # Acheter des tickets
 * forge script script/InteractLottery.s.sol --tc BuyTickets --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast
 * 
 * # Finaliser un round (owner only)
 * forge script script/InteractLottery.s.sol --tc FinalizeRound --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast
 * 
 * # Retirer ses gains
 * forge script script/InteractLottery.s.sol --tc WithdrawWinnings --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast
 * 
 * # Changer le mode de loterie (owner only)
 * forge script script/InteractLottery.s.sol --tc SetLotteryOption --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast
 * 
 * # Configurer le contrat (owner only)
 * forge script script/InteractLottery.s.sol --tc ConfigureLottery --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast
 */

// ============================================
// LECTURE D'INFORMATIONS
// ============================================

/**
 * @notice Affiche toutes les informations du contrat Lottery
 */
contract GetLotteryInfo is Script {
    function run() external view {
        address lotteryAddress = vm.envAddress("LOTTERY_ADDRESS");
        Lottery lottery = Lottery(lotteryAddress);
        
        console.log("========================================");
        console.log("       LOTTERY CONTRACT INFO");
        console.log("========================================");
        
        console.log("=== GENERAL ===");
        console.log("Contract:", lotteryAddress);
        console.log("Owner:", lottery.owner());
        console.log("Treasury:", lottery.treasury());
        console.log("Paused:", lottery.paused());
        
        console.log("=== CONFIGURATION ===");
        console.log("Ticket Price (wei):", lottery.ticketPrice());
        console.log("Round Duration (sec):", lottery.roundDuration());
        console.log("Treasury Fee: 2% (200 bps)");
        console.log("Lottery Option:", lottery.currentOptionId());
        console.log("Number of Camps:", lottery.currentNumberOfTicketTypes());
        
        console.log("=== CURRENT ROUND ===");
        uint256 currentRoundId = lottery.currentRoundId();
        console.log("Round ID:", currentRoundId);
        
        (
            uint256 startTime,
            uint256 endTime,
            bool isActive,
            bool finalized,
            uint8 winningCamp,
            uint256 totalTickets,
            ,
        ) = lottery.getRoundInfo(currentRoundId);
        
        console.log("Start Time:", startTime);
        console.log("End Time:", endTime);
        console.log("Is Active:", isActive);
        console.log("Finalized:", finalized);
        console.log("Winning Camp:", winningCamp);
        console.log("Total Tickets:", totalTickets);
        
        if (block.timestamp < endTime) {
            console.log("Time Remaining (sec):", endTime - block.timestamp);
        } else {
            console.log("Round ENDED - Ready to finalize");
        }
        
        console.log("========================================");
    }
}

/**
 * @notice Affiche les infos d'un joueur spécifique
 */
contract GetPlayerInfo is Script {
    function run() external view {
        address lotteryAddress = vm.envAddress("LOTTERY_ADDRESS");
        address playerAddress = vm.envAddress("PLAYER_ADDRESS");
        Lottery lottery = Lottery(lotteryAddress);
        
        uint256 currentRoundId = lottery.currentRoundId();
        
        console.log("========================================");
        console.log("         PLAYER INFO");
        console.log("========================================");
        console.log("Player:");
        console.log(playerAddress);
        console.log("Round:", currentRoundId);
        
        // Ticket type acheté
        uint8 ticketType = lottery.userTickets(currentRoundId, playerAddress);
        uint256 betAmount = lottery.userBetAmounts(currentRoundId, playerAddress);
        
        console.log("=== BETS IN CURRENT ROUND ===");
        console.log("Ticket Type:", ticketType);
        console.log("Bet Amount (wei):", betAmount);
        
        console.log("========================================");
    }
}

// ============================================
// ACTIONS JOUEUR
// ============================================

/**
 * @notice Acheter un ticket
 * @dev Définir CAMP dans .env (1-2 pour 2 camps, 1-6 pour 6 camps)
 */
contract BuyTickets is Script {
    function run() external {
        address lotteryAddress = vm.envAddress("LOTTERY_ADDRESS");
        address paymentToken = vm.envAddress("PAYMENT_TOKEN");
        uint8 camp = uint8(vm.envUint("CAMP"));
        
        Lottery lottery = Lottery(lotteryAddress);
        IERC20 token = IERC20(paymentToken);
        
        uint256 ticketPrice = lottery.ticketPrice();
        
        console.log("========================================");
        console.log("         BUY TICKET");
        console.log("========================================");
        console.log("Lottery:");
        console.log(lotteryAddress);
        console.log("Camp:", camp);
        console.log("Ticket Price (wei):", ticketPrice);
        
        vm.startBroadcast();
        
        // Approuver le token si nécessaire
        uint256 allowance = token.allowance(msg.sender, lotteryAddress);
        if (allowance < ticketPrice) {
            console.log("Approving tokens...");
            token.approve(lotteryAddress, type(uint256).max);
            console.log("Approved!");
        }
        
        // Acheter le ticket
        console.log("Buying ticket...");
        lottery.buyTicket(camp);
        console.log("Ticket purchased!");
        
        vm.stopBroadcast();
        
        console.log("========================================");
    }
}

/**
 * @notice Retirer ses gains
 */
contract WithdrawWinnings is Script {
    function run() external {
        address lotteryAddress = vm.envAddress("LOTTERY_ADDRESS");
        Lottery lottery = Lottery(lotteryAddress);
        
        console.log("========================================");
        console.log("       WITHDRAW WINNINGS");
        console.log("========================================");
        
        vm.startBroadcast();
        
        console.log("Withdrawing...");
        lottery.withdraw();
        console.log("Withdrawn successfully!");
        
        vm.stopBroadcast();
        
        console.log("========================================");
    }
}

// ============================================
// ACTIONS OWNER
// ============================================

/**
 * @notice Finaliser le round actuel (déclenche le tirage VRF)
 */
contract FinalizeRound is Script {
    function run() external {
        address lotteryAddress = vm.envAddress("LOTTERY_ADDRESS");
        Lottery lottery = Lottery(lotteryAddress);
        
        uint256 currentRoundId = lottery.currentRoundId();
        
        console.log("========================================");
        console.log("        FINALIZE ROUND");
        console.log("========================================");
        console.log("Current Round ID:", currentRoundId);
        
        (
            ,
            uint256 endTime,
            ,
            bool finalized,
            ,
            uint256 totalTickets,
            ,
        ) = lottery.getRoundInfo(currentRoundId);
        
        console.log("End Time:", endTime);
        console.log("Current Time:", block.timestamp);
        console.log("Total Tickets:", totalTickets);
        console.log("Already Finalized:", finalized);
        
        if (finalized) {
            console.log("Round already finalized!");
            return;
        }
        
        if (block.timestamp < endTime) {
            console.log("Round not ended yet!");
            console.log("Time remaining (sec):", endTime - block.timestamp);
            return;
        }
        
        vm.startBroadcast();
        
        console.log("Closing round...");
        lottery.closeRound();
        console.log("Round closed! VRF request sent.");
        
        vm.stopBroadcast();
        
        console.log("Note: Winning camp determined when VRF callback arrives.");
        console.log("========================================");
    }
}

/**
 * @notice Changer le mode de loterie (2 ou 6 camps)
 * @dev Définir LOTTERY_OPTION dans .env (1 = 2 camps, 2 = 6 camps)
 */
contract SetLotteryOption is Script {
    function run() external {
        address lotteryAddress = vm.envAddress("LOTTERY_ADDRESS");
        uint8 newOption = uint8(vm.envUint("LOTTERY_OPTION"));
        
        Lottery lottery = Lottery(lotteryAddress);
        
        console.log("========================================");
        console.log("      SET LOTTERY OPTION");
        console.log("========================================");
        console.log("Current Option:", lottery.currentOptionId());
        console.log("New Option:", newOption);
        
        vm.startBroadcast();
        
        lottery.setLotteryOption(newOption);
        console.log("Lottery option updated!");
        
        vm.stopBroadcast();
        
        console.log("========================================");
    }
}

/**
 * @notice Configurer les paramètres de la loterie
 * @dev Définir les variables dans .env :
 *   - NEW_TICKET_PRICE (optionnel)
 *   - NEW_ROUND_DURATION (optionnel)
 */
contract ConfigureLottery is Script {
    function run() external {
        address lotteryAddress = vm.envAddress("LOTTERY_ADDRESS");
        Lottery lottery = Lottery(lotteryAddress);
        
        console.log("========================================");
        console.log("      CONFIGURE LOTTERY");
        console.log("========================================");
        
        vm.startBroadcast();
        
        // Ticket Price
        try vm.envUint("NEW_TICKET_PRICE") returns (uint256 newTicketPrice) {
            if (newTicketPrice > 0) {
                console.log("Setting ticket price to:", newTicketPrice);
                lottery.setTicketPrice(newTicketPrice);
            }
        } catch {}
        
        // Round Duration
        try vm.envUint("NEW_ROUND_DURATION") returns (uint256 newDuration) {
            if (newDuration > 0) {
                console.log("Setting round duration to (sec):", newDuration);
                lottery.setRoundDuration(newDuration);
            }
        } catch {}
        
        vm.stopBroadcast();
        
        console.log("=== NEW CONFIGURATION ===");
        console.log("Ticket Price:", lottery.ticketPrice());
        console.log("Round Duration:", lottery.roundDuration());
        console.log("========================================");
    }
}

/**
 * @notice Mettre en pause / reprendre la loterie
 */
contract TogglePause is Script {
    function run() external {
        address lotteryAddress = vm.envAddress("LOTTERY_ADDRESS");
        Lottery lottery = Lottery(lotteryAddress);
        
        bool currentlyPaused = lottery.paused();
        
        console.log("========================================");
        console.log("        TOGGLE PAUSE");
        console.log("========================================");
        console.log("Currently Paused:", currentlyPaused);
        console.log("");
        
        vm.startBroadcast();
        
        if (currentlyPaused) {
            console.log("Unpausing...");
            lottery.unpause();
            console.log("Lottery unpaused!");
        } else {
            console.log("Pausing...");
            lottery.pause();
            console.log("Lottery paused!");
        }
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("========================================");
    }
}

/**
 * @notice Retirer les fonds de la trésorerie
 */
contract WithdrawTreasury is Script {
    function run() external {
        address lotteryAddress = vm.envAddress("LOTTERY_ADDRESS");
        Lottery lottery = Lottery(lotteryAddress);
        
        console.log("========================================");
        console.log("      WITHDRAW TREASURY");
        console.log("========================================");
        
        vm.startBroadcast();
        
        console.log("Withdrawing treasury...");
        lottery.withdrawTreasury();
        console.log("Treasury withdrawn!");
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("========================================");
    }
}

// ============================================
// UTILITAIRES
// ============================================

/**
 * @notice Approuver le token pour le contrat Lottery
 */
contract ApproveToken is Script {
    function run() external {
        address lotteryAddress = vm.envAddress("LOTTERY_ADDRESS");
        address paymentToken = vm.envAddress("PAYMENT_TOKEN");
        
        IERC20 token = IERC20(paymentToken);
        
        console.log("========================================");
        console.log("        APPROVE TOKEN");
        console.log("========================================");
        console.log("Token:", paymentToken);
        console.log("Spender:", lotteryAddress);
        console.log("");
        
        vm.startBroadcast();
        
        console.log("Approving max amount...");
        token.approve(lotteryAddress, type(uint256).max);
        console.log("Approved!");
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("========================================");
    }
}

/**
 * @notice Vérifier le solde de tokens
 */
contract CheckBalance is Script {
    function run() external view {
        address paymentToken = vm.envAddress("PAYMENT_TOKEN");
        address lotteryAddress = vm.envAddress("LOTTERY_ADDRESS");
        address checkAddress = vm.envAddress("CHECK_ADDRESS");
        
        IERC20 token = IERC20(paymentToken);
        
        console.log("========================================");
        console.log("        CHECK BALANCE");
        console.log("========================================");
        console.log("Token:", paymentToken);
        console.log("Address:", checkAddress);
        console.log("");
        console.log("Balance:", token.balanceOf(checkAddress), "wei");
        console.log("Allowance to Lottery:", token.allowance(checkAddress, lotteryAddress), "wei");
        console.log("");
        console.log("========================================");
    }
}
