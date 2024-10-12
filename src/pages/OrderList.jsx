import React, { useEffect, useState } from 'react';
import styles from './OrderList.module.css';
import image from '../images/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faClipboardList, faShoppingCart, faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom'; 
import { auth, db } from '../firebase';
import Modal from './Modal';
import { ref, get, onValue, update } from 'firebase/database';

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

  const handleStatusChange = (id, newStatus) => {
    if (newStatus === 'Delivered') {
      const selectedOrderPayment = orders.find(order => order.id === id)?.payment;

      if (selectedOrderPayment !== 'Paid') {
        alert('Cannot change status to Delivered unless payment is Paid.');
        return;
      }
    }

    const orderRef = ref(db, `orders/${id}`);
    update(orderRef, { status: newStatus });
  };

  const handlePaymentChange = (id, newPayment) => {
    const orderRef = ref(db, `orders/${id}`);
    update(orderRef, { payment: newPayment });

    setPaymentReason((prev) => ({ ...prev, [id]: '' }));
  };

  const handlePaymentTypeChange = (id, newPaymentType) => {
    const orderRef = ref(db, `orders/${id}`);
    update(orderRef, { paymentType: newPaymentType });

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

  const filteredOrders = orders.filter(order => order.status !== 'Delivered');

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
                          <option value="Unpaid">Unpaid</option>
                          <option value="Paid">Paid</option>
                        </select>
                      </td>
                      <td>
                        <select value={order.paymentType || ''} onChange={(e) => handlePaymentTypeChange(order.id, e.target.value)}>
                          <option value="">Select Payment Type</option>
                          <option value="Cash">Cash</option>
                          <option value="Credit Card">Credit Card</option>
                          <option value="Online Transfer">Online Transfer</option>
                        </select>
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
                        <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)}>
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Delivered">Delivered</option>
                        </select>
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
          <h3>Order Details</h3>
          {Object.keys(selectedOrder.items || {}).map((key) => {
            const item = selectedOrder.items[key];
            const totalPrice = Number(item.totalPrice) || 0;
            return (
              <div key={key}>
                {item.productName} - {item.orderQuantity} - ₱{totalPrice ? totalPrice.toFixed(2) : '0.00'}
              </div>
            );
          })}
          <button onClick={handleCloseDetails}>Close</button>
        </div>
      )}

      {showModal && <Modal onClose={() => setShowModal(false)} user={currentUser} />}
    </div>
  );
};

export default OrderList;
