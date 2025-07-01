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
   
   The API will be available at `http://localhost:8000`

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

### Using the Development Script

For convenience, you can use the provided development script to run both the backend and frontend simultaneously:

```bash
./run_dev.sh
```

This script:
- Starts the Flask backend on port 8000
- Starts the Vite frontend on port 5173
- Handles CORS configuration automatically
- Provides real-time logs from both services

## 🐳 Docker Deployment (Recommended)

The application is containerized with Docker for easy deployment to any container platform.

### Local Development with Docker

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```
   
   This will:
   - Build the application container
   - Start a PostgreSQL database
   - Run the full stack on `http://localhost:8000`

2. **Stop the application**
   ```bash
   docker-compose down
   ```

### Production Deployment Options

#### Option 1: Render (Docker) - Recommended

1. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Set environment to `Docker`
   - Render will automatically detect the Dockerfile

2. **Create a PostgreSQL database**
   - Add a new PostgreSQL database on Render
   - Copy the database URL

3. **Set environment variables**
   ```env
   FLASK_ENV=production
   SECRET_KEY=[auto-generated]
   JWT_SECRET_KEY=[auto-generated]
   DATABASE_URL=[from PostgreSQL database]
   PORT=8000
   ```

4. **Deploy**
   - Push changes to your main branch
   - Render will automatically build and deploy the Docker container

#### Option 2: Railway

1. **Deploy to Railway**
   ```bash
   railway login
   railway deploy
   ```

2. **Add PostgreSQL database**
   ```bash
   railway add postgresql
   ```

3. **Set environment variables via Railway dashboard**

#### Option 3: Fly.io

1. **Install Fly CLI and login**
   ```bash
   fly auth login
   ```

2. **Initialize and deploy**
   ```bash
   fly launch
   fly deploy
   ```

#### Option 4: Any Container Platform

The Docker image can be deployed to:
- Google Cloud Run
- AWS ECS/Fargate  
- Digital Ocean App Platform
- Azure Container Instances
- Heroku (Docker deployment)

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
- **GET** `/api/v1/projects/{id}/export` - Export project data (JSON/CSV)

### Data Sources
- **GET** `/api/v1/projects/{id}/data-sources` - List project data sources
- **POST** `/api/v1/projects/{id}/data-sources` - Add data source to project
- **GET** `/api/v1/projects/{id}/data-sources/{source_id}` - Get data source details
- **PUT** `/api/v1/projects/{id}/data-sources/{source_id}` - Update data source
- **DELETE** `/api/v1/projects/{id}/data-sources/{source_id}` - Delete data source

### Credentials
- **GET** `/api/v1/projects/{id}/credentials` - List project credentials
- **POST** `/api/v1/projects/{id}/credentials` - Add credentials to project
- **GET** `/api/v1/projects/{id}/credentials/{cred_id}` - Get credential details
- **PUT** `/api/v1/projects/{id}/credentials/{cred_id}` - Update credentials
- **DELETE** `/api/v1/projects/{id}/credentials/{cred_id}` - Delete credentials

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
PORT=8000

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
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_ENVIRONMENT=development
```

## 📝 Default Credentials

- **Email**: `admin@example.com`
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

## 💡 Pro Tips

- **Use run_dev.sh**: The development script handles both frontend and backend
- **Port Configuration**: Backend runs on 8000 to avoid macOS AirPlay conflicts
- **Environment Variables**: Never commit sensitive keys to GitHub  
- **Database Backup**: Enable automated backups on your cloud provider
- **Custom Domains**: All major container platforms support custom domains
- **Local Testing**: Always test with `docker-compose up` before deploying

## 🆘 Troubleshooting

- **Docker Build Issues**: Check Dockerfile syntax and build logs
- **Database Connection**: Verify `DATABASE_URL` format (should start with `postgresql://`)
- **Container Not Starting**: Check environment variables and port configuration
- **Health Check Failing**: Verify `/api/v1/health` endpoint responds correctly
- **CORS Issues**: Ensure FRONTEND_URL is properly set in backend environment
- **Import Errors**: Check paths in React components (use @/ prefix for src/ imports)

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