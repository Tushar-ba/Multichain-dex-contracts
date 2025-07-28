import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const CustomStablecoinOFT = await ethers.getContractAt("CustomStablecoinOFT", "0x4d7c436e23ce51c42A9d6587B5812673f2dC756C");
    const amount = ethers.utils.parseUnits("10000000",18);
    const address = "0x49f51e3C94B459677c3B1e611DB3E44d4E6b1D55"
    const mint = await CustomStablecoinOFT.mint(address, amount);
    await mint.wait();
    console.log("Minted");
    const CrossChainRouter  = "0x3997e41F60643491b9a26666eD4668303D7fDF4b"
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