const reviewController = require('../../controllers/reviewController');
const Review = require('../../models/Review');
const Snack = require('../../models/Snack');
const mongoose = require('mongoose');
const { describe, it, expect, beforeEach } = require('@jest/globals');

// Mock các module
jest.mock('../../models/Review');
jest.mock('../../models/Snack');

describe('Kiểm thử ReviewController', () => {
  let mockReq;
  let mockRes;
  const userId = new mongoose.Types.ObjectId();
  const snackId = new mongoose.Types.ObjectId();
  const reviewId = new mongoose.Types.ObjectId();

  const mockReview = {
    _id: reviewId,
    userId: userId,
    snackId: snackId,
    rating: 4,
    comment: 'Sản phẩm rất ngon',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(true)
  };

  const mockSnack = {
    _id: snackId,
    snackName: 'Bánh quy',
    averageRating: 4,
    save: jest.fn().mockResolvedValue(true)
  };

  const mockPopulatedReview = {
    ...mockReview,
    userId: {
      _id: userId,
      firstName: 'Test',
      lastName: 'User'
    },
    snackId: {
      _id: snackId,
      snackName: 'Bánh quy'
    }
  };

  // Mảng đánh giá cho mocks
  const mockReviews = [
    {
      _id: reviewId,
      userId: userId,
      snackId: snackId,
      rating: 4,
      comment: 'Sản phẩm rất ngon'
    }
  ];

  beforeEach(() => {
    // Khởi tạo các mock object trước mỗi test case
    mockReq = {
      params: {
        id: reviewId.toString(),
        snackId: snackId.toString()
      },
      body: {
        rating: 4,
        comment: 'Sản phẩm rất ngon'
      },
      user: {
        userId: userId.toString()
      }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Reset tất cả các mock trước mỗi test
    jest.clearAllMocks();

    // Mock cho console.log và console.error để không hiển thị logs trong tests
    console.log = jest.fn();
    console.error = jest.fn();

    // Mock các phương thức mongoose
    Review.findById = jest.fn().mockResolvedValue(mockReview);
    Review.findOne = jest.fn().mockResolvedValue(null);
    
    // Quan trọng: mock Reviews.find để trả về một array thật với reduce function
    Review.find = jest.fn().mockResolvedValue(mockReviews);
    
    // Mock constructor
    Review.mockImplementation(() => ({
      ...mockReview,
      save: jest.fn().mockResolvedValue(mockReview)
    }));
    
    // Mock findOneAndDelete
    Review.findOneAndDelete = jest.fn().mockResolvedValue(mockReview);

    // Mock populate chain
    const mockPopulate = jest.fn().mockReturnThis();
    const mockSort = jest.fn().mockResolvedValue([mockPopulatedReview]);
    Review.find.mockReturnValue({
      populate: mockPopulate,
      sort: mockSort
    });

    // Setup Snack model
    Snack.findById = jest.fn().mockResolvedValue(mockSnack);
  });

  describe('Tạo đánh giá', () => {
    it('nên tạo đánh giá mới thành công', async () => {
      // Correct population chain
      Review.findById.mockImplementation(() => ({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockPopulatedReview)
        })
      }));
      
      // Mock để Reviews.find trả về array thực sự có thể gọi reduce
      Review.find.mockImplementationOnce(() => Promise.resolve(mockReviews));
      
      await reviewController.createReview(mockReq, mockRes);
      
      expect(Review.findOne).toHaveBeenCalledWith({
        userId: expect.any(mongoose.Types.ObjectId),
        snackId: expect.any(mongoose.Types.ObjectId)
      });
      expect(Snack.findById).toHaveBeenCalledWith(snackId.toString());
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        userId: expect.objectContaining({
          firstName: 'Test',
          lastName: 'User'
        }),
        rating: 4
      }));
    });

    it('nên trả về lỗi 400 khi người dùng đã đánh giá sản phẩm', async () => {
      Review.findOne.mockResolvedValue(mockReview);
      
      await reviewController.createReview(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'You have already reviewed this snack'
      }));
    });

    it('nên trả về lỗi 404 khi không tìm thấy sản phẩm', async () => {
      Snack.findById.mockResolvedValue(null);
      
      await reviewController.createReview(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Snack not found'
      });
    });

    it('nên trả về lỗi 401 khi không có thông tin người dùng', async () => {
      mockReq.user = null;
      
      await reviewController.createReview(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Unauthorized - Login required'
      });
    });

    it('nên trả về lỗi 400 khi ID sản phẩm không hợp lệ', async () => {
      mockReq.params.snackId = 'invalid-id';
      
      await reviewController.createReview(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid or missing snack ID'
      });
    });
  });

  describe('Cập nhật đánh giá', () => {
    it('nên cập nhật đánh giá thành công', async () => {
      Review.findOne.mockResolvedValue(mockReview);
      
      mockReq.body = {
        rating: 5,
        comment: 'Sản phẩm tuyệt vời'
      };
      
      const updatedReview = {
        ...mockReview,
        rating: 5,
        comment: 'Sản phẩm tuyệt vời'
      };
      
      mockReview.save.mockResolvedValue(updatedReview);
      
      // Mock Reviews.find để trả về array thực sự có thể gọi reduce
      Review.find.mockImplementationOnce(() => Promise.resolve(mockReviews));
      
      Review.findById.mockImplementation(() => ({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            ...mockPopulatedReview,
            rating: 5,
            comment: 'Sản phẩm tuyệt vời'
          })
        })
      }));
      
      await reviewController.updateReview(mockReq, mockRes);
      
      expect(Review.findOne).toHaveBeenCalledWith({
        _id: expect.any(mongoose.Types.ObjectId),
        userId: expect.any(mongoose.Types.ObjectId)
      });
      expect(mockReview.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        rating: 5,
        comment: 'Sản phẩm tuyệt vời'
      }));
    });

    it('nên trả về lỗi 404 khi không tìm thấy đánh giá', async () => {
      Review.findOne.mockResolvedValue(null);
      
      await reviewController.updateReview(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Review not found'
      });
    });

    it('nên trả về lỗi 400 khi ID đánh giá không hợp lệ', async () => {
      mockReq.params.id = 'invalid-id';
      
      await reviewController.updateReview(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid review ID format'
      });
    });
  });

  describe('Xóa đánh giá', () => {
    it('nên xóa đánh giá thành công', async () => {
      // Mock Reviews.find để trả về array thực sự có thể gọi reduce
      Review.find.mockImplementationOnce(() => Promise.resolve(mockReviews));
      
      await reviewController.deleteReview(mockReq, mockRes);
      
      expect(Review.findOneAndDelete).toHaveBeenCalledWith({
        _id: expect.any(mongoose.Types.ObjectId),
        userId: expect.any(mongoose.Types.ObjectId)
      });
      expect(Snack.findById).toHaveBeenCalledWith(snackId);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Review deleted successfully'
      });
    });

    it('nên trả về lỗi 404 khi không tìm thấy đánh giá', async () => {
      Review.findOneAndDelete.mockResolvedValue(null);
      
      await reviewController.deleteReview(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Review not found'
      });
    });

    it('nên trả về lỗi 400 khi ID đánh giá không hợp lệ', async () => {
      mockReq.params.id = 'invalid-id';
      
      await reviewController.deleteReview(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid review ID format'
      });
    });
  });

  describe('Lấy đánh giá theo sản phẩm', () => {
    it('nên trả về danh sách đánh giá theo sản phẩm', async () => {
      await reviewController.getSnackReviews(mockReq, mockRes);
      
      expect(Review.find).toHaveBeenCalledWith({ 
        snackId: expect.any(mongoose.Types.ObjectId) 
      });
      expect(mockRes.json).toHaveBeenCalledWith([mockPopulatedReview]);
    });

    it('nên trả về lỗi 400 khi ID sản phẩm không hợp lệ', async () => {
      mockReq.params.snackId = 'invalid-id';
      
      await reviewController.getSnackReviews(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid snack ID format'
      });
    });
  });

  describe('Lấy đánh giá của người dùng', () => {
    it('nên trả về danh sách đánh giá của người dùng', async () => {
      const populatedReview = {
        ...mockReview,
        snackId: {
          _id: snackId,
          snackName: 'Bánh quy',
          images: ['image.jpg']
        }
      };
      
      const mockSortFunction = jest.fn().mockResolvedValue([populatedReview]);
      Review.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: mockSortFunction
      });
      
      await reviewController.getUserReviews(mockReq, mockRes);
      
      expect(Review.find).toHaveBeenCalledWith({ userId: userId.toString() });
      expect(mockRes.json).toHaveBeenCalledWith([populatedReview]);
    });
  });

  describe('Lấy đánh giá theo ID', () => {
    it('nên trả về đánh giá theo ID', async () => {
      Review.findById.mockImplementation(() => ({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockPopulatedReview)
        })
      }));
      
      await reviewController.getReviewById(mockReq, mockRes);
      
      expect(Review.findById).toHaveBeenCalledWith(reviewId.toString());
      expect(mockRes.json).toHaveBeenCalledWith(mockPopulatedReview);
    });

    it('nên trả về lỗi 404 khi không tìm thấy đánh giá', async () => {
      Review.findById.mockImplementation(() => ({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      }));
      
      await reviewController.getReviewById(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Review not found'
      });
    });
  });
}); 