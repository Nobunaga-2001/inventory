import React, { useState } from 'react';

const AdminInvent = () => {
  const [status, setStatus] = useState('Pending'); // Initial status set to 'Pending'

  // Handle click from Pending to Shipped with confirmation
  const handleClick = () => {
    const confirmationMessage = 'Are you sure you want to mark this order as Shipped?';
    
    if (window.confirm(confirmationMessage)) {
      setStatus('Shipped'); // Move to 'Shipped'
    }
  };

  // Handle delivered or cancel status with confirmation
  const handleStatusChange = (newStatus) => {
    const confirmationMessage = newStatus === 'Delivered'
      ? 'Are you sure you want to mark this order as Delivered?'
      : 'Are you sure you want to Cancel this order?';

    if (window.confirm(confirmationMessage)) {
      setStatus(newStatus); // Set final status to 'Delivered' or 'Cancelled'
    }
  };

  return (
    <div>
      <h1>Order Status</h1>

      {/* Status Pending */}
      {status === 'Pending' && (
        <button onClick={handleClick} className="statusButton">
          Pending
        </button>
      )}

      {/* Status Shipped */}
      {status === 'Shipped' && (
        <div>
          <p>Status: Shipped</p>
          <button onClick={() => handleStatusChange('Delivered')} className="statusButton">
            Delivered
          </button>
          <button onClick={() => handleStatusChange('Cancelled')} className="statusButton">
            Cancel
          </button>
        </div>
      )}

      {/* Status Delivered */}
      {status === 'Delivered' && <p>Status: Delivered</p>}

      {/* Status Cancelled */}
      {status === 'Cancelled' && <p>Status: Cancelled</p>}
    </div>
  );
};

export default AdminInvent;
