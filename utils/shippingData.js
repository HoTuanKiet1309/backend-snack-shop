// Store coordinates
const storeLocation = {
  latitude: 10.8534,
  longitude: 106.7687
};

// Shipping fee rules
const SHIPPING_RULES = {
  FREE: 0,      // < 5km
  MEDIUM: 20000, // 5km - 10km
  HIGH: 30000   // > 10km
};

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

// Calculate shipping fee based on distance
const calculateShippingFee = (distance) => {
  if (distance < 5) return SHIPPING_RULES.FREE;
  if (distance <= 10) return SHIPPING_RULES.MEDIUM;
  return SHIPPING_RULES.HIGH;
};

// Ward shipping information
const wardShippingInfo = {
  // Thủ Đức
  'Linh Trung': { distance: 0, fee: SHIPPING_RULES.FREE },
  'Linh Chiểu': { distance: 2.5, fee: SHIPPING_RULES.FREE },
  'Linh Đông': { distance: 3.8, fee: SHIPPING_RULES.FREE },
  'Linh Tây': { distance: 4.2, fee: SHIPPING_RULES.FREE },
  'Linh Xuân': { distance: 4.9, fee: SHIPPING_RULES.FREE },
  'Hiệp Bình Chánh': { distance: 5.3, fee: SHIPPING_RULES.MEDIUM },
  'Hiệp Bình Phước': { distance: 5.8, fee: SHIPPING_RULES.MEDIUM },
  'Tam Bình': { distance: 6.2, fee: SHIPPING_RULES.MEDIUM },
  'Tam Phú': { distance: 6.7, fee: SHIPPING_RULES.MEDIUM },
  'Trường Thọ': { distance: 7.1, fee: SHIPPING_RULES.MEDIUM },
  'Long Thạnh Mỹ': { distance: 7.5, fee: SHIPPING_RULES.MEDIUM },
  'Long Bình': { distance: 8.2, fee: SHIPPING_RULES.MEDIUM },
  'Long Phước': { distance: 8.7, fee: SHIPPING_RULES.MEDIUM },
  'Phước Long': { distance: 9.3, fee: SHIPPING_RULES.MEDIUM },
  'Phước Bình': { distance: 9.8, fee: SHIPPING_RULES.MEDIUM },
  'Tăng Nhơn Phú A': { distance: 10.5, fee: SHIPPING_RULES.HIGH },
  'Tăng Nhơn Phú B': { distance: 11.2, fee: SHIPPING_RULES.HIGH },
  'Phú Hữu': { distance: 11.8, fee: SHIPPING_RULES.HIGH },
  'Hiệp Phú': { distance: 12.3, fee: SHIPPING_RULES.HIGH },
  'Long Trường': { distance: 12.9, fee: SHIPPING_RULES.HIGH },
  'Phước Thạnh': { distance: 13.5, fee: SHIPPING_RULES.HIGH }
};

module.exports = {
  storeLocation,
  SHIPPING_RULES,
  calculateDistance,
  calculateShippingFee,
  wardShippingInfo
}; 