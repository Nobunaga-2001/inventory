import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styles from './Dashboard.module.css';
import image from '../images/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faClipboardList, faEllipsis, faIndustry, faShoppingCart, faSort } from '@fortawesome/free-solid-svg-icons';
import { faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import Modal from './Modal';
import { ref, get, onValue, update } from 'firebase/database';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ label: 'Total Price', data: [] }] });
  const [showModal, setShowModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [mostBoughtProduct, setMostBoughtProduct] = useState('');
  const [hasSales, setHasSales] = useState(false);
  const [orders, setOrders] = useState([]);
  const [sortOrder, setSortOrder] = useState({ customerName: 'asc', dateOrdered: 'asc', quantity: 'asc' }); // State for sorting
  const navigate = useNavigate();

  const monthLabels = useMemo(() => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ], []);

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

  const calculateMonthlyData = useCallback((deliveredOrders) => {
    const mostBought = deliveredOrders.reduce((acc, order) => {
      order.items.forEach(item => {
        acc[item.productName] = (acc[item.productName] || 0) + item.orderQuantity;
      });
      return acc;
    }, {});

    const mostBoughtProduct = Object.entries(mostBought).reduce((a, b) => (a[1] > b[1] ? a : b), ['', 0]);

    if (mostBoughtProduct[1] > 0) {
      setMostBoughtProduct(mostBoughtProduct[0]);
      setHasSales(true);
    } else {
      setMostBoughtProduct('N/A');
      setHasSales(false);
    }
  }, []);

  useEffect(() => {
    const ordersRef = ref(db, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const orders = snapshot.val() || {};
      const deliveredOrders = Object.values(orders).filter(order => order.status === 'Delivered');

      const monthlyTotals = Array(12).fill(0);
      deliveredOrders.forEach(order => {
        const monthIndex = new Date(order.dateOrdered).getMonth();
        const total = order.items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
        monthlyTotals[monthIndex] += total;
      });

      setChartData({
        labels: monthLabels,
        datasets: [{
          label: 'Monthly Sales',
          data: monthlyTotals,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        }],
      });

      const currentMonthOrders = deliveredOrders.filter(order => {
        const monthIndex = new Date(order.dateOrdered).getMonth();
        return monthIndex === selectedMonth;
      });

      setOrders(deliveredOrders);  // Set the fetched orders here

      calculateMonthlyData(currentMonthOrders);
    });

    return () => unsubscribe();
  }, [calculateMonthlyData, monthLabels, selectedMonth]);

  const handleMonthChange = (event) => {
    setSelectedMonth(Number(event.target.value));
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

  const sortTable = (field) => {
    const sortedOrders = [...orders];
    const sortDirection = sortOrder[field] === 'asc' ? 'desc' : 'asc';
    sortedOrders.sort((a, b) => {
      if (a[field] < b[field]) return sortDirection === 'asc' ? -1 : 1;
      if (a[field] > b[field]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    setOrders(sortedOrders);
    setSortOrder(prevState => ({ ...prevState, [field]: sortDirection }));
  };

  return (
    <div className={styles.parent}>
      <Link to="/dashboard" className={styles.logo}>
        <img src={image} alt="Logo" />
      </Link>
      <div className={styles.searchbar}>
        {currentUser && (
          <div className={styles.userInfo}>
            <p>Welcome, {currentUser.firstName}</p>
          </div>
        )}
      </div>
      <div className={styles.pagename}>| Dashboard</div>
      <div className={`${styles.div2} ${isCollapsed ? styles.hidden : styles.visible}`}>
        <div className={styles.buttonContainer}>
          <Link to="/inventory" className={styles.button1}><FontAwesomeIcon icon={faClipboardList} /> Inventory</Link>
          <Link to="/order" className={styles.button2}><FontAwesomeIcon icon={faShoppingCart} /> Order</Link>
          <Link to="/supplier" className={styles.button3}><FontAwesomeIcon icon={faIndustry} /> Supplier</Link>
          <Link to="/sales" className={styles.button4}><FontAwesomeIcon icon={faEllipsis} /> Misc</Link>
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
        <div className={styles.contentWrapper}>
          <div className={styles.top}>
            <div className={styles.leftColumn}>
              <div className={styles.rectangle}>
                <label htmlFor="month-select">Select Month:</label>
                <select id="month-select" value={selectedMonth} onChange={handleMonthChange}>
                  {monthLabels.map((month, index) => (
                    <option key={index} value={index}>{month}</option>
                  ))}
                </select>
              </div>
              {hasSales && (
                <div className={styles.rectangle}>
                  <h3>Most Bought Product:</h3>
                  <p>{mostBoughtProduct}</p>
                </div>
              )}
              {!hasSales && (
                <div className={styles.rectangle}>
                  <h3>Most Bought Product:</h3>
                  <p>N/A</p>
                </div>
              )}
            </div>
            <div className={styles.rightColumn}>
              <div className={styles.chartContainer}>
                <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>

          {/* Bottom Content - Orders Table */}
          <div className={styles.contentBottom}>

    <div className={styles.separateTable}>
        <div className={styles.separateTableHeader}>
        <th onClick={() => sortTable('customerName')}>
             Customer Name <FontAwesomeIcon icon={faSort} />
        </th>
        </div>
        <table className={styles.table}>
            <thead>
                <tr>
      
                </tr>
            </thead>
            <tbody>
                {orders.map((order, index) => (
                    <tr key={index}>
                        <td>{order.customer}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
    <div className={styles.separateTable}>
        <div className={styles.separateTableHeader}>
        <th onClick={() => sortTable('dateOrdered')}>
           Date Ordered <FontAwesomeIcon icon={faSort} />
        </th>
        </div>
        <table className={styles.table}>
            <thead>
                <tr>
                </tr>
            </thead>
            <tbody>
                {orders.map((order, index) => (
                    <tr key={index}>
                        <td>{new Date(order.dateOrdered).toLocaleDateString()}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
            <div className={styles.separateTable}>
                <div className={styles.separateTableHeader}>
                <th onClick={() => sortTable('quantity')}>
                  Quantity <FontAwesomeIcon icon={faSort} />
                </th>
                </div>
                <table className={styles.table}>
                    <thead>
                        <tr>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order, index) => (
                            <tr key={index}>
                                <td>{order.items.reduce((sum, item) => sum + item.orderQuantity, 0)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>


        </div>
      </div>
      {showModal && <Modal setShowModal={setShowModal} />}
    </div>
  );
};

export default Dashboard;
