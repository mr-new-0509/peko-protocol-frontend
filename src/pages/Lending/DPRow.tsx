import { useEffect, useMemo, useState } from "react";
import { useAccount, useBalance, useContractRead } from "wagmi";
import Td from "../../components/tableComponents/Td";
import Tr from "../../components/tableComponents/Tr";
import { IAsset, IReturnValueOfBalance, IReturnValueOfPoolInfo } from "../../utils/interfaces";
import { POOL_CONTRACT_ABI, POOL_CONTRACT_ADDRESS, USDC_CONTRACT_ADDRESS } from "../../utils/constants";
import { formatEther, formatUnits } from "viem";

//  ----------------------------------------------------------------------------------

interface IProps {
  asset: IAsset;
  openDialog: Function;
  ethPriceInUsd: number;
  usdcPriceInUsd: number;
}

//  ----------------------------------------------------------------------------------

export default function DPRow({ asset, openDialog, ethPriceInUsd, usdcPriceInUsd }: IProps) {
  const [marketSize, setMarketSize] = useState<number>(0)
  const [marketSizeInUsd, setMarketSizeInUsd] = useState<number>(0)
  const [totalBorrowed, setTotalBorrowed] = useState<number>(0)
  const [totalBorrowedInUsd, setTotalBorrowedInUsd] = useState<number>(0)

  //  ---------------------------------------------------------------------------------

  const { address, isConnected } = useAccount()

  //  ---------------------------------------------------------------------------------
  //  Balance data
  const { data: balanceData }: IReturnValueOfBalance = useBalance({
    address,
    token: asset.symbol === 'usdc' ? USDC_CONTRACT_ADDRESS : undefined,
    watch: true
  })

  const { data: poolInfo }: IReturnValueOfPoolInfo = useContractRead({
    address: POOL_CONTRACT_ADDRESS,
    abi: POOL_CONTRACT_ABI,
    functionName: 'getPoolInfo',
    args: [asset.contractAddress],
    watch: true
  })

  //  ----------------------------------------------------------------------------------

  const balanceInUsd = useMemo<number>(() => {
    if (balanceData) {
      return Number(balanceData.formatted) * (asset.symbol === 'eth' ? ethPriceInUsd : usdcPriceInUsd);
    }
    return 0
  }, [balanceData])

  //  ----------------------------------------------------------------------------------

  useEffect(() => {
    if (poolInfo) {
      if (asset.symbol === 'eth') {
        setMarketSize(Number(formatEther(poolInfo.totalAmount)))
        setMarketSizeInUsd(Number(formatEther(poolInfo.totalAmount)) * ethPriceInUsd)
        setTotalBorrowed(Number(formatEther(poolInfo.borrowAmount)))
        setTotalBorrowedInUsd(Number(formatEther(poolInfo.borrowAmount)) * ethPriceInUsd)
      } else {
        setMarketSize(Number(formatUnits(poolInfo.totalAmount, asset.decimals)))
        setMarketSizeInUsd(Number(formatUnits(poolInfo.totalAmount, asset.decimals)) * usdcPriceInUsd)
        setTotalBorrowed(Number(formatUnits(poolInfo.borrowAmount, asset.decimals)))
        setTotalBorrowedInUsd(Number(formatUnits(poolInfo.borrowAmount, asset.decimals)) * usdcPriceInUsd)
      }
    } else {
      setMarketSize(0)
      setMarketSizeInUsd(0)
      setTotalBorrowed(0)
      setTotalBorrowedInUsd(0)
    }
  }, [poolInfo, asset])

  //  ----------------------------------------------------------------------------------

  return (
    <Tr className="hover:bg-gray-900" onClick={() => openDialog(asset.symbol)}>
      {/* Asset Name */}
      <Td>
        <div className="flex items-center gap-2">
          <img src={asset.imgSrc} alt="" className="w-10" />
          <div className="flex flex-col">
            <span className="font-semibold">{asset.name}</span>
            <span className="text-sm text-gray-500">
              ${asset.symbol === 'eth' ? ethPriceInUsd.toFixed(2) : usdcPriceInUsd.toFixed(2)}
            </span>
          </div>
        </div>
      </Td>

      {/* LTV */}
      <Td>{Number(poolInfo?.LTV)}%</Td>

      {/* Deposit APY */}
      <Td className="text-green-500">{Number(poolInfo?.depositApy)}%</Td>

      {/* Market size */}
      <Td>
        <div className="flex flex-col">
          <span className="font-semibold uppercase">{marketSize.toFixed(4)} {asset.symbol}</span>
          <span className="text-sm text-gray-500">${marketSizeInUsd.toFixed(2)}</span>
        </div>
      </Td>

      {/* Borrow APY */}
      <Td className="text-red-500">{Number(poolInfo?.borrowApy)}%</Td>

      {/* Total Borrowed */}
      <Td>
        <div className="flex flex-col">
          <span className="font-semibold uppercase">{totalBorrowed.toFixed(4)} {asset.symbol}</span>
          <span className="text-sm text-gray-500">${totalBorrowedInUsd.toFixed(2)}</span>
        </div>
      </Td>

      {/* Wallet */}
      {isConnected && (
        <Td>
          <div className="flex flex-col">
            <span className="font-semibold uppercase">{balanceData?.formatted ? Number(balanceData.formatted).toFixed(4) : 0} {asset.symbol}</span>
            <span className="text-sm text-gray-500">${balanceInUsd.toFixed(2)}</span>
          </div>
        </Td>
      )}
    </Tr>
  )
}