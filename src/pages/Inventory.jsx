import React, { useEffect, useState } from 'react';
import styles from './Inventory.module.css';
import image from '../images/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faClipboardList, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import Modal from './Modal';
import { ref, get, update, push, set } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const Inventory = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    productCategory: '',
    imageUrl: '',
    imageFile: null,
    variations: [{
      productName: '',
      productDimension: '',
      productWeight: '',
      productPrice: '',
      quantity: '',
      productCode: '',
      productId: '',
    }],
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
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
      //navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prevData => ({
        ...prevData,
        imageFile: file,
        imageUrl: '',
      }));
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleVariationChange = (index, e) => {
    const { name, value } = e.target;
    const newVariations = [...formData.variations];
    newVariations[index] = { ...newVariations[index], [name]: value };
    setFormData(prevData => ({
      ...prevData,
      variations: newVariations,
    }));
  };

  const addVariation = () => {
    setFormData(prevData => ({
      ...prevData,
      variations: [...prevData.variations, {
        productName: '',
        productDimension: '',
        productWeight: '',
        productPrice: '',
        quantity: '',
        productCode: '',
        productId: '',
      }],
    }));
  };

  const removeVariation = (index) => {
    const newVariations = formData.variations.filter((_, i) => i !== index);
    setFormData(prevData => ({
      ...prevData,
      variations: newVariations,
    }));
  };

  const uploadImage = async (file) => {
    const storage = getStorage();
    const storagePath = `images/${file.name}`;
    const imageRef = storageRef(storage, storagePath);
    const uploadTask = uploadBytesResumable(imageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        null,
        (error) => {
          console.error('Error uploading image:', error);
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          });
        }
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const currentDate = new Date().toLocaleDateString('en-US');
    let imageUrl = formData.imageUrl;

    if (formData.imageFile) {
      try {
        imageUrl = await uploadImage(formData.imageFile);
      } catch (error) {
        console.error('Error uploading image:', error);
        return;
      }
    }

    try {
      const newProductRef = push(ref(db, 'products'));
      const productData = {
        productCategory: formData.productCategory,
        imageUrl,
        dateAdded: currentDate,
        addedBy: currentUser?.firstName || 'Unknown',
        variations: formData.variations,
      };
      await set(newProductRef, productData);

      setSuccessMessage('Product successfully added!');
      setFormData({
        productCategory: '',
        imageUrl: '',
        imageFile: null,
        variations: [{
          productName: '',
          productDimension: '',
          productWeight: '',
          productPrice: '',
          quantity: '',
          productCode: '',
          productId: '',
        }],
      });
      setPreviewUrl('');
    } catch (error) {
      console.error('Error saving data to Firebase:', error);
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
      <div className={`${styles.div2} ${isCollapsed ? styles.hidden : styles.visible}`}>
        <div className={styles.buttonContainer}>
          <Link to="/inventory" className={styles.button1}><FontAwesomeIcon icon={faClipboardList} /> Inventory</Link>
          <Link to="/order" className={styles.button2}><FontAwesomeIcon icon={faShoppingCart} /> Order</Link>
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
      <div className={styles.searchbar}>
      {currentUser && (
        <div className={styles.userInfo}>
          <p>Welcome, {currentUser.firstName}</p>
        </div>
      )}
      </div>
      <div className={styles.pagename}>| Inventory</div>
      <div className={`${styles.content} ${isCollapsed ? styles.fullWidth : ''}`}>
        <button className={styles.toggleButton} onClick={toggleCollapse}>
          <FontAwesomeIcon icon={faBars} />
        </button>
        <div className={styles.contentTop}>
          <Link to="/inventory" className={styles.navButton1}>Inventory</Link>
          <Link to="/inventorylist" className={styles.navButton2}>Inventory List</Link>
        </div>
        <div className={styles.contentBottom}>
          <form onSubmit={handleSubmit} className={styles.productForm}>
            <label>
                <h1>CATEGORY</h1> 
              <input
                type="text"
                name="productCategory"
                value={formData.productCategory}
                onChange={handleChange}
                required
              />
            </label>
            <div className={styles.imageUploadContainer}>
    <label>
        Upload Image:
        <div className={styles.imageUploadContent}>
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className={styles.fileInput}
            />
            {previewUrl && (
                <div className={styles.imagePreview}>
                    <img src={previewUrl} alt="Preview" className={styles.previewImage} />
                </div>
                        )}
                    </div>
                </label>
            </div>
            {formData.variations.map((variation, index) => (
           <div className={styles.variationGroup}>
    
           <div className={styles.variationInputs}>
               <label className={styles.nameInput}>
                   Name:
                   <input
                       type="text"
                       name="productName"
                       value={variation.productName}
                       onChange={(e) => handleVariationChange(index, e)}
                       required
                   />
               </label>
               <label>
                   Dimension:
                   <input
                       type="text"
                       name="productDimension"
                       value={variation.productDimension}
                       onChange={(e) => handleVariationChange(index, e)}
                       required
                   />
               </label>
               <label>
                   Weight:
                   <input
                       type="text"
                       name="productWeight"
                       value={variation.productWeight}
                       onChange={(e) => handleVariationChange(index, e)}
                       required
                   />
               </label>
               <label>
                   Price:
                   <input
                       type="number"
                       name="productPrice"
                       value={variation.productPrice}
                       onChange={(e) => handleVariationChange(index, e)}
                       required
                   />
               </label>
               <label>
                   Quantity:
                   <input
                       type="number"
                       name="quantity"
                       value={variation.quantity}
                       onChange={(e) => handleVariationChange(index, e)}
                       required
                   />
               </label>
               <label>
                   Code:
                   <input
                       type="text"
                       name="productCode"
                       value={variation.productCode}
                       onChange={(e) => handleVariationChange(index, e)}
                       required
                   />
               </label>
               <label>
                   ID:
                   <input
                       type="text"
                       name="productId"
                       value={variation.productId}
                       onChange={(e) => handleVariationChange(index, e)}
                       required
                   />
               </label>
           </div>
           <button type="button" onClick={() => removeVariation(index)}>Remove Variation</button>
       </div>
       
    
        ))}
            <button type="button" onClick={addVariation}>Add Variation</button>
            <button type="submit">Submit</button>
            {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
          </form>
        </div>
      </div>
      {showModal && <Modal currentUser={currentUser} onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default Inventory;
