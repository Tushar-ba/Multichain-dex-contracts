import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const CustomStablecoinOFT = await ethers.getContractAt("CustomStablecoinOFT", "0x53CDBE278328314F6208776cBF7Da0a0C2c6Feea");
    const amount = ethers.utils.parseUnits("100000000",18);
     const address = "0x49f51e3C94B459677c3B1e611DB3E44d4E6b1D55"
    const mint = await CustomStablecoinOFT.mint(address, amount);
    await mint.wait();
     const mintToRouter = await CustomStablecoinOFT.mint("0x9480AbA0DFe3bfC6080D279781afD4B1fFcfb8d8", amount);
    await mintToRouter.wait();
    console.log("Minted");
    const CrossChainRouter  = "0x9480AbA0DFe3bfC6080D279781afD4B1fFcfb8d8";
    const Router = "0x011b561002A1D2522210BA3d687131AB1F6AcF79";
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