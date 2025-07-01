# Marketing Analytics Data Integration Platform

A full-stack platform for aggregating and analyzing marketing data from multiple sources including Google Ads, Facebook Ads, Google Analytics 4, Instagram Insights, Shopify, Amazon Advertising, and more.

## 🚀 Features

- **Multi-Platform Integration**: Connect and sync data from 8+ marketing platforms
- **Project Management**: Organize campaigns and data sources by project
- **Real-time Webhooks**: Automated data synchronization
- **Credential Management**: Secure API key and OAuth token storage
- **Data Visualization**: Interactive dashboards and charts
- **User Management**: Role-based access control
- **REST API**: Complete API for third-party integrations

## 🛠 Technology Stack

### Backend
- **Flask 3.0** - Python web framework
- **SQLAlchemy** - Database ORM with PostgreSQL support
- **Flask-JWT-Extended** - JWT authentication
- **Flask-CORS** - Cross-origin resource sharing
- **Gunicorn** - WSGI HTTP Server

### Frontend
- **React 19** - Modern UI framework
- **Vite 6** - Fast build tool and dev server
- **Tailwind CSS 4** - Utility-first styling
- **React Router 7** - Client-side routing
- **Radix UI** - Accessible component primitives

### Infrastructure
- **Render** - Backend hosting with PostgreSQL
- **Vercel** - Frontend hosting and deployment
- **GitHub** - Version control and CI/CD

## 📋 Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL (for production)
- Git

## 🔧 Local Development Setup

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/AgilistTim/marketing_import.git
   cd marketing_import
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   FLASK_ENV=development
   SECRET_KEY=your-secret-key
   JWT_SECRET_KEY=your-jwt-secret-key
   DATABASE_URL=sqlite:///app.db
   FRONTEND_URL=http://localhost:5173
   ```

4. **Run the Flask application**
   ```bash
   python main.py
   ```
   
   The API will be available at `http://localhost:5000`

### Frontend Setup

1. **Install Node.js dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The frontend will be available at `http://localhost:5173`

## 🚀 Production Deployment

### Backend Deployment (Render)

1. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Set environment to `Python`
   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn --bind 0.0.0.0:$PORT main:app`

2. **Create a PostgreSQL database**
   - Add a new PostgreSQL database on Render
   - Copy the database URL

3. **Set environment variables**
   ```env
   FLASK_ENV=production
   SECRET_KEY=[auto-generated]
   JWT_SECRET_KEY=[auto-generated]
   DATABASE_URL=[from PostgreSQL database]
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

4. **Deploy**
   - Push changes to your main branch
   - Render will automatically deploy

### Frontend Deployment (Vercel)

1. **Install Vercel CLI** (optional)
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Set build command: `npm run build`
   - Set output directory: `dist`

3. **Set environment variables**
   ```env
   VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
   ```

4. **Update backend CORS settings**
   Update the `FRONTEND_URL` environment variable in your Render backend to match your Vercel URL.

## 🔐 API Documentation

### Authentication
- **POST** `/api/v1/auth/login` - User login
- **POST** `/api/v1/auth/register` - User registration
- **POST** `/api/v1/auth/refresh` - Refresh access token

### Projects
- **GET** `/api/v1/projects` - List all projects
- **POST** `/api/v1/projects` - Create new project
- **GET** `/api/v1/projects/{id}` - Get project details
- **PUT** `/api/v1/projects/{id}` - Update project
- **DELETE** `/api/v1/projects/{id}` - Delete project

### Health Check
- **GET** `/api/v1/health` - API health status
- **GET** `/api/v1/info` - API information and endpoints

## 🔑 Environment Variables

### Backend (.env)
```env
# Flask Configuration
FLASK_ENV=development|production
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
PORT=5000

# Database
DATABASE_URL=postgresql://user:pass@host:port/dbname

# CORS
FRONTEND_URL=https://your-frontend-url.com

# API Keys (optional)
GOOGLE_ADS_DEVELOPER_TOKEN=your-token
FACEBOOK_APP_ID=your-app-id
```

### Frontend (.env.local)
```env
VITE_API_BASE_URL=https://your-backend-api.com/api/v1
VITE_ENVIRONMENT=production
```

## 📝 Default Credentials

- **Email**: `admin@marketingplatform.com`
- **Password**: `admin123`

⚠️ **Important**: Change these credentials after first login in production!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please open an issue on GitHub or contact [your-email@example.com](mailto:your-email@example.com).

## 🗺 Roadmap

- [ ] Additional marketing platform integrations
- [ ] Advanced data visualization and reporting
- [ ] Automated data pipeline scheduling
- [ ] Machine learning insights and predictions
- [ ] Mobile application
- [ ] API rate limiting and caching
- [ ] Multi-tenant support 