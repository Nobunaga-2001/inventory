import React, { useEffect, useState } from 'react';
import styles from './Order.module.css';
import image from '../images/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faClipboardList, faIndustry, faShoppingCart, faSave } from '@fortawesome/free-solid-svg-icons';
import { faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import Modal from './Modal';
import { ref, get, update, onValue, push } from 'firebase/database';

const Order = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orderDetails, setOrderDetails] = useState({ customer: '', location: '', items: [], dateOrdered: '' });
  const [showModal, setShowModal] = useState(false);
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
      const userId = auth.currentUser?.uid;
      if (userId) {
        const logoutTime = getManilaTime();
        const userLogsRef = ref(db, `userLogs/${userId}`);
        await update(userLogsRef, { logoutTime });
      }
      await auth.signOut();
      navigate('/');
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

  const handleInputChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...orderDetails.items];
    updatedItems[index] = { ...updatedItems[index], [name]: value };
    setOrderDetails(prev => ({ ...prev, items: updatedItems }));
  };

  const handleAddProduct = () => {
    setOrderDetails(prev => ({
      ...prev,
      items: [...prev.items, { productName: '', orderQuantity: 1 }]
    }));
  };

  const handleRemoveProduct = (index) => {
    const updatedItems = orderDetails.items.filter((_, i) => i !== index);
    setOrderDetails(prev => ({ ...prev, items: updatedItems }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totalOrders = [];
    const currentDate = new Date().toISOString();

    for (const item of orderDetails.items) {
      const { productName, orderQuantity } = item;

      const product = products.find(p => p.variations.some(v => v.productName === productName));
      if (!product) {
        alert(`Product ${productName} not found`);
        return;
      }

      const variation = product.variations.find(v => v.productName === productName);
      if (variation && variation.quantity < orderQuantity) {
        alert(`Insufficient stock for ${productName}. Available: ${variation.quantity}`);
        return;
      }

      const totalPrice = (variation.productPrice * orderQuantity).toFixed(2);
      totalOrders.push({ ...item, totalPrice });

      const variationRef = ref(db, `products/${product.id}/variations/${product.variations.indexOf(variation)}`);
      await update(variationRef, { quantity: variation.quantity - orderQuantity });
    }

    const orderRef = ref(db, 'orders');
    await push(orderRef, { 
      ...orderDetails, 
      items: totalOrders,
      status: 'Pending',
      payment: 'Unpaid',
      dateOrdered: currentDate
    });

    setOrderDetails({ customer: '', location: '', items: [], dateOrdered: '' });
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
      <div className={styles.pagename}>| Order</div>
      <div className={`${styles.content} ${isCollapsed ? styles.fullWidth : ''}`}>
        <button className={styles.toggleButton} onClick={toggleCollapse}>
          <FontAwesomeIcon icon={faBars} />
        </button>
        <div className={styles.contentTop}>
          <Link to="/order" className={styles.navButton1}>Order</Link>
          <Link to="/orderlist" className={styles.navButton2}>Order List</Link>
        </div>
        <div className={styles.contentBottom}>
          <div className={styles.formUpdate}>
            <form onSubmit={handleSubmit} className={styles.orderForm}>
              <input
                type="text"
                name="customer"
                placeholder="Customer Name"
                value={orderDetails.customer}
                onChange={e => setOrderDetails({ ...orderDetails, customer: e.target.value })}
                required
              />
              <input
                type="text"
                name="location"
                placeholder="Location"
                value={orderDetails.location}
                onChange={e => setOrderDetails({ ...orderDetails, location: e.target.value })}
                required
              />
              {orderDetails.items.map((item, index) => (
                <div key={index} className={styles.productRow}>
                  <input
                    type="text"
                    name="productName"
                    placeholder="Product Name"
                    value={item.productName}
                    onChange={e => handleInputChange(index, e)}
                    list="productList"
                    required
                  />
                  <datalist id="productList">
                    {products.flatMap(product =>
                      product.variations.map(variation => (
                        <option key={variation.productId} value={variation.productName} />
                      ))
                    )}
                  </datalist>
                  <input
                    type="number"
                    name="orderQuantity"
                    placeholder="Order Quantity"
                    value={item.orderQuantity}
                    onChange={e => handleInputChange(index, e)}
                    min="1"
                    required
                  />
                  <button type="button" onClick={() => handleRemoveProduct(index)}>Remove</button>
                </div>
              ))}
              <button type="button" onClick={handleAddProduct}>Add Product</button>
              <button type="submit" className={styles.submitButton}><FontAwesomeIcon icon={faSave} /> Add Order</button>
            </form>
          </div>
        </div>
      </div>
      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default Order;
