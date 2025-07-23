const { ethers, run, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy the contract
  const payfundsFactory = await ethers.deployContract("PayfundsFactory", [
    deployer.address,
  ]);
  await payfundsFactory.waitForDeployment();
  const factoryAddress = await payfundsFactory.getAddress();

  console.log("Factory contract address:", factoryAddress);

  // Wait for a few block confirmations before verifying
  console.log("Waiting for block confirmations...");
  // You may need to adjust the number of confirmations based on the network
  // For local networks, this step can be skipped
  if (network.config.chainId !== 31337) { // 31337 is the chainId for hardhat network
      await payfundsFactory.deploymentTransaction().wait(6);
  }


  // Verify the contract
  console.log("Verifying contract on Etherscan...");
  try {
    await run("verify:verify", {
      address: factoryAddress,
      constructorArguments: [deployer.address],
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("Contract is already verified!");
    } else {
      console.error(error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });