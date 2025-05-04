import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  Calendar,
  Clock,
  Check,
  X,
  Plus,
  Trash2,
  AlertTriangle,
  Phone, // Added Phone icon import
  Eye,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import InvoiceModal from "./InvoiceModal";
import { 
  getOrders, 
  getOrderTypes, 
  addOrderType, 
  deleteOrderType, 
  updateOrderPaymentStatus 
} from "../services/firestoreService";
import { useAuth } from "../App";

// Confirmation Modal Component
const ConfirmPaymentModal = ({ onConfirm, onCancel, orderDetails }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all animate-scaleIn">
        <div className="flex items-center text-yellow-500 mb-4">
          <AlertTriangle size={48} className="mr-4" />
          <h2 className="text-2xl font-bold">Confirm Payment</h2>
        </div>

        <p className="mb-4 text-gray-600">
          Are you sure you want to mark this order as paid?
        </p>

        <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-100">
          <div className="flex justify-between mb-2">
            <span>Client:</span>
            <span className="font-semibold">{orderDetails.client_name}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Order Type:</span>
            <span className="font-semibold">{orderDetails.order_type}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Amount:</span>
            <span className="font-semibold text-green-600">
              ₹{orderDetails.total_amount?.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-md hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 active:scale-95 shadow-md"
          >
            Confirm Payment
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 transition-all transform hover:scale-105 active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Order Type Management Modal
const OrderTypeManagementModal = ({
  orderTypes,
  onAddType,
  onDeleteType,
  onClose,
}) => {
  const [newType, setNewType] = useState("");

  const handleAddType = () => {
    if (newType.trim() && !orderTypes.includes(newType.trim())) {
      onAddType(newType.trim());
      setNewType("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all animate-scaleIn">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-3">Manage Order Types</h2>

        {/* Add New Type */}
        <div className="flex mb-4">
          <input
            type="text"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="Enter new order type"
            className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          />
          <button
            onClick={handleAddType}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-r-md hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Existing Types List */}
        <div className="max-h-64 overflow-y-auto">
          {orderTypes
            .filter((type) => type !== "all")
            .map((type) => (
              <div
                key={type}
                className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-md mb-2 border border-gray-100 hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium">{type}</span>
                <button
                  onClick={() => onDeleteType(type)}
                  className="text-red-500 hover:bg-red-100 p-2 rounded-full transition-all transform hover:scale-110"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
        </div>

        {/* Close Button */}
        <div className="mt-4 flex justify-end pt-3 border-t">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-all transform hover:scale-105 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderList = () => {
  // State Management
  const [orders, setOrders] = useState([]);
  const [orderTypes, setOrderTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    orderType: "all",
    searchQuery: "",
    dateSort: "newest",
    month: "",
    year: "",
  });
  const [selectedInvoiceOrderId, setSelectedInvoiceOrderId] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
  const [confirmPaymentOrder, setConfirmPaymentOrder] = useState(null);
  const [notification, setNotification] = useState(null); // Add notification state
  // Remove user from destructuring since it's not used
  const { } = useAuth();

  // Show notification helper
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Clear specific filter
  const clearFilter = (key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: key === "orderType" ? "all" : "",
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      status: "all",
      orderType: "all",
      searchQuery: "",
      dateSort: "newest",
      month: "",
      year: "",
    });
  };

  // Render filter badges
  const renderFilterBadges = () => {
    const filterLabels = {
      status: filters.status !== "all" && `Status: ${filters.status}`,
      orderType: filters.orderType !== "all" && `Type: ${filters.orderType}`,
      searchQuery: filters.searchQuery && `Search: "${filters.searchQuery}"`,
      month: filters.month && `Month: ${filters.month}`,
      year: filters.year && `Year: ${filters.year}`,
    };

    return Object.entries(filterLabels)
      .filter(([_, label]) => label)
      .map(([key, label]) => (
        <div
          key={key}
          className="flex items-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full space-x-2 shadow-sm transform transition-all hover:scale-105"
        >
          <span>{label}</span>
          <button
            onClick={() => clearFilter(key)}
            className="text-white hover:text-red-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ));
  };

  // Fetch order types on component mount
  useEffect(() => {
    const fetchOrderTypes = async () => {
      try {
        const types = await getOrderTypes();
        // Extract names from the returned objects and add "all"
        const typeNames = types.map(type => type.name);
        setOrderTypes(["all", ...typeNames]);
      } catch (err) {
        console.error("Failed to fetch order types", err);
      }
    };

    fetchOrderTypes();
  }, []);

  // Add a new order type
  const handleAddOrderType = async (newType) => {
    try {
      await addOrderType(newType);
      setOrderTypes((prev) => ["all", ...prev.filter(t => t !== "all"), newType]);
    } catch (err) {
      console.error("Failed to add order type", err);
    }
  };

  // Delete an order type
  const handleDeleteOrderType = async (typeToDelete) => {
    try {
      // Find the document ID for the type to delete
      const types = await getOrderTypes();
      const typeDoc = types.find(type => type.name === typeToDelete);
      
      if (typeDoc) {
        await deleteOrderType(typeDoc.id);
        setOrderTypes((prev) => prev.filter((type) => type !== typeToDelete));

        // Reset filter if deleted type was selected
        if (filters.orderType === typeToDelete) {
          setFilters((prev) => ({ ...prev, orderType: "all" }));
        }
      }
    } catch (err) {
      console.error("Failed to delete order type", err);
    }
  };

  // Fetch Orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const fetchedOrders = await getOrders();
        setOrders(fetchedOrders);
        setLoading(false);

        // Dynamically update order types from fetched orders
        const fetchedTypes = [
          ...new Set(fetchedOrders.map((order) => order.order_type)),
        ];
        setOrderTypes((prevTypes) => {
          const uniqueTypes = [...new Set([...prevTypes, ...fetchedTypes])];
          return uniqueTypes;
        });
      } catch (err) {
        console.error("Failed to fetch orders", err);
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Color Utilities
  const getOrderTypeColor = (orderType) => {
    const colors = {
      Design: "from-purple-500 to-pink-500",
      Development: "from-blue-500 to-indigo-600",
      Marketing: "from-green-400 to-emerald-500",
      Consulting: "from-amber-400 to-orange-500",
      default: "from-gray-400 to-gray-500",
    };
    return colors[orderType] || colors["default"];
  };

  // Update Payment Status
  const updatePaymentStatus = async (order) => {
    try {
      await updateOrderPaymentStatus(order.id, "Paid");

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((prevOrder) =>
          prevOrder.id === order.id
            ? { ...prevOrder, payment_status: "Paid" }
            : prevOrder
        )
      );

      // Show success notification
      showNotification(`Payment for ${order.client_name}'s order marked as paid`);

      // Close confirmation modal
      setConfirmPaymentOrder(null);
    } catch (err) {
      console.error("Failed to update payment status", err);
      showNotification("Failed to update payment status", "error");
    }
  };
  // Advanced Filtering and Sorting
  const processedOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const baseFilter =
          (filters.status === "all" ||
            (filters.status === "paid" && order.payment_status === "Paid") ||
            (filters.status === "pending" &&
              order.payment_status !== "Paid")) &&
          (filters.orderType === "all" ||
            order.order_type === filters.orderType) &&
          (filters.searchQuery === "" ||
            order.client_name
              .toLowerCase()
              .includes(filters.searchQuery.toLowerCase()) ||
            order.order_type
              .toLowerCase()
              .includes(filters.searchQuery.toLowerCase()));

        const orderDate = new Date(order.deadline);
        const monthFilter =
          !filters.month ||
          orderDate.getMonth() + 1 === parseInt(filters.month);
        const yearFilter =
          !filters.year || orderDate.getFullYear() === parseInt(filters.year);

        return baseFilter && monthFilter && yearFilter;
      })
      .sort((a, b) => {
        const dateA = new Date(a.deadline);
        const dateB = new Date(b.deadline);
        return filters.dateSort === "newest" ? dateB - dateA : dateA - dateB;
      });
  }, [orders, filters]);

  // Loading State
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
          <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mb-4 mx-auto"></div>
          <p className="text-blue-800 font-medium text-lg">Loading orders...</p>
          <p className="text-blue-600/70 text-sm mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-xl flex items-center space-x-3 transition-all duration-300 animate-slideInRight ${
          notification.type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
        }`}>
          {notification.type === 'error' ? 
            <AlertTriangle size={20} /> : 
            <Check size={20} />
          }
          <p>{notification.message}</p>
        </div>
      )}
      
      <div className="container mx-auto bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/50 transform transition-all hover:shadow-blue-200/50">
        {/* Header (responsive adjustments) */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-4 sm:p-8 flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-4 sm:mb-0 text-center sm:text-left">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-100">
              Order Management
            </h1>
            <p className="text-white/80 mt-2 text-sm sm:text-lg">
              Comprehensive order tracking and insights
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => setShowOrderTypeModal(true)}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 sm:py-3 sm:px-6 rounded-full border border-white/30 flex items-center space-x-2 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-blue-700/20"
            >
              <Plus size={20} />
              <span className="text-sm sm:text-base">Manage Types</span>
            </button>

            {/* New Order Button */}
            <Link
              to="/add-order"
              className="transform transition-all hover:scale-105 active:scale-95"
            >
              <button className="bg-white text-indigo-600 font-semibold py-2 px-4 sm:py-3 sm:px-6 rounded-full border border-white/30 flex items-center space-x-2 shadow-lg shadow-blue-700/20 hover:bg-blue-50">
                <span className="text-sm sm:text-base">New Order</span>
                <ChevronRight size={18} />
              </button>
            </Link>
          </div>
        </div>

        {/* Advanced Filtering Section (improved responsive design) */}
        <div className="p-6 bg-gradient-to-b from-gray-50 to-white flex flex-wrap gap-4 justify-center items-center border-b border-gray-100">
          {/* Search Bar */}
          <div className="relative flex-grow max-w-md w-full">
            <input
              type="text"
              placeholder="Search orders..."
              className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm hover:shadow-md bg-white"
              value={filters.searchQuery}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            {filters.searchQuery && (
              <button 
                onClick={() => setFilters(prev => ({...prev, searchQuery: ""}))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="bg-white hover:bg-gray-50 px-4 py-3 rounded-full flex items-center space-x-2 transition-colors border border-gray-200 shadow-sm hover:shadow-md"
            >
              <Filter size={16} className="text-indigo-500" />
              <span className="font-medium">Filters</span>
              {Object.values(filters).some(v => v && v !== "all" && v !== "newest") && (
                <span className="bg-indigo-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">
                  {Object.values(filters).filter(v => v && v !== "all" && v !== "newest").length}
                </span>
              )}
            </button>
            {showFilterDropdown && (
              <div className="absolute z-10 mt-2 right-0 bg-white shadow-xl rounded-xl p-6 w-80 space-y-4 border border-gray-100 animate-fadeIn">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
                  <button onClick={() => setShowFilterDropdown(false)} className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-1 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Month and Year Filtering */}
                <div className="mb-4 space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={filters.month}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, month: e.target.value }))
                      }
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    >
                      <option value="">All Months</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i} value={i + 1}>
                          {new Date(0, i).toLocaleString("default", {
                            month: "long",
                          })}
                        </option>
                      ))}
                    </select>
                    <select
                      value={filters.year}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, year: e.target.value }))
                      }
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    >
                      <option value="">All Years</option>
                      {[...Array(5)].map((_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Order Type Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Type
                  </label>
                  <select
                    value={filters.orderType}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, orderType: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  >
                    {orderTypes.map((type) => (
                      <option key={type} value={type}>
                        {type === "all" ? "All Types" : type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort by Date
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, dateSort: "newest" }))
                      }
                      className={`px-3 py-2 rounded-md flex items-center space-x-1 transition-colors ${
                        filters.dateSort === "newest"
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <ArrowDown size={16} />
                      <span>Newest</span>
                    </button>
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, dateSort: "oldest" }))
                      }
                      className={`px-3 py-2 rounded-md flex items-center space-x-1 transition-colors ${
                        filters.dateSort === "oldest"
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <ArrowUp size={16} />
                      <span>Oldest</span>
                    </button>
                  </div>
                </div>

                {/* Apply/Reset Buttons */}
                <div className="flex space-x-2 pt-3 border-t">
                  <button
                    onClick={clearAllFilters}
                    className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1"
                  >
                    <RefreshCw size={16} />
                    <span>Reset All</span>
                  </button>
                  <button
                    onClick={() => setShowFilterDropdown(false)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-md hover:from-blue-600 hover:to-indigo-700 transition-colors shadow-md"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Payment Status Buttons */}
          <div className="flex flex-wrap gap-2">
            {["all", "paid", "pending"].map((status) => (
              <button
                key={status}
                onClick={() => setFilters((prev) => ({ ...prev, status }))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center space-x-2 shadow-sm 
                  ${
                    filters.status === status
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                  }`}
              >
                {status === "all" ? (
                  "All Orders"
                ) : status === "paid" ? (
                  <>
                    <Check size={16} className={filters.status === status ? "text-white" : "text-green-500"} />
                    <span>Paid</span>
                  </>
                ) : (
                  <>
                    <X size={16} className={filters.status === status ? "text-white" : "text-red-500"} />
                    <span>Pending</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6">
          {/* Filter Badges */}
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            {renderFilterBadges()}
            {Object.values(filters).some(
              (value) => value && value !== "all" && value !== "newest"
            ) && (
              <button
                onClick={clearAllFilters}
                className="bg-red-500 text-white px-3 py-1 rounded-full hover:from-red-600 hover:to-red-700 transition-colors flex items-center space-x-1 shadow-sm transform transition-all hover:scale-105"
              >
                <X size={14} />
                <span>Clear All</span>
              </button>
            )}
          </div>
          
          {/* Orders Table/Cards */}
          {processedOrders.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
              <Calendar className="mx-auto h-24 w-24 text-gray-300" />
              <p className="mt-4 text-xl text-gray-500 font-medium">No orders found</p>
              <p className="text-gray-400 mt-2">Try adjusting your filters or adding a new order</p>
              <Link to="/add-order" className="mt-6 inline-block">
                <button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-full transition-colors shadow-md transform hover:scale-105 active:scale-95">
                  Add New Order
                </button>
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      {[
                        "Order Type",
                        "Created Date",
                        "Deadline",
                        "Payment",
                        "Client",
                        "Phone",
                        "Actions",
                      ].map((header) => (
                        <th
                          key={header}
                          className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {processedOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-blue-50/50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4">
                          <div
                            className={`w-full h-8 bg-gradient-to-r ${getOrderTypeColor(
                              order.order_type
                            )} rounded-full flex items-center px-3`}
                          >
                            <span className="text-white text-xs font-semibold">
                              {order.order_type}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 font-medium flex items-center space-x-2">
                            <Clock size={16} className="text-gray-400" />
                            <span>
                              {order.created_at && order.created_at.seconds
                                ? new Date(order.created_at.seconds * 1000).toLocaleDateString()
                                : "N/A"}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 font-medium flex items-center space-x-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span>{order.deadline}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`
                              px-3 py-1 rounded-full text-xs font-semibold 
                              ${
                                order.payment_status === "Paid"
                                  ? "bg-green-100 text-green-800"
                                  : order.payment_status === "Partially Paid"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                          >
                            {order.payment_status}
                          </span>
                          {(order.payment_status === "Partially Paid" ||
                            order.payment_status !== "Paid") && (
                            <button
                              onClick={() => setConfirmPaymentOrder(order)}
                              className="ml-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-sm"
                            >
                              Mark Paid
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-800 font-medium">
                            {order.client_name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Phone size={16} className="text-blue-500" />
                            <span className="text-gray-600 hover:text-blue-600 transition-colors">
                              {order.client_phone || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedInvoiceOrderId(order.id)}
                              className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition-all flex items-center space-x-1 transform hover:scale-105"
                            >
                              <span>Invoice</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {processedOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl shadow-md p-4 border border-gray-100 hover:shadow-lg transition-all transform hover:scale-[1.01]">
                    <div className="flex justify-between items-start mb-3">
                      <div
                        className={`px-3 py-1 bg-gradient-to-r ${getOrderTypeColor(
                          order.order_type
                        )} rounded-full shadow-sm`}
                      >
                        <span className="text-white text-xs font-semibold">
                          {order.order_type}
                        </span>
                      </div>
                      <span
                        className={`
                          px-3 py-1 rounded-full text-xs font-semibold shadow-sm
                          ${
                            order.payment_status === "Paid"
                              ? "bg-green-100 text-green-800"
                              : order.payment_status === "Partially Paid"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                      >
                        {order.payment_status}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-lg mb-2 text-gray-800">{order.client_name}</h3>
                    
                    <div className="space-y-3 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                        <Phone size={16} className="text-blue-500" />
                        <span>{order.client_phone || "N/A"}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                        <Clock size={16} className="text-indigo-500" />
                        <span>Created: {new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                        <Calendar size={16} className="text-purple-500" />
                        <span>Deadline: {order.deadline}</span>
                      </div>
                      {order.total_amount && (
                        <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                          <span className="font-medium text-green-600">₹{order.total_amount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 pt-3 border-t">
                      <button
                        onClick={() => setSelectedInvoiceOrderId(order.id)}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-md hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-md text-sm font-medium"
                      >
                        View Invoice
                      </button>
                      {(order.payment_status === "Partially Paid" ||
                        order.payment_status !== "Paid") && (
                        <button
                          onClick={() => setConfirmPaymentOrder(order)}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-md hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-md text-sm font-medium"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Order Type Management Modal */}
      {showOrderTypeModal && (
        <OrderTypeManagementModal
          orderTypes={orderTypes.filter(type => type !== "all")}
          onAddType={(type) => {
            handleAddOrderType(type);
            showNotification(`Order type "${type}" added successfully`);
          }}
          onDeleteType={(type) => {
            handleDeleteOrderType(type);
            showNotification(`Order type "${type}" deleted successfully`);
          }}
          onClose={() => setShowOrderTypeModal(false)}
        />
      )}

      {/* Invoice Modal */}
      {selectedInvoiceOrderId && (
        <InvoiceModal
          orderId={selectedInvoiceOrderId}
          onClose={() => setSelectedInvoiceOrderId(null)}
        />
      )}
      
      {confirmPaymentOrder && (
        <ConfirmPaymentModal
          orderDetails={confirmPaymentOrder}
          onConfirm={() => updatePaymentStatus(confirmPaymentOrder)}
          onCancel={() => setConfirmPaymentOrder(null)}
        />
      )}
    </div>
  );
};

// Add these animations to your global CSS or tailwind.config.js
// @keyframes fadeIn {
//   from { opacity: 0; }
//   to { opacity: 1; }
// }
// @keyframes scaleIn {
//   from { transform: scale(0.95); opacity: 0; }
//   to { transform: scale(1); opacity: 1; }
// }
// @keyframes slideInRight {
//   from { transform: translateX(20px); opacity: 0; }
//   to { transform: translateX(0); opacity: 1; }
// }
// .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
// .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
// .animate-slideInRight { animation: slideInRight 0.3s ease-out; }

export default OrderList;
