const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyNFT", function () {
  let nftContract, owner, addr1, addr2;

  beforeEach(async function () {
    // Pobierz kontrakt i podpisy
    const NFT = await ethers.getContractFactory("MyNFT");
    [owner, addr1, addr2] = await ethers.getSigners();

    // Wdróż kontrakt
    nftContract = await NFT.deploy();
    await nftContract.deployed();
  });

  it("Should deploy with the correct name and symbol", async function () {
    // Sprawdź nazwę i symbol kontraktu
    expect(await nftContract.name()).to.equal("MyUniqueNFT");
    expect(await nftContract.symbol()).to.equal("MUN");
  });

  it("Should allow owner to mint NFTs", async function () {
    // Właściciel kontraktu tworzy NFT dla addr1
    await nftContract.createNFT(addr1.address);
    
    // Sprawdź właściciela tokena o ID 0
    expect(await nftContract.ownerOf(0)).to.equal(addr1.address);
    
    // Sprawdź, czy licznik tokenów został zaktualizowany
    expect(await nftContract.tokenCounter()).to.equal(1);
  });

  it("Should not allow non-owner to mint NFTs", async function () {
    // Upewnij się, że osoba niebędąca właścicielem nie może mintować NFT
    await expect(nftContract.connect(addr1).createNFT(addr1.address)).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should allow approved or owner to burn NFT", async function () {
    // Właściciel kontraktu tworzy NFT dla addr1
    await nftContract.createNFT(addr1.address);
    
    // Sprawdź właściciela tokena
    expect(await nftContract.ownerOf(0)).to.equal(addr1.address);
  
    // Spal token o ID 0 (bez zatwierdzania właściciela)
    await nftContract.connect(addr1).burnNFT(0);
    
    // Upewnij się, że token został spalony (spodziewamy się błędu, ponieważ token nie istnieje)
    await expect(nftContract.ownerOf(0)).to.be.revertedWith("ERC721: invalid token ID");
  });
  

  it("Should prevent non-owners or unapproved from burning NFTs", async function () {
    // Właściciel kontraktu tworzy NFT dla addr1
    await nftContract.createNFT(addr1.address);
    
    // Upewnij się, że addr2 nie może spalić tokena o ID 0
    await expect(nftContract.connect(addr2).burnNFT(0)).to.be.revertedWith("You are not the owner or approved to burn this token.");
  });

  it("Should correctly increment tokenCounter after minting", async function () {
    // Stwórz dwa NFT
    await nftContract.createNFT(addr1.address);
    await nftContract.createNFT(addr2.address);

    // Sprawdź, czy licznik tokenów wynosi 2
    expect(await nftContract.tokenCounter()).to.equal(2);
  });

  it("Should emit Transfer event when minting and burning", async function () {
    // Sprawdź, czy emisja eventu Transfer następuje po mintowaniu
    await expect(nftContract.createNFT(addr1.address))
      .to.emit(nftContract, "Transfer")
      .withArgs(ethers.constants.AddressZero, addr1.address, 0);

    // Spal token o ID 0 (bez zatwierdzania właściciela)
    await expect(nftContract.connect(addr1).burnNFT(0))
      .to.emit(nftContract, "Transfer")
      .withArgs(addr1.address, ethers.constants.AddressZero, 0);
  });
});
