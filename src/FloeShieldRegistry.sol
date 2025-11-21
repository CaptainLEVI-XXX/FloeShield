// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IFloeShieldRegistry} from "./interfaces/IFloeShieldRegistry.sol";
import {CustomRevert} from "./libraries/CustomRevert.sol";
import {Lock} from "./libraries/Lock.sol";

contract FloeShieldRegistry is IFloeShieldRegistry {
    using CustomRevert for bytes4;

    mapping(bytes32 => ShieldedIntent) public intents;
    mapping(bytes32 => bytes32[]) public userIntents; // Changed key to bytes32 (hashed address)
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

    function registerShieldedIntent(bytes32 commitment, IntentBounds calldata bounds, uint256 expiry, uint256 nonce)
        external
        returns (bytes32 intentId)
    {
        Lock.unlock(); // lock the contract for any external intrusion

        if (bounds.minLtvBps < PROTOCOL_MIN_LTV) MinLtvTooLow.selector.revertWith(bounds.minLtvBps);
        if (bounds.maxLtvBps > PROTOCOL_MAX_LTV) MaxLtvTooHigh.selector.revertWith(bounds.maxLtvBps);
        if (bounds.minLtvBps > bounds.maxLtvBps) {
            InvalidLtvRange.selector.revertWith(bounds.minLtvBps, bounds.maxLtvBps);
        }

        if (bounds.maxRateBps > PROTOCOL_MAX_RATE) MaxRateTooHigh.selector.revertWith(bounds.maxRateBps);

        if (bounds.acceptedCollateral.length == 0) NoCollateralSpecified.selector.revertWith();
        if (bounds.acceptedCollateral.length > 10) {
            TooManyCollateralTypes.selector.revertWith(bounds.acceptedCollateral.length);
        }

        if (expiry <= block.timestamp) ExpiryInPast.selector.revertWith(expiry);

        bytes32 hashedUser = keccak256(abi.encodePacked(msg.sender));

        intentId = keccak256(abi.encodePacked(hashedUser, commitment, nonce, block.timestamp));

        if (intents[intentId].user != 0) IntentIdCollision.selector.revertWith(intentId);

        intents[intentId] = ShieldedIntent({
            user: hashedUser,
            commitment: commitment,
            minLtvBps: bounds.minLtvBps,
            maxLtvBps: bounds.maxLtvBps,
            maxRateBps: bounds.maxRateBps,
            acceptedCollateral: bounds.acceptedCollateral,
            expiry: expiry,
            createdAt: block.timestamp,
            nonce: nonce,
            active: true,
            revealed: false
        });

        userIntents[hashedUser].push(intentId);
        allIntents.push(intentId);

        Lock.lock(); // unlock the contract for any external intrusion

        emit IntentRegistered(intentId, hashedUser, commitment, expiry);
    }

    function revealIntent(bytes32 intentId, RevealedIntent calldata revealed)
        external
        intentExists(intentId)
        onlyIntentOwner(intentId)
    {
        Lock.unlock(); // lock the contract for any external intrusion
        ShieldedIntent storage intent = intents[intentId];

        if (!intent.active) IntentNotActive.selector.revertWith(intentId);
        if (intent.revealed) IntentAlreadyRevealed.selector.revertWith(intentId);
        if (block.timestamp >= intent.expiry) IntentExpired.selector.revertWith(intentId);

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

        if (computedCommitment != intent.commitment) InvalidReveal.selector.revertWith(intentId);

        if (revealed.exactLtvBps < intent.minLtvBps || revealed.exactLtvBps > intent.maxLtvBps) {
            LtvOutOfBounds.selector.revertWith(intentId);
        }

        if (revealed.exactRateBps > intent.maxRateBps) RateOutOfBounds.selector.revertWith(intentId);

        bool collateralAccepted = false;
        for (uint256 i = 0; i < intent.acceptedCollateral.length; i++) {
            if (intent.acceptedCollateral[i] == revealed.preferredCollateral) {
                collateralAccepted = true;
                break;
            }
        }
        if (!collateralAccepted) CollateralNotAccepted.selector.revertWith(intentId);

        revealedIntents[intentId] = revealed;
        intent.revealed = true;

        emit IntentRevealed(
            intentId,
            intent.user, // Emit hashed user
            revealed.exactAmount,
            revealed.exactLtvBps,
            revealed.exactRateBps
        );
        Lock.lock(); // lock the contract for any external intrusion
    }

    function revokeIntent(bytes32 intentId) external intentExists(intentId) onlyIntentOwner(intentId) {
        Lock.unlock(); // lock the contract for any external intrusion
        ShieldedIntent storage intent = intents[intentId];
        if (!intent.active) IntentNotActive.selector.revertWith(intentId);

        intent.active = false;
        Lock.lock(); // lock the contract for any external intrusion

        emit IntentRevoked(intentId, intent.user); // Emit hashed user
    }

    function getCompatibleIntents(bytes32 intentId)
        external
        view
        intentExists(intentId)
        returns (bytes32[] memory compatibleIds)
    {
        ShieldedIntent memory intent = intents[intentId];
        bytes32[] memory tempIds = new bytes32[](allIntents.length);
        uint256 count = 0;

        for (uint256 i = 0; i < allIntents.length; i++) {
            bytes32 otherId = allIntents[i];
            if (otherId == intentId) continue;

            ShieldedIntent memory other = intents[otherId];
            if (!other.active || other.expiry < block.timestamp) continue;
            if (other.user == intent.user) continue; // Compares hashes

            if (_boundsOverlap(intent, other)) {
                tempIds[count++] = otherId;
            }
        }

        compatibleIds = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            compatibleIds[i] = tempIds[i];
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

    function _boundsOverlap(ShieldedIntent memory a, ShieldedIntent memory b) private pure returns (bool) {
        bool ltvOverlap = !(a.maxLtvBps < b.minLtvBps || b.maxLtvBps < a.minLtvBps);

        bool rateOverlap = !(a.maxRateBps < b.maxRateBps);

        bool collateralOverlap = false;
        for (uint256 i = 0; i < a.acceptedCollateral.length; i++) {
            for (uint256 j = 0; j < b.acceptedCollateral.length; j++) {
                if (a.acceptedCollateral[i] == b.acceptedCollateral[j]) {
                    collateralOverlap = true;
                    break;
                }
            }
            if (collateralOverlap) break;
        }

        return ltvOverlap && rateOverlap && collateralOverlap;
    }
}
