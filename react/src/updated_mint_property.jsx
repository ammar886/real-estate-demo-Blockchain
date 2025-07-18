"use client"

import { useState } from "react"
import { Upload, Wallet } from "lucide-react"
import EscrowModal from "./components/escrow-modal";

import { ethers } from "ethers";
import {
  propertyTokenAddress,
  propertyTokenABI,
  propertyEscrowABI,
  propertyEscrowBytecode,
} from "./contracts";

export default function BlocVeyDemo() {
    const [account, setAccount] = useState(null);
    const [tokenId, setTokenId] = useState(null);
    const [isApproved, setIsApproved] = useState(null);
    const [deployedEscrow, setDeployedEscrow] = useState(null);
    const [escrowData, setEscrowData] = useState({
        buyer: "",
        buyerSolicitor: "",
        seller: "",
        price: "",
        priceUSD: "",
      });
    const [showEscrowForm, setShowEscrowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("seller")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    image: null,
  })
  const [metadata, setMetadata] = useState({
    title: "",
    location: "",
    description: "",
    image: null,
  });


  const connectWallet = async () => {
    try {
        console.log("Clicking...");
        if (!window.ethereum) return alert("Install MetaMask");
        const [addr] = await window.ethereum.request({ method: "eth_requestAccounts" });
        alert("Connected: " + addr);
        setAccount(addr);
      } catch (err) {
        console.error(err);
        alert("Error connecting");
      }
    }

    const handleDeployEscrow = async () => {
        const { buyer, buyerSolicitor, seller, price } = escrowData;
      
        if (!buyer || !buyerSolicitor || !seller || !price || tokenId === null) {
          return alert("Please fill all fields");
        }
      
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
      
          const escrowFactory = new ethers.ContractFactory(
            propertyEscrowABI,
            propertyEscrowBytecode,
            signer
          );
      
          const formattedPrice = ethers.parseEther(price);
          const tokenIdBigInt = BigInt(tokenId);
      
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
          console.log("🚀 Deployed Escrow Address:", escrowAddress);
          setDeployedEscrow(escrowAddress); 
          alert(`✅ Escrow contract deployed at ${escrowAddress}`);
          console.log("Escrow deployed at:", escrowAddress);
        } catch (err) {
          console.error("❌ Escrow deployment failed:", err);
          alert("Escrow deployment failed. See console.");
        }
      };

      const handleApproveNFT = async () => {
        console.log("💡 deployedEscrow:", deployedEscrow);
        console.log("💡 tokenId:", tokenId);
      
        if (!deployedEscrow || tokenId === null || tokenId === undefined) {
          alert("Missing escrow address or token ID");
          return;
        }
      
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(propertyTokenAddress, propertyTokenABI, signer);
      
          const tokenIdBigInt = BigInt(tokenId); // always convert
          const tx = await contract.approve(deployedEscrow, tokenIdBigInt);
          await tx.wait();
      
          alert("✅ Escrow approved successfully!");
          console.log(showEscrowForm);
          setShowEscrowForm(false); // Close modal
          setIsApproved(true);
          console.log(showEscrowForm);
          console.log("✅ Approve transaction:", tx);
        } catch (error) {
          console.error("❌ Approve failed:", error);
          alert("NFT approval failed. See console.");
        }
      };
    
      

  const handleInputChange = (field, value) => {
    setMetadata((prev) => ({ ...prev, [field]: value }));
  }

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      setMetadata((prev) => ({ ...prev, image: file }))
    }
  }

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
      setDeployedEscrow(null);         // clear previous escrow address
      setIsApproved(false);            // reset approval state if you track it
      setEscrowData({
        buyer: "",
        buyerSolicitor: "",
        seller: "",
        price: "",
      });


      alert(`✅ Property NFT minted! Token ID: ${mintedTokenId}`);
      setShowEscrowForm(true);
    } catch (err) {
      console.error("❌ Mint failed", err);
      alert("Mint failed. See console for error.");
    }
  };

  

  const shortenAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  const styles = {
    container: {
        minHeight: "100vh",
        width: "100vw", // 💡 ensures full width
        background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: "flex",         // 💡 make it flex
        flexDirection: "column", // 💡 so header + main stack vertically
      },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "24px",
      backgroundColor: "white",
      borderBottom: "1px solid #e5e7eb",
    },
    logo: {
      display: "flex",
      alignItems: "center",
    },
    logoBox: {
      padding: "12px 24px",
      border: "2px solid #1f2937",
      borderRadius: "8px",
    },
    logoText: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "#1f2937",
      margin: 0,
    },
    tabContainer: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      backgroundColor: "#f3f4f6",
      borderRadius: "8px",
      padding: "4px",
    },
    tabButton: (isActive) => ({
      padding: "8px 24px",
      borderRadius: "6px",
      border: "none",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease",
      backgroundColor: isActive ? "white" : "transparent",
      color: isActive ? "#1f2937" : "#6b7280",
      boxShadow: isActive ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
    }),
    connectButton: {
      display: "flex",
      alignItems: "center",
      backgroundColor: "#2563eb",
      color: "white",
      padding: "12px 24px",
      borderRadius: "12px",
      border: "none",
      fontWeight: "500",
      cursor: "pointer",
      transition: "background-color 0.2s ease",
    },
    main: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
        flexGrow: 1, // 💡 fills vertical space left by header
        width: "100%", // 💡 spans full width to center content
      },
    card: {
      width: "100%",
      maxWidth: "448px",
      backgroundColor: "white",
      border: "2px solid #e5e7eb",
      borderRadius: "16px",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    },
    cardContent: {
      padding: "32px",
    },
    fieldContainer: {
      marginBottom: "24px",
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
      marginBottom: "8px",
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      border: "2px solid #d1d5db",
      borderRadius: "12px",
      fontSize: "16px",
      transition: "border-color 0.2s ease",
      outline: "none",
      boxSizing: "border-box",
    },
    textarea: {
      width: "100%",
      padding: "12px 16px",
      border: "2px solid #d1d5db",
      borderRadius: "12px",
      fontSize: "16px",
      transition: "border-color 0.2s ease",
      outline: "none",
      resize: "none",
      fontFamily: "inherit",
      boxSizing: "border-box",
    },
    uploadContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    uploadLabel: {
      cursor: "pointer",
    },
    uploadBox: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px 24px",
      backgroundColor: "#f3f4f6",
      border: "2px solid #d1d5db",
      borderRadius: "12px",
      transition: "background-color 0.2s ease",
    },
    uploadText: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
    },
    hiddenInput: {
      display: "none",
    },
    mintButton: {
      width: "100%",
      backgroundColor: "#2563eb",
      color: "white",
      padding: "16px",
      borderRadius: "12px",
      border: "none",
      fontSize: "18px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.2s ease",
    },
  }

  return (
    <>
   
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoBox}>
            <h1 style={styles.logoText}>BlocVey Demo</h1>
          </div>
        </div>

        <div style={styles.tabContainer}>
          <button
            onClick={() => setActiveTab("seller")}
            style={styles.tabButton(activeTab === "seller")}
            onMouseEnter={(e) => {
              if (activeTab !== "seller") {
                e.target.style.backgroundColor = "#f9fafb"
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "seller") {
                e.target.style.backgroundColor = "transparent"
              }
            }}
          >
            Seller
          </button>
          <button
            onClick={() => setActiveTab("buyer")}
            style={styles.tabButton(activeTab === "buyer")}
            onMouseEnter={(e) => {
              if (activeTab !== "buyer") {
                e.target.style.backgroundColor = "#f9fafb"
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "buyer") {
                e.target.style.backgroundColor = "transparent"
              }
            }}
          >
            Buyer
          </button>
        </div>

        {account ? (
        <div>
          ✅ Connected: <strong>{shortenAddress(account)}</strong>
        </div>
      ) : (

        <button
        onClick={connectWallet}
          style={styles.connectButton}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#1d4ed8")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#2563eb")}
          
        >
          <Wallet style={{ width: "16px", height: "16px", marginRight: "8px" }} />
          Connect metamask
        </button>
      )}
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.card}>
          <div style={styles.cardContent}>
            {/* Title Field */}
            <div style={styles.fieldContainer}>
              <label htmlFor="title" style={styles.label}>
                Title
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                style={styles.input}
                placeholder="Enter NFT title"
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
              />
            </div>

            {/* Description Field */}
            <div style={styles.fieldContainer}>
              <label htmlFor="description" style={styles.label}>
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                style={styles.textarea}
                rows={3}
                placeholder="Describe your NFT"
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
              />
            </div>

            {/* Location Field */}
            <div style={styles.fieldContainer}>
              <label htmlFor="location" style={styles.label}>
                Location
              </label>
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                style={styles.input}
                placeholder="Enter location"
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
              />
            </div>

            {/* Image Upload */}
            <div style={styles.fieldContainer}>
              <label style={styles.label}>Image</label>
              <div style={styles.uploadContainer}>
                <label htmlFor="image-upload" style={styles.uploadLabel}>
                  <div
                    style={styles.uploadBox}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = "#e5e7eb")}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = "#f3f4f6")}
                  >
                    <Upload style={{ width: "16px", height: "16px", marginRight: "8px", color: "#6b7280" }} />
                    <span style={styles.uploadText}>{formData.image ? formData.image.name : "Upload"}</span>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={styles.hiddenInput}
                  />
                </label>
              </div>
            </div>

            {/* Mint Button */}
            <button
              onClick={handleMint}
              style={styles.mintButton}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#1d4ed8")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#2563eb")}
            >
              Mint
            </button>
          </div>
        </div>
      </main>
    </div>
    <EscrowModal
  showEscrowForm={showEscrowForm}
  setShowEscrowForm={setShowEscrowForm}
  escrowData={escrowData}
  setEscrowData={setEscrowData}
  tokenId={tokenId}
  handleDeployEscrow={handleDeployEscrow}
  handleApproveNFT={handleApproveNFT}
  deployedEscrow={deployedEscrow}
/>
  </>
   
)}
