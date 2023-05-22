const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer, secondPayer, thirdAccount } = await getNamedAccounts()
    const autoRenewSubscriptions = await ethers.getContract(
        "AutoRenewSubscriptionLicense",
        deployer
    )
    const toAddress = autoRenewSubscriptions.address
    const approveAmount = "1000"
    const mapCoin = await ethers.getContract("MapCoin", secondPayer)

    console.log(`Got contract MapCoin at ${mapCoin.address}`)
    console.log(
        `Approve ${approveAmount} token to address ${toAddress} for spend on behalf`
    )
    const transactionResponse = await mapCoin.approve(toAddress, approveAmount)
    await transactionResponse.wait()
    console.log(
        `Approve Complete :- ${approveAmount} map coin to ${toAddress} approved`
    )
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
