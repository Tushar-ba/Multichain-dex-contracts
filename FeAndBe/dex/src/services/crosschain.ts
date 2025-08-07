import { ethers } from 'ethers'
import CrossChainRouterABI from '@/app/ABI/CrossChainRouter.json'

// LayerZero Endpoint IDs for testnets
const LAYER_ZERO_EIDS: { [key: number]: number } = {
  11155111: 40161, // Ethereum Sepolia
  80002: 40267,    // Polygon Amoy
  421614: 40231,   // Arbitrum Sepolia
  11155420: 40232, // Optimism Sepolia
  43113: 40106,    // Avalanche Fuji
  97: 40102,       // BSC Testnet
  84532: 40245,    // Base Sepolia
  17000: 40217,    // Holesky
}

// Cross-chain router addresses from deployment (updated from your script)
const CROSSCHAIN_ROUTER_ADDRESSES: { [key: number]: string } = {
  11155111: '0xAdf3323e9B2D26Dfc17c5309390786264Dd2D494', // Ethereum Sepolia
  80002: '0x69c475d50afa8EAd344E85326369277F88b74CC6',    // Polygon Amoy
  421614: '0x4F8FD373bb8Df6DA0461D220D1D1018AA92b9157',  // Arbitrum Sepolia
  11155420: '0x97F4FE32fF553B6f426Ee1998956164638B75a44', // Optimism Sepolia
  43113: '0x9F577e8A1be3ec65BE0fb139425988dfE438196e',   // Avalanche Fuji (updated)
  97: '0x0EBcFE9Fc5817DD541B2EAdc1e8fe92D35bc2470',     // BSC Testnet
  84532: '0x934b360A75F6AF046F421f9d386c840B4Ad45162',   // Base Sepolia
  17000: '0xC411824F1695feeC0f9b8C3d4810c2FD1AB1000a',   // Holesky (updated)
}

// DEX Router addresses for dual approvals
const DEX_ROUTER_ADDRESSES: { [key: number]: string } = {
  11155111: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Ethereum Sepolia
  80002: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',    // Polygon Amoy
  421614: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',   // Arbitrum Sepolia
  11155420: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Optimism Sepolia
  43113: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',    // Avalanche Fuji
  97: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',      // BSC Testnet
  84532: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',    // Base Sepolia
  17000: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',    // Holesky
}

// PFUSD stablecoin addresses (updated from your script)
const PFUSD_ADDRESSES: { [key: number]: string } = {
  11155111: '0xDE44975f2060d977Dd7c7B93C7d7aFec8fFcb1a2', // Ethereum Sepolia
  80002: '0x91735d81732902Cb2a80Dcffc2188592B4031226',    // Polygon Amoy
  421614: '0xCE24E5cA05FDD47D8629465978Ff887091556929',   // Arbitrum Sepolia
  11155420: '0xdFA54fa7F1f275ab103D4f0Ad65Bc2Fb239E43f9', // Optimism Sepolia
  43113: '0x55C192C8bF6749F65dE78E524273A481C4b1f667',    // Avalanche Fuji (updated)
  97: '0x2258Db39FCdAB899661fBA6a1246Cc7a0F4E9ff0',      // BSC Testnet
  84532: '0x0E4adEe6aCb907Ef3745AcB3202b8511A6FC6F52',    // Base Sepolia
  17000: '0x0a44Dc381949F6128Ca0615B4c68F0D15818dE74',    // Holesky (updated)
}

export interface CrossChainSwapParams {
  sourceChainId: number
  destinationChainId: number
  sourceToken: string
  destinationToken: string
  amountIn: string
  amountOutMin: string
  recipient: string
}

export interface SwapQuote {
  estimatedStableAmount: string
  layerZeroFee: string
  totalFeeETH: string
  estimatedTime: string
}

export class CrossChainService {
  private provider: ethers.Provider
  private signer?: ethers.Signer
  private sourceChainId: number

