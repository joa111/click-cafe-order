import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
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
} from "lucide-react";
import InvoiceModal from "./InvoiceModal";

// Confirmation Modal Component
const ConfirmPaymentModal = ({ onConfirm, onCancel, orderDetails }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center text-yellow-500 mb-4">
          <AlertTriangle size={48} className="mr-4" />
          <h2 className="text-2xl font-bold">Confirm Payment</h2>
        </div>

        <p className="mb-4 text-gray-600">
          Are you sure you want to mark this order as paid?
        </p>

        <div className="bg-gray-100 p-4 rounded-lg mb-4">
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
            className="flex-1 bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors"
          >
            Confirm Payment
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 transition-colors"
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-4">Manage Order Types</h2>

        {/* Add New Type */}
        <div className="flex mb-4">
          <input
            type="text"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="Enter new order type"
            className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddType}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 transition-colors"
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
                className="flex justify-between items-center bg-gray-100 px-4 py-2 rounded-md mb-2"
              >
                <span>{type}</span>
                <button
                  onClick={() => onDeleteType(type)}
                  className="text-red-500 hover:bg-red-100 p-2 rounded-full"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
        </div>

        {/* Close Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
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
  const apiUrl = process.env.REACT_APP_API_URL; // Access the variable
  console.log('API URL:', apiUrl); // Debug it

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
          className="flex items-center bg-blue-500 text-white px-3 py-1 rounded-full space-x-2"
        >
          <span>{label}</span>
          <button
            onClick={() => clearFilter(key)}
            className="text-white hover:text-red-400"
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
        const response = await axios.get(`${apiUrl}/order-types`);
        setOrderTypes(["all", ...response.data]);
      } catch (err) {
        console.error("Failed to fetch order types", err);
      }
    };

    fetchOrderTypes();
  }, []);

  // Add a new order type
  const handleAddOrderType = async (newType) => {
    try {
      await axios.post(`${apiUrl}/order-types`, { name: newType });
      setOrderTypes((prev) => ["all", ...prev, newType]);
    } catch (err) {
      console.error("Failed to add order type", err);
    }
  };

  // Delete an order type
  const handleDeleteOrderType = async (typeToDelete) => {
    try {
      await axios.delete(`${apiUrl}/order-types/${typeToDelete}`);
      setOrderTypes((prev) => prev.filter((type) => type !== typeToDelete));
  
      // Reset filter if deleted type was selected
      if (filters.orderType === typeToDelete) {
        setFilters((prev) => ({ ...prev, orderType: "all" }));
      }
    } catch (err) {
      console.error("Failed to delete order type", err);
    }
  };

  // Fetch Orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${apiUrl}/orders`);
        setOrders(response.data);
        setLoading(false);

        // Dynamically update order types from fetched orders
        const fetchedTypes = [
          ...new Set(response.data.map((order) => order.order_type)),
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
      Development: "from-blue-500 to-teal-400",
      Marketing: "from-green-400 to-emerald-500",
      Consulting: "from-yellow-400 to-orange-500",
      default: "from-gray-400 to-gray-500",
    };
    return colors[orderType] || colors["default"];
  };

  // Update Payment Status
  const updatePaymentStatus = async (order) => {
    try {
      await axios.patch(`${apiUrl}/orders/${order.id}`, {
        payment_status: "Paid",
      });

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((prevOrder) =>
          prevOrder.id === order.id
            ? { ...prevOrder, payment_status: "Paid" }
            : prevOrder
        )
      );

      // Close confirmation modal
      setConfirmPaymentOrder(null);
    } catch (err) {
      console.error("Failed to update payment status", err);
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
      <div className="fixed inset-0 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
        <div className="animate-pulse w-24 h-24 bg-white/50 rounded-full shadow-2xl"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4 sm:p-8">
      <div className="container mx-auto bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden">
        {/* Header (responsive adjustments) */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-4 sm:mb-0 text-center sm:text-left">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-wide">
              Order Management
            </h1>
            <p className="text-white/80 mt-2 text-sm sm:text-lg">
              Comprehensive order tracking and insights
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => setShowOrderTypeModal(true)}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 sm:py-3 sm:px-6 rounded-full border border-white/30 flex items-center space-x-2"
            >
              <Plus size={20} />
              <span className="text-sm sm:text-base">Manage Types</span>
            </button>

            {/* New Order Button */}
            <Link
              to="/add-order"
              className="transform transition-all hover:scale-105 active:scale-95"
            >
              <button className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 sm:py-3 sm:px-6 rounded-full border border-white/30 flex items-center space-x-2">
                <span className="text-sm sm:text-base">New Order</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Advanced Filtering Section (responsive) */}
        <div className="p-4 bg-gray-50/50 flex flex-wrap gap-4 justify-center items-center">
          {/* Search Bar */}
          <div className="relative flex-grow max-w-md w-full">
            <input
              type="text"
              placeholder="Search orders..."
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all"
              value={filters.searchQuery}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-full flex items-center space-x-2"
            >
              <Filter size={16} />
              <span>Filters</span>
            </button>
            {showFilterDropdown && (
              <div className="absolute z-10 mt-2 right-0 bg-white shadow-lg rounded-lg p-4 w-72">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  <button
                    onClick={() => setShowFilterDropdown(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Month and Year Filtering */}
                <div className="mb-4 flex space-x-2">
                  <select
                    value={filters.month}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, month: e.target.value }))
                    }
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md"
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
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md"
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
                      className={`px-3 py-2 rounded-md flex items-center space-x-1 ${
                        filters.dateSort === "newest"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      <ArrowDown size={16} />
                      <span>Newest</span>
                    </button>
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, dateSort: "oldest" }))
                      }
                      className={`px-3 py-2 rounded-md flex items-center space-x-1 ${
                        filters.dateSort === "oldest"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      <ArrowUp size={16} />
                      <span>Oldest</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Status Buttons */}
          {["all", "paid", "pending"].map((status) => (
            <button
              key={status}
              onClick={() => setFilters((prev) => ({ ...prev, status }))}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center space-x-2 
                ${
                  filters.status === status
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
            >
              {status === "all" ? (
                "All Orders"
              ) : status === "paid" ? (
                <>
                  <Check size={16} />
                  <span>Paid Orders</span>
                </>
              ) : (
                <>
                  <X size={16} />
                  <span>Pending Orders</span>
                </>
              )}
            </button>
          ))}
        </div>
        <div className="p-4">
          {/* Filter Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {renderFilterBadges()}
            {Object.values(filters).some(
              (value) => value && value !== "all"
            ) && (
              <button
                onClick={clearAllFilters}
                className="bg-red-500 text-white px-3 py-1 rounded-full"
              >
                Clear All
              </button>
            )}
          </div>
          {/* Orders Table */}
          {processedOrders.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Calendar className="mx-auto h-24 w-24 text-gray-300" />
              <p className="mt-4 text-xl">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100/50">
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
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                        {new Date(order.created_at).toLocaleDateString()}
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
                          {(order.payment_status === "Partially Paid" ||
                            order.payment_status !== "Paid") && (
                            <button
                              onClick={() => setConfirmPaymentOrder(order)}
                              className="ml-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs"
                            >
                              Mark Paid
                            </button>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-800">
                          {order.client_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">
                          {order.client_phone || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedInvoiceOrderId(order.id)}
                          className="text-blue-500 hover:underline flex items-center space-x-1"
                        >
                          <span>Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
    {/* <button onClick={connectGoogleCalendar}>
      Connect Google Calendar
    </button> */}

        </div>
      </div>
      {/* Order Type Management Modal */}
      {showOrderTypeModal && (
        <OrderTypeManagementModal
          orderTypes={["all", ...orderTypes]}
          onAddType={handleAddOrderType}
          onDeleteType={handleDeleteOrderType}
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

export default OrderList;
