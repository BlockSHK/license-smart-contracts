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

    describe("cancelSubscription", async function () {
        it("should cancel the new subscription we get", async () => {
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

            let isSubscriptionActive =
                await subscriptionLicense.isSubscriptionActive(
                    subscriptionHash,
                    periodSeconds
                )

            expect(isSubscriptionActive).to.be.true

            const subscriptionLicenseFrom = await ethers.getContract(
                "SubscriptionLicense",
                accounts[1]
            )
            let cancelSubscription =
                await subscriptionLicenseFrom.cancelSubscription(
                    fromAddress,
                    toAddress,
                    mapCoinAddress,
                    licensePrice,
                    periodSeconds,
                    gasPrice,
                    nonce,
                    signature
                )
            await cancelSubscription.wait()

            await expect(cancelSubscription)
                .to.emit(subscriptionLicense, "CancelSubscription")
                .withArgs(
                    fromAddress,
                    toAddress,
                    mapCoinAddress,
                    licensePrice,
                    periodSeconds,
                    gasPrice,
                    nonce
                )

            let isSubscriptionActiveAfter =
                await subscriptionLicense.isSubscriptionActive(
                    subscriptionHash,
                    periodSeconds
                )
            expect(isSubscriptionActiveAfter).to.be.false
        })

        it("Cancel subscription should fail if the caller is not the subscriber", async () => {
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

            let isSubscriptionActive =
                await subscriptionLicense.isSubscriptionActive(
                    subscriptionHash,
                    periodSeconds
                )

            expect(isSubscriptionActive).to.be.true

            const subscriptionLicenseFrom = await ethers.getContract(
                "SubscriptionLicense",
                accounts[2] // not the subscriber
            )

            await expect(
                subscriptionLicenseFrom.cancelSubscription(
                    fromAddress,
                    toAddress,
                    mapCoinAddress,
                    licensePrice,
                    periodSeconds,
                    gasPrice,
                    nonce,
                    signature
                )
            ).to.be.revertedWith("msg.sender is not the subscriber")
        })

        it("Cancel subscription should fail if the signer is not the subscriber", async () => {
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

            let isSubscriptionActive =
                await subscriptionLicense.isSubscriptionActive(
                    subscriptionHash,
                    periodSeconds
                )

            expect(isSubscriptionActive).to.be.true
            let signatureWrong = await accounts[2].signMessage(
                ethers.utils.arrayify(subscriptionHash)
            )
            const subscriptionLicenseFrom = await ethers.getContract(
                "SubscriptionLicense",
                accounts[1]
            )
            await expect(
                subscriptionLicenseFrom.cancelSubscription(
                    fromAddress,
                    toAddress,
                    mapCoinAddress,
                    licensePrice,
                    periodSeconds,
                    gasPrice,
                    nonce,
                    signatureWrong
                )
            ).to.be.revertedWith(
                "Invalid Signature for subscription cancellation"
            )
        })
    })

    describe("getILicenseName", async function () {
        it("should return the correct license name", async () => {
            const licenseName = await subscriptionLicense.getILicenseName()
            expect(licenseName).to.equal("Microsoft")
        })
    })

    describe("getSubscriptionHash", async function () {
        it("should get the subscription hash without a error", async () => {
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
        })

        it("should generate requiredToAddress Failure when to address is wrong", async () => {
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

            let toAddress = accounts[2].address
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

            await expect(
                subscriptionLicense.getSubscriptionHash(
                    fromAddress,
                    toAddress,
                    mapCoinAddress,
                    licensePrice,
                    periodSeconds,
                    gasPrice,
                    nonce
                )
            ).to.be.revertedWith("requiredToAddress Failure")
        })

        it("should generate requiredTokenAddress Failure when coin token address is wrong", async () => {
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
            let mapCoinAddress = accounts[2].address
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

            await expect(
                subscriptionLicense.getSubscriptionHash(
                    fromAddress,
                    toAddress,
                    mapCoinAddress,
                    licensePrice,
                    periodSeconds,
                    gasPrice,
                    nonce
                )
            ).to.be.revertedWith("requiredTokenAddress Failure")
        })

        it("should generate requiredTokenAmount Failure when to amount is wrong", async () => {
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
            let licensePrice = 0
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

            await expect(
                subscriptionLicense.getSubscriptionHash(
                    fromAddress,
                    toAddress,
                    mapCoinAddress,
                    licensePrice,
                    periodSeconds,
                    gasPrice,
                    nonce
                )
            ).to.be.revertedWith("requiredTokenAmount Failure")
        })

        it("should generate requiredPeriodSeconds Failure when period is wrong", async () => {
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
            let periodSeconds = 10
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

            await expect(
                subscriptionLicense.getSubscriptionHash(
                    fromAddress,
                    toAddress,
                    mapCoinAddress,
                    licensePrice,
                    periodSeconds,
                    gasPrice,
                    nonce
                )
            ).to.be.revertedWith("requiredPeriodSeconds Failure")
        })

        it("should generate requiredGasPrice Failure when gas price is wrong", async () => {
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
            let gasPrice = 0
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

            await expect(
                subscriptionLicense.getSubscriptionHash(
                    fromAddress,
                    toAddress,
                    mapCoinAddress,
                    licensePrice,
                    periodSeconds,
                    gasPrice,
                    nonce
                )
            ).to.be.revertedWith("requiredGasPrice Failure")
        })
    })
})