  constructor(provider: ethers.Provider, signer?: ethers.Signer, sourceChainId?: number) {
    this.provider = provider
    this.signer = signer
    this.sourceChainId = sourceChainId || 1
  }

  // Get CrossChain Router contract
  getCrossChainRouterContract(chainId: number, readOnly = false) {
    const routerAddress = CROSSCHAIN_ROUTER_ADDRESSES[chainId]
    if (!routerAddress) throw new Error('CrossChain router not found for this chain')

    return new ethers.Contract(
      routerAddress,
      CrossChainRouterABI,
      readOnly ? this.provider : this.signer || this.provider
    )
  }

  // Get LayerZero EID for chain
  getLayerZeroEID(chainId: number): number {
    const eid = LAYER_ZERO_EIDS[chainId]
    if (!eid) throw new Error(`LayerZero EID not found for chain ${chainId}`)
    return eid
  }

  // Get PFUSD address for chain
  getPFUSDAddress(chainId: number): string {
    const address = PFUSD_ADDRESSES[chainId]
    if (!address) throw new Error(`PFUSD address not found for chain ${chainId}`)
    return address
  }

  // Get DEX Router address for chain
  getDEXRouterAddress(chainId: number): string {
    const address = DEX_ROUTER_ADDRESSES[chainId]
    if (!address) throw new Error(`DEX router address not found for chain ${chainId}`)
    return address
  }

  // Check if stablecoin needs approval for DEX router
  async checkStablecoinApproval(chainId: number, owner: string, amount: string): Promise<boolean> {
    const stablecoinAddress = this.getPFUSDAddress(chainId)
    const dexRouterAddress = this.getDEXRouterAddress(chainId)
    
    const tokenContract = new ethers.Contract(
      stablecoinAddress,
      ['function allowance(address owner, address spender) view returns (uint256)'],
      this.provider
    )

    const allowance = await tokenContract.allowance(owner, dexRouterAddress)
    return BigInt(allowance.toString()) >= BigInt(amount)
  }

  // Approve stablecoin for DEX router
  async approveStablecoinForDEX(chainId: number, amount: string): Promise<any> {
    if (!this.signer) throw new Error('Signer required for stablecoin approval')

    const stablecoinAddress = this.getPFUSDAddress(chainId)
    const dexRouterAddress = this.getDEXRouterAddress(chainId)

    const tokenContract = new ethers.Contract(
      stablecoinAddress,
      ['function approve(address spender, uint256 amount) returns (bool)'],
      this.signer
    )

    console.log(`📝 Approving PFUSD for DEX router on chain ${chainId}...`)
    const tx = await tokenContract.approve(dexRouterAddress, amount, {
      gasLimit: 100000
    })
    
    return await tx.wait()
  }

  // Estimate swap output (source token -> PFUSD)
  async estimateSwapOutput(sourceToken: string, amountIn: string): Promise<string> {
    const router = this.getCrossChainRouterContract(this.sourceChainId, true)
    const stableAmount = await router.estimateSwapOutput(sourceToken, amountIn)
    return stableAmount.toString()
  }

