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
        if (intents[intentId].user == bytes32(0)) IntentNotFound.selector.revertWith(intentId);
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

        // Validate expiry (use < instead of <= to allow same-block registration)
        if (expiry < block.timestamp) ExpiryInPast.selector.revertWith(expiry);
        
        // Cache and validate collateral array
        uint256 collateralLength = bounds.acceptedCollateral.length;
        if (collateralLength == 0) NoCollateralSpecified.selector.revertWith();
        if (collateralLength > 10) TooManyCollateralTypes.selector.revertWith(collateralLength);

        // Validate LTV and rate bounds
        if (bounds.minLtvBps < PROTOCOL_MIN_LTV) MinLtvTooLow.selector.revertWith(bounds.minLtvBps);
        if (bounds.maxLtvBps > PROTOCOL_MAX_LTV) MaxLtvTooHigh.selector.revertWith(bounds.maxLtvBps);
        if (bounds.minLtvBps > bounds.maxLtvBps) InvalidLtvRange.selector.revertWith(bounds.minLtvBps, bounds.maxLtvBps);
        if (bounds.maxRateBps > PROTOCOL_MAX_RATE) MaxRateTooHigh.selector.revertWith(bounds.maxRateBps);

        bytes32 hashedUser = keccak256(abi.encodePacked(msg.sender));
        uint256 timestamp = block.timestamp;
        intentId = keccak256(abi.encodePacked(hashedUser, commitment, nonce, timestamp));

        if (intents[intentId].user != bytes32(0)) IntentIdCollision.selector.revertWith(intentId);

        intents[intentId] = ShieldedIntent({
            user: hashedUser,
            commitment: commitment,
            minLtvBps: bounds.minLtvBps,
            maxLtvBps: bounds.maxLtvBps,
            maxRateBps: bounds.maxRateBps,
            acceptedCollateral: bounds.acceptedCollateral,
            expiry: expiry,
            createdAt: timestamp,
            nonce: nonce,
            active: true,
            revealed: false
        });

        userIntents[hashedUser].push(intentId);
        allIntents.push(intentId);

        emit IntentRegistered(intentId, hashedUser, commitment, expiry);

        Lock.lock();
    }

    function revealIntent(bytes32 intentId, RevealedIntent calldata revealed)
        external
        intentExists(intentId)
        onlyIntentOwner(intentId)
    {
        Lock.unlock();
        
        // Load entire struct into memory once to minimize storage reads
        ShieldedIntent memory intentData = intents[intentId];

        if (!intentData.active) IntentNotActive.selector.revertWith(intentId);
        if (intentData.revealed) IntentAlreadyRevealed.selector.revertWith(intentId);
        if (block.timestamp >= intentData.expiry) IntentExpired.selector.revertWith(intentId);

        // Verify commitment
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

        if (computedCommitment != intentData.commitment) InvalidReveal.selector.revertWith(intentId);

        // Validate revealed values against bounds
        if (revealed.exactLtvBps < intentData.minLtvBps || revealed.exactLtvBps > intentData.maxLtvBps) {
            LtvOutOfBounds.selector.revertWith(intentId);
        }

        if (revealed.exactRateBps > intentData.maxRateBps) RateOutOfBounds.selector.revertWith(intentId);

        // Verify collateral is in accepted list
        address[] memory acceptedCollateral = intentData.acceptedCollateral;
        uint256 length = acceptedCollateral.length;
        bool collateralAccepted;
        
        unchecked {
            for (uint256 i; i < length; ++i) {
                if (acceptedCollateral[i] == revealed.preferredCollateral) {
                    collateralAccepted = true;
                    break;
                }
            }
        }
        
        if (!collateralAccepted) CollateralNotAccepted.selector.revertWith(intentId);

        // Write to storage
        revealedIntents[intentId] = revealed;
        intents[intentId].revealed = true;

        emit IntentRevealed(
            intentId,
            intentData.user,
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
        
        emit IntentRevoked(intentId, intent.user);

        Lock.lock();
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
        uint256 count;

        unchecked {
            for (uint256 i; i < allIntentsLength; ++i) {
                bytes32 otherId = allIntents[i];
                if (otherId == intentId) continue;

                ShieldedIntent storage otherStorage = intents[otherId];
                
                if (!otherStorage.active) continue;
                if (otherStorage.expiry < currentTime) continue;
                if (otherStorage.user == intent.user) continue;

                ShieldedIntent memory other = otherStorage;

                if (_boundsOverlap(intent, other)) {
                    tempIds[count] = otherId;
                    ++count;
                }
            }
        }

        compatibleIds = new bytes32[](count);
        unchecked {
            for (uint256 i; i < count; ++i) {
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

    function getTotalIntentsCount() external view returns (uint256) {
        return allIntents.length;
    }

    function getIntentsPaginated(uint256 offset, uint256 limit) 
        external 
        view 
        returns (bytes32[] memory intentIds) 
    {
        uint256 total = allIntents.length;
        if (offset >= total) {
            return new bytes32[](0);
        }
        
        uint256 remaining = total - offset;
        uint256 size = remaining < limit ? remaining : limit;
        
        intentIds = new bytes32[](size);
        unchecked {
            for (uint256 i; i < size; ++i) {
                intentIds[i] = allIntents[offset + i];
            }
        }
    }

    function _boundsOverlap(ShieldedIntent memory a, ShieldedIntent memory b) 
        private 
        pure 
        returns (bool) 
    {
        // LTV ranges must overlap
        if (a.maxLtvBps < b.minLtvBps || b.maxLtvBps < a.minLtvBps) {
            return false;
        }

        uint256 aLength = a.acceptedCollateral.length;
        uint256 bLength = b.acceptedCollateral.length;
        
        unchecked {
            for (uint256 i; i < aLength; ++i) {
                address collateralA = a.acceptedCollateral[i];
                for (uint256 j; j < bLength; ++j) {
                    if (collateralA == b.acceptedCollateral[j]) {
                        return true;
                    }
                }
            }
        }

        return false;
    }
}