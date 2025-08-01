import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();

  const token = await ethers.getContractAt("CustomStableCoin", "0x0F6eC6D1A81915ba6538b129b2E3a6E46b1c501f");
  const crossChainRouter = "0xa9d663860157B2bACB6849aed2f4b71329410D10";
  const router = "0x011b561002A1D2522210BA3d687131AB1F6AcF79"

  const amount = ethers.parseUnits("100000000", 18);
  const tx3 = await token.mint(owner.address, amount);
  await tx3.wait();
  console.log(`Minted ${amount} tokens to ${owner.address}`);
  const tx4 = await token.mint(crossChainRouter, amount);
  await tx4.wait();
  console.log(`Minted ${amount} tokens to ${crossChainRouter}`);

  const tx = await token.connect(owner).approve(crossChainRouter, amount);
  const tx2 = await token.connect(owner).approve(router, amount);
  await tx.wait();
  await tx2.wait();
  console.log(`Approved ${amount} tokens for ${router} by ${owner.address}`);
  console.log(`Approved ${amount} tokens for ${crossChainRouter} by ${owner.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});