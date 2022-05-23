import {
  ChainId,
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
  CHAIN_ID_TERRA,
} from "@certusone/wormhole-sdk";
import { hexlify, hexStripZeros } from "@ethersproject/bytes";
import { useConnectedWallet } from "@terra-money/wallet-provider";
import { useMemo } from "react";
import { useEthereumProvider } from "../contexts/EthereumProviderContext";
import { useSolanaWallet } from "../contexts/SolanaWalletContext";
import { CLUSTER, ETH_NETWORK_CHAIN_ID } from "../utils/consts";

const createWalletStatus = (
  isReady: boolean,
  statusMessage: string = "",
  walletAddress?: string
) => ({
  isReady,
  statusMessage,
  walletAddress,
});

function useIsWalletReady(chainId: ChainId): {
  isReady: boolean;
  statusMessage: string;
  walletAddress?: string;
} {
  const solanaWallet = useSolanaWallet();
  const solPK = solanaWallet?.publicKey;
  const terraWallet = useConnectedWallet();
  const hasTerraWallet = !!terraWallet;
  const {
    provider,
    signerAddress,
    chainId: ethChainId,
  } = useEthereumProvider();
  const hasEthInfo = !!provider && !!signerAddress;
  const hasCorrectEthNetwork = ethChainId === ETH_NETWORK_CHAIN_ID;

  return useMemo(() => {
    if (
      chainId === CHAIN_ID_TERRA &&
      hasTerraWallet &&
      terraWallet?.walletAddress
    ) {
      // TODO: terraWallet does not update on wallet changes
      return createWalletStatus(true, undefined, terraWallet.walletAddress);
    }
    if (chainId === CHAIN_ID_SOLANA && solPK) {
      return createWalletStatus(true, undefined, solPK.toString());
    }
    if (chainId === CHAIN_ID_ETH && hasEthInfo && signerAddress) {
      if (hasCorrectEthNetwork) {
        return createWalletStatus(true, undefined, signerAddress);
      } else {
        if (provider) {
          try {
            provider.send("wallet_switchEthereumChain", [
              { chainId: hexStripZeros(hexlify(ETH_NETWORK_CHAIN_ID)) },
            ]);
          } catch (e) {}
        }
        return createWalletStatus(
          false,
          `Wallet is not connected to ${CLUSTER}. Expected Chain ID: ${ETH_NETWORK_CHAIN_ID}`,
          undefined
        );
      }
    }
    //TODO bsc
    return createWalletStatus(false, "Wallet not connected");
  }, [
    chainId,
    hasTerraWallet,
    solPK,
    hasEthInfo,
    hasCorrectEthNetwork,
    provider,
    signerAddress,
    terraWallet,
  ]);
}

export default useIsWalletReady;
