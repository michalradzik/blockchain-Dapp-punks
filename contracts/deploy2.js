
const hre = require("hardhat");

async function main() {
  console.log("Deploying MyNFT contract...");

  // We get the contract to deploy
  const NFT = await hre.ethers.getContractFactory("MyNFT");
  const nft = await NFT.deploy();

  await nft.deployed();

  console.log(`MyNFT deployed to: ${nft.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