  // Quote cross-chain swap fees
  async quoteCrossChainSwap(params: CrossChainSwapParams): Promise<SwapQuote> {
    try {
      const router = this.getCrossChainRouterContract(params.sourceChainId, true)
      const destinationEID = this.getLayerZeroEID(params.destinationChainId)
      
      // First estimate the stable amount from source swap
      const estimatedStableAmount = await this.estimateSwapOutput(params.sourceToken, params.amountIn)
      
      // Get destination chain's stablecoin address (this is what the contract expects)
      const destinationStablecoinAddress = this.getPFUSDAddress(params.destinationChainId)
      
      // Quote LayerZero fees using destination chain's stablecoin address
      const options = '0x' // Default options
      const quotedFee = await router.quoteCrossChainSwap(
        destinationEID,
        params.recipient,
        destinationStablecoinAddress, // Use destination chain's stablecoin address
        estimatedStableAmount,
        params.amountOutMin,
        options,
        false // Pay in native token
      )

      return {
        estimatedStableAmount,
        layerZeroFee: quotedFee.nativeFee.toString(),
        totalFeeETH: quotedFee.nativeFee.toString(),
        estimatedTime: '2-5 minutes'
      }
    } catch (error) {
      console.warn('Fee quotation failed, using fallback estimates:', error)
      
      // Fallback estimates if contract call fails
      try {
        const estimatedStableAmount = await this.estimateSwapOutput(params.sourceToken, params.amountIn)
        const fallbackFee = ethers.parseEther('0.5') // 0.5 ETH fallback
        
        return {
          estimatedStableAmount,
          layerZeroFee: fallbackFee.toString(),
          totalFeeETH: fallbackFee.toString(),
          estimatedTime: '2-5 minutes'
        }
      } catch (estimateError) {
        // Complete fallback if even estimation fails
        const fallbackStableAmount = params.amountIn // Use input amount as fallback
        const fallbackFee = ethers.parseEther('0.5')
        
        return {
          estimatedStableAmount: fallbackStableAmount,
          layerZeroFee: fallbackFee.toString(),
          totalFeeETH: fallbackFee.toString(),
          estimatedTime: '2-5 minutes'
        }
      }
    }
  }

