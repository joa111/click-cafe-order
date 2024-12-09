import React, { useState, useEffect } from "react";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

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
  const apiUrl = process.env.REACT_APP_API_URL;
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

    // Fetch order types on component mount
    useEffect(() => {
        const fetchOrderTypes = async () => {
          try {
            const response = await axios.get(`${apiUrl}/order-types`);
            setOrderTypes(response.data);
          } catch (error) {
            console.error("Failed to fetch order types", error);
            setOrderTypes(["Other"]); // Fallback
          }
        };
    
        fetchOrderTypes();
      }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log("Submitting form data:", formData);
    try {
      const response = await axios.post(`${apiUrl}/orders`,formData);
      console.log("Order and invoice successfully created:", response.data);
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
      console.error(
        "Error while creating order:",
        error.response?.data || error.message
      );
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
          {/* Order Type */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Order Type
            </label>
            <div className="grid grid-cols-3 gap-4">
              {orderTypes.map((type) => (
                <label
                key={type}
                className={`cursor-pointer border rounded-lg p-4 text-center text-sm font-medium transition-all
                ${
                  formData.order_type === type
                    ? "bg-indigo-100 border-indigo-500 text-indigo-700"
                    : "bg-white border-gray-300 hover:bg-gray-50 hover:border-indigo-300"
                }`}
              >
                  <input
                    type="radio"
                    name="order_type"
                    value={type}
                    checked={formData.order_type === type}
                    onChange={handleChange}
                    className="hidden"
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          {/* Deadline and Payment Details */}
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

          {/* Client Information */}
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

          {/* Notes */}
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

          {/* Submit Button */}
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
