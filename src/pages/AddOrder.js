import React, { useState, useEffect, useRef } from "react";
// import axios from "axios"; // Remove this
import { ArrowLeft, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { getOrderTypes, addOrder } from "../services/firestoreService";

const AddOrderForm = ({ onOrderAdded = () => {} }) => {
  const [formData, setFormData] = useState({
    order_type: "",
    deadline: "",
    total_amount: "",
    payment_status: "Not Paid",
    amount_paid: 0,
    client_name: "",
    client_phone: "",
    notes: "",
  });

  const [orderTypes, setOrderTypes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  // Remove apiUrl as we're using Firebase directly
  // const apiUrl = process.env.REACT_APP_API_URL;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  useEffect(() => {
    const fetchOrderTypes = async () => {
      try {
        const types = await getOrderTypes();
        // Extract names from the returned objects
        const typeNames = types.map(type => type.name);
        setOrderTypes(typeNames);
      } catch (error) {
        console.error("Failed to fetch order types", error);
        setOrderTypes(["Other"]);
      }
    };

    fetchOrderTypes();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOrderTypes = orderTypes.filter((type) =>
    type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await addOrder(formData);
      console.log("Order created:", response);
      onOrderAdded();
      setFormData({
        order_type: "",
        deadline: "",
        total_amount: "",
        payment_status: "Not Paid",
        amount_paid: 0,
        client_name: "",
        client_phone: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error:", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-6 text-center">
          <h2 className="text-3xl font-bold">Create a New Order</h2>
          <p className="mt-2 text-white/90">
            Fill out the details below to start a new project.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Custom Order Type Autocomplete */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-gray-700 font-medium mb-2">
              Select Order Type
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search order type..."
                className="w-full px-4 py-2 pr-10 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
            
            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-lg border max-h-60 overflow-auto">
                {filteredOrderTypes.length > 0 ? (
                  filteredOrderTypes.map((type) => (
                    <div
                      key={type}
                      className="px-4 py-2 hover:bg-indigo-50 cursor-pointer"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, order_type: type }));
                        setSearchQuery(type);
                        setShowDropdown(false);
                      }}
                    >
                      {type}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500">No results found</div>
                )}
              </div>
            )}
          </div>

          {/* Rest of the form remains the same */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Project Deadline
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Total Amount (₹)
              </label>
              <input
                type="number"
                name="total_amount"
                value={formData.total_amount}
                onChange={handleChange}
                placeholder="Enter amount"
                className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Payment Status
              </label>
              <select
                name="payment_status"
                value={formData.payment_status}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Not Paid">Not Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            {formData.payment_status !== "Not Paid" && (
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Amount Paid (₹)
                </label>
                <input
                  type="number"
                  name="amount_paid"
                  value={formData.amount_paid}
                  onChange={handleChange}
                  placeholder="Enter amount paid"
                  className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Client Name
            </label>
            <input
              type="text"
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              required
              placeholder="Enter client name"
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Client Phone (Optional)
            </label>
            <input
              type="tel"
              name="client_phone"
              value={formData.client_phone}
              onChange={handleChange}
              placeholder="e.g., +1 123-456-7890"
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              placeholder="Add any extra details about the project..."
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 resize-none"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 text-white font-bold rounded-lg transition-all ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Create Order"}
          </button>
        </form>
        <Link 
          to="/" 
          className="absolute top-4 left-4 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
      </div>
    </div>
  );
};

export default AddOrderForm;