//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract FakeNFTMarketplace {
    mapping(uint256 => address) public tokens;
    uint256 nftPrice = 0.00001 ether;

    function purchase(uint256 _tokenId) external payable {
        require(available(_tokenId), "NFT is not available.");
        require(msg.value >= nftPrice, "Insufficient ether provided.");

        tokens[_tokenId] = msg.sender;
    }

    function getPrice() external view returns (uint256) {
        return nftPrice;
    }

    function available(uint256 _tokenId) public view returns (bool) {
        return tokens[_tokenId] == address(0);
    }
}
