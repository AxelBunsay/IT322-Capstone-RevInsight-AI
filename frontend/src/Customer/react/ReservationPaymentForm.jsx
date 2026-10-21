import { useEffect, useState } from 'react';

const money = (value) => `₱${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ReservationPaymentForm({ reservation, settings, onSubmit, isSaving }) {
  const [reference, setReference] = useState('');
  const [proof, setProof] = useState(null);
  const [fileError, setFileError] = useState('');
  const [countdown, setCountdown] = useState('');
  const instructions = settings?.paymentInstructions || {};
  const canSubmit = Boolean(instructions.methodName && instructions.accountName && instructions.accountNumber);

  useEffect(() => {
    if (!reservation.paymentDueAt) return undefined;
    const updateCountdown = () => {
      const remaining = Math.max(0, new Date(reservation.paymentDueAt).getTime() - Date.now());
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      setCountdown(`${hours}h ${String(minutes).padStart(2, '0')}m`);
    };
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [reservation.paymentDueAt]);

  const submit = (event) => {
    event.preventDefault();
    setFileError('');
    if (proof && (!['image/jpeg', 'image/png'].includes(proof.type) || proof.size > 5 * 1024 * 1024)) {
      setFileError('Choose a JPG or PNG image no larger than 5 MB.');
      return;
    }
    onSubmit({ reference, proof });
  };

  return <form className="customer-reservation-payment" onSubmit={submit}>
    <h2>Step 2: Submit your down payment</h2>
    <p>Pay exactly <strong>{money(reservation.downPaymentAmount)}</strong> to submit this reservation.</p>
    {countdown && <p className="customer-payment-countdown">Pay within {countdown}</p>}
    {canSubmit ? <div className="customer-reservation-payment-instructions">
      <strong>{instructions.methodName}</strong>
      <span>Account name: {instructions.accountName}</span>
      <span>Account number: {instructions.accountNumber}</span>
    </div> : <p className="customer-error" role="alert">Shop payment instructions are not configured yet. Please contact the shop before paying.</p>}
    {settings?.pickupAddress && <p className="customer-pickup-location">Pickup at {settings.pickupAddress}{settings.pickupHours ? ` · ${settings.pickupHours}` : ''}</p>}
    <label>Reference number<input required minLength="3" maxLength="120" value={reference} onChange={(event) => setReference(event.target.value)} /></label>
    <label>Upload proof (optional image)<input type="file" accept="image/jpeg,image/png" onChange={(event) => { setProof(event.target.files?.[0] || null); setFileError(''); }} /></label>
    {proof && <small>{proof.name}</small>}
    {fileError && <p className="customer-error" role="alert">{fileError}</p>}
    <button className="customer-primary-button" type="submit" disabled={isSaving || !canSubmit}>{isSaving ? 'Submitting...' : 'Submit Payment'}</button>
  </form>;
}
