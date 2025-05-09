const jwt = require('jsonwebtoken');
const auth = require('../../middleware/auth');
const tokenService = require('../../services/tokenService');

// Mock các module
jest.mock('jsonwebtoken');
jest.mock('../../services/tokenService');

describe('Auth Middleware Test', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  const decoded = { userId: '123456789' };

  beforeEach(() => {
    // Khởi tạo các mock object trước mỗi test case
    mockReq = {
      header: jest.fn(), // Giả lập hàm lấy header
    };
    mockRes = {
      status: jest.fn().mockReturnThis(), // Giả lập hàm status trả về this để chain
      json: jest.fn(), // Giả lập hàm json trả về kết quả
    };
    mockNext = jest.fn(); // Giả lập middleware tiếp theo

    // Reset tất cả các mock trước mỗi test
    jest.clearAllMocks();
  });

  it('xác thực token hợp lệ thành công', async () => {
    // Test case 1: Token hợp lệ được xác thực thành công
    const token = 'valid.jwt.token';
    mockReq.header.mockReturnValue(`Bearer ${token}`); // Giả lập request có token
    
    // Giả lập kết quả xác thực token thành công
    tokenService.verifyToken.mockResolvedValue(decoded);
    tokenService.isTokenBlacklisted.mockResolvedValue(false); // Token không nằm trong blacklist

    // Gọi middleware auth
    await auth(mockReq, mockRes, mockNext);

    // Kiểm tra các kết quả mong muốn
    expect(tokenService.verifyToken).toHaveBeenCalledWith(token); // Phải gọi verify với token đúng
    expect(mockReq.user).toEqual(decoded); // Phải gán thông tin user vào request
    expect(mockReq.token).toBe(token); // Phải gán token vào request
    expect(mockNext).toHaveBeenCalled(); // Phải gọi middleware tiếp theo
  });

  it('trả về lỗi 401 khi không cung cấp token', async () => {
    // Test case 2: Không cung cấp token
    mockReq.header.mockReturnValue(null); // Giả lập request không có token

    // Gọi middleware auth
    await auth(mockReq, mockRes, mockNext);

    // Kiểm tra kết quả - phải trả về lỗi 401 Unauthorized
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'No token, authorization denied'
    });
  });

  it('trả về lỗi 401 khi token có định dạng không hợp lệ', async () => {
    // Test case 3: Token có định dạng không hợp lệ
    mockReq.header.mockReturnValue('InvalidTokenFormat'); // Token không có format "Bearer "
    
    // Giả lập lỗi xác thực do định dạng token không hợp lệ
    tokenService.verifyToken.mockRejectedValue(new Error('Token format invalid'));
    
    // Gọi middleware auth
    await auth(mockReq, mockRes, mockNext);

    // Kiểm tra kết quả - phải trả về lỗi 401 với thông báo token không hợp lệ
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Token is not valid'
    });
  });

  it('trả về lỗi 401 khi token không hợp lệ', async () => {
    // Test case 4: Token không hợp lệ (ví dụ: đã bị sửa đổi, chữ ký không đúng)
    const token = 'invalid.token';
    mockReq.header.mockReturnValue(`Bearer ${token}`);
    
    // Giả lập lỗi xác thực token
    tokenService.verifyToken.mockRejectedValue(new Error('Invalid token'));

    // Gọi middleware auth
    await auth(mockReq, mockRes, mockNext);

    // Kiểm tra kết quả - phải trả về lỗi 401 với thông báo token không hợp lệ
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Token is not valid'
    });
  });

  it('xử lý token đã hết hạn', async () => {
    // Test case 5: Token đã hết hạn
    const token = 'expired.token';
    mockReq.header.mockReturnValue(`Bearer ${token}`);
    
    // Giả lập lỗi token không tìm thấy trong Redis (đã hết hạn)
    tokenService.verifyToken.mockRejectedValue(new Error('Token not found in Redis'));

    // Gọi middleware auth
    await auth(mockReq, mockRes, mockNext);

    // Kiểm tra kết quả - phải trả về lỗi 401 với thông báo phiên đã hết hạn
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Session expired'
    });
  });
}); 