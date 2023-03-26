const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require("fs")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    log("-------------License Activation Contracts----------------")
    const LicenseActivation = await deploy("LicenseActivation", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    let licensePrice = "10000000000000000" //0.01 ETH
    let companyName = "Google"
    let licenseActivationAddress = LicenseActivation.address
    let licenseName = "Google-bard-perpetual"
    let royaltyPercentage = "1" //1%

    log(
        "------------Deploy Perpetual Licensing with activation Contract-----------------"
    )
    arguments = [
        companyName,
        licenseName,
        licensePrice,
        royaltyPercentage,
        licenseActivationAddress,
    ]
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

    log(
        "------------Update License Activation with Perpetual License Address-----------------"
    )

    const perpetualLicense = await ethers.getContract(
        "PerpetualLicense",
        deployer
    )
    const ActivationContract = await ethers.getContract(
        "LicenseActivation",
        deployer
    )
    const transactionResponse = await ActivationContract.initialize(
        perpetualLicense.address
    )
    await transactionResponse.wait()
    console.log(
        `License Activation Contract initialized with Perpetual License Address :- ${perpetualLicense.address}`
    )
}

module.exports.tags = ["all", "token"]
