import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getInvoiceByOrderId } from '../services/firestoreService';

const InvoiceModal = ({ orderId, onClose }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const invoiceRef = useRef(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const invoiceData = await getInvoiceByOrderId(orderId);
        setInvoice(invoiceData);
      } catch (error) {
        console.error('Failed to fetch invoice', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!invoiceRef.current) return;

    html2canvas(invoiceRef.current).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 297;
      
      const imageHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imageHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imageHeight);
      
      while (heightLeft >= pageHeight) {
        position = heightLeft - imageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -position, imgWidth, imageHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${invoice.invoice_number}.pdf`);
    });
  };

  if (loading) return <div>Loading invoice...</div>;
  if (!invoice) return <div>No invoice found</div>;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div 
        ref={invoiceRef} 
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        {/* Invoice Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800"><strong>Dalys Digital</strong></h2>
          <h3 className="text-2xl mb-4">Invoice</h3>
          <p className="text-sm text-gray-500">
            <strong>Invoice Number:</strong> {invoice.invoice_number}
          </p>
        </div>

        {/* Invoice Details */}
        <div className="border-t mt-6 pt-4 space-y-4 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Order Type:</span>
            <span className="font-medium">{invoice.orders.order_type}</span>
          </div>
          <div className="flex justify-between">
            <span>Client Name:</span>
            <span className="font-medium">{invoice.orders.client_name}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                invoice.status === 'paid'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {invoice.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Issue Date:</span>
            <span>{new Date(invoice.issue_date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Amount:</span>
            <span className="font-medium text-lg">₹{invoice.total_amount?.toFixed(2)}</span>
          </div>
        </div>

        {/* Divider */}
        <hr className="my-6" />

        {/* Invoice Breakdown */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Order Summary</h3>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between font-semibold">
              <span>Total Amount:</span>
              <span>₹{invoice.total_amount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span>Amount Paid:</span>
              <span>₹{invoice.amount_paid?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-red-600">
              <span>Remaining Balance:</span>
              <span>₹{invoice.remaining_balance?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex space-x-4">
          <button
            onClick={handlePrint}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Print Invoice
          </button>
          <button
            onClick={handleDownloadPDF}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
          >
            Download PDF
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
