//SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SubscriptionLicense {
    using ECDSA for bytes32;
    using SafeMath for uint256;


    address private author;

    address private requiredToAddress;
    address private requiredTokenAddress;
    uint256 private requiredTokenAmount;
    uint256 private requiredPeriodSeconds;
    uint256 private requiredGasPrice;
    string private i_licenseName;

    mapping(bytes32 => uint256) private nextValidTimestamp;
    mapping(address => uint256) private extraNonce;

    event ExecuteSubscription(
        address indexed from, 
        address indexed to, 
        address tokenAddress, 
        uint256 tokenAmount, 
        uint256 periodSeconds, 
        uint256 gasPrice, 
        uint256 nonce 
    );

    event CancelSubscription(
        address indexed from, 
        address indexed to, 
        address tokenAddress, 
        uint256 tokenAmount, 
        uint256 periodSeconds, 
        uint256 gasPrice, 
        uint256 nonce 
    );

    constructor(
        address _toAddress,
        address _tokenAddress,
        uint256 _tokenAmount,
        uint256 _periodSeconds,
        uint256 _gasPrice,
        string memory licenseName
    ) {
        requiredToAddress=_toAddress;
        requiredTokenAddress=_tokenAddress;
        requiredTokenAmount=_tokenAmount;
        requiredPeriodSeconds=_periodSeconds;
        requiredGasPrice=_gasPrice;
        author=msg.sender;
        i_licenseName = licenseName;
    }


    function isSubscriptionActive(
        bytes32 subscriptionHash,
        uint256 gracePeriodSeconds
    )
        external
        view
        returns (bool)
    {
        
        if(nextValidTimestamp[subscriptionHash]==type(uint).max){
          return false;
        }
        return (block.timestamp <=
                nextValidTimestamp[subscriptionHash].add(gracePeriodSeconds)
        );
    }

    function getSubscriptionHash(
        address from, 
        address to, 
        address tokenAddress, 
        uint256 tokenAmount, 
        uint256 periodSeconds, 
        uint256 gasPrice, 
        uint256 nonce 
    )
        public
        view
        returns (bytes32)
    {

        require( requiredToAddress == address(0) || to == requiredToAddress, "requiredToAddress Failure" );
        require( requiredTokenAddress == address(0) || tokenAddress == requiredTokenAddress, "requiredTokenAddress Failure"  );
        require( requiredTokenAmount == 0 || tokenAmount == requiredTokenAmount, "requiredTokenAmount Failure"  );
        require( requiredPeriodSeconds == 0 || periodSeconds == requiredPeriodSeconds, "requiredPeriodSeconds Failure"  );
        require( requiredGasPrice == 0 || gasPrice == requiredGasPrice, "requiredGasPrice Failure"  );

        return keccak256(
            abi.encodePacked(
                bytes1(0x19),
                bytes1(0),
                address(this),
                from,
                to,
                tokenAddress,
                tokenAmount,
                periodSeconds,
                gasPrice,
                nonce
        ));
    }


    function getSubscriptionSigner(
        bytes32 subscriptionHash, 
        bytes memory  signature 
    )
        public
        pure
        returns (address)
    {
        return subscriptionHash.toEthSignedMessageHash().recover(signature);
    }

    function isSubscriptionReady(
        address from, 
        address to, 
        address tokenAddress, 
        uint256 tokenAmount, 
        uint256 periodSeconds, 
        uint256 gasPrice, 
        uint256 nonce,
        bytes memory  signature 
    )
        external
        view
        returns (bool)
    {
        bytes32 subscriptionHash = getSubscriptionHash(
            from, to, tokenAddress, tokenAmount, periodSeconds, gasPrice, nonce
        );
        address signer = getSubscriptionSigner(subscriptionHash, signature);
        uint256 allowance = ERC20(tokenAddress).allowance(from, address(this));
        uint256 balance = ERC20(tokenAddress).balanceOf(from);

        return (
            signer == from &&
            from != to &&
            block.timestamp >= nextValidTimestamp[subscriptionHash] && // nextValidTimestamp[subscriptionHash] default value is zero
            allowance >= tokenAmount.add(gasPrice) &&
            balance >= tokenAmount.add(gasPrice)
        );
    }


    function cancelSubscription(
        address from, 
        address to, 
        address tokenAddress, 
        uint256 tokenAmount, 
        uint256 periodSeconds, 
        uint256 gasPrice, 
        uint256 nonce, 
        bytes memory  signature 
    )
        external
        returns (bool success)
    {
        bytes32 subscriptionHash = getSubscriptionHash(
            from, to, tokenAddress, tokenAmount, periodSeconds, gasPrice, nonce
        );
        address signer = getSubscriptionSigner(subscriptionHash, signature);


        require(signer == from, "Invalid Signature for subscription cancellation");


        require(from == msg.sender, 'msg.sender is not the subscriber');


        nextValidTimestamp[subscriptionHash]=type(uint).max;

        emit CancelSubscription(
            from, to, tokenAddress, tokenAmount, periodSeconds, gasPrice, nonce
        );

        return true;
    }


    function executeSubscription(
        address from, 
        address to, 
        address tokenAddress, 
        uint256 tokenAmount, 
        uint256 periodSeconds, 
        uint256 gasPrice, 
        uint256 nonce, 
        bytes memory signature 
    )
        public
        returns (bool success)
    {

        require(this.isSubscriptionReady(from, to, tokenAddress, tokenAmount, periodSeconds, gasPrice, nonce, signature), "Subscription is not ready or conditions of transction are not met");
        bytes32 subscriptionHash = getSubscriptionHash(
            from, to, tokenAddress, tokenAmount, periodSeconds, gasPrice, nonce
        );

        nextValidTimestamp[subscriptionHash] = block.timestamp.add(periodSeconds);


        if(nonce > extraNonce[from]){
          extraNonce[from] = nonce;
        }


        uint256 startingBalance = ERC20(tokenAddress).balanceOf(to);
        ERC20(tokenAddress).transferFrom(from,to,tokenAmount);
        require(
          (startingBalance+tokenAmount) == ERC20(tokenAddress).balanceOf(to),
          "ERC20 Balance did not change correctly"
        );

        require(
          checkSuccess(),
          "Subscription::executeSubscription TransferFrom failed"
          );


        emit ExecuteSubscription(
            from, to, tokenAddress, tokenAmount, periodSeconds, gasPrice, nonce
        );


        if (gasPrice > 0) {
            ERC20(tokenAddress).transferFrom(from, msg.sender, gasPrice);
            require(
                checkSuccess(),
                "Subscription::executeSubscription Failed to pay gas as from account"
            );
        }

        return true;
    }


    function checkSuccess(
    )
        private
        pure
        returns (bool)
    {
        uint256 returnValue = 0;
        assembly {
            switch returndatasize()
            case 0x0 {
                returnValue := 1
            }
            case 0x20 {
                returndatacopy(0x0, 0x0, 0x20)
                returnValue := mload(0x0)
            }
            default { }
        }

        return returnValue != 0;
    }


    function endContract()
        external
    {
      require(msg.sender==author);
      selfdestruct(payable(author));
    }


    fallback() external payable   {
       revert ();
    }

    receive() external payable {
        revert("bad call");
    }

    function getRequiredToAddress() external view returns (address) {
        return requiredToAddress;
    }

    function getRequiredTokenAddress() external view returns (address) {
        return requiredTokenAddress;
    }

    function getRequiredTokenAmount() external view returns (uint256) {
        return requiredTokenAmount;
    }

    function getRequiredPeriodSeconds() external view returns (uint256) {
        return requiredPeriodSeconds;
    }

    function getRequiredGasPrice() external view returns (uint256) {
        return requiredGasPrice;
    }

    function getILicenseName() external view returns (string memory) {
        return i_licenseName;
    }
}