const { ethers } = require("hardhat");
const { NFT_CONTRACT_ADDRESS } = require("../constants");

const main = async () => {
  const fakeNFTMarketplaceContract = await ethers.getContractFactory(
    "FakeNFTMarketplace"
  );
  const deployedFakeNFTMarketplaceContract =
    await fakeNFTMarketplaceContract.deploy();
  await deployedFakeNFTMarketplaceContract.deployed();
  console.log(
    "Fake NFT Marketplace Contract deployed address is",
    deployedFakeNFTMarketplaceContract.address
  );

  const contract = await ethers.getContractFactory("CryptoDevsDAO");

  /* ############ START => Additional Deployement Steps (Optional) ######################## */
  {
    const gasPrice = await contract.signer.getGasPrice();
    console.log(`Current gas price: ${gasPrice}`);
    const estimatedGas = await contract.signer.estimateGas(
      contract.getDeployTransaction(
        NFT_CONTRACT_ADDRESS,
        deployedFakeNFTMarketplaceContract.address,
        {
          value: ethers.utils.parseEther("0.00001"),
        }
      ) //need to change based upon contract's constructor
    );
    console.log(`Estimated gas: ${estimatedGas}`);
    const deploymentPrice = gasPrice.mul(estimatedGas);
    const deployerBalance = await contract.signer.getBalance();
    console.log(
      `Deployer balance:  ${ethers.utils.formatEther(deployerBalance)}`
    );
    console.log(
      `Deployment price:  ${ethers.utils.formatEther(deploymentPrice)}`
    );
    if (Number(deployerBalance) < Number(deploymentPrice)) {
      throw new Error("You dont have enough balance to deploy.");
    }
  }
  /* ############ END   => Additional Deployement Steps (Optional) ######################## */

  const deployedContract = await contract.deploy(
    NFT_CONTRACT_ADDRESS,
    deployedFakeNFTMarketplaceContract.address,
    {
      value: ethers.utils.parseEther("0.00001"),
    }
  );
  await deployedContract.deployed();
  console.log(
    "CryptoDevDAO contract deployed address is",
    deployedContract.address
  );
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
