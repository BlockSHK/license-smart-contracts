const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer, secondPayer, thirdAccount } = await getNamedAccounts()
    const autoRenewSubscriptions = await ethers.getContract(
        "AutoRenewSubscriptionLicense",
        deployer
    )
    const toAddress = autoRenewSubscriptions.address
    const mapCoin = await ethers.getContract("MapCoin", secondPayer)

    console.log(`Got contract MapCoin at ${mapCoin.address}`)
    console.log(
        `Check Approve amount from ${secondPayer}  to address ${toAddress}`
    )
    const approveAmount = await mapCoin.allowance(secondPayer, toAddress)

    console.log(approveAmount.toNumber())
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
