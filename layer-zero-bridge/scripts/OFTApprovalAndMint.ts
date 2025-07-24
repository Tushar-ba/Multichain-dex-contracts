import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const CustomStablecoinOFT = await ethers.getContractAt("CustomStablecoinOFT", "0xBE4fFD224eB2Cc79F99476b964EA5495144A9E44");
    const amount = ethers.utils.parseUnits("10000000",18);
    const CrossChainRouter  = "0xbA4f94927E467cE3Feca8eDc6A5196B4C93cf825"
    const Router = "0xA9a558fB3269F307eE57270b41fcBaFFC56d5290"    
    const tx = await CustomStablecoinOFT.approve(CrossChainRouter, amount);
    console.log("Approved CrossChainRouter");
    const tx3 = await CustomStablecoinOFT.approve(Router, amount);
    await tx.wait();
    await tx3.wait();
    console.log("Approved Router");

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