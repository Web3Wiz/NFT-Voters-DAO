// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IFakeNFTMarketplace {
    function purchase(uint256 _tokenId) external payable;

    function getPrice() external view returns (uint256);

    function available(uint256 _tokenId) external view returns (bool);
}

interface ICryptoDevsNFT {
    function tokenOfOwnerByIndex(address owner, uint256 index)
        external
        view
        returns (uint256);

    function balanceOf(address owner) external view returns (uint256);
}

import "@openzeppelin/contracts/access/Ownable.sol";

contract CryptoDevsDAO is Ownable {
    struct Proposal {
        uint256 nftTokenId; //nftTokenId to buy
        uint256 deadline;
        uint256 yayvotes;
        uint256 nayvotes;
        bool executed;
        mapping(uint256 => bool) voters; // owned nftTokenId => votedOrNot
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public numProposals;

    ICryptoDevsNFT iCryptoDevsNFT;
    IFakeNFTMarketplace iFakeNFTMarketplace;

    enum Vote {
        YAY, // 0
        NAY // 1
    }

    constructor(
        ICryptoDevsNFT _ICryptoDevsNFT,
        IFakeNFTMarketplace _IFakeNFTMarketplace
    ) payable {
        iCryptoDevsNFT = ICryptoDevsNFT(_ICryptoDevsNFT);
        iFakeNFTMarketplace = IFakeNFTMarketplace(_IFakeNFTMarketplace);
    }

    modifier onlyNFTHolders() {
        require(
            iCryptoDevsNFT.balanceOf(msg.sender) > 0,
            "Not a DAO member for not owning the CryptoDev NFT."
        );
        _;
    }

    modifier onlyActiveProposals(uint256 _proposalId) {
        require(
            proposals[_proposalId].deadline > block.timestamp,
            "Deadline is passed."
        );
        _;
    }

    modifier onlyInactiveProposals(uint256 _proposalId) {
        require(
            proposals[_proposalId].deadline < block.timestamp,
            "Wait for the deadline."
        );
        require(!proposals[_proposalId].executed, "Proposal already executed");
        _;
    }

    function createProposal(uint _nftTokenId)
        public
        onlyNFTHolders
        returns (uint256)
    {
        require(
            iFakeNFTMarketplace.available(_nftTokenId),
            "Can not create proposal. NFT is not available."
        );

        Proposal storage newProposal = proposals[numProposals];

        newProposal.nftTokenId = _nftTokenId;
        newProposal.deadline = block.timestamp + 5 minutes;

        numProposals++;

        return numProposals - 1;
    }

    function voteOnProposal(uint256 proposalId, Vote vote)
        external
        onlyNFTHolders
        onlyActiveProposals(proposalId)
    {
        Proposal storage proposal = proposals[proposalId];
        uint256 toBeVotedNFTs;
        for (uint256 i = 0; i < iCryptoDevsNFT.balanceOf(msg.sender); i++) {
            uint256 ownedNftTokenId = iCryptoDevsNFT.tokenOfOwnerByIndex(
                msg.sender,
                i
            );
            if (!proposal.voters[ownedNftTokenId]) {
                toBeVotedNFTs++;
                proposal.voters[ownedNftTokenId] = true;
            }
        }
        require(
            toBeVotedNFTs > 0,
            "Voting limit reached. Can not vote further."
        );

        vote == Vote.YAY
            ? proposal.yayvotes += toBeVotedNFTs
            : proposal.nayvotes += toBeVotedNFTs;
    }

    function exceuteProposal(uint256 proposalId)
        external
        onlyNFTHolders
        onlyInactiveProposals(proposalId)
    {
        Proposal storage proposal = proposals[proposalId];

        require(
            iFakeNFTMarketplace.available(proposal.nftTokenId),
            "Can not execute proposal. NFT is not available."
        );

        if (proposal.yayvotes > proposal.nayvotes) {
            uint256 nftPrice = iFakeNFTMarketplace.getPrice();
            require(
                address(this).balance >= nftPrice,
                "Not enough funds to buy NFT"
            );

            iFakeNFTMarketplace.purchase{value: nftPrice}(proposal.nftTokenId);
        }
        proposal.executed = true;
    }

    function withdrawEther() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {}

    fallback() external payable {}
}

/*

Fake NFT Marketplace Contract deployed address is 0x8Ef3d40464fd655914A29cCA54E66e94D27f9FB0

Current gas price: 9974891
Estimated gas: 1451104
Deployer balance:  3.921281450085921483
Deployment price:  0.000014474604229664

CryptoDevDAO contract deployed address is 0xE249687E4e846AA39d39F67f6b8EE072499eaB6f (numOfProposals)

Current gas price: 98610700097
Estimated gas: 1451092
Deployer balance:  4.120336545468940442
Deployment price:  0.143093198025155924
CryptoDevDAO contract deployed address is 0x2e8b1023A3cf54D35CE054Ed1e8051E8B5C5C1B3 (numProposals)

*/
