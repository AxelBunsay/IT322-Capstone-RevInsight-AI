import { useEffect, useState } from 'react';
import { adminApi as api } from '../services/adminApi';
import { AdminDialog, AdminPageFrame } from './ManagementPageComponents';

const defaultSettings = {
  downPaymentPercent: 30,
  pendingPaymentHours: 24,
  holdDays: 3,
  paymentInstructions: { methodName: '', accountName: '', accountNumber: '' },
  pickupAddress: '',
  pickupHours: '',
  contactNumber: '0900 000 0000',
  openDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  openTime: '09:00',
  closeTime: '18:00',
  slotCapacity: 1,
  maxDaysAhead: 30
};

const money = (value) => `₱${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [bookingSchedule, setBookingSchedule] = useState({
    openDays: defaultSettings.openDays,
    openTime: defaultSettings.openTime,
    closeTime: defaultSettings.closeTime,
    slotCapacity: defaultSettings.slotCapacity,
    maxDaysAhead: defaultSettings.maxDaysAhead
  });
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [dialogAction, setDialogAction] = useState(null);
  const [reason, setReason] = useState('');
  const [refundDecision, setRefundDecision] = useState('');

  useEffect(() => {
    let isMounted = true;
    Promise.all([api.getReservations({ status, search }), api.getReservationSettings(), api.getBookingSchedule()])
      .then(([reservationResponse, settingsResponse, scheduleResponse]) => {
        if (!isMounted) return;
        setReservations(reservationResponse.reservations || []);
        setSettings({ ...defaultSettings, ...settingsResponse.settings, paymentInstructions: { ...defaultSettings.paymentInstructions, ...settingsResponse.settings?.paymentInstructions } });
        setBookingSchedule((current) => ({ ...current, ...scheduleResponse.schedule }));
        setError('');
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message || 'Reservations could not be loaded.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, [refreshKey, search, status]);

  const refresh = () => {
    setIsLoading(true);
    setRefreshKey((value) => value + 1);
  };
  const setInstruction = (field, value) => setSettings((current) => ({
    ...current,
    paymentInstructions: { ...current.paymentInstructions, [field]: value }
  }));

  const saveSettings = async (event) => {
    event.preventDefault();
    setError('');
    setToast('');
    setIsSavingSettings(true);
    try {
      const response = await api.updateReservationSettings(settings);
      setSettings({ ...defaultSettings, ...response.settings, paymentInstructions: { ...defaultSettings.paymentInstructions, ...response.settings.paymentInstructions } });
      setToast('Reservation settings saved.');
    } catch (requestError) {
      setError(requestError.message || 'Settings could not be saved.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const saveBookingSchedule = async (event) => {
    event.preventDefault();
    setError('');
    setToast('');
    setIsSavingSettings(true);
    try {
      const response = await api.updateBookingSchedule(bookingSchedule);
      setBookingSchedule(response.schedule);
      setToast('Booking schedule saved.');
    } catch (requestError) {
      setError(requestError.message || 'Booking schedule could not be saved.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const toggleOpenDay = (day) => setBookingSchedule((current) => ({
    ...current,
    openDays: current.openDays.includes(day)
      ? current.openDays.filter((openDay) => openDay !== day)
      : [...current.openDays, day]
  }));

  const performImmediateAction = async (action, reservation) => {
    setError('');
    setToast('');
    try {
      if (action === 'confirm') await api.confirmReservation(reservation._id);
      if (action === 'complete') await api.completeReservation(reservation._id);
      setToast(action === 'confirm' ? `${reservation.code} is now reserved.` : `${reservation.code} completed.`);
      refresh();
    } catch (requestError) {
      setError(requestError.message || 'Reservation could not be updated.');
    }
  };

  const openDialog = (action, reservation) => {
    setReason('');
    setRefundDecision('');
    setDialogAction({ action, reservation });
  };

  const submitDialogAction = async (event) => {
    event.preventDefault();
    if (!dialogAction) return;
    const { action, reservation } = dialogAction;
    setError('');
    setToast('');
    try {
      if (action === 'reject') await api.rejectReservation(reservation._id, reason);
      if (action === 'cancel') await api.cancelReservation(reservation._id, reason, refundDecision || undefined);
      if (action === 'refund') await api.decideExpiredReservationRefund(reservation._id, refundDecision);
      setDialogAction(null);
      setToast(action === 'reject' ? 'Payment rejected. Customer can submit again.' : action === 'refund' ? 'Refund decision recorded.' : 'Reservation cancelled.');
      refresh();
    } catch (requestError) {
      setError(requestError.message || 'Reservation action could not be completed.');
    }
  };

  return <AdminPageFrame>
    <section className="section-content active admin-reservations-page">
      <div className="management-heading"><div><p className="management-eyebrow">INVENTORY FULFILLMENT</p><h1>Reservations</h1><p>Review down payments, confirm holds, and complete item pickups.</p></div></div>
      {error && <p className="dashboard-error" role="alert">{error}</p>}
      {toast && <p className="reservation-admin-toast" role="status">{toast}</p>}

      <section className="reservation-settings-card">
        <div className="reservation-admin-section-heading"><div><h2>Reservation settings</h2><p>These values apply to new reservations.</p></div></div>
        <form className="reservation-settings-form" onSubmit={saveSettings}>
          <label>Down payment percent<input type="number" min="10" max="100" step="1" required value={settings.downPaymentPercent} onChange={(event) => setSettings({ ...settings, downPaymentPercent: Number(event.target.value) })} /></label>
          <label>Payment deadline (hours)<input type="number" min="1" max="720" step="1" required value={settings.pendingPaymentHours} onChange={(event) => setSettings({ ...settings, pendingPaymentHours: Number(event.target.value) })} /></label>
          <label>Pickup hold (days)<input type="number" min="1" max="30" step="1" required value={settings.holdDays} onChange={(event) => setSettings({ ...settings, holdDays: Number(event.target.value) })} /></label>
          <label>Payment method name<input maxLength="120" value={settings.paymentInstructions.methodName} onChange={(event) => setInstruction('methodName', event.target.value)} placeholder="e.g. GCash" /></label>
          <label>Account name<input maxLength="120" value={settings.paymentInstructions.accountName} onChange={(event) => setInstruction('accountName', event.target.value)} /></label>
          <label>Account number<input maxLength="120" value={settings.paymentInstructions.accountNumber} onChange={(event) => setInstruction('accountNumber', event.target.value)} /></label>
          <label className="reservation-settings-wide">Pickup address<textarea maxLength="500" rows="2" value={settings.pickupAddress} onChange={(event) => setSettings({ ...settings, pickupAddress: event.target.value })} /></label>
          <label>Pickup hours<input maxLength="200" value={settings.pickupHours} onChange={(event) => setSettings({ ...settings, pickupHours: event.target.value })} placeholder="e.g. Mon-Sat, 9 AM-6 PM" /></label>
          <label>Contact number<input type="tel" maxLength="40" value={settings.contactNumber} onChange={(event) => setSettings({ ...settings, contactNumber: event.target.value })} placeholder="0900 000 0000" /></label>
          <button type="submit" className="btn-primary" disabled={isSavingSettings}>{isSavingSettings ? 'Saving...' : 'Save reservation settings'}</button>
        </form>
      </section>

      <section className="reservation-settings-card">
        <div className="reservation-admin-section-heading"><div><h2>Booking schedule</h2><p>These hours and capacity apply to service bookings.</p></div></div>
        <form className="reservation-settings-form" onSubmit={saveBookingSchedule}>
          <fieldset className="reservation-booking-open-days reservation-settings-wide">
            <legend>Open days</legend>
            <div>{[['Mon', 'Monday'], ['Tue', 'Tuesday'], ['Wed', 'Wednesday'], ['Thu', 'Thursday'], ['Fri', 'Friday'], ['Sat', 'Saturday'], ['Sun', 'Sunday']].map(([day, label]) => <label key={day}><input type="checkbox" checked={bookingSchedule.openDays.includes(day)} onChange={() => toggleOpenDay(day)} />{label}</label>)}</div>
          </fieldset>
          <label>Opening time<input type="time" required value={bookingSchedule.openTime} onChange={(event) => setBookingSchedule({ ...bookingSchedule, openTime: event.target.value })} /></label>
          <label>Closing time<input type="time" required value={bookingSchedule.closeTime} onChange={(event) => setBookingSchedule({ ...bookingSchedule, closeTime: event.target.value })} /></label>
          <label>Jobs per start time<input type="number" min="1" max="100" step="1" required value={bookingSchedule.slotCapacity} onChange={(event) => setBookingSchedule({ ...bookingSchedule, slotCapacity: Number(event.target.value) })} /></label>
          <label>Maximum days ahead<input type="number" min="1" max="365" step="1" required value={bookingSchedule.maxDaysAhead} onChange={(event) => setBookingSchedule({ ...bookingSchedule, maxDaysAhead: Number(event.target.value) })} /></label>
          <button type="submit" className="btn-primary" disabled={isSavingSettings}>{isSavingSettings ? 'Saving...' : 'Save booking schedule'}</button>
        </form>
      </section>

      <section className="reservation-list-card">
        <div className="reservation-admin-section-heading"><div><h2>Item reservations</h2><p>{reservations.length} shown · latest 200 matching records</p></div></div>
        <div className="reservation-admin-filters">
          <input type="search" value={search} onChange={(event) => { setIsLoading(true); setSearch(event.target.value); }} placeholder="Search code, customer, phone, or payment reference..." aria-label="Search reservations" />
          <select value={status} onChange={(event) => { setIsLoading(true); setStatus(event.target.value); }} aria-label="Filter by reservation status">
            <option value="">All statuses</option>
            {['Pending Down Payment', 'Payment Submitted', 'Reserved', 'Completed', 'Cancelled', 'Expired'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        {isLoading ? <p>Loading reservations...</p> : !reservations.length ? <p className="transactions-empty">No reservations match these filters.</p> : <div className="reservation-admin-list">
          {reservations.map((reservation) => {
            const customer = reservation.customerId;
            const customerName = customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : reservation.customerName;
            return <article className="reservation-admin-item" key={reservation._id}>
              <div className="reservation-admin-item-heading"><div><strong>{reservation.code}</strong><span>{reservation.status}</span></div><small>{new Date(reservation.createdAt).toLocaleString('en-PH')}</small></div>
              <p className="reservation-admin-customer">{customerName || 'Customer'} {customer?.phoneNumber || reservation.customerPhone}</p>
              <ul>{reservation.items.map((item) => <li key={item.productId}>{item.name} × {item.qty} · {money(item.lineTotal)}</li>)}</ul>
              <div className="reservation-admin-summary"><span>Total <strong>{money(reservation.total)}</strong></span><span>Down payment <strong>{money(reservation.downPaymentAmount)}</strong></span><span>Balance <strong>{money(reservation.balanceDue)}</strong></span></div>
              {reservation.paymentReference && <p className="reservation-admin-payment">Payment: {reservation.paymentMethod} · Ref {reservation.paymentReference}{reservation.paymentProofUrl && <> · <a href={reservation.paymentProofUrl} target="_blank" rel="noreferrer">View proof</a></>}</p>}
              {reservation.rejectionReason && <p className="reservation-admin-payment">Last rejection: {reservation.rejectionReason}</p>}
              {reservation.reservedUntil && <p className="reservation-admin-payment">Hold until {new Date(reservation.reservedUntil).toLocaleString('en-PH')}</p>}
              {reservation.refundDecision && <p className="reservation-admin-payment">Refund decision: {reservation.refundDecision}</p>}
              <div className="reservation-admin-actions">
                {reservation.status === 'Payment Submitted' && <><button type="button" className="btn-primary" onClick={() => performImmediateAction('confirm', reservation)}>Confirm payment</button><button type="button" className="btn-small btn-delete" onClick={() => openDialog('reject', reservation)}>Reject payment</button></>}
                {reservation.status === 'Reserved' && <><button type="button" className="btn-primary" onClick={() => performImmediateAction('complete', reservation)}>Complete pickup</button><button type="button" className="btn-small btn-delete" onClick={() => openDialog('cancel', reservation)}>Cancel reservation</button></>}
                {['Pending Down Payment', 'Payment Submitted'].includes(reservation.status) && <button type="button" className="btn-small btn-delete" onClick={() => openDialog('cancel', reservation)}>Cancel reservation</button>}
                {reservation.status === 'Expired' && reservation.amountPaid > 0 && !reservation.refundDecision && <button type="button" className="btn-small btn-delete" onClick={() => openDialog('refund', reservation)}>Record refund decision</button>}
                {reservation.status === 'Expired' && <button type="button" className="btn-small btn-delete" onClick={() => openDialog('cancel', reservation)}>Close expired reservation</button>}
              </div>
            </article>;
          })}
        </div>}
      </section>
      {dialogAction && <AdminDialog title={dialogAction.action === 'reject' ? 'Reject payment' : dialogAction.action === 'refund' ? 'Record refund decision' : 'Cancel reservation'} onClose={() => setDialogAction(null)}>
        <form className="reservation-admin-dialog-form" onSubmit={submitDialogAction}>
          <p>{dialogAction.reservation.code} · {dialogAction.reservation.status}</p>
          {(dialogAction.action === 'cancel' && (dialogAction.reservation.status === 'Reserved' || dialogAction.reservation.status === 'Expired' && dialogAction.reservation.amountPaid > 0 && !dialogAction.reservation.refundDecision) || dialogAction.action === 'refund') && <label>Down payment decision<select required value={refundDecision} onChange={(event) => setRefundDecision(event.target.value)}><option value="">Choose one</option><option value="refunded">Refunded</option><option value="forfeited">Forfeited</option></select><small>Choose the decision required by the shop&apos;s refund policy. No default is applied.</small></label>}
          {dialogAction.action !== 'refund' && <label>{dialogAction.action === 'reject' ? 'Reason for rejection' : 'Cancellation reason'}<textarea required minLength="3" maxLength="300" rows="3" value={reason} onChange={(event) => setReason(event.target.value)} /></label>}
          <div className="reservation-admin-actions"><button type="button" className="btn-small btn-edit" onClick={() => setDialogAction(null)}>Keep reservation</button><button type="submit" className="btn-small btn-delete">{dialogAction.action === 'reject' ? 'Reject payment' : dialogAction.action === 'refund' ? 'Save decision' : 'Cancel reservation'}</button></div>
        </form>
      </AdminDialog>}
    </section>
  </AdminPageFrame>;
}

export default Reservations;
