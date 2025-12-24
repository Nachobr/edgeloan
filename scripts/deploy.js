const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy Mock USDC
  const MockUSDC = await hre.ethers.getContractFactory("MockToken");
  const usdc = await MockUSDC.deploy("USD Coin", "USDC");
  await usdc.deployed();
  console.log("MockUSDC deployed to:", usdc.address);

  // 2. Deploy Lending Contract
  // Constructor: (address _token, address _feeRecipient)
  const EdgeLend = await hre.ethers.getContractFactory("CollateralLoan");
  const edgeLend = await EdgeLend.deploy(usdc.address, deployer.address);
  await edgeLend.deployed();

  console.log("CollateralLoan deployed to:", edgeLend.address);
  
  // 3. Fund Contract with USDC liquidity (for the MVP to work)
  // Mint 1,000,000 USDC to the contract so it can lend out money
  const mintTx = await usdc.mint(edgeLend.address, hre.ethers.utils.parseUnits("1000000", 6));
  await mintTx.wait();
  console.log("Funded CollateralLoan with 1M USDC liquidity");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });