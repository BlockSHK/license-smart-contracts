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

    let wallet = new ethers.Wallet(
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    )

    let toAddress = "0x76eD2B384f9fA8649E7c15d324367f78515183aE"
    let fromAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    let mapCoinAddress = mapCoin.address
    let licensePrice = "10"
    let periodSeconds = "60"
    let gasPrice = "1"
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

    let signature = await wallet.signMessage(
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
        let cancelSubscription = await subscriptionLicense.cancelSubscription(
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
