"use client"

import { useState, useEffect } from "react"
import { Upload, Wallet, CheckCircle, DollarSign, Search } from "lucide-react"
import EscrowModal from "./components/escrow-modal"
import { ethers } from "ethers"
import { propertyTokenAddress, propertyTokenABI, propertyEscrowABI, propertyEscrowBytecode } from "./contracts"

export default function BlocVeyDemo() {
  // Shared state
  const [activeTab, setActiveTab] = useState("seller")
  const [account, setAccount] = useState(null)

  // Seller side state
  const [tokenId, setTokenId] = useState(null)
  const [isApproved, setIsApproved] = useState(null)
  const [deployedEscrow, setDeployedEscrow] = useState(null)
  const [escrowData, setEscrowData] = useState({
    buyer: "",
    buyerSolicitor: "",
    seller: "",
    price: "",
    priceUSD: "",
  })
  const [showEscrowForm, setShowEscrowForm] = useState(false)
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
  })
  const [isFormValid, setIsFormValid] = useState(false)

  // Buyer side state
  const [escrowAddress, setEscrowAddress] = useState("")
  const [contract, setContract] = useState(null)
  const [price, setPrice] = useState(null)
  const [state, setState] = useState(null)
  const [roles, setRoles] = useState({})
  const [loading, setLoading] = useState(false)
  const [escrowBalance, setEscrowBalance] = useState("0")
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(null)

  // Owner check state (shared)
  const [ownerCheckTokenId, setOwnerCheckTokenId] = useState("")
  const [ownerAddress, setOwnerAddress] = useState("")
  const [ownerLoading, setOwnerLoading] = useState(false)

  // Auto-refresh escrow details when contract is loaded
  useEffect(() => {
    if (contract && autoRefresh) {
      const interval = setInterval(async () => {
        try {
          await loadEscrowDetailsInternal()
        } catch (err) {
          console.error("Auto-refresh failed:", err)
        }
      }, 5000) // Refresh every 5 seconds

      setRefreshInterval(interval)
      return () => clearInterval(interval)
    } else if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    }
  }, [contract, autoRefresh])

  // Auto-refresh after successful transactions
  useEffect(() => {
    if (contract && !loading) {
      // Small delay to allow blockchain to update
      const timeout = setTimeout(() => {
        loadEscrowDetailsInternal()
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [loading, contract])

  useEffect(() => {
    validateForm()
  }, [metadata])

  // Shared wallet connection
  const connectWallet = async () => {
    try {
      console.log("Clicking...")
      if (!window.ethereum) return alert("Install MetaMask")
      const [addr] = await window.ethereum.request({ method: "eth_requestAccounts" })
      alert("Connected: " + addr)
      setAccount(addr)
    } catch (err) {
      console.error(err)
      alert("Error connecting")
    }
  }

  // Owner check function
  const checkOwner = async (tokenIdToCheck) => {
    if (!tokenIdToCheck || tokenIdToCheck.trim() === "") {
      setOwnerAddress("")
      return
    }

    try {
      setOwnerLoading(true)
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(propertyTokenAddress, propertyTokenABI, signer)
      const owner = await contract.ownerOf(tokenIdToCheck)
      setOwnerAddress(owner)
    } catch (err) {
      console.error("❌ Failed to fetch owner", err)
      setOwnerAddress("Token not found or invalid")
    } finally {
      setOwnerLoading(false)
    }
  }

  // Clear form function
  const clearForm = () => {
    setMetadata({
      title: "",
      location: "",
      description: "",
      image: null,
    })
    setFormData({
      title: "",
      description: "",
      location: "",
      image: null,
    })
  }

  // Seller side functions
  const handleDeployEscrow = async () => {
    const { buyer, buyerSolicitor, seller, price } = escrowData

    if (!buyer || !buyerSolicitor || !seller || !price || tokenId === null) {
      return alert("Please fill all fields")
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      const escrowFactory = new ethers.ContractFactory(propertyEscrowABI, propertyEscrowBytecode, signer)

      const formattedPrice = ethers.parseEther(price)
      const tokenIdBigInt = BigInt(tokenId)

      console.log("Deploying with args:", {
        buyer,
        buyerSolicitor,
        seller,
        formattedPrice,
        propertyTokenAddress,
        tokenIdBigInt,
      })

      const escrow = await escrowFactory.deploy(
        buyer,
        buyerSolicitor,
        seller,
        formattedPrice,
        propertyTokenAddress,
        tokenIdBigInt,
      )

      await escrow.waitForDeployment()
      const escrowAddress = await escrow.getAddress()
      console.log("🚀 Deployed Escrow Address:", escrowAddress)
      setDeployedEscrow(escrowAddress)

      alert(`✅ Escrow contract deployed at ${escrowAddress}`)
      console.log("Escrow deployed at:", escrowAddress)
    } catch (err) {
      console.error("❌ Escrow deployment failed:", err)
      alert("Escrow deployment failed. See console.")
    }
  }

  const handleApproveNFT = async () => {
    console.log("💡 deployedEscrow:", deployedEscrow)
    console.log("💡 tokenId:", tokenId)

    if (!deployedEscrow || tokenId === null || tokenId === undefined) {
      alert("Missing escrow address or token ID")
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(propertyTokenAddress, propertyTokenABI, signer)

      const tokenIdBigInt = BigInt(tokenId)
      const tx = await contract.approve(deployedEscrow, tokenIdBigInt)
      await tx.wait()

      alert("✅ Escrow approved successfully!")
      console.log(showEscrowForm)
      setShowEscrowForm(false)
      setIsApproved(true)

      // Clear the form after successful approval
      clearForm()

      console.log(showEscrowForm)
      console.log("✅ Approve transaction:", tx)
    } catch (error) {
      console.error("❌ Approve failed:", error)
      alert("NFT approval failed. See console.")
    }
  }

  const handleInputChange = (field, value) => {
    setMetadata((prev) => ({ ...prev, [field]: value }))
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      setMetadata((prev) => ({ ...prev, image: file }))
    }
  }

  const handleMint = async () => {
    if (!account) return alert("Please connect MetaMask first")
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(propertyTokenAddress, propertyTokenABI, signer)

      const tokenMetadata = {
        title: metadata.title,
        description: metadata.description,
        location: metadata.location,
        image: metadata.image,
      }
      const tokenURI = "data:application/json;base64," + btoa(JSON.stringify(tokenMetadata))

      const tx = await contract.mint(account, tokenURI)
      await tx.wait()
      const nextTokenId = await contract.nextTokenId()
      const mintedTokenId = BigInt(nextTokenId) - 1n
      setTokenId(mintedTokenId.toString())
      setDeployedEscrow(null)
      setIsApproved(false)
      setEscrowData({
        buyer: "",
        buyerSolicitor: "",
        seller: "",
        price: "",
      })
      alert(`✅ Property NFT minted! Token ID: ${mintedTokenId}`)
      setShowEscrowForm(true)
    } catch (err) {
      console.error("❌ Mint failed", err)
      alert("Mint failed. See console for error.")
    }
  }

  const validateForm = () => {
    const isValid =
      metadata.title.trim() !== "" &&
      metadata.description.trim() !== "" &&
      metadata.location.trim() !== "" &&
      metadata.image !== null
    setIsFormValid(isValid)
  }

  // Internal function for auto-refresh (no alerts)
  const loadEscrowDetailsInternal = async () => {
    if (!contract) return
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)

      const escrowPrice = await contract.price()
      const escrowState = await contract.getState()

      const buyer = await contract.buyer()
      const buyerSolicitor = await contract.buyerSolicitor()
      const seller = await contract.seller()

      const balance = await provider.getBalance(escrowAddress)
      const formattedBalance = ethers.formatEther(balance)

      setRoles({ buyer, buyerSolicitor, seller })
      setPrice(ethers.formatEther(escrowPrice))
      setState(Number(escrowState))
      setEscrowBalance(formattedBalance)
    } catch (err) {
      console.error("Failed to refresh escrow details:", err)
    }
  }

  // Modified original function to enable auto-refresh
  const loadEscrowDetails = async () => {
    if (!ethers.isAddress(escrowAddress)) return alert("Invalid escrow address")
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const escrow = new ethers.Contract(escrowAddress, propertyEscrowABI, signer)
    setContract(escrow)

    const escrowPrice = await escrow.price()
    const escrowState = await escrow.getState()

    const buyer = await escrow.buyer()
    const buyerSolicitor = await escrow.buyerSolicitor()
    const seller = await escrow.seller()

    const balance = await provider.getBalance(escrowAddress)
    const formattedBalance = ethers.formatEther(balance)

    setRoles({ buyer, buyerSolicitor, seller })
    setPrice(ethers.formatEther(escrowPrice))
    setState(Number(escrowState))
    setEscrowBalance(formattedBalance)

    // Enable auto-refresh after first successful load
    setAutoRefresh(true)
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

  const shortenAddress = (addr) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "")

  const getStateStyle = (stateNum) => {
    const states = [
      { bg: "#fef3c7", color: "#92400e" },
      { bg: "#dbeafe", color: "#1e40af" },
      { bg: "#d1fae5", color: "#065f46" },
      { bg: "#fee2e2", color: "#991b1b" },
    ]
    return { ...styles.stateValue, ...states[stateNum] }
  }

  const stateNames = ["AWAITING_PAYMENT", "AWAITING_VERIFICATION", "COMPLETE", "REFUNDED"]

  const styles = {
    container: {
      minHeight: "100vh",
      width: "100vw",
      background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: "flex",
      flexDirection: "column",
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
    connectedStatus: {
      fontSize: "14px",
      color: "#16a34a",
      fontWeight: "500",
    },
    main: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px",
      flexGrow: 1,
      width: "100%",
    },
    card: {
      width: "100%",
      maxWidth: activeTab === "seller" ? "448px" : "576px",
      backgroundColor: "white",
      border: "2px solid #e5e7eb",
      borderRadius: "16px",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    },
    cardContent: {
      padding: "32px",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#1f2937",
      marginBottom: "24px",
    //   margin: 0,
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    fieldContainer: {
      marginBottom: "24px",
    },
    section: {
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
      marginBottom: activeTab === "buyer" ? "16px" : "0px",
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
    pulseAnimation: `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `,
    imagePreviewContainer: {
      position: "relative",
      marginTop: "16px",
      display: "inline-block",
    },
    imagePreview: {
      width: "200px",
      height: "150px",
      objectFit: "cover",
      borderRadius: "12px",
      border: "2px solid #e5e7eb",
    },
    removeImageButton: {
      position: "absolute",
      top: "-8px",
      right: "-8px",
      width: "24px",
      height: "24px",
      borderRadius: "50%",
      backgroundColor: "#ef4444",
      color: "white",
      border: "none",
      cursor: "pointer",
      fontSize: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
    },
    ownerCheckContainer: {
      padding: "20px",
      border: "2px solid #e5e7eb",
      borderRadius: "12px",
      backgroundColor: "#f8fafc",
      marginBottom: "24px",
    },
    ownerCheckTitle: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#374151",
      marginBottom: "12px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    ownerInputContainer: {
      display: "flex",
      gap: "12px",
      alignItems: "center",
      marginBottom: "12px",
    },
    ownerInput: {
      flex: 1,
      padding: "8px 12px",
      border: "2px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
      outline: "none",
    },
    checkButton: {
      padding: "8px 16px",
      backgroundColor: "#6366f1",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },
    ownerResult: {
      padding: "8px 12px",
      backgroundColor: "white",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "13px",
      fontFamily: "monospace",
      color: "#374151",
      wordBreak: "break-all",
    },
  }

  const renderOwnerCheck = () => (
    <div style={styles.ownerCheckContainer}>
      <div style={styles.ownerCheckTitle}>
        <Search style={{ width: "16px", height: "16px" }} />
        Check Property Owner
      </div>
      <div style={styles.ownerInputContainer}>
        <input
          type="text"
          placeholder="Enter Token ID"
          value={ownerCheckTokenId}
          onChange={(e) => {
            setOwnerCheckTokenId(e.target.value)
            if (e.target.value.trim() === "") {
              setOwnerAddress("")
            }
          }}
          style={styles.ownerInput}
          onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
          onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
        />
        <button
          onClick={() => checkOwner(ownerCheckTokenId)}
          disabled={!ownerCheckTokenId.trim() || ownerLoading}
          style={{
            ...styles.checkButton,
            ...(!ownerCheckTokenId.trim() || ownerLoading ? { backgroundColor: "#d1d5db", cursor: "not-allowed" } : {}),
          }}
          onMouseEnter={(e) => {
            if (ownerCheckTokenId.trim() && !ownerLoading) {
              e.target.style.backgroundColor = "#4f46e5"
            }
          }}
          onMouseLeave={(e) => {
            if (ownerCheckTokenId.trim() && !ownerLoading) {
              e.target.style.backgroundColor = "#6366f1"
            }
          }}
        >
          <Search style={{ width: "14px", height: "14px" }} />
          {ownerLoading ? "Checking..." : "Check"}
        </button>
      </div>
      {ownerAddress && (
        <div style={styles.ownerResult}>{ownerAddress.startsWith("0x") ? `Owner: ${ownerAddress}` : ownerAddress}</div>
      )}
    </div>
  )

  const renderSellerContent = () => (
    <div style={styles.cardContent}>
      {renderOwnerCheck()}

      <div style={styles.fieldContainer}>
        <label htmlFor="title" style={styles.label}>
          Title <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <input
          id="title"
          type="text"
          value={metadata.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          style={styles.input}
          placeholder="Enter NFT title"
          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
          onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
          required
        />
      </div>

      <div style={styles.fieldContainer}>
        <label htmlFor="description" style={styles.label}>
          Description <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <textarea
          id="description"
          value={metadata.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          style={styles.textarea}
          rows={3}
          placeholder="Describe your NFT"
          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
          onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
          required
        />
      </div>

      <div style={styles.fieldContainer}>
        <label htmlFor="location" style={styles.label}>
          Location <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <input
          id="location"
          type="text"
          value={metadata.location}
          onChange={(e) => handleInputChange("location", e.target.value)}
          style={styles.input}
          placeholder="Enter location"
          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
          onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
          required
        />
      </div>

      <div style={styles.fieldContainer}>
        <label style={styles.label}>
          Image <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <div style={styles.uploadContainer}>
          <label htmlFor="image-upload" style={styles.uploadLabel}>
            <div
              style={styles.uploadBox}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#e5e7eb")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#f3f4f6")}
            >
              <Upload style={{ width: "16px", height: "16px", marginRight: "8px", color: "#6b7280" }} />
              <span style={styles.uploadText}>{metadata.image ? metadata.image.name : "Upload"}</span>
            </div>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={styles.hiddenInput}
              required
            />
          </label>
        </div>

        {metadata.image && (
          <div style={styles.imagePreviewContainer}>
            <img
              src={URL.createObjectURL(metadata.image) || "/placeholder.svg"}
              alt="Preview"
              style={styles.imagePreview}
            />
            <button onClick={() => handleInputChange("image", null)} style={styles.removeImageButton} type="button">
              ✕
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleMint}
        disabled={!isFormValid}
        style={{
          ...styles.mintButton,
          ...(isFormValid ? {} : styles.disabledButton),
        }}
        onMouseEnter={(e) => {
          if (isFormValid) {
            e.target.style.backgroundColor = "#1d4ed8"
          }
        }}
        onMouseLeave={(e) => {
          if (isFormValid) {
            e.target.style.backgroundColor = "#2563eb"
          }
        }}
      >
        {isFormValid ? "Mint" : "Please fill all required fields"}
      </button>
    </div>
  )

  const renderBuyerContent = () => (
    <div style={styles.cardContent}>
      <h1 style={styles.title}>
        <DollarSign style={{ width: "28px", height: "28px" }} />
        Buyer Solicitor Dashboard
      </h1>

      {renderOwnerCheck()}

      {/* <div style={styles.section}>
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
      </div> */}

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
        {contract && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontSize: "12px",
              color: "#6b7280",
              marginTop: "8px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: autoRefresh ? "#16a34a" : "#d1d5db",
                animation: autoRefresh ? "pulse 2s infinite" : "none",
              }}
            ></div>
            {autoRefresh ? "Auto-refreshing every 5s" : "Auto-refresh disabled"}
          </div>
        )}
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
  )

  return (
    <>
      <div style={styles.container}>
        {/* Shared Header */}
        <header style={styles.header}>
          <div style={styles.logo}>
            <div style={styles.logoBox}>
              <h1 style={styles.logoText}>BlocVey Demo</h1>
            </div>
          </div>

          <div style={styles.tabContainer}>
            <button
              onClick={() => {
                if (activeTab === "buyer" && refreshInterval) {
                  clearInterval(refreshInterval)
                  setAutoRefresh(false)
                }
                setActiveTab("seller")
              }}
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
              onClick={() => {
                setActiveTab("buyer")
              }}
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
            <div style={styles.connectedStatus}>
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

        {/* Dynamic Content */}
        <main style={styles.main}>
          <div style={styles.card}>{activeTab === "seller" ? renderSellerContent() : renderBuyerContent()}</div>
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
  )
}
