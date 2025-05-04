const { wardShippingInfo } = require('../utils/shippingData');

const calculateShippingFee = async (req, res) => {
  try {
    const { ward, totalAmount } = req.query;
    
    // Kiểm tra free ship cho đơn hàng trên 200k
    if (totalAmount && parseInt(totalAmount) >= 200000) {
      return res.json({
        success: true,
        fee: 0,
        message: 'Miễn phí vận chuyển cho đơn hàng từ 200.000đ'
      });
    }
    
    if (!ward) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng cung cấp phường' 
      });
    }

    console.log(`Received shipping fee request for ward: "${ward}"`);
    
    // Xử lý tên phường - loại bỏ tiền tố "Phường " hoặc "Quận " nếu có
    const processedWard = ward
      .replace(/^Phường\s+/i, '')
      .replace(/^Quận\s+/i, '');
    console.log(`Processing ward name: "${ward}" -> "${processedWard}"`);
    
    // Find ward in shipping data
    const wardInfo = wardShippingInfo[processedWard];
    if (!wardInfo) {
      console.log(`Ward "${processedWard}" not found in shipping data, using default fee`);
      return res.json({ 
        success: true,
        fee: 30000,  // Default fee if ward not found
        message: 'Sử dụng phí mặc định vì không tìm thấy phường'
      });
    }

    console.log(`Found shipping fee for ward "${processedWard}": ${wardInfo.fee}`);
    
    res.json({ 
      success: true,
      fee: wardInfo.fee 
    });
  } catch (error) {
    console.error('Error calculating shipping fee:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi tính phí vận chuyển' 
    });
  }
};

module.exports = {
  calculateShippingFee
}; 