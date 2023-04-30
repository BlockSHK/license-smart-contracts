const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require("fs")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let mapCoin = await deployments.get("MapCoin")

    let licensePrice = "10"
    let mapCoinAddress = mapCoin.address
    let gasPrice = "1"
    let companyName = "Google"
    let licenseName = "Google-bard-perpetual"
    let licenseAgreementUrl =
        "https://ipfs.io/ipfs/QmZmX5iTJc3C98dbkwrHMJsTGATduYNHCUmqpz7t4iSQpW"
    let subscriptionPeriodSecond = 60 * 60 * 24 * 30

    log("----------------------------------------------------")
    arguments = [
        companyName,
        licenseName,
        licenseAgreementUrl,
        mapCoinAddress,
        licensePrice,
        subscriptionPeriodSecond,
        gasPrice,
    ]
    const autoRenewSubscriptionLicense = await deploy(
        "AutoRenewSubscriptionLicense",
        {
            from: deployer,
            args: arguments,
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1,
        }
    )

    // Verify the deployment
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying...")
        await verify(autoRenewSubscriptionLicense.address, arguments)
    }
}

module.exports.tags = ["all", "autoRenewSubscription"]
