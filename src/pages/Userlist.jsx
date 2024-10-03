import React, { useEffect, useState } from 'react';
import styles from './Pager.module.css';
import image from '../images/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { faUser, faSignOutAlt} from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import Modal from './Modal';
import { ref, get } from 'firebase/database';
import { sendPasswordResetEmail } from 'firebase/auth';

const Pager = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
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

    const fetchUsers = async () => {
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      const usersList = [];
      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        usersList.push({ 
          uid: childSnapshot.key, 
          email: userData.email,
        });
      });
      setUsers(usersList);
    };

    fetchUserData();
    fetchUsers();
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(prevState => !prevState);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleResetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`Password reset link sent to ${email}`);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      alert('Error sending password reset email.');
    }
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
          <Link to="/pager" className={styles.navButton1}>Create User</Link>
          <Link to="/userlist" className={styles.navButton2}>User List</Link>
        </div>
        <div className={styles.contentBottom}>
          <div className={styles.tableContainer}>
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.uid}>
                    <td>{user.email}</td>
                    <td>
                      <button onClick={() => handleResetPassword(user.email)}>
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className={styles.searchbar}>Search Bar</div>
      <div className={styles.pagename}>| Create User Account</div>

      {showModal && <Modal onClose={() => setShowModal(false)} />}

      {currentUser && (
        <div className={styles.userInfo}>
          <p>Welcome, {currentUser.firstName}</p>
        </div>
      )}
    </div>
  );
};

export default Pager;
