const { ethers, upgrades } = require("hardhat");
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // const token = await ethers.deployContract("Test");
  const Token1 = await ethers.getContractFactory("Test1");
  const token1 = await upgrades.deployProxy(
    Token1,
    [],
    {
      initializer: "initialize",
    },
    { kind: "uups" }
  );
  await token1.waitForDeployment();
  console.log("token1 deployed at", await token1.getAddress());
  // console.log("Token address:", await token.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
