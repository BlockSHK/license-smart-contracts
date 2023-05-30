const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require("fs")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    let mapCoin = await deployments.get("MapCoin")

    let toAddress = deployer
    let mapCoinAddress = mapCoin.address
    let licensePrice = "10"
    let periodSeconds = "60"
    let gasPrice = "1"
    let licenseName = "Microsoft"
    let licenseAgreementUrl =
        "https://ipfs.io/ipfs/QmZmX5iTJc3C98dbkwrHMJsTGATduYNHCUmqpz7t4iSQpW"
    log("----------------------------------------------------")
    arguments = [
        toAddress,
        mapCoinAddress,
        licensePrice,
        periodSeconds,
        gasPrice,
        licenseName,
        licenseAgreementUrl,
    ]
    const mapLicense = await deploy("SubscriptionLicense", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    // Verify the deployment
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying...")
        await verify(mapLicense.address, arguments)
    }
}

module.exports.tags = ["all", "subscriptionRecurrent", "notUsed"]
