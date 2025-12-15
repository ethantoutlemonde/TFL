// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IVRFCoordinatorV2Plus} from "@chainlink/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {Round, VRFRequestNotFound, RoundAlreadyFinalized} from "./LotteryTypes.sol";

/**
 * @title LotteryVRF
 * @notice Chainlink VRF integration isolated from core lottery logic
 *
 * FILE RESPONSIBILITY:
 * ---------------------
 * Keeps the Chainlink VRF plumbing separate from the rest of the system.
 * Only randomness handling lives here; business rules stay in LotteryCore.
 *
 * VRF V2.5 NOTES:
 * ---------------
 * Uses the v2.5 coordinator where the subscription identifier is uint256
 * instead of uint64 (the type used in the earlier VRF versions).
 *
 * KEY IDEAS:
 * ----------
 * 1. Immutable deployment parameters
 *    - vrfCoordinator: Chainlink coordinator address
 *    - subscriptionId: funding subscription (uint256 for v2.5)
 *    - keyHash: gas lane provided by the network
 *
 * 2. Randomness request lifecycle
 *    - _requestRandomness: submits the request and tracks it
 *    - rawFulfillRandomWords: entry point called by the coordinator
 *    - fulfillRandomWords: internal handler that delegates to core logic
 *
 * 3. Design patterns
 *    - Adapter pattern to hide Chainlink specific details
 *    - Template method; core contract implements _handleRandomWords
 *    - Immutable state for gas savings and safety
 */
abstract contract LotteryVRF {
    /// @notice Triggered when a caller different from the VRF Coordinator tries to finalize a request
    error OnlyCoordinatorCanFulfill(address have, address want);

    IVRFCoordinatorV2Plus public immutable vrfCoordinator;
    uint256 public immutable subscriptionId; // uint256 for VRF v2.5
    bytes32 public immutable keyHash;
    uint32 public callbackGasLimit = 500000;

    uint16 public constant REQUEST_CONFIRMATIONS = 3;
    uint32 public constant NUM_WORDS = 1;

    // Maps VRF request identifier to lottery round
    mapping(uint256 => uint256) public vrfRequestToRound;

    // Stores round metadata; populated by the inheriting contract
    mapping(uint256 => Round) public rounds;

    event RandomnessRequested(uint256 indexed roundId, uint256 requestId);

    constructor(
        address _vrfCoordinator,
        uint256 _subscriptionId,
        bytes32 _keyHash
    ) {
        vrfCoordinator = IVRFCoordinatorV2Plus(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
    }

    /**
     * @notice Submits a randomness request to the Chainlink VRF coordinator
     */
    function _requestRandomness(uint256 roundId) internal {
        Round storage round = rounds[roundId];
        if (round.isFinalized) revert RoundAlreadyFinalized();

        uint256 requestId = vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: subscriptionId,
                requestConfirmations: REQUEST_CONFIRMATIONS,
                callbackGasLimit: callbackGasLimit,
                numWords: NUM_WORDS,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );

        round.vrfRequestId = requestId;
        vrfRequestToRound[requestId] = roundId;

        emit RandomnessRequested(roundId, requestId);
    }

    /**
     * @notice Entry point for the VRF coordinator callback
     */
    function rawFulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external {
        if (msg.sender != address(vrfCoordinator)) {
            revert OnlyCoordinatorCanFulfill(msg.sender, address(vrfCoordinator));
        }
        fulfillRandomWords(requestId, randomWords);
    }

    /**
     * @notice Routes the random words to the inheriting contract logic
     */
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal {
        uint256 roundId = vrfRequestToRound[requestId];
        if (roundId == 0) revert VRFRequestNotFound();

        _handleRandomWords(roundId, randomWords);
    }

    /**
     * @notice Implemented by LotteryCore to process the randomness
     */
    function _handleRandomWords(uint256 roundId, uint256[] memory randomWords) internal virtual;

    /**
     * @notice Exposed so core governance can adjust the gas limit
     */
    function setCallbackGasLimit(uint32 newLimit) external virtual;
}
