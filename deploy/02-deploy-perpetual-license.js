const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require("fs")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let licensePrice = "10000000000000000" //0.01 ETH
    let companyName = "Google"
    let licenseName = "Google-bard-perpetual"
    let royaltyPercentage = "1" //1%

    log("----------------------------------------------------")
    arguments = [companyName, licenseName, licensePrice, royaltyPercentage]
    const tokenLicense = await deploy("PerpetualLicense", {
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
        await verify(tokenLicense.address, arguments)
    }
}

module.exports.tags = ["all", "token"]
