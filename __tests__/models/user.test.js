const mongoose = require('mongoose');
const { describe, it, expect, beforeEach } = require('@jest/globals');
const User = require('../../models/User');

describe('Kiểm thử Model User', () => {
  describe('Kiểm tra tính hợp lệ', () => {
    it('nên xác thực user hợp lệ', async () => {
      // Tạo một user với đầy đủ thông tin hợp lệ
      const validUser = new User({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '0123456789',
        role: 'user'
      });

      const err = validUser.validateSync();
      expect(err).toBeUndefined();
    });

    it('nên thất bại khi thiếu các trường bắt buộc', async () => {
      // Tạo user thiếu các trường bắt buộc
      const userWithoutRequired = new User({});

      const err = userWithoutRequired.validateSync();
      
      expect(err).toBeDefined();
      expect(err.errors.email).toBeDefined();
      expect(err.errors.password).toBeDefined();
      expect(err.errors.firstName).toBeDefined();
      expect(err.errors.lastName).toBeDefined();
      expect(err.errors.phone).toBeDefined();
    });

    it('nên thất bại khi email không hợp lệ', () => {
      // Tạo user với email không hợp lệ
      const userWithInvalidEmail = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'password123',
        role: 'user'
      });

      const validationError = userWithInvalidEmail.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.email.message).toBe('invalid-email is not a valid email!');
    });

    it('nên thất bại khi vai trò không hợp lệ', async () => {
      // Tạo user với vai trò không hợp lệ
      const userWithInvalidRole = new User({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '0123456789',
        role: 'invalid_role'
      });

      const err = userWithInvalidRole.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.role).toBeDefined();
    });
  });

  describe('Mã hóa mật khẩu', () => {
    it('nên mã hóa mật khẩu trước khi lưu', async () => {
      // Kiểm tra mật khẩu được mã hóa khi lưu
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '0123456789',
        role: 'user'
      });

      await user.save();
      expect(user.password).not.toBe('password123');
      expect(user.password).toBeDefined();
    });

    it('nên so sánh mật khẩu chính xác', async () => {
      // Kiểm tra phương thức so sánh mật khẩu
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '0123456789',
        role: 'user'
      });

      await user.save();
      const isMatch = await user.comparePassword('password123');
      const isNotMatch = await user.comparePassword('wrongpassword');

      expect(isMatch).toBe(true);
      expect(isNotMatch).toBe(false);
    });
  });

  describe('SnackPoints', () => {
    it('nên khởi tạo với 0 SnackPoints', async () => {
      // Kiểm tra SnackPoints ban đầu là 0
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '0123456789',
        role: 'user'
      });

      await user.save();
      expect(user.snackPoints).toBe(0);
    });

    it('nên cập nhật SnackPoints đúng cách', async () => {
      // Kiểm tra cập nhật SnackPoints
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '0123456789',
        role: 'user'
      });

      await user.save();
      user.snackPoints = 100;
      await user.save();
      expect(user.snackPoints).toBe(100);
    });

    it('nên xử lý lịch sử điểm đúng cách', async () => {
      // Kiểm tra thêm lịch sử điểm
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '0123456789',
        role: 'user'
      });

      await user.save();

      const pointsHistory = {
        amount: 100,
        type: 'load',
        paymentMethod: 'momo',
        note: 'Test points'
      };

      user.pointsHistory.push(pointsHistory);
      await user.save();

      expect(user.pointsHistory).toHaveLength(1);
      expect(user.pointsHistory[0].amount).toBe(100);
      expect(user.pointsHistory[0].type).toBe('load');
    });
  });

  describe('Trạng thái User', () => {
    it('nên đặt trạng thái mặc định là active', async () => {
      // Kiểm tra trạng thái mặc định là active
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '0123456789',
        role: 'user'
      });

      await user.save();
      expect(user.status).toBe('active');
    });

    it('nên cập nhật trạng thái đúng cách', async () => {
      // Kiểm tra cập nhật trạng thái
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '0123456789',
        role: 'user'
      });

      await user.save();
      user.status = 'blocked';
      await user.save();
      expect(user.status).toBe('blocked');
    });
  });
}); 