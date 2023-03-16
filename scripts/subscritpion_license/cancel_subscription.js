const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const sevenDays = 7 * 24 * 60 * 60
    const oneMinute = 60

    await ethers.provider.send("evm_increaseTime", [oneMinute])
    await ethers.provider.send("evm_mine")

    const { deployer, secondPayer } = await getNamedAccounts()
    const mapCoin = await ethers.getContract("MapCoin", deployer)
    console.log(deployer)
    const subscriptionLicense = await ethers.getContract(
        "SubscriptionLicense",
        deployer
    )

    const accounts = await ethers.getSigners()

    let toAddress = await subscriptionLicense.getRequiredToAddress()
    let fromAddress = accounts[1].address
    let mapCoinAddress = await subscriptionLicense.getRequiredTokenAddress()
    let licensePrice = await subscriptionLicense.getRequiredTokenAmount()
    let periodSeconds = await subscriptionLicense.getRequiredPeriodSeconds()
    let gasPrice = await subscriptionLicense.getRequiredGasPrice()
    let nonce = 1

    const subscriptionHash = await subscriptionLicense.getSubscriptionHash(
        fromAddress,
        toAddress,
        mapCoinAddress,
        licensePrice,
        periodSeconds,
        gasPrice,
        nonce
    )

    let signature = await accounts[1].signMessage(
        ethers.utils.arrayify(subscriptionHash)
    )

    let signerVerify = await subscriptionLicense.getSubscriptionSigner(
        subscriptionHash,
        signature
    )

    console.log(`Sign Verify :- ${signerVerify}`)
    let isSubscriptionActive = await subscriptionLicense.isSubscriptionActive(
        subscriptionHash,
        periodSeconds
    )

    console.log(`Is Subscription Active :- ${isSubscriptionActive}`)
    if (isSubscriptionActive) {
        const subscriptionLicenseFrom = await ethers.getContract(
            "SubscriptionLicense",
            accounts[1]
        )
        let cancelSubscription =
            await subscriptionLicenseFrom.cancelSubscription(
                fromAddress, //the subscriber
                toAddress, //the publisher
                mapCoinAddress, //the token address paid to the publisher
                licensePrice, //the token amount paid to the publisher
                periodSeconds, //the period in seconds between payments
                gasPrice, //the amount of tokens or eth to pay relayer (0 for free)
                nonce, // to allow multiple subscriptions with the same parameters
                signature
            )
        await cancelSubscription.wait()
        console.log("Subscription Canceled")
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
