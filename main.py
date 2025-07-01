import os
import sys
from datetime import datetime, timezone, timedelta
import secrets

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

# Import shared SQLAlchemy instance and models
from user import db, User
from project import Project
from credential import Credential
from data_source import DataSource
from extracted_data import ExtractedData
from webhook import WebhookConfig

def create_app():
    """Application factory pattern"""
    app = Flask(__name__, static_folder='dist')
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_hex(32))
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', secrets.token_hex(32))
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    
    # Database configuration
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        # Default to SQLite for development
        database_url = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'app.db')}"
    
    # Handle Render.com database URL format
    if database_url and database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    jwt = JWTManager(app)
    
    # Configure CORS - simplified for local development and single-container deployment
    CORS(
        app,
        resources={r"/api/*": {"origins": ["http://localhost:3000", "http://localhost:5173"]}},
        supports_credentials=True,
        expose_headers=["Authorization"],
    )
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Invalid token'}), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Authorization token is required'}), 401
    
    # Import and register route blueprints
    try:
        from auth import auth_bp
        app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    except ImportError:
        pass
    
    # Project routes
    try:
        from project_routes import project_bp
        app.register_blueprint(project_bp)
    except ImportError as e:
        print(f"Project routes import error: {e}")
    
    # Health check endpoint
    @app.route('/api/v1/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'version': '1.0.0',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'environment': os.getenv('FLASK_ENV', 'production')
        })
    
    # API info endpoint
    @app.route('/api/v1/info')
    def api_info():
        return jsonify({
            'name': 'Marketing Analytics Data Integration Platform',
            'version': '1.0.0',
            'description': 'REST API for marketing data integration and analytics',
            'endpoints': {
                'health': '/api/v1/health',
                'auth': '/api/v1/auth',
                'users': '/api/v1/users',
                'projects': '/api/v1/projects',
                'credentials': '/api/v1/credentials',
                'data_sources': '/api/v1/data_sources',
                'webhooks': '/webhook/v1'
            }
        })
    
    # Create database tables
    with app.app_context():
        try:
            db.create_all()
            
            # Create default admin user if it doesn't exist
            admin_user = User.query.filter_by(email='admin@marketingplatform.com').first()
            if not admin_user:
                admin_user = User(
                    email='admin@marketingplatform.com',
                    password='admin123',
                    first_name='Admin',
                    last_name='User',
                    role='admin',
                    is_verified=True
                )
                db.session.add(admin_user)
                db.session.commit()
                print("Created default admin user: admin@marketingplatform.com / admin123")
        except Exception as e:
            print(f"Database initialization error: {e}")
    
    # Frontend serving routes (for development/single deployment)
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        if app.static_folder and os.path.exists(app.static_folder):
            if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
                return send_from_directory(app.static_folder, path)
            else:
                index_path = os.path.join(app.static_folder, 'index.html')
                if os.path.exists(index_path):
                    return send_from_directory(app.static_folder, 'index.html')
        
        # API-only response when no frontend is available
        return jsonify({
            'message': 'Marketing Analytics Platform API',
            'version': '1.0.0',
            'status': 'running',
            'docs': '/api/v1/info'
        }), 200
    
    return app

# Create the app instance
app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug_mode = os.getenv('FLASK_ENV') == 'development'
    
    app.run(
        host='0.0.0.0', 
        port=port, 
        debug=debug_mode
    )

