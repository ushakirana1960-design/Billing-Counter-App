import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = {
  items: () => axios.get(`${API}/items`).then((r) => r.data),
  createItem: (d) => axios.post(`${API}/items`, d).then((r) => r.data),
  updateItem: (id, d) => axios.put(`${API}/items/${id}`, d).then((r) => r.data),
  updateStock: (id, d) => axios.post(`${API}/items/${id}/stock`, d).then((r) => r.data),
  statement: (id, month) => axios.get(`${API}/customers/${id}/statement`, { params: { month } }).then((r) => r.data),
  deleteItem: (id) => axios.delete(`${API}/items/${id}`).then((r) => r.data),
  bulkPrice: (d) => axios.post(`${API}/items/bulk-price`, d).then((r) => r.data),
  customers: () => axios.get(`${API}/customers`).then((r) => r.data),
  createCustomer: (d) => axios.post(`${API}/customers`, d).then((r) => r.data),
  ledger: (id) => axios.get(`${API}/customers/${id}/ledger`).then((r) => r.data),
  pay: (id, d) => axios.post(`${API}/customers/${id}/payment`, d).then((r) => r.data),
  createBill: (d) => axios.post(`${API}/bills`, d).then((r) => r.data),
  bills: (params) => axios.get(`${API}/bills`, { params }).then((r) => r.data),
  report: (day) => axios.get(`${API}/report/daily`, { params: { day } }).then((r) => r.data),
  monthly: (month) => axios.get(`${API}/report/monthly`, { params: { month } }).then((r) => r.data),
  weekly: (week_start) => axios.get(`${API}/report/weekly`, { params: { week_start } }).then((r) => r.data),
  seed: () => axios.post(`${API}/seed`).then((r) => r.data),
  settings: () => axios.get(`${API}/settings`).then((r) => r.data),
  saveSettings: (d) => axios.put(`${API}/settings`, d).then((r) => r.data),
};

export const rupee = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const MODE_TE = { cash: "నగదు", upi: "UPI", card: "కార్డు", khata: "ఖాతా" };
