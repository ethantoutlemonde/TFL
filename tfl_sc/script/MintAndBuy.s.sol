// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Lottery} from "../src/Lottery.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MintAndBuy
 * @notice Script pour mint des tokens et acheter des tickets pour un wallet
 * 
 * USAGE :
 * =======
 * 
 * # Acheter des tickets pour un wallet (camp 1)
 * forge script script/MintAndBuy.s.sol --tc BuyForWallet \
 *   --rpc-url $SEPOLIA_RPC_URL \
 *   --private-key $PRIVATE_KEY \
 *   --broadcast \
 *   --sig "run(address,uint256,uint8)" \
 *   <WALLET_ADDRESS> <NB_TICKETS> <CAMP>
 * 
 * EXEMPLE :
 * =========
 * forge script script/MintAndBuy.s.sol --tc BuyForWallet \
 *   --rpc-url $SEPOLIA_RPC_URL \
 *   --private-key $PRIVATE_KEY \
 *   --broadcast \
 *   --sig "run(address,uint256,uint8)" \
 *   0x1234...abcd 3 1
 * 
 * Cela va :
 * 1. Mint 3 × ticketPrice tokens pour le wallet
 * 2. Le wallet devra ensuite approve + buyTicket lui-même
 * 
 * OU utiliser TransferAndBuy pour tout faire en une fois (si le wallet a déjà les tokens)
 */

interface IMockERC20 {
    function mint(address to, uint256 amount) external;
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

/**
 * @notice Mint des tokens pour un wallet
 */
contract MintTokens is Script {
    function run(address wallet, uint256 amount) external {
        address paymentToken = vm.envAddress("PAYMENT_TOKEN");
        
        console.log("========================================");
        console.log("         MINT TOKENS");
        console.log("========================================");
        console.log("Wallet:", wallet);
        console.log("Amount:", amount);
        console.log("Token:", paymentToken);
        
        vm.startBroadcast();
        
        IMockERC20(paymentToken).mint(wallet, amount);
        console.log("Tokens minted!");
        
        vm.stopBroadcast();
        
        console.log("New balance:", IMockERC20(paymentToken).balanceOf(wallet));
        console.log("========================================");
    }
}

/**
 * @notice Transfère des tokens à un wallet pour qu'il puisse acheter des tickets
 */
contract TransferTokens is Script {
    function run(address wallet, uint256 nbTickets) external {
        address lotteryAddress = vm.envAddress("LOTTERY_ADDRESS");
        address paymentToken = vm.envAddress("PAYMENT_TOKEN");
        
        Lottery lottery = Lottery(lotteryAddress);
        uint256 ticketPrice = lottery.ticketPrice();
        uint256 totalAmount = ticketPrice * nbTickets;
        
        console.log("========================================");
        console.log("       TRANSFER TOKENS");
        console.log("========================================");
        console.log("Wallet:", wallet);
        console.log("Nb Tickets:", nbTickets);
        console.log("Ticket Price:", ticketPrice);
        console.log("Total Amount:", totalAmount);
        
        vm.startBroadcast();
        
        IMockERC20(paymentToken).transfer(wallet, totalAmount);
        console.log("Tokens transferred!");
        
        vm.stopBroadcast();
        
        console.log("Wallet balance:", IMockERC20(paymentToken).balanceOf(wallet));
        console.log("========================================");
        console.log("");
        console.log("Next step for wallet to buy tickets:");
        console.log("1. Approve token on Etherscan");
        console.log("2. Call buyTicket(camp) on Lottery");
    }
}

/**
 * @notice Acheter des tickets pour soi-même avec paramètres en ligne de commande
 */
contract BuyTicketsWithParams is Script {
    function run(uint8 camp, uint256 nbTickets) external {
        address lotteryAddress = vm.envAddress("LOTTERY_ADDRESS");
        address paymentToken = vm.envAddress("PAYMENT_TOKEN");
        
        Lottery lottery = Lottery(lotteryAddress);
        IMockERC20 token = IMockERC20(paymentToken);
        
        uint256 ticketPrice = lottery.ticketPrice();
        uint256 totalCost = ticketPrice * nbTickets;
        
        console.log("========================================");
        console.log("         BUY TICKETS");
        console.log("========================================");
        console.log("Camp:", camp);
        console.log("Nb Tickets:", nbTickets);
        console.log("Ticket Price:", ticketPrice);
        console.log("Total Cost:", totalCost);
        
        vm.startBroadcast();
        
        // Approve si nécessaire
        uint256 allowance = token.allowance(msg.sender, lotteryAddress);
        if (allowance < totalCost) {
            console.log("Approving tokens...");
            token.approve(lotteryAddress, type(uint256).max);
        }
        
        // Acheter tous les tickets en une seule transaction
        lottery.buyTicket(camp, nbTickets);
        console.log("Purchased", nbTickets, "tickets!");
        
        vm.stopBroadcast();
        
        console.log("========================================");
    }
}

/**
 * @notice Vérifier les infos d'un wallet
 */
contract CheckWallet is Script {
    function run(address wallet) external view {
        address lotteryAddress = vm.envAddress("LOTTERY_ADDRESS");
        address paymentToken = vm.envAddress("PAYMENT_TOKEN");
        
        Lottery lottery = Lottery(lotteryAddress);
        IMockERC20 token = IMockERC20(paymentToken);
        
        uint256 currentRoundId = lottery.currentRoundId();
        uint256 ticketPrice = lottery.ticketPrice();
        uint256 balance = token.balanceOf(wallet);
        uint256 allowance = token.allowance(wallet, lotteryAddress);
        
        uint8 ticketType = lottery.userTickets(currentRoundId, wallet);
        uint256 betAmount = lottery.userBetAmounts(currentRoundId, wallet);
        
        console.log("========================================");
        console.log("         WALLET INFO");
        console.log("========================================");
        console.log("Wallet:", wallet);
        console.log("");
        console.log("=== TOKEN ===");
        console.log("Balance:", balance);
        console.log("Allowance:", allowance);
        console.log("Ticket Price:", ticketPrice);
        console.log("Can buy tickets:", balance >= ticketPrice && allowance >= ticketPrice ? 1 : 0);
        console.log("");
        console.log("=== LOTTERY (Round", currentRoundId, ") ===");
        console.log("Ticket Type:", ticketType);
        console.log("Bet Amount:", betAmount);
        console.log("Nb Tickets:", ticketPrice > 0 ? betAmount / ticketPrice : 0);
        console.log("========================================");
    }
}

/**
 * @notice Génère la commande cast pour qu'un wallet fasse approve
 */
contract GenerateApproveCommand is Script {
    function run(address wallet) external view {
        address lotteryAddress = vm.envAddress("LOTTERY_ADDRESS");
        address paymentToken = vm.envAddress("PAYMENT_TOKEN");
        
        console.log("========================================");
        console.log("  APPROVE COMMAND FOR WALLET");
        console.log("========================================");
        console.log("");
        console.log("Le wallet doit executer cette commande:");
        console.log("");
        console.log("cast send", paymentToken);
        console.log('  "approve(address,uint256)"');
        console.log(" ", lotteryAddress);
        console.log("  115792089237316195423570985008687907853269984665640564039457584007913129639935");
        console.log("  --private-key <WALLET_PRIVATE_KEY>");
        console.log("  --rpc-url $SEPOLIA_RPC_URL");
        console.log("");
        console.log("========================================");
    }
}
