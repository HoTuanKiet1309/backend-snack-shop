# SnackHub Backend

Backend API cho hệ thống bán hàng SnackHub, được xây dựng với Node.js và Express.

## Công nghệ sử dụng

- Node.js
- Express.js
- MongoDB với Mongoose
- JWT cho authentication
- Redis cho caching
- Stripe cho thanh toán
- SendGrid và Nodemailer cho email
- Jest và Supertest cho testing
- Swagger cho API documentation
- Docker cho containerization

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Chạy production server
npm start

# Chạy tests
npm test
```

## Cấu trúc thư mục

```
├── config/         # Cấu hình ứng dụng
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Mongoose models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
├── __tests__/      # Test files
└── server.js       # Entry point
```

## API Endpoints

API documentation có sẵn tại `/api-docs` khi server đang chạy.

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

### Products
- GET /api/products
- GET /api/products/:id
- POST /api/products
- PUT /api/products/:id
- DELETE /api/products/:id

### Orders
- GET /api/orders
- GET /api/orders/:id
- POST /api/orders
- PUT /api/orders/:id

### Users
- GET /api/users
- GET /api/users/:id
- PUT /api/users/:id
- DELETE /api/users/:id

## Testing

```bash
# Chạy tất cả tests
npm test

# Chạy tests với coverage
npm run test:coverage

# Chạy unit tests
npm run test:unit

# Chạy API tests
npm run test:api

# Chạy auth tests
npm run test:auth
```

## Docker

```bash
# Build và chạy với Docker Compose
docker-compose up --build

# Chạy trong background
docker-compose up -d
```

## Môi trường phát triển

Tạo file `.env` với các biến môi trường sau:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/snackhub
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
SENDGRID_API_KEY=your_sendgrid_api_key
REDIS_URL=redis://localhost:6379
```

## Contributing

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## License

Dự án này được phát triển cho mục đích học tập và nghiên cứu. 
