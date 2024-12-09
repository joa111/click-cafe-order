import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OrderList from './pages/OrderList';
import AddOrder from './pages/AddOrder';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<OrderList />} />
                <Route path="/add-order" element={<AddOrder />} />
            </Routes>
        </Router>
    );
};

export default App;
