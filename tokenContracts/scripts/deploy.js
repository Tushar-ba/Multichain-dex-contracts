const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy the contract
    const TokenMintingContract = await ethers.getContractFactory("TokenMintingContract");
    const tokenMintingContract = await TokenMintingContract.deploy("DOGE", "DOGE");

    // This waits for the deployment transaction to be mined (1 confirmation)
    await tokenMintingContract.waitForDeployment();
    const contractAddress = await tokenMintingContract.getAddress();
    console.log(`Contract deployed to: ${contractAddress}`);

    // ✅ 2. Wait for 5 block confirmations
    // This is the crucial step for reliable verification
    console.log("Waiting for 5 block confirmations...");
    const tx = tokenMintingContract.deploymentTransaction();
    if(tx) {
        await tx.wait(5);
    }
    console.log("Confirmed!");

    // 3. Verify the contract
    console.log("Verifying TokenMintingContract...");
    try {
        await hre.run("verify:verify", {
            address: contractAddress,
            constructorArguments: ["DOGE", "DOGE"],
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

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});