// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {IVRFCoordinatorV2Plus} from "@chainlink/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";

/**
 * @title CheckVRFSubscription
 * @notice Vérifier le statut et les fonds de la subscription VRF
 */
contract CheckVRFSubscription is Script {
    function run() external view {
        // Configuration Sepolia VRF v2.5
        address vrfCoordinator = 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B;
        uint256 subscriptionId = 37803408183958024651964213932251977391893957803253892816600509470432480039047;
        
        IVRFCoordinatorV2Plus coordinator = IVRFCoordinatorV2Plus(vrfCoordinator);
        
        console.log("========================================");
        console.log("    CHECK VRF SUBSCRIPTION STATUS");
        console.log("========================================");
        console.log("VRF Coordinator:", vrfCoordinator);
        console.log("Subscription ID:", subscriptionId);
        console.log("Network: Sepolia");
        
        console.log("\n=== SUBSCRIPTION BALANCE ===");
        
        try coordinator.getSubscription(subscriptionId) returns (
            uint96 balance,
            uint96 nativeBalance,
            uint64 reqCount,
            address owner,
            address[] memory consumers
        ) {
            console.log("LINK Balance (wei):", balance);
            console.log("LINK Balance (units):", balance / 1e18);
            console.log("ETH Balance (wei):", nativeBalance);
            console.log("ETH Balance (units):", nativeBalance / 1e18);
            console.log("Request Count:", reqCount);
            console.log("Owner:", owner);
            console.log("Number of Consumers:", consumers.length);
            
            if (consumers.length > 0) {
                console.log("\n=== CONSUMERS ===");
                for (uint256 i = 0; i < consumers.length; i++) {
                    console.log("Consumer", i, ":", consumers[i]);
                }
            }
            
            if (balance == 0 && nativeBalance == 0) {
                console.log("\n!!! CRITICAL: NO FUNDS IN SUBSCRIPTION !!!!");
                console.log("Your VRF requests will FAIL until you fund it!");
                console.log("Add LINK or ETH at: https://vrf.chain.link/sepolia");
            } else {
                console.log("\nSubscription has funds - OK");
            }
        } catch Error(string memory reason) {
            console.log("ERROR:", reason);
        } catch {
            console.log("ERROR: Could not retrieve subscription info");
        }
        
        console.log("\n========================================");
        console.log("QUICK FIX:");
        console.log("1. Go to https://vrf.chain.link/sepolia");
        console.log("2. Login with your wallet");
        console.log("3. Select subscription ID");
        console.log("4. Fund with LINK or ETH (native)");
        console.log("========================================");
    }
}
