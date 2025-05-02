const sgMail = require('@sendgrid/mail');

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOrderConfirmationEmail = async (orderDetails, userEmail) => {
  try {
    console.log('Starting email sending process...');
    console.log('Sending to:', userEmail);
    
    // Check if required data is available
    if (!orderDetails || !userEmail) {
      console.error('Missing required data:', { orderDetails: !!orderDetails, userEmail: !!userEmail });
      return false;
    }

    // Create items list with error handling
    const itemsList = (orderDetails.items || []).map(item => {
      try {
        const price = item.price || 0;
        const quantity = item.quantity || 0;
        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.snackId?.snackName || 'Unknown Item'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${price.toLocaleString('vi-VN')}đ</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${(price * quantity).toLocaleString('vi-VN')}đ</td>
          </tr>
        `;
      } catch (err) {
        console.error('Error processing item:', err);
        return '<tr><td colspan="4">Error processing item</td></tr>';
      }
    }).join('');

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff784e; text-align: center;">Đặt hàng thành công!</h2>
        <p style="text-align: center;">Cảm ơn bạn đã mua hàng tại SnackHub</p>
        
        <div style="margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h3 style="color: #333;">Chi tiết đơn hàng #${orderDetails._id || ''}</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                <th style="padding: 10px; text-align: left;">Số lượng</th>
                <th style="padding: 10px; text-align: left;">Đơn giá</th>
                <th style="padding: 10px; text-align: left;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>

          <div style="margin-top: 20px; border-top: 2px solid #ddd; padding-top: 10px;">
            <p style="margin: 5px 0;"><strong>Tạm tính:</strong> ${(orderDetails.subtotal || 0).toLocaleString('vi-VN')}đ</p>
            <p style="margin: 5px 0;"><strong>Phí vận chuyển:</strong> ${(orderDetails.shippingFee || 0).toLocaleString('vi-VN')}đ</p>
            ${orderDetails.discount ? `<p style="margin: 5px 0; color: #28a745;"><strong>Giảm giá:</strong> -${(orderDetails.discount || 0).toLocaleString('vi-VN')}đ</p>` : ''}
            <p style="margin: 10px 0; font-size: 18px; color: #ff784e;"><strong>Tổng cộng:</strong> ${(orderDetails.totalAmount || 0).toLocaleString('vi-VN')}đ</p>
          </div>
        </div>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <h4 style="margin: 0 0 10px 0;">Thông tin giao hàng:</h4>
          <p style="margin: 5px 0;">${orderDetails.addressId?.fullName || 'N/A'}</p>
          <p style="margin: 5px 0;">${orderDetails.addressId?.phone || 'N/A'}</p>
          <p style="margin: 5px 0;">${orderDetails.addressId?.specificAddress || 'N/A'}, ${orderDetails.addressId?.ward || 'N/A'}, ${orderDetails.addressId?.district || 'N/A'}</p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #666;">
          <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua email: support@snackhub.com</p>
        </div>
      </div>
    `;

    const msg = {
      to: userEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: 'SnackHub'
      },
      subject: `SnackHub - Xác nhận đơn hàng #${orderDetails._id || ''}`,
      html: emailContent
    };

    console.log('Attempting to send email...');
    await sgMail.send(msg);
    console.log('Email sent successfully');
    return true;
  } catch (error) {
    console.error('Error in sendOrderConfirmationEmail:', error);
    if (error.response) {
      console.error('SendGrid API Error:', error.response.body);
    }
    return false;
  }
};

module.exports = {
  sendOrderConfirmationEmail
}; 