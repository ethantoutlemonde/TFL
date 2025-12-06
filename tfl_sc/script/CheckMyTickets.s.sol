// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Lottery} from "../src/Lottery.sol";

/**
 * @title CheckMyTickets
 * @notice Vérifier l'état de votre compte et tickets
 */
contract CheckMyTickets is Script {
    function run() external view {
        address lotteryAddress = vm.envAddress("LOTTERY_ADDRESS");
        Lottery lottery = Lottery(lotteryAddress);
        address myAccount = vm.addr(vm.envUint("PRIVATE_KEY"));
        
        console.log("========================================");
        console.log("        CHECK MY ACCOUNT");
        console.log("========================================");
        console.log("Your address:", myAccount);
        console.log("Lottery contract:", lotteryAddress);
        
        uint256 currentRoundId = lottery.currentRoundId();
        console.log("\n=== CURRENT ROUND STATUS ===");
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
        console.log("Current Time:", block.timestamp);
        console.log("Is Active:", isActive);
        console.log("Finalized:", finalized);
        console.log("Winning Camp:", winningCamp);
        console.log("Total Tickets Sold:", totalTickets);
        
        console.log("\n=== YOUR TICKETS ===");
        // Check if you have a ticket in current round
        uint8 ticketInCurrent = lottery.userTickets(currentRoundId, myAccount);
        if (ticketInCurrent > 0) {
            console.log("You have a ticket in Round", currentRoundId);
            console.log("Your ticket type (camp):", ticketInCurrent);
        } else {
            console.log("No ticket found in current round");
        }
        
        console.log("\n=== YOUR WITHDRAWABLE BALANCE ===");
        uint256 withdrawable = lottery.withdrawable(myAccount);
        console.log("Amount you can withdraw (wei):", withdrawable);
        if (withdrawable > 0) {
            console.log("Amount you can withdraw (token units):", withdrawable / 1e18);
        }
        
        // Check previous rounds for tickets
        if (currentRoundId > 1) {
            console.log("\n=== PREVIOUS ROUNDS (checking last 3) ===");
            for (uint256 i = currentRoundId > 3 ? currentRoundId - 3 : 1; i < currentRoundId; i++) {
                uint8 ticketInPrev = lottery.userTickets(i, myAccount);
                if (ticketInPrev > 0) {
                    (,,,bool prev_finalized, uint8 prev_winning,,,) = lottery.getRoundInfo(i);
                    console.log("Round", i);
                    console.log("  Your ticket:", ticketInPrev);
                    console.log("  Winning camp:", prev_winning);
                    console.log("  Finalized:", prev_finalized);
                }
            }
        }
        
        console.log("========================================");
    }
}
