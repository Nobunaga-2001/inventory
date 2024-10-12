import React, { useEffect, useState } from 'react';
import styles from './Supplier.module.css';
import image from '../images/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faHistory, faSackDollar, faUser } from '@fortawesome/free-solid-svg-icons';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import Modal from './Modal';
import { ref, get, update, push } from 'firebase/database';

const Supplier = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ company: '', location: '', contact: '', email: '', material: '' });
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const suppliersRef = ref(db, 'suppliers');
    await push(suppliersRef, formData);
    setFormData({ company: '', location: '', contact: '', email: '', material: '' });
    alert('Supplier information saved successfully!');
  };

  return (
    <div className={styles.parent}>
      <Link to="/inventory" className={styles.logo}>
        <img src={image} alt="Logo" />
      </Link>
      <div className={`${styles.div2} ${isCollapsed ? styles.hidden : styles.visible}`}>
        <div className={styles.buttonContainer}>
          <Link to="/sales" className={styles.button2}><FontAwesomeIcon icon={faSackDollar} /> Sales</Link>
          <Link to="/history" className={styles.button2}><FontAwesomeIcon icon={faHistory} /> History</Link>
          <Link to="/pager" className={styles.button3}><FontAwesomeIcon icon={faUser} /> Create User</Link>
          <Link to="/admininventory" className={styles.button2}><FontAwesomeIcon icon={faHistory} /> Inventory</Link>
          <Link to="/adminsupplier" className={styles.button3}><FontAwesomeIcon icon={faUser} /> Supplier</Link>
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
          <form onSubmit={handleSubmit}>
            <input type="text" name="company" placeholder="Company" value={formData.company} onChange={handleInputChange} required />
            <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleInputChange} required />
            <input type="text" name="contact" placeholder="Contact" value={formData.contact} onChange={handleInputChange} required />
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} required />
            
            {/* Select dropdown for material with predefined values */}
            <select name="material" value={formData.material} onChange={handleInputChange} required>
              <option value="" disabled>Select Material</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
            
            <button type="submit">Save Supplier</button>
          </form>
        </div>
      </div>
      <div className={styles.searchbar}>
        {currentUser && (
          <div className={styles.userInfo}>
            <p>Welcome, {currentUser.firstName}</p>
          </div>
        )}
      </div>
      <div className={styles.pagename}>| Supplier</div>
      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default Supplier;
