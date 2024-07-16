"use client";
import {
  Account,
  AccountAddressInput,
  Aptos,
  AptosConfig,
  Network,
} from "@aptos-labs/ts-sdk";
import {
  InputTransactionData,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { useEffect, useState } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";

const HomePage = () => {
  const [openModal, setOpenModal] = useState(false);
  const { account, disconnect, signAndSubmitTransaction, connected } =
    useWallet();
  const aptosConfig = new AptosConfig({ network: Network.DEVNET });
  const amountConfig = 100000000;
  const aptos = new Aptos(aptosConfig);
  const {
    unityProvider,
    addEventListener,
    removeEventListener,
    sendMessage,
    loadingProgression,
    isLoaded,
  } = useUnityContext({
    loaderUrl: "Build/FlappyBirdAptos.loader.js",
    dataUrl: "Build/FlappyBirdAptos.data",
    frameworkUrl: "Build/FlappyBirdAptos.framework.js",
    codeUrl: "Build/FlappyBirdAptos.wasm",
  });

  const handleConnectWallet = () => {
    if (account?.address == undefined) {
      setOpenModal(true);
    } else {
      disconnect();
      setOpenModal(true);
    }
  };

  const handleChangeAddress = () => {
    if (account?.address) {
      sendMessage("GameController", "ChangeAddress", account?.address);
    } else {
      sendMessage("GameController", "ChangeAddress", "");
    }
  };

  const handleDisconnectWallet = () => {
    disconnect();
  };

  const getBalance = async () => {
    if (account?.address) {
      try {
        type Coin = { coin: { value: string } };

        const resource = await aptos.getAccountResource<Coin>({
          accountAddress: account.address,
          resourceType: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
        });

        return resource.coin.value;
      } catch (error) {
        console.error("Error getting balance", error);
        return "0";
      }
    }
  };

  const handleMinusAptos = () => {
    PayToken()
      .then(() => {
        sendMessage("GameController", "TokenPayed", 1);
      })
      .catch(() => {
        sendMessage("GameController", "TokenPayed", 0);
      });
  };

  const handleGetPoolBalance = async () => {
    try {
      type Coin = { coin: { value: string } };

      const resource = await aptos.getAccountResource<Coin>({
        accountAddress:
          "0xb299f0b1a0f0e78be11bf935ffe97721c562c60111571cc7c7abfeb6e21d05cd",
        resourceType: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
      });

      sendMessage("GameController", "ChangePoolBalance", resource.coin.value);
    } catch (error) {
      console.error("Error getting pool balance", error);
      sendMessage("GameController", "ChangePoolBalance", "0");
    }
  };

  const PayToken = async () => {
    if (!account?.address) return;
    const response = await signAndSubmitTransaction({
      sender: account.address,
      data: {
        function: "0x1::aptos_account::transfer_coins",
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [
          "0xb299f0b1a0f0e78be11bf935ffe97721c562c60111571cc7c7abfeb6e21d05cd",
          0.01 * amountConfig,
        ],
      },
    });
    // if you want to wait for transaction
    try {
      await aptos.waitForTransaction({ transactionHash: response.hash });
      getBalance().then((result) => {
        result &&
          sendMessage(
            "GameController",
            "ChangeBalance",
            (parseFloat(result) / amountConfig).toString()
          );
      });
    } catch (error) {
      console.error(error);
    }
  };

  const checkCollection = async () => {
    try {
      const collection =
        await aptos.getCollectionDataByCreatorAddressAndCollectionName({
          creatorAddress: account.address,
          collectionName: "AtomGameCollection",
        });
      if (collection) {
        return [true, collection.collection_id];
      } else return false;
    } catch (error) {
      return await checkCollection();
    }
  };

  const getNFT = async (collectionAddress) => {
    try {
      const nfts = await aptos.getAccountOwnedTokensFromCollectionAddress({
        accountAddress: account.address,
        collectionAddress: collectionAddress,
      });
      if (nfts.length == 0) {
        sendMessage("SkinMenu", "BuyFailed");
        return;
      }
      nfts.forEach((nft, index) => {

        if (index == nfts.length - 1) {
          sendMessage(
            "SkinMenu",
            "AddLastNFTUrl",
            nft.current_token_data.token_uri.toString()
          );
        } else {
          sendMessage(
            "SkinMenu",
            "AddNFTUrl",
            nft.current_token_data.token_uri.toString()
          );
        }
      });
    } catch (error) {
      getNFT(collectionAddress);
    }
  };

  const handleGetOwnedNFT = async () => {
    checkCollection().then(async (result) => {
      if (result[0]) {
        getNFT(result[1]);
      } else {
        sendMessage("SkinMenu", "CheckNFT");
      }
    });
  };

  const createCollection = async () => {
    try {
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function:
            "0xb533aa89f105c426dfe9dc7f41ae0c57513d8b245faecf7d468c6830c63122c7::GameNFT::create_collection",
          typeArguments: [],
          functionArguments: [
            "Atom Game Collection on Aptos",
            "AtomGameCollection",
            "https://static.ybox.vn/2022/8/4/1659578024342-Logo%20ATOM.jpg",
          ],
        },
      });
      await aptos.waitForTransaction({ transactionHash: response.hash });
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const mintNFT = async (uri: string, name: string) => {
    let hasCollection = await checkCollection();
    if (hasCollection == false) {
      let reuslt = await createCollection();
      if (reuslt == false) return;
    }
    try {
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function:
            "0xb533aa89f105c426dfe9dc7f41ae0c57513d8b245faecf7d468c6830c63122c7::GameNFT::mint_nft",
          typeArguments: [],
          functionArguments: [
            "Atom NFT on Aptos",
            name,
            uri,
            "AtomGameCollection",
            "2",
          ],
        },
      });
      await aptos.waitForTransaction({ transactionHash: response.hash });
      sendMessage("SkinMenu", "BuySuccess");
    } catch (error) {
      console.log("Heelo error: " + error);
      sendMessage("SkinMenu", "BuyFailed");
    }
  };

  useEffect(() => {
    if (isLoaded) {
      handleChangeAddress();
      getBalance().then((result) => {
        result &&
          sendMessage(
            "GameController",
            "ChangeBalance",
            (parseFloat(result) / amountConfig).toString()
          );
      });
    }
  }, [account, isLoaded]);

  useEffect(() => {
    addEventListener("ConnectWallet", handleConnectWallet);
    addEventListener("DisconnectWallet", handleDisconnectWallet);
    addEventListener("MinusAptos", handleMinusAptos);
    addEventListener("GetPoolBalance", () => {
      handleGetPoolBalance();
    });
    addEventListener("GetOwnedNFT", () => {
      handleGetOwnedNFT();
    });
    addEventListener("MintNFT", (uri: string, name: string) => {
      mintNFT(uri, name);
    });
    return () => {
      removeEventListener("ConnectWallet", handleConnectWallet);
      removeEventListener("DisconnectWallet", handleDisconnectWallet);
      removeEventListener("MinusAptos", handleMinusAptos);
      removeEventListener("GetPoolBalance", () => {
        handleGetPoolBalance();
      });
      removeEventListener("GetOwnedNFT", () => {
        handleGetOwnedNFT();
      });
      removeEventListener("MintNFT", (uri: string, name: string) => {
        mintNFT(uri, name);
      });
    };
  }, [addEventListener, removeEventListener, handleConnectWallet, isLoaded]);
  const loadingPercentage = Math.round(loadingProgression * 100);

  return (
    <>
      <div className="opacity-0 h-0">
        <WalletSelector isModalOpen={openModal} setModalOpen={setOpenModal} />
        <button onClick={PayToken}>Pay</button>
      </div>
      {!isLoaded && (
        <div className="absolute top-[50%]">
          <p>Loading Application... {Math.round(loadingProgression * 100)}%</p>
        </div>
      )}

      <Unity className="w-full h-full" unityProvider={unityProvider} />
    </>
  );
};

export default HomePage;
