import React, { useEffect, useState } from 'react';
import { ref, get, update } from 'firebase/database';
import { auth, db, storage } from '../firebase';
import { getDownloadURL, uploadBytes, ref as storageRef } from 'firebase/storage';
import styles from './Modal.module.css';

const Modal = ({ onClose }) => {
  const [userData, setUserData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    gender: '',
    photoURL: '',
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setUserData(data);
          setFormData(data);
        }
      }
    };
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFile(file);
  };

  const handleSave = async () => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      const userRef = ref(db, `users/${userId}`);
      
      if (file) {
        const storageReference = storageRef(storage, `profileImages/${userId}`);
        await uploadBytes(storageReference, file);
        const photoURL = await getDownloadURL(storageReference);
        formData.photoURL = photoURL;
      }

      await update(userRef, formData);
      setUserData(formData);
      setEditing(false);
      setFile(null);
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <span className={styles.close} onClick={onClose}>&times;</span>
        {userData ? (
          <div className={styles.content}>
            <h2>Profile</h2>
            {userData.photoURL && (
              <img src={userData.photoURL} alt="Profile" className={styles.profileImage} />
            )}
            {!editing ? (
              <div className={styles.userInfo}>
                <p>Email: {userData.email}</p>
                <p>Name: {userData.firstName} {userData.lastName}</p>
                <p>Gender: {userData.gender}</p>
                <button className={styles.editButton} onClick={() => setEditing(true)}>Edit Profile</button>
              </div>
            ) : (
              <div className={styles.form}>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                />
                <input
                  type="text"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  placeholder="Gender"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <div className={styles.buttonContainer}>
                  <button className={styles.saveButton} onClick={handleSave}>Save</button>
                  <button className={styles.cancelButton} onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
};

export default Modal;
