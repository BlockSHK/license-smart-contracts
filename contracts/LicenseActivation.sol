// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PerpetualLicense.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract LicenseActivation is Ownable{
    using ECDSA for bytes32;

    event Activation(uint256 indexed tokenId, bytes32 indexed hash, address indexed customer);
    event Deactivation(uint256 indexed tokenId, address indexed customer);

    PerpetualLicense private s_perpetualLicenseContract;
    mapping(uint256 => bool) private s_activationStatus;

    function initialize(address perpetualLicenseContractAddress) external onlyOwner {
        require(address(s_perpetualLicenseContract) == address(0), "Already initialized");
        s_perpetualLicenseContract = PerpetualLicense(perpetualLicenseContractAddress);
    }

    function activateLicense(uint256 tokenId, bytes32 hash, bytes calldata signature) external {
        require(!isLicenseActivated(tokenId), "License is already activated");
        address customer = s_perpetualLicenseContract.ownerOf(tokenId);

        
        bytes32 ethSignedMessageHash = hash.toEthSignedMessageHash();

        address signerAddress = ethSignedMessageHash.recover(signature);
        require(signerAddress == customer, "Invalid signature");

        s_activationStatus[tokenId] = true;
        emit Activation(tokenId, hash, customer);
    }

    function deactivateLicense(uint256 tokenId) external {
        require(isLicenseActivated(tokenId), "License is not activated");
        address customer = s_perpetualLicenseContract.ownerOf(tokenId);
        require(msg.sender == customer, "Only the license owner can deactivate");

        s_activationStatus[tokenId] = false;
        emit Deactivation(tokenId, customer);
    }

    function isLicenseActivated(uint256 tokenId) public view returns (bool) {
        return s_activationStatus[tokenId];
    }
}
