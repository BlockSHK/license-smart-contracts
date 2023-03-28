const { ethers, getNamedAccounts } = require("hardhat")
const Web3 = require("web3")
const fs = require("fs")
const path = require("path")

async function checkActivation() {
    const artifactPath = path.join(
        __dirname,
        "../../artifacts/contracts/LicenseActivation.sol/LicenseActivation.json"
    )

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"))
    const licenseActivationABI = artifact.abi
    const accounts = await ethers.getSigners()

    // Get the contract artifact
    const LicenseActivation = await ethers.getContract(
        "LicenseActivation",
        accounts[0]
    )
    const hash = ethers.utils.keccak256("0x1234")
    // Get the contract address
    const contractAddress = LicenseActivation.address

    // Get the contract ABI

    // Connect to Ethereum network
    // const web3 = new Web3(
    //     "https://eth-goerli.g.alchemy.com/v2/wLpA-TL3WxjCfKMfTcaxJQ7fL6MIQ1mP"
    // )
    const web3 = new Web3("http://localhost:8545")

    // Create the contract instance
    const licenseActivationContract = new web3.eth.Contract(
        licenseActivationABI,
        contractAddress
    )

    const tokenId = 123 // The token ID you want to check

    const activationEvents = await licenseActivationContract.getPastEvents(
        "Activation",
        {
            filter: { tokenId: tokenId, hash: hash },
            fromBlock: 0,
            toBlock: "latest",
        }
    )

    if (activationEvents.length === 0) {
        console.log("No activation event found for this token ID.")
        return
    }

    const lastActivationEvent = activationEvents[activationEvents.length - 1]

    const deactivationEvents = await licenseActivationContract.getPastEvents(
        "Deactivation",
        {
            filter: { tokenId: tokenId },
            fromBlock: lastActivationEvent.blockNumber,
            toBlock: "latest",
        }
    )

    if (deactivationEvents.length > 0) {
        console.log(
            "Activation event found, but a deactivation event occurred afterward."
        )
    } else {
        console.log(
            "Activation event found and no deactivation event occurred afterward."
        )
    }
}

checkActivation()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
