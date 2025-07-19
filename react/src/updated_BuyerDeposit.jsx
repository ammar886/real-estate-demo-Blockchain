"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { propertyEscrowABI } from "./contracts"
import { Wallet, CheckCircle, DollarSign } from "lucide-react"

export default function UpdatedBuyerDeposit() {
  const [account, setAccount] = useState(null)
  const [escrowAddress, setEscrowAddress] = useState("")
  const [contract, setContract] = useState(null)
  const [price, setPrice] = useState(null)
  const [state, setState] = useState(null)
  const [roles, setRoles] = useState({})
  const [loading, setLoading] = useState(false)
  const [escrowBalance, setEscrowBalance] = useState("0")

  const connectWallet = async () => {
    if (!window.ethereum) return alert("MetaMask not found")
    const [addr] = await window.ethereum.request({ method: "eth_requestAccounts" })
    setAccount(addr)
  }

  const loadEscrowDetails = async () => {
    if (!ethers.isAddress(escrowAddress)) return alert("Invalid escrow address")
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const escrow = new ethers.Contract(escrowAddress, propertyEscrowABI, signer)
    setContract(escrow)

    // Load price and state
    const escrowPrice = await escrow.price()
    const escrowState = await escrow.getState()

    // Load roles
    const buyer = await escrow.buyer()
    const buyerSolicitor = await escrow.buyerSolicitor()
    const seller = await escrow.seller()

    // Retrieve balance
    const balance = await provider.getBalance(escrowAddress)
    const formattedBalance = ethers.formatEther(balance)

    setRoles({ buyer, buyerSolicitor, seller })
    setPrice(ethers.formatEther(escrowPrice))
    setState(Number(escrowState))
    setEscrowBalance(formattedBalance)
  }

  const handleDeposit = async () => {
    if (!contract || state !== 0) return
    try {
      if (ethers.getAddress(account) !== ethers.getAddress(roles.buyerSolicitor)) {
        return alert("Only Buyer Solicitor can deposit funds")
      }
      setLoading(true)
      const tx = await contract.deposit({ value: ethers.parseEther(price) })
      await tx.wait()
      alert("✅ Deposit successful!")
    } catch (err) {
      console.error("❌ Deposit failed", err)
      alert("Deposit failed. See console for details.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAndComplete = async () => {
    try {
      if (ethers.getAddress(account) !== ethers.getAddress(roles.buyerSolicitor)) {
        return alert("Only Buyer Solicitor can verify and complete the transaction")
      }
      const tx = await contract.verifyAndComplete()
      await tx.wait()
      alert("✅ Property and funds transferred!")
    } catch (err) {
      console.error("❌ Completion failed:", err)
      alert("Failed to complete transaction.")
    }
  }

  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: "32px",
    },
    card: {
      maxWidth: "576px",
      margin: "0 auto",
      backgroundColor: "white",
      border: "2px solid #e5e7eb",
      borderRadius: "16px",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      padding: "32px",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#1f2937",
      marginBottom: "24px",
      margin: 0,
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    section: {
      marginBottom: "24px",
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
      marginBottom: "16px",
    },
    button: {
      padding: "12px 24px",
      borderRadius: "12px",
      border: "none",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      justifyContent: "center",
    },
    primaryButton: {
      backgroundColor: "#2563eb",
      color: "white",
      width: "100%",
      marginBottom: "16px",
    },
    secondaryButton: {
      backgroundColor: "#374151",
      color: "white",
      width: "100%",
      marginBottom: "16px",
    },
    successButton: {
      backgroundColor: "#16a34a",
      color: "white",
      width: "100%",
      marginBottom: "16px",
    },
    verifyButton: {
      backgroundColor: "#059669",
      color: "white",
      width: "100%",
    },
    disabledButton: {
      backgroundColor: "#d1d5db",
      color: "#9ca3af",
      cursor: "not-allowed",
    },
    connectedText: {
      fontSize: "14px",
      color: "#6b7280",
      backgroundColor: "#f3f4f6",
      padding: "8px 12px",
      borderRadius: "8px",
      marginBottom: "16px",
    },
    detailsCard: {
      padding: "20px",
      border: "2px solid #e5e7eb",
      borderRadius: "12px",
      backgroundColor: "#f8fafc",
      marginBottom: "24px",
    },
    detailRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "12px",
      fontSize: "14px",
    },
    detailLabel: {
      fontWeight: "600",
      color: "#374151",
    },
    detailValue: {
      color: "#6b7280",
      fontFamily: "monospace",
      fontSize: "13px",
      wordBreak: "break-all",
    },
    stateValue: {
      padding: "4px 8px",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: "600",
    },
  }

  const getStateStyle = (stateNum) => {
    const states = [
      { bg: "#fef3c7", color: "#92400e" }, // AWAITING_PAYMENT - yellow
      { bg: "#dbeafe", color: "#1e40af" }, // AWAITING_VERIFICATION - blue
      { bg: "#d1fae5", color: "#065f46" }, // COMPLETE - green
      { bg: "#fee2e2", color: "#991b1b" }, // REFUNDED - red
    ]
    return { ...styles.stateValue, ...states[stateNum] }
  }

  const stateNames = ["AWAITING_PAYMENT", "AWAITING_VERIFICATION", "COMPLETE", "REFUNDED"]

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>
          <DollarSign style={{ width: "28px", height: "28px" }} />
          Buyer Solicitor Dashboard
        </h1>

        <div style={styles.section}>
          {!account ? (
            <button
              onClick={connectWallet}
              style={{ ...styles.button, ...styles.primaryButton }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#1d4ed8")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#2563eb")}
            >
              <Wallet style={{ width: "16px", height: "16px" }} />
              Connect MetaMask
            </button>
          ) : (
            <div style={styles.connectedText}>Connected: {account}</div>
          )}
        </div>

        <div style={styles.section}>
          <input
            type="text"
            placeholder="Enter Escrow Contract Address"
            value={escrowAddress}
            onChange={(e) => setEscrowAddress(e.target.value)}
            style={styles.input}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
          />

          <button
            onClick={loadEscrowDetails}
            style={{ ...styles.button, ...styles.secondaryButton }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#1f2937")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#374151")}
          >
            Load Escrow Details
          </button>
        </div>

        {price && (
          <div style={styles.detailsCard}>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Price:</span>
              <span style={styles.detailValue}>{price} ETH</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Escrow State:</span>
              <span style={getStateStyle(state)}>{stateNames[state]}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Buyer:</span>
              <span style={styles.detailValue}>{roles.buyer}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Buyer Solicitor:</span>
              <span style={styles.detailValue}>{roles.buyerSolicitor}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Seller:</span>
              <span style={styles.detailValue}>{roles.seller}</span>
            </div>
            <div style={{ ...styles.detailRow, marginBottom: 0 }}>
              <span style={styles.detailLabel}>Escrow Balance:</span>
              <span style={styles.detailValue}>{escrowBalance} ETH</span>
            </div>
          </div>
        )}

        <div style={styles.section}>
          <button
            onClick={handleDeposit}
            disabled={!price || state !== 0 || loading}
            style={{
              ...styles.button,
              ...styles.successButton,
              ...(!price || state !== 0 || loading ? styles.disabledButton : {}),
            }}
            onMouseEnter={(e) => {
              if (!(!price || state !== 0 || loading)) {
                e.target.style.backgroundColor = "#15803d"
              }
            }}
            onMouseLeave={(e) => {
              if (!(!price || state !== 0 || loading)) {
                e.target.style.backgroundColor = "#16a34a"
              }
            }}
          >
            {loading ? "Processing..." : "Deposit Funds"}
          </button>

          <button
            onClick={handleVerifyAndComplete}
            disabled={state !== 1}
            style={{
              ...styles.button,
              ...styles.verifyButton,
              ...(state !== 1 ? styles.disabledButton : {}),
            }}
            onMouseEnter={(e) => {
              if (state === 1) {
                e.target.style.backgroundColor = "#047857"
              }
            }}
            onMouseLeave={(e) => {
              if (state === 1) {
                e.target.style.backgroundColor = "#059669"
              }
            }}
          >
            <CheckCircle style={{ width: "16px", height: "16px" }} />
            Verify KYC & Complete Transfer
          </button>
        </div>
      </div>
    </div>
  )
}
