// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Lottery.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2Mock.sol";

/**
 * @title Mock ERC20 pour les tests
 */
contract MockERC20 is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {
        _mint(msg.sender, 1_000_000 * 10**18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/**
 * @title Tests complets du contrat Lottery
 */
contract LotteryTest is Test {
    Lottery public lottery;
    MockERC20 public token;
    VRFCoordinatorV2Mock public vrfCoordinator;

    address public owner = address(this);
    address public treasury = address(0x1234);
    address public player1 = address(0x1);
    address public player2 = address(0x2);
    address public player3 = address(0x3);
    address public player4 = address(0x4);

    uint256 public constant TICKET_PRICE = 5 * 10**18; // 5 tokens
    uint8 public constant NUM_TICKET_TYPES = 3; // 3 camps
    uint256 public constant ROUND_DURATION = 86400; // 24h
    
    // Paramètres VRF Mock
    uint96 public constant BASE_FEE = 100000000000000000; // 0.1 LINK
    uint96 public constant GAS_PRICE_LINK = 1000000000; // 1 gwei in LINK
    uint64 public subId;

    event TicketPurchased(uint256 indexed roundId, address indexed player, uint8 ticketType, uint256 amount);
    event RoundFinalized(uint256 indexed roundId, uint8 winningTicketType, uint256 totalPrize);
    event WinningsDistributed(uint256 indexed roundId, address indexed player, uint256 amount);

    function setUp() public {
        // Déployer le token mock
        token = new MockERC20();

        // Déployer le VRF coordinator mock
        vrfCoordinator = new VRFCoordinatorV2Mock(BASE_FEE, GAS_PRICE_LINK);
        
        // Créer une souscription
        subId = vrfCoordinator.createSubscription();
        
        // Financer la souscription avec 10 LINK
        vrfCoordinator.fundSubscription(subId, 10 * 10**18);

        // Déployer le contrat Lottery
        lottery = new Lottery(
            address(token),
            treasury,
            NUM_TICKET_TYPES,
            address(vrfCoordinator),
            subId,
            bytes32(uint256(1)) // key hash
        );
        
        // Ajouter le contrat Lottery comme consumer
        vrfCoordinator.addConsumer(subId, address(lottery));

        // Distribuer des tokens aux joueurs
        token.mint(player1, 100 * 10**18);
        token.mint(player2, 100 * 10**18);
        token.mint(player3, 100 * 10**18);
        token.mint(player4, 100 * 10**18);

        // Approuver le contrat pour tous les joueurs
        vm.prank(player1);
        token.approve(address(lottery), type(uint256).max);
        vm.prank(player2);
        token.approve(address(lottery), type(uint256).max);
        vm.prank(player3);
        token.approve(address(lottery), type(uint256).max);
        vm.prank(player4);
        token.approve(address(lottery), type(uint256).max);
    }

    // ========== TESTS D'ACHAT DE TICKETS ==========

    function testBuyTicket() public {
        uint256 roundId = lottery.currentRoundId();
        uint256 balanceBefore = token.balanceOf(player1);

        vm.prank(player1);
        vm.expectEmit(true, true, false, true);
        emit TicketPurchased(roundId, player1, 1, TICKET_PRICE);
        lottery.buyTicket(1);

        // Vérifier que le token a été transféré
        assertEq(token.balanceOf(player1), balanceBefore - TICKET_PRICE);
        assertEq(token.balanceOf(address(lottery)), TICKET_PRICE);

        // Vérifier que le ticket est enregistré
        assertEq(lottery.getUserTicket(roundId, player1), 1);
        assertTrue(lottery.hasTicket(roundId, player1));

        // Vérifier les statistiques
        (,,,,, uint256 totalTickets, uint256[] memory pools, uint256[] memory counts) = lottery.getRoundInfo(roundId);
        assertEq(totalTickets, 1);
        assertEq(pools[0], TICKET_PRICE); // Camp 1
        assertEq(counts[0], 1);
    }

    function testCannotBuyTwoTicketsInSameRound() public {
        vm.startPrank(player1);
        lottery.buyTicket(1);

        // Tenter d'acheter un second ticket
        vm.expectRevert(Lottery.AlreadyHasTicket.selector);
        lottery.buyTicket(2);
        vm.stopPrank();
    }

    function testCannotBuyInvalidTicketType() public {
        vm.prank(player1);
        vm.expectRevert(Lottery.InvalidTicketType.selector);
        lottery.buyTicket(0); // Type 0 invalide

        vm.prank(player1);
        vm.expectRevert(Lottery.InvalidTicketType.selector);
        lottery.buyTicket(4); // Type 4 invalide (max est 3)
    }

    function testCannotBuyAfterRoundEnds() public {
        // Avancer le temps après la fin du round
        vm.warp(block.timestamp + ROUND_DURATION + 1);

        vm.prank(player1);
        vm.expectRevert(Lottery.RoundNotActive.selector);
        lottery.buyTicket(1);
    }

    // ========== TESTS DES POOLS ==========

    function testPoolsAreCorrect() public {
        uint256 roundId = lottery.currentRoundId();

        // Player1 et Player2 achètent camp 1
        vm.prank(player1);
        lottery.buyTicket(1);
        vm.prank(player2);
        lottery.buyTicket(1);

        // Player3 achète camp 2
        vm.prank(player3);
        lottery.buyTicket(2);

        // Player4 achète camp 3
        vm.prank(player4);
        lottery.buyTicket(3);

        // Vérifier les pools
        (,,,,, uint256 totalTickets, uint256[] memory pools, uint256[] memory counts) = lottery.getRoundInfo(roundId);
        
        assertEq(totalTickets, 4);
        assertEq(pools[0], TICKET_PRICE * 2); // Camp 1: 2 tickets
        assertEq(pools[1], TICKET_PRICE);     // Camp 2: 1 ticket
        assertEq(pools[2], TICKET_PRICE);     // Camp 3: 1 ticket
        assertEq(counts[0], 2);
        assertEq(counts[1], 1);
        assertEq(counts[2], 1);
    }

    // ========== TESTS DE TIRAGE VRF ==========

    function testCloseRoundAndRequestRandomness() public {
        vm.prank(player1);
        lottery.buyTicket(1);

        // Avancer le temps
        vm.warp(block.timestamp + ROUND_DURATION + 1);

        // Fermer le round
        lottery.closeRound();

        // Vérifier que le round n'est plus actif
        (,, bool isActive, bool isFinalized,,,,,) = lottery.getRoundInfo(1);
        assertFalse(isActive);
        assertFalse(isFinalized);
    }

    function testCannotCloseActiveRound() public {
        vm.expectRevert(Lottery.RoundNotEnded.selector);
        lottery.closeRound();
    }

    // ========== TESTS DE DISTRIBUTION ==========

    function testDistributionWithWinners() public {
        uint256 roundId = lottery.currentRoundId();

        // Player1 et Player2 achètent camp 1 (gagnants)
        vm.prank(player1);
        lottery.buyTicket(1);
        vm.prank(player2);
        lottery.buyTicket(1);

        // Player3 et Player4 achètent camp 2 (perdants)
        vm.prank(player3);
        lottery.buyTicket(2);
        vm.prank(player4);
        lottery.buyTicket(2);

        // Avancer le temps et fermer le round
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        lottery.closeRound();

        // Récupérer le requestId pour simuler VRF
        (,,,,,, uint256 vrfRequestId,) = lottery.rounds(roundId);

        // Simuler VRF retournant 0 (camp 1 gagne: 0 % 3 + 1 = 1)
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 0; // Résultat: camp 1

        vrfCoordinator.fulfillRandomWords(vrfRequestId, address(lottery));

        // Vérifier que le round est finalisé
        (,,,bool isFinalized, uint8 winningType,,,,,) = lottery.getRoundInfo(roundId);
        assertTrue(isFinalized);
        assertEq(winningType, 1);

        // Calculer les gains attendus
        uint256 losingPool = TICKET_PRICE * 2; // 2 tickets du camp 2
        uint256 treasuryFee = (losingPool * 200) / 10000; // 2%
        uint256 prizePool = losingPool - treasuryFee;
        uint256 sharePerWinner = prizePool / 2; // 2 gagnants

        // Vérifier les soldes retirables
        assertEq(lottery.withdrawable(player1), TICKET_PRICE + sharePerWinner);
        assertEq(lottery.withdrawable(player2), TICKET_PRICE + sharePerWinner);
        assertEq(lottery.withdrawable(player3), 0);
        assertEq(lottery.withdrawable(player4), 0);
        assertEq(lottery.treasuryBalance(), treasuryFee);
    }

    function testDistributionNoWinners() public {
        uint256 roundId = lottery.currentRoundId();

        // Seulement camp 1 et camp 2 ont des tickets, personne sur camp 3
        vm.prank(player1);
        lottery.buyTicket(1);
        vm.prank(player2);
        lottery.buyTicket(2);

        uint256 totalPool = TICKET_PRICE * 2;

        // Avancer le temps et fermer le round
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        lottery.closeRound();

        // Récupérer le requestId
        (,,,,,, uint256 vrfRequestId,) = lottery.rounds(roundId);

        // Simuler VRF retournant 2 (camp 3 gagne, mais personne dessus)
        // Pour obtenir camp 3 avec modulo: 2 % 3 = 2, donc 2 + 1 = 3
        vrfCoordinator.fulfillRandomWords(vrfRequestId, address(lottery));

        // Vérifier que tout va à la trésorerie
        assertEq(lottery.treasuryBalance(), totalPool);
        assertEq(lottery.withdrawable(player1), 0);
        assertEq(lottery.withdrawable(player2), 0);
    }

    function testWithdraw() public {
        uint256 roundId = lottery.currentRoundId();

        // Player1 achète camp 1 (gagnant)
        vm.prank(player1);
        lottery.buyTicket(1);

        // Player2 achète camp 2 (perdant)
        vm.prank(player2);
        lottery.buyTicket(2);

        // Finaliser le round avec camp 1 gagnant
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        lottery.closeRound();

        (,,,,,, uint256 vrfRequestId,) = lottery.rounds(roundId);
        vrfCoordinator.fulfillRandomWords(vrfRequestId, address(lottery));

        // Player1 retire ses gains
        uint256 withdrawableAmount = lottery.withdrawable(player1);
        uint256 balanceBefore = token.balanceOf(player1);

        vm.prank(player1);
        lottery.withdraw();

        assertEq(token.balanceOf(player1), balanceBefore + withdrawableAmount);
        assertEq(lottery.withdrawable(player1), 0);
    }

    function testCannotWithdrawWithoutWinnings() public {
        vm.prank(player1);
        vm.expectRevert(Lottery.NoWinningsToWithdraw.selector);
        lottery.withdraw();
    }

    function testWithdrawTreasury() public {
        uint256 roundId = lottery.currentRoundId();

        vm.prank(player1);
        lottery.buyTicket(1);
        vm.prank(player2);
        lottery.buyTicket(2);

        // Finaliser
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        lottery.closeRound();

        (,,,,,, uint256 vrfRequestId,) = lottery.rounds(roundId);
        vrfCoordinator.fulfillRandomWords(vrfRequestId, address(lottery));

        uint256 treasuryAmount = lottery.treasuryBalance();
        uint256 balanceBefore = token.balanceOf(treasury);

        // Owner retire la trésorerie
        lottery.withdrawTreasury();

        assertEq(token.balanceOf(treasury), balanceBefore + treasuryAmount);
        assertEq(lottery.treasuryBalance(), 0);
    }

    // ========== TESTS DES FONCTIONS ADMIN ==========

    function testSetTicketPrice() public {
        uint256 newPrice = 10 * 10**18;
        lottery.setTicketPrice(newPrice);
        assertEq(lottery.ticketPrice(), newPrice);
    }

    function testCannotSetZeroTicketPrice() public {
        vm.expectRevert(Lottery.InvalidPrice.selector);
        lottery.setTicketPrice(0);
    }

    function testSetRoundDuration() public {
        uint256 newDuration = 48 * 3600; // 48h
        lottery.setRoundDuration(newDuration);
        assertEq(lottery.roundDuration(), newDuration);
    }

    function testCannotSetTooShortDuration() public {
        vm.expectRevert(Lottery.InvalidDuration.selector);
        lottery.setRoundDuration(3599); // < 1h
    }

    function testSetTreasury() public {
        address newTreasury = address(0x9999);
        lottery.setTreasury(newTreasury);
        assertEq(lottery.treasury(), newTreasury);
    }

    function testCannotSetZeroTreasury() public {
        vm.expectRevert(Lottery.InvalidTreasuryAddress.selector);
        lottery.setTreasury(address(0));
    }

    function testPauseAndUnpause() public {
        lottery.pause();
        
        vm.prank(player1);
        vm.expectRevert("Pausable: paused");
        lottery.buyTicket(1);

        lottery.unpause();
        
        vm.prank(player1);
        lottery.buyTicket(1); // Devrait fonctionner
    }

    // ========== TESTS DE NOUVEAU ROUND ==========

    function testNewRoundStartsAutomatically() public {
        uint256 firstRoundId = lottery.currentRoundId();
        
        vm.prank(player1);
        lottery.buyTicket(1);

        // Finaliser le premier round
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        lottery.closeRound();

        (,,,,,, uint256 vrfRequestId,) = lottery.rounds(firstRoundId);
        vrfCoordinator.fulfillRandomWords(vrfRequestId, address(lottery));

        // Vérifier que le nouveau round a démarré
        uint256 newRoundId = lottery.currentRoundId();
        assertEq(newRoundId, firstRoundId + 1);

        (,, bool isActive,,,,,,,) = lottery.getRoundInfo(newRoundId);
        assertTrue(isActive);
    }

    function testCanBuyTicketInNewRound() public {
        // Finaliser le premier round
        vm.prank(player1);
        lottery.buyTicket(1);
        
        uint256 firstRoundId = lottery.currentRoundId();
        
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        lottery.closeRound();

        (,,,,,, uint256 vrfRequestId,) = lottery.rounds(firstRoundId);
        vrfCoordinator.fulfillRandomWords(vrfRequestId, address(lottery));

        // Acheter un ticket dans le nouveau round
        uint256 newRoundId = lottery.currentRoundId();
        vm.prank(player1);
        lottery.buyTicket(2); // Player1 peut acheter à nouveau

        assertEq(lottery.getUserTicket(newRoundId, player1), 2);
    }

    // ========== TESTS DE SCÉNARIOS COMPLEXES ==========

    function testComplexScenarioMultiplePlayers() public {
        uint256 roundId = lottery.currentRoundId();

        // Distribution: Camp 1 (1 joueur), Camp 2 (2 joueurs), Camp 3 (1 joueur)
        vm.prank(player1);
        lottery.buyTicket(1);
        
        vm.prank(player2);
        lottery.buyTicket(2);
        
        vm.prank(player3);
        lottery.buyTicket(2);
        
        vm.prank(player4);
        lottery.buyTicket(3);

        // Camp 2 gagne
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        lottery.closeRound();

        (,,,,,, uint256 vrfRequestId,) = lottery.rounds(roundId);
        
        // Forcer un nombre aléatoire qui donne camp 2 (résultat 1 → 1 % 3 = 1 → 1 + 1 = 2)
        vm.mockCall(
            address(vrfCoordinator),
            abi.encodeWithSelector(VRFCoordinatorV2Mock.fulfillRandomWords.selector),
            abi.encode()
        );
        
        vrfCoordinator.fulfillRandomWords(vrfRequestId, address(lottery));

        // Pool perdant = camp 1 + camp 3 = 2 * TICKET_PRICE
        uint256 losingPool = TICKET_PRICE * 2;
        uint256 treasuryFee = (losingPool * 200) / 10000;
        uint256 prizePool = losingPool - treasuryFee;
        uint256 sharePerWinner = prizePool / 2; // 2 gagnants

        assertEq(lottery.withdrawable(player2), TICKET_PRICE + sharePerWinner);
        assertEq(lottery.withdrawable(player3), TICKET_PRICE + sharePerWinner);
        assertEq(lottery.withdrawable(player1), 0);
        assertEq(lottery.withdrawable(player4), 0);
    }

    function testEmptyRoundFinalizesImmediately() public {
        uint256 roundId = lottery.currentRoundId();
        
        // Aucun ticket acheté
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        lottery.closeRound();

        // Le round devrait être finalisé immédiatement
        (,, bool isActive, bool isFinalized,,,,,) = lottery.getRoundInfo(roundId);
        assertFalse(isActive);
        assertTrue(isFinalized);
        
        // Un nouveau round devrait avoir démarré
        assertEq(lottery.currentRoundId(), roundId + 1);
    }

    function testMultipleRoundsCycle() public {
        for (uint256 i = 0; i < 3; i++) {
            uint256 roundId = lottery.currentRoundId();
            
            // Achats
            vm.prank(player1);
            lottery.buyTicket(1);
            vm.prank(player2);
            lottery.buyTicket(2);
            
            // Finalisation
            vm.warp(block.timestamp + ROUND_DURATION + 1);
            lottery.closeRound();
            
            (,,,,,, uint256 vrfRequestId,) = lottery.rounds(roundId);
            vrfCoordinator.fulfillRandomWords(vrfRequestId, address(lottery));
            
            // Vérifier que le round est finalisé
            (,,, bool isFinalized,,,,,) = lottery.getRoundInfo(roundId);
            assertTrue(isFinalized);
        }
        
        // Vérifier qu'on est au round 4
        assertEq(lottery.currentRoundId(), 4);
    }
}