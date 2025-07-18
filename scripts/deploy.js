const hre = require("hardhat");
const { parseEther } = require("ethers");

async function main() {
  const [deployer, seller, buyer, buyerSolicitor] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Deploy PropertyToken
  const PropertyToken = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken = await PropertyToken.deploy();
  await propertyToken.waitForDeployment();
  const tokenAddress = await propertyToken.getAddress();
  console.log("✅ PropertyToken deployed to:", tokenAddress);

  // Mint one example property
  const metadataURI = "https://gateway.pinata.cloud/ipfs/bafkreihk6tv3simozz75skonopl5hv2hygz5daytwccp6yrnmpwzyt7qja";
  const tx = await propertyToken.mint(seller.address, metadataURI);
  await tx.wait();
  console.log("✅ Minted 1 property to:", seller.address);

  // Deploy PropertyEscrow
  const priceInWei = parseEther("1");
  const tokenId = 0;

  const PropertyEscrow = await hre.ethers.getContractFactory("PropertyEscrow");
  const escrow = await PropertyEscrow.deploy(
    buyer.address,
    buyerSolicitor.address,
    seller.address,
    priceInWei,
    tokenAddress,
    tokenId
  );
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("✅ Escrow contract deployed to:", escrowAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
