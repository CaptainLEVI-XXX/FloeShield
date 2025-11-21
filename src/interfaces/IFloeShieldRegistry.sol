// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IFloeShieldRegistry {
    // Structs
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

    // Events
    event IntentRegistered(bytes32 indexed intentId, bytes32 indexed user, bytes32 commitment, uint256 expiry);

    event IntentRevealed(
        bytes32 indexed intentId, bytes32 indexed user, uint256 amount, uint256 ltvBps, uint256 rateBps
    );

    event IntentRevoked(bytes32 indexed intentId, bytes32 indexed user);

    error IntentNotFound(bytes32 intentId);
    error NotIntentOwner();
    error MinLtvTooLow(uint256 minLtvBps);
    error MaxLtvTooHigh(uint256 maxLtvBps);
    error InvalidLtvRange(uint256 minLtvBps, uint256 maxLtvBps);
    error MaxRateTooHigh(uint256 maxRateBps);
    error NoCollateralSpecified();
    error TooManyCollateralTypes(uint256 collateralCount);
    error ExpiryInPast(uint256 expiry);
    error IntentNotActive(bytes32 intentId);
    error IntentAlreadyRevealed(bytes32 intentId);
    error IntentExpired(bytes32 intentId);
    error InvalidReveal(bytes32 intentId);
    error LtvOutOfBounds(bytes32 intentId);
    error RateOutOfBounds(bytes32 intentId);
    error CollateralNotAccepted(bytes32 intentId);
    error IntentIdCollision(bytes32 intentId);

    // Functions
    function registerShieldedIntent(bytes32 commitment, IntentBounds calldata bounds, uint256 expiry, uint256 nonce)
        external
        returns (bytes32 intentId);

    function revealIntent(bytes32 intentId, RevealedIntent calldata revealed) external;

    function revokeIntent(bytes32 intentId) external;
    function getCompatibleIntents(bytes32 intentId) external view returns (bytes32[] memory);
    function verifyCommitment(bytes32 commitment, RevealedIntent calldata revealed) external pure returns (bool);
    function getUserIntents(address user) external view returns (bytes32[] memory);
}
