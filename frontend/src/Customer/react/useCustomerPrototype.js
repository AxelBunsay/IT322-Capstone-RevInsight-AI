import { useContext } from 'react';
import { CustomerPrototypeContext } from './CustomerPrototypeContext';

export function useCustomerPrototype() {
  const context = useContext(CustomerPrototypeContext);
  if (!context) throw new Error('useCustomerPrototype must be used within CustomerPrototypeProvider');
  return context;
}