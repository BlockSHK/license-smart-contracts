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

        it("should update the tokenCounter when a new token is minted", async () => {
            const licensePrice = await perpetualLicense.getLicensePrice()
            const tokenIdBefore = await perpetualLicense.getTokenCounter()
            await perpetualLicense.mintToken({ value: licensePrice })
            const tokenIdAfter = await perpetualLicense.getTokenCounter()
            expect(tokenIdAfter).to.equal(tokenIdBefore.add(1))
        })

        it("should emit a CreatedLicenseToken event when a new token is minted", async () => {
            const licensePrice = await perpetualLicense.getLicensePrice()

            const tokenIdBefore = await perpetualLicense.getTokenCounter()
            const contractTx = await perpetualLicense.mintToken({
                value: licensePrice,
            })

            ContractReceipt = await contractTx.wait()
            assert.isDefined(ContractReceipt, "receipt should be defined")
            const event = ContractReceipt.events.find(
                (e) => e.event === "CreatedLicenseToken"
            )
            assert.isDefined(
                event,
                "CreatedLicenseToken event should be emitted"
            )

            expect(event.args.tokenId).to.equal(tokenIdBefore.add(1))
            expect(event.args.licensePrice).to.equal(licensePrice)
        })
    })
    describe("getLicensePrice", async function () {
        it("should return the correct license price", async () => {
            const licensePrice = await perpetualLicense.getLicensePrice()
            expect(licensePrice).to.equal(ethers.utils.parseEther("0.01"))
        })
    })
    describe("updateLicensePrice", () => {
        it("allows the owner to update the license price", async () => {
            const newLicensePrice = 2000
            const oldLicensePrice = await perpetualLicense.getLicensePrice()

            // Update the license price
            await perpetualLicense.updateLicensePrice(newLicensePrice)

            const updatedLicensePrice = await perpetualLicense.getLicensePrice()

            // Check that the license price was updated
            expect(updatedLicensePrice).to.equal(newLicensePrice)
            expect(updatedLicensePrice).to.not.equal(oldLicensePrice)
        })

        it("reverts if a non-owner tries to update the license price", async () => {
            const newLicensePrice = 2000
            const accounts = await ethers.getSigners()
            // Attempt to update the license price as a non-owner
            await expect(
                perpetualLicense
                    .connect(accounts[1])
                    .updateLicensePrice(newLicensePrice)
            ).to.be.rejectedWith("Ownable: caller is not the owner")
        })

        it("should revert if the new license price is zero", async () => {
            await expect(
                perpetualLicense.updateLicensePrice(0)
            ).to.be.revertedWith("Price must be greater than zero")
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
            await expect(
                perpetualLicenseContract.withdraw()
            ).to.be.rejectedWith("Ownable: caller is not the owner")
        })

        it("should transfer ether to the owner's address when called by the owner", async () => {
            const accounts = await ethers.getSigners()
            const perpetualLicenseContractSecondPayer =
                await perpetualLicense.connect(accounts[1])
            const licensePrice =
                await perpetualLicenseContractSecondPayer.getLicensePrice()
            const tokenId =
                await perpetualLicenseContractSecondPayer.getTokenCounter()
            await expect(
                perpetualLicenseContractSecondPayer.mintToken({
                    value: licensePrice,
                })
            )
                .to.emit(
                    perpetualLicenseContractSecondPayer,
                    "CreatedLicenseToken"
                )
                .withArgs(tokenId.toNumber() + 1, licensePrice)
            const { deployer, secondPayer } = await getNamedAccounts()
            const ownerBalanceBefore = await ethers.provider.getBalance(
                deployer
            )
            // console.log(
            //     "owner balance before:",
            //     ethers.utils.formatEther(ownerBalanceBefore)
            // )
            const withdrawingAmount = await ethers.provider.getBalance(
                perpetualLicense.address
            )
            // console.log(
            //     "withdrawing amount",
            //     ethers.utils.formatEther(withdrawingAmount)
            // )
            const transactionResponse = await perpetualLicense.withdraw()
            const receipt = await transactionResponse.wait()
            // console.log(receipt)
            // console.log(
            //     "total ether spent on gas for transaction: \t",
            //     ethers.utils.formatEther(
            //         receipt.gasUsed.mul(receipt.effectiveGasPrice)
            //     )
            // )

            const ownerBalanceAfter = await ethers.provider.getBalance(deployer)
            // console.log(
            //     "owner balance after:",
            //     ethers.utils.formatEther(ownerBalanceAfter)
            // )
            const gasCost = await ethers.provider.getGasPrice() // gas cost for a basic transaction
            const expectedBalance = ownerBalanceBefore
                .add(withdrawingAmount)
                .sub(receipt.gasUsed.mul(receipt.effectiveGasPrice))

            // console.log("Gas Cost:", ethers.utils.formatEther(gasCost))
            // console.log("expected balance:", expectedBalance.toString())

            expect(ownerBalanceAfter).to.equal(expectedBalance)
        })
    })
})
