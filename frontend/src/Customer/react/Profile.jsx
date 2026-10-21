import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomerPage } from './CustomerLayout';
import { useCustomerPrototype } from './useCustomerPrototype';
import '../styles/customer-flow.css';

export default function CustomerProfile() {
  const { profile, vehicles, updateProfile, addVehicle } = useCustomerPrototype();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState(() => ({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    email: profile.email || '',
    phoneNumber: profile.phoneNumber || ''
  }));
  const [vehicleForm, setVehicleForm] = useState({ make: '', model: '', year: '', plate: '' });
  const [message, setMessage] = useState('');
  const customerName = `${profileForm.firstName} ${profileForm.lastName}`.trim() || profile.name || 'Demo Rider';

  const saveProfile = (event) => {
    event.preventDefault();
    updateProfile(profileForm);
    localStorage.setItem('customerUser', JSON.stringify({ ...profile, ...profileForm }));
    setMessage('Profile updated.');
  };

  const saveVehicle = (event) => {
    event.preventDefault();
    addVehicle({ ...vehicleForm, name: `${vehicleForm.year} ${vehicleForm.make} ${vehicleForm.model}`.trim() });
    setVehicleForm({ make: '', model: '', year: '', plate: '' });
    setMessage('Motorcycle saved.');
  };

  return <CustomerPage title="Account" description="Manage your profile and motorcycles.">
    <div className="customer-flow-page customer-account-page">
      <aside className="customer-account-identity"><span>{customerName.charAt(0).toUpperCase()}</span><div><strong>{customerName}</strong><small>{profileForm.email || profile.email || 'Local prototype account'}</small></div></aside>
      <div className="customer-account-tabs" role="tablist" aria-label="Account settings">{[['profile', 'Profile'], ['vehicles', 'My vehicles']].map(([key, label]) => <button type="button" role="tab" aria-selected={activeTab === key} className={activeTab === key ? 'is-active' : ''} key={key} onClick={() => { setActiveTab(key); setMessage(''); }}>{label}</button>)}</div>
      {message && <p className="customer-success" role="status">{message}</p>}
      {activeTab === 'profile' && <section className="customer-account-panel"><div className="customer-flow-section-heading"><div><p className="customer-eyebrow">PERSONAL DETAILS</p><h2>My profile</h2></div><div className="customer-account-shortcuts"><Link className="customer-primary-button" to="/customer/purchases">My Purchases</Link><Link className="customer-secondary-button" to="/customer/cart">Reservation Cart</Link></div></div><form className="customer-account-form" onSubmit={saveProfile}><label>First name<input required value={profileForm.firstName} onChange={(event) => setProfileForm({ ...profileForm, firstName: event.target.value })} /></label><label>Last name<input required value={profileForm.lastName} onChange={(event) => setProfileForm({ ...profileForm, lastName: event.target.value })} /></label><label>Email address<input type="email" required value={profileForm.email} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} /></label><label>Phone number<input type="tel" value={profileForm.phoneNumber} onChange={(event) => setProfileForm({ ...profileForm, phoneNumber: event.target.value })} placeholder="+63 9xx xxx xxxx" /></label><button type="submit" className="customer-primary-button">Save profile</button></form></section>}
      {activeTab === 'vehicles' && <section className="customer-account-panel"><div className="customer-flow-section-heading"><div><p className="customer-eyebrow">GARAGE</p><h2>Saved motorcycles</h2></div><span>{vehicles.length} saved</span></div>{vehicles.length > 0 && <div className="customer-account-records">{vehicles.map((vehicle) => <article key={vehicle.id}><span aria-hidden="true">🏍</span><div><strong>{vehicle.name}</strong><small>{vehicle.plate || 'License plate not added'}</small></div></article>)}</div>}<form className="customer-account-form" onSubmit={saveVehicle}><label>Make<input required value={vehicleForm.make} onChange={(event) => setVehicleForm({ ...vehicleForm, make: event.target.value })} placeholder="Honda" /></label><label>Model<input required value={vehicleForm.model} onChange={(event) => setVehicleForm({ ...vehicleForm, model: event.target.value })} placeholder="Click 160" /></label><label>Year<input inputMode="numeric" value={vehicleForm.year} onChange={(event) => setVehicleForm({ ...vehicleForm, year: event.target.value })} placeholder="2024" /></label><label>Plate number<input value={vehicleForm.plate} onChange={(event) => setVehicleForm({ ...vehicleForm, plate: event.target.value })} placeholder="ABC 1234" /></label><button type="submit" className="customer-primary-button">Save motorcycle</button></form></section>}
    </div>
  </CustomerPage>;
}