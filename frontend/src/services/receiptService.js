/**
 * Receipt & PDF Service
 * Handles downloading professional PDF receipts from the backend
 */

/**
 * Download order receipt as PDF
 * @param {string} url - API endpoint to fetch receipt
 * @param {string} token - User auth token
 * @param {string} filename - File name for download
 */
export const downloadOrderReceipt = async (url, token, filename = 'receipt.pdf') => {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      let errorMessage = 'Download failed';
      try {
        const err = await res.json();
        errorMessage = err.message || err.error || 'Download failed';
      } catch (_) {
        errorMessage = await res.text();
      }
      throw new Error(errorMessage);
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    window.URL.revokeObjectURL(blobUrl);
    return true;
  } catch (error) {
    console.error('Receipt download error:', error.message);
    throw error;
  }
};

/**
 * Print receipt directly from content
 * @param {string} content - Text or HTML content of receipt
 */
export const printReceipt = (content) => {
  const printWindow = window.open('', '', 'height=700,width=900');
  printWindow.document.write(`
    <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #111; }
          pre { font-family: monospace; font-size: 13px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <pre>${content}</pre>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

/**
 * Format number as currency (INR)
 * @param {number} amount
 * @returns {string} formatted currency
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

/**
 * Format date in human-readable form
 * @param {Date|string|number} date
 * @returns {string} formatted date
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Get status color for orders
 * @param {string} status
 * @returns {string} hex color
 */
export const getStatusColor = (status) => {
  const colors = {
    pending: '#f59e0b',       // amber
    confirmed: '#3b82f6',     // blue
    shipped: '#8b5cf6',       // purple
    delivered: '#10b981',     // green
    cancelled: '#ef4444'      // red
  };
  return colors[status] || '#666';
};

/**
 * Get user-friendly label for order status
 * @param {string} status
 * @returns {string} label
 */
export const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pending Confirmation',
    confirmed: 'Confirmed',
    shipped: 'In Transit',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };
  return labels[status] || 'Unknown';
};