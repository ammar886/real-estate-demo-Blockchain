import { useState } from "react";
import { useEffect } from "react";
import { ethers } from "ethers"
import { propertyTokenABI, propertyTokenAddress, propertyEscrowABI, propertyEscrowBytecode } from "./contracts";
import { MapPin, Bed, Bath, Square, Home, Plus } from "lucide-react";

export default function RealEstatePlatform() {
  const [currentPage, setCurrentPage] = useState("home");
  const [nfts, setNFTs] = useState([]);
  const [walletAddress, setWalletAddress] = useState(null)
    const [provider, setProvider] = useState(null)
  const [properties, setProperties] = useState([
    {
      id: 1,
      title: "Modern Family Home",
      price: "$750,000",
      location: "Downtown, City Center",
      bedrooms: 4,
      bathrooms: 3,
      area: "2,500",
      image: "https://via.placeholder.com/400x300",
      type: "For Sale",
    },
    // ... other properties
  ]);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    location: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    type: "",
    description: "",
  });

  useEffect(() => {
    if (provider && walletAddress) {
      loadMintedProperties();
    }
  }, [provider, walletAddress]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newProperty = {
      id: properties.length + 1,
      ...formData,
      bedrooms: parseInt(formData.bedrooms),
      bathrooms: parseInt(formData.bathrooms),
      image: "https://via.placeholder.com/400x300",
    };
    setProperties([...properties, newProperty]);
    setFormData({
      title: "",
      price: "",
      location: "",
      bedrooms: "",
      bathrooms: "",
      area: "",
      type: "",
      description: "",
    });
  };

  const loadMintedProperties = async () => {
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(propertyTokenAddress, propertyTokenABI, signer);
      const newProperties = [];
  
      const nextTokenId = await contract.nextTokenId(); // <-- dynamically fetch total supply
  
      for (let tokenId = 0; tokenId < nextTokenId; tokenId++) {
        try {
          const tokenUri = await contract.tokenURI(tokenId);
          const response = await fetch(tokenUri);
          const metadata = await response.json();
          const owner = await contract.ownerOf(tokenId);
  
          newProperties.push({
            id: tokenId,
            title: metadata.name || `Property #${tokenId}`,
            description: metadata.description || "No description available",
            price: metadata.attributes?.find(attr => attr.trait_type === "Price")?.value || "N/A",
            location: metadata.attributes?.find(attr => attr.trait_type === "Location")?.value || "Unknown",
            bedrooms: metadata.attributes?.find(attr => attr.trait_type === "Bedrooms")?.value || 0,
            bathrooms: metadata.attributes?.find(attr => attr.trait_type === "Bathrooms")?.value || 0,
            area: metadata.attributes?.find(attr => attr.trait_type === "Size")?.value || "0",
            image: metadata.image || "https://via.placeholder.com/400x300",
            type: metadata.attributes?.find(attr => attr.trait_type === "Type")?.value || "For Sale",
            owner,
          });
        } catch (err) {
          console.warn(`Token ${tokenId} not found or invalid:`, err.message);
        }
      }
  
      setProperties(newProperties);
    } catch (err) {
      console.error("Failed to load minted properties:", err);
    }
  };

  async function initiateEscrow(tokenId, priceInEth) {
    try {
      const signer = await provider.getSigner();
  
      const propertyToken = new ethers.Contract(
        propertyTokenAddress,
        propertyTokenABI,
        signer
      );
  
      const escrowFactory = new ethers.ContractFactory(
        propertyEscrowABI,
        propertyEscrowBytecode,
        signer
      );
  
      const buyer = await signer.getAddress();
      const seller = await propertyToken.ownerOf(tokenId);
      const price = ethers.parseEther(priceInEth);
  
      const escrow = await escrowFactory.deploy(
        buyer,
        seller,
        price,
        propertyTokenAddress,
        tokenId
      );
  
      await escrow.waitForDeployment();
      const escrowAddress = await escrow.getAddress();
  
      console.log("✅ Escrow contract deployed:", escrowAddress);
      alert(`✅ Escrow created!\nAddress: ${escrowAddress}`);
    } catch (err) {
      console.error("❌ Escrow deployment failed:", err);
      alert("❌ Escrow creation failed. See console.");
    }
  }

  const HomePage = () => (
    <div style={{ padding: "2rem" }}>
      <h2>Properties</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
        {properties.map((p) => (
          <div key={p.id} style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}>
            <img src={p.image} alt={p.title} style={{ width: "100%", height: "200px", objectFit: "cover" }} />
            <span style={{ background: p.type === "For Sale" ? "green" : "blue", color: "white", padding: "0.25rem 0.5rem", borderRadius: "4px", display: "inline-block", marginTop: "0.5rem" }}>{p.type}</span>
            <h3>{p.title}</h3>
            <p>{p.location}</p>
            <p>{p.description}</p>
            <p>{p.bedrooms} Bed / {p.bathrooms} Bath / {p.area} sq ft</p>
            <p style={{ fontWeight: "bold" }}>{p.type}</p>
            <p><strong>Owner:</strong>{p.owner}</p>
            <button
      onClick={() => initiateEscrow(p.id, "1")} // Hardcoded price: "1" ETH
      style={{ background: "orange", color: "white", padding: "0.5rem", marginTop: "0.5rem", borderRadius: "4px" }}
    >
      Buy for 1 ETH
    </button>
          </div>
        ))}
      </div>
    </div>
  );

  const SellPage = () => (
    <div style={{ padding: "2rem" }}>
      <h2>Add Property</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "600px" }}>
        <input placeholder="Title" value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} required />
        <input placeholder="Price" value={formData.price} onChange={(e) => handleInputChange("price", e.target.value)} required />
        <input placeholder="Location" value={formData.location} onChange={(e) => handleInputChange("location", e.target.value)} required />
        <input placeholder="Bedrooms" type="number" value={formData.bedrooms} onChange={(e) => handleInputChange("bedrooms", e.target.value)} required />
        <input placeholder="Bathrooms" type="number" value={formData.bathrooms} onChange={(e) => handleInputChange("bathrooms", e.target.value)} required />
        <input placeholder="Area (sq ft)" value={formData.area} onChange={(e) => handleInputChange("area", e.target.value)} required />
        <select value={formData.type} onChange={(e) => handleInputChange("type", e.target.value)} required>
          <option value="">Select Type</option>
          <option value="For Sale">For Sale</option>
          <option value="For Rent">For Rent</option>
        </select>
        <textarea placeholder="Description" value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} rows="4" />
        <button type="submit" style={{ background: "blue", color: "white", padding: "0.75rem", borderRadius: "4px" }}>Submit Property</button>
      </form>
    </div>
  );

  <div style={{ padding: "2rem" }}>
  <h2>Minted NFTs</h2>
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
    {nfts.map((nft) => (
      <div key={nft.tokenId} style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}>
        <img src={nft.image} alt={nft.name} style={{ width: "100%", height: "200px", objectFit: "cover" }} />
        <h3>{nft.name}</h3>
        <p>{nft.description}</p>
        <p><strong>Owner:</strong> {nft.owner}</p>
      </div>
    ))}
  </div>
