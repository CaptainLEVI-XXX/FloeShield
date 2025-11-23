// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {FloeShieldRegistry} from "../src/FloeShieldRegistry.sol";

contract FloeShieldRegistryScript is Script {
    FloeShieldRegistry public registry;


    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        registry = new FloeShieldRegistry();
        vm.label(address(registry), "FloeShieldRegistry");
        vm.stopBroadcast();
    }

    ////source .env && forge script script/Deploy.s.sol:FloeShieldRegistryScript --rpc-url $SEPOLIA_RPC_URL --broadcast --verify -vvvv
}
