const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const toAddress = "0x76eD2B384f9fA8649E7c15d324367f78515183aE"
    const approveAmount = "1000"
    const mapCoin = await ethers.getContract("MapCoin", deployer)

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
