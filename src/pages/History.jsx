import React, { useEffect, useState } from 'react';
import styles from './History.module.css';
import image from '../images/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faHistory, faSackDollar, faUser } from '@fortawesome/free-solid-svg-icons';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import Modal from './Modal';
import { ref, get, update, onValue } from 'firebase/database';
import * as XLSX from 'xlsx'; // Importing the xlsx package for Excel downloads

const History = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [ordersData, setOrdersData] = useState([]);
  const [stockChanges, setStockChanges] = useState([]);
  const [userLogs, setUserLogs] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [suppliersData, setSuppliersData] = useState([]);
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
    // Fetch Orders
    const ordersRef = ref(db, 'orders');
    onValue(ordersRef, (snapshot) => {
      const orders = snapshot.val();
      const ordersList = orders ? Object.entries(orders) : [];
      setOrdersData(ordersList);
    });

    // Fetch Stock Changes
    const stockChangesRef = ref(db, 'stockChanges');
    onValue(stockChangesRef, (snapshot) => {
      const stockData = snapshot.val();
      const stockList = stockData
        ? Object.entries(stockData).flatMap(([productId, changes]) =>
            Object.entries(changes).map(([changeId, change]) => ({ productId, ...change }))
          )
        : [];
      setStockChanges(stockList);
    });

    // Fetch User Logs
    const logsRef = ref(db, 'userLogs');
    onValue(logsRef, (snapshot) => {
      const logData = snapshot.val();
      const logsList = logData ? Object.entries(logData) : [];
      setUserLogs(logsList);
    });

    // Fetch Products
    const productsRef = ref(db, 'products');
    onValue(productsRef, (snapshot) => {
      const productData = snapshot.val();
      const productList = productData ? Object.entries(productData) : [];
      setProductsData(productList);
    });

    // Fetch Suppliers
    const suppliersRef = ref(db, 'suppliers');
    onValue(suppliersRef, (snapshot) => {
      const supplierData = snapshot.val();
      const supplierList = supplierData ? Object.entries(supplierData) : [];
      setSuppliersData(supplierList);
    });
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prevState) => !prevState);
  };

  const handleLogout = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const logoutTime = getManilaTime();
        const userLogsRef = ref(db, `userLogs/${userId}`);
        await update(userLogsRef, { logoutTime });
      }
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getManilaTime = () => {
    const options = {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
    const formatter = new Intl.DateTimeFormat('en-PH', options);
    const [date, time] = formatter.format(new Date()).split(', ');
    return `${date} ${time}`;
  };

  const downloadExcel = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  return (
    <div className={styles.parent}>
      <Link to="/adminboard" className={styles.logo}>
        <img src={image} alt="Logo" />
      </Link>
      <div className={`${styles.div2} ${isCollapsed ? styles.hidden : styles.visible}`}>
        <div className={styles.buttonContainer}>
          <Link to="/sales" className={styles.button2}>
            <FontAwesomeIcon icon={faSackDollar} /> Sales
          </Link>
          <Link to="/history" className={styles.button2}>
            <FontAwesomeIcon icon={faHistory} /> History
          </Link>
          <Link to="/pager" className={styles.button3}>
            <FontAwesomeIcon icon={faUser} /> Create User
          </Link>
          <Link to="/admininventory" className={styles.button2}>
            <FontAwesomeIcon icon={faHistory} /> Inventory
          </Link>
          <Link to="/supplier" className={styles.button3}>
            <FontAwesomeIcon icon={faUser} /> Supplier
          </Link>
        </div>
      </div>

      <div className={`${styles.content} ${isCollapsed ? styles.fullWidth : ''}`}>
        <button className={styles.toggleButton} onClick={toggleCollapse}>
          <FontAwesomeIcon icon={faBars} />
        </button>

        {/* Orders Data */}
        <div className={styles.tableContainer}>
          <h1>Orders</h1>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Total Amount</th>
                <th>Payment Status</th>
                <th>Status</th>
                <th>Date Ordered</th>
              </tr>
            </thead>
            <tbody>
              {ordersData.map(([id, order]) => (
                <tr key={id}>
                  <td>{order.customer}</td>
                  <td>₱{order.items.reduce((total, item) => total + parseFloat(item.totalPrice), 0).toFixed(2)}</td>
                  <td>{order.payment}</td>
                  <td>{order.status}</td>
                  <td>{new Date(order.dateOrdered).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => downloadExcel(ordersData.map(([id, order]) => ({
            customer: order.customer,
            totalAmount: order.items.reduce((total, item) => total + parseFloat(item.totalPrice), 0).toFixed(2),
            paymentStatus: order.payment,
            status: order.status,
            dateOrdered: new Date(order.dateOrdered).toLocaleDateString(),
          })), 'OrdersData')}>
            Download Orders Data
          </button>
        </div>

        {/* Stock Change History */}
        <div className={styles.tableContainer}>
          <h1>Stock Change History</h1>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Variation Code</th>
                <th>Quantity Changed</th>
                <th>Change Type</th>
                <th>Change Date</th>
                <th>Changed By</th>
              </tr>
            </thead>
            <tbody>
              {stockChanges.map((change, index) => (
                <tr key={index}>
                  <td>{change.productName}</td>
                  <td>{change.variationCode}</td>
                  <td>{change.quantityChanged}</td>
                  <td>{change.changeType}</td>
                  <td>{new Date(change.changeDate).toLocaleString()}</td>
                  <td>{change.firstName}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => downloadExcel(stockChanges.map(change => ({
            productName: change.productName,
            variationCode: change.variationCode,
            quantityChanged: change.quantityChanged,
            changeType: change.changeType,
            changeDate: new Date(change.changeDate).toLocaleString(),
            changedBy: change.firstName,
          })), 'StockChanges')}>
            Download Stock Change History
          </button>
        </div>

        {/* User Logs */}
        <div className={styles.tableContainer}>
          <h1>User Logs</h1>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Login Time</th>
                <th>Logout Time</th>
              </tr>
            </thead>
            <tbody>
              {userLogs.map(([userId, log]) => (
                <tr key={userId}>
                  <td>{userId}</td>
                  <td>{log.loginTime ? new Date(log.loginTime).toLocaleString() : 'N/A'}</td>
                  <td>{log.logoutTime ? new Date(log.logoutTime).toLocaleString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => downloadExcel(userLogs.map(([userId, log]) => ({
            userId,
            loginTime: log.loginTime ? new Date(log.loginTime).toLocaleString() : 'N/A',
            logoutTime: log.logoutTime ? new Date(log.logoutTime).toLocaleString() : 'N/A',
          })), 'UserLogs')}>
            Download User Logs
          </button>
        </div>

        {/* Products */}
        <div className={styles.tableContainer}>
          <h1>Products</h1>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product Category</th>
                <th>Product Name</th>
                <th>Price</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {productsData.map(([id, product]) => (
                product.variations.map((variation, index) => (
                  <tr key={`${id}-${index}`}>
                    <td>{product.productCategory}</td>
                    <td>{variation.productName}</td>
                    <td>₱{variation.productPrice}</td>
                    <td>{variation.quantity}</td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
          <button onClick={() => downloadExcel(productsData.map(([id, product]) =>
            product.variations.map(variation => ({
              productCategory: product.productCategory,
              productName: variation.productName,
              price: variation.productPrice,
              quantity: variation.quantity,
            }))
          ).flat(), 'Products')}>
            Download Products Data
          </button>
        </div>

        {/* Suppliers */}
        <div className={styles.tableContainer}>
          <h1>Suppliers</h1>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Company</th>
                <th>Location</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Material</th>
              </tr>
            </thead>
            <tbody>
              {suppliersData.map(([id, supplier]) => (
                <tr key={id}>
                  <td>{supplier.company}</td>
                  <td>{supplier.location}</td>
                  <td>{supplier.contact}</td>
                  <td>{supplier.email}</td>
                  <td>{supplier.material}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => downloadExcel(suppliersData.map(([id, supplier]) => ({
            company: supplier.company,
            location: supplier.location,
            contact: supplier.contact,
            email: supplier.email,
            material: supplier.material,
          })), 'Suppliers')}>
            Download Suppliers Data
          </button>
        </div>
      </div>

      <div className={styles.searchbar}>
        {currentUser?.photoURL && (
          <div className={styles.userProfileImage} onClick={() => setShowModal(true)}>
            <img src={currentUser.photoURL} alt="User Profile" className={styles.userProfileImage} />
          </div>
        )}
        <div className={styles.buttonLogout} onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} />
        </div>
      </div>
      <div className={styles.pagename}>| History</div>

      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default History;
