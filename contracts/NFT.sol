// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ERC721Enumerable.sol";
import "./Ownable.sol";

contract NFT is ERC721Enumerable, Ownable {
    using Strings for uint256;

    string public baseURI;
    string public baseExtension = ".json";
    uint256 public cost;
    uint256 public maxSupply;
    uint256 public allowMintingOn;
    uint256 public maxMintAmount = 5;
    bool public paused = false;

    mapping(address => bool) public whitelisted; // Mapa przechowująca whitelistę

    event Mint(uint256 amount, address minter);
    event Withdraw(uint256 amount, address owner);
    event Paused(bool isPaused);
    event AddedToWhitelist(address indexed user); // Event dla dodania do whitelisty

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _cost,
        uint256 _maxSupply,
        uint256 _allowMintingOn,
        string memory _baseURI
    ) ERC721(_name, _symbol) {
        cost = _cost;
        maxSupply = _maxSupply;
        allowMintingOn = _allowMintingOn;
        baseURI = _baseURI;
    }

    // Funkcja mintowania tokenów
    function mint(uint256 _mintAmount) public payable {
        require(!paused, "Minting is paused");
        require(block.timestamp >= allowMintingOn, "Minting not allowed yet");
        require(_mintAmount > 0, "Mint amount must be greater than 0");
        require(_mintAmount <= maxMintAmount, "Exceeds max mint amount per transaction");
        require(msg.value >= cost * _mintAmount, "Not enough ether to mint");
        require(whitelisted[msg.sender], "User is not whitelisted"); // Sprawdzamy, czy użytkownik jest na whitelistcie

        uint256 supply = totalSupply();
        require(supply + _mintAmount <= maxSupply, "Not enough tokens left to mint");

        for (uint256 i = 1; i <= _mintAmount; i++) {
            _safeMint(msg.sender, supply + i);
        }

        emit Mint(_mintAmount, msg.sender);
    }

    // Funkcja dodająca użytkownika do whitelisty (tylko właściciel)
    function addToWhitelist(address _user) public onlyOwner {
        whitelisted[_user] = true;
        emit AddedToWhitelist(_user); // Emitowanie eventu
    }

    // Funkcja zwracająca IPFS URI tokena
    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(_exists(_tokenId), "Token does not exist");
        return string(abi.encodePacked(baseURI, _tokenId.toString(), baseExtension));
    }

    function walletOfOwner(address _owner) public view returns (uint256[] memory) {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        for (uint256 i; i < ownerTokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokenIds;
    }

    // Funkcja do wypłacania środków przez właściciela kontraktu
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;

        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Withdraw failed");

        emit Withdraw(balance, msg.sender);
    }

    // Funkcja do ustawienia nowego kosztu mintowania
    function setCost(uint256 _newCost) public onlyOwner {
        cost = _newCost;
    }

    // Właściciel może ustawić maksymalną liczbę tokenów do mintowania w jednej transakcji
    function setMaxMintAmount(uint256 _newMaxMintAmount) public onlyOwner {
        maxMintAmount = _newMaxMintAmount;
    }

    // Funkcja wstrzymująca lub wznawiająca mintowanie, tylko dla właściciela
    function setPaused(bool _state) public onlyOwner {
        paused = _state;
        emit Paused(_state);
    }
}
