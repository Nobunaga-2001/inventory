import React, { useEffect, useState } from 'react';
import styles from './Inventorylist.module.css';
import image from '../images/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faCancel, faClipboardList, faEdit, faIndustry, faSave, faShoppingCart, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { ref, get, update, onValue, remove } from 'firebase/database';

const Inventorylist = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [editableRow, setEditableRow] = useState(null);
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
    const productRef = ref(db, 'products');
    onValue(productRef, (snapshot) => {
      const data = snapshot.val();
      const productList = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      setProducts(productList);
    });
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(prevState => !prevState);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
      //navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleEditClick = (productId, variationIndex) => {
    setEditableRow({ productId, variationIndex });
  };

  const handleSave = async (productId, variationIndex) => {
    const product = products.find(p => p.id === productId);
    const variation = product.variations[variationIndex];
    const variationRef = ref(db, `products/${productId}/variations/${variationIndex}`);
    await update(variationRef, variation);
    setEditableRow(null);
  };

  const handleDelete = async (productId, variationIndex) => {
    const variationRef = ref(db, `products/${productId}/variations/${variationIndex}`);
    await remove(variationRef);
  };

  const handleChange = (productId, variationIndex, field, value) => {
    setProducts(prevProducts => {
      return prevProducts.map(product => {
        if (product.id === productId) {
          const variations = product.variations.map((variation, index) => {
            if (index === variationIndex) {
              return { ...variation, [field]: value };
            }
            return variation;
          });
          return { ...product, variations };
        }
        return product;
      });
    });
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
          <Link to="/supplier" className={styles.button3}><FontAwesomeIcon icon={faIndustry} /> Supplier</Link>
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
          <Link to="/inventory" className={styles.navButton1}>Inventory</Link>
          <Link to="/inventorylist" className={styles.navButton2}>Inventory List</Link>
        </div>
        <div className={styles.contentBottom}>
          <table className={styles.productTable}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Image</th>
                <th>Name</th>
                <th>Code</th>
                <th>Product ID</th>
                <th>Dimension</th>
                <th>Price</th>
                <th>Weight</th>
                <th>Quantity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.flatMap((product) =>
                  product.variations.map((variation, index) => (
                    <tr key={`${product.id}-${index}`}>
                      {index === 0 && (
                        <>
                          <td rowSpan={product.variations.length}>{product.productCategory}</td>
                          <td rowSpan={product.variations.length}>
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.productName} className={styles.productImage} />
                            ) : (
                              'No Image'
                            )}
                          </td>
                        </>
                      )}
                      {editableRow?.productId === product.id && editableRow.variationIndex === index ? (
                        <>
                          <td>
                            <input
                              type="text"
                              value={variation.productName}
                              onChange={(e) => handleChange(product.id, index, 'productName', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={variation.productCode}
                              onChange={(e) => handleChange(product.id, index, 'productCode', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={variation.productId}
                              onChange={(e) => handleChange(product.id, index, 'productId', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={variation.productDimension}
                              onChange={(e) => handleChange(product.id, index, 'productDimension', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={variation.productPrice}
                              onChange={(e) => handleChange(product.id, index, 'productPrice', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={variation.productWeight}
                              onChange={(e) => handleChange(product.id, index, 'productWeight', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={variation.quantity}
                              onChange={(e) => handleChange(product.id, index, 'quantity', e.target.value)}
                            />
                          </td>
                          <td>
                            <button className={styles.iconButton} onClick={() => handleSave(product.id, index)}><FontAwesomeIcon icon={faSave} /></button>
                            <button className={styles.iconButton} onClick={() => setEditableRow(null)}><FontAwesomeIcon icon={faCancel} /></button>
                            
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{variation.productName}</td>
                          <td>{variation.productCode}</td>
                          <td>{variation.productId}</td>
                          <td>{variation.productDimension}</td>
                          <td>₱{variation.productPrice}</td>
                          <td>{variation.productWeight} kg</td>
                          <td>{variation.quantity}</td>
                          <td>
                        <button className={styles.iconButton} onClick={() => handleEditClick(product.id, index)}>
                            <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button className={styles.iconButton} onClick={() => handleDelete(product.id, index)}>
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                        </td>
                        </>
                      )}
                    </tr>
                  ))
                )
              ) : (
                <tr>
                  <td colSpan="10">No products found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className={styles.searchbar}>
        {currentUser && (
        <div className={styles.userInfo}>
          <p>Welcome, {currentUser.firstName}</p>
        </div>
      )}</div>
      <div className={styles.pagename}>| Inventory List</div>
    </div>
  );
};

export default Inventorylist;
