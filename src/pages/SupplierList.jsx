import React, { useEffect, useState } from 'react';
import styles from './SupplierList.module.css';
import image from '../images/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faSackDollar, faHistory } from '@fortawesome/free-solid-svg-icons';
import { faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import Modal from './Modal';
import { ref, get, update } from 'firebase/database';

const SupplierList = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
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
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const suppliersRef = ref(db, 'suppliers');
    const snapshot = await get(suppliersRef);
    if (snapshot.exists()) {
      const suppliersData = snapshot.val();
      setSuppliers(Object.values(suppliersData));
    }
  };

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
      navigate('/');
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

  return (
    <div className={styles.parent}>
      <Link to="/inventory" className={styles.logo}>
        <img src={image} alt="Logo" />
      </Link>
      <div className={styles.pagename}>| Supplier</div>
      <div className={`${styles.div2} ${isCollapsed ? styles.hidden : styles.visible}`}>
        <div className={styles.buttonContainer}>
              <Link to="/sales" className={styles.button2}><FontAwesomeIcon icon={faSackDollar} /> Sales</Link>
              <Link to="/history" className={styles.button2}><FontAwesomeIcon icon={faHistory} /> History</Link>
              <Link to="/pager" className={styles.button3}><FontAwesomeIcon icon={faUser} /> Create User</Link>
              <Link to="/admininventory" className={styles.button2}><FontAwesomeIcon icon={faHistory} /> Inventory</Link>
              <Link to="/supplier" className={styles.button3}><FontAwesomeIcon icon={faUser} /> Supplier</Link>
        </div>
        <div className={styles.buttonRow}>
          <div className={styles.buttonProfile} onClick={() => setShowModal(true)}>
            <FontAwesomeIcon icon={faUser} />
          </div>
          <div className={styles.buttonLogout} onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} />
          </div>
        </div>
      </div>
      <div className={`${styles.content} ${isCollapsed ? styles.fullWidth : ''}`}>
        <button className={styles.toggleButton} onClick={toggleCollapse}>
          <FontAwesomeIcon icon={faBars} />
        </button>
        <div className={styles.contentTop}>
          <Link to="/supplier" className={styles.navButton1}>Supplier</Link>
          <Link to="/supplierlist" className={styles.navButton2}>Supplier List</Link>
        </div>
        <div className={styles.contentBottom}>
          <table className={styles.supplierTable}>
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Material</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier, index) => (
                <tr key={index}>
                  <td>{supplier.company}</td>
                  <td>{supplier.contact}</td>
                  <td>{supplier.email}</td>
                  <td>{supplier.material}</td>
                  <td>{supplier.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className={styles.searchbar}>
        {currentUser && (
          <div className={styles.userInfo}>
            <h2>Welcome, {currentUser.firstName}</h2>
          </div>
        )}
      </div>
      
      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default SupplierList;
