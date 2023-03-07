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

    const buyTokenResponse = await perpetualLicense.mintToken({
        value: ethers.utils.parseEther("0.01"),
    })

    await buyTokenResponse.wait()
    console.log("Bought a License Token!")

    const perpetualLicenseOwner = await ethers.getContract(
        "PerpetualLicense",
        deployer
    )
    console.log(
        `Got contract LicenseFactory at ${perpetualLicenseOwner.address}`
    )
    console.log("Withdrawing from contract...")
    const balanceBefore = await ethers.provider.getBalance(deployer)
    console.log(ethers.utils.formatEther(balanceBefore))
    const transactionResponse = await perpetualLicenseOwner.withdraw()
    await transactionResponse.wait()
    const balanceAfter = await ethers.provider.getBalance(deployer)
    console.log(ethers.utils.formatEther(balanceAfter))
    console.log(transactionResponse)
    console.log("Got it back!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
