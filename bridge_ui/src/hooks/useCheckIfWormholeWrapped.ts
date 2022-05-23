import {
  ChainId,
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
  CHAIN_ID_TERRA,
  getOriginalAssetEth,
  getOriginalAssetSol,
  getOriginalAssetTerra,
  WormholeWrappedInfo,
} from "@certusone/wormhole-sdk";
import {
  getOriginalAssetEth as getOriginalAssetEthNFT,
  getOriginalAssetSol as getOriginalAssetSolNFT,
} from "@certusone/wormhole-sdk/lib/nft_bridge";
import { Connection } from "@solana/web3.js";
import { LCDClient } from "@terra-money/terra.js";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useEthereumProvider } from "../contexts/EthereumProviderContext";
import {
  selectNFTSourceAsset,
  selectNFTSourceChain,
  selectNFTSourceParsedTokenAccount,
  selectTransferSourceAsset,
  selectTransferSourceChain,
} from "../store/selectors";
import { setSourceWormholeWrappedInfo as setNFTSourceWormholeWrappedInfo } from "../store/nftSlice";
import { setSourceWormholeWrappedInfo as setTransferSourceWormholeWrappedInfo } from "../store/transferSlice";
import { uint8ArrayToHex } from "../utils/array";
import {
  ETH_NFT_BRIDGE_ADDRESS,
  ETH_TOKEN_BRIDGE_ADDRESS,
  SOLANA_HOST,
  SOL_NFT_BRIDGE_ADDRESS,
  SOL_TOKEN_BRIDGE_ADDRESS,
  TERRA_HOST,
} from "../utils/consts";

export interface StateSafeWormholeWrappedInfo {
  isWrapped: boolean;
  chainId: ChainId;
  assetAddress: string;
  tokenId?: string;
}

const makeStateSafe = (
  info: WormholeWrappedInfo
): StateSafeWormholeWrappedInfo => ({
  ...info,
  assetAddress: uint8ArrayToHex(info.assetAddress),
});

// Check if the tokens in the configured source chain/address are wrapped
// tokens. Wrapped tokens are tokens that are non-native, I.E, are locked up on
// a different chain than this one.
function useCheckIfWormholeWrapped(nft?: boolean) {
  const dispatch = useDispatch();
  const sourceChain = useSelector(
    nft ? selectNFTSourceChain : selectTransferSourceChain
  );
  const sourceAsset = useSelector(
    nft ? selectNFTSourceAsset : selectTransferSourceAsset
  );
  const nftSourceParsedTokenAccount = useSelector(
    selectNFTSourceParsedTokenAccount
  );
  const tokenId = nftSourceParsedTokenAccount?.tokenId || ""; // this should exist by this step for NFT transfers
  const setSourceWormholeWrappedInfo = nft
    ? setNFTSourceWormholeWrappedInfo
    : setTransferSourceWormholeWrappedInfo;
  const { provider } = useEthereumProvider();
  useEffect(() => {
    // TODO: loading state, error state
    dispatch(setSourceWormholeWrappedInfo(undefined));
    let cancelled = false;
    (async () => {
      if (sourceChain === CHAIN_ID_ETH && provider && sourceAsset) {
        const wrappedInfo = makeStateSafe(
          await (nft
            ? getOriginalAssetEthNFT(
                ETH_NFT_BRIDGE_ADDRESS,
                provider,
                sourceAsset,
                tokenId
              )
            : getOriginalAssetEth(
                ETH_TOKEN_BRIDGE_ADDRESS,
                provider,
                sourceAsset
              ))
        );
        if (!cancelled) {
          dispatch(setSourceWormholeWrappedInfo(wrappedInfo));
        }
      }
      if (sourceChain === CHAIN_ID_SOLANA && sourceAsset) {
        try {
          const connection = new Connection(SOLANA_HOST, "confirmed");
          const wrappedInfo = makeStateSafe(
            await (nft
              ? getOriginalAssetSolNFT(
                  connection,
                  SOL_NFT_BRIDGE_ADDRESS,
                  sourceAsset
                )
              : getOriginalAssetSol(
                  connection,
                  SOL_TOKEN_BRIDGE_ADDRESS,
                  sourceAsset
                ))
          );
          if (!cancelled) {
            dispatch(setSourceWormholeWrappedInfo(wrappedInfo));
          }
        } catch (e) {}
      }
      if (sourceChain === CHAIN_ID_TERRA && sourceAsset) {
        try {
          const lcd = new LCDClient(TERRA_HOST);
          const wrappedInfo = makeStateSafe(
            await getOriginalAssetTerra(lcd, sourceAsset)
          );
          if (!cancelled) {
            dispatch(setSourceWormholeWrappedInfo(wrappedInfo));
          }
        } catch (e) {}
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    dispatch,
    sourceChain,
    sourceAsset,
    provider,
    nft,
    setSourceWormholeWrappedInfo,
    tokenId,
  ]);
}

export default useCheckIfWormholeWrapped;
