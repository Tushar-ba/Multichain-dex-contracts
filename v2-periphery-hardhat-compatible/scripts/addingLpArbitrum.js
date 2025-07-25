const { ethers } = require("hardhat");


async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    const arbitrumRouter = "0x011b561002A1D2522210BA3d687131AB1F6AcF79";
    const tokenA = "0x1963f6163D9eaFCb1aF6DB7207b21E8aD6548751";
    const tokenB = "0x5025D762AA65e578115614C6B04c819C987673a8";
    
    const router = await ethers.getContractAt("PayfundsRouter02", arbitrumRouter);
    const amountInA = ethers.parseUnits("2000", 18);
    const amountInB = ethers.parseUnits("2000", 18);
    const amountAMin = ethers.parseUnits("2000", 18);
    const amountBMin = ethers.parseUnits("2000", 18);
    const to = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    
    const tx = await router.addLiquidity(tokenA, tokenB, amountInA ,amountInB, amountAMin, amountBMin, to, deadline);
    await tx.wait();
    console.log("Liquidity added");

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
