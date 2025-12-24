require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 1337
    },
    // Add Sepolia or Goerli here if you have keys
    // sepolia: {
    //   url: "https://sepolia.infura.io/v3/YOUR_KEY",
    //   accounts: ["YOUR_PRIVATE_KEY"]
    // }
  }
};