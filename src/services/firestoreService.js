import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

// Order Types
export const getOrderTypes = async () => {
  const querySnapshot = await getDocs(collection(db, 'orderTypes'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addOrderType = async (name) => {
  return await addDoc(collection(db, 'orderTypes'), { 
    name,
    createdAt: serverTimestamp()
  });
};

export const deleteOrderType = async (typeId) => {
  return await deleteDoc(doc(db, 'orderTypes', typeId));
};

// Orders
export const getOrders = async () => {
  const querySnapshot = await getDocs(collection(db, 'orders'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getOrderById = async (orderId) => {
  const docRef = doc(db, 'orders', orderId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    throw new Error('Order not found');
  }
};

export const addOrder = async (orderData) => {
  // Calculate remaining balance
  const totalAmount = parseFloat(orderData.total_amount) || 0;
  const amountPaid = parseFloat(orderData.amount_paid) || 0;
  const remainingBalance = totalAmount - amountPaid;
  
  // Add timestamps
  const orderWithTimestamps = {
    ...orderData,
    total_amount: totalAmount,
    amount_paid: amountPaid,
    remaining_balance: remainingBalance,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  };
  
  // Add order to Firestore
  const orderRef = await addDoc(collection(db, 'orders'), orderWithTimestamps);
  
  // Create invoice
  const invoiceNumber = `INV-${Date.now()}`;
  const tax = totalAmount * 0.05;
  const subtotal = totalAmount - tax;
  
  const invoiceData = {
    order_id: orderRef.id,
    invoice_number: invoiceNumber,
    total_amount: totalAmount,
    amount_paid: amountPaid,
    remaining_balance: remainingBalance,
    subtotal: subtotal,
    tax: tax,
    issue_date: new Date().toISOString().split('T')[0],
    status: orderData.payment_status === 'Paid' ? 'paid' : 'pending',
    created_at: serverTimestamp()
  };
  
  const invoiceRef = await addDoc(collection(db, 'invoices'), invoiceData);
  
  return {
    order: { id: orderRef.id, ...orderWithTimestamps },
    invoice: { id: invoiceRef.id, ...invoiceData }
  };
};

export const updateOrderPaymentStatus = async (orderId, paymentStatus) => {
  const orderRef = doc(db, 'orders', orderId);
  const orderSnap = await getDoc(orderRef);
  
  if (!orderSnap.exists()) {
    throw new Error('Order not found');
  }
  
  const orderData = orderSnap.data();
  const totalAmount = parseFloat(orderData.total_amount) || 0;
  
  // Update order
  await updateDoc(orderRef, {
    payment_status: paymentStatus,
    amount_paid: paymentStatus === 'Paid' ? totalAmount : orderData.amount_paid,
    remaining_balance: paymentStatus === 'Paid' ? 0 : orderData.remaining_balance,
    updated_at: serverTimestamp()
  });
  
  // Update invoice
  const invoicesQuery = query(
    collection(db, 'invoices'), 
    where('order_id', '==', orderId)
  );
  
  const invoiceSnapshot = await getDocs(invoicesQuery);
  
  if (!invoiceSnapshot.empty) {
    const invoiceDoc = invoiceSnapshot.docs[0];
    await updateDoc(doc(db, 'invoices', invoiceDoc.id), {
      status: paymentStatus === 'Paid' ? 'paid' : 'pending',
      amount_paid: paymentStatus === 'Paid' ? totalAmount : orderData.amount_paid,
      remaining_balance: paymentStatus === 'Paid' ? 0 : orderData.remaining_balance,
      updated_at: serverTimestamp()
    });
  }
  
  return { id: orderId, payment_status: paymentStatus };
};

// Invoices
export const getInvoiceByOrderId = async (orderId) => {
  const invoicesQuery = query(
    collection(db, 'invoices'), 
    where('order_id', '==', orderId)
  );
  
  const querySnapshot = await getDocs(invoicesQuery);
  
  if (querySnapshot.empty) {
    throw new Error('Invoice not found');
  }
  
  const invoiceData = querySnapshot.docs[0].data();
  const orderData = await getOrderById(orderId);
  
  return {
    id: querySnapshot.docs[0].id,
    ...invoiceData,
    orders: orderData
  };
};