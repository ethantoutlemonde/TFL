// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Lottery} from "../src/Lottery.sol";

/**
 * @title DeployLottery
 * @notice Script de déploiement du contrat Lottery
 * 
 * USAGE :
 * ========
 * 
 * 1. LOCAL (Anvil) :
 *    forge script script/DeployLottery.s.sol --rpc-url http://localhost:8545 --broadcast
 * 
 * 2. SEPOLIA :
 *    forge script script/DeployLottery.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
 * 
 * 3. MAINNET :
 *    forge script script/DeployLottery.s.sol --rpc-url $MAINNET_RPC_URL --broadcast --verify
 * 
 * VARIABLES D'ENVIRONNEMENT REQUISES :
 * =====================================
 * - PRIVATE_KEY : Clé privée du déployeur
 * - PAYMENT_TOKEN : Adresse du token ERC20 pour les paiements
 * - TREASURY : Adresse de la trésorerie
 * - VRF_COORDINATOR : Adresse du VRF Coordinator Chainlink
 * - VRF_SUBSCRIPTION_ID : ID de la subscription Chainlink VRF
 * - VRF_KEY_HASH : Key hash pour Chainlink VRF
 */
contract DeployLottery is Script {
    
    // ========== CONFIGURATION PAR RÉSEAU ==========
    
    // Sepolia Testnet
    address constant SEPOLIA_VRF_COORDINATOR = 0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625;
    bytes32 constant SEPOLIA_KEY_HASH = 0x474e34a077df58807dbe9c9096d1a477f3b7b9e4ab07c0e8dcf0d22ebf9e9b8c;
    
    // Mainnet
    address constant MAINNET_VRF_COORDINATOR = 0x271682DEB8C4E0901D1a1550aD2e64D568E69909;
    bytes32 constant MAINNET_KEY_HASH = 0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef;
    
    // Polygon Mainnet
    address constant POLYGON_VRF_COORDINATOR = 0xAE975071Be8F8eE67addBC1A82488F1C24858067;
    bytes32 constant POLYGON_KEY_HASH = 0x6e099d640cde6de9d40ac749b4b594126b0169747122711109c9985d47751f93;

    function run() external {
        // Charger les variables d'environnement
        address paymentToken = vm.envAddress("PAYMENT_TOKEN");
        address treasury = vm.envAddress("TREASURY");
        address vrfCoordinator = vm.envAddress("VRF_COORDINATOR");
        uint64 subscriptionId = uint64(vm.envUint("VRF_SUBSCRIPTION_ID"));
        bytes32 keyHash = vm.envBytes32("VRF_KEY_HASH");
        
        console.log("=== DEPLOIEMENT LOTTERY ===");
        console.log("Payment Token:", paymentToken);
        console.log("Treasury:", treasury);
        console.log("VRF Coordinator:", vrfCoordinator);
        console.log("Subscription ID:", subscriptionId);
        
        vm.startBroadcast();
        
        // Déployer le contrat
        Lottery lottery = new Lottery(
            paymentToken,
            treasury,
            vrfCoordinator,
            subscriptionId,
            keyHash
        );
        
        console.log("=== DEPLOIEMENT REUSSI ===");
        console.log("Lottery deployee a:", address(lottery));
        console.log("Owner:", lottery.owner());
        console.log("Ticket Price:", lottery.ticketPrice());
        console.log("Round Duration:", lottery.roundDuration());
        console.log("Current Round ID:", lottery.currentRoundId());
        
        vm.stopBroadcast();
        
        // Rappel important
        console.log("");
        console.log("=== ETAPES SUIVANTES ===");
        console.log("1. Ajouter le contrat comme consumer VRF :");
        console.log("   VRFCoordinatorV2.addConsumer(subscriptionId, lottery)");
        console.log("2. Financer la subscription VRF avec LINK");
        console.log("3. Configurer l'option de loterie si necessaire :");
        console.log("   lottery.setLotteryOption(1) // 2 camps");
        console.log("   lottery.setLotteryOption(2) // 6 camps");
    }
}

/**
 * @title DeployLotteryLocal
 * @notice Script pour déploiement local avec mock VRF
 * 
 * USAGE :
 *    anvil (dans un terminal)
 *    forge script script/DeployLottery.s.sol:DeployLotteryLocal --rpc-url http://localhost:8545 --broadcast
 */
contract DeployLotteryLocal is Script {
    function run() external {
        // Clé privée par défaut d'Anvil (compte 0)
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== DEPLOIEMENT LOCAL ===");
        console.log("Deployer:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Déployer un mock ERC20
        MockERC20 token = new MockERC20("Mock USDC", "mUSDC");
        console.log("Mock Token deploye:", address(token));
        
        // Déployer un mock VRF Coordinator
        MockVRFCoordinator vrfCoordinator = new MockVRFCoordinator();
        console.log("Mock VRF Coordinator deploye:", address(vrfCoordinator));
        
        // Créer une subscription
        uint64 subId = vrfCoordinator.createSubscription();
        vrfCoordinator.fundSubscription(subId, 10 ether);
        console.log("Subscription ID:", subId);
        
        // Déployer Lottery
        Lottery lottery = new Lottery(
            address(token),
            deployer, // Treasury = deployer pour les tests
            address(vrfCoordinator),
            subId,
            bytes32(uint256(1)) // Key hash fictif
        );
        
        // Ajouter comme consumer
        vrfCoordinator.addConsumer(subId, address(lottery));
        
        // Mint des tokens pour tester
        token.mint(deployer, 1000 * 10**18);
        
        console.log("");
        console.log("=== DEPLOIEMENT LOCAL REUSSI ===");
        console.log("Lottery:", address(lottery));
        console.log("Token:", address(token));
        console.log("VRF Coordinator:", address(vrfCoordinator));
        console.log("");
        console.log("Pour tester :");
        console.log("1. token.approve(lottery, amount)");
        console.log("2. lottery.buyTicket(1)");
        
        vm.stopBroadcast();
    }
}

// ========== CONTRACTS MOCK POUR TESTS LOCAUX ==========

contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }
    
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

contract MockVRFCoordinator {
    uint64 private _subscriptionId;
    uint256 private _requestId;
    
    struct Subscription {
        uint96 balance;
        address owner;
        address[] consumers;
    }
    
    mapping(uint64 => Subscription) public subscriptions;
    mapping(uint256 => address) public requestToConsumer;
    
    function createSubscription() external returns (uint64) {
        _subscriptionId++;
        subscriptions[_subscriptionId].owner = msg.sender;
        return _subscriptionId;
    }
    
    function fundSubscription(uint64 subId, uint96 amount) external {
        subscriptions[subId].balance += amount;
    }
    
    function addConsumer(uint64 subId, address consumer) external {
        subscriptions[subId].consumers.push(consumer);
    }
    
    function requestRandomWords(
        bytes32,
        uint64,
        uint16,
        uint32,
        uint32
    ) external returns (uint256) {
        _requestId++;
        requestToConsumer[_requestId] = msg.sender;
        return _requestId;
    }
    
    // Fonction pour simuler la réponse VRF
    function fulfillRandomWords(uint256 requestId, address consumer) external {
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = uint256(keccak256(abi.encode(requestId, block.timestamp)));
        
        // Appeler le callback
        (bool success, ) = consumer.call(
            abi.encodeWithSignature("rawFulfillRandomWords(uint256,uint256[])", requestId, randomWords)
        );
        require(success, "Callback failed");
    }
}
