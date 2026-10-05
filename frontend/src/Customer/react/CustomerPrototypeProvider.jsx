import { useEffect, useState } from 'react';
import { CustomerPrototypeContext } from './CustomerPrototypeContext';

const STORAGE_KEY = 'revinsightCustomerPrototype';
function readInitialState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      cart: Array.isArray(saved.cart) ? saved.cart : [],
      wishlist: Array.isArray(saved.wishlist) ? saved.wishlist : [],
      orders: Array.isArray(saved.orders) ? saved.orders : [],
      reservations: Array.isArray(saved.reservations) ? saved.reservations : [],
      vehicles: Array.isArray(saved.vehicles) ? saved.vehicles : [],
      addresses: Array.isArray(saved.addresses) ? saved.addresses : [],
      promoCode: saved.promoCode || '',
      profile: saved.profile || JSON.parse(localStorage.getItem('customerUser') || '{}')
    };
  } catch {
    return { cart: [], wishlist: [], orders: [], reservations: [], vehicles: [], addresses: [], promoCode: '', profile: {} };
  }
}

export function CustomerPrototypeProvider({ children }) {
  const [state, setState] = useState(readInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addCartItem = (item) => {
    const key = item.kind === 'service'
      ? `${item.id}:${item.bookingDate}:${item.timeSlot}`
      : item.id;
    setState((current) => {
      const existing = current.cart.find((entry) => entry.key === key);
      const cart = existing
        ? current.cart.map((entry) => entry.key === key ? { ...entry, quantity: Math.min(entry.quantity + (item.quantity || 1), entry.stock ?? Infinity) } : entry)
        : [...current.cart, { ...item, key, quantity: item.kind === 'service' ? 1 : item.quantity || 1 }];
      return { ...current, cart };
    });
  };

  const updateCartItem = (key, quantity) => setState((current) => ({
    ...current,
    cart: current.cart.map((item) => item.key === key
      ? { ...item, quantity: Math.max(1, Math.min(Number(quantity) || 1, item.kind === 'service' ? 1 : item.stock ?? Infinity)) }
      : item)
  }));

  const removeCartItem = (key) => setState((current) => ({ ...current, cart: current.cart.filter((item) => item.key !== key) }));
  const applyPromoCode = (code) => {
    const normalizedCode = code.trim().toUpperCase();
    if (!['RIDE10', 'WRENCH15'].includes(normalizedCode)) return false;
    setState((current) => ({ ...current, promoCode: normalizedCode }));
    return true;
  };
  const toggleWishlist = (productId) => setState((current) => ({
    ...current,
    wishlist: current.wishlist.includes(productId)
      ? current.wishlist.filter((id) => id !== productId)
      : [...current.wishlist, productId]
  }));

  const placeOrder = (checkout) => {
    const orderId = `ORD-${Date.now().toString().slice(-7)}`;
    const createdAt = new Date().toISOString();
    const items = state.cart.map((item) => ({ ...item }));
    const order = { id: orderId, createdAt, items, total: checkout.total, status: 'Confirmed', ...checkout };
    const reservations = items.filter((item) => item.kind === 'service').map((item, index) => ({
      ...item,
      id: `RSV-${orderId.slice(-5)}${index + 1}`,
      orderId,
      createdAt,
      status: 'Confirmed',
      timeline: [
        { label: 'Reservation received', date: createdAt, complete: true },
        { label: 'Mechanic assigned', date: null, complete: false },
        { label: 'Work in progress', date: null, complete: false },
        { label: 'Ready for pickup', date: null, complete: false }
      ]
    }));
    setState((current) => ({
      ...current,
      cart: [],
      orders: [order, ...current.orders],
      reservations: [...reservations, ...current.reservations]
    }));
    return order;
  };

  const updateProfile = (profile) => setState((current) => ({ ...current, profile: { ...current.profile, ...profile } }));
  const addVehicle = (vehicle) => setState((current) => ({ ...current, vehicles: [...current.vehicles, { ...vehicle, id: `VEH-${Date.now()}` }] }));
  const addAddress = (address) => setState((current) => ({ ...current, addresses: [...current.addresses, { ...address, id: `ADDR-${Date.now()}` }] }));

  return (
    <CustomerPrototypeContext.Provider value={{ ...state, addCartItem, updateCartItem, removeCartItem, applyPromoCode, toggleWishlist, placeOrder, updateProfile, addVehicle, addAddress }}>
      {children}
    </CustomerPrototypeContext.Provider>
  );
}