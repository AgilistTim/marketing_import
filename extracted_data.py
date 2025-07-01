from src.models.user import db
from datetime import datetime, timezone, date
import uuid
import json
import hashlib

class ExtractedData(db.Model):
    __tablename__ = 'extracted_data'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    data_source_id = db.Column(db.String(36), db.ForeignKey('data_sources.id', ondelete='CASCADE'), nullable=False)
    extraction_job_id = db.Column(db.String(36), db.ForeignKey('extraction_jobs.id'), nullable=False)
    data_type = db.Column(db.String(100), nullable=False)  # campaign, ad_group, keyword, etc.
    data_date = db.Column(db.Date, nullable=False)
    raw_data = db.Column(db.Text, nullable=False)      # JSON string of raw API response
    processed_data = db.Column(db.Text, nullable=False) # JSON string of processed/normalized data
    metrics = db.Column(db.Text)                        # JSON string of calculated metrics
    data_hash = db.Column(db.String(64), nullable=False) # Hash for deduplication
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Unique constraint for deduplication
    __table_args__ = (
        db.UniqueConstraint('data_source_id', 'data_type', 'data_date', 'data_hash', 
                          name='unique_extracted_data'),
        db.Index('idx_data_source_date', 'data_source_id', 'data_date'),
        db.Index('idx_data_type_date', 'data_type', 'data_date'),
    )
    
    def __init__(self, data_source_id, extraction_job_id, data_type, data_date, raw_data, processed_data, **kwargs):
        self.data_source_id = data_source_id
        self.extraction_job_id = extraction_job_id
        self.data_type = data_type
        self.data_date = data_date if isinstance(data_date, date) else datetime.strptime(data_date, '%Y-%m-%d').date()
        self.set_raw_data(raw_data)
        self.set_processed_data(processed_data)
        self._generate_hash()
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def get_raw_data(self):
        """Get raw data as a dictionary"""
        try:
            return json.loads(self.raw_data) if self.raw_data else {}
        except json.JSONDecodeError:
            return {}
    
    def set_raw_data(self, data_dict):
        """Set raw data from a dictionary"""
        self.raw_data = json.dumps(data_dict, sort_keys=True)
    
    def get_processed_data(self):
        """Get processed data as a dictionary"""
        try:
            return json.loads(self.processed_data) if self.processed_data else {}
        except json.JSONDecodeError:
            return {}
    
    def set_processed_data(self, data_dict):
        """Set processed data from a dictionary"""
        self.processed_data = json.dumps(data_dict, sort_keys=True)
    
    def get_metrics(self):
        """Get metrics as a dictionary"""
        try:
            return json.loads(self.metrics) if self.metrics else {}
        except json.JSONDecodeError:
            return {}
    
    def set_metrics(self, metrics_dict):
        """Set metrics from a dictionary"""
        self.metrics = json.dumps(metrics_dict, sort_keys=True) if metrics_dict else None
    
    def _generate_hash(self):
        """Generate hash for deduplication"""
        # Create hash from data_source_id, data_type, data_date, and processed_data
        hash_string = f"{self.data_source_id}:{self.data_type}:{self.data_date}:{self.processed_data}"
        self.data_hash = hashlib.sha256(hash_string.encode()).hexdigest()
    
    @classmethod
    def get_data_for_date_range(cls, data_source_id, start_date, end_date, data_types=None):
        """Get extracted data for a date range"""
        query = cls.query.filter(
            cls.data_source_id == data_source_id,
            cls.data_date >= start_date,
            cls.data_date <= end_date
        )
        
        if data_types:
            query = query.filter(cls.data_type.in_(data_types))
        
        return query.order_by(cls.data_date.desc()).all()
    
    @classmethod
    def get_latest_data_by_type(cls, data_source_id, data_type, limit=100):
        """Get latest data for a specific data type"""
        return cls.query.filter(
            cls.data_source_id == data_source_id,
            cls.data_type == data_type
        ).order_by(cls.data_date.desc()).limit(limit).all()
    
    @classmethod
    def aggregate_metrics_by_date(cls, data_source_ids, start_date, end_date, metrics_list):
        """Aggregate metrics across multiple data sources by date"""
        # This would implement complex aggregation logic
        # For now, return a placeholder structure
        return {}
    
    def to_dict(self, include_raw_data=False):
        """Convert extracted data to dictionary representation"""
        data = {
            'id': self.id,
            'data_source_id': self.data_source_id,
            'extraction_job_id': self.extraction_job_id,
            'data_type': self.data_type,
            'data_date': self.data_date.isoformat() if self.data_date else None,
            'processed_data': self.get_processed_data(),
            'metrics': self.get_metrics(),
            'data_hash': self.data_hash,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_raw_data:
            data['raw_data'] = self.get_raw_data()
            
        return data
    
    def __repr__(self):
        return f'<ExtractedData {self.data_type} ({self.data_date})>'

