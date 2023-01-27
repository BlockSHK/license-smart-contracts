const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const toAddress = "0x76eD2B384f9fA8649E7c15d324367f78515183aE"
    const transferAmount = "10000000000000"
    const mapCoin = await ethers.getContract("MapCoin", deployer)

    console.log(`Got contract MapCoin at ${mapCoin.address}`)
    console.log(`Transfer token to address ${toAddress}...`)
    const transactionResponse = await mapCoin.transfer(
        toAddress,
        transferAmount
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
