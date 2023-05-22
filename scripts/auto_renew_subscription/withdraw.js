const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer, secondPayer } = await getNamedAccounts()

    const autoRenewSubscriptionLicenseOwner = await ethers.getContract(
        "AutoRenewSubscriptionLicense",
        deployer
    )

    const mapCoin = await ethers.getContract("MapCoin", deployer)

    console.log(
        `Got contract fixed subscription at ${autoRenewSubscriptionLicenseOwner.address}`
    )
    console.log("Withdrawing from contract...")
    const balanceBefore = await mapCoin.balanceOf(deployer)
    console.log(ethers.utils.formatEther(balanceBefore))
    const transactionResponse =
        await autoRenewSubscriptionLicenseOwner.withdraw()
    await transactionResponse.wait()
    const balanceAfter = await mapCoin.balanceOf(deployer)
    console.log(ethers.utils.formatEther(balanceAfter))
    console.log("Got it back!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
