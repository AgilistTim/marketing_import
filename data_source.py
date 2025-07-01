from user import db
from datetime import datetime, timezone
import uuid
import json

class DataSource(db.Model):
    __tablename__ = 'data_sources'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    credential_id = db.Column(db.String(36), db.ForeignKey('credentials.id', ondelete='CASCADE'), nullable=False)
    platform = db.Column(db.String(50), nullable=False)
    source_name = db.Column(db.String(200), nullable=False)
    extraction_config = db.Column(db.Text, nullable=False)  # JSON string for extraction parameters
    schedule_config = db.Column(db.Text, nullable=False)    # JSON string for schedule settings
    is_active = db.Column(db.Boolean, default=True)
    last_extraction_at = db.Column(db.DateTime(timezone=True))
    next_extraction_at = db.Column(db.DateTime(timezone=True))
    extraction_status = db.Column(db.String(20), default='pending')  # pending, running, completed, failed
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    extraction_jobs = db.relationship('ExtractionJob', backref='data_source', lazy=True, cascade='all, delete-orphan')
    extracted_data = db.relationship('ExtractedData', backref='data_source', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, project_id, credential_id, platform, source_name, extraction_config, schedule_config, **kwargs):
        self.project_id = project_id
        self.credential_id = credential_id
        self.platform = platform
        self.source_name = source_name
        self.set_extraction_config(extraction_config)
        self.set_schedule_config(schedule_config)
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def get_extraction_config(self):
        """Get extraction configuration as a dictionary"""
        try:
            return json.loads(self.extraction_config) if self.extraction_config else {}
        except json.JSONDecodeError:
            return {}
    
    def set_extraction_config(self, config_dict):
        """Set extraction configuration from a dictionary"""
        self.extraction_config = json.dumps(config_dict)
    
    def get_schedule_config(self):
        """Get schedule configuration as a dictionary"""
        try:
            return json.loads(self.schedule_config) if self.schedule_config else {}
        except json.JSONDecodeError:
            return {}
    
    def set_schedule_config(self, config_dict):
        """Set schedule configuration from a dictionary"""
        self.schedule_config = json.dumps(config_dict)
    
    def update_extraction_status(self, status, next_extraction_time=None):
        """Update extraction status and timestamps"""
        self.extraction_status = status
        if status == 'completed':
            self.last_extraction_at = datetime.now(timezone.utc)
        if next_extraction_time:
            self.next_extraction_at = next_extraction_time
        db.session.commit()
    
    def get_latest_extraction_job(self):
        """Get the most recent extraction job"""
        return ExtractionJob.query.filter_by(data_source_id=self.id).order_by(ExtractionJob.created_at.desc()).first()
    
    def get_extraction_history(self, limit=10):
        """Get recent extraction jobs"""
        return ExtractionJob.query.filter_by(data_source_id=self.id).order_by(ExtractionJob.created_at.desc()).limit(limit).all()
    
    def get_data_count(self):
        """Get count of extracted data records"""
        return ExtractedData.query.filter_by(data_source_id=self.id).count()
    
    def to_dict(self, include_relationships=False):
        """Convert data source to dictionary representation"""
        data = {
            'id': self.id,
            'project_id': self.project_id,
            'credential_id': self.credential_id,
            'platform': self.platform,
            'source_name': self.source_name,
            'extraction_config': self.get_extraction_config(),
            'schedule_config': self.get_schedule_config(),
            'is_active': self.is_active,
            'last_extraction_at': self.last_extraction_at.isoformat() if self.last_extraction_at else None,
            'next_extraction_at': self.next_extraction_at.isoformat() if self.next_extraction_at else None,
            'extraction_status': self.extraction_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'data_count': self.get_data_count()
        }
        
        if include_relationships:
            latest_job = self.get_latest_extraction_job()
            data['latest_job'] = latest_job.to_dict() if latest_job else None
            data['extraction_history'] = [job.to_dict() for job in self.get_extraction_history()]
            
        return data
    
    def __repr__(self):
        return f'<DataSource {self.source_name} ({self.platform})>'


class ExtractionJob(db.Model):
    __tablename__ = 'extraction_jobs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    data_source_id = db.Column(db.String(36), db.ForeignKey('data_sources.id', ondelete='CASCADE'), nullable=False)
    job_type = db.Column(db.String(50), nullable=False)  # scheduled, manual, backfill
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, running, completed, failed
    started_at = db.Column(db.DateTime(timezone=True))
    completed_at = db.Column(db.DateTime(timezone=True))
    records_processed = db.Column(db.Integer, default=0)
    error_message = db.Column(db.Text)
    job_config = db.Column(db.Text)  # JSON string for job-specific configuration
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    def __init__(self, data_source_id, job_type, **kwargs):
        self.data_source_id = data_source_id
        self.job_type = job_type
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def get_job_config(self):
        """Get job configuration as a dictionary"""
        try:
            return json.loads(self.job_config) if self.job_config else {}
        except json.JSONDecodeError:
            return {}
    
    def set_job_config(self, config_dict):
        """Set job configuration from a dictionary"""
        self.job_config = json.dumps(config_dict)
    
    def start_job(self):
        """Mark job as started"""
        self.status = 'running'
        self.started_at = datetime.now(timezone.utc)
        db.session.commit()
    
    def complete_job(self, records_processed=0):
        """Mark job as completed"""
        self.status = 'completed'
        self.completed_at = datetime.now(timezone.utc)
        self.records_processed = records_processed
        db.session.commit()
    
    def fail_job(self, error_message):
        """Mark job as failed"""
        self.status = 'failed'
        self.completed_at = datetime.now(timezone.utc)
        self.error_message = error_message
        db.session.commit()
    
    def get_duration(self):
        """Get job duration in seconds"""
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None
    
    def to_dict(self):
        """Convert extraction job to dictionary representation"""
        return {
            'id': self.id,
            'data_source_id': self.data_source_id,
            'job_type': self.job_type,
            'status': self.status,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'records_processed': self.records_processed,
            'error_message': self.error_message,
            'job_config': self.get_job_config(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'duration_seconds': self.get_duration()
        }
    
    def __repr__(self):
        return f'<ExtractionJob {self.id} ({self.status})>'

