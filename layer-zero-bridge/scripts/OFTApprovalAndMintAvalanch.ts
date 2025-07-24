import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const CustomStablecoinOFT = await ethers.getContractAt("CustomStablecoinOFT", "0xe8769Bef685d789C0d74884fBEc46FC7ee734EeA");
    const amount = ethers.utils.parseUnits("1000000000",18);
    const CrossChainRouter  = "0x130196E5410A83Ca32208bca8f10a347786BF3e7"
    const Router = "0x011b561002A1D2522210BA3d687131AB1F6AcF79"    
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