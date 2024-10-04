import React, { useEffect, useState } from 'react';
import styles from './History.module.css';
import image from '../images/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import {  faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import Modal from './Modal';
import { ref, get, update, onValue } from 'firebase/database';
import * as XLSX from 'xlsx'; // Importing the xlsx package for Excel downloads

const History = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [userLogs, setUserLogs] = useState([]);
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
    const salesRef = ref(db, 'orders'); // Adjust the path as needed
    onValue(salesRef, (snapshot) => {
      const data = snapshot.val();
      const salesList = data ? Object.entries(data).filter(([_, order]) => order.status === 'Delivered') : [];
      setSalesData(salesList);
    });

    const logsRef = ref(db, 'userLogs'); // Adjust the path as needed
    onValue(logsRef, (snapshot) => {
      const logData = snapshot.val();
      const logsList = logData ? Object.entries(logData) : [];
      setUserLogs(logsList);
    });
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(prevState => !prevState);
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
          <Link to="/sales" className={styles.button2}><FontAwesomeIcon icon={faShoppingCart} /> Sales</Link>
          <Link to="/history" className={styles.button2}><FontAwesomeIcon icon={faShoppingCart} /> History</Link>
          <Link to="/pager" className={styles.button3}><FontAwesomeIcon icon={faShoppingCart} /> Create User</Link>
        </div>
        
      </div>
      <div className={`${styles.content} ${isCollapsed ? styles.fullWidth : ''}`}>
        <button className={styles.toggleButton} onClick={toggleCollapse}>
          <FontAwesomeIcon icon={faBars} />
        </button>
        <div className={styles.contentTop}>
        </div>
        <div className={styles.contentBottom}>
          <div className={styles.tableContainer}>
            <h1>Sales Data</h1>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Total Amount</th>
                  <th>Date Ordered</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map(([id, order]) => (
                  <tr key={id}>
                    <td>{order.customer}</td>
                    <td> ₱{order.items.reduce((total, item) => total + parseFloat(item.totalPrice), 0).toFixed(2)}</td>
                    <td>{new Date(order.dateOrdered).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => downloadExcel(salesData.map(([id, order]) => ({
              customer: order.customer,
              totalAmount: order.items.reduce((total, item) => total + parseFloat(item.totalPrice), 0).toFixed(2),
              dateOrdered: new Date(order.dateOrdered).toLocaleDateString(),
            })), 'SalesData')}>
              Download Sales Data
            </button>
          </div>
          
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
        </div>
      </div>
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
      <div className={styles.pagename}>| History</div>

      {showModal && <Modal onClose={() => setShowModal(false)} />}

    </div>
  );
};

export default History;
