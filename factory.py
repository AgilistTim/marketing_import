from typing import Dict, Any, Optional, List
import logging
from .base import BaseIntegration, MockIntegration
from .google_ads import GoogleAdsIntegration
from .facebook_ads import FacebookAdsIntegration

logger = logging.getLogger(__name__)

class IntegrationFactory:
    """Factory class for creating platform integrations"""
    
    # Registry of available integrations
    INTEGRATIONS = {
        'google_ads': GoogleAdsIntegration,
        'facebook_ads': FacebookAdsIntegration,
        'meta_ads': FacebookAdsIntegration,  # Alias for Facebook Ads
        'ga4': MockIntegration,  # Google Analytics 4 (mock for now)
        'google_analytics': MockIntegration,  # Google Analytics (mock for now)
        'instagram_insights': MockIntegration,  # Instagram Insights (mock for now)
        'facebook_insights': MockIntegration,  # Facebook Insights (mock for now)
        'shopify': MockIntegration,  # Shopify (mock for now)
        'amazon_ads': MockIntegration,  # Amazon Advertising (mock for now)
        'metricool': MockIntegration,  # Metricool (mock for now)
        'klaviyo': MockIntegration,  # Klaviyo (mock for now)
    }
    
    @classmethod
    def create_integration(cls, 
                          platform: str, 
                          credentials: Dict[str, Any], 
                          config: Dict[str, Any] = None) -> Optional[BaseIntegration]:
        """
        Create an integration instance for the specified platform
        
        Args:
            platform: Platform name (e.g., 'google_ads', 'facebook_ads')
            credentials: Platform-specific credentials
            config: Additional configuration parameters
            
        Returns:
            Integration instance or None if platform not supported
        """
        try:
            platform = platform.lower()
            
            if platform not in cls.INTEGRATIONS:
                logger.error(f"Unsupported platform: {platform}")
                return None
            
            integration_class = cls.INTEGRATIONS[platform]
            
            # Handle mock integrations
            if integration_class == MockIntegration:
                return MockIntegration(platform, credentials, config)
            
            # Create real integration instance
            return integration_class(credentials, config)
            
        except Exception as e:
            logger.error(f"Failed to create integration for {platform}: {str(e)}")
            return None
    
    @classmethod
    def get_supported_platforms(cls) -> List[str]:
        """Get list of supported platform names"""
        return list(cls.INTEGRATIONS.keys())
    
    @classmethod
    def get_platform_requirements(cls, platform: str) -> Dict[str, Any]:
        """
        Get credential requirements for a specific platform
        
        Args:
            platform: Platform name
            
        Returns:
            Dictionary with credential requirements
        """
        platform = platform.lower()
        
        requirements = {
            'google_ads': {
                'required_fields': ['client_id', 'client_secret', 'refresh_token', 'developer_token'],
                'optional_fields': ['customer_id'],
                'auth_type': 'oauth2',
                'description': 'Google Ads API requires OAuth2 authentication and a developer token'
            },
            'facebook_ads': {
                'required_fields': ['access_token', 'app_id', 'app_secret'],
                'optional_fields': ['account_id'],
                'auth_type': 'oauth2',
                'description': 'Facebook Marketing API requires a long-lived access token'
            },
            'meta_ads': {
                'required_fields': ['access_token', 'app_id', 'app_secret'],
                'optional_fields': ['account_id'],
                'auth_type': 'oauth2',
                'description': 'Meta Marketing API requires a long-lived access token'
            },
            'ga4': {
                'required_fields': ['service_account_key', 'property_id'],
                'optional_fields': [],
                'auth_type': 'service_account',
                'description': 'Google Analytics 4 requires a service account key'
            },
            'google_analytics': {
                'required_fields': ['service_account_key', 'view_id'],
                'optional_fields': [],
                'auth_type': 'service_account',
                'description': 'Google Analytics requires a service account key'
            },
            'instagram_insights': {
                'required_fields': ['access_token', 'instagram_business_account_id'],
                'optional_fields': [],
                'auth_type': 'oauth2',
                'description': 'Instagram Basic Display API requires access token'
            },
            'facebook_insights': {
                'required_fields': ['access_token', 'page_id'],
                'optional_fields': [],
                'auth_type': 'oauth2',
                'description': 'Facebook Graph API requires access token'
            },
            'shopify': {
                'required_fields': ['shop_domain', 'access_token'],
                'optional_fields': [],
                'auth_type': 'api_key',
                'description': 'Shopify Admin API requires private app access token'
            },
            'amazon_ads': {
                'required_fields': ['client_id', 'client_secret', 'refresh_token'],
                'optional_fields': ['profile_id'],
                'auth_type': 'oauth2',
                'description': 'Amazon Advertising API requires OAuth2 authentication'
            },
            'metricool': {
                'required_fields': ['api_key'],
                'optional_fields': [],
                'auth_type': 'api_key',
                'description': 'Metricool API requires an API key'
            },
            'klaviyo': {
                'required_fields': ['api_key'],
                'optional_fields': [],
                'auth_type': 'api_key',
                'description': 'Klaviyo API requires an API key'
            }
        }
        
        return requirements.get(platform, {
            'required_fields': ['api_key'],
            'optional_fields': [],
            'auth_type': 'api_key',
            'description': 'Platform-specific credentials required'
        })
    
    @classmethod
    def validate_platform_credentials(cls, platform: str, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate credentials for a specific platform
        
        Args:
            platform: Platform name
            credentials: Credentials to validate
            
        Returns:
            Validation result with status and details
        """
        try:
            requirements = cls.get_platform_requirements(platform)
            required_fields = requirements.get('required_fields', [])
            
            # Check for missing required fields
            missing_fields = [field for field in required_fields if field not in credentials]
            if missing_fields:
                return {
                    'valid': False,
                    'error': f"Missing required fields: {', '.join(missing_fields)}",
                    'missing_fields': missing_fields
                }
            
            # Try to create integration and validate credentials
            integration = cls.create_integration(platform, credentials)
            if not integration:
                return {
                    'valid': False,
                    'error': f"Failed to create integration for platform: {platform}"
                }
            
            # Test credentials
            is_valid = integration.validate_credentials()
            
            return {
                'valid': is_valid,
                'platform': platform,
                'account_info': integration.get_account_info() if is_valid else None,
                'error': None if is_valid else "Credential validation failed"
            }
            
        except Exception as e:
            logger.error(f"Error validating credentials for {platform}: {str(e)}")
            return {
                'valid': False,
                'error': f"Validation error: {str(e)}"
            }

