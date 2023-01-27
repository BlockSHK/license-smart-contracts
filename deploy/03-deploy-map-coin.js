const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
require("dotenv").config()

const INITIAL_PRICE = "100000000000000000000" // 2000
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("----------------------------------------------------")
    log("Deploying MapCoin and waiting for confirmations...")
    const mapCoin = await deploy("MapCoin", {
        from: deployer,
        args: [INITIAL_PRICE],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`MapCoin deployed at ${mapCoin.address}`)

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(mapCoin.address, [ethUsdPriceFeedAddress])
    }
}

module.exports.tags = ["all", "mapCoin"]
