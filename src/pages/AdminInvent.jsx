import React, { useEffect, useState } from 'react';
import styles from './AdminInvent.module.css'; // Import the CSS module
import { db } from '../firebase';
import { ref, onValue, update, get, push } from 'firebase/database';
import { auth } from '../firebase'; // Import auth for current user

const AdminInvent = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editPriceMode, setEditPriceMode] = useState({}); // For price editing
  const [prices, setPrices] = useState({}); // State for prices
  const [priceChangeHistory, setPriceChangeHistory] = useState([]); // To hold fetched price change history
  const [stockChanges, setStockChanges] = useState({}); // To hold current stock changes
  const [updating, setUpdating] = useState(false); // State for tracking update process

  // Fetch products and price change histories on component mount
  useEffect(() => {
    const fetchProducts = () => {
      const productsRef = ref(db, 'products');
      onValue(productsRef, (snapshot) => {
        const data = snapshot.val();
        const productsList = data ? Object.entries(data).map(([key, value]) => ({ id: key, ...value })) : [];
        setProducts(productsList);
        setLoading(false);
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

        setStockChanges(stockChangesList); // Store the fetched stock changes
      });
    };

    fetchProducts();
    fetchPriceChanges(); // Fetch price changes on component mount
    fetchStockChanges(); // Fetch stock changes on component mount
  }, []);

  // Handle updating the price
  const handleUpdatePrice = async (productId, variationCode) => {
    const newPrice = prices[`${productId}-${variationCode}`]; // Use unique key for price

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
          const previousPrice = variationToUpdate.productPrice; // Store previous price value

          if (price !== previousPrice) {
            const updates = {
              [`${variations.indexOf(variationToUpdate)}/productPrice`]: price,
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
            const updatedPriceChangeHistory = updatedPriceChanges.val() ? Object.entries(updatedPriceChanges.val()).map(([key, value]) => ({ id: key, ...value })) : [];
            setPriceChangeHistory(updatedPriceChangeHistory);

            // Fetch updated product data
            const updatedProductsSnapshot = await get(ref(db, 'products'));
            const updatedProductsData = updatedProductsSnapshot.val();
            const updatedProductsList = updatedProductsData ? Object.entries(updatedProductsData).map(([key, value]) => ({ id: key, ...value })) : [];
            setProducts(updatedProductsList);

            setUpdating(false); // Reset updating state
          } else {
            alert("No changes to update."); // Alert if there's no change
          }
          setEditPriceMode(prev => ({ ...prev, [`${productId}-${variationCode}`]: false })); // Update editPriceMode
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Admin Inventory</h1>

      {/* Table for Price Changes */}
      <h2>Change Price</h2>
      <table className={styles.table}>
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
                <td>{variation.quantity}</td>
                <td>
                  {editPriceMode[`${product.id}-${variation.productCode}`] ? (
                    <input 
                      type="number" 
                      value={prices[`${product.id}-${variation.productCode}`] || variation.productPrice} 
                      onChange={(e) => setPrices(prev => ({ ...prev, [`${product.id}-${variation.productCode}`]: e.target.value }))} 
                    />
                  ) : (
                    <span>{variation.productPrice}</span>
                  )}
                </td>
                <td>{stockChanges[product.id] ? stockChanges[product.id][variation.productCode] || 0 : 0}</td> {/* Display current stock */}
                <td>
                  {editPriceMode[`${product.id}-${variation.productCode}`] ? (
                    <button onClick={() => handleUpdatePrice(product.id, variation.productCode)} disabled={updating}>
                      {updating ? 'Saving...' : 'Save Price'}
                    </button>
                  ) : (
                    <button onClick={() => toggleEditPriceMode(product.id, variation.productCode, variation.productPrice)}>
                      Edit Price
                    </button>
                  )}
                </td>
              </tr>
            ));
          })}
        </tbody>
      </table>

      {/* Price Change History Table */}
      <h2>Price Change History</h2>
      <table className={styles.table}>
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
              <td>{change.currentPrice}</td>
              <td>{change.previousPrice}</td>
              <td>{new Date(change.changeDate).toLocaleString()}</td>
              <td>{change.firstName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminInvent;
