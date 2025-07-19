// src/EscrowDashboard.jsx
import { useState } from "react"
import UpdatedBuyerDeposit from "./updated_BuyerDeposit"
import BlocVeyDemo from "./updated_mint_property" // seller view

export default function EscrowDashboard() {
  const [activeTab, setActiveTab] = useState("seller")

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", padding: "40px" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        {/* Tab Buttons */}
        <div style={{ display: "flex", marginBottom: "24px", gap: "12px" }}>
          <button
            onClick={() => setActiveTab("seller")}
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: activeTab === "seller" ? "#2563eb" : "#e5e7eb",
              color: activeTab === "seller" ? "#ffffff" : "#1f2937",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Seller Dashboard
          </button>
          <button
            onClick={() => setActiveTab("buyer")}
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: activeTab === "buyer" ? "#2563eb" : "#e5e7eb",
              color: activeTab === "buyer" ? "#ffffff" : "#1f2937",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Buyer Dashboard
          </button>
        </div>

        {/* Conditional Views */}
        {activeTab === "seller" ? <BlocVeyDemo /> : <UpdatedBuyerDeposit />}
      </div>
    </div>
  )
}
