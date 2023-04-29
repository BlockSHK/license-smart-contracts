const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
describe("AutoRenewSubscriptionLicense", async function () {
    let autoRenewSubscriptionLicense, accounts
    const sendValue = ethers.utils.parseEther("1")
    beforeEach(async () => {
        const { deployer, secondPayer } = await getNamedAccounts()
        accounts = await ethers.getSigners()
        await deployments.fixture(["all"])
        autoRenewSubscriptionLicense = await ethers.getContract(
            "AutoRenewSubscriptionLicense",
            deployer
        )
    })

    describe("buyToken", async function () {
        it("should revert if sender doesn't send enough ETH", async () => {
            const licensePrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const insufficientEth = licensePrice.sub(1)
            await expect(
                autoRenewSubscriptionLicense.buyToken({
                    value: insufficientEth,
                })
            ).to.be.revertedWithCustomError
        })
    })
})
