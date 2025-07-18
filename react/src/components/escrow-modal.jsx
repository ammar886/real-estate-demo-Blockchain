import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { propertyEscrowABI, propertyEscrowBytecode } from "../contracts";

export default function EscrowModal({
    showEscrowForm,
    setShowEscrowForm,
    escrowData,
    setEscrowData,
    tokenId,
    handleDeployEscrow,
    handleApproveNFT,
    deployedEscrow,
  }) {
    if (!showEscrowForm){ 
        console.log("Modal hidden");
        return null;
    }

    const [convertedPrice, setConvertedPrice] = useState("");
  
    const styles = {
      overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 50,
      },
      modal: {
        backgroundColor: "white",
        padding: "32px",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "448px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        margin: "16px",
      },
      title: {
        fontSize: "20px",
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: "24px",
        margin: 0,
      },
      formContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
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
      readOnlyInput: {
        width: "100%",
        padding: "12px 16px",
        border: "2px solid #d1d5db",
        borderRadius: "12px",
        fontSize: "16px",
        backgroundColor: "#f3f4f6",
        color: "#6b7280",
        outline: "none",
        boxSizing: "border-box",
      },
      deployButton: {
        width: "100%",
        backgroundColor: "#16a34a",
        color: "white",
        padding: "12px 16px",
        borderRadius: "12px",
        border: "none",
        fontSize: "16px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "background-color 0.2s ease",
      },
      approveButton: {
        width: "100%",
        backgroundColor: "799EFF",
        color: "white",
        padding: "12px 16px",
        borderRadius: "12px",
        border: "none",
        fontSize: "16px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "background-color 0.2s ease",
      },
      cancelButton: {
        width: "100%",
        backgroundColor: "transparent",
        color: "#ef4444",
        padding: "8px 16px",
        border: "none",
        fontSize: "14px",
        cursor: "pointer",
        marginTop: "8px",
        transition: "color 0.2s ease",
      },
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
        if (!escrowData.priceUSD || isNaN(escrowData.priceUSD)) {
          return alert("Please enter a valid USD price first");
        }
        try {
        //   const res = await fetch(
        //     "https://corsproxy.io/?https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        //   );
        const res = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot');
          const data = await res.json();
          const ethRate = data.data.amount;
      
          const ethAmount = (parseFloat(escrowData.priceUSD) / ethRate).toFixed(6);
          setConvertedPrice(ethAmount);
          setEscrowData((prev) => ({ ...prev, price: ethAmount }));
      
        //   alert(`💱 $${escrowData.priceUSD} ≈ ${ethAmount} ETH`);
        } catch (err) {
          console.error("❌ Conversion failed", err);
          alert("Conversion failed. Check console.");
        }
      };
      
      useEffect(() => {
        const timeout = setTimeout(() => {
          if (escrowData.priceUSD && !isNaN(escrowData.priceUSD)) {
            convertUsdToEth();
          }
        }, 500);
        return () => clearTimeout(timeout);
      }, [escrowData.priceUSD]);

      
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <h2 style={styles.title}>Generate Escrow Contract</h2>
  
          <div style={styles.formContainer}>
            <input
              type="text"
              placeholder="Buyer Address"
              value={escrowData.buyer || ""}
              onChange={(e) => setEscrowData((prev) => ({ ...prev, buyer: e.target.value }))}
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
  
            <input
              type="text"
              placeholder="Buyer Solicitor"
              value={escrowData.buyerSolicitor || ""}
              onChange={(e) => setEscrowData((prev) => ({ ...prev, buyerSolicitor: e.target.value }))}
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
  
            <input
              type="text"
              placeholder="Seller Address"
              value={escrowData.seller || ""}
              onChange={(e) => setEscrowData((prev) => ({ ...prev, seller: e.target.value }))}
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
  
            <input
              type="number"
              placeholder="Price (USD)"
              value={escrowData.priceUSD || ""}
              onChange={(e) => setEscrowData((prev) => ({ ...prev, priceUSD: e.target.value }))}
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />

            <input
              type="number"
              placeholder="Price (ETH)"
              value={convertedPrice}
              readOnly
            //   onChange={(e) => setEscrowData((prev) => ({ ...prev, price: e.target.value }))}
            style={styles.readOnlyInput}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />

            <input type="text" value={tokenId} readOnly style={styles.readOnlyInput} />
  
            {!deployedEscrow ? (
  <>
    {/* Deploy Escrow Button */}
    <button
      onClick={handleDeployEscrow}
      style={styles.deployButton}
      onMouseEnter={(e) => (e.target.style.backgroundColor = "#15803d")}
      onMouseLeave={(e) => (e.target.style.backgroundColor = "#16a34a")}
    >
      Deploy Escrow Contract
    </button>

    {/* Cancel Button */}
    <button
      onClick={() => setShowEscrowForm(false)}
      style={styles.cancelButton}
      onMouseEnter={(e) => (e.target.style.color = "#dc2626")}
      onMouseLeave={(e) => (e.target.style.color = "#ef4444")}
    >
      Cancel
    </button>
  </>
) : (
  <>
    {/* Approve Escrow Button */}
    <button
      onClick={handleApproveNFT}
      className="bg-green-600 text-white px-6 py-2 rounded"
    >
      Approve Escrow
    </button>
  </>
)}
          </div>
        </div>
      </div>
    )
  }