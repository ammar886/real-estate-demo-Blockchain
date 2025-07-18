import { useState } from "react";

export default function SellerPanel() {
  const [mintedTokenId, setMintedTokenId] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-10">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          🔑 Seller Solicitor Dashboard
        </h1>

        {/* Mint Property Form */}
        <div className="bg-white p-6 rounded-2xl shadow space-y-6 border border-gray-200">
          <h2 className="text-xl font-semibold">🏡 Step 1: Mint Property NFT</h2>

          <div className="space-y-4">
            <input
              placeholder="Property Title"
              className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            />
            <input
              placeholder="Location"
              className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            />
            <textarea
              placeholder="Description"
              className="w-full border px-4 py-2 rounded-lg resize-none focus:outline-none focus:ring focus:ring-blue-300"
            />
            <input
              placeholder="Image URL or IPFS CID"
              className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>

          <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
            Mint Property NFT
          </button>

          {mintedTokenId && (
            <div className="text-green-600 font-medium mt-2">
              ✅ Minted Token ID: {mintedTokenId}
            </div>
          )}
        </div>

        {/* Deploy Escrow Form */}
        <div className="bg-white p-6 rounded-2xl shadow space-y-6 border border-gray-200">
          <h2 className="text-xl font-semibold">🤝 Step 2: Deploy Escrow Contract</h2>

          <div className="space-y-4">
            <input
              placeholder="Buyer Solicitor Address"
              className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring focus:ring-green-300"
            />
            <input
              placeholder="Price in ETH"
              className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring focus:ring-green-300"
            />
            <input
              placeholder="Token ID (from mint above)"
              className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring focus:ring-green-300"
            />
          </div>

          <button className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
            Deploy Escrow Contract
          </button>
        </div>
      </div>
    </div>
  );
}