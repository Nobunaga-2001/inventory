import React, { useEffect, useState } from 'react';
import styles from './AdminInventory.module.css'; // Ensure this CSS module includes styles for the tables
import image from '../images/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faSackDollar,
  faHistory,
  faUser,
  faSignOutAlt,
  faTrash // Import trash icon for the delete button
} from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { ref, get, update, onValue, push } from 'firebase/database';

const AdminInventory = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  
  // States for Price Editing
  const [editPriceMode, setEditPriceMode] = useState({}); // For price editing
  const [prices, setPrices] = useState({}); // State for prices
  const [priceChangeHistory, setPriceChangeHistory] = useState([]); // To hold fetched price change history
  const [updating, setUpdating] = useState(false); // State for tracking update process

  const navigate = useNavigate();

  // Fetch user data
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

  // Fetch products, price changes, and stock changes
  useEffect(() => {
    const fetchProducts = () => {
      const productsRef = ref(db, 'products');
      onValue(productsRef, (snapshot) => {
        const data = snapshot.val();
        const productsList = data ? Object.entries(data).map(([key, value]) => ({ id: key, ...value })) : [];
        setProducts(productsList);
      });
    };

    const fetchPriceChanges = () => {
      const priceChangesRef = ref(db, 'priceChanges');
      onValue(priceChangesRef, (snapshot) => {
        const data = snapshot.val();
        const priceChangesList = [];

        if (data) {
          Object.entries(data).forEach(([productId, changes]) => {
            Object.entries(changes).forEach(([changeId, change]) => {
              priceChangesList.push({ productId, ...change });
            });
          });
        }

        setPriceChangeHistory(priceChangesList); // Store the fetched price changes
      });
    };

    const fetchStockChanges = () => {
      const stockChangesRef = ref(db, 'stockChanges');
      onValue(stockChangesRef, (snapshot) => {
        const data = snapshot.val();
        const stockChangesList = {};

        if (data) {
          Object.entries(data).forEach(([productId, changes]) => {
            stockChangesList[productId] = {};
            Object.entries(changes).forEach(([changeId, change]) => {
              stockChangesList[productId][change.variationCode] = change.currentStock; // Store current stock by variation code
            });
          });
        }
      });
    };

    fetchProducts();
    fetchPriceChanges(); // Fetch price changes on component mount
    fetchStockChanges(); // Fetch stock changes on component mount
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(prevState => !prevState);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Handle updating the price
  const handleUpdatePrice = async (productId, variationCode) => {
    const key = `${productId}-${variationCode}`;
    const newPrice = prices[key]; // Use unique key for price

    if (newPrice !== undefined) {
      const price = Number(newPrice);
      if (isNaN(price) || price < 0) {
        alert("Please enter a valid price.");
        return;
      }

      const variationsRef = ref(db, `products/${productId}/variations`);
      const snapshot = await get(variationsRef);
      const variations = snapshot.val();

      if (variations) {
        const variationToUpdate = variations.find(variation => variation.productCode === variationCode);

        if (variationToUpdate) {
          const variationIndex = variations.indexOf(variationToUpdate);
          const previousPrice = variationToUpdate.productPrice; // Store previous price value

          if (price !== previousPrice) {
            const updates = {
              [`${variationIndex}/productPrice`]: price,
            };

            setUpdating(true);

            const user = auth.currentUser;
            let currentUserData = { firstName: 'Unknown', uid: 'Unknown' }; // Default values
            if (user) {
              const userRef = ref(db, `users/${user.uid}`);
              const userSnapshot = await get(userRef);
              if (userSnapshot.exists()) {
                currentUserData = userSnapshot.val();
              }
            }

            await update(variationsRef, updates);
            alert("Price updated successfully!");

            const priceChangeRef = ref(db, `priceChanges/${productId}`);
            const priceChangeLog = {
              variationCode,
              productName: variationToUpdate.productName,
              currentPrice: price,
              previousPrice,
              changeDate: new Date().toISOString(),
              firstName: currentUserData.firstName || 'Unknown',
            };

            await push(priceChangeRef, priceChangeLog);

            // Fetch updated price change history
            const updatedPriceChanges = await get(priceChangeRef);
            const updatedPriceChangeHistory = updatedPriceChanges.val()
              ? Object.entries(updatedPriceChanges.val()).map(([key, value]) => ({ id: key, ...value }))
              : [];
            setPriceChangeHistory(updatedPriceChangeHistory);

            // Fetch updated product data
            const updatedProductsSnapshot = await get(ref(db, 'products'));
            const updatedProductsData = updatedProductsSnapshot.val();
            const updatedProductsList = updatedProductsData
              ? Object.entries(updatedProductsData).map(([key, value]) => ({ id: key, ...value }))
              : [];
            setProducts(updatedProductsList);

            setUpdating(false); // Reset updating state
          } else {
            alert("No changes to update."); // Alert if there's no change
          }
          setEditPriceMode(prev => ({ ...prev, [key]: false })); // Update editPriceMode
        } else {
          console.error("Variation not found.");
        }
      } else {
        console.error("Variations not found.");
      }
    }
  };

  const toggleEditPriceMode = (productId, variationCode, currentPrice) => {
    const key = `${productId}-${variationCode}`; // Unique key for edit mode
    setEditPriceMode(prev => ({
      ...prev,
      [key]: !prev[key], // Toggle the edit mode for the variation
    }));

    if (!editPriceMode[key]) {
      setPrices(prev => ({ ...prev, [key]: currentPrice })); // Set the current price for editing
    }
  };

  // Handle deleting a variation
  const handleDeleteVariation = async (productId, variationCode) => {
    try {
      const productRef = ref(db, `products/${productId}`);
      const snapshot = await get(productRef);
      const product = snapshot.val();

      // Filter out the variation to be deleted
      const updatedVariations = product.variations.filter(variation => variation.productCode !== variationCode);

      // Update Firebase with the updated variations
      await update(productRef, { variations: updatedVariations });

      // Update local state to reflect the changes
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === productId ? { ...product, variations: updatedVariations } : product
        )
      );

      alert('Variation deleted successfully!');
    } catch (error) {
      console.error('Error deleting variation:', error);
    }
  };

  return (
    <div className={styles.parent}>
      <Link to="/adminboard" className={styles.logo}>
        <img src={image} alt="Logo" />
      </Link>
      <div className={`${styles.div2} ${isCollapsed ? styles.hidden : styles.visible}`}>
        <div className={styles.buttonContainer}>
          <Link to="/sales" className={styles.button2}>
            <FontAwesomeIcon icon={faSackDollar} /> Sales
          </Link>
          <Link to="/history" className={styles.button2}>
            <FontAwesomeIcon icon={faHistory} /> History
          </Link>
          <Link to="/pager" className={styles.button3}>
            <FontAwesomeIcon icon={faUser} /> Create User
          </Link>
          <Link to="/admininventory" className={styles.button2}>
            <FontAwesomeIcon icon={faHistory} /> Inventory
          </Link>
          <Link to="/supplier" className={styles.button3}>
            <FontAwesomeIcon icon={faUser} /> Supplier
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
        <div className={styles.contentBottom}>
          {/* Integrated Tables from AdminInvent */}

          {/* Change Price Table */}
          <h2>Change Price</h2>
          <table className={styles.productTable}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Image</th>
                <th>Product Name</th>
                <th>Product Code</th>
                <th>Dimension</th>
                <th>Weight</th>
                <th>Current Price</th>
                <th>Stocks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const variations = product.variations;
                const rowCount = variations.length;

                return variations.map((variation, index) => (
                  <tr key={`${product.id}-${variation.productCode}`}>
                    {index === 0 && (
                      <>
                        <td rowSpan={rowCount}>{product.productCategory}</td>
                        <td rowSpan={rowCount}>
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={variation.productName} className={styles.image} />
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
                      {editPriceMode[`${product.id}-${variation.productCode}`] ? (
                        <input 
                          type="number" 
                          value={prices[`${product.id}-${variation.productCode}`] || variation.productPrice} 
                          onChange={(e) => setPrices(prev => ({ ...prev, [`${product.id}-${variation.productCode}`]: e.target.value }))} 
                        />
                      ) : (
                        <span>₱{variation.productPrice}</span>
                      )}
                    </td>
                    <td>{variation.quantity}</td>
                    <td>
                      {editPriceMode[`${product.id}-${variation.productCode}`] ? (
                        <>
                          <button onClick={() => handleUpdatePrice(product.id, variation.productCode)} disabled={updating}>
                            {updating ? 'Saving...' : 'Save Price'}
                          </button>
                          <button onClick={() => toggleEditPriceMode(product.id, variation.productCode, variation.productPrice)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => toggleEditPriceMode(product.id, variation.productCode, variation.productPrice)}>
                            Edit Price
                          </button>
                          <button onClick={() => handleDeleteVariation(product.id, variation.productCode)}>
                            <FontAwesomeIcon icon={faTrash} /> Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>

          {/* Price Change History Table */}
          <h2>Price Change History</h2>
          <table className={styles.productTable}>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Current Price</th>
                <th>Previous Price</th>
                <th>Change Date</th>
                <th>User Name</th>
              </tr>
            </thead>
            <tbody>
              {priceChangeHistory.map((change, index) => (
                <tr key={`${change.productId}-${index}`}>
                  <td>{change.productName}</td>
                  <td>₱{change.currentPrice}</td>
                  <td>₱{change.previousPrice}</td>
                  <td>{new Date(change.changeDate).toLocaleString()}</td>
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

export default AdminInventory;
