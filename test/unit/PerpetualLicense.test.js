const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
describe("PerpetualLicense", async function () {
    let perpetualLicense
    const sendValue = ethers.utils.parseEther("1")
    beforeEach(async () => {
        const { deployer, secondPayer } = await getNamedAccounts()
        await deployments.fixture(["all"])
        perpetualLicense = await ethers.getContract(
            "PerpetualLicense",
            deployer
        )
    })

    // describe("constructor", function () {
    //     it("sets the aggregator addresses correctly", async () => {
    //         const response = await licenseFactory.getPriceFeed()
    //         assert.equal(response, mockV3Aggregator.address)
    //     })
    // })

    describe("mintToken", async function () {
        it("should revert if sender doesn't send enough ETH", async () => {
            const licensePrice = await perpetualLicense.getLicensePrice()
            const insufficientEth = licensePrice.sub(1)
            await expect(perpetualLicense.mintToken({ value: insufficientEth }))
                .to.be.revertedWithCustomError
        })

        it("should mint a new token if sender sends enough ETH", async () => {
            const licensePrice = await perpetualLicense.getLicensePrice()
            const tokenId = await perpetualLicense.getTokenCounter()
            await expect(perpetualLicense.mintToken({ value: licensePrice }))
                .to.emit(perpetualLicense, "CreatedLicenseToken")
                .withArgs(tokenId + 1, licensePrice)
        })
    })

    describe("withdraw", function () {
        beforeEach(async () => {
            await perpetualLicense.mintToken({ value: sendValue })
        })

        it("Only allows the owner to withdraw", async function () {
            const accounts = await ethers.getSigners()
            const perpetualLicenseContract = await perpetualLicense.connect(
                accounts[1]
            )
            await expect(perpetualLicenseContract.withdraw()).to.be.reverted
        })
    })
})
