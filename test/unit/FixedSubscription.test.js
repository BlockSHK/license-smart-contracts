const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
describe("FixedSubscriptionLicense", async function () {
    let fixedSubscription
    const sendValue = ethers.utils.parseEther("1")
    beforeEach(async () => {
        const { deployer, secondPayer } = await getNamedAccounts()
        await deployments.fixture(["all"])
        fixedSubscription = await ethers.getContract(
            "FixedSubscriptionLicense",
            deployer
        )
    })

    describe("buyToken", async function () {
        it("should revert if sender doesn't send enough ETH", async () => {
            const licensePrice = await fixedSubscription.getLicensePrice()
            const insufficientEth = licensePrice.sub(1)
            await expect(fixedSubscription.buyToken({ value: insufficientEth }))
                .to.be.revertedWithCustomError
        })

        it("should mint a new token if sender sends enough ETH", async () => {
            const licensePrice = await fixedSubscription.getLicensePrice()
            const tokenId = await fixedSubscription.getTokenCounter()
            await expect(fixedSubscription.buyToken({ value: licensePrice }))
                .to.emit(fixedSubscription, "CreatedSubscriptionToken")
                .withArgs(tokenId + 1, licensePrice)
        })

        it("should update the tokenCounter when a new token is minted", async () => {
            const licensePrice = await fixedSubscription.getLicensePrice()
            const tokenIdBefore = await fixedSubscription.getTokenCounter()
            await fixedSubscription.buyToken({ value: licensePrice })
            const tokenIdAfter = await fixedSubscription.getTokenCounter()
            expect(tokenIdAfter).to.equal(tokenIdBefore.add(1))
        })

        it("should emit a CreatedSubscriptionToken event when a new token is minted", async () => {
            const licensePrice = await fixedSubscription.getLicensePrice()

            const tokenIdBefore = await fixedSubscription.getTokenCounter()
            const contractTx = await fixedSubscription.buyToken({
                value: licensePrice,
            })

            ContractReceipt = await contractTx.wait()
            assert.isDefined(ContractReceipt, "receipt should be defined")
            const event = ContractReceipt.events.find(
                (e) => e.event === "CreatedSubscriptionToken"
            )
            assert.isDefined(
                event,
                "CreatedLicenseToken event should be emitted"
            )

            expect(event.args.tokenId).to.equal(tokenIdBefore.add(1))
            expect(event.args.licensePrice).to.equal(licensePrice)
        })

        it("should increase the contract balance when a token is minted", async () => {
            const licensePrice = await fixedSubscription.getLicensePrice()
            const contractBalanceBefore = await ethers.provider.getBalance(
                fixedSubscription.address
            )
            await fixedSubscription.buyToken({ value: licensePrice })
            const contractBalanceAfter = await ethers.provider.getBalance(
                fixedSubscription.address
            )
            expect(contractBalanceAfter).to.equal(
                contractBalanceBefore.add(licensePrice)
            )
        })
    })

    describe("mintToken", async function () {
        it("should revert if sender isn't the owner", async () => {
            const accounts = await ethers.getSigners()
            // Attempt to update the license price as a non-owner
            await expect(
                fixedSubscription
                    .connect(accounts[1])
                    .mintToken(accounts[2].address)
            ).to.be.rejectedWith("Ownable: caller is not the owner")
        })

        it("should mint a new token if the caller is owner", async () => {
            const accounts = await ethers.getSigners()
            const licensePrice = await fixedSubscription.getLicensePrice()
            const tokenId = await fixedSubscription.getTokenCounter()
            await expect(fixedSubscription.mintToken(accounts[2].address))
                .to.emit(fixedSubscription, "CreatedSubscriptionToken")
                .withArgs(tokenId + 1, licensePrice)
        })
    })

    describe("updateSubscription", async function () {
        it("should return the correct expiration time for the give token after subscription updated", async () => {
            // const sevenDays = 7 * 24 * 60 * 60
            const oneMinute = 60

            await ethers.provider.send("evm_increaseTime", [oneMinute])
            await ethers.provider.send("evm_mine")

            const accounts = await ethers.getSigners()
            const fixedSubscriptionLicenseContractSecondPayer =
                await fixedSubscription.connect(accounts[1])
            const licensePrice =
                await fixedSubscriptionLicenseContractSecondPayer.getLicensePrice()
            const tokenId =
                await fixedSubscriptionLicenseContractSecondPayer.getTokenCounter()
            await expect(
                fixedSubscriptionLicenseContractSecondPayer.buyToken({
                    value: licensePrice,
                })
            )
                .to.emit(
                    fixedSubscriptionLicenseContractSecondPayer,
                    "CreatedSubscriptionToken"
                )
                .withArgs(tokenId.toNumber() + 1, licensePrice)

            const blockNumBefore = await ethers.provider.getBlockNumber()
            const blockBefore = await ethers.provider.getBlock(blockNumBefore)
            const timestampBefore = blockBefore.timestamp
            // console.log(timestampBefore)
            const expirationTime = await fixedSubscription.getExpirationTime(
                tokenId.toNumber()
            )
            expect(expirationTime).to.equal(timestampBefore + 60 * 60 * 24 * 30)
            // console.log(timestampBefore + 60 * 60 * 24 * 30)
            // console.log("Expiration time initial", expirationTime.toNumber())

            await ethers.provider.send("evm_increaseTime", [oneMinute])
            await ethers.provider.send("evm_mine")

            await expect(
                fixedSubscriptionLicenseContractSecondPayer.updateSubscription(
                    tokenId,
                    {
                        value: licensePrice,
                    }
                )
            )
                .to.emit(
                    fixedSubscriptionLicenseContractSecondPayer,
                    "UpdatedSubscriptionToken"
                )
                .withArgs(tokenId.toNumber(), licensePrice)

            const blockNumAfter = await ethers.provider.getBlockNumber()
            const blockAfter = await ethers.provider.getBlock(blockNumAfter)
            const timestampAfter = blockAfter.timestamp
            // console.log(timestampAfter)
            const expirationTimeAfterUpdate =
                await fixedSubscription.getExpirationTime(tokenId.toNumber())
            // console.log(
            //     "Expiration time after",
            //     expirationTimeAfterUpdate.toNumber()
            // )
            expect(expirationTimeAfterUpdate).to.equal(
                expirationTime.toNumber() + 60 * 60 * 24 * 30
            )
        })
    })

    describe("getExpirationTime", async function () {
        it("should return the correct expiration time for the give token", async () => {
            const accounts = await ethers.getSigners()
            const fixedSubscriptionLicenseContractSecondPayer =
                await fixedSubscription.connect(accounts[1])
            const licensePrice =
                await fixedSubscriptionLicenseContractSecondPayer.getLicensePrice()
            const tokenId =
                await fixedSubscriptionLicenseContractSecondPayer.getTokenCounter()
            await expect(
                fixedSubscriptionLicenseContractSecondPayer.buyToken({
                    value: licensePrice,
                })
            )
                .to.emit(
                    fixedSubscriptionLicenseContractSecondPayer,
                    "CreatedSubscriptionToken"
                )
                .withArgs(tokenId.toNumber() + 1, licensePrice)

            const blockNumBefore = await ethers.provider.getBlockNumber()
            const blockBefore = await ethers.provider.getBlock(blockNumBefore)
            const timestampBefore = blockBefore.timestamp
            // console.log(timestampBefore)
            const expirationTime = await fixedSubscription.getExpirationTime(
                tokenId
            )
            expect(expirationTime).to.equal(timestampBefore + 60 * 60 * 24 * 30)
            // console.log(timestampBefore + 60 * 60 * 24 * 30)
            // console.log(expirationTime.toNumber())
        })
    })

    describe("isSubscriptionActive", async function () {
        it("should return true since the current time is less than expiration time", async () => {
            const accounts = await ethers.getSigners()
            const fixedSubscriptionLicenseContractSecondPayer =
                await fixedSubscription.connect(accounts[1])
            const licensePrice =
                await fixedSubscriptionLicenseContractSecondPayer.getLicensePrice()
            const tokenId =
                await fixedSubscriptionLicenseContractSecondPayer.getTokenCounter()
            await expect(
                fixedSubscriptionLicenseContractSecondPayer.buyToken({
                    value: licensePrice,
                })
            )
                .to.emit(
                    fixedSubscriptionLicenseContractSecondPayer,
                    "CreatedSubscriptionToken"
                )
                .withArgs(tokenId.toNumber() + 1, licensePrice)

            const subscriptionActive =
                await fixedSubscription.isSubscriptionActive(tokenId)
            expect(subscriptionActive).to.be.true
        })
    })
    describe("getSubscritptionTimePeriod", async function () {
        it("should return the correct expiration time", async () => {
            const expirationTime =
                await fixedSubscription.getSubscritptionTimePeriod()
            expect(expirationTime).to.equal(60 * 60 * 24 * 30)
        })
    })

    describe("getLicensePrice", async function () {
        it("should return the correct license price", async () => {
            const licensePrice = await fixedSubscription.getLicensePrice()
            expect(licensePrice).to.equal(ethers.utils.parseEther("0.01"))
        })

        it("should return a license price greater than zero", async () => {
            const licensePrice = await fixedSubscription.getLicensePrice()
            expect(licensePrice).to.be.gt(0)
        })
    })

    describe("isTransferAllowed", async function () {
        it("should return false since owner didn't allow transfering", async () => {
            const accounts = await ethers.getSigners()
            const fixedSubscriptionLicenseContractSecondPayer =
                await fixedSubscription.connect(accounts[1])
            const licensePrice =
                await fixedSubscriptionLicenseContractSecondPayer.getLicensePrice()
            const tokenId =
                await fixedSubscriptionLicenseContractSecondPayer.getTokenCounter()
            await expect(
                fixedSubscriptionLicenseContractSecondPayer.buyToken({
                    value: licensePrice,
                })
            )
                .to.emit(
                    fixedSubscriptionLicenseContractSecondPayer,
                    "CreatedSubscriptionToken"
                )
                .withArgs(tokenId.toNumber() + 1, licensePrice)

            const tranferingAllowed = await fixedSubscription.isTransferAllowed(
                tokenId
            )
            expect(tranferingAllowed).to.be.false
        })

        it("should return true when owner allow transfering", async () => {
            const accounts = await ethers.getSigners()
            const fixedSubscriptionLicenseContractSecondPayer =
                await fixedSubscription.connect(accounts[1])
            const { deployer, secondPayer } = await getNamedAccounts()
            const fixedSubscriptionDeployer = await ethers.getContract(
                "FixedSubscriptionLicense",
                deployer
            )
            const licensePrice =
                await fixedSubscriptionLicenseContractSecondPayer.getLicensePrice()
            const tokenId =
                await fixedSubscriptionLicenseContractSecondPayer.getTokenCounter()
            await expect(
                fixedSubscriptionLicenseContractSecondPayer.buyToken({
                    value: licensePrice,
                })
            )
                .to.emit(
                    fixedSubscriptionLicenseContractSecondPayer,
                    "CreatedSubscriptionToken"
                )
                .withArgs(tokenId.toNumber() + 1, licensePrice)

            await fixedSubscriptionDeployer.allowTransfer(tokenId)
            const tranferingAllowed = await fixedSubscription.isTransferAllowed(
                tokenId
            )
            expect(tranferingAllowed).to.be.true
        })
    })

    describe("updateLicensePrice", () => {
        it("allows the owner to update the license price", async () => {
            const newLicensePrice = 2000
            const oldLicensePrice = await fixedSubscription.getLicensePrice()

            // Update the license price
            await fixedSubscription.updateLicensePrice(newLicensePrice)

            const updatedLicensePrice =
                await fixedSubscription.getLicensePrice()

            // Check that the license price was updated
            expect(updatedLicensePrice).to.equal(newLicensePrice)
            expect(updatedLicensePrice).to.not.equal(oldLicensePrice)
        })

        it("reverts if a non-owner tries to update the license price", async () => {
            const newLicensePrice = 2000
            const accounts = await ethers.getSigners()
            // Attempt to update the license price as a non-owner
            await expect(
                fixedSubscription
                    .connect(accounts[1])
                    .updateLicensePrice(newLicensePrice)
            ).to.be.rejectedWith("Ownable: caller is not the owner")
        })

        it("should revert if the new license price is zero", async () => {
            await expect(
                fixedSubscription.updateLicensePrice(0)
            ).to.be.revertedWith("Price must be greater than zero")
        })

        it("should not change the balance of the contract when the license price is updated", async () => {
            const licensePrice = await fixedSubscription.getLicensePrice()
            const contractBalanceBefore = await ethers.provider.getBalance(
                fixedSubscription.address
            )
            await fixedSubscription.updateLicensePrice(licensePrice.mul(2))
            const contractBalanceAfter = await ethers.provider.getBalance(
                fixedSubscription.address
            )
            expect(contractBalanceAfter).to.equal(contractBalanceBefore)
        })
    })

    describe("withdraw", function () {
        beforeEach(async () => {
            await fixedSubscription.buyToken({ value: sendValue })
        })

        it("Only allows the owner to withdraw", async function () {
            const accounts = await ethers.getSigners()
            const fixedSubscriptionLicenseContract =
                await fixedSubscription.connect(accounts[1])
            await expect(
                fixedSubscriptionLicenseContract.withdraw()
            ).to.be.rejectedWith("Ownable: caller is not the owner")
        })

        it("should transfer ether to the owner's address when called by the owner", async () => {
            const accounts = await ethers.getSigners()
            const perpetualLicenseContractSecondPayer =
                await fixedSubscription.connect(accounts[1])
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
                    "CreatedSubscriptionToken"
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
                fixedSubscription.address
            )
            // console.log(
            //     "withdrawing amount",
            //     ethers.utils.formatEther(withdrawingAmount)
            // )
            const transactionResponse = await fixedSubscription.withdraw()
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
