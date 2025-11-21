// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Library for reverting with custom errors efficiently
/// @notice Contains functions for reverting with custom errors with different argument types efficiently
/// @dev To use this library, declare `using CustomRevert for bytes4;` and replace `revert CustomError()` with
/// `CustomError.selector.revertWith()`
/// @dev The functions may tamper with the free memory pointer but it is fine since the call context is exited immediately
library CustomRevert {
    /// @dev ERC-7751 error for wrapping bubbled up reverts
    error WrappedError(address target, bytes4 selector, bytes reason, bytes details);

    /// @dev Reverts with the selector of a custom error in the scratch space
    function revertWith(bytes4 selector) internal pure {
        assembly ("memory-safe") {
            mstore(0, selector)
            revert(0, 0x04)
        }
    }

    /// @dev Reverts with a custom error with a uint256 argument in the scratch space
    /// (Used for errors like MinLtvTooLow(uint256), etc.)
    function revertWith(bytes4 selector, uint256 value) internal pure {
        assembly ("memory-safe") {
            mstore(0x00, selector) // write selector at start
            mstore(0x04, value) // write full 32 bytes after selector
            revert(0x00, 0x24) // revert with 36 bytes (4 + 32)
        }
    }

    /// @dev Reverts with a custom error with a bytes32 argument in the scratch space
    /// (Used for errors like IntentNotFound(bytes32), etc.)
    function revertWith(bytes4 selector, bytes32 value) internal pure {
        assembly ("memory-safe") {
            mstore(0x00, selector) // write selector at start
            mstore(0x04, value) // write full 32 bytes after selector
            revert(0x00, 0x24) // revert with 36 bytes (4 + 32)
        }
    }

    /// @dev Reverts with a custom error with two uint256 arguments
    /// (Used for errors like InvalidLtvRange(uint256, uint256))
    function revertWith(bytes4 selector, uint256 value1, uint256 value2) internal pure {
        assembly ("memory-safe") {
            mstore(0x00, selector) // 4-byte selector
            mstore(0x04, value1) // next 32 bytes = uint256
            mstore(0x24, value2) // next 32 bytes = uint256
            revert(0x00, 0x44) // total 68 bytes (4+32+32)
        }
    }
}
