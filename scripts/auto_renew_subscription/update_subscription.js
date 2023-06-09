const { ethers, getNamedAccounts, network } = require("hardhat")

const developmentChains = ["hardhat", "localhost"] // Add more if needed.

async function main() {
    const accounts = await ethers.getSigners()
    const deployer = accounts[0]
    const secondPayer = accounts[1]

    const subscriptionPeriodSecond = 60 * 60 * 24 * 30 // 30 days in seconds
    const autoRenewSubscriptionLicense = await ethers.getContract(
        "AutoRenewSubscriptionLicense"
    )

    const mapCoin = await ethers.getContract("MapCoin")

    console.log(`Using account ${secondPayer.address}`)
    const licensePrice = await autoRenewSubscriptionLicense.getLicensePrice()
    console.log(
        `Got contract Auto Renew Subscription License at ${autoRenewSubscriptionLicense.address}`
    )

    console.log("Transfer MapCoin to customer...")
    const transferAmount = ethers.utils.parseEther("1000")
    const transactionResponse = await mapCoin
        .connect(deployer)
        .transfer(secondPayer.address, transferAmount)
    await transactionResponse.wait()

    console.log("Approving MapCoin for contract...")
    const approveAmount = ethers.utils.parseEther("1000")
    const mapCoinFromCustomer = mapCoin.connect(secondPayer)
    const transactionResponseApprove = await mapCoinFromCustomer.approve(
        autoRenewSubscriptionLicense.address,
        approveAmount
    )
    await transactionResponseApprove.wait()

    console.log("Buying an Auto Renew Subscription License Token...")

    const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()
    await autoRenewSubscriptionLicense.connect(secondPayer).buyToken()

    console.log("Bought a License Token!")

    if (developmentChains.includes(network.name)) {
        console.log("In development environment. Simulating time...")

        await ethers.provider.send("evm_increaseTime", [
            subscriptionPeriodSecond,
        ])
        await ethers.provider.send("evm_mine")

        const blockNumBefore = await ethers.provider.getBlockNumber()
        const blockBefore = await ethers.provider.getBlock(blockNumBefore)
        const timestampBefore = blockBefore.timestamp
        console.log(`Timestamp Before: ${timestampBefore}`)

        const expirationTime =
            await autoRenewSubscriptionLicense.getExpirationTime(tokenId)
        console.log("Expiration time Before", expirationTime.toNumber())

        await autoRenewSubscriptionLicense.updateSubscription(tokenId)

        const blockNumAfter = await ethers.provider.getBlockNumber()
        const blockAfter = await ethers.provider.getBlock(blockNumAfter)
        const timestampAfter = blockAfter.timestamp
        console.log(`Timestamp After: ${timestampAfter}`)

        const expirationTimeAfterUpdate =
            await autoRenewSubscriptionLicense.getExpirationTime(tokenId)
        console.log(
            "Expiration time after update",
            expirationTimeAfterUpdate.toNumber()
        )
    } else {
        console.log("Not in development environment. Can't simulate time.")
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
