const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer, secondPayer, thirdAccount } = await getNamedAccounts()
    const toAddress = secondPayer
    const mapCoin = await ethers.getContract("MapCoin", deployer)

    console.log(`Got contract MapCoin at ${mapCoin.address}`)
    console.log(`Getting balance of address ${toAddress}...`)

    const balanceOfAddress = await mapCoin.balanceOf(toAddress)
    console.log(balanceOfAddress.toNumber())
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
