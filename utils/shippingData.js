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
  'Phước Thạnh': { distance: 13.5, fee: SHIPPING_RULES.HIGH },
  
  // Quận 12
  'An Phú Đông': { distance: 14.2, fee: SHIPPING_RULES.HIGH },
  'Đông Hưng Thuận': { distance: 13.8, fee: SHIPPING_RULES.HIGH },
  'Hiệp Thành': { distance: 12.5, fee: SHIPPING_RULES.HIGH },
  'Tân Chánh Hiệp': { distance: 13.1, fee: SHIPPING_RULES.HIGH },
  'Tân Hưng Thuận': { distance: 14.5, fee: SHIPPING_RULES.HIGH },
  'Tân Thới Hiệp': { distance: 12.8, fee: SHIPPING_RULES.HIGH },
  'Tân Thới Nhất': { distance: 13.9, fee: SHIPPING_RULES.HIGH },
  'Thạnh Lộc': { distance: 15.2, fee: SHIPPING_RULES.HIGH },
  'Thạnh Xuân': { distance: 16.1, fee: SHIPPING_RULES.HIGH },
  'Thới An': { distance: 15.7, fee: SHIPPING_RULES.HIGH },
  'Trung Mỹ Tây': { distance: 14.8, fee: SHIPPING_RULES.HIGH },
  
  // Quận 1
  'Bến Nghé': { distance: 12.8, fee: SHIPPING_RULES.HIGH },
  'Bến Thành': { distance: 13.2, fee: SHIPPING_RULES.HIGH },
  'Cô Giang': { distance: 13.5, fee: SHIPPING_RULES.HIGH },
  'Cầu Kho': { distance: 14.0, fee: SHIPPING_RULES.HIGH },
  'Cầu Ông Lãnh': { distance: 13.8, fee: SHIPPING_RULES.HIGH },
  'Đa Kao': { distance: 12.5, fee: SHIPPING_RULES.HIGH },
  'Nguyễn Cư Trinh': { distance: 14.2, fee: SHIPPING_RULES.HIGH },
  'Nguyễn Thái Bình': { distance: 13.9, fee: SHIPPING_RULES.HIGH },
  'Phạm Ngũ Lão': { distance: 14.3, fee: SHIPPING_RULES.HIGH },
  'Tân Định': { distance: 12.3, fee: SHIPPING_RULES.HIGH },
  
  // Quận 2 (Được sáp nhập vào Thủ Đức)
  
  // Quận 3
  'Võ Thị Sáu': { distance: 12.6, fee: SHIPPING_RULES.HIGH },
  'Phường 1': { distance: 12.2, fee: SHIPPING_RULES.HIGH },
  'Phường 2': { distance: 12.5, fee: SHIPPING_RULES.HIGH },
  'Phường 3': { distance: 12.8, fee: SHIPPING_RULES.HIGH },
  'Phường 4': { distance: 13.0, fee: SHIPPING_RULES.HIGH },
  'Phường 5': { distance: 13.3, fee: SHIPPING_RULES.HIGH },
  'Phường 6': { distance: 13.6, fee: SHIPPING_RULES.HIGH },
  'Phường 7': { distance: 13.9, fee: SHIPPING_RULES.HIGH },
  'Phường 8': { distance: 14.1, fee: SHIPPING_RULES.HIGH },
  'Phường 9': { distance: 14.4, fee: SHIPPING_RULES.HIGH },
  'Phường 10': { distance: 14.7, fee: SHIPPING_RULES.HIGH },
  'Phường 11': { distance: 15.0, fee: SHIPPING_RULES.HIGH },
  'Phường 12': { distance: 15.3, fee: SHIPPING_RULES.HIGH },
  'Phường 13': { distance: 15.6, fee: SHIPPING_RULES.HIGH },
  'Phường 14': { distance: 15.9, fee: SHIPPING_RULES.HIGH },
  
  // Quận 4
  'Phường 1': { distance: 14.5, fee: SHIPPING_RULES.HIGH },
  'Phường 2': { distance: 14.8, fee: SHIPPING_RULES.HIGH },
  'Phường 3': { distance: 15.1, fee: SHIPPING_RULES.HIGH },
  'Phường 4': { distance: 15.4, fee: SHIPPING_RULES.HIGH },
  'Phường 5': { distance: 15.7, fee: SHIPPING_RULES.HIGH },
  'Phường 6': { distance: 16.0, fee: SHIPPING_RULES.HIGH },
  'Phường 8': { distance: 16.3, fee: SHIPPING_RULES.HIGH },
  'Phường 9': { distance: 16.6, fee: SHIPPING_RULES.HIGH },
  'Phường 10': { distance: 16.9, fee: SHIPPING_RULES.HIGH },
  'Phường 13': { distance: 17.2, fee: SHIPPING_RULES.HIGH },
  'Phường 14': { distance: 17.5, fee: SHIPPING_RULES.HIGH },
  'Phường 15': { distance: 17.8, fee: SHIPPING_RULES.HIGH },
  'Phường 16': { distance: 18.1, fee: SHIPPING_RULES.HIGH },
  'Phường 18': { distance: 18.4, fee: SHIPPING_RULES.HIGH },
  
  // Quận 5
  'Phường 1': { distance: 15.0, fee: SHIPPING_RULES.HIGH },
  'Phường 2': { distance: 15.3, fee: SHIPPING_RULES.HIGH },
  'Phường 3': { distance: 15.6, fee: SHIPPING_RULES.HIGH },
  'Phường 4': { distance: 15.9, fee: SHIPPING_RULES.HIGH },
  'Phường 5': { distance: 16.2, fee: SHIPPING_RULES.HIGH },
  'Phường 6': { distance: 16.5, fee: SHIPPING_RULES.HIGH },
  'Phường 7': { distance: 16.8, fee: SHIPPING_RULES.HIGH },
  'Phường 8': { distance: 17.1, fee: SHIPPING_RULES.HIGH },
  'Phường 9': { distance: 17.4, fee: SHIPPING_RULES.HIGH },
  'Phường 10': { distance: 17.7, fee: SHIPPING_RULES.HIGH },
  'Phường 11': { distance: 18.0, fee: SHIPPING_RULES.HIGH },
  'Phường 12': { distance: 18.3, fee: SHIPPING_RULES.HIGH },
  'Phường 13': { distance: 18.6, fee: SHIPPING_RULES.HIGH },
  'Phường 14': { distance: 18.9, fee: SHIPPING_RULES.HIGH },
  'Phường 15': { distance: 19.2, fee: SHIPPING_RULES.HIGH },
  
  // Quận 6
  'Phường 1': { distance: 16.0, fee: SHIPPING_RULES.HIGH },
  'Phường 2': { distance: 16.3, fee: SHIPPING_RULES.HIGH },
  'Phường 3': { distance: 16.6, fee: SHIPPING_RULES.HIGH },
  'Phường 4': { distance: 16.9, fee: SHIPPING_RULES.HIGH },
  'Phường 5': { distance: 17.2, fee: SHIPPING_RULES.HIGH },
  'Phường 6': { distance: 17.5, fee: SHIPPING_RULES.HIGH },
  'Phường 7': { distance: 17.8, fee: SHIPPING_RULES.HIGH },
  'Phường 8': { distance: 18.1, fee: SHIPPING_RULES.HIGH },
  'Phường 9': { distance: 18.4, fee: SHIPPING_RULES.HIGH },
  'Phường 10': { distance: 18.7, fee: SHIPPING_RULES.HIGH },
  'Phường 11': { distance: 19.0, fee: SHIPPING_RULES.HIGH },
  'Phường 12': { distance: 19.3, fee: SHIPPING_RULES.HIGH },
  'Phường 13': { distance: 19.6, fee: SHIPPING_RULES.HIGH },
  'Phường 14': { distance: 19.9, fee: SHIPPING_RULES.HIGH },
  
  // Quận 7
  'Tân Thuận Đông': { distance: 17.5, fee: SHIPPING_RULES.HIGH },
  'Tân Thuận Tây': { distance: 18.0, fee: SHIPPING_RULES.HIGH },
  'Tân Kiểng': { distance: 17.2, fee: SHIPPING_RULES.HIGH },
  'Tân Hưng': { distance: 17.8, fee: SHIPPING_RULES.HIGH },
  'Bình Thuận': { distance: 16.5, fee: SHIPPING_RULES.HIGH },
  'Tân Quy': { distance: 16.9, fee: SHIPPING_RULES.HIGH },
  'Phú Thuận': { distance: 18.3, fee: SHIPPING_RULES.HIGH },
  'Tân Phú': { distance: 17.1, fee: SHIPPING_RULES.HIGH },
  'Tân Phong': { distance: 16.7, fee: SHIPPING_RULES.HIGH },
  'Phú Mỹ': { distance: 16.3, fee: SHIPPING_RULES.HIGH },
  
  // Quận 8
  'Phường 1': { distance: 16.5, fee: SHIPPING_RULES.HIGH },
  'Phường 2': { distance: 16.8, fee: SHIPPING_RULES.HIGH },
  'Phường 3': { distance: 17.1, fee: SHIPPING_RULES.HIGH },
  'Phường 4': { distance: 17.4, fee: SHIPPING_RULES.HIGH },
  'Phường 5': { distance: 17.7, fee: SHIPPING_RULES.HIGH },
  'Phường 6': { distance: 18.0, fee: SHIPPING_RULES.HIGH },
  'Phường 7': { distance: 18.3, fee: SHIPPING_RULES.HIGH },
  'Phường 8': { distance: 18.6, fee: SHIPPING_RULES.HIGH },
  'Phường 9': { distance: 18.9, fee: SHIPPING_RULES.HIGH },
  'Phường 10': { distance: 19.2, fee: SHIPPING_RULES.HIGH },
  'Phường 11': { distance: 19.5, fee: SHIPPING_RULES.HIGH },
  'Phường 12': { distance: 19.8, fee: SHIPPING_RULES.HIGH },
  'Phường 13': { distance: 20.1, fee: SHIPPING_RULES.HIGH },
  'Phường 14': { distance: 20.4, fee: SHIPPING_RULES.HIGH },
  'Phường 15': { distance: 20.7, fee: SHIPPING_RULES.HIGH },
  'Phường 16': { distance: 21.0, fee: SHIPPING_RULES.HIGH },
  
  // Quận 9 (Được sáp nhập vào Thủ Đức)
  
  // Quận 10
  'Phường 1': { distance: 15.5, fee: SHIPPING_RULES.HIGH },
  'Phường 2': { distance: 15.8, fee: SHIPPING_RULES.HIGH },
  'Phường 3': { distance: 16.1, fee: SHIPPING_RULES.HIGH },
  'Phường 4': { distance: 16.4, fee: SHIPPING_RULES.HIGH },
  'Phường 5': { distance: 16.7, fee: SHIPPING_RULES.HIGH },
  'Phường 6': { distance: 17.0, fee: SHIPPING_RULES.HIGH },
  'Phường 7': { distance: 17.3, fee: SHIPPING_RULES.HIGH },
  'Phường 8': { distance: 17.6, fee: SHIPPING_RULES.HIGH },
  'Phường 9': { distance: 17.9, fee: SHIPPING_RULES.HIGH },
  'Phường 10': { distance: 18.2, fee: SHIPPING_RULES.HIGH },
  'Phường 11': { distance: 18.5, fee: SHIPPING_RULES.HIGH },
  'Phường 12': { distance: 18.8, fee: SHIPPING_RULES.HIGH },
  'Phường 13': { distance: 19.1, fee: SHIPPING_RULES.HIGH },
  'Phường 14': { distance: 19.4, fee: SHIPPING_RULES.HIGH },
  'Phường 15': { distance: 19.7, fee: SHIPPING_RULES.HIGH },
  
  // Quận 11
  'Phường 1': { distance: 16.0, fee: SHIPPING_RULES.HIGH },
  'Phường 2': { distance: 16.3, fee: SHIPPING_RULES.HIGH },
  'Phường 3': { distance: 16.6, fee: SHIPPING_RULES.HIGH },
  'Phường 4': { distance: 16.9, fee: SHIPPING_RULES.HIGH },
  'Phường 5': { distance: 17.2, fee: SHIPPING_RULES.HIGH },
  'Phường 6': { distance: 17.5, fee: SHIPPING_RULES.HIGH },
  'Phường 7': { distance: 17.8, fee: SHIPPING_RULES.HIGH },
  'Phường 8': { distance: 18.1, fee: SHIPPING_RULES.HIGH },
  'Phường 9': { distance: 18.4, fee: SHIPPING_RULES.HIGH },
  'Phường 10': { distance: 18.7, fee: SHIPPING_RULES.HIGH },
  'Phường 11': { distance: 19.0, fee: SHIPPING_RULES.HIGH },
  'Phường 12': { distance: 19.3, fee: SHIPPING_RULES.HIGH },
  'Phường 13': { distance: 19.6, fee: SHIPPING_RULES.HIGH },
  'Phường 14': { distance: 19.9, fee: SHIPPING_RULES.HIGH },
  'Phường 15': { distance: 20.2, fee: SHIPPING_RULES.HIGH },
  'Phường 16': { distance: 20.5, fee: SHIPPING_RULES.HIGH },
  
  // Quận Bình Tân
  'An Lạc': { distance: 18.5, fee: SHIPPING_RULES.HIGH },
  'An Lạc A': { distance: 19.0, fee: SHIPPING_RULES.HIGH },
  'Bình Hưng Hòa': { distance: 19.5, fee: SHIPPING_RULES.HIGH },
  'Bình Hưng Hòa A': { distance: 20.0, fee: SHIPPING_RULES.HIGH },
  'Bình Hưng Hòa B': { distance: 20.5, fee: SHIPPING_RULES.HIGH },
  'Bình Trị Đông': { distance: 18.2, fee: SHIPPING_RULES.HIGH },
  'Bình Trị Đông A': { distance: 18.7, fee: SHIPPING_RULES.HIGH },
  'Bình Trị Đông B': { distance: 19.2, fee: SHIPPING_RULES.HIGH },
  'Tân Tạo': { distance: 21.0, fee: SHIPPING_RULES.HIGH },
  'Tân Tạo A': { distance: 21.5, fee: SHIPPING_RULES.HIGH },
  
  // Quận Bình Thạnh
  'Phường 1': { distance: 11.0, fee: SHIPPING_RULES.HIGH },
  'Phường 2': { distance: 11.3, fee: SHIPPING_RULES.HIGH },
  'Phường 3': { distance: 11.6, fee: SHIPPING_RULES.HIGH },
  'Phường 5': { distance: 11.9, fee: SHIPPING_RULES.HIGH },
  'Phường 6': { distance: 12.2, fee: SHIPPING_RULES.HIGH },
  'Phường 7': { distance: 12.5, fee: SHIPPING_RULES.HIGH },
  'Phường 11': { distance: 12.8, fee: SHIPPING_RULES.HIGH },
  'Phường 12': { distance: 13.1, fee: SHIPPING_RULES.HIGH },
  'Phường 13': { distance: 13.4, fee: SHIPPING_RULES.HIGH },
  'Phường 14': { distance: 13.7, fee: SHIPPING_RULES.HIGH },
  'Phường 15': { distance: 14.0, fee: SHIPPING_RULES.HIGH },
  'Phường 17': { distance: 14.3, fee: SHIPPING_RULES.HIGH },
  'Phường 19': { distance: 14.6, fee: SHIPPING_RULES.HIGH },
  'Phường 21': { distance: 14.9, fee: SHIPPING_RULES.HIGH },
  'Phường 22': { distance: 15.2, fee: SHIPPING_RULES.HIGH },
  'Phường 24': { distance: 15.5, fee: SHIPPING_RULES.HIGH },
  'Phường 25': { distance: 15.8, fee: SHIPPING_RULES.HIGH },
  'Phường 26': { distance: 16.1, fee: SHIPPING_RULES.HIGH },
  'Phường 27': { distance: 16.4, fee: SHIPPING_RULES.HIGH },
  'Phường 28': { distance: 16.7, fee: SHIPPING_RULES.HIGH },
  
  // Quận Gò Vấp
  'Phường 1': { distance: 14.0, fee: SHIPPING_RULES.HIGH },
  'Phường 3': { distance: 14.3, fee: SHIPPING_RULES.HIGH },
  'Phường 4': { distance: 14.6, fee: SHIPPING_RULES.HIGH },
  'Phường 5': { distance: 14.9, fee: SHIPPING_RULES.HIGH },
  'Phường 6': { distance: 15.2, fee: SHIPPING_RULES.HIGH },
  'Phường 7': { distance: 15.5, fee: SHIPPING_RULES.HIGH },
  'Phường 8': { distance: 15.8, fee: SHIPPING_RULES.HIGH },
  'Phường 9': { distance: 16.1, fee: SHIPPING_RULES.HIGH },
  'Phường 10': { distance: 16.4, fee: SHIPPING_RULES.HIGH },
  'Phường 11': { distance: 16.7, fee: SHIPPING_RULES.HIGH },
  'Phường 12': { distance: 17.0, fee: SHIPPING_RULES.HIGH },
  'Phường 13': { distance: 17.3, fee: SHIPPING_RULES.HIGH },
  'Phường 14': { distance: 17.6, fee: SHIPPING_RULES.HIGH },
  'Phường 15': { distance: 17.9, fee: SHIPPING_RULES.HIGH },
  'Phường 16': { distance: 18.2, fee: SHIPPING_RULES.HIGH },
  'Phường 17': { distance: 18.5, fee: SHIPPING_RULES.HIGH },
  
  // Quận Phú Nhuận
  'Phường 1': { distance: 13.0, fee: SHIPPING_RULES.HIGH },
  'Phường 2': { distance: 13.3, fee: SHIPPING_RULES.HIGH },
  'Phường 3': { distance: 13.6, fee: SHIPPING_RULES.HIGH },
  'Phường 4': { distance: 13.9, fee: SHIPPING_RULES.HIGH },
  'Phường 5': { distance: 14.2, fee: SHIPPING_RULES.HIGH },
  'Phường 7': { distance: 14.5, fee: SHIPPING_RULES.HIGH },
  'Phường 8': { distance: 14.8, fee: SHIPPING_RULES.HIGH },
  'Phường 9': { distance: 15.1, fee: SHIPPING_RULES.HIGH },
  'Phường 10': { distance: 15.4, fee: SHIPPING_RULES.HIGH },
  'Phường 11': { distance: 15.7, fee: SHIPPING_RULES.HIGH },
  'Phường 12': { distance: 16.0, fee: SHIPPING_RULES.HIGH },
  'Phường 13': { distance: 16.3, fee: SHIPPING_RULES.HIGH },
  'Phường 14': { distance: 16.6, fee: SHIPPING_RULES.HIGH },
  'Phường 15': { distance: 16.9, fee: SHIPPING_RULES.HIGH },
  'Phường 17': { distance: 17.2, fee: SHIPPING_RULES.HIGH },
  
  // Quận Tân Bình
  'Phường 1': { distance: 15.0, fee: SHIPPING_RULES.HIGH },
  'Phường 2': { distance: 15.3, fee: SHIPPING_RULES.HIGH },
  'Phường 3': { distance: 15.6, fee: SHIPPING_RULES.HIGH },
  'Phường 4': { distance: 15.9, fee: SHIPPING_RULES.HIGH },
  'Phường 5': { distance: 16.2, fee: SHIPPING_RULES.HIGH },
  'Phường 6': { distance: 16.5, fee: SHIPPING_RULES.HIGH },
  'Phường 7': { distance: 16.8, fee: SHIPPING_RULES.HIGH },
  'Phường 8': { distance: 17.1, fee: SHIPPING_RULES.HIGH },
  'Phường 9': { distance: 17.4, fee: SHIPPING_RULES.HIGH },
  'Phường 10': { distance: 17.7, fee: SHIPPING_RULES.HIGH },
  'Phường 11': { distance: 18.0, fee: SHIPPING_RULES.HIGH },
  'Phường 12': { distance: 18.3, fee: SHIPPING_RULES.HIGH },
  'Phường 13': { distance: 18.6, fee: SHIPPING_RULES.HIGH },
  'Phường 14': { distance: 18.9, fee: SHIPPING_RULES.HIGH },
  'Phường 15': { distance: 19.2, fee: SHIPPING_RULES.HIGH },
  
  // Quận Tân Phú
  'Hiệp Tân': { distance: 17.0, fee: SHIPPING_RULES.HIGH },
  'Hòa Thạnh': { distance: 17.3, fee: SHIPPING_RULES.HIGH },
  'Phú Thạnh': { distance: 17.6, fee: SHIPPING_RULES.HIGH },
  'Phú Thọ Hòa': { distance: 17.9, fee: SHIPPING_RULES.HIGH },
  'Phú Trung': { distance: 18.2, fee: SHIPPING_RULES.HIGH },
  'Sơn Kỳ': { distance: 18.5, fee: SHIPPING_RULES.HIGH },
  'Tân Quý': { distance: 18.8, fee: SHIPPING_RULES.HIGH },
  'Tân Sơn Nhì': { distance: 19.1, fee: SHIPPING_RULES.HIGH },
  'Tân Thành': { distance: 19.4, fee: SHIPPING_RULES.HIGH },
  'Tân Thới Hòa': { distance: 19.7, fee: SHIPPING_RULES.HIGH },
  'Tây Thạnh': { distance: 20.0, fee: SHIPPING_RULES.HIGH },
  
  // Huyện Bình Chánh
  'An Phú Tây': { distance: 22.0, fee: SHIPPING_RULES.HIGH },
  'Bình Chánh': { distance: 21.0, fee: SHIPPING_RULES.HIGH },
  'Bình Hưng': { distance: 20.0, fee: SHIPPING_RULES.HIGH },
  'Đa Phước': { distance: 23.0, fee: SHIPPING_RULES.HIGH },
  'Hưng Long': { distance: 24.0, fee: SHIPPING_RULES.HIGH },
  'Lê Minh Xuân': { distance: 25.0, fee: SHIPPING_RULES.HIGH },
  'Phạm Văn Hai': { distance: 19.0, fee: SHIPPING_RULES.HIGH },
  'Phong Phú': { distance: 18.0, fee: SHIPPING_RULES.HIGH },
  'Quy Đức': { distance: 26.0, fee: SHIPPING_RULES.HIGH },
  'Tân Kiên': { distance: 20.5, fee: SHIPPING_RULES.HIGH },
  'Tân Nhựt': { distance: 27.0, fee: SHIPPING_RULES.HIGH },
  'Tân Quý Tây': { distance: 28.0, fee: SHIPPING_RULES.HIGH },
  'Tân Túc': { distance: 21.5, fee: SHIPPING_RULES.HIGH },
  'Vĩnh Lộc A': { distance: 22.5, fee: SHIPPING_RULES.HIGH },
  'Vĩnh Lộc B': { distance: 23.5, fee: SHIPPING_RULES.HIGH },
  
  // Huyện Cần Giờ
  'An Thới Đông': { distance: 50.0, fee: SHIPPING_RULES.HIGH },
  'Bình Khánh': { distance: 45.0, fee: SHIPPING_RULES.HIGH },
  'Cần Thạnh': { distance: 55.0, fee: SHIPPING_RULES.HIGH },
  'Long Hòa': { distance: 60.0, fee: SHIPPING_RULES.HIGH },
  'Lý Nhơn': { distance: 65.0, fee: SHIPPING_RULES.HIGH },
  'Tam Thôn Hiệp': { distance: 52.0, fee: SHIPPING_RULES.HIGH },
  'Thạnh An': { distance: 70.0, fee: SHIPPING_RULES.HIGH },
  
  // Huyện Củ Chi
  'An Nhơn Tây': { distance: 35.0, fee: SHIPPING_RULES.HIGH },
  'An Phú': { distance: 34.0, fee: SHIPPING_RULES.HIGH },
  'Bình Mỹ': { distance: 36.0, fee: SHIPPING_RULES.HIGH },
  'Củ Chi': { distance: 30.0, fee: SHIPPING_RULES.HIGH },
  'Hòa Phú': { distance: 33.0, fee: SHIPPING_RULES.HIGH },
  'Nhuận Đức': { distance: 38.0, fee: SHIPPING_RULES.HIGH },
  'Phạm Văn Cội': { distance: 37.0, fee: SHIPPING_RULES.HIGH },
  'Phú Hòa Đông': { distance: 32.0, fee: SHIPPING_RULES.HIGH },
  'Phú Mỹ Hưng': { distance: 31.0, fee: SHIPPING_RULES.HIGH },
  'Tân An Hội': { distance: 39.0, fee: SHIPPING_RULES.HIGH },
  'Tân Phú Trung': { distance: 29.0, fee: SHIPPING_RULES.HIGH },
  'Tân Thạnh Đông': { distance: 40.0, fee: SHIPPING_RULES.HIGH },
  'Tân Thạnh Tây': { distance: 41.0, fee: SHIPPING_RULES.HIGH },
  'Tân Thông Hội': { distance: 28.0, fee: SHIPPING_RULES.HIGH },
  'Thái Mỹ': { distance: 42.0, fee: SHIPPING_RULES.HIGH },
  'Trung An': { distance: 37.5, fee: SHIPPING_RULES.HIGH },
  'Trung Lập Hạ': { distance: 38.5, fee: SHIPPING_RULES.HIGH },
  'Trung Lập Thượng': { distance: 39.5, fee: SHIPPING_RULES.HIGH },
  
  // Huyện Hóc Môn
  'Bà Điểm': { distance: 24.0, fee: SHIPPING_RULES.HIGH },
  'Đông Thạnh': { distance: 25.0, fee: SHIPPING_RULES.HIGH },
  'Hóc Môn': { distance: 23.0, fee: SHIPPING_RULES.HIGH },
  'Nhị Bình': { distance: 26.0, fee: SHIPPING_RULES.HIGH },
  'Tân Hiệp': { distance: 27.0, fee: SHIPPING_RULES.HIGH },
  'Tân Thới Nhì': { distance: 22.0, fee: SHIPPING_RULES.HIGH },
  'Tân Xuân': { distance: 28.0, fee: SHIPPING_RULES.HIGH },
  'Thới Tam Thôn': { distance: 21.0, fee: SHIPPING_RULES.HIGH },
  'Trung Chánh': { distance: 20.0, fee: SHIPPING_RULES.HIGH },
  'Xuân Thới Đông': { distance: 29.0, fee: SHIPPING_RULES.HIGH },
  'Xuân Thới Sơn': { distance: 30.0, fee: SHIPPING_RULES.HIGH },
  'Xuân Thới Thượng': { distance: 31.0, fee: SHIPPING_RULES.HIGH },
  
  // Huyện Nhà Bè
  'Hiệp Phước': { distance: 22.0, fee: SHIPPING_RULES.HIGH },
  'Long Thới': { distance: 20.0, fee: SHIPPING_RULES.HIGH },
  'Nhà Bè': { distance: 18.0, fee: SHIPPING_RULES.HIGH },
  'Nhơn Đức': { distance: 21.0, fee: SHIPPING_RULES.HIGH },
  'Phú Xuân': { distance: 19.0, fee: SHIPPING_RULES.HIGH },
  'Phước Kiển': { distance: 17.0, fee: SHIPPING_RULES.HIGH },
  'Phước Lộc': { distance: 23.0, fee: SHIPPING_RULES.HIGH }
};

module.exports = {
  storeLocation,
  SHIPPING_RULES,
  calculateDistance,
  calculateShippingFee,
  wardShippingInfo
}; 