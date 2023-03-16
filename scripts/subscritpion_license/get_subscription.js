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
    console.log(
        deployer,
        toAddress,
        fromAddress,
        mapCoinAddress,
        licensePrice.toNumber(),
        periodSeconds.toNumber(),
        gasPrice.toNumber()
    )

    const fromBalance = await mapCoin.balanceOf(fromAddress)

    if (fromBalance.toNumber() <= 0) {
        const transferAmount = "10000000"
        const transactionResponse = await mapCoin.transfer(
            fromAddress,
            transferAmount
        )
        await transactionResponse.wait()
    }
    console.log(
        "from Balance",
        (await mapCoin.balanceOf(fromAddress)).toNumber()
    )
    const approveAmount = await mapCoin.allowance(
        fromAddress,
        subscriptionLicense.address
    )

    if (approveAmount.toNumber() <= 0) {
        const approveAmount = "1000"
        const mapCoinFrom = await ethers.getContract("MapCoin", accounts[1])
        console.log(`Got contract MapCoin at ${mapCoin.address}`)
        console.log(
            `Approve ${approveAmount} token to address ${subscriptionLicense.address} for spend on behalf`
        )

        const transactionResponseApprove = await mapCoinFrom.approve(
            subscriptionLicense.address,
            approveAmount
        )

        await transactionResponseApprove.wait()
    }

    const approveAmountFinal = await mapCoin.allowance(
        fromAddress,
        subscriptionLicense.address
    )
    console.log(
        `Approve amount from ${fromAddress}  to address ${
            subscriptionLicense.address
        } is ${approveAmountFinal.toNumber()}`
    )

    const subscriptionHash = await subscriptionLicense.getSubscriptionHash(
        fromAddress, //the subscriber
        toAddress, //the publisher
        mapCoinAddress, //the token address paid to the publisher
        licensePrice, //the token amount paid to the publisher
        periodSeconds, //the period in seconds between payments
        gasPrice, //the amount of tokens or eth to pay relayer (0 for free)
        nonce // to allow multiple subscriptions with the same parameters
    )

    let signature = await accounts[1].signMessage(
        ethers.utils.arrayify(subscriptionHash)
    )

    let signerVerify = await subscriptionLicense.getSubscriptionSigner(
        subscriptionHash,
        signature
    )
    console.log(`Sign Verify :- ${signerVerify}`)
    let isSubscriptionReady = await subscriptionLicense.isSubscriptionReady(
        fromAddress, //the subscriber
        toAddress, //the publisher
        mapCoinAddress, //the token address paid to the publisher
        licensePrice, //the token amount paid to the publisher
        periodSeconds, //the period in seconds between payments
        gasPrice, //the amount of tokens or eth to pay relayer (0 for free)
        nonce, // to allow multiple subscriptions with the same parameters
        signature
    )
    console.log(`Is Subscription Ready :- ${isSubscriptionReady}`)
    if (isSubscriptionReady) {
        let executeSubscription = await subscriptionLicense.executeSubscription(
            fromAddress, //the subscriber
            toAddress, //the publisher
            mapCoinAddress, //the token address paid to the publisher
            licensePrice, //the token amount paid to the publisher
            periodSeconds, //the period in seconds between payments
            gasPrice, //the amount of tokens or eth to pay relayer (0 for free)
            nonce, // to allow multiple subscriptions with the same parameters
            signature
        )
        await executeSubscription.wait()
        console.log("Subscription Executed")
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