  // Execute cross-chain swap with dual approvals
  async executeCrossChainSwap(params: CrossChainSwapParams, feeAmount: string): Promise<any> {
    if (!this.signer) throw new Error('Signer required for cross-chain swap')

    console.log('🚀 === CROSS-CHAIN SWAP EXECUTION ===')
    console.log(`📍 ${params.sourceToken} -> PFUSD -> ${params.destinationToken}`)
    console.log(`💰 Amount: ${ethers.formatEther(params.amountIn)} tokens`)
    console.log('===============================================')

    const router = this.getCrossChainRouterContract(params.sourceChainId)
    const destinationEID = this.getLayerZeroEID(params.destinationChainId)
    const options = '0x' // Default options
    const userAddress = await this.signer.getAddress()

    // Get contract instances
    console.log('\n📋 === GETTING CONTRACT INSTANCES ===')
    const sourceTokenContract = new ethers.Contract(
      params.sourceToken,
      [
        'function balanceOf(address owner) view returns (uint256)',
        'function allowance(address owner, address spender) view returns (uint256)',
        'function approve(address spender, uint256 amount) returns (bool)'
      ],
      this.signer
    )

    const stablecoinAddress = this.getPFUSDAddress(params.sourceChainId)
    const crossChainRouterAddress = CROSSCHAIN_ROUTER_ADDRESSES[params.sourceChainId]
    const dexRouterAddress = this.getDEXRouterAddress(params.sourceChainId)

    console.log(`✅ CrossChainRouter: ${crossChainRouterAddress}`)
    console.log(`✅ Source Token: ${params.sourceToken}`)
    console.log(`✅ Destination Token: ${params.destinationToken}`)
    console.log(`✅ PFUSD Stablecoin: ${stablecoinAddress}`)

    // Check balances
    console.log('\n💰 === BALANCE CHECKS ===')
    const tokenBalance = await sourceTokenContract.balanceOf(userAddress)
    const ethBalance = await this.signer.provider?.getBalance(userAddress)
    
    console.log(`Source Token Balance: ${ethers.formatEther(tokenBalance)}`)
    console.log(`ETH Balance: ${ethers.formatEther(ethBalance || '0')}`)

    if (BigInt(tokenBalance.toString()) < BigInt(params.amountIn)) {
      throw new Error(`❌ Insufficient source token balance. Required: ${ethers.formatEther(params.amountIn)}, Available: ${ethers.formatEther(tokenBalance)}`)
    }

    if (BigInt(ethBalance?.toString() || '0') < BigInt(feeAmount)) {
      throw new Error(`❌ Insufficient ETH for fees. Required: ${ethers.formatEther(feeAmount)}, Available: ${ethers.formatEther(ethBalance || '0')}`)
    }

    // Check and approve source token for CrossChain router
    console.log('\n🔐 === SOURCE TOKEN APPROVAL ===')
    const currentAllowance = await sourceTokenContract.allowance(userAddress, crossChainRouterAddress)
    
    if (BigInt(currentAllowance.toString()) < BigInt(params.amountIn)) {
      console.log('📝 Approving source token for CrossChainRouter...')
      const approveTx = await sourceTokenContract.approve(crossChainRouterAddress, params.amountIn, {
        gasLimit: 100000
      })
      console.log(`🚀 Approve TX: ${approveTx.hash}`)
      await approveTx.wait()
      console.log('✅ Source token approval confirmed!')
    } else {
      console.log('✅ Sufficient source token allowance already exists!')
    }

    // Estimate swap output for stablecoin approval
    console.log('\n📊 === SWAP ESTIMATION ===')
    let estimatedStableAmount: string
    try {
      estimatedStableAmount = await this.estimateSwapOutput(params.sourceToken, params.amountIn)
      console.log(`📈 Estimated stablecoin output: ${ethers.formatEther(estimatedStableAmount)}`)
    } catch (estimationError) {
      console.log('⚠️ Swap estimation failed, using input amount as fallback...')
      estimatedStableAmount = params.amountIn // Fallback
    }

    // Check and approve stablecoin for DEX router (for destination swap)
    console.log('\n🔐 === STABLECOIN APPROVAL FOR DEX ===')
    const stablecoinContract = new ethers.Contract(
      stablecoinAddress,
      [
        'function allowance(address owner, address spender) view returns (uint256)',
        'function approve(address spender, uint256 amount) returns (bool)'
      ],
      this.signer
    )

    const stablecoinAllowance = await stablecoinContract.allowance(userAddress, dexRouterAddress)
    const requiredStablecoinApproval = BigInt(estimatedStableAmount) * BigInt(2) // 2x for safety

    if (BigInt(stablecoinAllowance.toString()) < requiredStablecoinApproval) {
      console.log('📝 Approving PFUSD for DEX router...')
      const stableApproveTx = await stablecoinContract.approve(dexRouterAddress, requiredStablecoinApproval, {
        gasLimit: 100000
      })
      console.log(`🚀 PFUSD Approve TX: ${stableApproveTx.hash}`)
      await stableApproveTx.wait()
      console.log('✅ PFUSD approval for DEX confirmed!')
    } else {
      console.log('✅ Sufficient PFUSD allowance for DEX already exists!')
    }

    // Quote fees
    console.log('\n💸 === FEE QUOTATION ===')
    const destinationStablecoinAddress = this.getPFUSDAddress(params.destinationChainId)
    try {
      const quotedFee = await router.quoteCrossChainSwap(
        destinationEID,
        params.recipient,
        destinationStablecoinAddress, // Use destination chain's stablecoin address
        estimatedStableAmount,
        params.amountOutMin,
        options,
        false
      )
      console.log(`💰 Quoted fee: ${ethers.formatEther(quotedFee.nativeFee)} ETH`)
      console.log(`💰 Provided fee: ${ethers.formatEther(feeAmount)} ETH`)
    } catch (quoteError) {
      console.log('⚠️ Fee quotation failed, using provided fee amount...')
    }

    // Execute cross-chain swap
    console.log('\n🌉 === EXECUTING CROSS-CHAIN SWAP ===')
    console.log('This transaction will:')
    console.log('1. 🔄 Swap Source Token -> PFUSD on source chain')
    console.log('2. 🌉 Send LayerZero message to destination chain')
    console.log('3. 🔄 Swap PFUSD -> Destination Token on destination chain')
    console.log('4. 📤 Send destination tokens to recipient')

    const swapTx = await router.crossChainSwap(
      destinationEID,
      params.recipient,
      params.sourceToken,
      destinationStablecoinAddress, // Use destination chain's stablecoin address
      params.amountIn,
      params.amountOutMin,
      options,
      {
        value: feeAmount,
        gasLimit: 3000000, // High gas limit
        gasPrice: ethers.parseUnits('25', 'gwei')
      }
    )

    console.log(`🚀 Transaction sent: ${swapTx.hash}`)
    console.log('⏳ Waiting for confirmation...')

    const receipt = await swapTx.wait()
    
    if (receipt.status === 0) {
      console.error('❌ Transaction failed')
      throw new Error('Transaction failed')
    }

    console.log(`✅ Transaction confirmed!`)
    console.log(`📦 Block: ${receipt.blockNumber}`)
    console.log(`⛽ Gas used: ${receipt.gasUsed?.toString()}`)

    return receipt
  }

