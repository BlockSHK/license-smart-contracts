// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "base64-sol/base64.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

error ERC721Metadata__URI_QueryFor_NonExistentToken();
error SubscriptionLicense__TransferFailed();
error SubscriptionLicense__NeedMoreETHSent();

contract FixedSubscriptionLicense is ERC721,Ownable{
    using SafeMath for uint256;

    uint256 private s_tokenCounter;
    uint256 private s_licensePrice;
    uint256 private s_gasPrice;
    string private i_companyName;
    string private i_licenseType;
    string private i_licenseName;
    address private i_tokenAddress;
    uint256 private i_periodSecond;
    string private i_licenseAgreementUrl;

    mapping(uint256 => uint256) public startTimestamp;
    mapping(uint256 => uint256) public expirationTimestamp;
    mapping(uint256 => uint256) public transferingAllowed;

    event CreatedSubscriptionToken(uint256 indexed tokenId, uint256 licensePrice);
    event UpdatedSubscriptionToken(uint256 indexed tokenId, uint256 licensePrice);

    constructor(
        string memory companyName,
        string memory licenseName,
        string memory licenseAgreementUrl,
        address tokenAddress,
        uint256  licensePrice,
        uint256 subscriptionPeriodSecond,
        uint256 gasPrice
    ) ERC721("Software License", "SHK") {
        s_tokenCounter = 0;
        s_licensePrice = licensePrice;
        i_companyName = companyName;
        i_licenseName = licenseName;
        i_licenseType = "Subscription";
        i_periodSecond = subscriptionPeriodSecond; 
        i_licenseAgreementUrl = licenseAgreementUrl;
        s_gasPrice = gasPrice;
        i_tokenAddress = tokenAddress;
    }


    function buyToken() public {

        uint256 allowance = ERC20(i_tokenAddress).allowance(msg.sender, address(this));
        uint256 balance = ERC20(i_tokenAddress).balanceOf(msg.sender);

        require( allowance >= s_licensePrice.add(s_gasPrice) && balance >= s_licensePrice.add(s_gasPrice), "Subscription is not ready or not enough balance or allowance");


        transferingAllowed[s_tokenCounter] = 1;
        _safeMint(msg.sender, s_tokenCounter);
        startTimestamp[s_tokenCounter] = block.timestamp;
        expirationTimestamp[s_tokenCounter] = block.timestamp.add(i_periodSecond);
        transferingAllowed[s_tokenCounter] = 0;

        uint256 startingBalance = ERC20(i_tokenAddress).balanceOf(address(this));
        ERC20(i_tokenAddress).transferFrom(msg.sender,address(this),s_licensePrice);
        require(
          (startingBalance+s_licensePrice) == ERC20(i_tokenAddress).balanceOf(address(this)),
          "ERC20 Balance did not change correctly"
        );

        require(
          checkSuccess(),
          "Subscription::buy Subscription Token  TransferFrom failed"
          );


        s_tokenCounter = s_tokenCounter + 1;
        emit CreatedSubscriptionToken(s_tokenCounter, s_licensePrice);
    }

    function mintToken(address customer) public onlyOwner {

        uint256 allowance = ERC20(i_tokenAddress).allowance(customer, address(this));
        uint256 balance = ERC20(i_tokenAddress).balanceOf(customer);

        require( allowance >= s_licensePrice.add(s_gasPrice) && balance >= s_licensePrice.add(s_gasPrice), "Subscription is not ready or not enough balance or allowance");


        transferingAllowed[s_tokenCounter] = 1;
        _safeMint(customer, s_tokenCounter);
        startTimestamp[s_tokenCounter] = block.timestamp;
        expirationTimestamp[s_tokenCounter] = block.timestamp.add(i_periodSecond);
        transferingAllowed[s_tokenCounter] = 0;


        uint256 startingBalance = ERC20(i_tokenAddress).balanceOf(address(this));
        ERC20(i_tokenAddress).transferFrom(customer,address(this),s_licensePrice);
        require(
          (startingBalance+s_licensePrice) == ERC20(i_tokenAddress).balanceOf(address(this)),
          "ERC20 Balance did not change correctly"
        );

        require(
          checkSuccess(),
          "Subscription::mint Subscription Token TransferFrom failed"
          );


        s_tokenCounter = s_tokenCounter + 1;
        emit CreatedSubscriptionToken(s_tokenCounter, s_licensePrice);
    }

    function updateSubscription(uint256 tokenId) public{
        require( block.timestamp >= expirationTimestamp[tokenId], "Subscription is still active");

        uint256 allowance = ERC20(i_tokenAddress).allowance(ownerOf(tokenId), address(this));
        uint256 balance = ERC20(i_tokenAddress).balanceOf(ownerOf(tokenId));

        require( allowance >= s_licensePrice.add(s_gasPrice) && balance >= s_licensePrice.add(s_gasPrice), "Subscription is not ready or not enough balance or allowance");
        expirationTimestamp[tokenId] = block.timestamp.add(i_periodSecond);

        uint256 startingBalance = ERC20(i_tokenAddress).balanceOf(address(this));
        ERC20(i_tokenAddress).transferFrom(ownerOf(tokenId),address(this),s_licensePrice);
        require(
          (startingBalance+s_licensePrice) == ERC20(i_tokenAddress).balanceOf(address(this)),
          "ERC20 Balance did not change correctly"
        );

        require(
          checkSuccess(),
          "Subscription::update Subscription TransferFrom failed"
          );

        if (s_gasPrice > 0) {
            ERC20(i_tokenAddress).transferFrom(ownerOf(tokenId), msg.sender, s_gasPrice);
            require(
                checkSuccess(),
                "Subscription::update Subscription Failed to pay gas as from account"
            );
        }
        emit UpdatedSubscriptionToken(tokenId, s_licensePrice);
    }


    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if (!_exists(tokenId)) {
            revert ERC721Metadata__URI_QueryFor_NonExistentToken();
        }

        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                i_companyName, 
                                '","license name":"',
                                i_licenseName,
                                '","license agreement Url":"',
                                i_licenseAgreementUrl,
                                '","license Type":"',
                                i_licenseType,
                                '","payment token Address":"',
                                i_tokenAddress,
                                '","price":"',
                                Strings.toString(s_licensePrice),
                                '","start timestamp":"',
                                Strings.toString(startTimestamp[tokenId]),
                                '","expiration timestamp":"',
                                Strings.toString(expirationTimestamp[tokenId]),
                                '","tokenID":"',
                                Strings.toString(tokenId),
                                '"}'
                            )
                        )
                    )
                )
            );
    }


    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getLicensePrice() public view returns (uint256) {
        return s_licensePrice ;
    }

    function getSubscritptionTimePeriod() public view returns (uint256) {
        return i_periodSecond ;
    }

    function getExpirationTime(uint256 tokenId) public view returns (uint256) {
        return expirationTimestamp[tokenId];
    }

    function isSubscriptionActive(uint256 tokenId) public view returns (bool) {
        if(expirationTimestamp[tokenId]==type(uint).max){
          return false;
        }
        return (block.timestamp <= expirationTimestamp[tokenId]);
    }

    function isTransferAllowed(uint256 tokenId) public view returns (bool) {
        return (transferingAllowed[tokenId]==1);
    }
    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert SubscriptionLicense__TransferFailed();
        }
    }
    function _beforeTokenTransfer(address from, address to, uint256 firsTokenId, uint256 batchSize) internal virtual override {
        require(transferingAllowed[firsTokenId] == 1 , "Prior Approval needed for transfer of the tokens");
        super._beforeTokenTransfer(from, to, firsTokenId,batchSize);
    }

    function transferFrom(address from, address to, uint256 tokenId) public virtual override {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: transfer caller is not owner nor approved");
        require(_exists(tokenId), "ERC721: nonexistent token");

        _beforeTokenTransfer(from, to, tokenId,1);
        // clear approval
        _approve(address(0), tokenId);
        super._transfer(from, to, tokenId);
        // update transferingAllowed mapping to 0
        transferingAllowed[tokenId] = 0;
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual override {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public virtual override {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: transfer caller is not owner nor approved");
        require(_exists(tokenId), "ERC721: nonexistent token");
        require(transferingAllowed[tokenId] == 1, "ERC721: token is not approved for transfer");

        _beforeTokenTransfer(from, to, tokenId,1);
        // clear approval
        _approve(address(0), tokenId);
        super._safeTransfer(from, to, tokenId, _data);
        // update transferingAllowed mapping to 0
        transferingAllowed[tokenId] = 0;
    }


    function updateLicensePrice(uint256 newPrice) public onlyOwner {
        require(newPrice > 0, "Price must be greater than zero");
        s_licensePrice = newPrice;
    }

    function allowTransfer(uint256 tokenId) public onlyOwner {
        transferingAllowed[tokenId] = 1;
    }

    function restrictTransfer(uint256 tokenId) public onlyOwner {
        transferingAllowed[tokenId] = 0;
    }


    
    function cancelSubscription(uint256 tokenId) public  {
        require(msg.sender == ownerOf(tokenId), "Only owner can cancel the subscription");

        expirationTimestamp[tokenId]=type(uint).max;
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
    

}