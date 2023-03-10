const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require("fs")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    let mapCoin = await deployments.get("MapCoin")

    let toAddress = "0x76eD2B384f9fA8649E7c15d324367f78515183aE"
    let mapCoinAddress = mapCoin.address
    let licensePrice = "10"
    let periodSeconds = "60"
    let gasPrice = "1"
    let licenseName = "Microsoft"

    log("----------------------------------------------------")
    arguments = [
        toAddress,
        mapCoinAddress,
        licensePrice,
        periodSeconds,
        gasPrice,
        licenseName,
    ]
    const mapLicense = await deploy("SubscriptionLicense", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    // // Verify the deployment
    // if (
    //     !developmentChains.includes(network.name) &&
    //     process.env.ETHERSCAN_API_KEY
    // ) {
    //     log("Verifying...")
    //     await verify(mapLicense.address, arguments)
    // }
}

module.exports.tags = ["all", "subscription"]
