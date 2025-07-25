import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const CustomStablecoinOFT = await ethers.getContractAt("CustomStablecoinOFT", "0x2520342A8e02D4782dCe3Db0e579Fff965D873C2");
    const amount = ethers.utils.parseUnits("10000000",18);
    const CrossChainRouter  = "0x8C17e97049D74d9AB75BB966ef045f83c52D0b27"
    const Router = "0xC5e1362cC4768A10331f77DDe46572f54802e142"    
    const tx = await CustomStablecoinOFT.approve(CrossChainRouter, amount);
    console.log("Approved CrossChainRouter");
    const tx3 = await CustomStablecoinOFT.approve(Router, amount);
    await tx.wait();
    await tx3.wait();
    console.log("Approved Router");
    const addRouter = await CustomStablecoinOFT.addMinter(CrossChainRouter);
    await addRouter.wait();
    console.log("Added CrossChainRouter as minter");

    const tx2 = await CustomStablecoinOFT.mint(deployer.address, amount);
    await tx2.wait();
    console.log("Minted");

    const balance = await CustomStablecoinOFT.balanceOf(deployer.address);
    console.log("Balance:", balance);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});