  // Check all required approvals for cross-chain swap (4 approvals total)
  async checkAllApprovals(params: CrossChainSwapParams, owner: string): Promise<{
    sourceTokenForRouterApproved: boolean
    sourceTokenForCrossChainApproved: boolean
    stablecoinForRouterApproved: boolean
    stablecoinForCrossChainApproved: boolean
    estimatedStableAmount: string
  }> {
    // Get contract addresses
    const crossChainRouterAddress = CROSSCHAIN_ROUTER_ADDRESSES[params.sourceChainId]
    const dexRouterAddress = this.getDEXRouterAddress(params.sourceChainId)
    const stablecoinAddress = this.getPFUSDAddress(params.sourceChainId)

    // Estimate stable amount for stablecoin approval check
    let estimatedStableAmount: string
    try {
      estimatedStableAmount = await this.estimateSwapOutput(params.sourceToken, params.amountIn)
    } catch (error) {
      estimatedStableAmount = params.amountIn // Fallback
    }

    // Check source token approvals
    const sourceTokenContract = new ethers.Contract(
      params.sourceToken,
      ['function allowance(address owner, address spender) view returns (uint256)'],
      this.provider
    )

    // 1. Source token approval for DEX router (for initial swap)
    const sourceRouterAllowance = await sourceTokenContract.allowance(owner, dexRouterAddress)
    const sourceTokenForRouterApproved = BigInt(sourceRouterAllowance.toString()) >= BigInt(params.amountIn)

    // 2. Source token approval for CrossChain router (for cross-chain transfer)
    const sourceCrossChainAllowance = await sourceTokenContract.allowance(owner, crossChainRouterAddress)
    const sourceTokenForCrossChainApproved = BigInt(sourceCrossChainAllowance.toString()) >= BigInt(params.amountIn)

    // Check stablecoin approvals
    const stablecoinContract = new ethers.Contract(
      stablecoinAddress,
      ['function allowance(address owner, address spender) view returns (uint256)'],
      this.provider
    )

    const requiredStablecoinApproval = BigInt(estimatedStableAmount) * BigInt(2) // 2x for safety

    // 3. Stablecoin approval for DEX router (for destination swap)
    const stablecoinRouterAllowance = await stablecoinContract.allowance(owner, dexRouterAddress)
    const stablecoinForRouterApproved = BigInt(stablecoinRouterAllowance.toString()) >= requiredStablecoinApproval

    // 4. Stablecoin approval for CrossChain router (for cross-chain operations)
    const stablecoinCrossChainAllowance = await stablecoinContract.allowance(owner, crossChainRouterAddress)
    const stablecoinForCrossChainApproved = BigInt(stablecoinCrossChainAllowance.toString()) >= requiredStablecoinApproval

    return {
      sourceTokenForRouterApproved,
      sourceTokenForCrossChainApproved,
      stablecoinForRouterApproved,
      stablecoinForCrossChainApproved,
      estimatedStableAmount
    }
  }

