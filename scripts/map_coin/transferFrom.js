const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer, secondPayer, thirdAccount } = await getNamedAccounts()

    const mapCoinDeployer = await ethers.getContract("MapCoin", deployer)
    const approveAmount = "1000"
    console.log(`Got contract MapCoin at ${mapCoinDeployer.address}`)
    console.log(
        `Approve ${approveAmount} token to address ${secondPayer} for spend on behalf by ${deployer}...`
    )
    const transactionResponseApprove = await mapCoinDeployer.approve(
        secondPayer,
        approveAmount
    )
    await transactionResponseApprove.wait()
    console.log(
        `Approve Complete :- ${approveAmount} map coin to ${secondPayer} approved`
    )

    const toAddress = thirdAccount
    const transferAmount = "1"
    const mapCoin = await ethers.getContract("MapCoin", secondPayer)

    console.log(`Got contract MapCoin at ${mapCoin.address}`)
    console.log(
        `Transfer token from ${deployer} to address ${toAddress} by ${secondPayer}...`
    )
    const transactionResponse = await mapCoin.transferFrom(
        deployer,
        toAddress,
        transferAmount,
        { gasLimit: 5000000 }
    )

    await transactionResponse.wait()
    console.log(
        `Transfer Complete :- ${transferAmount} map coin to ${toAddress}`
    )
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
