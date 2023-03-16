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

    describe("buyToken", async function () {
        it("should revert if sender doesn't send enough ETH", async () => {
            const licensePrice = await perpetualLicense.getLicensePrice()
            const insufficientEth = licensePrice.sub(1)
            await expect(perpetualLicense.buyToken({ value: insufficientEth }))
                .to.be.revertedWithCustomError
        })

        it("should mint a new token if sender sends enough ETH", async () => {
            const licensePrice = await perpetualLicense.getLicensePrice()
            const tokenId = await perpetualLicense.getTokenCounter()
            await expect(perpetualLicense.buyToken({ value: licensePrice }))
                .to.emit(perpetualLicense, "CreatedLicenseToken")
                .withArgs(tokenId + 1, licensePrice)
        })

        it("should update the tokenCounter when a new token is minted", async () => {
            const licensePrice = await perpetualLicense.getLicensePrice()
            const tokenIdBefore = await perpetualLicense.getTokenCounter()
            await perpetualLicense.buyToken({ value: licensePrice })
            const tokenIdAfter = await perpetualLicense.getTokenCounter()
            expect(tokenIdAfter).to.equal(tokenIdBefore.add(1))
        })

        it("should emit a CreatedLicenseToken event when a new token is minted", async () => {
            const licensePrice = await perpetualLicense.getLicensePrice()

            const tokenIdBefore = await perpetualLicense.getTokenCounter()
            const contractTx = await perpetualLicense.buyToken({
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

    describe("mintToken", async function () {
        it("should revert if sender isn't the owner", async () => {
            const accounts = await ethers.getSigners()
            // Attempt to update the license price as a non-owner
            await expect(
                perpetualLicense
                    .connect(accounts[1])
                    .mintToken(accounts[2].address)
            ).to.be.rejectedWith("Ownable: caller is not the owner")
        })

        it("should mint a new token if the caller is owner", async () => {
            const accounts = await ethers.getSigners()
            const licensePrice = await perpetualLicense.getLicensePrice()
            const tokenId = await perpetualLicense.getTokenCounter()
            await expect(perpetualLicense.mintToken(accounts[2].address))
                .to.emit(perpetualLicense, "CreatedLicenseToken")
                .withArgs(tokenId + 1, licensePrice)
        })
    })
    describe("getLicensePrice", async function () {
        it("should return the correct license price", async () => {
            const licensePrice = await perpetualLicense.getLicensePrice()
            expect(licensePrice).to.equal(ethers.utils.parseEther("0.01"))
        })
    })

    describe("tokenURI", async function () {
        it("should return the token URI", async () => {
            const accounts = await ethers.getSigners()
            const perpetualLicenseContractSecondPayer =
                await perpetualLicense.connect(accounts[1])
            const licensePrice =
                await perpetualLicenseContractSecondPayer.getLicensePrice()
            const tokenId =
                await perpetualLicenseContractSecondPayer.getTokenCounter()

            // Buy the token
            await expect(
                perpetualLicenseContractSecondPayer.buyToken({
                    value: licensePrice,
                })
            )
                .to.emit(
                    perpetualLicenseContractSecondPayer,
                    "CreatedLicenseToken"
                )
                .withArgs(tokenId.toNumber() + 1, licensePrice)

            const tokenURI = await perpetualLicenseContractSecondPayer.tokenURI(
                tokenId.toNumber()
            )
            expect(tokenURI).to.be.equal(
                "data:application/json;base64,eyJuYW1lIjoiR29vZ2xlIiwibGljZW5zZSBuYW1lIjoiR29vZ2xlLWJhcmQtcGVycGV0dWFsIiwibGljZW5zZSBUeXBlIjoiUGVycGV0dWFsIiwicHJpY2UiOiIxMDAwMDAwMDAwMDAwMDAwMCIsInRva2VuSUQiOiIwIn0="
            )
        })

        it("Fails when call the token URI of non existance token ID", async () => {
            await expect(
                perpetualLicense.tokenURI(1)
            ).to.be.revertedWithCustomError(
                perpetualLicense,
                "ERC721Metadata__URI_QueryFor_NonExistentToken"
            )
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

    describe("Transfer License", async function () {
        it("Transfer the license token", async () => {
            const accounts = await ethers.getSigners()
            const perpetualLicenseContractSecondPayer =
                await perpetualLicense.connect(accounts[1])
            const licensePrice =
                await perpetualLicenseContractSecondPayer.getLicensePrice()
            const tokenId =
                await perpetualLicenseContractSecondPayer.getTokenCounter()

            // Buy the token
            await expect(
                perpetualLicenseContractSecondPayer.buyToken({
                    value: licensePrice,
                })
            )
                .to.emit(
                    perpetualLicenseContractSecondPayer,
                    "CreatedLicenseToken"
                )
                .withArgs(tokenId.toNumber() + 1, licensePrice)

            // Transfer the token
            await perpetualLicenseContractSecondPayer[
                "safeTransferFrom(address,address,uint256)"
            ](accounts[1].address, accounts[2].address, tokenId)

            // Expect that the transfer has happened correctly
            expect(
                await perpetualLicenseContractSecondPayer.balanceOf(
                    accounts[1].address
                )
            ).to.equal(0)
            expect(
                await perpetualLicenseContractSecondPayer.balanceOf(
                    accounts[2].address
                )
            ).to.equal(1)
            expect(
                await perpetualLicenseContractSecondPayer.ownerOf(tokenId)
            ).to.equal(accounts[2].address)
        })

        it("Fails to transfer a non-existent token", async () => {
            const accounts = await ethers.getSigners()
            const perpetualLicenseContractSecondPayer =
                await perpetualLicense.connect(accounts[1])
            const invalidTokenId = 999 // An invalid token ID

            // Expect that transferring a non-existent token fails with an error
            await expect(
                perpetualLicenseContractSecondPayer[
                    "safeTransferFrom(address,address,uint256)"
                ](accounts[1].address, accounts[2].address, invalidTokenId)
            ).to.be.revertedWith("ERC721: invalid token ID")
        })
    })
    describe("withdraw", function () {
        beforeEach(async () => {
            await perpetualLicense.buyToken({ value: sendValue })
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
                perpetualLicenseContractSecondPayer.buyToken({
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
