const { ethers } = require("hardhat")
const Web3 = require("web3")

async function checkActivation() {
    const accounts = await ethers.getSigners()

    // Get the contract artifact
    const LicenseActivation = await ethers.getContractFactory(
        "LicenseActivation"
    )

    // Get the contract address
    const contractAddress = LicenseActivation.address

    // Get the contract ABI
    const licenseActivationABI = LicenseActivation.interface.format()

    // Connect to Ethereum network
    const web3 = new Web3(
        "https://eth-goerli.g.alchemy.com/v2/wLpA-TL3WxjCfKMfTcaxJQ7fL6MIQ1mP"
    )

    // Create the contract instance
    const licenseActivationContract = new web3.eth.Contract(
        licenseActivationABI,
        contractAddress
    )

    const tokenId = 123 // The token ID you want to check

    const activationEvents = await licenseActivationContract.getPastEvents(
        "Activation",
        {
            filter: { tokenId: tokenId },
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
