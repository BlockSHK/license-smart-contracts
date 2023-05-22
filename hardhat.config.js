require("@nomicfoundation/hardhat-toolbox")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("hardhat-deploy")
require("dotenv").config()
const { solidityDocgen } = require("solidity-docgen")
/** @type import('hardhat/config').HardhatUserConfig */

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || ""
const GOERLI_RPC_URL =
    process.env.GOERLI_RPC_URL ||
    "https://eth-goerli.g.alchemy.com/v2/[YOUR-API-KEY]"
const SEPOLIA_RPC_URL =
    process.env.SEPOLIA_RPC_URL ||
    "https://eth-sepolia.g.alchemy.com/v2/[YOUR-API-KEY]"
const PRIVATE_KEY = process.env.PRIVATE_KEY || "" //Account 10
const PRIVATE_KEY_TWO = process.env.PRIVATE_KEY_TWO || "" //Account 9
const PRIVATE_KEY_THREE = process.env.PRIVATE_KEY_THREE || "" //Account 1
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
        },
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: [PRIVATE_KEY, PRIVATE_KEY_TWO, PRIVATE_KEY_THREE],
            chainId: 5,
            blockConfirmations: 6,
        },

        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY, PRIVATE_KEY_TWO, PRIVATE_KEY_THREE],
            chainId: 11155111,
            blockConfirmations: 3,
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.17",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
        docgen: {
            runOnCompile: true,
            outputDir: "Documentation",
            outputFile: "solidity-docs.json",
            only: [],
            except: [],
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: true,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        coinmarketcap: COINMARKETCAP_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
            2: 0,
        },
        secondPayer: {
            default: 1,
            1: 1,
            2: 1,
        },
        thirdAccount: {
            default: 2,
            1: 2,
            2: 2,
        },
    },
    mocha: {
        timeout: 500000,
    },
}
