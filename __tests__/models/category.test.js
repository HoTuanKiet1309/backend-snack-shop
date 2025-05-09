const mongoose = require('mongoose');
const { describe, it, expect, beforeEach } = require('@jest/globals');
const Category = require('../../models/Category');

describe('Kiểm thử Model Category', () => {
  describe('Kiểm tra tính hợp lệ', () => {
    it('nên xác thực danh mục hợp lệ', async () => {
      // Tạo một danh mục với đầy đủ thông tin hợp lệ
      const validCategory = new Category({
        categoryId: 'banh',
        categoryName: 'Bánh'
      });

      const err = validCategory.validateSync();
      expect(err).toBeUndefined();
    });

    it('nên thất bại khi thiếu các trường bắt buộc', async () => {
      // Tạo danh mục thiếu các trường bắt buộc
      const categoryWithoutRequired = new Category({});

      const err = categoryWithoutRequired.validateSync();
      
      expect(err).toBeDefined();
      expect(err.errors.categoryId).toBeDefined();
      expect(err.errors.categoryName).toBeDefined();
    });

    it('nên thất bại khi categoryId không hợp lệ', async () => {
      // Tạo danh mục với categoryId không hợp lệ
      const categoryWithInvalidId = new Category({
        categoryId: 'invalid_category', // Loại không hợp lệ
        categoryName: 'Danh mục không hợp lệ'
      });

      const err = categoryWithInvalidId.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.categoryId).toBeDefined();
    });
  });

  describe('Danh mục hợp lệ', () => {
    it('nên chấp nhận các danh mục hợp lệ', async () => {
      // Kiểm tra các danh mục hợp lệ
      const validCategories = [
        { id: 'banh', name: 'Bánh' },
        { id: 'keo', name: 'Kẹo' },
        { id: 'mut', name: 'Mứt' },
        { id: 'do_kho', name: 'Đồ khô' },
        { id: 'hat', name: 'Hạt' }
      ];
      
      for (const cat of validCategories) {
        const category = new Category({
          categoryId: cat.id,
          categoryName: cat.name
        });
        
        const err = category.validateSync();
        expect(err).toBeUndefined();
      }
    });
  });

  describe('Tính duy nhất', () => {
    it('nên yêu cầu categoryId và categoryName là duy nhất', async () => {
      // Kiểm tra tính duy nhất được định nghĩa trong schema
      const schema = Category.schema;
      
      // Kiểm tra index của categoryId
      expect(schema.path('categoryId').options.unique).toBe(true);
      
      // Kiểm tra index của categoryName
      expect(schema.path('categoryName').options.unique).toBe(true);
    });
  });
}); 