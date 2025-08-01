const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    const token = await ethers.getContractAt("TokenMintingContract", "0x1963f6163D9eaFCb1aF6DB7207b21E8aD6548751");
    const CrossRouter = "0x9F577e8A1be3ec65BE0fb139425988dfE438196e";
    const Router = "0x011b561002A1D2522210BA3d687131AB1F6AcF79"
    const amount = ethers.parseUnits("1000000000000000000", 18);
    const address = "0x49f51e3C94B459677c3B1e611DB3E44d4E6b1D55";
    const tx3 = await token.mint(address, amount);
    await tx3.wait();
    console.log("Minted");
    const tx = await token.approve(Router, amount);
    const tx2 = await token.approve(CrossRouter, amount);
    await tx.wait();
    await tx2.wait();
    console.log("Approval successful");
    const balance = await token.balanceOf(deployer.address);
    console.log("Balance:", balance);
    const isApproved = await token.allowance(deployer.address, Router);
    console.log("Is approved:", isApproved);
    const isApproved2 = await token.allowance(deployer.address, CrossRouter);
    console.log("Is approved2:", isApproved2);
    const isApproved3 = await token.allowance(deployer.address, Router);
    console.log("Is approved3:", isApproved3);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});