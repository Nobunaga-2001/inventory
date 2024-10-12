// src/App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; 

import Login from './pages/Login';
import Pager from './pages/Pager';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Inventorylist from './pages/Inventorylist';
import Order from './pages/Order';
import OrderList from './pages/OrderList';
import Supplier from './pages/Supplier';
import SupplierList from './pages/SupplierList';
import Sales from './pages/Sales';
import Adminboard from './pages/Adminboard';
import Adminreg from './pages/Adminreg';
import Landingpage from './pages/Landingpage';
import History from './pages/History';
import Practice from './pages/Practice';
import Userlist from './pages/Userlist';
import AdminInventory from './pages/AdminInventory';
import AdminInvent from './pages/AdminInvent';




function App() {
  return (
    <Router>
      <Routes>  
      <Route path="/" element={<Landingpage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/pager" element={<Pager />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/inventorylist" element={<Inventorylist />} />
      <Route path="/order" element={<Order />} />
      <Route path="/orderlist" element={<OrderList />} />
      <Route path="/supplier" element={<Supplier />} />
      <Route path="/supplierlist" element={<SupplierList />} />
      <Route path="/sales" element={<Sales />} />
      <Route path="/adminboard" element={<Adminboard />} />
      <Route path="/adminreg" element={<Adminreg/>} />
      <Route path="/history" element={<History/>} />
      <Route path="/prac" element={<Practice/>} />
      <Route path="/userlist" element={<Userlist/>} />
      <Route path="/admininvent" element={<AdminInvent/>} />
      <Route path="/admininventory" element={<AdminInventory/>} />
      
      </Routes>
    </Router>
  );
} 

export default App;
