import React, { useEffect, useState } from 'react';
import styles from './Pager.module.css';
import image from '../images/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars,faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import Modal from './Modal';
import { ref, get, update, set } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const Pager = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await set(ref(db, 'users/' + user.uid), {
        email,
        firstName,
        lastName,
        gender,
        role: 'user',
      });
      alert('Registration successful!');
      navigate('/login');
    } catch (error) {
      setError(error.message);
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
          <div className={styles.formContainer}>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={styles.inputUnderline}
                  placeholder="Email"
                />
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className={styles.inputUnderline}
                  placeholder="First Name"
                />
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className={styles.inputUnderline}
                  placeholder="Last Name"
                />
              </div>
              <div className="mb-3">
                <label className={styles.label}>Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={styles.inputUnderline}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="mb-3">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={styles.inputUnderline}
                  placeholder="Password"
                />
              </div>
              <div className="mb-3">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={styles.inputUnderline}
                  placeholder="Confirm Password"
                />
              </div>
              <button type="submit" className={styles.submitButton}>REGISTER</button>
              {error && <p className={styles.errorMessage}>{error}</p>}
            </form>
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
