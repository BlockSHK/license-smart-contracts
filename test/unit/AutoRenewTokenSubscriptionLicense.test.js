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
})