  // Execute all 4 required approvals for cross-chain swap
  async executeAllApprovals(params: CrossChainSwapParams): Promise<{
    approvalTxs: any[]
    totalApprovals: number
  }> {
    if (!this.signer) throw new Error('Signer required for approvals')

    const userAddress = await this.signer.getAddress()
    const approvalStatus = await this.checkAllApprovals(params, userAddress)
    const approvalTxs: any[] = []

    // Get contract addresses
    const crossChainRouterAddress = CROSSCHAIN_ROUTER_ADDRESSES[params.sourceChainId]
    const dexRouterAddress = this.getDEXRouterAddress(params.sourceChainId)
    const stablecoinAddress = this.getPFUSDAddress(params.sourceChainId)

    const requiredStablecoinApproval = BigInt(approvalStatus.estimatedStableAmount) * BigInt(2)

    console.log('\n🔐 === EXECUTING ALL REQUIRED APPROVALS ===')

    // 1. Approve source token for DEX router
    if (!approvalStatus.sourceTokenForRouterApproved) {
      console.log('📝 1/4: Approving source token for DEX router...')
      const sourceTokenContract = new ethers.Contract(
        params.sourceToken,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        this.signer
      )
      const tx1 = await sourceTokenContract.approve(dexRouterAddress, params.amountIn, { gasLimit: 100000 })
      console.log(`🚀 TX1: ${tx1.hash}`)
      await tx1.wait()
      approvalTxs.push(tx1)
      console.log('✅ Source token approved for DEX router!')
    } else {
      console.log('✅ 1/4: Source token already approved for DEX router')
    }

    // 2. Approve source token for CrossChain router
    if (!approvalStatus.sourceTokenForCrossChainApproved) {
      console.log('📝 2/4: Approving source token for CrossChain router...')
      const sourceTokenContract = new ethers.Contract(
        params.sourceToken,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        this.signer
      )
      const tx2 = await sourceTokenContract.approve(crossChainRouterAddress, params.amountIn, { gasLimit: 100000 })
      console.log(`🚀 TX2: ${tx2.hash}`)
      await tx2.wait()
      approvalTxs.push(tx2)
      console.log('✅ Source token approved for CrossChain router!')
    } else {
      console.log('✅ 2/4: Source token already approved for CrossChain router')
    }

    // 3. Approve stablecoin for DEX router
    if (!approvalStatus.stablecoinForRouterApproved) {
      console.log('📝 3/4: Approving stablecoin for DEX router...')
      const stablecoinContract = new ethers.Contract(
        stablecoinAddress,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        this.signer
      )
      const tx3 = await stablecoinContract.approve(dexRouterAddress, requiredStablecoinApproval.toString(), { gasLimit: 100000 })
      console.log(`🚀 TX3: ${tx3.hash}`)
      await tx3.wait()
      approvalTxs.push(tx3)
      console.log('✅ Stablecoin approved for DEX router!')
    } else {
      console.log('✅ 3/4: Stablecoin already approved for DEX router')
    }

    // 4. Approve stablecoin for CrossChain router
    if (!approvalStatus.stablecoinForCrossChainApproved) {
      console.log('📝 4/4: Approving stablecoin for CrossChain router...')
      const stablecoinContract = new ethers.Contract(
        stablecoinAddress,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        this.signer
      )
      const tx4 = await stablecoinContract.approve(crossChainRouterAddress, requiredStablecoinApproval.toString(), { gasLimit: 100000 })
      console.log(`🚀 TX4: ${tx4.hash}`)
      await tx4.wait()
      approvalTxs.push(tx4)
      console.log('✅ Stablecoin approved for CrossChain router!')
    } else {
      console.log('✅ 4/4: Stablecoin already approved for CrossChain router')
    }

    console.log(`\n🎉 All approvals completed! Total transactions: ${approvalTxs.length}`)

    return {
      approvalTxs,
      totalApprovals: approvalTxs.length
    }
  }

