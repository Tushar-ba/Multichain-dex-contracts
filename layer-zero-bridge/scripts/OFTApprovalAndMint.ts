import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const CustomStablecoinOFT = await ethers.getContractAt("CustomStablecoinOFT", "0x0a44Dc381949F6128Ca0615B4c68F0D15818dE74");
    const amount = ethers.utils.parseUnits("10000000",18);
    const address = "0x49f51e3C94B459677c3B1e611DB3E44d4E6b1D55"
    const mint = await CustomStablecoinOFT.mint(address, amount);
    await mint.wait();
    const mintToRouter = await CustomStablecoinOFT.mint("0xC411824F1695feeC0f9b8C3d4810c2FD1AB1000a", amount);
    await mintToRouter.wait();
    console.log("Minted");
    const CrossChainRouter  = "0xC411824F1695feeC0f9b8C3d4810c2FD1AB1000a"
    const Router = "0x1F2Ea7012Be2Fb0Ba2ce8B7B2A1ab3357Ab2315d"    
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