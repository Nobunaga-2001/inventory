import React, { useEffect, useState } from 'react';
import styles from './Inventorylist.module.css';
import image from '../images/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faClipboardList,
  faShoppingCart,
  faUser,
  faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { ref, get, update, onValue, push } from 'firebase/database';

const Inventorylist = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [editMode, setEditMode] = useState({});
  const [quantities, setQuantities] = useState({});
  const [stockChangeHistory, setStockChangeHistory] = useState([]);
  const [updating, setUpdating] = useState(false);
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
    const fetchProducts = () => {
      const productsRef = ref(db, 'products');
      onValue(productsRef, (snapshot) => {
        const data = snapshot.val();
        const productsList = data
          ? Object.entries(data).map(([key, value]) => ({ id: key, ...value }))
          : [];
        setProducts(productsList);
      });
    };

    const fetchStockChanges = () => {
      const stockChangesRef = ref(db, 'stockChanges');
      onValue(stockChangesRef, (snapshot) => {
        const data = snapshot.val();
        const changesList = [];

        if (data) {
          Object.entries(data).forEach(([productId, changes]) => {
            Object.entries(changes).forEach(([changeId, change]) => {
              changesList.push({ productId, ...change });
            });
          });
        }

        setStockChangeHistory(changesList);
      });
    };

    fetchProducts();
    fetchStockChanges();
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prevState) => !prevState);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleUpdateQuantity = async (productId, variationCode) => {
    const uniqueKey = `${productId}-${variationCode}`;
    const newQuantity = quantities[uniqueKey]; // Quantity input by user
  
    // Ensure newQuantity is a valid number
    if (newQuantity !== undefined) {
      const quantity = Number(newQuantity);
  
      // Check if the new quantity is a valid number and non-negative
      if (isNaN(quantity) || quantity < 0) {
        alert('Please enter a valid quantity.');
        return;
      }
  
      // Fetch the current variations from Firebase
      const variationsRef = ref(db, `products/${productId}/variations`);
      const snapshot = await get(variationsRef);
      const variations = snapshot.val();
  
      if (variations) {
        // Find the variation we're trying to update
        const variationToUpdate = variations.find(
          (variation) => variation.productCode === variationCode
        );
        const variationIndex = variations.indexOf(variationToUpdate);
        const previousStock = variationToUpdate.quantity;
  
        // Calculate the change amount
        const changeAmount = quantity - previousStock;
  
        // **Void the operation if quantityChanged is 0**
        if (changeAmount === 0) {
          // No change in quantity detected
          alert('No changes to update. The stock quantity is the same.');
          setEditMode((prev) => ({ ...prev, [uniqueKey]: false })); // Exit edit mode
          return; // Exit early without updating the database
        }
  
        // Proceed with updating since a change was detected
        const changeType = changeAmount > 0 ? 'Added' : 'Sold';
  
        const updates = {
          [`${variationIndex}/quantity`]: quantity, // Update the quantity
        };
  
        setUpdating(true);
  
        // Get the current user details
        const user = auth.currentUser;
        let currentUserData = { firstName: 'Unknown', uid: 'Unknown' };
        if (user) {
          const userRef = ref(db, `users/${user.uid}`);
          const userSnapshot = await get(userRef);
          if (userSnapshot.exists()) {
            currentUserData = userSnapshot.val();
          }
        }
  
        // Update the product variation quantity in Firebase
        await update(variationsRef, updates);
        alert('Quantity updated successfully!');
  
        // Log the stock change in Firebase
        const stockChangeRef = ref(db, `stockChanges/${productId}`);
        const changeLog = {
          variationCode,
          productName: variationToUpdate.productName,
          currentStock: quantity,
          previousStock,
          quantityChanged: Math.abs(changeAmount),
          changeDate: new Date().toISOString(),
          changeType,
          firstName: currentUserData.firstName || 'Unknown',
        };
  
        // Check for duplicate change logs before pushing
        const isDuplicate = stockChangeHistory.some(
          (change) =>
            change.variationCode === variationCode &&
            change.currentStock === quantity &&
            change.previousStock === previousStock &&
            change.changeType === changeType &&
            new Date(change.changeDate).toISOString() === changeLog.changeDate
        );
  
        if (!isDuplicate) {
          await push(stockChangeRef, changeLog);
          setStockChangeHistory((prev) => [...prev, changeLog]);
        } else {
          alert('This change has already been logged.');
        }
  
        // Fetch updated stock change history
        const updatedStockChanges = await get(stockChangeRef);
        const updatedStockChangeHistory = updatedStockChanges.val()
          ? Object.entries(updatedStockChanges.val()).map(([key, value]) => ({
              id: key,
              ...value,
            }))
          : [];
        setStockChangeHistory(updatedStockChangeHistory);
  
        // Exit edit mode for this product variation
        setEditMode((prev) => ({ ...prev, [uniqueKey]: false }));
        setUpdating(false);
      }
    }
  };
  
  
  
  const toggleEditMode = (productId, variationCode, currentQuantity) => {
    const uniqueKey = `${productId}-${variationCode}`;
    // Ensure one editable row per variation
    setEditMode((prev) => {
      const newEditMode = {};
      Object.keys(prev).forEach((key) => {
        newEditMode[key] = false; // Reset all edit modes
      });
      newEditMode[uniqueKey] = !prev[uniqueKey]; // Toggle the selected one
      return newEditMode;
    });

    // Set the current quantity for the selected variation
    if (!editMode[uniqueKey]) {
      setQuantities((prev) => ({ ...prev, [uniqueKey]: currentQuantity }));
    }
  };

  return (
    <div className={styles.parent}>
      <Link to="/inventory" className={styles.logo}>
        <img src={image} alt="Logo" />
      </Link>
      <div
        className={`${styles.div2} ${isCollapsed ? styles.hidden : styles.visible}`}
      >
        <div className={styles.buttonContainer}>
          <Link to="/inventory" className={styles.button1}>
            <FontAwesomeIcon icon={faClipboardList} /> Inventory
          </Link>
          <Link to="/order" className={styles.button2}>
            <FontAwesomeIcon icon={faShoppingCart} /> Order
          </Link>
        </div>
        <div className={styles.buttonRow}>
          <div className={styles.buttonProfile}>
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
          <Link to="/inventory" className={styles.navButton1}>
            Inventory
          </Link>
          <Link to="/inventorylist" className={styles.navButton2}>
            Inventory List
          </Link>
        </div>
        <div className={styles.contentBottom}>
          <h2>Change Quantity</h2>
          <table className={styles.productTable}>
            <thead>
              <tr>
                <th>Date Added</th>
                <th>Category</th>
                <th>Image</th>
                <th>Product Name</th>
                <th>Product Code</th>
                <th>Dimension</th>
                <th>Weight</th>
                
                <th>Current Stocks</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const variations = product.variations;
                const rowCount = variations.length;

                return variations.map((variation, index) => {
                  const uniqueKey = `${product.id}-${variation.productCode}`;
                  return (
                    <tr key={uniqueKey}>
                      {/* Merge cells for the same category */}
                      {index === 0 && (
                        <>
                          <td rowSpan={rowCount}>
                            {new Date(product.dateAdded).toLocaleDateString()}
                          </td>
                          <td rowSpan={rowCount}>{product.productCategory}</td>
                          <td rowSpan={rowCount}>
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.productCategory}
                                className={styles.productImage}
                              />
                            ) : (
                              'No Image'
                            )}
                          </td>
                        </>
                      )}
                      <td>{variation.productName}</td>
                      <td>{variation.productCode}</td>
                      <td>{variation.productDimension}</td>
                      <td>{variation.productWeight}</td>
                      
                      <td>
                        {editMode[uniqueKey] ? (
                          <input
                            type="number"
                            value={quantities[uniqueKey] || variation.quantity}
                            onChange={(e) =>
                              setQuantities((prev) => ({
                                ...prev,
                                [uniqueKey]: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          <span>{variation.quantity}</span>
                        )}
                      </td>
                      <td>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(variation.productPrice)}</td>
                      <td>
                        {editMode[uniqueKey] ? (
                          <button
                            onClick={() =>
                              handleUpdateQuantity(product.id, variation.productCode)
                            }
                            disabled={updating}
                          >
                            {updating ? 'Saving...' : 'Save'}
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              toggleEditMode(
                                product.id,
                                variation.productCode,
                                variation.quantity
                              )
                            }
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>

          <h2>Stock Change History</h2>
          <table className={styles.productTable}>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Current Stock</th>
                <th>Previous Stock</th>
                <th>Quantity Changed</th>
                <th>Change Date</th>
                <th>Modification</th>
                <th>User Name</th>
              </tr>
            </thead>
            <tbody>
              {stockChangeHistory.map((change, index) => (
                <tr key={`${change.productId}-${index}`}>
                  <td>{change.productName}</td>
                  <td>{change.currentStock}</td>
                  <td>{change.previousStock}</td>
                  <td>{change.quantityChanged}</td>
                  <td>{new Date(change.changeDate).toLocaleString()}</td>
                  <td>{change.changeType}</td>
                  <td>{change.firstName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className={styles.searchbar}>
        {currentUser && (
          <div className={styles.userInfo}>
            <p>Welcome, {currentUser.firstName}</p>
          </div>
        )}
      </div>
      <div className={styles.pagename}>| Inventory List</div>
    </div>
  );
};

export default Inventorylist;
