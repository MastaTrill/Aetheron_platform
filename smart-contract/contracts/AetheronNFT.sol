// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract AetheronNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    uint256 public constant MINT_PRICE = 0.05 ether;
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MAX_PER_MINT = 5;

    string public baseURI;
    string public baseExtension;

    mapping(uint256 => address) public tokenApprovals;
    mapping(address => uint256) public mintCount;

    event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    event BaseURIUpdated(string newBaseURI);

    constructor(
        string memory name,
        string memory symbol,
        string memory initialBaseURI
    ) ERC721(name, symbol) Ownable() {
        baseURI = initialBaseURI;
        baseExtension = ".json";
    }

    function _burn(uint256 tokenId) internal virtual override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function mint(string memory tokenURI) public payable returns (uint256) {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        require(_tokenIdCounter.current() < MAX_SUPPLY, "Max supply reached");
        require(mintCount[msg.sender] < MAX_PER_MINT, "Max per mint reached");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        mintCount[msg.sender]++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit NFTMinted(msg.sender, tokenId, tokenURI);

        return tokenId;
    }

    function mintBatch(string[] memory tokenURIs) public payable returns (uint256[] memory) {
        uint256 count = tokenURIs.length;
        require(count > 0 && count <= MAX_PER_MINT, "Invalid batch size");
        require(mintCount[msg.sender] + count <= MAX_PER_MINT, "Exceeds max per mint");
        require(msg.value >= MINT_PRICE * count, "Insufficient payment");
        require(_tokenIdCounter.current() + count <= MAX_SUPPLY, "Exceeds max supply");

        uint256[] memory tokenIds = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();

            _safeMint(msg.sender, tokenId);
            _setTokenURI(tokenId, tokenURIs[i]);

            tokenIds[i] = tokenId;
            mintCount[msg.sender]++;

            emit NFTMinted(msg.sender, tokenId, tokenURIs[i]);
        }

        return tokenIds;
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function setBaseURI(string memory newBaseURI) public onlyOwner {
        baseURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
