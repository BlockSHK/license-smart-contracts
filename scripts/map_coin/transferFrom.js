const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const fromAddress = deployer
    console.log(deployer)
    const { secondPayer } = await getNamedAccounts()
    const toAddress = "0x8f739E7adA0e832f61Bd5eD375aaa91144c2d558"
    const transferAmount = "1"
    const mapCoin = await ethers.getContract("MapCoin", secondPayer)

    console.log(`Got contract MapCoin at ${mapCoin.address}`)
    console.log(
        `Transfer token from ${fromAddress} to address ${toAddress} by ${secondPayer}...`
    )
    const transactionResponse = await mapCoin.transferFrom(
        deployer,
        toAddress,
        transferAmount,
        { gasLimit: 50000 }
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
