const mongoose = require('mongoose');
const { describe, it, expect, beforeEach } = require('@jest/globals');
const Snack = require('../../models/Snack');

describe('Kiểm thử Model Snack', () => {
  describe('Kiểm tra tính hợp lệ', () => {
    it('nên xác thực snack hợp lệ', async () => {
      // Tạo một snack với đầy đủ thông tin hợp lệ
      const validSnack = new Snack({
        snackName: 'Bánh Chocopie',
        description: 'Bánh Chocopie thơm ngon',
        price: 20000,
        stock: 100,
        categoryId: 'banh',
        images: ['image1.jpg', 'image2.jpg']
      });

      const err = validSnack.validateSync();
      expect(err).toBeUndefined();
    });

    it('nên thất bại khi thiếu các trường bắt buộc', async () => {
      // Tạo snack thiếu các trường bắt buộc
      const snackWithoutRequired = new Snack({});

      const err = snackWithoutRequired.validateSync();
      
      expect(err).toBeDefined();
      expect(err.errors.snackName).toBeDefined();
      expect(err.errors.description).toBeDefined();
      expect(err.errors.price).toBeDefined();
      expect(err.errors.stock).toBeDefined();
      expect(err.errors.categoryId).toBeDefined();
    });

    it('nên thất bại khi categoryId không hợp lệ', async () => {
      // Tạo snack với categoryId không hợp lệ
      const snackWithInvalidCategory = new Snack({
        snackName: 'Bánh Chocopie',
        description: 'Bánh Chocopie thơm ngon',
        price: 20000,
        stock: 100,
        categoryId: 'invalid_category', // Loại không hợp lệ
        images: ['image1.jpg', 'image2.jpg']
      });

      const err = snackWithInvalidCategory.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.categoryId).toBeDefined();
    });

    it('nên thất bại khi stock âm', async () => {
      // Tạo snack với stock âm
      const snackWithNegativeStock = new Snack({
        snackName: 'Bánh Chocopie',
        description: 'Bánh Chocopie thơm ngon',
        price: 20000,
        stock: -10, // Giá trị âm không hợp lệ
        categoryId: 'banh',
        images: ['image1.jpg', 'image2.jpg']
      });

      const err = snackWithNegativeStock.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.stock).toBeDefined();
    });
  });

  describe('Giá trị mặc định', () => {
    it('nên đặt giảm giá mặc định là 0', async () => {
      // Kiểm tra giảm giá mặc định
      const snack = new Snack({
        snackName: 'Bánh Chocopie',
        description: 'Bánh Chocopie thơm ngon',
        price: 20000,
        stock: 100,
        categoryId: 'banh'
      });

      expect(snack.discount).toBe(0);
    });
  });

  describe('Tính toán giá thực', () => {
    it('nên tính giá thực chính xác trước khi lưu', async () => {
      // Kiểm tra tính giá thực khi không có giảm giá
      const snack = new Snack({
        snackName: 'Bánh Chocopie',
        description: 'Bánh Chocopie thơm ngon',
        price: 20000,
        stock: 100,
        categoryId: 'banh'
      });

      await snack.save();
      expect(snack.realPrice).toBe(20000);
    });

    it('nên tính giá thực chính xác khi có giảm giá', async () => {
      // Kiểm tra tính giá thực khi có giảm giá
      const snack = new Snack({
        snackName: 'Bánh Chocopie',
        description: 'Bánh Chocopie thơm ngon',
        price: 20000,
        discount: 10, // Giảm giá 10%
        stock: 100,
        categoryId: 'banh'
      });

      await snack.save();
      expect(snack.realPrice).toBe(18000); // 20000 * (1 - 10/100) = 18000
    });
  });

  describe('Danh mục sản phẩm', () => {
    it('nên chấp nhận các danh mục hợp lệ', async () => {
      // Kiểm tra các danh mục hợp lệ
      const validCategories = ['banh', 'keo', 'do_kho', 'mut', 'hat'];
      
      for (const category of validCategories) {
        const snack = new Snack({
          snackName: 'Test Snack',
          description: 'Test Description',
          price: 10000,
          stock: 50,
          categoryId: category
        });
        
        const err = snack.validateSync();
        expect(err).toBeUndefined();
      }
    });
  });

  describe('Hình ảnh sản phẩm', () => {
    it('nên lưu được nhiều hình ảnh', async () => {
      // Kiểm tra lưu nhiều hình ảnh
      const images = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
      const snack = new Snack({
        snackName: 'Bánh Chocopie',
        description: 'Bánh Chocopie thơm ngon',
        price: 20000,
        stock: 100,
        categoryId: 'banh',
        images: images
      });

      const err = snack.validateSync();
      expect(err).toBeUndefined();
      expect(snack.images).toEqual(images);
      expect(snack.images.length).toBe(3);
    });
  });
}); 