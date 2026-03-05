import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tickets API
export const ticketsApi = {
  // Get all tickets with optional search and filter
  getAll: async (search = '', filterDate = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filterDate) params.append('filter_date', filterDate);
    const response = await api.get(`/tickets?${params.toString()}`);
    return response.data;
  },

  // Get single ticket by ID
  getById: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  // Create new ticket
  create: async (ticketData) => {
    const response = await api.post('/tickets', ticketData);
    return response.data;
  },

  // Duplicate ticket
  duplicate: async (id) => {
    const response = await api.post(`/tickets/${id}/duplicate`);
    return response.data;
  },

  // Get PDF download URL
  getPdfUrl: (id) => {
    return `${API_URL}/tickets/${id}/pdf`;
  },

  // Get public ticket URL
  getPublicUrl: (publicId) => {
    return `${process.env.REACT_APP_BACKEND_URL}/t/${publicId}`;
  },

  // Get stats
  getStats: async () => {
    const response = await api.get('/stats');
    return response.data;
  },
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount).replace('MX$', '$');
};

// Format date
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Get WhatsApp share URL
export const getWhatsAppUrl = (phone, publicId) => {
  const ticketUrl = ticketsApi.getPublicUrl(publicId);
  const message = encodeURIComponent(`Gracias por su compra. Aquí está su comprobante: ${ticketUrl}`);
  const phoneNumber = phone ? phone.replace(/\D/g, '') : '';
  return `https://wa.me/${phoneNumber}?text=${message}`;
};
