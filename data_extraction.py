from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import logging
import json
from sqlalchemy.exc import SQLAlchemyError

from src.models.user import db
from src.models.project import Project
from src.models.credential import Credential
from src.models.data_source import DataSource
from src.models.extracted_data import ExtractedData
from src.integrations.factory import IntegrationFactory

logger = logging.getLogger(__name__)

class DataExtractionService:
    """Service for handling data extraction from marketing platforms"""
    
    def __init__(self):
        self.integration_factory = IntegrationFactory()
    
    def extract_data_for_source(self, 
                               data_source_id: str,
                               start_date: datetime,
                               end_date: datetime,
                               force_refresh: bool = False) -> Dict[str, Any]:
        """
        Extract data for a specific data source
        
        Args:
            data_source_id: ID of the data source
            start_date: Start date for extraction
            end_date: End date for extraction
            force_refresh: Whether to force refresh even if data exists
            
        Returns:
            Extraction result with status and details
        """
        try:
            # Get data source and related objects
            data_source = DataSource.query.get(data_source_id)
            if not data_source:
                return {'success': False, 'error': 'Data source not found'}
            
            if not data_source.is_active:
                return {'success': False, 'error': 'Data source is not active'}
            
            # Get credential
            credential = Credential.query.get(data_source.credential_id)
            if not credential or not credential.is_active:
                return {'success': False, 'error': 'Credential not found or inactive'}
            
            # Check if data already exists (unless force refresh)
            if not force_refresh:
                existing_data = ExtractedData.query.filter(
                    ExtractedData.data_source_id == data_source_id,
                    ExtractedData.date_start <= start_date,
                    ExtractedData.date_end >= end_date
                ).first()
                
                if existing_data:
                    return {
                        'success': True,
                        'message': 'Data already exists',
                        'records_count': 0,
                        'existing_data_id': existing_data.id
                    }
            
            # Create integration instance
            credentials_data = credential.get_credentials()
            integration = self.integration_factory.create_integration(
                credential.platform,
                credentials_data,
                data_source.get_config()
            )
            
            if not integration:
                return {'success': False, 'error': f'Integration not available for platform: {credential.platform}'}
            
            # Validate credentials
            if not integration.validate_credentials():
                return {'success': False, 'error': 'Credential validation failed'}
            
            # Extract data
            logger.info(f"Extracting data for source {data_source_id} from {start_date} to {end_date}")
            
            config = data_source.get_config()
            metrics = config.get('metrics', [])
            dimensions = config.get('dimensions', [])
            filters = config.get('filters', {})
            
            raw_data = integration.extract_data(
                start_date=start_date,
                end_date=end_date,
                metrics=metrics,
                dimensions=dimensions,
                filters=filters
            )
            
            if not raw_data:
                return {'success': False, 'error': 'No data returned from platform'}
            
            # Store extracted data
            extracted_data = ExtractedData(
                data_source_id=data_source_id,
                date_start=start_date,
                date_end=end_date,
                records_count=len(raw_data),
                extraction_config={
                    'metrics': metrics,
                    'dimensions': dimensions,
                    'filters': filters
                }
            )
            
            extracted_data.set_data(raw_data)
            
            db.session.add(extracted_data)
            db.session.commit()
            
            logger.info(f"Successfully extracted {len(raw_data)} records for data source {data_source_id}")
            
            return {
                'success': True,
                'message': 'Data extraction completed successfully',
                'records_count': len(raw_data),
                'extracted_data_id': extracted_data.id
            }
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Data extraction failed for source {data_source_id}: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def extract_data_for_project(self, 
                                project_id: str,
                                start_date: datetime,
                                end_date: datetime,
                                force_refresh: bool = False) -> Dict[str, Any]:
        """
        Extract data for all data sources in a project
        
        Args:
            project_id: ID of the project
            start_date: Start date for extraction
            end_date: End date for extraction
            force_refresh: Whether to force refresh even if data exists
            
        Returns:
            Extraction results for all data sources
        """
        try:
            # Get project and data sources
            project = Project.query.get(project_id)
            if not project:
                return {'success': False, 'error': 'Project not found'}
            
            if not project.is_active:
                return {'success': False, 'error': 'Project is not active'}
            
            data_sources = DataSource.query.filter_by(
                project_id=project_id,
                is_active=True
            ).all()
            
            if not data_sources:
                return {'success': False, 'error': 'No active data sources found'}
            
            results = []
            total_records = 0
            successful_extractions = 0
            
            for data_source in data_sources:
                result = self.extract_data_for_source(
                    data_source.id,
                    start_date,
                    end_date,
                    force_refresh
                )
                
                result['data_source_id'] = data_source.id
                result['data_source_name'] = data_source.source_name
                result['platform'] = data_source.credential.platform if data_source.credential else 'unknown'
                
                results.append(result)
                
                if result['success']:
                    successful_extractions += 1
                    total_records += result.get('records_count', 0)
            
            return {
                'success': True,
                'message': f'Extraction completed for {successful_extractions}/{len(data_sources)} data sources',
                'total_records': total_records,
                'successful_extractions': successful_extractions,
                'total_data_sources': len(data_sources),
                'results': results
            }
            
        except Exception as e:
            logger.error(f"Project data extraction failed for project {project_id}: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_extracted_data(self, 
                          data_source_id: str = None,
                          project_id: str = None,
                          start_date: datetime = None,
                          end_date: datetime = None,
                          limit: int = 1000) -> List[Dict[str, Any]]:
        """
        Retrieve extracted data with optional filters
        
        Args:
            data_source_id: Filter by data source ID
            project_id: Filter by project ID
            start_date: Filter by start date
            end_date: Filter by end date
            limit: Maximum number of records to return
            
        Returns:
            List of extracted data records
        """
        try:
            query = ExtractedData.query
            
            if data_source_id:
                query = query.filter_by(data_source_id=data_source_id)
            
            if project_id:
                query = query.join(DataSource).filter(DataSource.project_id == project_id)
            
            if start_date:
                query = query.filter(ExtractedData.date_end >= start_date)
            
            if end_date:
                query = query.filter(ExtractedData.date_start <= end_date)
            
            # Order by extraction date (newest first) and limit results
            extracted_data_records = query.order_by(
                ExtractedData.created_at.desc()
            ).limit(limit).all()
            
            # Flatten the data records
            all_records = []
            for extracted_data in extracted_data_records:
                data_records = extracted_data.get_data()
                for record in data_records:
                    # Add metadata to each record
                    record['_metadata'] = {
                        'extracted_data_id': extracted_data.id,
                        'data_source_id': extracted_data.data_source_id,
                        'extraction_date': extracted_data.created_at.isoformat(),
                        'date_range': {
                            'start': extracted_data.date_start.isoformat(),
                            'end': extracted_data.date_end.isoformat()
                        }
                    }
                    all_records.append(record)
            
            return all_records
            
        except Exception as e:
            logger.error(f"Failed to retrieve extracted data: {str(e)}")
            return []
    
    def get_extraction_status(self, project_id: str) -> Dict[str, Any]:
        """
        Get extraction status for a project
        
        Args:
            project_id: ID of the project
            
        Returns:
            Status information for all data sources
        """
        try:
            data_sources = DataSource.query.filter_by(
                project_id=project_id,
                is_active=True
            ).all()
            
            status_info = []
            
            for data_source in data_sources:
                # Get latest extraction
                latest_extraction = ExtractedData.query.filter_by(
                    data_source_id=data_source.id
                ).order_by(ExtractedData.created_at.desc()).first()
                
                source_status = {
                    'data_source_id': data_source.id,
                    'source_name': data_source.source_name,
                    'platform': data_source.credential.platform if data_source.credential else 'unknown',
                    'is_active': data_source.is_active,
                    'last_extraction': None,
                    'last_extraction_records': 0,
                    'status': 'never_extracted'
                }
                
                if latest_extraction:
                    source_status.update({
                        'last_extraction': latest_extraction.created_at.isoformat(),
                        'last_extraction_records': latest_extraction.records_count,
                        'status': 'extracted',
                        'date_range': {
                            'start': latest_extraction.date_start.isoformat(),
                            'end': latest_extraction.date_end.isoformat()
                        }
                    })
                
                status_info.append(source_status)
            
            return {
                'project_id': project_id,
                'data_sources': status_info,
                'total_data_sources': len(data_sources),
                'active_data_sources': len([ds for ds in data_sources if ds.is_active])
            }
            
        except Exception as e:
            logger.error(f"Failed to get extraction status for project {project_id}: {str(e)}")
            return {'error': str(e)}

