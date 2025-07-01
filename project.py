from src.models.user import db
from datetime import datetime, timezone
import uuid
import json

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    settings = db.Column(db.Text, default='{}')  # JSON string for SQLite compatibility
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    credentials = db.relationship('Credential', backref='project', lazy=True, cascade='all, delete-orphan')
    data_sources = db.relationship('DataSource', backref='project', lazy=True, cascade='all, delete-orphan')
    webhook_configs = db.relationship('WebhookConfig', backref='project', lazy=True, cascade='all, delete-orphan')
    
    # Unique constraint for user_id and name combination
    __table_args__ = (db.UniqueConstraint('user_id', 'name', name='unique_user_project_name'),)
    
    def __init__(self, user_id, name, description=None, **kwargs):
        self.user_id = user_id
        self.name = name
        self.description = description
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def get_settings(self):
        """Get project settings as a dictionary"""
        try:
            return json.loads(self.settings) if self.settings else {}
        except json.JSONDecodeError:
            return {}
    
    def set_settings(self, settings_dict):
        """Set project settings from a dictionary"""
        self.settings = json.dumps(settings_dict)
    
    def get_active_credentials_count(self):
        """Get count of active credentials for this project"""
        return len([c for c in self.credentials if c.is_active])
    
    def get_active_data_sources_count(self):
        """Get count of active data sources for this project"""
        return len([ds for ds in self.data_sources if ds.is_active])
    
    def get_platforms(self):
        """Get list of platforms configured for this project"""
        platforms = set()
        for credential in self.credentials:
            if credential.is_active:
                platforms.add(credential.platform)
        return list(platforms)
    
    def to_dict(self, include_relationships=False):
        """Convert project to dictionary representation"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'is_active': self.is_active,
            'settings': self.get_settings(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'active_credentials_count': self.get_active_credentials_count(),
            'active_data_sources_count': self.get_active_data_sources_count(),
            'platforms': self.get_platforms()
        }
        
        if include_relationships:
            data['credentials'] = [c.to_dict() for c in self.credentials]
            data['data_sources'] = [ds.to_dict() for ds in self.data_sources]
            data['webhook_configs'] = [wc.to_dict() for wc in self.webhook_configs]
            
        return data
    
    def __repr__(self):
        return f'<Project {self.name} (User: {self.user_id})>'

