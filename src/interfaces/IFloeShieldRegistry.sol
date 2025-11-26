// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IFloeShieldRegistry {
    struct ShieldedIntent {
        bytes32 user;
        bytes32 commitment;
        uint256 minLtvBps;
        uint256 maxLtvBps;
        uint256 maxRateBps;
        address[] acceptedCollateral;
        uint256 expiry;
        uint256 createdAt;
        uint256 nonce;
        bool active;
        bool revealed;
    }

    struct IntentBounds {
        uint256 minLtvBps;
        uint256 maxLtvBps;
        uint256 maxRateBps;
        address[] acceptedCollateral;
    }

    struct RevealedIntent {
        uint256 exactAmount;
        uint256 exactLtvBps;
        uint256 exactRateBps;
        address preferredCollateral;
        bytes32 salt;
        bytes additionalData;
    }

    event IntentRegistered(bytes32 indexed intentId, bytes32 indexed user, bytes32 commitment, uint256 expiry);
    event IntentRevealed(bytes32 indexed intentId, bytes32 indexed user, uint256 exactAmount, uint256 exactLtvBps, uint256 exactRateBps);
    event IntentRevoked(bytes32 indexed intentId, bytes32 indexed user);

    error IntentNotFound(bytes32 intentId);
    error NotIntentOwner();
    error ExpiryInPast(uint256 expiry);
    error NoCollateralSpecified();
    error TooManyCollateralTypes(uint256 count);
    error MinLtvTooLow(uint256 minLtv);
    error MaxLtvTooHigh(uint256 maxLtv);
    error InvalidLtvRange(uint256 minLtv, uint256 maxLtv);
    error MaxRateTooHigh(uint256 maxRate);
    error IntentIdCollision(bytes32 intentId);
    error IntentNotActive(bytes32 intentId);
    error IntentAlreadyRevealed(bytes32 intentId);
    error IntentExpired(bytes32 intentId);
    error InvalidReveal(bytes32 intentId);
    error LtvOutOfBounds(bytes32 intentId);
    error RateOutOfBounds(bytes32 intentId);
    error CollateralNotAccepted(bytes32 intentId);

    function registerShieldedIntent(bytes32 commitment, IntentBounds calldata bounds, uint256 expiry, uint256 nonce) external returns (bytes32 intentId);
    function revealIntent(bytes32 intentId, RevealedIntent calldata revealed) external;
    function revokeIntent(bytes32 intentId) external;
    function getCompatibleIntents(bytes32 intentId) external view returns (bytes32[] memory compatibleIds);
    function verifyCommitment(bytes32 commitment, RevealedIntent calldata revealed) external pure returns (bool valid);
    function getUserIntents(address user) external view returns (bytes32[] memory);
    function getTotalIntentsCount() external view returns (uint256);
    function getIntentsPaginated(uint256 offset, uint256 limit) external view returns (bytes32[] memory intentIds);
}