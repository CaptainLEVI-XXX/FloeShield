// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {FloeShieldRegistry} from "../src/FloeShieldRegistry.sol";
import {IFloeShieldRegistry} from "../src/interfaces/IFloeShieldRegistry.sol";

contract FloeShieldRegistryTest is Test {
    FloeShieldRegistry public registry;
    address public user1 = address(0x123);
    address public user2 = address(0x456);
    bytes32 public hashedUser1 = keccak256(abi.encodePacked(user1));
    bytes32 public hashedUser2 = keccak256(abi.encodePacked(user2));
    address[] public collateral = new address[](1);

    function setUp() public {
        registry = new FloeShieldRegistry();
        collateral[0] = address(0xABC); // Mock collateral address
    }

    function test_RegisterShieldedIntent_InvalidBounds() public {
        vm.prank(user1);
        IFloeShieldRegistry.IntentBounds memory bounds = IFloeShieldRegistry.IntentBounds({
            minLtvBps: 4000, // Below PROTOCOL_MIN_LTV (5000)
            maxLtvBps: 8000,
            maxRateBps: 2000,
            acceptedCollateral: collateral
        });

        vm.expectRevert(abi.encodeWithSelector(IFloeShieldRegistry.MinLtvTooLow.selector, 4000));
        registry.registerShieldedIntent(keccak256("mock"), bounds, block.timestamp + 1 days, 1);
    }

    function test_RevealIntent_Success() public {
        // Register first
        vm.prank(user1);
        IFloeShieldRegistry.IntentBounds memory bounds = IFloeShieldRegistry.IntentBounds({
            minLtvBps: 5000,
            maxLtvBps: 8000,
            maxRateBps: 2000,
            acceptedCollateral: collateral
        });
        bytes32 commitment = keccak256(
            abi.encodePacked(
                uint256(1000e18), uint256(6000), uint256(1500), address(0xABC), bytes32("salt"), bytes("data")
            )
        );
        bytes32 intentId = registry.registerShieldedIntent(commitment, bounds, block.timestamp + 1 days, 1);

        // Reveal
        vm.prank(user1);
        IFloeShieldRegistry.RevealedIntent memory revealed = IFloeShieldRegistry.RevealedIntent({
            exactAmount: 1000e18,
            exactLtvBps: 6000,
            exactRateBps: 1500,
            preferredCollateral: address(0xABC),
            salt: bytes32("salt"),
            additionalData: bytes("data")
        });
        registry.revealIntent(intentId, revealed);

        // (bytes32, bytes32, uint256, uint256, uint256, address[] memory, uint256, uint256, uint256, bool, bool revealedFlag) = registry.intents(intentId);
        // assertTrue(revealedFlag);

        (
            uint256 exactAmount,
            uint256 exactLtvBps,
            uint256 exactRateBps,
            address preferredCollateral,
            bytes32 salt,
            bytes memory additionalData
        ) = registry.revealedIntents(intentId);
        assertEq(exactAmount, 1000e18);
        assertEq(exactLtvBps, 6000);
    }

    function test_RevealIntent_InvalidCommitment() public {
        // Register
        vm.prank(user1);
        IFloeShieldRegistry.IntentBounds memory bounds = IFloeShieldRegistry.IntentBounds({
            minLtvBps: 5000,
            maxLtvBps: 8000,
            maxRateBps: 2000,
            acceptedCollateral: collateral
        });
        bytes32 commitment = keccak256("valid");
        bytes32 intentId = registry.registerShieldedIntent(commitment, bounds, block.timestamp + 1 days, 1);

        // Invalid reveal
        vm.prank(user1);
        IFloeShieldRegistry.RevealedIntent memory revealed = IFloeShieldRegistry.RevealedIntent({
            exactAmount: 1000e18,
            exactLtvBps: 6000,
            exactRateBps: 1500,
            preferredCollateral: address(0xABC),
            salt: bytes32("salt"),
            additionalData: bytes("data")
        });
        vm.expectRevert(abi.encodeWithSelector(IFloeShieldRegistry.InvalidReveal.selector, intentId));
        registry.revealIntent(intentId, revealed);
    }

    function test_RevokeIntent_Success() public {
        // Register
        vm.prank(user1);
        IFloeShieldRegistry.IntentBounds memory bounds = IFloeShieldRegistry.IntentBounds({
            minLtvBps: 5000,
            maxLtvBps: 8000,
            maxRateBps: 2000,
            acceptedCollateral: collateral
        });
        bytes32 intentId = registry.registerShieldedIntent(keccak256("mock"), bounds, block.timestamp + 1 days, 1);

        // Revoke
        vm.prank(user1);
        registry.revokeIntent(intentId);

        // (bytes32, bytes32, uint256, uint256, uint256, address[] memory, uint256, uint256, uint256, bool active, bool) = registry.intents(intentId);
        // assertFalse(active);
    }

    function test_GetCompatibleIntents_Success() public {
        // Register intent1 (user1, higher max rate for overlap check)
        vm.prank(user1);
        IFloeShieldRegistry.IntentBounds memory bounds1 = IFloeShieldRegistry.IntentBounds({
            minLtvBps: 5000,
            maxLtvBps: 7000,
            maxRateBps: 2000,
            acceptedCollateral: collateral
        });
        bytes32 intentId1 = registry.registerShieldedIntent(keccak256("mock1"), bounds1, block.timestamp + 1 days, 1);

        vm.warp(block.timestamp + 1);

        // Register intent2 (user2, compatible, lower max rate)
        vm.prank(user2);
        IFloeShieldRegistry.IntentBounds memory bounds2 = IFloeShieldRegistry.IntentBounds({
            minLtvBps: 6000,
            maxLtvBps: 8000,
            maxRateBps: 1500,
            acceptedCollateral: collateral
        });
        bytes32 intentId2 = registry.registerShieldedIntent(keccak256("mock2"), bounds2, block.timestamp + 1 days, 2);

        // Check compatibles for intent1
        bytes32[] memory compatibles = registry.getCompatibleIntents(intentId1);
        assertEq(compatibles.length, 1);
        assertEq(compatibles[0], intentId2);
    }

    function test_GetUserIntents() public {
        // Register for user1
        vm.prank(user1);
        IFloeShieldRegistry.IntentBounds memory bounds = IFloeShieldRegistry.IntentBounds({
            minLtvBps: 5000,
            maxLtvBps: 8000,
            maxRateBps: 2000,
            acceptedCollateral: collateral
        });
        registry.registerShieldedIntent(keccak256("mock1"), bounds, block.timestamp + 1 days, 1);

        vm.warp(block.timestamp + 1);
        vm.prank(user1);
        registry.registerShieldedIntent(keccak256("mock2"), bounds, block.timestamp + 1 days, 2);

        bytes32[] memory userIntentsList = registry.getUserIntents(user1);
        assertEq(userIntentsList.length, 2);
    }
}
