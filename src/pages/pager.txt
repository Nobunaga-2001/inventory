import React, { useState } from 'react';
import { ref, set } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import image from '../images/logo.png';
import { useNavigate } from 'react-router-dom';
import styles from './Pager.module.css';

const Pager = () => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
      <div className={styles.leftColumn}>
        <img src={image} alt="Logo" className={styles.logo} />
      </div>
      <div className={styles.rightColumn}>
        <div className={styles.formContainer}>
          <h1>Create an Account</h1>
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
            <button type="button" className={styles.loginButton} onClick={() => navigate('/')}>LOGIN</button>
            {error && <p className={styles.errorMessage}>{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Pager;
