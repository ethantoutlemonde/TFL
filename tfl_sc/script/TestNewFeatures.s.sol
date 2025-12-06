// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Lottery} from "../src/Lottery.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TestNewFeatures
 * @notice Tester les nouvelles fonctionnalités (quantité variable + carryover)
 */
contract TestNewFeatures is Script {
    function run() external {
        address lotteryAddress = vm.envAddress("LOTTERY_ADDRESS");
        address paymentToken = vm.envAddress("PAYMENT_TOKEN");
        
        Lottery lottery = Lottery(lotteryAddress);
        IERC20 token = IERC20(paymentToken);
        address myAccount = vm.addr(vm.envUint("PRIVATE_KEY"));
        
        console.log("========================================");
        console.log("    TEST NEW FEATURES");
        console.log("========================================");
        console.log("Lottery:", lotteryAddress);
        console.log("Your address:", myAccount);
        
        uint256 currentRoundId = lottery.currentRoundId();
        console.log("\nCurrent Round ID:", currentRoundId);
        
        // Get current round info
        (
            uint256 startTime,
            uint256 endTime,
            bool isActive,
            bool isFinalized,
            uint8 winningCamp,
            uint256 totalTickets,
            ,
        ) = lottery.getRoundInfo(currentRoundId);
        
        console.log("\n=== ROUND", currentRoundId, "STATUS ===");
        console.log("Active:", isActive);
        console.log("Total Tickets:", totalTickets);
        console.log("Time remaining (sec):", endTime > block.timestamp ? endTime - block.timestamp : 0);
        
        console.log("\n=== CARRYOVER POOL (NEW FEATURE) ===");
        uint256 carryoverPool = lottery.carryoverPool();
        console.log("Carryover pool (wei):", carryoverPool);
        console.log("Carryover pool (tokens):", carryoverPool / 1e18);
        
        if (carryoverPool > 0) {
            console.log("Note: This amount will be added to the next round's prizes!");
        }
        
        console.log("\n=== TICKET PURCHASE TEST (NEW FEATURE) ===");
        
        if (isActive) {
            uint256 ticketPrice = lottery.ticketPrice();
            console.log("Ticket Price (wei):", ticketPrice);
            
            // Show how to buy multiple tickets
            console.log("\nUsage examples:");
            console.log("Buy 1 ticket:   lottery.buyTicket(1, 1)");
            console.log("Buy 5 tickets:  lottery.buyTicket(1, 5)");
            console.log("Buy 10 tickets: lottery.buyTicket(1, 10)");
            
            // Calculate cost for different quantities
            console.log("\nCost table for Camp 1:");
            for (uint256 i = 1; i <= 10; i++) {
                uint256 cost = (ticketPrice * i) / 1e18;
                console.log("Qty:", i);
                console.log("Cost:", cost, "tokens");
            }
            
            // Check user balance
            uint256 userBalance = token.balanceOf(myAccount);
            console.log("\nYour token balance:", userBalance / 1e18, "tokens");
            
            // Check if you have a ticket in this round
            uint8 yourTicket = lottery.userTickets(currentRoundId, myAccount);
            if (yourTicket > 0) {
                console.log("You already have a ticket in Camp", yourTicket);
                uint256 yourBetAmount = lottery.userBetAmounts(currentRoundId, myAccount);
                console.log("Your total bet:", yourBetAmount / 1e18, "tokens");
            } else {
                console.log("You don't have a ticket in this round yet");
            }
        } else {
            console.log("Round is not active (closed or not started)");
        }
        
        console.log("\n========================================");
        console.log("KEY CHANGES:");
        console.log("1. buyTicket now accepts quantity: buyTicket(camp, quantity)");
        console.log("2. No winner? Money goes to carryoverPool, not treasury!");
        console.log("3. Jackpot accumulates until someone wins!");
        console.log("========================================");
    }
}
