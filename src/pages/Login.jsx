import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { ref, set, update, get } from 'firebase/database';
import styles from './css/Login.module.css';
import image from '../images/logo.png';
import { ThreeDots } from 'react-loader-spinner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userId = user.uid;
      const loginTime = getManilaTime();
      const userProfileRef = ref(db, `users/${userId}`);
      const userProfileSnapshot = await get(userProfileRef);
      const userProfile = userProfileSnapshot.val();
      const role = userProfile ? userProfile.role : 'user';
      const firstName = userProfile ? userProfile.firstName : 'User Name';
      const userLogsRef = ref(db, `userLogs/${userId}`);
      const userLogsSnapshot = await get(userLogsRef);
      const userLogs = userLogsSnapshot.val();

      if (userLogs) {
        await update(userLogsRef, { loginTime });
      } else {
        await set(userLogsRef, {
          uid: userId,
          email: user.email,
          name: firstName,
          loginTime,
          logoutTime: null,
        });
      }

      if (role === 'admin') {
        navigate('/adminboard');
      } else {
        navigate('/inventory');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.parent}>
      <div className={styles.leftColumn}>
        <img src={image} alt="Logo" className={styles.logo} />
      </div>
      <div className={styles.rightColumn}>
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit}>
            <h1 className={styles.title}>LOGIN</h1>
            <div className={styles.formGroup}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.inputUnderline}
                placeholder="Email"
              />
            </div>
            <div className={styles.formGroup}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.inputUnderline}
                placeholder="Password"
              />
            </div>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
           
            {error && <p className={styles.errorMessage}>{error}</p>}
          </form>
        </div>
      </div>
      {loading && (
        <div className={styles.loaderOverlay}>
          <ThreeDots color="#3f51b5" height={100} width={100} />
          <p>Loading...</p>
        </div>
      )}
    </div>
  );
};

export default Login;
