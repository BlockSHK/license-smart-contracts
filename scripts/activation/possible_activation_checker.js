const Web3 = require("web3");

const licenseActivationABI = [...] // ABI of the LicenseActivation contract
const contractAddress = "0x..."; // Address of the deployed LicenseActivation contract
const tokenId = 123; // The token ID you want to check

async function checkActivation() {
    const web3 = new Web3("https://mainnet.infura.io/v3/YOUR-PROJECT-ID"); // Connect to Ethereum network (Mainnet/Rinkeby/etc.)
    const licenseActivationContract = new web3.eth.Contract(licenseActivationABI, contractAddress);

    const activationEvents = await licenseActivationContract.getPastEvents("Activation", {
        filter: { tokenId: tokenId },
        fromBlock: 0,
        toBlock: "latest",
    });

    if (activationEvents.length === 0) {
        console.log("No activation event found for this token ID.");
        return;
    }

    const lastActivationEvent = activationEvents[activationEvents.length - 1];

    const deactivationEvents = await licenseActivationContract.getPastEvents("Deactivation", {
        filter: { tokenId: tokenId },
        fromBlock: lastActivationEvent.blockNumber,
        toBlock: "latest",
    });

    if (deactivationEvents.length > 0) {
        console.log("Activation event found, but a deactivation event occurred afterward.");
    } else {
        console.log("Activation event found and no deactivation event occurred afterward.");
    }
}

checkActivation();