from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class BaseIntegration(ABC):
    """Base class for all marketing platform integrations"""
    
    def __init__(self, credentials: Dict[str, Any], config: Dict[str, Any] = None):
        """
        Initialize the integration with credentials and configuration
        
        Args:
            credentials: Platform-specific credentials (API keys, tokens, etc.)
            config: Additional configuration parameters
        """
        self.credentials = credentials
        self.config = config or {}
        self.platform_name = self.get_platform_name()
        
    @abstractmethod
    def get_platform_name(self) -> str:
        """Return the name of the platform (e.g., 'google_ads', 'facebook_ads')"""
        pass
    
    @abstractmethod
    def validate_credentials(self) -> bool:
        """Validate that the provided credentials are working"""
        pass
    
    @abstractmethod
    def get_available_metrics(self) -> List[str]:
        """Return list of available metrics for this platform"""
        pass
    
    @abstractmethod
    def get_available_dimensions(self) -> List[str]:
        """Return list of available dimensions for this platform"""
        pass
    
    @abstractmethod
    def extract_data(self, 
                    start_date: datetime, 
                    end_date: datetime,
                    metrics: List[str] = None,
                    dimensions: List[str] = None,
                    filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Extract data from the platform
        
        Args:
            start_date: Start date for data extraction
            end_date: End date for data extraction
            metrics: List of metrics to extract
            dimensions: List of dimensions to group by
            filters: Additional filters to apply
            
        Returns:
            List of data records
        """
        pass
    
    def get_account_info(self) -> Dict[str, Any]:
        """Get basic account information (optional, can be overridden)"""
        return {
            'platform': self.platform_name,
            'status': 'connected' if self.validate_credentials() else 'error'
        }
    
    def format_data_record(self, raw_data: Dict[str, Any], 
                          metrics: List[str], 
                          dimensions: List[str]) -> Dict[str, Any]:
        """
        Format a raw data record into standardized format
        
        Args:
            raw_data: Raw data from platform API
            metrics: Requested metrics
            dimensions: Requested dimensions
            
        Returns:
            Formatted data record
        """
        record = {
            'platform': self.platform_name,
            'extracted_at': datetime.now(timezone.utc).isoformat(),
            'data': {}
        }
        
        # Add dimensions
        for dimension in dimensions:
            if dimension in raw_data:
                record['data'][dimension] = raw_data[dimension]
        
        # Add metrics
        for metric in metrics:
            if metric in raw_data:
                record['data'][metric] = raw_data[metric]
        
        return record
    
    def handle_api_error(self, error: Exception, context: str = "") -> None:
        """Handle API errors with logging"""
        error_msg = f"{self.platform_name} API error"
        if context:
            error_msg += f" ({context})"
        error_msg += f": {str(error)}"
        
        logger.error(error_msg)
        raise Exception(error_msg) from error


class MockIntegration(BaseIntegration):
    """Mock integration for testing purposes"""
    
    def __init__(self, platform_name: str, credentials: Dict[str, Any], config: Dict[str, Any] = None):
        self._platform_name = platform_name
        super().__init__(credentials, config)
    
    def get_platform_name(self) -> str:
        return self._platform_name
    
    def validate_credentials(self) -> bool:
        # Mock validation - check if required fields are present
        required_fields = self.config.get('required_fields', ['api_key'])
        return all(field in self.credentials for field in required_fields)
    
    def get_available_metrics(self) -> List[str]:
        return [
            'impressions', 'clicks', 'cost', 'conversions', 
            'revenue', 'ctr', 'cpc', 'cpm', 'roas'
        ]
    
    def get_available_dimensions(self) -> List[str]:
        return [
            'date', 'campaign_name', 'ad_group_name', 'keyword', 
            'device', 'location', 'age_group', 'gender'
        ]
    
    def extract_data(self, 
                    start_date: datetime, 
                    end_date: datetime,
                    metrics: List[str] = None,
                    dimensions: List[str] = None,
                    filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Generate mock data for testing"""
        import random
        from datetime import timedelta
        
        if not metrics:
            metrics = ['impressions', 'clicks', 'cost']
        if not dimensions:
            dimensions = ['date', 'campaign_name']
        
        # Generate mock data for each day in the date range
        data = []
        current_date = start_date
        
        campaigns = ['Summer Sale', 'Brand Awareness', 'Product Launch', 'Holiday Special']
        
        while current_date <= end_date:
            for campaign in campaigns:
                record = {
                    'date': current_date.strftime('%Y-%m-%d'),
                    'campaign_name': campaign,
                    'impressions': random.randint(1000, 10000),
                    'clicks': random.randint(50, 500),
                    'cost': round(random.uniform(100, 1000), 2),
                    'conversions': random.randint(5, 50),
                    'revenue': round(random.uniform(500, 5000), 2),
                }
                
                # Calculate derived metrics
                record['ctr'] = round((record['clicks'] / record['impressions']) * 100, 2)
                record['cpc'] = round(record['cost'] / record['clicks'], 2) if record['clicks'] > 0 else 0
                record['cpm'] = round((record['cost'] / record['impressions']) * 1000, 2)
                record['roas'] = round(record['revenue'] / record['cost'], 2) if record['cost'] > 0 else 0
                
                formatted_record = self.format_data_record(record, metrics, dimensions)
                data.append(formatted_record)
            
            current_date += timedelta(days=1)
        
        return data

