// src/contracts.js
import PropertyTokenABI from './abis/PropertyToken.json';
import PropertyEscrowABI from './abis/PropertyEscrow.json';

export const propertyTokenAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
export const propertyEscrowAddress = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';

export const propertyTokenABI = PropertyTokenABI.abi;
export const propertyEscrowABI = PropertyEscrowABI.abi;
export const propertyEscrowBytecode = PropertyEscrowABI.bytecode;