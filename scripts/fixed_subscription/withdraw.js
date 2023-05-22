const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer, secondPayer } = await getNamedAccounts()
    const fixedSubscriptionLicense = await ethers.getContract(
        "FixedSubscriptionLicense",
        secondPayer
    )
    console.log(secondPayer)

    console.log(
        `Got contract Fixed Subscription License at ${fixedSubscriptionLicense.address}`
    )

    console.log("Buying a Fixed Subscription License Token...")

    const buyTokenResponse = await fixedSubscriptionLicense.buyToken({
        value: ethers.utils.parseEther("0.01"),
    })

    await buyTokenResponse.wait()
    console.log("Bought a License Token!")

    const fixedSubscriptionLicenseOwner = await ethers.getContract(
        "FixedSubscriptionLicense",
        deployer
    )
    console.log(
        `Got contract fixed subscription at ${fixedSubscriptionLicenseOwner.address}`
    )
    console.log("Withdrawing from contract...")
    const balanceBefore = await ethers.provider.getBalance(deployer)
    console.log(ethers.utils.formatEther(balanceBefore))
    const transactionResponse = await fixedSubscriptionLicenseOwner.withdraw()
    await transactionResponse.wait()
    const balanceAfter = await ethers.provider.getBalance(deployer)
    console.log(ethers.utils.formatEther(balanceAfter))
    console.log("Got it back!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
