const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer, secondPayer } = await getNamedAccounts()
    const perpetualLicense = await ethers.getContract(
        "PerpetualLicense",
        secondPayer
    )
    console.log(secondPayer)

    console.log(`Got contract Perpetual License at ${perpetualLicense.address}`)

    console.log("Buying a Petpetual License Token...")

    const transactionResponse = await perpetualLicense.buyToken({
        value: ethers.utils.parseEther("0.01"),
    })

    await transactionResponse.wait()
    console.log("Bought a License Token!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
