from user import db
from datetime import datetime, timezone
import uuid
import json
from cryptography.fernet import Fernet
import base64
import os

class Credential(db.Model):
    __tablename__ = 'credentials'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    platform = db.Column(db.String(50), nullable=False)
    credential_type = db.Column(db.String(50), nullable=False)  # oauth2, api_key, service_account
    encrypted_credentials = db.Column(db.LargeBinary, nullable=False)
    encryption_key_id = db.Column(db.String(100), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    expires_at = db.Column(db.DateTime(timezone=True))
    last_validated_at = db.Column(db.DateTime(timezone=True))
    validation_status = db.Column(db.String(20), default='pending')  # pending, valid, invalid, expired
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    data_sources = db.relationship('DataSource', backref='credential', lazy=True)
    
    # Unique constraint for project_id and platform combination
    __table_args__ = (db.UniqueConstraint('project_id', 'platform', name='unique_project_platform_credential'),)
    
    def __init__(self, project_id, platform, credential_type, credentials_data, **kwargs):
        self.project_id = project_id
        self.platform = platform
        self.credential_type = credential_type
        self.set_credentials(credentials_data)
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    @staticmethod
    def _get_encryption_key():
        """Get or generate encryption key for credentials"""
        # In production, this should use a proper key management service
        key_env = os.getenv('CREDENTIAL_ENCRYPTION_KEY')
        if key_env:
            return key_env.encode()
        
        # Generate a new key for development (not recommended for production)
        key = Fernet.generate_key()
        return key
    
    def set_credentials(self, credentials_data):
        """Encrypt and store credentials data"""
        # Convert credentials to JSON string
        credentials_json = json.dumps(credentials_data)
        
        # Encrypt the credentials
        key = self._get_encryption_key()
        fernet = Fernet(key)
        encrypted_data = fernet.encrypt(credentials_json.encode())
        
        self.encrypted_credentials = encrypted_data
        self.encryption_key_id = base64.b64encode(key[:16]).decode()  # Store key identifier
    
    def get_credentials(self):
        """Decrypt and return credentials data"""
        try:
            key = self._get_encryption_key()
            fernet = Fernet(key)
            decrypted_data = fernet.decrypt(self.encrypted_credentials)
            return json.loads(decrypted_data.decode())
        except Exception as e:
            print(f"Error decrypting credentials: {e}")
            return None
    
    def validate_credentials(self):
        """Validate credentials by testing API connection"""
        # This would be implemented with platform-specific validation logic
        # For now, we'll just update the validation timestamp
        self.last_validated_at = datetime.now(timezone.utc)
        self.validation_status = 'valid'  # This should be set based on actual validation
        db.session.commit()
        return True
    
    def is_expired(self):
        """Check if credentials are expired"""
        if not self.expires_at:
            return False
        return datetime.now(timezone.utc) > self.expires_at
    
    def refresh_credentials(self):
        """Refresh OAuth2 credentials if applicable"""
        # This would be implemented with platform-specific refresh logic
        if self.credential_type == 'oauth2':
            # Implement OAuth2 refresh logic here
            pass
        return False
    
    def to_dict(self, include_credentials=False):
        """Convert credential to dictionary representation"""
        data = {
            'id': self.id,
            'project_id': self.project_id,
            'platform': self.platform,
            'credential_type': self.credential_type,
            'is_active': self.is_active,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'last_validated_at': self.last_validated_at.isoformat() if self.last_validated_at else None,
            'validation_status': self.validation_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_expired': self.is_expired()
        }
        
        if include_credentials:
            # Only include credentials for authorized requests
            data['credentials'] = self.get_credentials()
            
        return data
    
    def __repr__(self):
        return f'<Credential {self.platform} (Project: {self.project_id})>'

