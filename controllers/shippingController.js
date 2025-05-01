const { wardShippingInfo } = require('../utils/shippingData');

const calculateShippingFee = async (req, res) => {
  try {
    const { ward } = req.query;
    
    if (!ward) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng cung cấp phường' 
      });
    }

    // Find ward in shipping data
    const wardInfo = wardShippingInfo[ward];
    if (!wardInfo) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy thông tin phí vận chuyển cho phường này' 
      });
    }

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