// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const NAME = 'Dapp Punks';
  const SYMBOL = 'DP';
  const COST = hre.ethers.utils.parseUnits('10', 'ether');
  const MAX_SUPPLY = 25;
  const NFT_MINT_DATE = (Date.now() + 60000).toString().slice(0, 10); // Mint date 60 seconds from now
  const IPFS_METADATA_URI = 'ipfs://QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/';

  console.log("NFT Mint Date (Unix Timestamp):", NFT_MINT_DATE);
  console.log("Minting cost (in wei):", COST.toString());

  // Deploy NFT
  const NFT = await hre.ethers.getContractFactory('NFT');
  let nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, NFT_MINT_DATE, IPFS_METADATA_URI);

  await nft.deployed();
  console.log('nft =', nft)
  console.log(`NFT deployed to: ${nft.address}\n`);
  console.log("Minting cost:", COST.toString());
  console.log("Max Supply:", MAX_SUPPLY);
  console.log("Minting date (Unix timestamp):", NFT_MINT_DATE);
  // Test: Fetch the max supply
  const maxSupply = await nft.maxSupply();
  console.log("Max Supply from contract:", maxSupply.toString());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});