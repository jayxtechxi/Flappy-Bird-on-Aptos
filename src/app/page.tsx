"use client";
import Image from "next/image";
import {
  AptosWalletAdapterProvider,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { MartianWallet } from "@martianwallet/aptos-wallet-adapter";
import HomePage from "../components/HomePage";

export default function Home() {
  const wallets = [new MartianWallet()];


  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={true}
      onError={(error) => {
        console.log("error", error);
      }}
    >
      <main className="flex h-[100vh] flex-col items-center justify-between">
        <HomePage />
      </main>
    </AptosWalletAdapterProvider>
  );
}
