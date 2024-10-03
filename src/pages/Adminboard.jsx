import React, { useEffect, useState } from 'react';
import styles from './Adminboard.module.css';
import image from '../images/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import Modal from './Modal';
import { ref, get, onValue, update } from 'firebase/database';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Adminboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [productsSold, setProductsSold] = useState([]);
  const [recentlyAddedProducts, setRecentlyAddedProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'customer', direction: 'ascending' });
  const [monthlySales, setMonthlySales] = useState([]);
  const [annualSales, setAnnualSales] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // Default to current month
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          // Handle user data if needed
        }
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const ordersRef = ref(db, 'orders');
    onValue(ordersRef, (snapshot) => {
      const orderData = snapshot.val();
      const orderList = orderData ? Object.entries(orderData).map(([id, order]) => ({ id, ...order })) : [];
      setRecentOrders(orderList.slice(-5));
      calculateProductsSold(orderList);
      calculateMonthlySales(orderList);
      calculateAnnualSales(orderList);
    });

    const productsRef = ref(db, 'products');
    onValue(productsRef, (snapshot) => {
      const productData = snapshot.val();
      const productList = productData ? Object.entries(productData).map(([id, product]) => ({ id, ...product })) : [];
      setRecentlyAddedProducts(productList);
    });
  }, []);

  const calculateProductsSold = (orderList) => {
    const soldCount = {};
    orderList.forEach(order => {
      if (order.status === 'Delivered') {
        order.items.forEach(item => {
          const quantity = parseInt(item.orderQuantity, 10);
          soldCount[item.productName] = (soldCount[item.productName] || 0) + quantity;
        });
      }
    });
    const soldArray = Object.entries(soldCount).map(([productName, quantitySold]) => ({ productName, quantitySold }));
    setProductsSold(soldArray);
  };

  const calculateMonthlySales = (orderList) => {
    const monthlySalesData = Array(12).fill(0); // Initialize an array of 12 months with zero sales
    orderList.forEach(order => {
      if (order.status === 'Delivered') {
        const orderMonth = new Date(order.dateOrdered).getMonth();
        const totalAmount = order.items.reduce((total, item) => total + parseInt(item.totalPrice, 10), 0);
        monthlySalesData[orderMonth] += totalAmount;
      }
    });
    setMonthlySales(monthlySalesData);
  };

  const calculateAnnualSales = (orderList) => {
    const annualTotal = orderList.reduce((total, order) => {
      if (order.status === 'Delivered') {
        const totalAmount = order.items.reduce((sum, item) => sum + parseInt(item.totalPrice, 10), 0);
        return total + totalAmount;
      }
      return total;
    }, 0);
    setAnnualSales(annualTotal);
  };

  const handleShowReceipt = (order) => {
    setSelectedOrder(order);
  };

  const closeReceipt = () => {
    setSelectedOrder(null);
  };

  const calculateTotalAmount = (items) => {
    return items.reduce((total, item) => total + parseInt(item.totalPrice, 10), 0);
  };

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
      navigate('/login');
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

  const sortedOrders = [...recentOrders].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const chartData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    datasets: [
      {
        label: 'Monthly Sales',
        data: monthlySales,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      },
    ],
  };

  return (
    <div className={styles.parent}>
      <Link to="/adminboard" className={styles.logo}>
        <img src={image} alt="Logo" />
      </Link>
      <div className={`${styles.div2} ${isCollapsed ? styles.hidden : styles.visible}`}>
        <div className={styles.buttonContainer}>
          <Link to="/sales" className={styles.button2}><FontAwesomeIcon icon={faShoppingCart} /> Sales</Link>
          <Link to="/history" className={styles.button2}><FontAwesomeIcon icon={faShoppingCart} /> History</Link>
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
      <div className={`${styles.content} ${isCollapsed ? styles.fullWidth : ''}`}>
        <button className={styles.toggleButton} onClick={toggleCollapse}>
          <FontAwesomeIcon icon={faBars} />
        </button>
        <div className={styles.contentTop}>
        </div>
        <div className={styles.contentBottom}>
          <div className={styles.row1}>
            <div className={styles.left}>
              <select value={selectedMonth} className={styles.dropdown} onChange={(e) => setSelectedMonth(e.target.value)}>
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index} value={index}>{new Date(0, index).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
              <h2>Monthly Sales: {monthlySales[selectedMonth] || 0}</h2>
              <h2>Annual Sales: {annualSales}</h2>
            </div>
            <div className={styles.right}>
              <div className={styles.chart}>
                <Line data={chartData} />
              </div>
            </div>
          </div>
          <div className={styles.row2}>
            <div className={styles.tableContainer}>
              <h1>Highest Product Sold</h1>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Quantity Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {productsSold.map((product, index) => (
                    <tr key={index}>
                      <td>{product.productName}</td>
                      <td>{product.quantitySold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.tableContainer}>
              <h1>Recently Added Products</h1>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Quantity</th>
                    <th>Date Added</th>
                  </tr>
                </thead>
                <tbody>
                  {recentlyAddedProducts.map(product =>
                    product.variations.map((variation, index) => (
                      <tr key={index}>
                        <td>{variation.productName}</td>
                        <td>{variation.quantity}</td>
                        <td>{new Date(product.dateAdded).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.tableContainer}>
              <h1>Recently Added Orders</h1>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th onClick={() => requestSort('customer')}>Customer</th>
                    <th onClick={() => requestSort('status')}>Status</th>
                    <th onClick={() => requestSort('dateOrdered')}>Date Ordered</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOrders.map(order => (
                    <tr key={order.id}>
                      <td>{order.customer}</td>
                      <td>{order.status}</td>
                      <td>{new Date(order.dateOrdered).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => handleShowReceipt(order)}>View Receipt</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {selectedOrder && (
            <div className={styles.receiptModal}>
              <h2>Receipt</h2>
              <p>Customer: {selectedOrder.customer}</p>
              <p>Status: {selectedOrder.status}</p>
              <p>Date Ordered: {new Date(selectedOrder.dateOrdered).toLocaleDateString()}</p>
              <p>Total Amount: {calculateTotalAmount(selectedOrder.items)}</p>
              <button onClick={closeReceipt}>Close</button>
              <div>
                {selectedOrder.items.map((item, index) => (
                  <div key={index}>
                    <p>Product: {item.productName}</p>
                    <p>Quantity: {item.orderQuantity}</p>
                    <p>Price: {item.totalPrice}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default Adminboard;
