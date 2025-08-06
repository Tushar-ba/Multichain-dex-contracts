const { ethers } = require("hardhat");


async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    const routerAddress = "0x1F2Ea7012Be2Fb0Ba2ce8B7B2A1ab3357Ab2315d";
    const tokenA = "0x0a44Dc381949F6128Ca0615B4c68F0D15818dE74";
    const tokenB = "0x31a210d4BaD0D1f1a7d96acfD637E082B854ADE8";

    const router = await ethers.getContractAt("PayfundsRouter02", routerAddress);
    const amountInA = ethers.parseUnits("200000000", 18);
    const amountInB = ethers.parseUnits("200000000", 18);
    const amountAMin = ethers.parseUnits("200000000", 18);
    const amountBMin = ethers.parseUnits("200000000", 18);
    const to = "0x49f51e3C94B459677c3B1e611DB3E44d4E6b1D55";
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    
    const tx = await router.addLiquidity(tokenA, tokenB, amountInA ,amountInB, amountAMin, amountBMin, to, deadline);
    await tx.wait();
    console.log("Liquidity added");

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
