const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
describe("AutoRenewSubscriptionLicense", async function () {
    let autoRenewSubscriptionLicense, accounts, mapCoin
    const sendValue = ethers.utils.parseEther("1")
    beforeEach(async () => {
        const { deployer, secondPayer } = await getNamedAccounts()
        accounts = await ethers.getSigners()

        await deployments.fixture(["all"])
        autoRenewSubscriptionLicense = await ethers.getContract(
            "AutoRenewSubscriptionLicense",
            deployer
        )
        mapCoin = await ethers.getContract("MapCoin", deployer)
    })

    describe("buyToken", async function () {
        it("should revert if sender doesn't allow enough tokens to pay gas price and subscription price", async () => {
            let customerAddress = accounts[1].address
            const fromBalance = await mapCoin.balanceOf(customerAddress)
            expect(fromBalance).to.equal(0)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10000000"
                const transactionResponse = await mapCoin.transfer(
                    customerAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            const licensePrice =
                await autoRenewSubscriptionLicense.getLicensePrice()

            await expect(
                autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()
            ).to.be.revertedWith(
                "Subscription is not ready or not enough balance or allowance"
            )
        })

        it("should revert if sender doesn't have enough tokens to pay gas price and subscription price", async () => {
            let customerAddress = accounts[1].address
            const fromBalance = await mapCoin.balanceOf(customerAddress)
            const approveAmount = await mapCoin.allowance(
                customerAddress,
                autoRenewSubscriptionLicense.address
            )
            expect(approveAmount).to.equal(0)

            if (approveAmount.toNumber() <= 0) {
                const approveAmount = "1000"
                const mapCoinFrom = await ethers.getContract(
                    "MapCoin",
                    accounts[1]
                )

                const transactionResponseApprove = await mapCoinFrom.approve(
                    autoRenewSubscriptionLicense.address,
                    approveAmount
                )

                await transactionResponseApprove.wait()
            }

            const approveAmountFinal = await mapCoin.allowance(
                customerAddress,
                autoRenewSubscriptionLicense.address
            )

            expect(approveAmountFinal.toNumber()).to.equal(1000)

            const licensePrice =
                await autoRenewSubscriptionLicense.getLicensePrice()

            await expect(
                autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()
            ).to.be.revertedWith(
                "Subscription is not ready or not enough balance or allowance"
            )
        })

        it("should create a subscription token if sender allow and have enough tokens to pay gas price and subscription price", async () => {
            let customerAddress = accounts[1].address
            const subscriptionPrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const gasPrice = await autoRenewSubscriptionLicense.getGasPrice()
            const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()
            const fromBalance = await mapCoin.balanceOf(customerAddress)
            expect(fromBalance).to.equal(0)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10000000"
                const transactionResponse = await mapCoin.transfer(
                    customerAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            const approveAmount = await mapCoin.allowance(
                customerAddress,
                autoRenewSubscriptionLicense.address
            )
            expect(approveAmount).to.equal(0)

            if (approveAmount.toNumber() <= 0) {
                const approveAmount = "1000"
                const mapCoinFrom = await ethers.getContract(
                    "MapCoin",
                    accounts[1]
                )

                const transactionResponseApprove = await mapCoinFrom.approve(
                    autoRenewSubscriptionLicense.address,
                    approveAmount
                )

                await transactionResponseApprove.wait()
            }

            const approveAmountFinal = await mapCoin.allowance(
                customerAddress,
                autoRenewSubscriptionLicense.address
            )

            expect(approveAmountFinal.toNumber()).to.equal(1000)

            await expect(
                autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()
            )
                .to.emit(autoRenewSubscriptionLicense, "NewSubscriptionToken")
                .withArgs(tokenId, subscriptionPrice)
        })
    })

    describe("mintToken", async function () {
        it("should revert if called by a non-owner", async () => {
            await expect(
                autoRenewSubscriptionLicense
                    .connect(accounts[1])
                    .mintToken(accounts[1].address)
            ).to.be.revertedWith("Ownable: caller is not the owner")
        })

        it("should mint tokens to the specified address if called by the owner", async () => {
            const owner = accounts[0]
            const recipient = accounts[1].address
            const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()
            const subscriptionPrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            await expect(
                autoRenewSubscriptionLicense.connect(owner).mintToken(recipient)
            )
                .to.emit(autoRenewSubscriptionLicense, "NewSubscriptionToken")
                .withArgs(tokenId, subscriptionPrice)
        })
    })

    describe("updateSubscription", async function () {
        it("should return the current expiration time + period as expiration time for the given token after subscription updated before subscription ended", async () => {
            const oneMinute = 60
            const subscriptionPeriodSecond = 60 * 60 * 24 * 30
            await ethers.provider.send("evm_increaseTime", [oneMinute])
            await ethers.provider.send("evm_mine")

            // Create a subscription token
            const customerAddress = accounts[1].address
            const subscriptionPrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()

            const fromBalance = await mapCoin.balanceOf(customerAddress)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10000000"
                const transactionResponse = await mapCoin.transfer(
                    customerAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            const approveAmount = "1000"
            const mapCoinFrom = await ethers.getContract("MapCoin", accounts[1])
            const transactionResponseApprove = await mapCoinFrom.approve(
                autoRenewSubscriptionLicense.address,
                approveAmount
            )
            await transactionResponseApprove.wait()

            await autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()

            const blockNumBefore = await ethers.provider.getBlockNumber()
            const blockBefore = await ethers.provider.getBlock(blockNumBefore)
            const timestampBefore = blockBefore.timestamp

            const expirationTime =
                await autoRenewSubscriptionLicense.getExpirationTime(tokenId)
            expect(expirationTime).to.equal(timestampBefore + 60 * 60 * 24 * 30)

            await ethers.provider.send("evm_increaseTime", [
                subscriptionPeriodSecond,
            ])
            await ethers.provider.send("evm_mine")

            await autoRenewSubscriptionLicense
                .connect(accounts[0])
                .updateSubscription(tokenId)

            const blockNumAfter = await ethers.provider.getBlockNumber()
            const blockAfter = await ethers.provider.getBlock(blockNumAfter)
            const timestampAfter = blockAfter.timestamp

            const expirationTimeAfterUpdate =
                await autoRenewSubscriptionLicense.getExpirationTime(tokenId)
            expect(expirationTimeAfterUpdate).to.equal(
                timestampAfter + 60 * 60 * 24 * 30
            )
        })

        it("should revert with subscription canceled if tried to update after canceled subscription", async () => {
            const oneMinute = 60
            const subscriptionPeriodSecond = 60 * 60 * 24 * 30
            await ethers.provider.send("evm_increaseTime", [oneMinute])
            await ethers.provider.send("evm_mine")

            // Create a subscription token
            const customerAddress = accounts[1].address
            const subscriptionPrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()

            const fromBalance = await mapCoin.balanceOf(customerAddress)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10000000"
                const transactionResponse = await mapCoin.transfer(
                    customerAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            const approveAmount = "1000"
            const mapCoinFrom = await ethers.getContract("MapCoin", accounts[1])
            const transactionResponseApprove = await mapCoinFrom.approve(
                autoRenewSubscriptionLicense.address,
                approveAmount
            )
            await transactionResponseApprove.wait()

            await autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()

            const blockNumBefore = await ethers.provider.getBlockNumber()
            const blockBefore = await ethers.provider.getBlock(blockNumBefore)
            const timestampBefore = blockBefore.timestamp

            const expirationTime =
                await autoRenewSubscriptionLicense.getExpirationTime(tokenId)
            expect(expirationTime).to.equal(timestampBefore + 60 * 60 * 24 * 30)

            await ethers.provider.send("evm_increaseTime", [
                subscriptionPeriodSecond,
            ])
            await ethers.provider.send("evm_mine")
            await autoRenewSubscriptionLicense
                .connect(accounts[1])
                .cancelSubscription(tokenId)

            await expect(
                autoRenewSubscriptionLicense
                    .connect(accounts[0])
                    .updateSubscription(tokenId)
            ).to.be.revertedWith("Subscription is canceled")
        })

        it("should revert with Subscription is still active if tried to update when subscription is still active", async () => {
            const oneMinute = 60
            const subscriptionPeriodSecond = 60 * 60 * 24 * 30
            await ethers.provider.send("evm_increaseTime", [oneMinute])
            await ethers.provider.send("evm_mine")

            // Create a subscription token
            const customerAddress = accounts[1].address
            const subscriptionPrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()

            const fromBalance = await mapCoin.balanceOf(customerAddress)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10000000"
                const transactionResponse = await mapCoin.transfer(
                    customerAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            const approveAmount = "1000"
            const mapCoinFrom = await ethers.getContract("MapCoin", accounts[1])
            const transactionResponseApprove = await mapCoinFrom.approve(
                autoRenewSubscriptionLicense.address,
                approveAmount
            )
            await transactionResponseApprove.wait()

            await autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()

            const blockNumBefore = await ethers.provider.getBlockNumber()
            const blockBefore = await ethers.provider.getBlock(blockNumBefore)
            const timestampBefore = blockBefore.timestamp

            const expirationTime =
                await autoRenewSubscriptionLicense.getExpirationTime(tokenId)
            expect(expirationTime).to.equal(timestampBefore + 60 * 60 * 24 * 30)

            await ethers.provider.send("evm_increaseTime", [oneMinute])
            await ethers.provider.send("evm_mine")

            await expect(
                autoRenewSubscriptionLicense
                    .connect(accounts[0])
                    .updateSubscription(tokenId)
            ).to.be.revertedWith("Subscription is still active")
        })

        it("should revert with Subscription is not ready or not enough balance or allowance if balance is not enough", async () => {
            const oneMinute = 60
            const subscriptionPeriodSecond = 60 * 60 * 24 * 30
            await ethers.provider.send("evm_increaseTime", [oneMinute])
            await ethers.provider.send("evm_mine")

            // Create a subscription token
            const customerAddress = accounts[1].address
            const subscriptionPrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()

            const fromBalance = await mapCoin.balanceOf(customerAddress)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10"
                const transactionResponse = await mapCoin.transfer(
                    customerAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            const approveAmount = "1000"
            const mapCoinFrom = await ethers.getContract("MapCoin", accounts[1])
            const transactionResponseApprove = await mapCoinFrom.approve(
                autoRenewSubscriptionLicense.address,
                approveAmount
            )
            await transactionResponseApprove.wait()

            await autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()

            const blockNumBefore = await ethers.provider.getBlockNumber()
            const blockBefore = await ethers.provider.getBlock(blockNumBefore)
            const timestampBefore = blockBefore.timestamp

            const expirationTime =
                await autoRenewSubscriptionLicense.getExpirationTime(tokenId)
            expect(expirationTime).to.equal(timestampBefore + 60 * 60 * 24 * 30)

            await ethers.provider.send("evm_increaseTime", [
                subscriptionPeriodSecond,
            ])
            await ethers.provider.send("evm_mine")

            await expect(
                autoRenewSubscriptionLicense
                    .connect(accounts[0])
                    .updateSubscription(tokenId)
            ).to.be.revertedWith(
                "Subscription is not ready or not enough balance or allowance"
            )
        })
    })

    describe("reactivateSubscription", async function () {
        it("should reactivate the subscription and return new expiration time", async () => {
            const oneMinute = 60
            const subscriptionPeriodSecond = 60 * 60 * 24 * 30
            await ethers.provider.send("evm_increaseTime", [oneMinute])
            await ethers.provider.send("evm_mine")

            // Create a subscription token
            const customerAddress = accounts[1].address
            const subscriptionPrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()

            const fromBalance = await mapCoin.balanceOf(customerAddress)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10000000"
                const transactionResponse = await mapCoin.transfer(
                    customerAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            const approveAmount = "1000"
            const mapCoinFrom = await ethers.getContract("MapCoin", accounts[1])
            const transactionResponseApprove = await mapCoinFrom.approve(
                autoRenewSubscriptionLicense.address,
                approveAmount
            )
            await transactionResponseApprove.wait()

            await autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()

            const blockNumBefore = await ethers.provider.getBlockNumber()
            const blockBefore = await ethers.provider.getBlock(blockNumBefore)
            const timestampBefore = blockBefore.timestamp

            const expirationTime =
                await autoRenewSubscriptionLicense.getExpirationTime(tokenId)
            expect(expirationTime).to.equal(timestampBefore + 60 * 60 * 24 * 30)

            await ethers.provider.send("evm_increaseTime", [
                subscriptionPeriodSecond,
            ])
            await ethers.provider.send("evm_mine")
            await autoRenewSubscriptionLicense
                .connect(accounts[1])
                .cancelSubscription(tokenId)

            await autoRenewSubscriptionLicense
                .connect(accounts[1])
                .reactivateSubscription(tokenId)

            const blockNumAfter = await ethers.provider.getBlockNumber()
            const blockAfter = await ethers.provider.getBlock(blockNumAfter)
            const timestampAfter = blockAfter.timestamp

            const expirationTimeAfterUpdate =
                await autoRenewSubscriptionLicense.getExpirationTime(tokenId)
            expect(expirationTimeAfterUpdate).to.equal(
                timestampAfter + 60 * 60 * 24 * 30
            )
        })

        it("should revert with Only owner of token can reactivate the subscription if another tried to reactivate", async () => {
            const oneMinute = 60
            const subscriptionPeriodSecond = 60 * 60 * 24 * 30
            await ethers.provider.send("evm_increaseTime", [oneMinute])
            await ethers.provider.send("evm_mine")

            // Create a subscription token
            const customerAddress = accounts[1].address
            const subscriptionPrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()

            const fromBalance = await mapCoin.balanceOf(customerAddress)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10000000"
                const transactionResponse = await mapCoin.transfer(
                    customerAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            const approveAmount = "1000"
            const mapCoinFrom = await ethers.getContract("MapCoin", accounts[1])
            const transactionResponseApprove = await mapCoinFrom.approve(
                autoRenewSubscriptionLicense.address,
                approveAmount
            )
            await transactionResponseApprove.wait()

            await autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()

            const blockNumBefore = await ethers.provider.getBlockNumber()
            const blockBefore = await ethers.provider.getBlock(blockNumBefore)
            const timestampBefore = blockBefore.timestamp

            const expirationTime =
                await autoRenewSubscriptionLicense.getExpirationTime(tokenId)
            expect(expirationTime).to.equal(timestampBefore + 60 * 60 * 24 * 30)

            await ethers.provider.send("evm_increaseTime", [
                subscriptionPeriodSecond,
            ])
            await ethers.provider.send("evm_mine")
            await autoRenewSubscriptionLicense
                .connect(accounts[1])
                .cancelSubscription(tokenId)

            await expect(
                autoRenewSubscriptionLicense
                    .connect(accounts[0])
                    .reactivateSubscription(tokenId)
            ).to.be.revertedWith(
                "Only owner of token can reactivate the subscription"
            )
        })

        it("should revert with Subscription is still active if tried to reactivate already active subscription", async () => {
            const oneMinute = 60
            const subscriptionPeriodSecond = 60 * 60 * 24 * 30
            await ethers.provider.send("evm_increaseTime", [oneMinute])
            await ethers.provider.send("evm_mine")

            // Create a subscription token
            const customerAddress = accounts[1].address
            const subscriptionPrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()

            const fromBalance = await mapCoin.balanceOf(customerAddress)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10000000"
                const transactionResponse = await mapCoin.transfer(
                    customerAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            const approveAmount = "1000"
            const mapCoinFrom = await ethers.getContract("MapCoin", accounts[1])
            const transactionResponseApprove = await mapCoinFrom.approve(
                autoRenewSubscriptionLicense.address,
                approveAmount
            )
            await transactionResponseApprove.wait()

            await autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()

            const blockNumBefore = await ethers.provider.getBlockNumber()
            const blockBefore = await ethers.provider.getBlock(blockNumBefore)
            const timestampBefore = blockBefore.timestamp

            const expirationTime =
                await autoRenewSubscriptionLicense.getExpirationTime(tokenId)
            expect(expirationTime).to.equal(timestampBefore + 60 * 60 * 24 * 30)

            await ethers.provider.send("evm_increaseTime", [oneMinute])
            await ethers.provider.send("evm_mine")

            await expect(
                autoRenewSubscriptionLicense
                    .connect(accounts[1])
                    .reactivateSubscription(tokenId)
            ).to.be.revertedWith("Subscription is still active")
        })

        it("should revert with Subscription is not ready or not enough balance or allowance if not enough balance to reactivate", async () => {
            const oneMinute = 60
            const subscriptionPeriodSecond = 60 * 60 * 24 * 30
            await ethers.provider.send("evm_increaseTime", [oneMinute])
            await ethers.provider.send("evm_mine")

            // Create a subscription token
            const customerAddress = accounts[1].address
            const subscriptionPrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()

            const fromBalance = await mapCoin.balanceOf(customerAddress)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10"
                const transactionResponse = await mapCoin.transfer(
                    customerAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            const approveAmount = "1000"
            const mapCoinFrom = await ethers.getContract("MapCoin", accounts[1])
            const transactionResponseApprove = await mapCoinFrom.approve(
                autoRenewSubscriptionLicense.address,
                approveAmount
            )
            await transactionResponseApprove.wait()

            await autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()

            const blockNumBefore = await ethers.provider.getBlockNumber()
            const blockBefore = await ethers.provider.getBlock(blockNumBefore)
            const timestampBefore = blockBefore.timestamp

            const expirationTime =
                await autoRenewSubscriptionLicense.getExpirationTime(tokenId)
            expect(expirationTime).to.equal(timestampBefore + 60 * 60 * 24 * 30)

            await ethers.provider.send("evm_increaseTime", [
                subscriptionPeriodSecond,
            ])
            await ethers.provider.send("evm_mine")
            await autoRenewSubscriptionLicense
                .connect(accounts[1])
                .cancelSubscription(tokenId)

            await expect(
                autoRenewSubscriptionLicense
                    .connect(accounts[1])
                    .reactivateSubscription(tokenId)
            ).to.be.revertedWith(
                "Subscription is not ready or not enough balance or allowance"
            )
        })
    })

    describe("getSubscritptionTimePeriod", async function () {
        it("should return the correct expiration time", async () => {
            const expirationTime =
                await autoRenewSubscriptionLicense.getSubscritptionTimePeriod()
            expect(expirationTime).to.equal(60 * 60 * 24 * 30)
        })
    })

    describe("getLicensePrice", async function () {
        it("should return the correct license price", async () => {
            const licensePrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            expect(licensePrice).to.equal("10")
        })

        it("should return a license price greater than zero", async () => {
            const licensePrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            expect(licensePrice).to.be.gt(0)
        })
    })

    describe("tokenURI", async function () {
        it("should return the token URI", async () => {
            const customerAddress = accounts[1].address
            const subscriptionPrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()

            const fromBalance = await mapCoin.balanceOf(customerAddress)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10"
                const transactionResponse = await mapCoin.transfer(
                    customerAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            const approveAmount = "1000"
            const mapCoinFrom = await ethers.getContract("MapCoin", accounts[1])
            const transactionResponseApprove = await mapCoinFrom.approve(
                autoRenewSubscriptionLicense.address,
                approveAmount
            )
            await transactionResponseApprove.wait()

            await autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()

            const tokenURI = await autoRenewSubscriptionLicense.tokenURI(
                tokenId.toNumber()
            )
            expect(tokenURI).to.be.a("string")
        })

        it("Fails when call the token URI of non existance token ID", async () => {
            await expect(
                autoRenewSubscriptionLicense.tokenURI(1)
            ).to.be.revertedWithCustomError(
                autoRenewSubscriptionLicense,
                "ERC721Metadata__URI_QueryFor_NonExistentToken"
            )
        })
    })

    describe("withdraw", function () {
        beforeEach(async () => {
            const customerAddress = accounts[1].address
            const subscriptionPrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()

            const fromBalance = await mapCoin.balanceOf(customerAddress)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10"
                const transactionResponse = await mapCoin.transfer(
                    customerAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            const approveAmount = "1000"
            const mapCoinFrom = await ethers.getContract("MapCoin", accounts[1])
            const transactionResponseApprove = await mapCoinFrom.approve(
                autoRenewSubscriptionLicense.address,
                approveAmount
            )
            await transactionResponseApprove.wait()

            await autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()
        })

        it("Only allows the owner to withdraw", async function () {
            await expect(
                autoRenewSubscriptionLicense.connect(accounts[1]).withdraw()
            ).to.be.rejectedWith("Ownable: caller is not the owner")
        })

        it("should transfer tokens to the owner's address when called by the owner", async () => {
            const { deployer, secondPayer } = await getNamedAccounts()
            const ownerBalanceBefore = await mapCoin.balanceOf(
                accounts[0].address
            )
            // console.log(
            //     "owner balance before:",
            //     ethers.utils.formatEther(ownerBalanceBefore)
            // )
            const withdrawingAmount = await mapCoin.balanceOf(
                autoRenewSubscriptionLicense.address
            )

            // console.log(
            //     "withdrawing amount",
            //     ethers.utils.formatEther(withdrawingAmount)
            // )
            const transactionResponse =
                await autoRenewSubscriptionLicense.withdraw()
            const receipt = await transactionResponse.wait()
            // console.log(receipt)
            // console.log(
            //     "total ether spent on gas for transaction: \t",
            //     ethers.utils.formatEther(
            //         receipt.gasUsed.mul(receipt.effectiveGasPrice)
            //     )
            // )

            const ownerBalanceAfter = await mapCoin.balanceOf(
                accounts[0].address
            )
            // console.log(
            //     "owner balance after:",
            //     ethers.utils.formatEther(ownerBalanceAfter)
            // )

            const expectedBalance = ownerBalanceBefore.add(withdrawingAmount)

            // console.log("Gas Cost:", ethers.utils.formatEther(gasCost))
            // console.log("expected balance:", expectedBalance.toString())

            expect(ownerBalanceAfter).to.equal(expectedBalance)
        })
    })

    describe("isSubscriptionActive", async function () {
        it("should return true since the current time is less than expiration time", async () => {
            const customerAddress = accounts[1].address
            const subscriptionPrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()

            const fromBalance = await mapCoin.balanceOf(customerAddress)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10"
                const transactionResponse = await mapCoin.transfer(
                    customerAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            const approveAmount = "1000"
            const mapCoinFrom = await ethers.getContract("MapCoin", accounts[1])
            const transactionResponseApprove = await mapCoinFrom.approve(
                autoRenewSubscriptionLicense.address,
                approveAmount
            )
            await transactionResponseApprove.wait()

            await autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()

            const subscriptionActive =
                await autoRenewSubscriptionLicense.isSubscriptionActive(tokenId)
            expect(subscriptionActive).to.be.true
        })
    })

    describe("updateLicensePrice", () => {
        it("allows the owner to update the license price", async () => {
            const newLicensePrice = 2000
            const oldLicensePrice =
                await autoRenewSubscriptionLicense.getLicensePrice()

            // Update the license price
            await autoRenewSubscriptionLicense.updateLicensePrice(
                newLicensePrice
            )

            const updatedLicensePrice =
                await autoRenewSubscriptionLicense.getLicensePrice()

            // Check that the license price was updated
            expect(updatedLicensePrice).to.equal(newLicensePrice)
            expect(updatedLicensePrice).to.not.equal(oldLicensePrice)
        })

        it("reverts if a non-owner tries to update the license price", async () => {
            const newLicensePrice = 2000
            const accounts = await ethers.getSigners()
            // Attempt to update the license price as a non-owner
            await expect(
                autoRenewSubscriptionLicense
                    .connect(accounts[1])
                    .updateLicensePrice(newLicensePrice)
            ).to.be.rejectedWith("Ownable: caller is not the owner")
        })

        it("should revert if the new license price is zero", async () => {
            await expect(
                autoRenewSubscriptionLicense.updateLicensePrice(0)
            ).to.be.revertedWith("Price must be greater than zero")
        })

        it("should not change the balance of the contract when the license price is updated", async () => {
            const licensePrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const contractBalanceBefore = await ethers.provider.getBalance(
                autoRenewSubscriptionLicense.address
            )
            await autoRenewSubscriptionLicense.updateLicensePrice(
                licensePrice.mul(2)
            )
            const contractBalanceAfter = await ethers.provider.getBalance(
                autoRenewSubscriptionLicense.address
            )
            expect(contractBalanceAfter).to.equal(contractBalanceBefore)
        })
    })

    // copied code

    describe("Transfer License from TransferFrom", async function () {
        it("Transfer the license token", async () => {
            const customerAddress = accounts[1].address
            const subscriptionPrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()

            const fromBalance = await mapCoin.balanceOf(customerAddress)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10"
                const transactionResponse = await mapCoin.transfer(
                    customerAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            const approveAmount = "1000"
            const mapCoinFrom = await ethers.getContract("MapCoin", accounts[1])
            const transactionResponseApprove = await mapCoinFrom.approve(
                autoRenewSubscriptionLicense.address,
                approveAmount
            )
            await transactionResponseApprove.wait()

            await autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()

            await autoRenewSubscriptionLicense.allowTransfer(tokenId)
            const tranferingAllowed =
                await autoRenewSubscriptionLicense.isTransferAllowed(tokenId)
            expect(tranferingAllowed).to.be.true

            // Transfer the token
            await autoRenewSubscriptionLicense
                .connect(accounts[1])
                .transferFrom(accounts[1].address, accounts[2].address, tokenId)

            // Expect that the transfer has happened correctly
            expect(
                await autoRenewSubscriptionLicense
                    .connect(accounts[1])
                    .balanceOf(accounts[1].address)
            ).to.equal(0)
            expect(
                await autoRenewSubscriptionLicense
                    .connect(accounts[1])
                    .balanceOf(accounts[2].address)
            ).to.equal(1)
            expect(
                await autoRenewSubscriptionLicense
                    .connect(accounts[1])
                    .ownerOf(tokenId)
            ).to.equal(accounts[2].address)
        })

        it("Fails to transfer a non-existent token", async () => {
            const accounts = await ethers.getSigners()
            const invalidTokenId = 999 // An invalid token ID

            // Expect that transferring a non-existent token fails with an error
            await expect(
                autoRenewSubscriptionLicense
                    .connect(accounts[1])
                    .transferFrom(
                        accounts[1].address,
                        accounts[2].address,
                        invalidTokenId
                    )
            ).to.be.revertedWith("ERC721: invalid token ID")
        })
    })

    describe("Transfer License from SafeTransferFrom", async function () {
        it("Transfer the license token", async () => {
            const customerAddress = accounts[1].address
            const subscriptionPrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()

            const fromBalance = await mapCoin.balanceOf(customerAddress)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10"
                const transactionResponse = await mapCoin.transfer(
                    customerAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            const approveAmount = "1000"
            const mapCoinFrom = await ethers.getContract("MapCoin", accounts[1])
            const transactionResponseApprove = await mapCoinFrom.approve(
                autoRenewSubscriptionLicense.address,
                approveAmount
            )
            await transactionResponseApprove.wait()

            await autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()

            await autoRenewSubscriptionLicense.allowTransfer(tokenId)
            const tranferingAllowed =
                await autoRenewSubscriptionLicense.isTransferAllowed(tokenId)
            expect(tranferingAllowed).to.be.true

            // Transfer the token
            await autoRenewSubscriptionLicense
                .connect(accounts[1])
                ["safeTransferFrom(address,address,uint256)"](
                    accounts[1].address,
                    accounts[2].address,
                    tokenId
                )

            // Expect that the transfer has happened correctly
            expect(
                await autoRenewSubscriptionLicense
                    .connect(accounts[1])
                    .balanceOf(accounts[1].address)
            ).to.equal(0)
            expect(
                await autoRenewSubscriptionLicense
                    .connect(accounts[1])
                    .balanceOf(accounts[2].address)
            ).to.equal(1)
            expect(
                await autoRenewSubscriptionLicense
                    .connect(accounts[1])
                    .ownerOf(tokenId)
            ).to.equal(accounts[2].address)
        })

        it("Fails to transfer a non-existent token", async () => {
            const accounts = await ethers.getSigners()
            const invalidTokenId = 999 // An invalid token ID

            // Expect that transferring a non-existent token fails with an error
            await expect(
                autoRenewSubscriptionLicense
                    .connect(accounts[1])
                    ["safeTransferFrom(address,address,uint256)"](
                        accounts[1].address,
                        accounts[2].address,
                        invalidTokenId
                    )
            ).to.be.revertedWith("ERC721: invalid token ID")
        })
    })
    describe("isTransferAllowed", async function () {
        it("should return false since owner didn't allow transfering", async () => {
            const customerAddress = accounts[1].address
            const subscriptionPrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()

            const fromBalance = await mapCoin.balanceOf(customerAddress)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10"
                const transactionResponse = await mapCoin.transfer(
                    customerAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            const approveAmount = "1000"
            const mapCoinFrom = await ethers.getContract("MapCoin", accounts[1])
            const transactionResponseApprove = await mapCoinFrom.approve(
                autoRenewSubscriptionLicense.address,
                approveAmount
            )
            await transactionResponseApprove.wait()

            await autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()
            const tranferingAllowed =
                await autoRenewSubscriptionLicense.isTransferAllowed(tokenId)
            expect(tranferingAllowed).to.be.false
        })

        it("should return true when owner allow transfering", async () => {
            const customerAddress = accounts[1].address
            const subscriptionPrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()

            const fromBalance = await mapCoin.balanceOf(customerAddress)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10"
                const transactionResponse = await mapCoin.transfer(
                    customerAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            const approveAmount = "1000"
            const mapCoinFrom = await ethers.getContract("MapCoin", accounts[1])
            const transactionResponseApprove = await mapCoinFrom.approve(
                autoRenewSubscriptionLicense.address,
                approveAmount
            )
            await transactionResponseApprove.wait()

            await autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()

            await autoRenewSubscriptionLicense.allowTransfer(tokenId)
            const tranferingAllowed =
                await autoRenewSubscriptionLicense.isTransferAllowed(tokenId)
            expect(tranferingAllowed).to.be.true
        })
    })

    describe("restrictTransfer", async function () {
        it("should return false when owner allow and then restricted transfering", async () => {
            const customerAddress = accounts[1].address
            const subscriptionPrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()

            const fromBalance = await mapCoin.balanceOf(customerAddress)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10"
                const transactionResponse = await mapCoin.transfer(
                    customerAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            const approveAmount = "1000"
            const mapCoinFrom = await ethers.getContract("MapCoin", accounts[1])
            const transactionResponseApprove = await mapCoinFrom.approve(
                autoRenewSubscriptionLicense.address,
                approveAmount
            )
            await transactionResponseApprove.wait()

            await autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()

            await autoRenewSubscriptionLicense.allowTransfer(tokenId)
            let tranferingAllowed =
                await autoRenewSubscriptionLicense.isTransferAllowed(tokenId)
            expect(tranferingAllowed).to.be.true

            await autoRenewSubscriptionLicense.restrictTransfer(tokenId)

            tranferingAllowed =
                await autoRenewSubscriptionLicense.isTransferAllowed(tokenId)
            expect(tranferingAllowed).to.be.false
        })

        it("reverts if a non-owner tries to update the permission for transfer license", async () => {
            const customerAddress = accounts[1].address
            const subscriptionPrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()

            const fromBalance = await mapCoin.balanceOf(customerAddress)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10"
                const transactionResponse = await mapCoin.transfer(
                    customerAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            const approveAmount = "1000"
            const mapCoinFrom = await ethers.getContract("MapCoin", accounts[1])
            const transactionResponseApprove = await mapCoinFrom.approve(
                autoRenewSubscriptionLicense.address,
                approveAmount
            )
            await transactionResponseApprove.wait()

            await autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()

            await autoRenewSubscriptionLicense.allowTransfer(tokenId)
            const tranferingAllowed =
                await autoRenewSubscriptionLicense.isTransferAllowed(tokenId)
            expect(tranferingAllowed).to.be.true

            await expect(
                autoRenewSubscriptionLicense
                    .connect(accounts[1])
                    .restrictTransfer(tokenId)
            ).to.be.rejectedWith("Ownable: caller is not the owner")
        })
    })

    describe("allowTransfer", async function () {
        it("allows the owner to update the permission for transfer license", async () => {
            const customerAddress = accounts[1].address
            const subscriptionPrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()

            const fromBalance = await mapCoin.balanceOf(customerAddress)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10"
                const transactionResponse = await mapCoin.transfer(
                    customerAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            const approveAmount = "1000"
            const mapCoinFrom = await ethers.getContract("MapCoin", accounts[1])
            const transactionResponseApprove = await mapCoinFrom.approve(
                autoRenewSubscriptionLicense.address,
                approveAmount
            )
            await transactionResponseApprove.wait()

            await autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()

            await autoRenewSubscriptionLicense.allowTransfer(tokenId)
            const tranferingAllowed =
                await autoRenewSubscriptionLicense.isTransferAllowed(tokenId)
            expect(tranferingAllowed).to.be.true
        })

        it("reverts if a non-owner tries to update the permission for transfer license", async () => {
            const customerAddress = accounts[1].address
            const subscriptionPrice =
                await autoRenewSubscriptionLicense.getLicensePrice()
            const tokenId = await autoRenewSubscriptionLicense.getTokenCounter()

            const fromBalance = await mapCoin.balanceOf(customerAddress)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10"
                const transactionResponse = await mapCoin.transfer(
                    customerAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            const approveAmount = "1000"
            const mapCoinFrom = await ethers.getContract("MapCoin", accounts[1])
            const transactionResponseApprove = await mapCoinFrom.approve(
                autoRenewSubscriptionLicense.address,
                approveAmount
            )
            await transactionResponseApprove.wait()

            await autoRenewSubscriptionLicense.connect(accounts[1]).buyToken()

            await expect(
                autoRenewSubscriptionLicense
                    .connect(accounts[1])
                    .allowTransfer(tokenId)
            ).to.be.rejectedWith("Ownable: caller is not the owner")
        })
    })
})
