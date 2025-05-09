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
            <p style="margin: 5px 0;"><strong>Tạm tính:</strong> ${orderDetails.items.reduce((total, item) => total + (item.price * item.quantity), 0).toLocaleString('vi-VN')}đ</p>
            <p style="margin: 5px 0;"><strong>Phí vận chuyển:</strong> ${orderDetails.shippingFee === 0 ? 
              '<span style="color: #28a745;">Miễn phí</span>' : 
              `${orderDetails.shippingFee.toLocaleString('vi-VN')}đ`}</p>
            ${orderDetails.discount > 0 ? `<p style="margin: 5px 0; color: #28a745;"><strong>Giảm giá từ mã:</strong> -${(orderDetails.discount || 0).toLocaleString('vi-VN')}đ</p>` : ''}
            ${orderDetails.paymentMethod === 'SnackPoints' ? `<p style="margin: 5px 0; color: #28a745;"><strong>Giảm thêm (5%):</strong> -${Math.round((orderDetails.items.reduce((total, item) => total + (item.price * item.quantity), 0) + orderDetails.shippingFee - (orderDetails.discount || 0)) * 0.05).toLocaleString('vi-VN')}đ</p>` : ''}
            <p style="margin: 10px 0; font-size: 18px; color: #ff784e;"><strong>Tổng cộng:</strong> ${(orderDetails.totalAmount || 0).toLocaleString('vi-VN')}đ</p>
            ${orderDetails.paymentMethod === 'SnackPoints' ? `<p style="margin: 5px 0; color: #28a745;"><strong>Thanh toán bằng:</strong> ${Math.round(orderDetails.totalAmount).toLocaleString('vi-VN')} SnackPoints</p>` : ''}
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

/**
 * Sends a delivery confirmation email to the customer when an order is marked as delivered
 * @param {Object} orderDetails - Order details including items, totals, shipping address, etc.
 * @param {String} userEmail - Email address of the customer
 */
