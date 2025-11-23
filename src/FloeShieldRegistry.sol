// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IFloeShieldRegistry} from "./interfaces/IFloeShieldRegistry.sol";
import {CustomRevert} from "./libraries/CustomRevert.sol";
import {Lock} from "./libraries/Lock.sol";

contract FloeShieldRegistry is IFloeShieldRegistry {
    using CustomRevert for bytes4;

    mapping(bytes32 => ShieldedIntent) public intents;
    mapping(bytes32 => bytes32[]) public userIntents;
    bytes32[] public allIntents;
    mapping(bytes32 => RevealedIntent) public revealedIntents;

    uint256 public constant PROTOCOL_MIN_LTV = 5000;
    uint256 public constant PROTOCOL_MAX_LTV = 8000;
    uint256 public constant PROTOCOL_MAX_RATE = 2000;

    modifier intentExists(bytes32 intentId) {
        if (intents[intentId].user == 0) IntentNotFound.selector.revertWith(intentId);
        _;
    }

    modifier onlyIntentOwner(bytes32 intentId) {
        bytes32 hashedSender = keccak256(abi.encodePacked(msg.sender));
        if (intents[intentId].user != hashedSender) NotIntentOwner.selector.revertWith();
        _;
    }

    function registerShieldedIntent(
        bytes32 commitment,
        IntentBounds calldata bounds,
        uint256 expiry,
        uint256 nonce
    ) external returns (bytes32 intentId) {
        Lock.unlock();


        uint256 minLtv = bounds.minLtvBps;
        uint256 maxLtv = bounds.maxLtvBps;
        uint256 maxRate = bounds.maxRateBps;


        if (expiry <= block.timestamp) ExpiryInPast.selector.revertWith(expiry);
        
        // Cache array length
        uint256 collateralLength = bounds.acceptedCollateral.length;
        if (collateralLength == 0) NoCollateralSpecified.selector.revertWith();
        if (collateralLength > 10) TooManyCollateralTypes.selector.revertWith(collateralLength);

        if (minLtv < PROTOCOL_MIN_LTV) MinLtvTooLow.selector.revertWith(minLtv);
        if (maxLtv > PROTOCOL_MAX_LTV) MaxLtvTooHigh.selector.revertWith(maxLtv);
        if (minLtv > maxLtv) InvalidLtvRange.selector.revertWith(minLtv, maxLtv);
        if (maxRate > PROTOCOL_MAX_RATE) MaxRateTooHigh.selector.revertWith(maxRate);

        bytes32 hashedUser = keccak256(abi.encodePacked(msg.sender));
        uint256 timestamp = block.timestamp;
        intentId = keccak256(abi.encodePacked(hashedUser, commitment, nonce, timestamp));

        if (intents[intentId].user != 0) IntentIdCollision.selector.revertWith(intentId);

        intents[intentId] = ShieldedIntent({
            user: hashedUser,
            commitment: commitment,
            minLtvBps: minLtv,
            maxLtvBps: maxLtv,
            maxRateBps: maxRate,
            acceptedCollateral: bounds.acceptedCollateral,
            expiry: expiry,
            createdAt: timestamp,
            nonce: nonce,
            active: true,
            revealed: false
        });

        userIntents[hashedUser].push(intentId);
        allIntents.push(intentId);

        Lock.lock();

        emit IntentRegistered(intentId, hashedUser, commitment, expiry);
    }

    function revealIntent(bytes32 intentId, RevealedIntent calldata revealed)
        external
        intentExists(intentId)
        onlyIntentOwner(intentId)
    {
        Lock.unlock();
        

        ShieldedIntent storage intent = intents[intentId];

        if (!intent.active) IntentNotActive.selector.revertWith(intentId);
        if (intent.revealed) IntentAlreadyRevealed.selector.revertWith(intentId);
        if (block.timestamp >= intent.expiry) IntentExpired.selector.revertWith(intentId);

        // Cache commitment
        bytes32 storedCommitment = intent.commitment;
        
        bytes32 computedCommitment = keccak256(
            abi.encodePacked(
                revealed.exactAmount,
                revealed.exactLtvBps,
                revealed.exactRateBps,
                revealed.preferredCollateral,
                revealed.salt,
                revealed.additionalData
            )
        );

        if (computedCommitment != storedCommitment) InvalidReveal.selector.revertWith(intentId);


        uint256 minLtv = intent.minLtvBps;
        uint256 maxLtv = intent.maxLtvBps;
        uint256 maxRate = intent.maxRateBps;

        if (revealed.exactLtvBps < minLtv || revealed.exactLtvBps > maxLtv) {
            LtvOutOfBounds.selector.revertWith(intentId);
        }

        if (revealed.exactRateBps > maxRate) RateOutOfBounds.selector.revertWith(intentId);


        address[] memory acceptedCollateral = intent.acceptedCollateral;
        uint256 length = acceptedCollateral.length;
        bool collateralAccepted = false;
        
        unchecked {
            for (uint256 i = 0; i < length; ++i) {
                if (acceptedCollateral[i] == revealed.preferredCollateral) {
                    collateralAccepted = true;
                    break;
                }
            }
        }
        
        if (!collateralAccepted) CollateralNotAccepted.selector.revertWith(intentId);

        revealedIntents[intentId] = revealed;
        intent.revealed = true;

        emit IntentRevealed(
            intentId,
            intent.user,
            revealed.exactAmount,
            revealed.exactLtvBps,
            revealed.exactRateBps
        );
        
        Lock.lock();
    }

    function revokeIntent(bytes32 intentId) 
        external 
        intentExists(intentId) 
        onlyIntentOwner(intentId) 
    {
        Lock.unlock();
        
        ShieldedIntent storage intent = intents[intentId];
        if (!intent.active) IntentNotActive.selector.revertWith(intentId);

        intent.active = false;
        
        Lock.lock();

        emit IntentRevoked(intentId, intent.user);
    }

    function getCompatibleIntents(bytes32 intentId)
        external
        view
        intentExists(intentId)
        returns (bytes32[] memory compatibleIds)
    {

        ShieldedIntent memory intent = intents[intentId];
        

        uint256 allIntentsLength = allIntents.length;
        uint256 currentTime = block.timestamp;
        
        bytes32[] memory tempIds = new bytes32[](allIntentsLength);
        uint256 count = 0;


        unchecked {
            for (uint256 i = 0; i < allIntentsLength; ++i) {
                bytes32 otherId = allIntents[i];
                if (otherId == intentId) continue;

                // Load into memory for multiple field access
                ShieldedIntent memory other = intents[otherId];
                
                // Short-circuit evaluation - cheapest checks first
                if (!other.active) continue;
                if (other.expiry < currentTime) continue;
                if (other.user == intent.user) continue;

                if (_boundsOverlap(intent, other)) {
                    tempIds[count] = otherId;
                    ++count;
                }
            }
        }

        // Only allocate final array size needed
        compatibleIds = new bytes32[](count);
        unchecked {
            for (uint256 i = 0; i < count; ++i) {
                compatibleIds[i] = tempIds[i];
            }
        }
    }

    function verifyCommitment(bytes32 commitment, RevealedIntent calldata revealed)
        external
        pure
        returns (bool valid)
    {
        bytes32 computed = keccak256(
            abi.encodePacked(
                revealed.exactAmount,
                revealed.exactLtvBps,
                revealed.exactRateBps,
                revealed.preferredCollateral,
                revealed.salt,
                revealed.additionalData
            )
        );

        return computed == commitment;
    }

    function getUserIntents(address user) external view returns (bytes32[] memory) {
        bytes32 hashedUser = keccak256(abi.encodePacked(user));
        return userIntents[hashedUser];
    }

    function _boundsOverlap(ShieldedIntent memory a, ShieldedIntent memory b) 
        private 
        pure 
        returns (bool) 
    {

        if (a.maxLtvBps < b.minLtvBps || b.maxLtvBps < a.minLtvBps) {
            return false;
        }

        if (a.maxRateBps < b.maxRateBps) {
            return false;
        }


        uint256 aLength = a.acceptedCollateral.length;
        uint256 bLength = b.acceptedCollateral.length;
        
        unchecked {
            for (uint256 i = 0; i < aLength; ++i) {
                address collateralA = a.acceptedCollateral[i];
                for (uint256 j = 0; j < bLength; ++j) {
                    if (collateralA == b.acceptedCollateral[j]) {
                        return true;
                    }
                }
            }
        }

        return false;
    }
}