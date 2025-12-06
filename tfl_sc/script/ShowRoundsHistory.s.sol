// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Lottery} from "../src/Lottery.sol";

/**
 * @title ShowRoundsHistory
 * @notice Afficher l'historique complet de tous les rounds
 */
contract ShowRoundsHistory is Script {
    function run() external view {
        address lotteryAddress = vm.envAddress("LOTTERY_ADDRESS");
        Lottery lottery = Lottery(lotteryAddress);
        address myAccount = vm.addr(vm.envUint("PRIVATE_KEY"));
        
        uint256 currentRoundId = lottery.currentRoundId();
        
        console.log("========================================");
        console.log("         ROUNDS HISTORY");
        console.log("========================================");
        console.log("Your address:", myAccount);
        console.log("Current Round ID:", currentRoundId);
        console.log("Total Rounds:", currentRoundId);
        
        console.log("\n=== ALL ROUNDS ===");
        
        for (uint256 i = 1; i <= currentRoundId; i++) {
            (
                uint256 startTime,
                uint256 endTime,
                bool isActive,
                bool isFinalized,
                uint8 winningTicketType,
                uint256 totalTickets,
                uint256[] memory poolAmounts,
                uint256[] memory playerCounts
            ) = lottery.getRoundInfo(i);
            
            console.log("\n--- Round", i, "---");
            console.log("Status:", isActive ? "ACTIVE" : (isFinalized ? "FINALIZED" : "CLOSED"));
            console.log("Start:", startTime);
            console.log("End:", endTime);
            console.log("Total Tickets:", totalTickets);
            
            if (isFinalized) {
                console.log("Winning Camp:", winningTicketType);
            }
            
            // Your ticket in this round
            uint8 yourTicket = lottery.userTickets(i, myAccount);
            if (yourTicket > 0) {
                console.log("YOUR TICKET: Camp", yourTicket);
                
                if (isFinalized) {
                    if (yourTicket == winningTicketType) {
                        console.log("RESULT: YOU WON!");
                    } else {
                        console.log("RESULT: You lost");
                    }
                }
            }
            
            // Pool info
            if (poolAmounts.length > 0) {
                console.log("Pool distribution:");
                for (uint256 j = 0; j < poolAmounts.length; j++) {
                    if (playerCounts[j] > 0) {
                        console.log("  Camp", j+1, "- Pool (tokens):", poolAmounts[j] / 1e18);
                        console.log("  Camp", j+1, "- Players:", playerCounts[j]);
                    }
                }
            }
        }
        
        console.log("\n========================================");
        console.log("YOUR WITHDRAWABLE BALANCE:", lottery.withdrawable(myAccount) / 1e18, "tokens");
        console.log("========================================");
    }
}
