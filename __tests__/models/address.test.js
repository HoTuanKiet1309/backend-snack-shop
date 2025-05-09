const mongoose = require('mongoose');
const { describe, it, expect, beforeEach } = require('@jest/globals');
const Address = require('../../models/Address');

describe('Kiểm thử Model Address', () => {
  describe('Kiểm tra tính hợp lệ', () => {
    it('nên xác thực địa chỉ hợp lệ', async () => {
      // Tạo một địa chỉ với đầy đủ thông tin hợp lệ
      const validAddress = new Address({
        userId: new mongoose.Types.ObjectId(),
        fullName: 'Nguyễn Văn A',
        phone: '0987654321',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        specificAddress: '123 Đường Lê Lợi',
        isDefault: true
      });

      const err = validAddress.validateSync();
      expect(err).toBeUndefined();
    });

    it('nên thất bại khi thiếu các trường bắt buộc', async () => {
      // Tạo địa chỉ thiếu các trường bắt buộc
      const addressWithoutRequired = new Address({});

      const err = addressWithoutRequired.validateSync();
      
      expect(err).toBeDefined();
      expect(err.errors.userId).toBeDefined();
      expect(err.errors.fullName).toBeDefined();
      expect(err.errors.phone).toBeDefined();
      expect(err.errors.district).toBeDefined();
      expect(err.errors.ward).toBeDefined();
      expect(err.errors.specificAddress).toBeDefined();
    });
  });

  describe('Địa chỉ mặc định', () => {
    it('nên đặt địa chỉ mặc định là false theo mặc định', async () => {
      // Kiểm tra địa chỉ mặc định là false
      const address = new Address({
        userId: new mongoose.Types.ObjectId(),
        fullName: 'Nguyễn Văn A',
        phone: '0987654321',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        specificAddress: '123 Đường Lê Lợi'
      });

      expect(address.isDefault).toBe(false);
    });

    it('nên cập nhật trạng thái địa chỉ mặc định đúng cách', async () => {
      // Kiểm tra cập nhật trạng thái địa chỉ mặc định
      const address = new Address({
        userId: new mongoose.Types.ObjectId(),
        fullName: 'Nguyễn Văn A',
        phone: '0987654321',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        specificAddress: '123 Đường Lê Lợi',
        isDefault: false
      });

      address.isDefault = true;
      const err = address.validateSync();
      expect(err).toBeUndefined();
      expect(address.isDefault).toBe(true);
    });
  });

  describe('Thông tin người nhận', () => {
    it('nên lưu đúng thông tin người nhận', async () => {
      // Kiểm tra lưu thông tin người nhận
      const fullName = 'Nguyễn Văn A';
      const phone = '0987654321';
      
      const address = new Address({
        userId: new mongoose.Types.ObjectId(),
        fullName: fullName,
        phone: phone,
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        specificAddress: '123 Đường Lê Lợi'
      });

      expect(address.fullName).toBe(fullName);
      expect(address.phone).toBe(phone);
    });
  });

  describe('Thông tin địa chỉ', () => {
    it('nên lưu đúng thông tin địa chỉ', async () => {
      // Kiểm tra lưu thông tin địa chỉ
      const district = 'Quận 1';
      const ward = 'Phường Bến Nghé';
      const specificAddress = '123 Đường Lê Lợi';
      
      const address = new Address({
        userId: new mongoose.Types.ObjectId(),
        fullName: 'Nguyễn Văn A',
        phone: '0987654321',
        district: district,
        ward: ward,
        specificAddress: specificAddress
      });

      expect(address.district).toBe(district);
      expect(address.ward).toBe(ward);
      expect(address.specificAddress).toBe(specificAddress);
    });
  });
}); 