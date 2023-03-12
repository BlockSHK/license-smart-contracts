const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer, secondPayer } = await getNamedAccounts()
    const fixedSubscriptionlLicense = await ethers.getContract(
        "FixedSubscriptionLicense",
        secondPayer
    )
    console.log(secondPayer)

    console.log(
        `Got contract Fixed Subscription License at ${fixedSubscriptionlLicense.address}`
    )

    console.log("Buying a Fixed Subscription License Token...")

    const transactionResponse = await fixedSubscriptionlLicense.buyToken({
        value: ethers.utils.parseEther("0.1"),
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
