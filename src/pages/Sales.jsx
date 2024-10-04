import React, { useEffect, useState } from 'react';
import styles from './Sales.module.css';
import image from '../images/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faShoppingCart, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import Modal from './Modal';
import { ref, get, onValue } from 'firebase/database';
import * as XLSX from 'xlsx'; // Importing the xlsx package for Excel downloads

const Sales = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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

  // Filter orders to show only those with "Delivered" status
  const deliveredOrders = orders.filter(order => order.status === 'Delivered');

  // Function to filter orders by date range
  const filteredOrders = deliveredOrders.filter(order => {
    const orderDate = new Date(order.dateOrdered); // Adjust according to your data structure
    return (!startDate || orderDate >= new Date(startDate)) &&
           (!endDate || orderDate <= new Date(endDate));
  });

  // Function to download filtered sales data as Excel
  const downloadExcel = () => {
    const filteredData = filteredOrders.map(order => ({
      customer: order.customer,
      location: order.location,
      status: order.status,
      payment: order.payment,
      dateOrdered: new Date(order.dateOrdered).toLocaleDateString(), // Ensure this is formatted as needed
    }));
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Data');
    XLSX.writeFile(wb, 'Filtered_Sales_Data.xlsx');
  };

  return (
    <div className={styles.parent}>
      <Link to="/adminboard" className={styles.logo}>
        <img src={image} alt="Logo" />
      </Link>
      <div className={styles.searchbar}>
  {currentUser?.photoURL && (
    <div className={styles.userProfileImage} onClick={() => setShowModal(true)}>
      <img
        src={currentUser.photoURL}
        alt="User Profile"
        className={styles.userProfileImage}
      />
    </div>
    
  )}
   <div className={styles.buttonLogout} onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} />
    </div>
</div>
      <div className={styles.pagename}>| Sales</div>
      <div className={`${styles.div2} ${isCollapsed ? styles.hidden : styles.visible}`}>
        <div className={styles.buttonContainer}>
          <Link to="/sales" className={styles.button2}><FontAwesomeIcon icon={faShoppingCart} /> Sales</Link>
          <Link to="/history" className={styles.button2}><FontAwesomeIcon icon={faShoppingCart} /> History</Link>
          <Link to="/pager" className={styles.button3}><FontAwesomeIcon icon={faShoppingCart} /> Create User</Link>
        </div>
      
      </div>
      <div className={`${styles.content} ${isCollapsed ? styles.fullWidth : ''}`}>
        <button className={styles.toggleButton} onClick={toggleCollapse}><FontAwesomeIcon icon={faBars} /></button>

        <div className={styles.contentTop}>
          {/* Date Range Inputs */}
          <div className={styles.dateRangeContainer}>
            <label htmlFor="start-date">Start Date:</label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <label htmlFor="end-date">End Date:</label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <button onClick={downloadExcel}>Download Excel</button>
          </div>
        </div>
        <div className={styles.contentBottom}>
          <div className={styles.containertable}>
            <table className={styles.orderTable}>
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Location</th>
                  <th>Order Info</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.customer}</td>
                      <td>{order.location}</td>
                      <td>
                        <button onClick={() => handleShowDetails(order)}>View Order</button>
                      </td>
                      <td>{order.status}</td>
                      <td>{order.payment}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No delivered orders found for the selected date range</td>
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
          {Object.keys(selectedOrder.items).map((key) => {
            const item = selectedOrder.items[key];
            const totalPrice = Number(item.totalPrice) || 0; // Ensure totalPrice is a number
            return (
              <div key={key}>
                {item.productName} - {item.orderQuantity} - ₱{totalPrice.toFixed(2)}
              </div>
            );
          })}
          <h4>Gross Total: ₱{(Object.keys(selectedOrder.items).reduce((total, key) => total + (Number(selectedOrder.items[key].totalPrice) || 0), 0)).toFixed(2)}</h4>
          <button onClick={handleCloseDetails}>Close</button>
        </div>
      )}

      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default Sales;
