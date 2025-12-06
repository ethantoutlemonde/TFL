// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {VRFV2PlusClient} from "@chainlink/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {IVRFCoordinatorV2Plus} from "@chainlink/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";

/**
 * @title VRFCoordinatorV2_5MockSimple
 * @notice Mock simplifié du VRF Coordinator v2.5 pour les tests
 * @dev Ce mock ne gère pas les subscriptions de manière complète,
 *      il permet juste de tester le flow VRF basique
 */
contract VRFCoordinatorV2_5MockSimple {
    
    uint256 private s_nextRequestId = 1;
    uint256 private s_nextSubscriptionId = 1;
    
    // Mapping subscriptionId => owner
    mapping(uint256 => address) public s_subscriptionOwner;
    
    // Mapping subscriptionId => consumers
    mapping(uint256 => mapping(address => bool)) public s_consumers;
    
    // Mapping requestId => Request info
    struct Request {
        uint256 subId;
        address consumer;
        uint32 callbackGasLimit;
        uint32 numWords;
    }
    mapping(uint256 => Request) public s_requests;
    
    event RandomWordsRequested(
        bytes32 indexed keyHash,
        uint256 requestId,
        uint256 indexed subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords,
        address indexed sender
    );
    
    event SubscriptionCreated(uint256 indexed subId, address owner);
    event ConsumerAdded(uint256 indexed subId, address consumer);
    
    /**
     * @notice Crée une subscription
     */
    function createSubscription() external returns (uint256 subId) {
        subId = s_nextSubscriptionId++;
        s_subscriptionOwner[subId] = msg.sender;
        emit SubscriptionCreated(subId, msg.sender);
    }
    
    /**
     * @notice Finance une subscription (mock - ne fait rien de concret)
     */
    function fundSubscription(uint256 subId, uint256 /* amount */) external view {
        require(s_subscriptionOwner[subId] != address(0), "InvalidSubscription");
        // Mock: on ne gère pas vraiment le funding
    }
    
    /**
     * @notice Ajoute un consumer à une subscription
     */
    function addConsumer(uint256 subId, address consumer) external {
        require(s_subscriptionOwner[subId] != address(0), "InvalidSubscription");
        s_consumers[subId][consumer] = true;
        emit ConsumerAdded(subId, consumer);
    }
    
    /**
     * @notice Demande des mots aléatoires (interface VRF v2.5)
     */
    function requestRandomWords(
        VRFV2PlusClient.RandomWordsRequest calldata req
    ) external returns (uint256 requestId) {
        require(s_subscriptionOwner[req.subId] != address(0), "InvalidSubscription");
        require(s_consumers[req.subId][msg.sender], "InvalidConsumer");
        
        requestId = s_nextRequestId++;
        
        s_requests[requestId] = Request({
            subId: req.subId,
            consumer: msg.sender,
            callbackGasLimit: req.callbackGasLimit,
            numWords: req.numWords
        });
        
        emit RandomWordsRequested(
            req.keyHash,
            requestId,
            req.subId,
            req.requestConfirmations,
            req.callbackGasLimit,
            req.numWords,
            msg.sender
        );
    }
    
    /**
     * @notice Fulfil la demande avec des mots aléatoires générés
     * @param requestId L'ID de la requête
     * @param consumer L'adresse du consumer
     */
    function fulfillRandomWords(uint256 requestId, address consumer) external {
        Request memory req = s_requests[requestId];
        require(req.consumer == consumer, "Wrong consumer");
        
        uint256[] memory words = new uint256[](req.numWords);
        for (uint256 i = 0; i < req.numWords; i++) {
            words[i] = uint256(keccak256(abi.encode(requestId, i, block.timestamp)));
        }
        
        // Appeler rawFulfillRandomWords sur le consumer
        (bool success, ) = consumer.call(
            abi.encodeWithSignature("rawFulfillRandomWords(uint256,uint256[])", requestId, words)
        );
        require(success, "Callback failed");
        
        delete s_requests[requestId];
    }
    
    /**
     * @notice Fulfil avec des mots aléatoires personnalisés
     */
    function fulfillRandomWordsWithOverride(
        uint256 requestId, 
        address consumer, 
        uint256[] memory words
    ) external {
        Request memory req = s_requests[requestId];
        require(req.consumer == consumer, "Wrong consumer");
        
        // Appeler rawFulfillRandomWords sur le consumer
        (bool success, ) = consumer.call(
            abi.encodeWithSignature("rawFulfillRandomWords(uint256,uint256[])", requestId, words)
        );
        require(success, "Callback failed");
        
        delete s_requests[requestId];
    }
}
