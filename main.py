import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from datetime import timedelta
import secrets

# Import all models to register them with SQLAlchemy
from src.models.user import db, User
from src.models.project import Project
from src.models.credential import Credential
from src.models.data_source import DataSource, ExtractionJob
from src.models.extracted_data import ExtractedData
from src.models.webhook import WebhookConfig, APIAccessLog

# Import route blueprints
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.project import project_bp
from src.routes.credential import credential_bp
from src.routes.data_source import data_source_bp
from src.routes.webhook import webhook_bp

def create_app():
    """Application factory pattern"""
    app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_hex(32))
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', secrets.token_hex(32))
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    
    # Database configuration
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        # Default to SQLite for development
        database_url = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
    
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
    
    # Configure CORS
    CORS(app, origins="*", supports_credentials=True)
    
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
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    app.register_blueprint(user_bp, url_prefix='/api/v1/users')
    app.register_blueprint(project_bp, url_prefix='/api/v1/projects')
    app.register_blueprint(credential_bp, url_prefix='/api/v1/projects')
    app.register_blueprint(data_source_bp, url_prefix='/api/v1/projects')
    app.register_blueprint(webhook_bp, url_prefix='/webhook/v1')
    
    # Health check endpoint
    @app.route('/api/v1/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'version': '1.0.0',
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
    
    # Create database tables
    with app.app_context():
        db.create_all()
        
        # Create default admin user if it doesn't exist
        admin_user = User.query.filter_by(email='admin@example.com').first()
        if not admin_user:
            admin_user = User(
                email='admin@example.com',
                password='admin123',
                first_name='Admin',
                last_name='User',
                role='admin',
                is_verified=True
            )
            db.session.add(admin_user)
            db.session.commit()
            print("Created default admin user: admin@example.com / admin123")
    
    # Frontend serving routes
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        static_folder_path = app.static_folder
        if static_folder_path is None:
            return "Static folder not configured", 404

        if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
            return send_from_directory(static_folder_path, path)
        else:
            index_path = os.path.join(static_folder_path, 'index.html')
            if os.path.exists(index_path):
                return send_from_directory(static_folder_path, 'index.html')
            else:
                return jsonify({'message': 'Marketing Analytics Platform API', 'version': '1.0.0'}), 200
    
    return app

# Create the app instance
app = create_app()

if __name__ == '__main__':
    from datetime import datetime, timezone
    app.run(host='0.0.0.0', port=5000, debug=True)

