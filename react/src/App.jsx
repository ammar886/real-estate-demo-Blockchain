// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import MintProperty from './MintProperty.jsx';
import BuyerDeposit from './BuyerDeposit.jsx'; // or wherever it's located
import BlocVeyDemo from './updated_mint_property.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MintProperty />} />
      <Route path="/BuyerDeposit" element={<BuyerDeposit />} />
      <Route path="/BlocVeyDemo" element={<BlocVeyDemo />} />
      <Route path="*" element={<h1>404 - Not Found</h1>} />
    </Routes>
  );
}
