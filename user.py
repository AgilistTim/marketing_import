from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
import uuid
import bcrypt
from sqlalchemy.dialects.postgresql import UUID
import json

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    role = db.Column(db.String(50), default='user')
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login_at = db.Column(db.DateTime(timezone=True))
    timezone = db.Column(db.String(50), default='UTC')
    preferences = db.Column(db.Text, default='{}')  # JSON string for SQLite compatibility
    
    # Relationships
    projects = db.relationship('Project', backref='owner', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, email, password, first_name, last_name, **kwargs):
        self.email = email
        self.set_password(password)
        self.first_name = first_name
        self.last_name = last_name
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def set_password(self, password):
        """Hash and set the user's password"""
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def check_password(self, password):
        """Check if the provided password matches the user's password"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def get_preferences(self):
        """Get user preferences as a dictionary"""
        try:
            return json.loads(self.preferences) if self.preferences else {}
        except json.JSONDecodeError:
            return {}
    
    def set_preferences(self, preferences_dict):
        """Set user preferences from a dictionary"""
        self.preferences = json.dumps(preferences_dict)
    
    def update_last_login(self):
        """Update the last login timestamp"""
        self.last_login_at = datetime.now(timezone.utc)
        db.session.commit()
    
    def to_dict(self, include_sensitive=False):
        """Convert user to dictionary representation"""
        data = {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None,
            'timezone': self.timezone,
            'preferences': self.get_preferences()
        }
        
        if include_sensitive:
            data['password_hash'] = self.password_hash
            
        return data
    
    def __repr__(self):
        return f'<User {self.email}>'