</div>

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask is not installed!");
      return;
    }
  
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const selectedAddress = accounts[0];
      setWalletAddress(selectedAddress);
  
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethersProvider);
  
      console.log("Connected wallet:", selectedAddress);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };
  
  const mintPropertyNFT = async () => {
    console.log("⛏ Starting mintPropertyNFT");
  
    if (!provider) {
      console.log("❌ No provider found");
      alert("Connect wallet first");
      return;
    }
  
    try {
      const signer = await provider.getSigner();
      console.log("✅ Got signer:", signer);
  
      const contract = new ethers.Contract(propertyTokenAddress, propertyTokenABI, signer);
      console.log("✅ Connected to contract:", contract);
  
      const tokenURI = prompt("Enter token URI (e.g., IPFS or metadata URL)");
      if (!tokenURI) {
        console.log("❌ No token URI entered");
        return;
      }
  
      console.log("🚀 Calling mint with:", walletAddress, tokenURI);
      const tx = await contract.mint(walletAddress, tokenURI);
      console.log("⏳ Waiting for tx to confirm...");
      await tx.wait();
  
      alert("✅ NFT minted successfully!");
      console.log("🎉 Minted NFT:", tx);
      await loadMintedProperties();
    } catch (error) {
      console.error("🔥 Mint failed:", error);
      alert("Minting failed. See console for details.");
    }
  };

  const loadNFTs = async () => {
    if (!provider) {
      alert("Connect wallet first");
      return;
    }
  
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(propertyTokenAddress, propertyTokenABI, signer);
  
      const nextTokenId = await contract.nextTokenId();
      const fetchedNFTs = [];
  
      for (let i = 0; i < nextTokenId; i++) {
        const tokenURI = await contract.tokenURI(i);
        const owner = await contract.ownerOf(i);
        console.log(owner);
        const response = await fetch(tokenURI);
        const metadata = await response.json();
  
        fetchedNFTs.push({
          tokenId: i,
          owner,
          ...metadata, // assumes metadata contains image, name, description etc.
        });
      }
  
      setNFTs(fetchedNFTs);
    } catch (err) {
      console.error("Failed to load NFTs:", err);
    }
  };

  async function depositEarnest() {
    try {
      const signer = await provider.getSigner();
      const escrow = new ethers.Contract(
        "0x198c46853A9050A236bD0990bCeb99FD72D69F39", // 👈 Replace this
        propertyEscrowABI,
        signer
      );
  
      const tx = await escrow.deposit({ value: ethers.parseEther("1") });
      await tx.wait();
  
      alert("✅ Earnest money deposited!");
      console.log("💰 Earnest deposit successful:", tx);
    } catch (err) {
      console.error("❌ Deposit failed:", err);
      alert("❌ Deposit failed. See console.");
    }
  }

  async function finalizeSale() {
    try {
      const signer = await provider.getSigner();
      const escrow = new ethers.Contract(
        "0x198c46853A9050A236bD0990bCeb99FD72D69F39", // 👈 Same address as before
        propertyEscrowABI,
        signer
      );
  
      const tx = await escrow.verifyAndComplete();
      await tx.wait();
  
      alert("✅ Property ownership transferred and funds released!");
      console.log("🏁 Finalization successful:", tx);
    } catch (err) {
      console.error("❌ Finalization failed:", err);
      alert("❌ Finalization failed. See console.");
    }
  }

  async function getEscrowState(escrowAddress) {
    try {
      const signer = await provider.getSigner();
      const escrowContract = new ethers.Contract(
        escrowAddress,
        propertyEscrowABI,
        signer
      );
  
      const state = await escrowContract.getState();
      // state is a number between 0–3
      const stateMap = ["AWAITING_PAYMENT", "AWAITING_VERIFICATION", "COMPLETE", "REFUNDED"];
      alert(`🧾 Escrow State: ${stateMap[state]}`);
    } catch (err) {
      console.error("❌ Failed to get escrow state:", err);
      alert("Error fetching escrow state. See console.");
    }
  }
  
  

  return (
    <div>
      <header style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
        <h1 style={{ color: "blue" }}>RealEstate</h1>
        <nav>
        <button onClick={depositEarnest} style={{ background: "purple", color: "white", padding: "0.5rem", borderRadius: "4px" }}>
  Deposit Earnest
</button>
<button onClick={finalizeSale} style={{ background: "green", color: "white", padding: "0.5rem", marginTop: "1rem", borderRadius: "4px" }}>
  Finalize Sale
</button>
<button
  onClick={() => getEscrowState("0xYourEscrowContractAddress")}
  style={{ marginTop: "0.5rem", background: "purple", color: "white", padding: "0.5rem", borderRadius: "4px" }}
>
  Check Escrow State
</button>
          <button onClick={() => setCurrentPage("home")} style={{ marginRight: "1rem" }}>Home</button>
          <button onClick={() => setCurrentPage("sell")} style={{ marginRight: "1rem" }}>Sell</button>
          <button onClick={connectWallet} style={{ background: "blue", color: "white", padding: "0.5rem 1rem", borderRadius: "4px" }}>
            {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect"}
            </button>
            <button
  onClick={() => {
    console.log("Mint button clicked!");
    mintPropertyNFT();
  }}
  style={{
    marginLeft: "1rem",
    background: "green",
    color: "white",
    padding: "0.5rem 1rem",
    borderRadius: "4px",
  }}
>
  Mint
</button>
<button onClick={loadNFTs} style={{ marginLeft: "1rem", background: "orange", color: "white", padding: "0.5rem 1rem", borderRadius: "4px" }}>
  Load NFTs
</button>
        </nav>
      </header>
      {currentPage === "home" ? <HomePage /> : <SellPage />}
    </div>
  );
}
