import React, { useEffect, useState, useRef } from 'react';
import { ref, get, update } from 'firebase/database';
import { auth, db, storage } from '../firebase'; // Assume storage is set up in firebase.js
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import styles from './Modal.module.css';

const ModalEmp = ({ onClose }) => {
  const [userData, setUserData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setUserData(data);
        }
      }
    };
    fetchUserData();
  }, []);

  // Function to start the camera
  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing the camera:', error);
    }
  };

  // Function to capture the photo
  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (video && context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/png');
      setCapturedImage(imageData);
      stopCamera();
    }
  };

  // Function to stop the camera stream
  const stopCamera = () => {
    setCameraActive(false);
    const stream = videoRef.current?.srcObject;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }
  };

  // Function to handle uploading the captured image
  const handleUpload = async () => {
    if (capturedImage) {
      try {
        setUploading(true);
        const userId = auth.currentUser?.uid;
        const fileRef = storageRef(storage, `profilePictures/${userId}`);

        // Convert the captured image (base64) to a Blob
        const response = await fetch(capturedImage);
        const blob = await response.blob();

        // Upload the Blob to Firebase Storage
        await uploadBytes(fileRef, blob);
        const photoURL = await getDownloadURL(fileRef);

        // Update the user's profile with the new photo URL
        const userRef = ref(db, `users/${userId}`);
        await update(userRef, { photoURL });

        // Update the local state to reflect the new photo
        setUserData((prevData) => ({ ...prevData, photoURL }));
        setCapturedImage(null); // Clear the captured image after uploading
      } catch (error) {
        console.error('Error uploading the file:', error);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <span className={styles.close} onClick={onClose}>&times;</span>
        {userData ? (
          <div className={styles.content}>
            <h2>Profile Information</h2>
            {userData.photoURL ? (
              <img src={userData.photoURL} alt="Profile" className={styles.profileImage} />
            ) : (
              <div>
                {!cameraActive && !capturedImage && (
                  <button onClick={startCamera}>Open Camera to Take Photo</button>
                )}

                {cameraActive && (
                  <div>
                    <video ref={videoRef} autoPlay className={styles.video} />
                    <button onClick={capturePhoto}>Capture Photo</button>
                  </div>
                )}

                {capturedImage && (
                  <div>
                    <img src={capturedImage} alt="Captured" className={styles.capturedImage} />
                    <button onClick={handleUpload} disabled={uploading}>
                      {uploading ? 'Uploading...' : 'Save Photo'}
                    </button>
                  </div>
                )}

                <canvas ref={canvasRef} style={{ display: 'none' }} width={640} height={480} />
              </div>
            )}

            <div className={styles.userInfo}>
              <p><strong>Email:</strong> {userData.email}</p>
              <p><strong>Name:</strong> {userData.firstName} {userData.lastName}</p>
              <p><strong>Gender:</strong> {userData.gender}</p>
            </div>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
};

export default ModalEmp;
