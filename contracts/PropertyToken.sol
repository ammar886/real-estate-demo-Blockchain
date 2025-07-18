// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts/access/AccessControl.sol"
import "@openzeppelin/contracts/utils/Strings.sol";

contract PropertyToken is ERC721 {
    // bytes32 public constant SELLER_ROLE = keccak256("SELLER_ROLE");
    uint256 public nextTokenId;

    mapping(uint256 => string) private _tokenURIs;

    constructor() ERC721("PropertyTitle", "PROP") {
        // _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // function grantSellerRole(address seller) external onlyRole(DEFAULT_ADMIN_ROLE) {
    //     _grantRole(SELLER_ROLE, seller);
    // }

    // function mint(address to, string memory uri) external onlyRole(SELLER_ROLE) returns (uint256) {
    function mint(address to, string memory uri) external returns (uint256) {
        uint256 tokenId = nextTokenId++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    function _setTokenURI(uint256 tokenId, string memory uri) internal {
        _tokenURIs[tokenId] = uri;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    // function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
    //     return super.supportsInterface(interfaceId);
    // }
}
