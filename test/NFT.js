const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether');
};

const ether = tokens;

describe('NFT', () => {
  const NAME = 'Dapp Punks';
  const SYMBOL = 'DP';
  const COST = ether(10);
  const MAX_SUPPLY = 25;
  const MAX_MINT_AMOUNT = 5;
  const BASE_URI = 'ipfs://QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/';

  let nft, deployer, minter;

  beforeEach(async () => {
    let accounts = await ethers.getSigners();
    deployer = accounts[0];
    minter = accounts[1];
  });

  describe('Deployment', () => {
    const ALLOW_MINTING_ON = (Date.now() + 120000).toString().slice(0, 10); // 2 minutes from now

    beforeEach(async () => {
      const NFT = await ethers.getContractFactory('NFT');
      nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);

      // Add minter to whitelist before minting
      await nft.connect(deployer).addToWhitelist(minter.address);
    });

    it('has correct name', async () => {
      expect(await nft.name()).to.equal(NAME);
    });

    it('has correct symbol', async () => {
      expect(await nft.symbol()).to.equal(SYMBOL);
    });

    it('returns the cost to mint', async () => {
      expect(await nft.cost()).to.equal(COST);
    });

    it('returns the maximum total supply', async () => {
      expect(await nft.maxSupply()).to.equal(MAX_SUPPLY);
    });

    it('returns the allowed minting time', async () => {
      expect(await nft.allowMintingOn()).to.equal(ALLOW_MINTING_ON);
    });

    it('returns the base URI', async () => {
      expect(await nft.baseURI()).to.equal(BASE_URI);
    });

    it('returns the owner', async () => {
      expect(await nft.owner()).to.equal(deployer.address);
    });
  });

  describe('Minting', () => {
    let transaction, result;

    describe('Success', async () => {
      const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10); // Now

      beforeEach(async () => {
        const NFT = await ethers.getContractFactory('NFT');
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);

        // Add minter to whitelist before minting
        await nft.connect(deployer).addToWhitelist(minter.address);
      });

      it('allows minting multiple NFTs successfully', async () => {
        // Mint 3 NFTs
        transaction = await nft.connect(minter).mint(3, { value: COST.mul(3) });
        result = await transaction.wait();

        expect(await nft.balanceOf(minter.address)).to.equal(3);

        const tokenIds = await nft.walletOfOwner(minter.address);
        expect(tokenIds.length).to.equal(3);
        expect(tokenIds[0].toString()).to.equal('1');
        expect(tokenIds[1].toString()).to.equal('2');
        expect(tokenIds[2].toString()).to.equal('3');
      });

      it('returns the address of the minter', async () => {
        transaction = await nft.connect(minter).mint(1, { value: COST });
        result = await transaction.wait();

        expect(await nft.ownerOf(1)).to.equal(minter.address);
      });

      it('returns total number of tokens the minter owns', async () => {
        transaction = await nft.connect(minter).mint(1, { value: COST });
        result = await transaction.wait();

        expect(await nft.balanceOf(minter.address)).to.equal(1);
      });

      it('returns IPFS URI', async () => {
        transaction = await nft.connect(minter).mint(1, { value: COST });
        result = await transaction.wait();

        expect(await nft.tokenURI(1)).to.equal(`${BASE_URI}1.json`);
      });

      it('updates the total supply', async () => {
        transaction = await nft.connect(minter).mint(1, { value: COST });
        result = await transaction.wait();

        expect(await nft.totalSupply()).to.equal(1);
      });

      it('updates the contract ether balance', async () => {
        transaction = await nft.connect(minter).mint(1, { value: COST });
        result = await transaction.wait();

        expect(await ethers.provider.getBalance(nft.address)).to.equal(COST);
      });

      it('emits Mint event', async () => {
        transaction = await nft.connect(minter).mint(1, { value: COST });
        result = await transaction.wait();

        await expect(transaction).to.emit(nft, 'Mint').withArgs(1, minter.address);
      });
    });

    describe('Failure', async () => {
      it('rejects insufficient payment', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10); // Now
        const NFT = await ethers.getContractFactory('NFT');
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);

        await nft.connect(deployer).addToWhitelist(minter.address);

        await expect(nft.connect(minter).mint(1, { value: ether(1) })).to.be.revertedWith('Not enough ether to mint');
      });

      it('requires at least 1 NFT to be minted', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10); // Now
        const NFT = await ethers.getContractFactory('NFT');
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);

        await nft.connect(deployer).addToWhitelist(minter.address);

        await expect(nft.connect(minter).mint(0, { value: COST })).to.be.revertedWith('Mint amount must be greater than 0');
      });

      it('rejects minting before allowed time', async () => {
        const ALLOW_MINTING_ON = new Date('May 26, 2030 18:00:00').getTime().toString().slice(0, 10);
        const NFT = await ethers.getContractFactory('NFT');
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);

        await nft.connect(deployer).addToWhitelist(minter.address);

        await expect(nft.connect(minter).mint(1, { value: COST })).to.be.revertedWith('Minting not allowed yet');
      });

      it('does not allow more NFTs to be minted than max mint amount', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10); // Now
        const NFT = await ethers.getContractFactory('NFT');
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);

        await nft.connect(deployer).addToWhitelist(minter.address);

        await expect(nft.connect(minter).mint(6, { value: COST.mul(6) })).to.be.revertedWith('Exceeds max mint amount per transaction');
      });

      it('does not return URIs for invalid tokens', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10); // Now
        const NFT = await ethers.getContractFactory('NFT');
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);

        await nft.connect(deployer).addToWhitelist(minter.address);

        nft.connect(minter).mint(1, { value: COST });

        await expect(nft.tokenURI(99)).to.be.revertedWith('Token does not exist');
      });
    });
  });

  describe('Displaying NFTs', () => {
    let transaction, result;

    const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10); // Now

    beforeEach(async () => {
      const NFT = await ethers.getContractFactory('NFT');
      nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);

      await nft.connect(deployer).addToWhitelist(minter.address);

      transaction = await nft.connect(minter).mint(3, { value: ether(30) });
      result = await transaction.wait();
    });

    it('returns all the NFTs for a given owner', async () => {
      let tokenIds = await nft.walletOfOwner(minter.address);
      expect(tokenIds.length).to.equal(3);
      expect(tokenIds[0].toString()).to.equal('1');
      expect(tokenIds[1].toString()).to.equal('2');
      expect(tokenIds[2].toString()).to.equal('3');
    });
  });

  describe('Withdrawals', () => {
    describe('Success', async () => {
      let transaction, result, balanceBefore;

      const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10); // Now

      beforeEach(async () => {
        const NFT = await ethers.getContractFactory('NFT');
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);

        await nft.connect(deployer).addToWhitelist(minter.address);

        transaction = await nft.connect(minter).mint(1, { value: COST });
        result = await transaction.wait();

        balanceBefore = await ethers.provider.getBalance(deployer.address);

        transaction = await nft.connect(deployer).withdraw();
        result = await transaction.wait();
      });

      it('deducts contract balance', async () => {
        expect(await ethers.provider.getBalance(nft.address)).to.equal(0);
      });

      it('sends funds to the owner', async () => {
        expect(await ethers.provider.getBalance(deployer.address)).to.be.greaterThan(balanceBefore);
      });

      it('emits a withdraw event', async () => {
        await expect(transaction).to.emit(nft, 'Withdraw').withArgs(COST, deployer.address);
      });
    });

    describe('Failure', async () => {
      it('prevents non-owner from withdrawing', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10); // Now
        const NFT = await ethers.getContractFactory('NFT');
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);

        await nft.connect(deployer).addToWhitelist(minter.address);

        await nft.connect(minter).mint(1, { value: COST });

        await expect(nft.connect(minter).withdraw()).to.be.revertedWith('Ownable: caller is not the owner');
      });
    });
  });

  // Pausing Minting tests
  describe('Pausing Minting', () => {
    beforeEach(async () => {
      const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10); // Now
      const NFT = await ethers.getContractFactory('NFT');
      nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);

      await nft.connect(deployer).addToWhitelist(minter.address);
    });

    it('allows owner to pause minting', async () => {
      await nft.connect(deployer).setPaused(true);
      expect(await nft.paused()).to.equal(true);
    });

    it('allows owner to unpause minting', async () => {
      await nft.connect(deployer).setPaused(true);
      await nft.connect(deployer).setPaused(false);
      expect(await nft.paused()).to.equal(false);
    });

    it('prevents minting while paused', async () => {
      await nft.connect(deployer).setPaused(true);
      await expect(nft.connect(minter).mint(1, { value: COST })).to.be.revertedWith('Minting is paused');
    });

    it('allows minting when unpaused', async () => {
      await nft.connect(deployer).setPaused(true);
      await nft.connect(deployer).setPaused(false);

      const transaction = await nft.connect(minter).mint(1, { value: COST });
      const result = await transaction.wait();

      expect(await nft.ownerOf(1)).to.equal(minter.address);
    });

    it('does not allow non-owner to pause minting', async () => {
      await expect(nft.connect(minter).setPaused(true)).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  // Adding Whitelist tests
  describe('Whitelist Minting', () => {
    beforeEach(async () => {
      const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10); // Now
      const NFT = await ethers.getContractFactory('NFT');
      nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);
    });

    it('allows only whitelisted users to mint', async () => {
      await nft.connect(deployer).addToWhitelist(minter.address);

      await nft.connect(minter).mint(1, { value: COST });

      expect(await nft.balanceOf(minter.address)).to.equal(1);
    });

    it('prevents non-whitelisted users from minting', async () => {
      await expect(nft.connect(minter).mint(1, { value: COST })).to.be.revertedWith('User is not whitelisted');
    });
  });
});
