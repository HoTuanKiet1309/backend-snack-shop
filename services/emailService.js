const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendResetPasswordEmail = async (email, resetCode) => {
  try {
    const msg = {
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: 'SnackHub'
      },
      subject: 'SnackHub - Đặt lại mật khẩu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff784e; text-align: center;">Đặt lại mật khẩu</h2>
          <p>Xin chào,</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại SnackHub.</p>
          <p>Mã xác nhận của bạn là:</p>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${resetCode}
          </div>
          <p>Mã xác nhận này sẽ hết hạn sau 15 phút.</p>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          <div style="text-align: center; margin-top: 20px; color: #666;">
            <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua email: support@snackhub.com</p>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending reset password email:', error);
    if (error.response) {
      console.error('SendGrid API Error:', error.response.body);
    }
    return false;
  }
};

module.exports = {
  sendResetPasswordEmail
}; 