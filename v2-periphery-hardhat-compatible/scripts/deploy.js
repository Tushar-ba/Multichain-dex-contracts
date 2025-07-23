const { ethers, run } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // --- 1. Deploy WMATIC and get its address ---
  const WMATIC = await ethers.deployContract("WMATIC");
  await WMATIC.waitForDeployment();
  const wmaticAddress = await WMATIC.getAddress(); // Await and store address
  console.log("WETH contract address:", wmaticAddress);
  
  // The address of your deployed factory contract
  const PayfundsFactory = "0xA4F64f7d0E9a75B014a856FFd2c58c36869F4671";

  // --- 2. Deploy the Router using the stored address variable ---
  const PayfundsRouter02 = await ethers.deployContract("PayfundsRouter02", [
    PayfundsFactory,
    wmaticAddress, // Use the variable here
  ]);
  await PayfundsRouter02.waitForDeployment();
  const routerAddress = await PayfundsRouter02.getAddress(); // Await and store address
  console.log("Router contract address:", routerAddress);

  // --- 3. Wait for block confirmations before verifying ---
  console.log("Waiting for block confirmations...");
  const deploymentTx = PayfundsRouter02.deploymentTransaction();
  if (deploymentTx) {
    await deploymentTx.wait(6); // Recommended wait time
  }

  // --- 4. Verify the contract using the stored address variables ---
  console.log("Verifying contract on Etherscan...");
  try {
    await run("verify:verify", {
      address: routerAddress, // Use the variable here
      constructorArguments: [
        PayfundsFactory,
        wmaticAddress, // Use the variable here
      ],
    });
    console.log("✅ Contract verified successfully!");
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("Verification failed:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });