  import { useState } from "react";
  import { ethers } from "ethers";
  import { propertyEscrowABI } from "./contracts";

  export default function BuyerDeposit() {
    const [account, setAccount] = useState(null);
    const [escrowAddress, setEscrowAddress] = useState("");
    const [contract, setContract] = useState(null);
    const [price, setPrice] = useState(null);
    const [state, setState] = useState(null);
    const [roles, setRoles] = useState({});
    const [loading, setLoading] = useState(false);
    const [escrowBalance, setEscrowBalance] = useState("0")

    const connectWallet = async () => {
      if (!window.ethereum) return alert("MetaMask not found");
      const [addr] = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(addr);
    };

    const loadEscrowDetails = async () => {
      if (!ethers.isAddress(escrowAddress)) return alert("Invalid escrow address");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const escrow = new ethers.Contract(escrowAddress, propertyEscrowABI, signer);
      setContract(escrow);

      // Load price and state
      const escrowPrice = await escrow.price();
      const escrowState = await escrow.getState();

      // Load roles
      const buyer = await escrow.buyer();
      const buyerSolicitor = await escrow.buyerSolicitor();
      const seller = await escrow.seller();

      //retrieve balance
      const balance = await provider.getBalance(escrowAddress);
      const formattedBalance = ethers.formatEther(balance);

      setRoles({ buyer, buyerSolicitor, seller });
      setPrice(ethers.formatEther(escrowPrice));
      setState(Number(escrowState));
      setEscrowBalance(formattedBalance);
    };

    const handleDeposit = async () => {
      if (!contract || state !== 0) return;

      try {
        if (ethers.getAddress(account) !== ethers.getAddress(roles.buyerSolicitor)) {
          return alert("Only Buyer Solicitor can deposit funds");
        }

        setLoading(true);
        const tx = await contract.deposit({ value: ethers.parseEther(price) });
        await tx.wait();
        alert("✅ Deposit successful!");
      } catch (err) {
        console.error("❌ Deposit failed", err);
        alert("Deposit failed. See console for details.");
      } finally {
        setLoading(false);
      }
    };

    const handleVerifyAndComplete = async () => {
      try {
        if (ethers.getAddress(account) !== ethers.getAddress(roles.buyerSolicitor)) {
          return alert("Only Buyer Solicitor can verify and complete the transaction");
        }

        const tx = await contract.verifyAndComplete();
        await tx.wait();
        alert("✅ Property and funds transferred!");
      } catch (err) {
        console.error("❌ Completion failed:", err);
        alert("Failed to complete transaction.");
      }
    };

    return (
      <div className="max-w-xl mx-auto p-6 space-y-6 text-gray-800">
        <h1 className="text-2xl font-bold">💼 Buyer Solicitor Dashboard</h1>

        {!account ? (
          <button onClick={connectWallet} className="bg-blue-600 text-white px-4 py-2 rounded">
            Connect MetaMask
          </button>
        ) : (
          <p className="text-sm text-gray-600">Connected: {account}</p>
        )}

        <input
          type="text"
          placeholder="Enter Escrow Contract Address"
          value={escrowAddress}
          onChange={(e) => setEscrowAddress(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />

        <button onClick={loadEscrowDetails} className="bg-gray-700 text-white px-4 py-2 rounded">
          Load Escrow Details
        </button>

        {price && (
          <div className="p-4 border rounded space-y-2 bg-gray-100">
            <p><strong>Price:</strong> {price} ETH</p>
            <p><strong>Escrow State:</strong> {["AWAITING_PAYMENT", "AWAITING_VERIFICATION", "COMPLETE", "REFUNDED"][state]}</p>
            <p><strong>Buyer:</strong> {roles.buyer}</p>
            <p><strong>Buyer Solicitor:</strong> {roles.buyerSolicitor}</p>
            <p><strong>Seller:</strong> {roles.seller}</p>
            <p><strong>Escrow Balance:</strong> {escrowBalance} ETH</p>
          </div>
        )}

        <button
          onClick={handleDeposit}
          disabled={!price || state !== 0 || loading}
          className="bg-green-600 text-white px-6 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Processing..." : "Deposit Funds"}
        </button>

        <button
          onClick={handleVerifyAndComplete}
          disabled={state !== 1}
          className="bg-green-700 text-white px-4 py-2 rounded"
        >
          ✅ Verify KYC & Complete Transfer
        </button>
      </div>
    );
  }
