const { ethers, getNamedAccounts, network } = require("hardhat")

const developmentChains = ["hardhat", "localhost"] // Assuming these are your development chains, add more if needed.

async function main() {
    const { deployer, secondPayer } = await getNamedAccounts()

    const fixedSubscriptionLicense = await ethers.getContract(
        "FixedSubscriptionLicense",
        secondPayer
    )

    console.log(`Using account ${secondPayer}`)
    const licensePrice = await fixedSubscriptionLicense.getLicensePrice()
    console.log(
        `Got contract Fixed Subscription License at ${fixedSubscriptionLicense.address}`
    )

    console.log("Buying a Fixed Subscription License Token...")

    const tokenId = await fixedSubscriptionLicense.getTokenCounter()
    const transactionResponse = await fixedSubscriptionLicense.buyToken({
        value: licensePrice,
    })

    await transactionResponse.wait()
    console.log("Bought a License Token!")

    if (developmentChains.includes(network.name)) {
        const oneMinute = 60
        await ethers.provider.send("evm_increaseTime", [oneMinute])
        await ethers.provider.send("evm_mine")
        const blockNumBefore = await ethers.provider.getBlockNumber()
        const blockBefore = await ethers.provider.getBlock(blockNumBefore)
        const timestampBefore = blockBefore.timestamp
        console.log(`Timestamp Before: ${timestampBefore}`)

        const expirationTime = await fixedSubscriptionLicense.getExpirationTime(
            tokenId.toNumber()
        )
        console.log("Expiration time Before", expirationTime.toNumber())

        await fixedSubscriptionLicense.updateSubscription(tokenId, {
            value: licensePrice,
        })

        const blockNumAfter = await ethers.provider.getBlockNumber()
        const blockAfter = await ethers.provider.getBlock(blockNumAfter)
        const timestampAfter = blockAfter.timestamp
        console.log(`Timestamp After: ${timestampAfter}`)

        const expirationTimeAfterUpdate =
            await fixedSubscriptionLicense.getExpirationTime(tokenId.toNumber())
        console.log(
            "Expiration time after",
            expirationTimeAfterUpdate.toNumber()
        )
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
