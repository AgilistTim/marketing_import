from user import db
from datetime import datetime, timezone
import uuid
import json
import secrets
import string

class WebhookConfig(db.Model):
    __tablename__ = 'webhook_configs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    webhook_name = db.Column(db.String(200), nullable=False)
    webhook_key = db.Column(db.String(100), unique=True, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    allowed_data_sources = db.Column(db.Text, default='[]')  # JSON array of data source IDs
    data_filters = db.Column(db.Text, default='{}')          # JSON object for data filtering
    output_format = db.Column(db.String(20), default='json') # json, csv, xml
    rate_limit_per_hour = db.Column(db.Integer, default=1000)
    expires_at = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    access_logs = db.relationship('APIAccessLog', backref='webhook_config', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, project_id, webhook_name, **kwargs):
        self.project_id = project_id
        self.webhook_name = webhook_name
        self.webhook_key = self._generate_webhook_key()
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def _generate_webhook_key(self):
        """Generate a secure webhook key"""
        # Generate a 32-character alphanumeric key
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(32))
    
    def regenerate_key(self):
        """Regenerate the webhook key"""
        self.webhook_key = self._generate_webhook_key()
        db.session.commit()
        return self.webhook_key
    
    def get_allowed_data_sources(self):
        """Get allowed data sources as a list"""
        try:
            return json.loads(self.allowed_data_sources) if self.allowed_data_sources else []
        except json.JSONDecodeError:
            return []
    
    def set_allowed_data_sources(self, data_source_ids):
        """Set allowed data sources from a list"""
        self.allowed_data_sources = json.dumps(data_source_ids)
    
    def get_data_filters(self):
        """Get data filters as a dictionary"""
        try:
            return json.loads(self.data_filters) if self.data_filters else {}
        except json.JSONDecodeError:
            return {}
    
    def set_data_filters(self, filters_dict):
        """Set data filters from a dictionary"""
        self.data_filters = json.dumps(filters_dict)
    
    def is_expired(self):
        """Check if webhook is expired"""
        if not self.expires_at:
            return False
        return datetime.now(timezone.utc) > self.expires_at
    
    def check_rate_limit(self, time_window_hours=1):
        """Check if rate limit is exceeded"""
        if not self.rate_limit_per_hour:
            return True  # No rate limit
        
        cutoff_time = datetime.now(timezone.utc) - timezone.timedelta(hours=time_window_hours)
        recent_requests = APIAccessLog.query.filter(
            APIAccessLog.webhook_config_id == self.id,
            APIAccessLog.created_at >= cutoff_time
        ).count()
        
        return recent_requests < self.rate_limit_per_hour
    
    def get_usage_stats(self, days=30):
        """Get usage statistics for the webhook"""
        cutoff_time = datetime.now(timezone.utc) - timezone.timedelta(days=days)
        
        total_requests = APIAccessLog.query.filter(
            APIAccessLog.webhook_config_id == self.id,
            APIAccessLog.created_at >= cutoff_time
        ).count()
        
        successful_requests = APIAccessLog.query.filter(
            APIAccessLog.webhook_config_id == self.id,
            APIAccessLog.created_at >= cutoff_time,
            APIAccessLog.response_status < 400
        ).count()
        
        return {
            'total_requests': total_requests,
            'successful_requests': successful_requests,
            'error_rate': (total_requests - successful_requests) / total_requests if total_requests > 0 else 0,
            'period_days': days
        }
    
    def to_dict(self, include_key=False):
        """Convert webhook config to dictionary representation"""
        data = {
            'id': self.id,
            'project_id': self.project_id,
            'webhook_name': self.webhook_name,
            'is_active': self.is_active,
            'allowed_data_sources': self.get_allowed_data_sources(),
            'data_filters': self.get_data_filters(),
            'output_format': self.output_format,
            'rate_limit_per_hour': self.rate_limit_per_hour,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_expired': self.is_expired(),
            'usage_stats': self.get_usage_stats()
        }
        
        if include_key:
            data['webhook_key'] = self.webhook_key
            
        return data
    
    def __repr__(self):
        return f'<WebhookConfig {self.webhook_name} (Project: {self.project_id})>'


class APIAccessLog(db.Model):
    __tablename__ = 'api_access_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    webhook_config_id = db.Column(db.String(36), db.ForeignKey('webhook_configs.id', ondelete='SET NULL'))
    ip_address = db.Column(db.String(45), nullable=False)  # IPv6 compatible
    user_agent = db.Column(db.Text)
    request_method = db.Column(db.String(10), nullable=False)
    request_path = db.Column(db.Text, nullable=False)
    request_params = db.Column(db.Text)  # JSON string of request parameters
    response_status = db.Column(db.Integer, nullable=False)
    response_size = db.Column(db.Integer)
    processing_time_ms = db.Column(db.Integer)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Indexes for performance
    __table_args__ = (
        db.Index('idx_webhook_config_created', 'webhook_config_id', 'created_at'),
        db.Index('idx_ip_created', 'ip_address', 'created_at'),
    )
    
    def __init__(self, ip_address, request_method, request_path, response_status, **kwargs):
        self.ip_address = ip_address
        self.request_method = request_method
        self.request_path = request_path
        self.response_status = response_status
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def get_request_params(self):
        """Get request parameters as a dictionary"""
        try:
            return json.loads(self.request_params) if self.request_params else {}
        except json.JSONDecodeError:
            return {}
    
    def set_request_params(self, params_dict):
        """Set request parameters from a dictionary"""
        self.request_params = json.dumps(params_dict) if params_dict else None
    
    @classmethod
    def log_request(cls, webhook_config_id, ip_address, user_agent, request_method, 
                   request_path, request_params, response_status, response_size=None, 
                   processing_time_ms=None):
        """Create a new access log entry"""
        log_entry = cls(
            webhook_config_id=webhook_config_id,
            ip_address=ip_address,
            user_agent=user_agent,
            request_method=request_method,
            request_path=request_path,
            response_status=response_status,
            response_size=response_size,
            processing_time_ms=processing_time_ms
        )
        log_entry.set_request_params(request_params)
        
        db.session.add(log_entry)
        db.session.commit()
        return log_entry
    
    def to_dict(self):
        """Convert access log to dictionary representation"""
        return {
            'id': self.id,
            'webhook_config_id': self.webhook_config_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'request_method': self.request_method,
            'request_path': self.request_path,
            'request_params': self.get_request_params(),
            'response_status': self.response_status,
            'response_size': self.response_size,
            'processing_time_ms': self.processing_time_ms,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<APIAccessLog {self.request_method} {self.request_path} ({self.response_status})>'

