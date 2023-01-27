const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const toAddress = "0x76eD2B384f9fA8649E7c15d324367f78515183aE"
    const mapCoin = await ethers.getContract("MapCoin", deployer)

    console.log(`Got contract MapCoin at ${mapCoin.address}`)
    console.log(
        `Check Approve amount from ${deployer}  to address ${toAddress}`
    )
    const approveAmount = await mapCoin.allowance(deployer, toAddress)

    console.log(approveAmount.toNumber())
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
