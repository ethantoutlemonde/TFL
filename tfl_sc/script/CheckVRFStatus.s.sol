// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Lottery} from "../src/Lottery.sol";

/**
 * @title CheckVRFStatus
 * @notice Vérifier l'état des requêtes VRF en attente
 */
contract CheckVRFStatus is Script {
    function run() external view {
        address lotteryAddress = vm.envAddress("LOTTERY_ADDRESS");
        Lottery lottery = Lottery(lotteryAddress);
        
        console.log("========================================");
        console.log("      CHECK VRF STATUS");
        console.log("========================================");
        console.log("Lottery contract:", lotteryAddress);
        
        uint256 currentRoundId = lottery.currentRoundId();
        console.log("\n=== VRF CONFIGURATION ===");
        console.log("VRF Coordinator:", address(lottery.vrfCoordinator()));
        console.log("Subscription ID:", lottery.subscriptionId());
        console.log("Key Hash:", bytes32ToHex(lottery.keyHash()));
        console.log("Callback Gas Limit:", lottery.callbackGasLimit());
        
        console.log("\n=== CURRENT ROUND INFO ===");
        console.log("Current Round ID:", currentRoundId);
        
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
        console.log("Total Tickets:", totalTickets);
        
        // Need to access rounds mapping directly (it's public)
        // But we can't access it directly from external script, so use vrfRequestToRound instead
        
        if (!finalized) {
            console.log("\n=== VRF REQUEST STATUS ===");
            if (isActive) {
                console.log("Round is still ACTIVE - not closed yet");
            } else {
                console.log("Round is CLOSED - waiting for VRF callback");
                console.log("Current time:", block.timestamp);
                if (block.timestamp >= endTime) {
                    console.log("Round ended at:", endTime);
                    console.log("Time elapsed since end:", block.timestamp - endTime, "seconds");
                }
            }
        } else {
            console.log("\n=== VRF COMPLETED ===");
            console.log("Winning Camp:", winningCamp);
        }
        
        // Check if there are any other pending rounds
        console.log("\n=== CHECKING PREVIOUS ROUNDS ===");
        if (currentRoundId > 1) {
            for (uint256 i = currentRoundId > 5 ? currentRoundId - 5 : 1; i < currentRoundId; i++) {
                (uint256 prev_start, uint256 prev_end, bool prev_active, bool prev_finalized, uint8 prev_winning, uint256 prev_total, ,) = lottery.getRoundInfo(i);
                
                if (prev_finalized) {
                    console.log("Round", i, "- FINALIZED with winning camp:", prev_winning);
                } else if (!prev_active) {
                    console.log("Round", i, "- CLOSED (awaiting VRF callback)");
                }
            }
        }
        
        console.log("\n========================================");
        console.log("TIP: Check Chainlink VRF Status:");
        console.log("   https://vrf.chain.link/sepolia");
        console.log("========================================");
    }
    
    // Helper function to convert bytes32 to hex string
    function bytes32ToHex(bytes32 value) internal pure returns (string memory) {
        bytes memory hexChars = "0123456789abcdef";
        bytes memory result = new bytes(66);
        result[0] = '0';
        result[1] = 'x';
        
        for (uint256 i = 0; i < 32; i++) {
            uint8 val = uint8(value[i]);
            result[2 + i * 2] = hexChars[val >> 4];
            result[2 + i * 2 + 1] = hexChars[val & 0x0f];
        }
        
        return string(result);
    }
}