  // Check if tokens need approval (legacy method for compatibility)
  async checkTokenApproval(tokenAddress: string, owner: string, amount: string): Promise<boolean> {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function allowance(address owner, address spender) view returns (uint256)'],
      this.provider
    )

    const routerAddress = CROSSCHAIN_ROUTER_ADDRESSES[this.sourceChainId]
    const allowance = await tokenContract.allowance(owner, routerAddress)
    
    return BigInt(allowance.toString()) >= BigInt(amount)
  }

  // Approve token for cross-chain swap
  async approveToken(tokenAddress: string, amount: string): Promise<any> {
    if (!this.signer) throw new Error('Signer required for token approval')

    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function approve(address spender, uint256 amount) returns (bool)'],
      this.signer
    )

    const routerAddress = CROSSCHAIN_ROUTER_ADDRESSES[this.sourceChainId]
    const tx = await tokenContract.approve(routerAddress, amount)
    
    return await tx.wait()
  }

  // Parse transaction events
  parseTransactionEvents(receipt: any, sourceChainId: number): any[] {
    const router = this.getCrossChainRouterContract(sourceChainId, true)
    const events = []

    for (const log of receipt.logs) {
      try {
        const parsedLog = router.interface.parseLog(log)
        if (parsedLog.name === 'CrossChainSwapInitiated') {
          events.push({
            type: 'CrossChainSwapInitiated',
            sender: parsedLog.args.sender,
            destinationEid: parsedLog.args.destinationEid.toString(),
            recipient: parsedLog.args.recipient,
            sourceToken: parsedLog.args.sourceToken,
            destinationToken: parsedLog.args.destinationToken,
            amountIn: parsedLog.args.amountIn.toString(),
            stableAmount: parsedLog.args.stableAmount.toString()
          })
        }
      } catch (e) {
        // Not our event, skip silently
      }
    }

    return events
  }

  // Get explorer URLs for transaction tracking
  getExplorerUrls(txHash: string, sourceChainId: number, destinationChainId: number) {
    const explorers: { [key: number]: string } = {
      11155111: 'https://sepolia.etherscan.io/tx/',
      80002: 'https://amoy.polygonscan.com/tx/',
      421614: 'https://sepolia.arbiscan.io/tx/',
      11155420: 'https://sepolia-optimism.etherscan.io/tx/',
      43113: 'https://testnet.snowtrace.io/tx/',
      97: 'https://testnet.bscscan.com/tx/',
      84532: 'https://sepolia.basescan.org/tx/',
      17000: 'https://holesky.etherscan.io/tx/',
    }

    return {
      sourceTransaction: explorers[sourceChainId] + txHash,
      layerZeroScan: 'https://testnet.layerzeroscan.com/',
      destinationExplorer: explorers[destinationChainId]
    }
  }

  // Get stablecoin token info for UI
  getStablecoinInfo(chainId: number) {
    const address = this.getPFUSDAddress(chainId)
    return {
      address,
      symbol: 'PFUSD',
      name: 'PayFunds USD',
      decimals: 18,
      logoURI: '/tokens/pfusd.png' // You can add this logo later
    }
  }

  // Get stablecoin balance for user
  async getStablecoinBalance(chainId: number, userAddress: string): Promise<string> {
    const stablecoinAddress = this.getPFUSDAddress(chainId)
    const tokenContract = new ethers.Contract(
      stablecoinAddress,
      ['function balanceOf(address owner) view returns (uint256)'],
      this.provider
    )

    try {
      const balance = await tokenContract.balanceOf(userAddress)
      return ethers.formatUnits(balance, 18)
    } catch (error) {
      console.error('Error fetching stablecoin balance:', error)
      return '0.00'
    }
  }

  // Get deadline (20 minutes from now)
  getDeadline(): number {
    return Math.floor(Date.now() / 1000) + 1200
  }
}