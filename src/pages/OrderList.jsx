import React, { useEffect, useState } from 'react';
import styles from './OrderList.module.css';
import image from '../images/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faClipboardList, faShoppingCart, faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom'; 
import { auth, db } from '../firebase';
import Modal from './ModalEmp';
import { ref, get, onValue, update, push } from 'firebase/database';

const predefinedPaymentReasons = [
  'Refund',
  'Exchange',
  'Customer Request',
  'Payment Error',
];

const OrderList = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [paymentReason, setPaymentReason] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          setCurrentUser(snapshot.val());
        }
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const orderRef = ref(db, 'orders');
    onValue(orderRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const orderArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setOrders(orderArray);
      }
    });
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prevState) => !prevState);
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const handleShowDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleCloseDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  const handleStatusClick = (orderId, currentStatus) => {
    if (currentStatus === 'Pending') {
      if (window.confirm('Are you sure you want to mark this order as Shipped?')) {
        updateOrderStatus(orderId, 'Shipped');
      }
    }
  };

  const handleDeliveredClick = (orderId, paymentStatus) => {
    // Check if the payment status is "Paid" before allowing delivery
    if (paymentStatus !== 'Paid') {
      alert('The payment must be marked as Paid before delivering the order.');
      return; // Exit the function if payment is not "Paid"
    }
  
    if (window.confirm('Are you sure you want to mark this order as Delivered?')) {
      updateOrderStatus(orderId, 'Delivered');
    }
  };
  

  const handleCancelClick = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      const order = orders.find((order) => order.id === orderId);
      if (order) {
        await returnStockToInventory(order.items);
        await updateOrderStatus(orderId, 'Cancelled');
      }
    }
  };

  const returnStockToInventory = async (orderItems) => {
    for (const itemId in orderItems) {
      const item = orderItems[itemId];
  
      // Fetch all products and search for the correct one based on productName
      const productRef = ref(db, 'products');
      const snapshot = await get(productRef);
      const products = snapshot.val();
  
      if (products) {
        let productFound = false;
  
        // Iterate over all products
        for (const productId in products) {
          const product = products[productId];
          const variations = product.variations;
  
          // Convert variations to an array if it's an object
          const variationsArray = Array.isArray(variations) ? variations : Object.values(variations);
  
          // Find the correct variation by productName
          const variationToUpdate = variationsArray.find(
            (variation) => variation.productName === item.productName
          );
  
          if (variationToUpdate) {
            productFound = true;
            const variationIndex = variationsArray.indexOf(variationToUpdate);
            const previousStock = Number(variationToUpdate.quantity);  // Ensure it's a number
            const orderQuantity = Number(item.orderQuantity);          // Ensure it's a number
            const newStock = previousStock + orderQuantity;
  
            // Update the stock in Firebase
            const updates = {
              [`variations/${variationIndex}/quantity`]: newStock,
            };
            const variationRef = ref(db, `products/${productId}`);
            await update(variationRef, updates);
  
            // Log the stock change
            await logStockChange(variationToUpdate, orderQuantity, previousStock, newStock, productId);
            break; // Exit the loop once we find and update the variation
          }
        }
  
        if (!productFound) {
          console.error(`Product with name ${item.productName} not found.`);
        }
      }
    }
  };
  

  const logStockChange = async (variation, orderQuantity, previousStock, newStock, productId) => {
    const changeAmount = newStock - previousStock;
    const changeType = 'Stock Cancellation Return';

    const stockChangeRef = ref(db, `stockChanges/${productId}`);
    const changeLog = {
      variationCode: variation.productCode,
      productName: variation.productName,
      currentStock: newStock,
      previousStock,
      quantityChanged: Math.abs(changeAmount),
      changeDate: new Date().toISOString(),
      changeType,
      firstName: currentUser?.firstName || 'Unknown',
    };

    await push(stockChangeRef, changeLog);
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const orderRef = ref(db, `orders/${orderId}`);
    update(orderRef, { status: newStatus })
      .then(() => alert(`Order status updated to ${newStatus}`))
      .catch((error) => alert('Failed to update status: ' + error.message));
  };

  const handlePaymentChange = async (id, newPayment) => {
    const orderRef = ref(db, `orders/${id}`);
  
    // Update payment status in the database
    await update(orderRef, { payment: newPayment });
  
    // Automatically mark order as "Delivered" if payment status is "Paid"
    if (newPayment === 'Paid') {
      await update(orderRef, { status: 'Delivered' })
        .then(() => {
          alert('Payment status updated to Paid, and order marked as Delivered!');
        })
        .catch((error) => {
          alert('Failed to update status: ' + error.message);
        });
    } else {
      alert('Payment status updated successfully!');
    }
  
    // Clear the payment reason after change
    setPaymentReason((prev) => ({ ...prev, [id]: '' }));
  };
  

  const handlePaymentReasonChange = (id, reason) => {
    setPaymentReason((prev) => ({ ...prev, [id]: reason }));
  };

  const handleSavePaymentReason = (id) => {
    const orderRef = ref(db, `orders/${id}`);
    update(orderRef, { paymentReason: paymentReason[id] });

    alert('Payment reason saved successfully!');
    setPaymentReason((prev) => ({ ...prev, [id]: paymentReason[id] }));
  };

  const filteredOrders = orders.filter(order => order.status !== 'Delivered' && order.status !== 'Cancelled');
  
  return (
    <div className={styles.parent}>
      <Link to="/inventory" className={styles.logo}>
        <img src={image} alt="Logo" />
      </Link>
      <div className={styles.searchbar}>
        {currentUser && (
          <div className={styles.userInfo}>
            <p>Welcome, {currentUser.firstName}</p>
          </div>
        )}
      </div>
      <div className={styles.pagename}>| Order List</div>
      <div className={`${styles.div2} ${isCollapsed ? styles.hidden : styles.visible}`}>
        <div className={styles.buttonContainer}>
          <Link to="/inventory" className={styles.button1}><FontAwesomeIcon icon={faClipboardList} /> Inventory</Link>
          <Link to="/order" className={styles.button2}><FontAwesomeIcon icon={faShoppingCart} /> Order</Link>
        </div>
        <div className={styles.buttonRow}>
          <div className={styles.buttonProfile} onClick={() => setShowModal(true)}><FontAwesomeIcon icon={faUser} /></div>
          <div className={styles.buttonLogout} onClick={handleLogout}><FontAwesomeIcon icon={faSignOutAlt} /></div>
        </div>
      </div>
      <div className={`${styles.content} ${isCollapsed ? styles.fullWidth : ''}`}>
        <button className={styles.toggleButton} onClick={toggleCollapse}><FontAwesomeIcon icon={faBars} /></button>

        <div className={styles.contentTop}>
          <Link to="/order" className={styles.navButton1}>Order</Link>
          <Link to="/orderlist" className={styles.navButton2}>Order List</Link>
        </div>
        <div className={styles.contentBottom}>
          <div className={styles.containertable}>
            <table className={styles.orderTable}>
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Location</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Order Info</th>
                  <th>Payment</th>
                  <th>Payment Type</th>
                  <th>Payment Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.customer}</td>
                      <td>{order.location}</td>
                      <td>{order.email}</td>
                      <td>{order.phoneNumber}</td>
                      <td>
                        <button onClick={() => handleShowDetails(order)}>View Order</button>
                      </td>
                      <td>
                        <select value={order.payment} onChange={(e) => handlePaymentChange(order.id, e.target.value)}>
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                          <option value="Failed">Failed</option>
                          <option value="Refunded">Refunded</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <span>{order.paymentType || 'No Payment Type'}</span>
                      </td>
                      <td>
                        <select 
                          value={paymentReason[order.id] || order.paymentReason || ''}  
                          onChange={(e) => handlePaymentReasonChange(order.id, e.target.value)} 
                        >
                          <option value="">Select Payment Reason</option>
                          {predefinedPaymentReasons.map((reason, index) => (
                            <option key={index} value={reason}>{reason}</option>
                          ))}
                        </select>
                        <button onClick={() => handleSavePaymentReason(order.id)}>Save</button>
                      </td>
                      <td>
                      {order.status === 'Pending' && (
                        <button onClick={() => handleStatusClick(order.id, order.status)}>
                          Pending
                        </button>
                      )}
                      {order.status === 'Shipped' && (
                        <div>
                          <p>Status: Shipped</p>
                          <button onClick={() => handleDeliveredClick(order.id, order.payment)}>
                            Delivered
                          </button>
                          <button onClick={() => handleCancelClick(order.id)}>
                            Cancel
                          </button>
                        </div>
                      )}
                      {order.status === 'Delivered' && <p>Status: Delivered</p>}
                      {order.status === 'Cancelled' && <p>Status: Cancelled</p>}
                    </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10">No orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showOrderDetails && selectedOrder && (
        <div className={styles.orderDetails}>
          <h3>Order Receipt</h3>
          <table className={styles.receiptTable}>
            <thead>
              <tr>
                <th>Quantity</th>
                <th>Product Name</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(selectedOrder.items || {}).map((key) => {
                const item = selectedOrder.items[key];
                const totalPrice = Number(item.totalPrice) || 0;
                return (
                  <tr key={key}>
                    <td>{item.orderQuantity}</td>
                    <td>{item.productName}</td>
                    <td>₱{Number(item.price).toLocaleString('en-PH', { style: 'decimal', minimumFractionDigits: 2 })}</td>
                    <td>₱{totalPrice.toLocaleString('en-PH', { style: 'decimal', minimumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className={styles.receiptFooter}>
            Gross Total: <span>₱{Object.keys(selectedOrder.items)
              .reduce((total, key) => total + (Number(selectedOrder.items[key].totalPrice) || 0), 0)
              .toLocaleString('en-PH', { style: 'decimal', minimumFractionDigits: 2 })}
            </span>
          </div>
          <button onClick={handleCloseDetails}>Close</button>
        </div>
      )}

      {showModal && <Modal onClose={() => setShowModal(false)} user={currentUser} />}
    </div>
  );
};

export default OrderList;
