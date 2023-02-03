const { ethers, getNamedAccounts } = require("hardhat")
function sign(address, data) {
    return hre.network.provider.send("eth_sign", [
        address,
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes("foo")),
    ])
}
async function main() {
    const { deployer, secondPayer } = await getNamedAccounts()
    const mapCoin = await ethers.getContract("MapCoin", deployer)
    const subscriptionLicense = await ethers.getContract(
        "SubscriptionLicense",
        deployer
    )
    let toAddress = "0x76eD2B384f9fA8649E7c15d324367f78515183aE"
    let fromAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    let mapCoinAddress = mapCoin.address
    let licensePrice = "10"
    let periodSeconds = "60"
    let gasPrice = "1"
    let nonce = 1

    console.log(`Got contract MapCoin at ${mapCoin.address}`)
    const approveAmount = await mapCoin.allowance(fromAddress, toAddress)
    console.log(
        `Approve amount from ${deployer}  to address ${toAddress} is ${approveAmount.toNumber()}`
    )

    const subscriptionHash = await subscriptionLicense.getSubscriptionHash(
        fromAddress, //the subscriber
        toAddress, //the publisher
        mapCoinAddress, //the token address paid to the publisher
        licensePrice, //the token amount paid to the publisher
        periodSeconds, //the period in seconds between payments
        gasPrice, //the amount of tokens or eth to pay relayer (0 for free)
        nonce // to allow multiple subscriptions with the same parameters
    )
    signer = deployer
    signature = await sign(signer, subscriptionHash)
    console.log(signer, signature)

    signerNetwork = await subscriptionLicense.getSubscriptionSigner(
        subscriptionHash,
        signature
    )

    console.log(`Transfer Complete :- ${signerNetwork}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
