// src/contracts.js
import PropertyTokenABI from './abis/PropertyToken.json';
import PropertyEscrowABI from './abis/PropertyEscrow.json';

export const propertyTokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
export const propertyEscrowAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';

export const propertyTokenABI = PropertyTokenABI.abi;
export const propertyEscrowABI = PropertyEscrowABI.abi;
export const propertyEscrowBytecode = PropertyEscrowABI.bytecode;