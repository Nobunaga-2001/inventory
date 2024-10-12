import React from 'react';
import styles from './FilterModal.module.css';

const FilterModal = ({ startDate, setStartDate, endDate, setEndDate, statusFilter, setStatusFilter, paymentFilter, setPaymentFilter, paymentTypeFilter, setPaymentTypeFilter, paymentReasonFilter, setPaymentReasonFilter, onClose }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Here, you can add any additional logic you need when submitting filters
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Filter Orders</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Start Date:</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label>End Date:</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <label>Status:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label>Payment:</label>
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
              <option value="">All</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
          <div>
            <label>Payment Type:</label>
            <select value={paymentTypeFilter} onChange={(e) => setPaymentTypeFilter(e.target.value)}>
              <option value="">All</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Cash">Cash</option>
              <option value="Transfer">Transfer</option>
            </select>
          </div>
          <div>
            <label>Payment Reason:</label>
            <select value={paymentReasonFilter} onChange={(e) => setPaymentReasonFilter(e.target.value)}>
              <option value="">All</option>
              <option value="Purchase">Purchase</option>
              <option value="Refund">Refund</option>
            </select>
          </div>
          <button type="submit">Apply Filters</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
};

export default FilterModal;
