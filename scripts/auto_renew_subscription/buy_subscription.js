const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer, secondPayer } = await getNamedAccounts()
    const autoRenewSubscriptionlLicense = await ethers.getContract(
        "AutoRenewSubscriptionLicense",
        secondPayer
    )
    console.log(secondPayer)

    console.log(
        `Got contract Auto Renew Subscription License at ${autoRenewSubscriptionlLicense.address}`
    )

    console.log("Buying a Auto Renew Subscription License Token...")

    console.log("Approve 1000 token to address auto Renew Subscription License")
    const toAddress = autoRenewSubscriptionlLicense.address
    const approveAmount = "1000"
    const mapCoin = await ethers.getContract("MapCoin", secondPayer)

    console.log(`Got contract MapCoin at ${mapCoin.address}`)
    console.log(
        `Approve ${approveAmount} token to address ${toAddress} for spend on behalf`
    )
    const transactionResponseApprove = await mapCoin.approve(
        toAddress,
        approveAmount
    )
    await transactionResponseApprove.wait()

    const transactionResponse = await autoRenewSubscriptionlLicense.buyToken()

    await transactionResponse.wait()
    console.log("Bought a License Token!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
