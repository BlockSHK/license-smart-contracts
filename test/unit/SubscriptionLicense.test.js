const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
describe("AutoRenewSubscriptionLicense", async function () {
    let subscriptionLicense, mapCoin
    const sendValue = ethers.utils.parseEther("1")
    beforeEach(async () => {
        const { deployer, secondPayer } = await getNamedAccounts()
        await deployments.fixture(["all"])
        subscriptionLicense = await ethers.getContract(
            "SubscriptionLicense",
            deployer
        )
        mapCoin = await ethers.getContract("MapCoin", deployer)
    })

    describe("getSubscription", async function () {
        it("should get a new subscription", async () => {
            const oneMinute = 60
            await ethers.provider.send("evm_increaseTime", [oneMinute])
            await ethers.provider.send("evm_mine")

            const { deployer, secondPayer } = await getNamedAccounts()
            const mapCoin = await ethers.getContract("MapCoin", deployer)

            const subscriptionLicense = await ethers.getContract(
                "SubscriptionLicense",
                deployer
            )

            const accounts = await ethers.getSigners()

            let toAddress = await subscriptionLicense.getRequiredToAddress()
            let fromAddress = accounts[1].address
            let mapCoinAddress =
                await subscriptionLicense.getRequiredTokenAddress()
            let licensePrice =
                await subscriptionLicense.getRequiredTokenAmount()
            let periodSeconds =
                await subscriptionLicense.getRequiredPeriodSeconds()
            let gasPrice = await subscriptionLicense.getRequiredGasPrice()
            let nonce = 1

            const fromBalance = await mapCoin.balanceOf(fromAddress)
            expect(fromBalance).to.equal(0)
            if (fromBalance.toNumber() <= 0) {
                const transferAmount = "10000000"
                const transactionResponse = await mapCoin.transfer(
                    fromAddress,
                    transferAmount
                )
                await transactionResponse.wait()
            }

            expect((await mapCoin.balanceOf(fromAddress)).toNumber()).to.equal(
                10000000
            )
            const approveAmount = await mapCoin.allowance(
                fromAddress,
                subscriptionLicense.address
            )
            expect(approveAmount).to.equal(0)
            if (approveAmount.toNumber() <= 0) {
                const approveAmount = "1000"
                const mapCoinFrom = await ethers.getContract(
                    "MapCoin",
                    accounts[1]
                )

                const transactionResponseApprove = await mapCoinFrom.approve(
                    subscriptionLicense.address,
                    approveAmount
                )

                await transactionResponseApprove.wait()
            }

            const approveAmountFinal = await mapCoin.allowance(
                fromAddress,
                subscriptionLicense.address
            )

            expect(approveAmountFinal.toNumber()).to.equal(1000)
            const subscriptionHash =
                await subscriptionLicense.getSubscriptionHash(
                    fromAddress,
                    toAddress,
                    mapCoinAddress,
                    licensePrice,
                    periodSeconds,
                    gasPrice,
                    nonce
                )

            let signature = await accounts[1].signMessage(
                ethers.utils.arrayify(subscriptionHash)
            )

            let signerVerify = await subscriptionLicense.getSubscriptionSigner(
                subscriptionHash,
                signature
            )
            expect(signerVerify).to.equal(accounts[1].address)
            let isSubscriptionReady =
                await subscriptionLicense.isSubscriptionReady(
                    fromAddress, //the subscriber
                    toAddress, //the publisher
                    mapCoinAddress, //the token address paid to the publisher
                    licensePrice, //the token amount paid to the publisher
                    periodSeconds, //the period in seconds between payments
                    gasPrice, //the amount of tokens or eth to pay relayer (0 for free)
                    nonce, // to allow multiple subscriptions with the same parameters
                    signature
                )

            expect(isSubscriptionReady).to.be.true

            let executeSubscription =
                await subscriptionLicense.executeSubscription(
                    fromAddress,
                    toAddress,
                    mapCoinAddress,
                    licensePrice,
                    periodSeconds,
                    gasPrice,
                    nonce,
                    signature
                )
            await executeSubscription.wait()

            await expect(executeSubscription)
                .to.emit(subscriptionLicense, "ExecuteSubscription")
                .withArgs(
                    fromAddress,
                    toAddress,
                    mapCoinAddress,
                    licensePrice,
                    periodSeconds,
                    gasPrice,
                    nonce
                )
        })
    })
})
