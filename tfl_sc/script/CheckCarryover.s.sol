// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Lottery} from "../src/Lottery.sol";

/**
 * @title CheckCarryover
 * @notice Vérifier le carryover pool et l'état complet
 */
contract CheckCarryover is Script {
    function run() external view {
        address lotteryAddress = vm.envAddress("LOTTERY_ADDRESS");
        Lottery lottery = Lottery(lotteryAddress);
        address myAccount = vm.addr(vm.envUint("PRIVATE_KEY"));
        
        console.log("========================================");
        console.log("      CHECK CARRYOVER POOL");
        console.log("========================================");
        
        uint256 carryover = lottery.carryoverPool();
        uint256 withdrawable = lottery.withdrawable(myAccount);
        uint256 treasuryBalance = lottery.treasuryBalance();
        
        console.log("Carryover Pool (wei):", carryover);
        console.log("Carryover Pool (tokens):", carryover / 1e18);
        
        console.log("\nYour Withdrawable (wei):", withdrawable);
        console.log("Your Withdrawable (tokens):", withdrawable / 1e18);
        
        console.log("\nTreasury Balance (wei):", treasuryBalance);
        console.log("Treasury Balance (tokens):", treasuryBalance / 1e18);
        
        uint256 currentRoundId = lottery.currentRoundId();
        console.log("\nCurrent Round ID:", currentRoundId);
        
        (
            uint256 startTime,
            uint256 endTime,
            bool isActive,
            bool isFinalized,
            uint8 winningCamp,
            uint256 totalTickets,
            ,
        ) = lottery.getRoundInfo(currentRoundId);
        
        console.log("Round Active:", isActive);
        console.log("Round Finalized:", isFinalized);
        console.log("Total Tickets:", totalTickets);
        console.log("Winning Camp:", winningCamp);
        
        // Check previous round
        if (currentRoundId > 1) {
            uint256 prevRound = currentRoundId - 1;
            (
                ,
                ,
                ,
                bool prev_finalized,
                uint8 prev_winning,
                uint256 prev_total,
                ,
            ) = lottery.getRoundInfo(prevRound);
            
            console.log("\nPrevious Round (", prevRound, ") ===");
            console.log("Finalized:", prev_finalized);
            console.log("Winning Camp:", prev_winning);
            console.log("Total Tickets:", prev_total);
        }
        
        console.log("\n========================================");
    }
}
