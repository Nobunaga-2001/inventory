import React, { useEffect, useState } from 'react';
import styles from './Sales.module.css';
import image from '../images/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faHistory, faSackDollar, faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import Modal from './Modal';
import { ref, get, onValue } from 'firebase/database';
import * as XLSX from 'xlsx'; // Importing the xlsx package for Excel downloads
import FilterModal from './FilterModal'; // Importing the FilterModal component

const Sales = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false); // State to control filter modal visibility
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  
  // Filter state variables
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('');
  const [paymentReasonFilter, setPaymentReasonFilter] = useState('');

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

  // Filter orders based on selected criteria
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.dateOrdered);
    const matchDate = (!startDate || orderDate >= new Date(startDate)) &&
                      (!endDate || orderDate <= new Date(endDate));
    const matchStatus = !statusFilter || order.status === statusFilter;
    const matchPayment = !paymentFilter || order.payment === paymentFilter;
    const matchPaymentType = !paymentTypeFilter || order.paymentType === paymentTypeFilter;
    const matchPaymentReason = !paymentReasonFilter || order.paymentReason === paymentReasonFilter;

    return matchDate && matchStatus && matchPayment && matchPaymentType && matchPaymentReason;
  });

  // Function to download filtered sales data as Excel
  const downloadExcel = () => {
    const filteredData = filteredOrders.map(order => ({
      customer: order.customer,
      location: order.location,
      status: order.status,
      payment: order.payment,
      paymentType: order.paymentType || 'N/A', // Payment type might be missing in older orders
      paymentReason: order.paymentReason || 'N/A', // Payment reason might be missing in some orders
      dateOrdered: new Date(order.dateOrdered).toLocaleDateString(),
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
          <Link to="/sales" className={styles.button2}><FontAwesomeIcon icon={faSackDollar} /> Sales</Link>
          <Link to="/history" className={styles.button2}><FontAwesomeIcon icon={faHistory} /> History</Link>
          <Link to="/pager" className={styles.button3}><FontAwesomeIcon icon={faUser} /> Create User</Link>
          <Link to="/admininventory" className={styles.button2}><FontAwesomeIcon icon={faHistory} /> Inventory</Link>
          <Link to="/supplier" className={styles.button3}><FontAwesomeIcon icon={faUser} /> Supplier</Link>
        </div>
      </div>
      <div className={`${styles.content} ${isCollapsed ? styles.fullWidth : ''}`}>
        <button className={styles.toggleButton} onClick={toggleCollapse}><FontAwesomeIcon icon={faBars} /></button>

        <div className={styles.contentTop}>
          {/* Filter Inputs */}
          <button onClick={() => setShowFilterModal(true)}>Filter Orders</button>
          <button onClick={downloadExcel}>Download Excel</button>
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
                  <th>Payment Type</th>
                  <th>Payment Reason</th>
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
                      <td>{order.paymentType || 'N/A'}</td>
                      <td>{order.paymentReason || 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">No orders found for the selected criteria</td>
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
            const totalPrice = Number(item.totalPrice) || 0;
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
      {showFilterModal && (
        <FilterModal
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          paymentFilter={paymentFilter}
          setPaymentFilter={setPaymentFilter}
          paymentTypeFilter={paymentTypeFilter}
          setPaymentTypeFilter={setPaymentTypeFilter}
          paymentReasonFilter={paymentReasonFilter}
          setPaymentReasonFilter={setPaymentReasonFilter}
          onClose={() => setShowFilterModal(false)}
        />
      )}
    </div>
  );
};

export default Sales;
