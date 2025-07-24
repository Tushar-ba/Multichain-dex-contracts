const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const TokenMintingContract = await ethers.getContractFactory("TokenMintingContract");
    const tokenMintingContract = await TokenMintingContract.deploy("DOGE", "DOGE");
    await tokenMintingContract.waitForDeployment();    

    console.log("Verify TokenMintingContract");
    await hre.run("verify:verify", {
        address: await tokenMintingContract.getAddress(),
        constructorArguments: ["TRUMP", "TRUMP"],
    });

    console.log("Tokens deployed to:", await tokenMintingContract.getAddress());
    
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});