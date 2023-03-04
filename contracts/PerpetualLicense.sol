// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "base64-sol/base64.sol";
import "hardhat/console.sol";

error ERC721Metadata__URI_QueryFor_NonExistentToken();
error PerpetualLicense__TransferFailed();
error PerpetualLicense__NeedMoreETHSent();

contract PerpetualLicense is ERC721Royalty,Ownable{

    uint256 private s_tokenCounter;
    uint256 private s_licensePrice;
    string private i_companyName;
    string private i_licenseType;
    string private i_licenseName;

    event CreatedLicenseToken(uint256 indexed tokenId, uint256 licensePrice);

    constructor(
        string memory companyName,
        string memory licenseName,
        uint256  licensePrice,
        uint96 royaltyPrecentage
    ) ERC721("Software License", "SHK") {
        s_tokenCounter = 0;
        s_licensePrice = licensePrice;
        i_companyName = companyName;
        i_licenseName = licenseName;
        i_licenseType = "Perpetual";
        _setDefaultRoyalty(msg.sender, royaltyPrecentage*100);
    }


    function mintToken() public payable  {
        if (msg.value < s_licensePrice) {
            revert PerpetualLicense__NeedMoreETHSent();
        }
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter = s_tokenCounter + 1;
        emit CreatedLicenseToken(s_tokenCounter, s_licensePrice);
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
                                '","license Type":"',
                                i_licenseType,
                                '","price":"',
                                Strings.toString(s_licensePrice),
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

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert PerpetualLicense__TransferFailed();
        }
    }

    function updateLicensePrice(uint256 newPrice) public onlyOwner {
        require(newPrice > 0, "Price must be greater than zero");
        s_licensePrice = newPrice;
    }
}