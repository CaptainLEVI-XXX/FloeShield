export const CONTRACT_ADDRESS = "0x59cCE29D96A13446D7A9575302489893b67d58F7"; // Replace with your contract address

export const CONTRACT_ABI = [
        {
            "type": "function",
            "name": "PROTOCOL_MAX_LTV",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "PROTOCOL_MAX_RATE",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "PROTOCOL_MIN_LTV",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "allIntents",
            "inputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "getCompatibleIntents",
            "inputs": [
                {
                    "name": "intentId",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ],
            "outputs": [
                {
                    "name": "compatibleIds",
                    "type": "bytes32[]",
                    "internalType": "bytes32[]"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "getUserIntents",
            "inputs": [
                {
                    "name": "user",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "bytes32[]",
                    "internalType": "bytes32[]"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "intents",
            "inputs": [
                {
                    "name": "",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ],
            "outputs": [
                {
                    "name": "user",
                    "type": "bytes32",
                    "internalType": "bytes32"
                },
                {
                    "name": "commitment",
                    "type": "bytes32",
                    "internalType": "bytes32"
                },
                {
                    "name": "minLtvBps",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "maxLtvBps",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "maxRateBps",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "expiry",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "createdAt",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "nonce",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "active",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "revealed",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "registerShieldedIntent",
            "inputs": [
                {
                    "name": "commitment",
                    "type": "bytes32",
                    "internalType": "bytes32"
                },
                {
                    "name": "bounds",
                    "type": "tuple",
                    "internalType": "struct IFloeShieldRegistry.IntentBounds",
                    "components": [
                        {
                            "name": "minLtvBps",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "maxLtvBps",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "maxRateBps",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "acceptedCollateral",
                            "type": "address[]",
                            "internalType": "address[]"
                        }
                    ]
                },
                {
                    "name": "expiry",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "nonce",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "intentId",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "revealIntent",
            "inputs": [
                {
                    "name": "intentId",
                    "type": "bytes32",
                    "internalType": "bytes32"
                },
                {
                    "name": "revealed",
                    "type": "tuple",
                    "internalType": "struct IFloeShieldRegistry.RevealedIntent",
                    "components": [
                        {
                            "name": "exactAmount",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "exactLtvBps",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "exactRateBps",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "preferredCollateral",
                            "type": "address",
                            "internalType": "address"
                        },
                        {
                            "name": "salt",
                            "type": "bytes32",
                            "internalType": "bytes32"
                        },
                        {
                            "name": "additionalData",
                            "type": "bytes",
                            "internalType": "bytes"
                        }
                    ]
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "revealedIntents",
            "inputs": [
                {
                    "name": "",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ],
            "outputs": [
                {
                    "name": "exactAmount",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "exactLtvBps",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "exactRateBps",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "preferredCollateral",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "salt",
                    "type": "bytes32",
                    "internalType": "bytes32"
                },
                {
                    "name": "additionalData",
                    "type": "bytes",
                    "internalType": "bytes"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "revokeIntent",
            "inputs": [
                {
                    "name": "intentId",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "userIntents",
            "inputs": [
                {
                    "name": "",
                    "type": "bytes32",
                    "internalType": "bytes32"
                },
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "verifyCommitment",
            "inputs": [
                {
                    "name": "commitment",
                    "type": "bytes32",
                    "internalType": "bytes32"
                },
                {
                    "name": "revealed",
                    "type": "tuple",
                    "internalType": "struct IFloeShieldRegistry.RevealedIntent",
                    "components": [
                        {
                            "name": "exactAmount",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "exactLtvBps",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "exactRateBps",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "preferredCollateral",
                            "type": "address",
                            "internalType": "address"
                        },
                        {
                            "name": "salt",
                            "type": "bytes32",
                            "internalType": "bytes32"
                        },
                        {
                            "name": "additionalData",
                            "type": "bytes",
                            "internalType": "bytes"
                        }
                    ]
                }
            ],
            "outputs": [
                {
                    "name": "valid",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "stateMutability": "pure"
        },
        {
            "type": "event",
            "name": "IntentRegistered",
            "inputs": [
                {
                    "name": "intentId",
                    "type": "bytes32",
                    "indexed": true,
                    "internalType": "bytes32"
                },
                {
                    "name": "user",
                    "type": "bytes32",
                    "indexed": true,
                    "internalType": "bytes32"
                },
                {
                    "name": "commitment",
                    "type": "bytes32",
                    "indexed": false,
                    "internalType": "bytes32"
                },
                {
                    "name": "expiry",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "IntentRevealed",
            "inputs": [
                {
                    "name": "intentId",
                    "type": "bytes32",
                    "indexed": true,
                    "internalType": "bytes32"
                },
                {
                    "name": "user",
                    "type": "bytes32",
                    "indexed": true,
                    "internalType": "bytes32"
                },
                {
                    "name": "amount",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                },
                {
                    "name": "ltvBps",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                },
                {
                    "name": "rateBps",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "IntentRevoked",
            "inputs": [
                {
                    "name": "intentId",
                    "type": "bytes32",
                    "indexed": true,
                    "internalType": "bytes32"
                },
                {
                    "name": "user",
                    "type": "bytes32",
                    "indexed": true,
                    "internalType": "bytes32"
                }
            ],
            "anonymous": false
        },
        {
            "type": "error",
            "name": "CollateralNotAccepted",
            "inputs": [
                {
                    "name": "intentId",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ]
        },
        {
            "type": "error",
            "name": "ExpiryInPast",
            "inputs": [
                {
                    "name": "expiry",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        },
        {
            "type": "error",
            "name": "IntentAlreadyRevealed",
            "inputs": [
                {
                    "name": "intentId",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ]
        },
        {
            "type": "error",
            "name": "IntentExpired",
            "inputs": [
                {
                    "name": "intentId",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ]
        },
        {
            "type": "error",
            "name": "IntentIdCollision",
            "inputs": [
                {
                    "name": "intentId",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ]
        },
        {
            "type": "error",
            "name": "IntentNotActive",
            "inputs": [
                {
                    "name": "intentId",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ]
        },
        {
            "type": "error",
            "name": "IntentNotFound",
            "inputs": [
                {
                    "name": "intentId",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ]
        },
        {
            "type": "error",
            "name": "InvalidLtvRange",
            "inputs": [
                {
                    "name": "minLtvBps",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "maxLtvBps",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        },
        {
            "type": "error",
            "name": "InvalidReveal",
            "inputs": [
                {
                    "name": "intentId",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ]
        },
        {
            "type": "error",
            "name": "LtvOutOfBounds",
            "inputs": [
                {
                    "name": "intentId",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ]
        },
        {
            "type": "error",
            "name": "MaxLtvTooHigh",
            "inputs": [
                {
                    "name": "maxLtvBps",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        },
        {
            "type": "error",
            "name": "MaxRateTooHigh",
            "inputs": [
                {
                    "name": "maxRateBps",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        },
        {
            "type": "error",
            "name": "MinLtvTooLow",
            "inputs": [
                {
                    "name": "minLtvBps",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        },
        {
            "type": "error",
            "name": "NoCollateralSpecified",
            "inputs": []
        },
        {
            "type": "error",
            "name": "NotIntentOwner",
            "inputs": []
        },
        {
            "type": "error",
            "name": "RateOutOfBounds",
            "inputs": [
                {
                    "name": "intentId",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ]
        },
        {
            "type": "error",
            "name": "TooManyCollateralTypes",
            "inputs": [
                {
                    "name": "collateralCount",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        }
    ];

export const COLLATERAL_OPTIONS = [
  { address: "0x0000000000000000000000000000000000000001", name: "ETH", symbol: "ETH" },
  { address: "0x0000000000000000000000000000000000000002", name: "WBTC", symbol: "WBTC" },
  { address: "0x0000000000000000000000000000000000000003", name: "USDC", symbol: "USDC" },
  { address: "0x0000000000000000000000000000000000000004", name: "DAI", symbol: "DAI" },
];

export const PROTOCOL_LIMITS = {
  MIN_LTV: 5000, // 50%
  MAX_LTV: 8000, // 80%
  MAX_RATE: 2000, // 20%
};