const sendDeliveryConfirmationEmail = async (orderDetails, userEmail) => {
  try {
    // Check for required data
    if (!orderDetails || !userEmail) {
      console.error('Missing required data for delivery confirmation email:', { orderDetails, userEmail });
      return;
    }

    // Validate SendGrid API key
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key is missing - cannot send delivery confirmation email');
      return;
    }

    // Format order items for display in email
    const formattedItems = orderDetails.items.map(item => {
      const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
        .format(item.price);
      const subtotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
        .format(item.price * item.quantity);
      
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.snackId.snackName || 'Unnamed Item'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${price}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${subtotal}</td>
        </tr>
      `;
    }).join('');

    // Format monetary values using locale
    const subtotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(orderDetails.subtotal);
    const shipping = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(orderDetails.shippingFee);
    const discount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(orderDetails.discount || 0);
    const total = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(orderDetails.totalAmount);

    // Get current date in local format
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const deliveryDate = new Date().toLocaleDateString('vi-VN', dateOptions);

    // HTML content for delivery confirmation email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4CAF50;">Đơn Hàng Đã Được Giao!</h1>
          <p style="font-size: 16px;">Xin chào quý khách,</p>
          <p style="font-size: 16px;">Chúng tôi xin vui mừng thông báo rằng đơn hàng #${orderDetails._id} của quý khách đã được giao thành công vào ngày ${deliveryDate}.</p>
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
          <h2 style="margin-top: 0; color: #333;">Chi Tiết Đơn Hàng</h2>
          <p><strong>Mã đơn hàng:</strong> #${orderDetails._id}</p>
          <p><strong>Ngày đặt hàng:</strong> ${new Date(orderDetails.orderDate).toLocaleDateString('vi-VN', dateOptions)}</p>
          <p><strong>Ngày giao hàng:</strong> ${deliveryDate}</p>
          <p><strong>Phương thức thanh toán:</strong> ${orderDetails.paymentMethod === 'SnackPoints' ? 'SnackPoints' : orderDetails.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : orderDetails.paymentMethod}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="color: #333;">Sản Phẩm Đã Mua</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                <th style="padding: 10px; text-align: center;">Số lượng</th>
                <th style="padding: 10px; text-align: right;">Đơn giá</th>
                <th style="padding: 10px; text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${formattedItems}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; border-top: 2px solid #eee;"><strong>Tạm tính:</strong></td>
                <td style="padding: 10px; text-align: right; border-top: 2px solid #eee;">${orderDetails.items.reduce((total, item) => total + (item.price * item.quantity), 0).toLocaleString('vi-VN')}đ</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Phí vận chuyển:</strong></td>
                <td style="padding: 10px; text-align: right;">${orderDetails.shippingFee === 0 ? '<span style="color: #28a745;">Miễn phí</span>' : `${orderDetails.shippingFee.toLocaleString('vi-VN')}đ`}</td>
              </tr>
              ${orderDetails.discount > 0 ? `
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Giảm giá từ mã:</strong></td>
                <td style="padding: 10px; text-align: right; color: #28a745;">-${orderDetails.discount.toLocaleString('vi-VN')}đ</td>
              </tr>` : ''}
              ${orderDetails.paymentMethod === 'SnackPoints' ? `
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Giảm thêm (5%):</strong></td>
                <td style="padding: 10px; text-align: right; color: #28a745;">-${Math.round((orderDetails.items.reduce((total, item) => total + (item.price * item.quantity), 0) + orderDetails.shippingFee - (orderDetails.discount || 0)) * 0.05).toLocaleString('vi-VN')}đ</td>
              </tr>` : ''}
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; border-top: 2px solid #eee;"><strong>Tổng cộng:</strong></td>
                <td style="padding: 10px; text-align: right; border-top: 2px solid #eee; font-weight: bold; font-size: 18px;">${orderDetails.totalAmount.toLocaleString('vi-VN')}đ</td>
              </tr>
              ${orderDetails.paymentMethod === 'SnackPoints' ? `
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Thanh toán bằng:</strong></td>
                <td style="padding: 10px; text-align: right; color: #28a745;">${Math.round(orderDetails.totalAmount).toLocaleString('vi-VN')} SnackPoints</td>
              </tr>` : ''}
            </tfoot>
          </table>
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
          <h2 style="margin-top: 0; color: #333;">Địa Chỉ Giao Hàng</h2>
          <p>${orderDetails.shippingAddress?.fullName || ''}</p>
          <p>${orderDetails.shippingAddress?.phone || ''}</p>
          <p>${orderDetails.shippingAddress?.address || ''}, ${orderDetails.shippingAddress?.ward || ''}, ${orderDetails.shippingAddress?.district || ''}, ${orderDetails.shippingAddress?.city || ''}</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="font-size: 16px;">Cảm ơn quý khách đã mua sắm tại SnackHub!</p>
          <p>Nếu có bất kỳ thắc mắc hoặc góp ý nào, vui lòng liên hệ với chúng tôi qua email: <a href="mailto:support@snackhub.vn" style="color: #4CAF50;">support@snackhub.vn</a></p>
          <p>Hoặc đánh giá trải nghiệm mua sắm của bạn <a href="https://snackhub.vn/review/${orderDetails._id}" style="color: #4CAF50;">tại đây</a>.</p>
        </div>
      </div>
    `;

    // Configure email
    const msg = {
      to: userEmail,
      from: {
        email: 'noreply@snackhub.vn',
        name: 'SnackHub'
      },
      subject: `Đơn hàng #${orderDetails._id} đã được giao thành công!`,
      html: htmlContent,
    };

    // Send email
    await sgMail.send(msg);
    console.log(`Delivery confirmation email sent successfully to ${userEmail} for order ${orderDetails._id}`);
  } catch (error) {
    console.error('Error sending delivery confirmation email:', error);
    if (error.response) {
      console.error('SendGrid API error:', error.response.body);
    }
  }
};

/**
 * Sends a order completion email to the customer when an order is marked as completed
 * @param {Object} orderDetails - Order details including items, totals, shipping address, etc.
 * @param {String} userEmail - Email address of the customer
 */
const sendOrderCompletionEmail = async (orderDetails, userEmail) => {
  try {
    // Check for required data
    if (!orderDetails || !userEmail) {
      console.error('Missing required data for order completion email:', { orderDetails, userEmail });
      return false;
    }

    // Validate SendGrid API key
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key is missing - cannot send order completion email');
      return false;
    }

    // Format order items for display in email
    const formattedItems = orderDetails.items.map(item => {
      const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
        .format(item.price);
      const subtotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
        .format(item.price * item.quantity);
      
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.snackId.snackName || 'Unnamed Item'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${price}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${subtotal}</td>
        </tr>
      `;
    }).join('');

    // Format monetary values using locale
    const subtotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(orderDetails.subtotal);
    const shipping = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(orderDetails.shippingFee);
    const discount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(orderDetails.discount || 0);
    const total = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(orderDetails.totalAmount);

    // Get current date in local format
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const completionDate = new Date().toLocaleDateString('vi-VN', dateOptions);

    // HTML content for order completion email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4CAF50;">Đơn Hàng Đã Hoàn Thành!</h1>
          <p style="font-size: 16px;">Xin chào quý khách,</p>
          <p style="font-size: 16px;">Chúng tôi xin thông báo rằng đơn hàng #${orderDetails._id} của quý khách đã được giao thành công vào ngày ${completionDate}.</p>
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
          <h2 style="margin-top: 0; color: #333;">Chi Tiết Đơn Hàng</h2>
          <p><strong>Mã đơn hàng:</strong> #${orderDetails._id}</p>
          <p><strong>Ngày đặt hàng:</strong> ${new Date(orderDetails.orderDate).toLocaleDateString('vi-VN', dateOptions)}</p>
          <p><strong>Ngày hoàn thành:</strong> ${completionDate}</p>
          <p><strong>Phương thức thanh toán:</strong> ${orderDetails.paymentMethod === 'SnackPoints' ? 'SnackPoints' : orderDetails.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : orderDetails.paymentMethod}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="color: #333;">Sản Phẩm Đã Mua</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                <th style="padding: 10px; text-align: center;">Số lượng</th>
                <th style="padding: 10px; text-align: right;">Đơn giá</th>
                <th style="padding: 10px; text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${formattedItems}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; border-top: 2px solid #eee;"><strong>Tạm tính:</strong></td>
                <td style="padding: 10px; text-align: right; border-top: 2px solid #eee;">${subtotal}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Phí vận chuyển:</strong></td>
                <td style="padding: 10px; text-align: right;">${shipping}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Giảm giá:</strong></td>
                <td style="padding: 10px; text-align: right;">${discount}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; border-top: 2px solid #eee;"><strong>Tổng cộng:</strong></td>
                <td style="padding: 10px; text-align: right; border-top: 2px solid #eee; font-weight: bold; font-size: 18px;">${total}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="font-size: 16px;">Cảm ơn quý khách đã mua sắm tại SnackHub!</p>
          <p>Chúng tôi rất mong quý khách hài lòng với sản phẩm của chúng tôi.</p>
          <p>Nếu có bất kỳ thắc mắc hoặc góp ý nào, vui lòng liên hệ với chúng tôi qua email: <a href="mailto:support@snackhub.vn" style="color: #4CAF50;">support@snackhub.vn</a></p>
          <p>Hoặc đánh giá trải nghiệm mua sắm của bạn <a href="https://snackhub.vn/review/${orderDetails._id}" style="color: #4CAF50;">tại đây</a>.</p>
        </div>
      </div>
    `;

    // Configure email
    const msg = {
      to: userEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: 'SnackHub'
      },
      subject: `Đơn hàng #${orderDetails._id} đã hoàn thành!`,
      html: htmlContent,
    };

    // Send email
    await sgMail.send(msg);
    console.log(`Order completion email sent successfully to ${userEmail} for order ${orderDetails._id}`);
    return true;
  } catch (error) {
    console.error('Error sending order completion email:', error);
    if (error.response) {
      console.error('SendGrid API error:', error.response.body);
    }
    return false;
  }
};

/**
 * Sends order status update email to customer for all status changes
 * @param {Object} orderDetails - Order details including items, totals, shipping address, etc.
 * @param {String} userEmail - Email address of the customer
 * @param {String} newStatus - The new order status
 * @param {String} previousStatus - The previous order status
 */
const sendOrderStatusUpdateEmail = async (orderDetails, userEmail, newStatus, previousStatus) => {
  try {
    // Check for required data
    if (!orderDetails || !userEmail) {
      console.error('Missing required data for status update email:', { orderDetails, userEmail });
      return false;
    }

    // Validate SendGrid API key
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key is missing - cannot send status update email');
      return false;
    }

    // Map status codes to Vietnamese texts
    const statusText = {
      'pending': 'Chờ xử lý',
      'confirmed': 'Đã xác nhận',
      'processing': 'Đang xử lý',
      'shipping': 'Đang giao hàng',
      'delivered': 'Đã giao hàng',
      'completed': 'Đã hoàn thành',
      'cancelled': 'Đã hủy'
    };

    // Map status to colors for visual indication
    const statusColor = {
      'pending': '#f5a623',
      'confirmed': '#9013fe',
      'processing': '#4a90e2',
      'shipping': '#50e3c2',
      'delivered': '#7ed321',
      'completed': '#2ecc71',
      'cancelled': '#d0021b'
    };
    
    // Format order items for display in email
    const formattedItems = orderDetails.items.map(item => {
      const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
        .format(item.price);
      const subtotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
        .format(item.price * item.quantity);
      
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.snackId.snackName || 'Unnamed Item'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${price}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${subtotal}</td>
        </tr>
      `;
    }).join('');

    // Format monetary values using locale
    const subtotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(orderDetails.subtotal);
    const shipping = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(orderDetails.shippingFee);
    const discount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(orderDetails.discount || 0);
    const total = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(orderDetails.totalAmount);

    // Get current date in local format
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const updateDate = new Date().toLocaleDateString('vi-VN', dateOptions);

    // Create subject line based on status
    let subject = `Cập nhật trạng thái đơn hàng #${orderDetails._id}`;
    
    // Create status specific message
    let statusMessage = '';
    if (newStatus === 'confirmed') {
      statusMessage = 'Đơn hàng của bạn đã được xác nhận và đang được chuẩn bị.';
    } else if (newStatus === 'processing') {
      statusMessage = 'Đơn hàng của bạn đang được xử lý và chuẩn bị để giao.';
    } else if (newStatus === 'shipping') {
      statusMessage = 'Đơn hàng của bạn đang trên đường giao đến bạn.';
    } else if (newStatus === 'cancelled') {
      statusMessage = 'Đơn hàng của bạn đã bị hủy. Nếu bạn đã thanh toán, số tiền sẽ được hoàn trả trong 3-5 ngày làm việc.';
      subject = `Đơn hàng #${orderDetails._id} đã bị hủy`;
    } else {
      statusMessage = `Trạng thái đơn hàng của bạn đã được cập nhật từ ${statusText[previousStatus] || previousStatus} sang ${statusText[newStatus] || newStatus}.`;
    }

    // HTML content for status update email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: ${statusColor[newStatus] || '#333'};">Cập Nhật Đơn Hàng</h1>
          <p style="font-size: 16px;">Xin chào quý khách,</p>
          <p style="font-size: 16px;">${statusMessage}</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0;">Trạng thái hiện tại</h3>
            <div style="font-size: 18px; color: ${statusColor[newStatus] || '#333'}; margin-top: 10px; font-weight: bold;">${statusText[newStatus] || newStatus}</div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
          <h2 style="margin-top: 0; color: #333;">Chi Tiết Đơn Hàng</h2>
          <p><strong>Mã đơn hàng:</strong> #${orderDetails._id}</p>
          <p><strong>Ngày đặt hàng:</strong> ${new Date(orderDetails.orderDate).toLocaleDateString('vi-VN', dateOptions)}</p>
          <p><strong>Ngày cập nhật:</strong> ${updateDate}</p>
          <p><strong>Phương thức thanh toán:</strong> ${orderDetails.paymentMethod === 'SnackPoints' ? 'SnackPoints' : orderDetails.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : orderDetails.paymentMethod}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="color: #333;">Sản Phẩm Đã Mua</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                <th style="padding: 10px; text-align: center;">Số lượng</th>
                <th style="padding: 10px; text-align: right;">Đơn giá</th>
                <th style="padding: 10px; text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${formattedItems}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; border-top: 2px solid #eee;"><strong>Tạm tính:</strong></td>
                <td style="padding: 10px; text-align: right; border-top: 2px solid #eee;">${orderDetails.items.reduce((total, item) => total + (item.price * item.quantity), 0).toLocaleString('vi-VN')}đ</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Phí vận chuyển:</strong></td>
                <td style="padding: 10px; text-align: right;">${orderDetails.shippingFee === 0 ? '<span style="color: #28a745;">Miễn phí</span>' : `${orderDetails.shippingFee.toLocaleString('vi-VN')}đ`}</td>
              </tr>
              ${orderDetails.discount > 0 ? `
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Giảm giá từ mã:</strong></td>
                <td style="padding: 10px; text-align: right; color: #28a745;">-${orderDetails.discount.toLocaleString('vi-VN')}đ</td>
              </tr>` : ''}
              ${orderDetails.paymentMethod === 'SnackPoints' ? `
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Giảm thêm (5%):</strong></td>
                <td style="padding: 10px; text-align: right; color: #28a745;">-${Math.round((orderDetails.items.reduce((total, item) => total + (item.price * item.quantity), 0) + orderDetails.shippingFee - (orderDetails.discount || 0)) * 0.05).toLocaleString('vi-VN')}đ</td>
              </tr>` : ''}
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; border-top: 2px solid #eee;"><strong>Tổng cộng:</strong></td>
                <td style="padding: 10px; text-align: right; border-top: 2px solid #eee; font-weight: bold; font-size: 18px;">${orderDetails.totalAmount.toLocaleString('vi-VN')}đ</td>
              </tr>
              ${orderDetails.paymentMethod === 'SnackPoints' ? `
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Thanh toán bằng:</strong></td>
                <td style="padding: 10px; text-align: right; color: #28a745;">${Math.round(orderDetails.totalAmount).toLocaleString('vi-VN')} SnackPoints</td>
              </tr>` : ''}
            </tfoot>
          </table>
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
          <h2 style="margin-top: 0; color: #333;">Địa Chỉ Giao Hàng</h2>
          <p>${orderDetails.shippingAddress?.fullName || ''}</p>
          <p>${orderDetails.shippingAddress?.phone || ''}</p>
          <p>${orderDetails.shippingAddress?.address || ''}, ${orderDetails.shippingAddress?.ward || ''}, ${orderDetails.shippingAddress?.district || ''}, ${orderDetails.shippingAddress?.city || ''}</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="font-size: 16px;">Cảm ơn quý khách đã mua sắm tại SnackHub!</p>
          <p>Nếu bạn có bất kỳ câu hỏi nào về đơn hàng của mình, vui lòng truy cập <a href="https://snackhub.vn/orders/${orderDetails._id}" style="color: #4CAF50;">Trang chi tiết đơn hàng</a> hoặc liên hệ với chúng tôi qua email: <a href="mailto:support@snackhub.vn" style="color: #4CAF50;">support@snackhub.vn</a></p>
        </div>
      </div>
    `;

    // Configure email
    const msg = {
      to: userEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: 'SnackHub'
      },
      subject: subject,
      html: htmlContent,
    };

    // Send email
    await sgMail.send(msg);
    console.log(`Status update email sent successfully to ${userEmail} for order ${orderDetails._id}`);
    return true;
  } catch (error) {
    console.error('Error sending status update email:', error);
    if (error.response) {
      console.error('SendGrid API error:', error.response.body);
    }
    return false;
  }
};

module.exports = {
  sendOrderConfirmationEmail,
  sendDeliveryConfirmationEmail,
  sendOrderCompletionEmail,
  sendOrderStatusUpdateEmail
}; 