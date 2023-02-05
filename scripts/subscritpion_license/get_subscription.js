const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer, secondPayer } = await getNamedAccounts()
    const mapCoin = await ethers.getContract("MapCoin", deployer)

    const subscriptionLicense = await ethers.getContract(
        "SubscriptionLicense",
        deployer
    )

    let wallet = new ethers.Wallet(
        "c0c7fa3872dc6126898718a47ad6a0dc1c17ca0b8b0209213e0009bac8c2d66a"
    )

    let toAddress = "0x76eD2B384f9fA8649E7c15d324367f78515183aE"
    let fromAddress = "0xAa62006DcB8Ea5e90Ec241FA33768aa8c4887a34"
    let mapCoinAddress = mapCoin.address
    let licensePrice = "10"
    let periodSeconds = "60"
    let gasPrice = "1"
    let nonce = 1

    console.log(`Got contract MapCoin at ${mapCoin.address}`)

    const fromBalance = await mapCoin.balanceOf(fromAddress)

    if (fromBalance.toNumber() <= 0) {
        const transferAmount = "10000000"
        const transactionResponse = await mapCoin.transfer(
            fromAddress,
            transferAmount
        )
        await transactionResponse.wait()
    }

    const approveAmount = await mapCoin.allowance(fromAddress, toAddress)

    if (approveAmount.toNumber() <= 0) {
        const approveAmount = "1000"
        const mapCoinNew = await ethers.getContract("MapCoin")

        console.log(`Got contract MapCoin at ${mapCoin.address}`)
        console.log(
            `Approve ${approveAmount} token to address ${toAddress} for spend on behalf`
        )

        const transactionResponseApprove = await mapCoinNew.approve(
            toAddress,
            approveAmount
        )

        await transactionResponseApprove.wait()
    }

    const approveAmountFinal = await mapCoin.allowance(fromAddress, toAddress)
    console.log(
        `Approve amount from ${fromAddress}  to address ${toAddress} is ${approveAmountFinal.toNumber()}`
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

    let signature = await wallet.signMessage(
        ethers.utils.arrayify(subscriptionHash)
    )

    let signerVerify = await subscriptionLicense.getSubscriptionSigner(
        subscriptionHash,
        signature
    )

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
    console.log(isSubscriptionReady)
    console.log(`Transfer Complete :- ${signerVerify}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
