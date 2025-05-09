const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MODE } = process.env;
const base = PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

/**
 * Lấy access token từ PayPal API
 * @returns {Promise<string>} Access token
 */
async function getAccessToken() {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const response = await axios({
      method: 'post',
      url: `${base}/v1/oauth2/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      data: 'grant_type=client_credentials'
    });
    
    return response.data.access_token;
  } catch (error) {
    console.error('Lỗi khi lấy PayPal access token:', error.message);
    throw new Error('Không thể kết nối với PayPal');
  }
}

/**
 * Tạo một giao dịch thanh toán PayPal mới
 * @param {number} amount - Số tiền cần thanh toán (VND)
 * @param {string} userId - ID của người dùng
 * @param {string} returnUrl - URL để chuyển hướng khi thanh toán thành công
 * @param {string} cancelUrl - URL để chuyển hướng khi hủy thanh toán
 * @returns {Promise<Object>} Thông tin giao dịch bao gồm URL để redirect người dùng
 */
async function createPayment(amount, userId, returnUrl, cancelUrl) {
  try {
    // Chuyển đổi từ VND sang USD (giả sử tỷ giá 1 USD = 23,000 VND)
    const amountUSD = (amount / 23000).toFixed(2);
    
    const accessToken = await getAccessToken();
    
    const response = await axios({
      method: 'post',
      url: `${base}/v2/checkout/orders`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: userId,
          description: 'Nạp SnackPoints',
          amount: {
            currency_code: 'USD',
            value: amountUSD
          }
        }],
        application_context: {
          brand_name: 'SnackShop',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
          payment_method: {
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
            standard_entry_class_code: 'WEB'
          },
          payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
          return_url: returnUrl,
          cancel_url: cancelUrl
        }
      }
    });
    
    return {
      id: response.data.id,
      status: response.data.status,
      approvalUrl: response.data.links.find(link => link.rel === 'approve').href
    };
  } catch (error) {
    console.error('Lỗi khi tạo PayPal payment:', error.message);
    console.error('Chi tiết lỗi:', error.response?.data);
    throw new Error('Không thể tạo giao dịch PayPal');
  }
}

/**
 * Xác nhận và hoàn tất giao dịch PayPal
 * @param {string} orderId - ID của đơn hàng PayPal
 * @returns {Promise<Object>} Kết quả giao dịch
 */
async function capturePayment(orderId) {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios({
      method: 'post',
      url: `${base}/v2/checkout/orders/${orderId}/capture`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    // Log toàn bộ response để debug
    console.log('PayPal capture response:', JSON.stringify(response.data));
    
    // Trích xuất dữ liệu với kiểm tra null
    const captureId = response.data.purchase_units?.[0]?.payments?.captures?.[0]?.id || 'unknown';
    const value = response.data.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || '0';
    const referenceId = response.data.purchase_units?.[0]?.reference_id || '';
    
    return {
      id: response.data.id,
      status: response.data.status,
      payerId: response.data.payer?.payer_id || '',
      paymentDetails: {
        amount: { value: value },  // Đảm bảo cấu trúc này luôn tồn tại
        reference_id: referenceId
      },
      transactionId: captureId
    };
  } catch (error) {
    console.error('Lỗi khi xác nhận PayPal payment:', error.message);
    console.error('Chi tiết lỗi:', error.response?.data);
    throw new Error('Không thể xác nhận giao dịch PayPal');
  }
}

/**
 * Kiểm tra trạng thái của đơn hàng PayPal
 * @param {string} orderId - ID của đơn hàng PayPal
 * @returns {Promise<Object>} Thông tin đơn hàng
 */
async function checkOrderStatus(orderId) {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios({
      method: 'get',
      url: `${base}/v2/checkout/orders/${orderId}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi kiểm tra trạng thái đơn hàng PayPal:', error.message);
    throw new Error('Không thể kiểm tra trạng thái đơn hàng PayPal');
  }
}

module.exports = {
  createPayment,
  capturePayment,
  checkOrderStatus
}; 