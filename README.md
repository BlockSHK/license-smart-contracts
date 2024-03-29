# license-smart-contracts
Contains the Smart Contracts Models for License Types


This project use hardhat framework.
# Getting Started

## Requirements

- [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Nodejs](https://nodejs.org/en/)
- [Yarn](https://yarnpkg.com/getting-started/install) instead of `npm`

## Quickstart

```
gh repo clone BlockSHK/license-smart-contracts
cd BlockSHK/license-smart-contracts
yarn install
```

# Usage

Deploy:

```
yarn hardhat deploy
```

## Testing

```
yarn hardhat test
```

### Test Coverage

```
yarn hardhat coverage
```

# Deployment to a testnet or mainnet

1. Setup environment variables

You'll want to set your `GOERLI_RPC_URL` and `PRIVATE_KEY` as environment variables. You can add them to a `.env` file, similar to what you see in `.env.example`.

- `PRIVATE_KEY`: The private key of your account (like from [metamask](https://metamask.io/)). **NOTE:** FOR DEVELOPMENT, PLEASE USE A KEY THAT DOESN'T HAVE ANY REAL FUNDS ASSOCIATED WITH IT.
  - You can [learn how to export it here](https://metamask.zendesk.com/hc/en-us/articles/360015289632-How-to-Export-an-Account-Private-Key).
- `GOERLI_RPC_URL`: This is url of the goerli testnet node you're working with. You can get setup with one for free from [Alchemy](https://alchemy.com/?a=673c802981)

2. Get testnet ETH

Head over to [faucets.chain.link](https://faucets.chain.link/) and get some tesnet ETH. You should see the ETH show up in your metamask.


3. Deploy

```
yarn hardhat deploy --network goerli
```

## Scripts

After deploy to a testnet or local net, you can run the scripts. 

```
yarn hardhat run scripts/perpetualLicense/buyLicense.js 
```

or
```
yarn hardhat run scripts/perpetualLicense/ --network localhost
```

## Estimate gas

You can estimate how much gas things cost by running:

```
yarn hardhat test
```

And you'll see and output file called `gas-report.txt`


[Click here](/gas-report.txt) to view the current gas report.
### Estimate gas cost in USD

To get a USD estimation of gas cost, you'll need a `COINMARKETCAP_API_KEY` environment variable. You can get one for free from [CoinMarketCap](https://pro.coinmarketcap.com/signup). 

Then, uncomment the line `coinmarketcap: COINMARKETCAP_API_KEY,` in `hardhat.config.js` to get the USD estimation. Just note, everytime you run your tests it will use an API call, so it might make sense to have using coinmarketcap disabled until you need it. You can disable it by just commenting the line back out. 


## Verify on etherscan

If you deploy to a testnet or mainnet, you can verify it if you get an [API Key](https://etherscan.io/myapikey) from Etherscan and set it as an environemnt variable named `ETHERSCAN_API_KEY`. You can pop it into your `.env` file as seen in the `.env.example`.

In it's current state, if you have your api key set, it will auto verify goerli contracts!

However, you can manual verify with:

```
yarn hardhat verify --constructor-args arguments.js DEPLOYED_CONTRACT_ADDRESS
```
## Architecture

The repository contains three main smart contracts, namely Perpetual License, Fixed Subscription License, and Auto Renew Subscription License. Auto Renew Subscription License contract utilize an ERC20 token called Map Coin for payment.

### Contracts Documentaion
- [Perpetual License contract](./Documentation/Perpetual%20License%20with%20License%20Activation%20Contract.pdf)
- [Fixed Subscription License contract](./Documentation/Fixed_Subscription_License_Documentation.pdf)
- [Auto Renew Subscription License contract](./Documentation/Auto_Renew_Subscription_License_Documentation.pdf)
### Call Graph

The call graph is a useful visualization tool to understand the relationships between different functions in the codebase. In this repository, the call graph can show the interactions between the three main contracts, Perpetual License, Fixed Subscription License, and Auto Renew Subscription License, along with the ERC20 token (Map Coin) used as payment. By illustrating the flow of data and value transfer between the contracts, the call graph can provide insights into the architecture of the repository and identify potential issues or inefficiencies in the code.

- [Perpetual License Call Graph Diagram](./Documentation/PerpetualLicense.png)
- [License Activation Contract Call Graph Diagram](./Documentation/LicenseActivation.png)
- [Fixed Subscription License Call Graph Diagram](./Documentation/FixedSubscriptionLicense.png)
- [Auto Renew Subscription License Call Graph Diagram](./Documentation/AutoRenewSubscriptionLicense.png)
- [Complete Call Graph Diagram](./Documentation/All_Contract_Graphs.png)

Click on the links above to view each call graph diagram.

