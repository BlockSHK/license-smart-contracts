const { run } = require("hardhat")

const verify = async (contractAddress, args, contract) => {
    console.log("Verifying contract...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
            contract: contract,
        })
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already verified!")
        } else {
            console.error(e)
        }
    }
}

module.exports = { verify }
