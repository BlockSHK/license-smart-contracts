# Solidity API

## ERC721Metadata__URI_QueryFor_NonExistentToken

```solidity
error ERC721Metadata__URI_QueryFor_NonExistentToken()
```

## PerpetualLicense__TransferFailed

```solidity
error PerpetualLicense__TransferFailed()
```

## PerpetualLicense__NeedMoreETHSent

```solidity
error PerpetualLicense__NeedMoreETHSent()
```

## PerpetualLicense

### CreatedLicenseToken

```solidity
event CreatedLicenseToken(uint256 tokenId, uint256 licensePrice)
```

### constructor

```solidity
constructor(string companyName, string licenseName, uint256 licensePrice, uint96 royaltyPrecentage) public
```

### buyToken

```solidity
function buyToken() public payable
```

### mintToken

```solidity
function mintToken(address customer) public
```

### _baseURI

```solidity
function _baseURI() internal pure returns (string)
```

_Base URI for computing {tokenURI}. If set, the resulting URI for each
token will be the concatenation of the `baseURI` and the `tokenId`. Empty
by default, can be overridden in child contracts._

### tokenURI

```solidity
function tokenURI(uint256 tokenId) public view virtual returns (string)
```

_See {IERC721Metadata-tokenURI}._

### getTokenCounter

```solidity
function getTokenCounter() public view returns (uint256)
```

### getLicensePrice

```solidity
function getLicensePrice() public view returns (uint256)
```

### withdraw

```solidity
function withdraw() public
```

### updateLicensePrice

```solidity
function updateLicensePrice(uint256 newPrice) public
```

## ERC721Metadata__URI_QueryFor_NonExistentToken

```solidity
error ERC721Metadata__URI_QueryFor_NonExistentToken()
```

## SubscriptionLicense__TransferFailed

```solidity
error SubscriptionLicense__TransferFailed()
```

## SubscriptionLicense__NeedMoreETHSent

```solidity
error SubscriptionLicense__NeedMoreETHSent()
```

## FixedSubscriptionLicense

### startTimestamp

```solidity
mapping(uint256 => uint256) startTimestamp
```

### expirationTimestamp

```solidity
mapping(uint256 => uint256) expirationTimestamp
```

### transferingAllowed

```solidity
mapping(uint256 => uint256) transferingAllowed
```

### CreatedSubscriptionToken

```solidity
event CreatedSubscriptionToken(uint256 tokenId, uint256 licensePrice)
```

### UpdatedSubscriptionToken

```solidity
event UpdatedSubscriptionToken(uint256 tokenId, uint256 licensePrice)
```

### constructor

```solidity
constructor(string companyName, string licenseName, uint256 licensePrice, uint256 subscriptionPeriodSecond) public
```

### buyToken

```solidity
function buyToken() public payable
```

### mintToken

```solidity
function mintToken(address customer) public
```

### updateSubscription

```solidity
function updateSubscription(uint256 tokenId) public payable
```

### _baseURI

```solidity
function _baseURI() internal pure returns (string)
```

_Base URI for computing {tokenURI}. If set, the resulting URI for each
token will be the concatenation of the `baseURI` and the `tokenId`. Empty
by default, can be overridden in child contracts._

### tokenURI

```solidity
function tokenURI(uint256 tokenId) public view virtual returns (string)
```

_See {IERC721Metadata-tokenURI}._

### getTokenCounter

```solidity
function getTokenCounter() public view returns (uint256)
```

### getLicensePrice

```solidity
function getLicensePrice() public view returns (uint256)
```

### getSubscritptionTimePeriod

```solidity
function getSubscritptionTimePeriod() public view returns (uint256)
```

### getExpirationTime

```solidity
function getExpirationTime(uint256 tokenId) public view returns (uint256)
```

### isSubscriptionActive

```solidity
function isSubscriptionActive(uint256 tokenId) public view returns (bool)
```

### isTransferAllowed

```solidity
function isTransferAllowed(uint256 tokenId) public view returns (bool)
```

### withdraw

```solidity
function withdraw() public
```

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 firsTokenId, uint256 batchSize) internal virtual
```

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 tokenId) public virtual
```

_See {IERC721-transferFrom}._

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId) public virtual
```

_See {IERC721-safeTransferFrom}._

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId, bytes _data) public virtual
```

### updateLicensePrice

```solidity
function updateLicensePrice(uint256 newPrice) public
```

### allowTransfer

```solidity
function allowTransfer(uint256 tokenId) public
```

### restrictTransfer

```solidity
function restrictTransfer(uint256 tokenId) public
```

### cancelSubscription

```solidity
function cancelSubscription(uint256 tokenId) public
```

### getRefundEligible

```solidity
function getRefundEligible(uint256 tokenId, uint256 timestamp) public view returns (bool)
```

## MapCoin

### constructor

```solidity
constructor(uint256 initialSupply) public
```

## SubscriptionLicense

### ExecuteSubscription

```solidity
event ExecuteSubscription(address from, address to, address tokenAddress, uint256 tokenAmount, uint256 periodSeconds, uint256 gasPrice, uint256 nonce)
```

### CancelSubscription

```solidity
event CancelSubscription(address from, address to, address tokenAddress, uint256 tokenAmount, uint256 periodSeconds, uint256 gasPrice, uint256 nonce)
```

### constructor

```solidity
constructor(address _toAddress, address _tokenAddress, uint256 _tokenAmount, uint256 _periodSeconds, uint256 _gasPrice, string licenseName) public
```

### isSubscriptionActive

```solidity
function isSubscriptionActive(bytes32 subscriptionHash, uint256 gracePeriodSeconds) external view returns (bool)
```

### getSubscriptionHash

```solidity
function getSubscriptionHash(address from, address to, address tokenAddress, uint256 tokenAmount, uint256 periodSeconds, uint256 gasPrice, uint256 nonce) public view returns (bytes32)
```

### getSubscriptionSigner

```solidity
function getSubscriptionSigner(bytes32 subscriptionHash, bytes signature) public pure returns (address)
```

### isSubscriptionReady

```solidity
function isSubscriptionReady(address from, address to, address tokenAddress, uint256 tokenAmount, uint256 periodSeconds, uint256 gasPrice, uint256 nonce, bytes signature) external view returns (bool)
```

### cancelSubscription

```solidity
function cancelSubscription(address from, address to, address tokenAddress, uint256 tokenAmount, uint256 periodSeconds, uint256 gasPrice, uint256 nonce, bytes signature) external returns (bool success)
```

### executeSubscription

```solidity
function executeSubscription(address from, address to, address tokenAddress, uint256 tokenAmount, uint256 periodSeconds, uint256 gasPrice, uint256 nonce, bytes signature) public returns (bool success)
```

### getRequiredToAddress

```solidity
function getRequiredToAddress() external view returns (address)
```

### getRequiredTokenAddress

```solidity
function getRequiredTokenAddress() external view returns (address)
```

### getRequiredTokenAmount

```solidity
function getRequiredTokenAmount() external view returns (uint256)
```

### getRequiredPeriodSeconds

```solidity
function getRequiredPeriodSeconds() external view returns (uint256)
```

### getRequiredGasPrice

```solidity
function getRequiredGasPrice() external view returns (uint256)
```

### getILicenseName

```solidity
function getILicenseName() external view returns (string)
```

