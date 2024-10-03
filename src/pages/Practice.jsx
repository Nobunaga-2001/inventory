import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import styles from './prac.module.css';

const Prac = () => {
  const [productsSold, setProductsSold] = useState([]);
  const [recentlyAddedProducts, setRecentlyAddedProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const ordersRef = ref(db, 'orders');
    onValue(ordersRef, (snapshot) => {
      const orderData = snapshot.val();
      const orderList = orderData ? Object.entries(orderData).map(([id, order]) => ({ id, ...order })) : [];
      setRecentOrders(orderList.slice(-5));
      calculateProductsSold(orderList);
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
          if (soldCount[item.productName]) {
            soldCount[item.productName] += quantity;
          } else {
            soldCount[item.productName] = quantity;
          }
        });
      }
    });

    const soldArray = Object.entries(soldCount).map(([productName, quantitySold]) => ({
      productName,
      quantitySold,
    }));

    setProductsSold(soldArray);
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

  return (
    <div className={styles.pracContainer}>
      <div className={styles.tablesRow}>
        <div className={styles.tableContainer}>
          <h1>Products Sold</h1>
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
                <th>Customer</th>
                <th>Status</th>
                <th>Date Ordered</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
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
          <h2>Receipt for Order ID: {selectedOrder.id}</h2>
          <p>Customer: {selectedOrder.customer}</p>
          <p>Status: {selectedOrder.status}</p>
          <h3>Items:</h3>
          <ul>
            {selectedOrder.items.map(item => (
              <li key={item.productName}>
                {item.productName} (Qty: {item.orderQuantity}, Price: ${item.totalPrice})
              </li>
            ))}
          </ul>
          <p>Total Amount: ${calculateTotalAmount(selectedOrder.items)}</p>
          <button onClick={closeReceipt}>Close</button>
        </div>
      )}
    </div>
  );
};

export default Prac;
