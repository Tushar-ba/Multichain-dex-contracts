import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const CustomStablecoinOFT = await ethers.getContractAt("CustomStablecoinOFT", "0x0d2f518e859cC3C2E6B93118312Dd240507A91F6");
    const amount = ethers.utils.parseUnits("10000000",18);
     const address = "0x49f51e3C94B459677c3B1e611DB3E44d4E6b1D55"
    const mint = await CustomStablecoinOFT.mint(address, amount);
    await mint.wait();
    console.log("Minted");
    const CrossChainRouter  = "0x17FcF7d721C3c9Ab30d5AE2706c3562E7B01eA27"
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