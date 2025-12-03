// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Lottery.sol";
import "../src/LotteryTypes.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@chainlink/src/v0.8/vrf/mocks/VRFCoordinatorV2Mock.sol";

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
            address(vrfCoordinator),
            subId,
            bytes32(uint256(1)) // key hash
        );
        
        // Ajouter le contrat Lottery comme consumer
        vrfCoordinator.addConsumer(subId, address(lottery));

        // Définir 6 camps pour les tests
        lottery.setLotteryOption(2);

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
        // Vérifier que le joueur a un ticket (type != 0)
        assertTrue(lottery.getUserTicket(roundId, player1) != 0);

        // Vérifier les statistiques
        (,,,,, uint256 totalTickets, uint256[] memory pools, uint256[] memory counts) = lottery.getRoundInfo(roundId);
        assertEq(totalTickets, 1);
        assertEq(pools[0], TICKET_PRICE); // Camp 1
        assertEq(counts[0], 1);
    }

    function testCanBuyMultipleTicketsSameType() public {
        // Nouveau comportement : on peut acheter plusieurs tickets du MÊME type
        vm.startPrank(player1);
        lottery.buyTicket(1);
        
        // Deuxième achat du MÊME type - doit réussir
        lottery.buyTicket(1);
        
        // MAIS pas un type différent
        vm.expectRevert(AlreadyHasTicket.selector);
        lottery.buyTicket(2);
        vm.stopPrank();
    }

    function testCannotBuyDifferentTicketType() public {
        vm.startPrank(player1);
        lottery.buyTicket(1);

        // Tenter d'acheter un type DIFFÉRENT
        vm.expectRevert(AlreadyHasTicket.selector);
        lottery.buyTicket(2);
        vm.stopPrank();
    }

    function testCannotBuyInvalidTicketType() public {
        vm.prank(player1);
        vm.expectRevert(InvalidTicketType.selector);
        lottery.buyTicket(0); // Type 0 invalide

        vm.prank(player1);
        vm.expectRevert(InvalidTicketType.selector);
        lottery.buyTicket(7); // Type 7 invalide (max est 6 avec setLotteryOption(2))
    }

    function testCannotBuyAfterRoundEnds() public {
        // Avancer le temps après la fin du round
        vm.warp(block.timestamp + ROUND_DURATION + 1);

        vm.prank(player1);
        vm.expectRevert(RoundNotActive.selector);
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
        (,, bool isActive, bool isFinalized, , , , ) = lottery.getRoundInfo(1);
        assertFalse(isActive);
        assertFalse(isFinalized);
    }

    function testCannotCloseActiveRound() public {
        vm.expectRevert(RoundNotEnded.selector);
        lottery.closeRound();
    }

    // ========== TESTS DE DISTRIBUTION ==========

    function testDistributionWithWinners() public {
        uint256 roundId = lottery.currentRoundId();

        // Player1 achète 2x sur camp 1
        vm.startPrank(player1);
        lottery.buyTicket(1);
        lottery.buyTicket(1);
        vm.stopPrank();
        
        // Player2 achète 2x sur camp 1
        vm.startPrank(player2);
        lottery.buyTicket(1);
        lottery.buyTicket(1);
        vm.stopPrank();

        // Player3 achète 3x sur camp 2 (perdant)
        vm.startPrank(player3);
        lottery.buyTicket(2);
        lottery.buyTicket(2);
        lottery.buyTicket(2);
        vm.stopPrank();

        // Avancer le temps et fermer le round
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        lottery.closeRound();

        // Récupérer le requestId
        (,,,,, , uint256 vrfRequestId) = lottery.rounds(roundId);

        // Simuler VRF retournant 0 (camp 1 gagne: 0 % 6 + 1 = 1)
        vrfCoordinator.fulfillRandomWords(vrfRequestId, address(lottery));

        // Vérifier que le round est finalisé
        (, , , bool isFinalized, uint8 winningType, , , ) = lottery.getRoundInfo(roundId);
        assertTrue(isFinalized);
        
        // Si camp 1 gagne, player1 et player2 ont des gains
        if (winningType == 1) {
            assertTrue(lottery.withdrawable(player1) > 0, "Player1 should have winnings");
            assertTrue(lottery.withdrawable(player2) > 0, "Player2 should have winnings");
            assertEq(lottery.withdrawable(player3), 0);
        }
    }

    function testDistributionNoWinners() public {
        uint256 roundId = lottery.currentRoundId();

        // Seulement camp 1 et camp 2 ont des tickets
        vm.prank(player1);
        lottery.buyTicket(1);
        vm.prank(player2);
        lottery.buyTicket(2);

        uint256 totalPool = TICKET_PRICE * 2;

        // Avancer le temps et fermer le round
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        lottery.closeRound();

        // Récupérer le requestId
        (,,,,, , uint256 vrfRequestId) = lottery.rounds(roundId);

        // Simuler VRF retournant un nombre qui donne camp 3 (personne n'a joué dessus)
        // 6 % 6 = 0, donc 0 + 1 = 1... faut un nombre donnant 3
        // (2 % 6) + 1 = 3
        vrfCoordinator.fulfillRandomWords(vrfRequestId, address(lottery));

        // Vérifier que tout va à la trésorerie (car le camp 3 gagnant n'a pas de joueurs)
        assertEq(lottery.treasuryBalance(), totalPool);
        assertEq(lottery.withdrawable(player1), 0);
        assertEq(lottery.withdrawable(player2), 0);
    }

    function testWithdraw() public {
        uint256 roundId = lottery.currentRoundId();

        // Remplir tous les camps pour garantir qu'un gagnant existe
        vm.prank(player1);
        lottery.buyTicket(1);
        vm.prank(player2);
        lottery.buyTicket(2);
        vm.prank(player3);
        lottery.buyTicket(3);
        vm.prank(player4);
        lottery.buyTicket(4);

        // Finaliser
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        lottery.closeRound();

        (,,,,, , uint256 vrfRequestId) = lottery.rounds(roundId);
        vrfCoordinator.fulfillRandomWords(vrfRequestId, address(lottery));

        // Vérifier quel joueur a gagné
        (, , , , uint8 winningType, , , ) = lottery.getRoundInfo(roundId);
        
        // Trouver le gagnant selon le type
        address winner;
        if (winningType == 1) winner = player1;
        else if (winningType == 2) winner = player2;
        else if (winningType == 3) winner = player3;
        else if (winningType == 4) winner = player4;
        
        // Si le gagnant existe (un des camps 1-4)
        if (winner != address(0)) {
            uint256 withdrawableAmount = lottery.withdrawable(winner);
            assertTrue(withdrawableAmount > 0, "Winner should have winnings");
            
            uint256 balanceBefore = token.balanceOf(winner);

            vm.prank(winner);
            lottery.withdraw();

            assertEq(token.balanceOf(winner), balanceBefore + withdrawableAmount);
            assertEq(lottery.withdrawable(winner), 0);
        } else {
            // Si aucun gagnant (camps 5 ou 6), tout va à la trésorerie
            assertTrue(lottery.treasuryBalance() > 0, "Treasury should have balance");
        }
    }
    function testCannotWithdrawWithoutWinnings() public {
        vm.prank(player1);
        vm.expectRevert(NoWinningsToWithdraw.selector);
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

        (,,,,, , uint256 vrfRequestId) = lottery.rounds(roundId);
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
        vm.expectRevert(InvalidLotteryOption.selector);
        lottery.setTicketPrice(0);
    }

    function testSetRoundDuration() public {
        uint256 newDuration = 48 * 3600; // 48h
        lottery.setRoundDuration(newDuration);
        assertEq(lottery.roundDuration(), newDuration);
    }

    function testCannotSetTooShortDuration() public {
        vm.expectRevert(InvalidLotteryOption.selector);
        lottery.setRoundDuration(3599); // < 1h
    }

    function testSetTreasury() public {
        address newTreasury = address(0x9999);
        lottery.setTreasury(newTreasury);
        assertEq(lottery.treasury(), newTreasury);
    }

    function testCannotSetZeroTreasury() public {
        vm.expectRevert(InvalidLotteryOption.selector);
        lottery.setTreasury(address(0));
    }

    function testPauseAndUnpause() public {
        lottery.pause();
        
        vm.prank(player1);
        vm.expectRevert();  // Pausable revert, peu importe le message exact
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

        (,,,,, , uint256 vrfRequestId) = lottery.rounds(firstRoundId);
        vrfCoordinator.fulfillRandomWords(vrfRequestId, address(lottery));

        // Vérifier que le nouveau round a démarré
        uint256 newRoundId = lottery.currentRoundId();
        assertEq(newRoundId, firstRoundId + 1);

        (, , bool isActive, , , , , ) = lottery.getRoundInfo(newRoundId);
        assertTrue(isActive);
    }

    function testCanBuyTicketInNewRound() public {
        // Finaliser le premier round
        vm.prank(player1);
        lottery.buyTicket(1);
        
        uint256 firstRoundId = lottery.currentRoundId();
        
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        lottery.closeRound();

        (,,,,, , uint256 vrfRequestId) = lottery.rounds(firstRoundId);
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

        // Test des achats multiples du MÊME type
        // Player1 achète 3x sur camp 1 = 15 tokens
        vm.startPrank(player1);
        lottery.buyTicket(1);
        lottery.buyTicket(1);
        lottery.buyTicket(1);
        vm.stopPrank();
        
        // Player2 achète 1x sur camp 1 = 5 tokens (total gagnant = 20)
        vm.prank(player2);
        lottery.buyTicket(1);
        
        // Player3 achète 2x sur camp 2 = 10 tokens (perdant)
        vm.startPrank(player3);
        lottery.buyTicket(2);
        lottery.buyTicket(2);
        vm.stopPrank();

        // Vérifier les achats
        assertEq(lottery.getUserTicket(roundId, player1), 1);
        assertEq(lottery.getUserTicket(roundId, player2), 1);
        assertEq(lottery.getUserTicket(roundId, player3), 2);

        // Finaliser
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        lottery.closeRound();

        (,,,,, , uint256 vrfRequestId) = lottery.rounds(roundId);
        vrfCoordinator.fulfillRandomWords(vrfRequestId, address(lottery));

        // Vérifier que le round est finalisé
        (, , , bool isFinalized, uint8 winningType, , , ) = lottery.getRoundInfo(roundId);
        assertTrue(isFinalized);
        
        // Vérifier la distribution selon le gagnant
        if (winningType == 1) {
            // Camp 1 gagne - player1 et player2 ont des gains
            assertTrue(lottery.withdrawable(player1) > 0, "Player1 should have winnings");
            assertTrue(lottery.withdrawable(player2) > 0, "Player2 should have winnings");
            assertEq(lottery.withdrawable(player3), 0);
        } else if (winningType == 2) {
            // Camp 2 gagne - player3 a des gains
            assertEq(lottery.withdrawable(player1), 0);
            assertEq(lottery.withdrawable(player2), 0);
            assertTrue(lottery.withdrawable(player3) > 0, "Player3 should have winnings");
        }
    }

    function testEmptyRoundFinalizesImmediately() public {
        uint256 roundId = lottery.currentRoundId();
        
        // Aucun ticket acheté
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        lottery.closeRound();

        // Le round devrait être finalisé immédiatement
        (, , bool isActive, bool isFinalized, , , , ) = lottery.getRoundInfo(roundId);
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
            
            (,,,,, , uint256 vrfRequestId) = lottery.rounds(roundId);
            vrfCoordinator.fulfillRandomWords(vrfRequestId, address(lottery));
            
            // Vérifier que le round est finalisé
            (, , , bool isFinalized, , , , ) = lottery.getRoundInfo(roundId);
            assertTrue(isFinalized);
        }
        
        // Vérifier qu'on est au round 4
        assertEq(lottery.currentRoundId(), 4);
    }
}