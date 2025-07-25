import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const CustomStablecoinOFT = await ethers.getContractAt("CustomStablecoinOFT", "0x8ffFA9c480FF1092bAd184154b37BCfA4a801829");
    const amount = ethers.utils.parseUnits("1000000000",18);
    const CrossChainRouter  = "0x83dce164A8d1b8b8d70d0b99b7Aa7b22c4EABb40"
    const Router = "0x011b561002A1D2522210BA3d687131AB1F6AcF79"    
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