require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.9", // Wersja, którą już masz w projekcie
      },
      {
        version: "0.8.20", // Dodaj wersję wymaganą przez OpenZeppelin
      }
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
};

