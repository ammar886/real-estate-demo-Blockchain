// src/pages/MintProperty.jsx
import { useState, useEffect } from "react";
import { NFTStorage, File } from 'nft.storage';

import { ethers } from "ethers";
import {
  propertyTokenAddress,
  propertyTokenABI,
  propertyEscrowABI,
  propertyEscrowBytecode,
} from "./contracts";

export default function MintProperty() {
  const [account, setAccount] = useState(null);
  const [metadata, setMetadata] = useState({
    title: "",
    location: "",
    description: "",
    image: null,
  });

  const [tokenId, setTokenId] = useState(null);
  const [showEscrowForm, setShowEscrowForm] = useState(false);
  const [buyer, setBuyer] = useState("");
  const [buyerSolicitor, setBuyerSolicitor] = useState("");
  const [price, setPrice] = useState("");
  const [deployedEscrow, setDeployedEscrow] = useState(null);
  const [usdPrice, setUsdPrice] = useState("");
  const [seller, setSeller] = useState("");
  const [convertedPrice, setConvertedPrice] = useState("");

  // const client = new NFTStorage({
  //   token: '31c1025a.9668ad532e4048cd991fd25075378272',
  // });

  // console.log("Using API key:", client.token); // should print your full token

  // const storeNFT = async () => {
  //   try {
  //     const formData = new FormData();
  
  //     // Append the image file (must be a File or Blob object)
  //     formData.append("file", metadata.image);
  
  //     // Append the metadata JSON as a Blob
  //     const metadataBlob = new Blob([
  //       JSON.stringify({
  //         name: metadata.title,
  //         description: metadata.description,
  //         location: metadata.location,
  //       }),
  //     ], { type: "application/json" });
  
  //     formData.append("file", metadataBlob);
  
  //     const response = await fetch("https://api.nft.storage/upload", {
  //       method: "POST",
  //       headers: {
  //         Authorization: "Bearer 31c1025a.9668ad532e4048cd991fd25075378272"
  //         // Note: do NOT set Content-Type manually; browser will handle it for FormData
  //       },
  //       body: formData,
  //     });
  
  //     if (!response.ok) {
  //       throw new Error(`Upload failed: ${response.statusText}`);
  //     }
  
  //     const result = await response.json();
  //     console.log("✅ Uploaded metadata:", result);
  //     return `https://ipfs.io/ipfs/${result.value.cid}`;
  //   } catch (error) {
  //     console.error("❌ Upload failed", error);
  //     throw error;
  //   }
  // };

  const connectWallet = async () => {
    if (window.ethereum) {
      const [addr] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(addr);
    } else {
      alert("MetaMask not found");
    }
  };

  const handleChange = (e) => {
    setMetadata({ ...metadata, [e.target.name]: e.target.value });
  };

  const handleMint = async () => {
    if (!account) return alert("Please connect MetaMask first");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        propertyTokenAddress,
        propertyTokenABI,
        signer
      );

      // const tokenURI = await storeNFT();

      const tokenMetadata = {
        title: metadata.title,
        description: metadata.description,
        location: metadata.location,
        image: metadata.image,
      };

      const tokenURI =
      "data:application/json;base64," + btoa(JSON.stringify(tokenMetadata));

      const tx = await contract.mint(account, tokenURI);
      await tx.wait();

      const nextTokenId = await contract.nextTokenId();
      const mintedTokenId = BigInt(nextTokenId) - 1n;

      setTokenId(mintedTokenId.toString());
      setShowEscrowForm(true);
      alert(`✅ Property NFT minted! Token ID: ${mintedTokenId}`);
    } catch (err) {
      console.error("❌ Mint failed", err);
      alert("Mint failed. See console for error.");
    }
  };

  const handleApproveNFT = async () => {
    if (!deployedEscrow || tokenId === null) {
      alert("Missing escrow address or token ID");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const propertyToken = new ethers.Contract(
        propertyTokenAddress,
        propertyTokenABI,
        signer
      );

      const tx = await propertyToken.approve(deployedEscrow, tokenId);
      await tx.wait();

      alert("✅ Escrow contract approved to transfer the NFT!");
    } catch (err) {
      console.error("❌ Approval failed:", err);
      alert("Approval failed. See console.");
    }
  };

  async function checkOwner(tokenId) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        propertyTokenAddress,
        propertyTokenABI,
        signer
      );

      const ownerAddress = await contract.ownerOf(tokenId);
      alert(`🏠 Owner of token ${tokenId} is: ${ownerAddress}`);
    } catch (err) {
      console.error("❌ Failed to fetch owner", err);
      alert("Error fetching owner. See console.");
    }
  }

  const checkEthPrice = async () => {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
    );
    const data = await res.json();
    const ethPriceUSD = data.ethereum.usd;

    console.log("ETH/USD price:", ethPriceUSD);
    alert("Current ETH Price: $" + ethPriceUSD);
  };

  const convertUsdToEth = async () => {
    if (!usdPrice) return alert("Please enter a USD price first");
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );
      const data = await res.json();
      const ethRate = data.ethereum.usd;

      const ethAmount = (parseFloat(usdPrice) / ethRate).toFixed(6);
      setConvertedPrice(ethAmount);
      setPrice(ethAmount); // auto-fill ETH field
      alert(`💱 $${usdPrice} ≈ ${ethAmount} ETH`);
    } catch (err) {
      console.error("❌ Conversion failed", err);
      alert("Conversion failed. Check console.");
    }
  };

  const handleDeployEscrow = async () => {
    if (!buyer || !buyerSolicitor || !seller || !price || tokenId === null)
      return alert("Please fill all fields");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const escrowFactory = new ethers.ContractFactory(
        propertyEscrowABI,
        propertyEscrowBytecode,
        signer
      );
      const formattedPrice = ethers.parseEther(price); // returns BigInt
      const tokenIdBigInt = BigInt(tokenId);  

      console.log("typeof formattedPrice:", typeof formattedPrice);
      console.log("typeof tokenId:", typeof tokenIdBigInt);
      console.log("Deploying with args:", {
        buyer,
        buyerSolicitor,
        seller,
        formattedPrice,
        propertyTokenAddress,
        tokenIdBigInt,
      });

      const escrow = await escrowFactory.deploy(
        buyer,
        buyerSolicitor,
        seller,
        formattedPrice,
        propertyTokenAddress,
        tokenIdBigInt
      );
      

      await escrow.waitForDeployment();
      const escrowAddress = await escrow.getAddress();

      setDeployedEscrow(escrowAddress);
      alert(`✅ Escrow contract deployed at ${escrowAddress}`);
      console.log(
        "Escrow ABI functions:",
        propertyEscrowABI.map((f) => f.name)
      );
    } catch (err) {
      console.error("❌ Escrow deployment failed:", err);
      alert("Escrow deployment failed. See console.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6 text-gray-800">
      <h1 className="text-2xl font-bold">🏡 Mint Property NFT</h1>

      {/* Connect Wallet */}
      {!account ? (
        <button
          onClick={connectWallet}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Connect MetaMask
        </button>
      ) : (
        <p className="text-sm text-gray-600">
          Connected: <span className="font-mono">{account}</span>
        </p>
      )}

      {/* Property Metadata Form */}
      <div className="space-y-4">
        <input
          type="text"
          name="title"
          placeholder="Property Title"
          onChange={handleChange}
          value={metadata.title}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="location"
          placeholder="Location"
          onChange={handleChange}
          value={metadata.location}
          className="w-full border px-3 py-2 rounded"
        />
        <textarea
          name="description"
          placeholder="Description"
          onChange={handleChange}
          value={metadata.description}
          className="w-full border px-3 py-2 rounded"
        />
       <input
          type="file"
           accept="image/*"
            onChange={(e) =>
           setMetadata({ ...metadata, image: e.target.files[0] })
        }
        />
        {metadata.image && (
  <img
    src={URL.createObjectURL(metadata.image)}
    alt="Preview"
    style={{ width: "200px", marginTop: "10px" }}
  />
)}
      </div>

      <button
        onClick={handleMint}
        className="bg-green-600 text-white px-6 py-2 rounded"
      >
        Mint Property
      </button>

      <button
        onClick={checkEthPrice}
        className="bg-green-600 text-white px-6 py-2 rounded"
      >
        Check ETH PRICE
      </button>

      <input
        type="number"
        placeholder="Enter Token ID"
        value={tokenId}
        onChange={(e) => setTokenId(e.target.value)}
      />
      <button onClick={() => checkOwner(tokenId)}>Check Owner</button>

      {/* Escrow Deployment Form */}
      {showEscrowForm && (
        <div className="mt-8 p-4 border rounded border-gray-300 space-y-4 bg-gray-50">
          <h2 className="text-xl font-semibold">📝 Deploy Escrow Contract</h2>
          <input
            type="text"
            placeholder="Buyer Address (0x...)"
            className="w-full border px-3 py-2 rounded"
            value={buyer}
            onChange={(e) => setBuyer(e.target.value)}
          />
          <input
            type="text"
            placeholder="Buyer Solicitor Address (0x...)"
            className="w-full border px-3 py-2 rounded"
            value={buyerSolicitor}
            onChange={(e) => setBuyerSolicitor(e.target.value)}
          />
          <input
  type="text"
  placeholder="Seller Address (0x...)"
  className="w-full border px-3 py-2 rounded"
  value={seller}
  onChange={(e) => setSeller(e.target.value)}
/>
          <input
            type="number"
            placeholder="Price in USD"
            className="w-full border px-3 py-2 rounded"
            value={usdPrice}
            onChange={(e) => setUsdPrice(e.target.value)}
          />
          <button
            onClick={convertUsdToEth}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            Convert USD to ETH
          </button>
          <input
            type="text"
            placeholder="Sale Price (ETH)"
            className="w-full border px-3 py-2 rounded"
            value={price}
            readOnly
            //onChange={(e) => setPrice(e.target.value)}
          />

          <input
            type="text"
            placeholder="Token ID"
            className="w-full border px-3 py-2 rounded"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            readOnly
          />
          <button
            onClick={handleDeployEscrow}
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            Deploy Escrow
          </button>

          <button
            onClick={handleApproveNFT}
            className="bg-yellow-600 text-white px-4 py-2 rounded"
          >
            Approve Escrow to Transfer NFT
          </button>

          {deployedEscrow && (
            <p className="text-green-700 mt-2">
              ✅ Escrow deployed at:{" "}
              <span className="font-mono">{deployedEscrow}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
