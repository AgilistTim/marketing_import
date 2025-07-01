from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError
from src.models.user import db, User
from src.models.project import Project
from src.models.webhook import WebhookConfig, APIAccessLog
from src.models.data_source import DataSource
from datetime import datetime, timezone, timedelta

webhook_management_bp = Blueprint('webhook_management', __name__)

# Validation schemas
class CreateWebhookSchema(Schema):
    webhook_name = fields.Str(required=True, validate=lambda x: len(x.strip()) > 0)
    allowed_data_sources = fields.List(fields.Str(), load_default=[])
    data_filters = fields.Dict(load_default={})
    output_format = fields.Str(validate=lambda x: x in ['json', 'csv', 'xml'], load_default='json')
    rate_limit_per_hour = fields.Int(validate=lambda x: x > 0, load_default=1000)
    expires_at = fields.DateTime(load_default=None)

class UpdateWebhookSchema(Schema):
    webhook_name = fields.Str(validate=lambda x: len(x.strip()) > 0)
    is_active = fields.Bool()
    allowed_data_sources = fields.List(fields.Str())
    data_filters = fields.Dict()
    output_format = fields.Str(validate=lambda x: x in ['json', 'csv', 'xml'])
    rate_limit_per_hour = fields.Int(validate=lambda x: x > 0)
    expires_at = fields.DateTime()

def get_current_user():
    """Get current authenticated user"""
    current_user_id = get_jwt_identity()
    return User.query.get(current_user_id)

def get_user_project(project_id):
    """Get project owned by current user"""
    current_user = get_current_user()
    if not current_user:
        return None, jsonify({'error': 'User not found'}), 404
    
    project = Project.query.filter_by(id=project_id, user_id=current_user.id).first()
    if not project:
        return None, jsonify({'error': 'Project not found'}), 404
    
    return project, None, None

def get_project_webhook(project_id, webhook_id):
    """Get webhook for a specific project"""
    project, error_response, status_code = get_user_project(project_id)
    if error_response:
        return None, None, error_response, status_code
    
    webhook = WebhookConfig.query.filter_by(id=webhook_id, project_id=project_id).first()
    if not webhook:
        return None, None, jsonify({'error': 'Webhook not found'}), 404
    
    return project, webhook, None, None

# Add webhook management routes to the project blueprint
from src.routes.project import project_bp

@project_bp.route('/<project_id>/webhooks', methods=['GET'])
@jwt_required()
def get_webhooks(project_id):
    """Get all webhooks for a project"""
    project, error_response, status_code = get_user_project(project_id)
    if error_response:
        return error_response, status_code
    
    # Query parameters
    is_active = request.args.get('is_active', type=bool)
    
    # Build query
    query = WebhookConfig.query.filter_by(project_id=project_id)
    
    if is_active is not None:
        query = query.filter_by(is_active=is_active)
    
    webhooks = query.order_by(WebhookConfig.created_at.desc()).all()
    
    return jsonify({
        'webhooks': [webhook.to_dict() for webhook in webhooks]
    }), 200

@project_bp.route('/<project_id>/webhooks', methods=['POST'])
@jwt_required()
def create_webhook(project_id):
    """Create a new webhook for a project"""
    project, error_response, status_code = get_user_project(project_id)
    if error_response:
        return error_response, status_code
    
    try:
        schema = CreateWebhookSchema()
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400
    
    # Validate allowed data sources belong to this project
    if data['allowed_data_sources']:
        valid_data_sources = DataSource.query.filter(
            DataSource.project_id == project_id,
            DataSource.id.in_(data['allowed_data_sources'])
        ).count()
        
        if valid_data_sources != len(data['allowed_data_sources']):
            return jsonify({'error': 'Some data sources do not belong to this project'}), 400
    
    try:
        # Create new webhook
        webhook = WebhookConfig(
            project_id=project_id,
            webhook_name=data['webhook_name'],
            output_format=data['output_format'],
            rate_limit_per_hour=data['rate_limit_per_hour'],
            expires_at=data.get('expires_at')
        )
        
        webhook.set_allowed_data_sources(data['allowed_data_sources'])
        webhook.set_data_filters(data['data_filters'])
        
        db.session.add(webhook)
        db.session.commit()
        
        return jsonify({
            'message': 'Webhook created successfully',
            'webhook': webhook.to_dict(include_key=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create webhook', 'details': str(e)}), 500

@project_bp.route('/<project_id>/webhooks/<webhook_id>', methods=['GET'])
@jwt_required()
def get_webhook(project_id, webhook_id):
    """Get a specific webhook"""
    project, webhook, error_response, status_code = get_project_webhook(project_id, webhook_id)
    if error_response:
        return error_response, status_code
    
    return jsonify({
        'webhook': webhook.to_dict(include_key=True)
    }), 200

@project_bp.route('/<project_id>/webhooks/<webhook_id>', methods=['PUT'])
@jwt_required()
def update_webhook(project_id, webhook_id):
    """Update a webhook"""
    project, webhook, error_response, status_code = get_project_webhook(project_id, webhook_id)
    if error_response:
        return error_response, status_code
    
    try:
        schema = UpdateWebhookSchema()
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400
    
    # Validate allowed data sources if provided
    if 'allowed_data_sources' in data and data['allowed_data_sources']:
        valid_data_sources = DataSource.query.filter(
            DataSource.project_id == project_id,
            DataSource.id.in_(data['allowed_data_sources'])
        ).count()
        
        if valid_data_sources != len(data['allowed_data_sources']):
            return jsonify({'error': 'Some data sources do not belong to this project'}), 400
    
    try:
        # Update webhook fields
        for field, value in data.items():
            if field == 'allowed_data_sources':
                webhook.set_allowed_data_sources(value)
            elif field == 'data_filters':
                webhook.set_data_filters(value)
            else:
                setattr(webhook, field, value)
        
        webhook.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        return jsonify({
            'message': 'Webhook updated successfully',
            'webhook': webhook.to_dict(include_key=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update webhook', 'details': str(e)}), 500

@project_bp.route('/<project_id>/webhooks/<webhook_id>', methods=['DELETE'])
@jwt_required()
def delete_webhook(project_id, webhook_id):
    """Delete a webhook"""
    project, webhook, error_response, status_code = get_project_webhook(project_id, webhook_id)
    if error_response:
        return error_response, status_code
    
    try:
        # Delete webhook (cascading deletes will handle access logs)
        db.session.delete(webhook)
        db.session.commit()
        
        return jsonify({'message': 'Webhook deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete webhook', 'details': str(e)}), 500

@project_bp.route('/<project_id>/webhooks/<webhook_id>/regenerate-key', methods=['POST'])
@jwt_required()
def regenerate_webhook_key(project_id, webhook_id):
    """Regenerate webhook key"""
    project, webhook, error_response, status_code = get_project_webhook(project_id, webhook_id)
    if error_response:
        return error_response, status_code
    
    try:
        new_key = webhook.regenerate_key()
        
        return jsonify({
            'message': 'Webhook key regenerated successfully',
            'webhook_key': new_key,
            'webhook': webhook.to_dict(include_key=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to regenerate webhook key', 'details': str(e)}), 500

@project_bp.route('/<project_id>/webhooks/<webhook_id>/usage', methods=['GET'])
@jwt_required()
def get_webhook_usage(project_id, webhook_id):
    """Get webhook usage statistics and logs"""
    project, webhook, error_response, status_code = get_project_webhook(project_id, webhook_id)
    if error_response:
        return error_response, status_code
    
    # Query parameters
    days = min(request.args.get('days', 30, type=int), 90)
    limit = min(request.args.get('limit', 100, type=int), 1000)
    
    # Get usage statistics
    usage_stats = webhook.get_usage_stats(days=days)
    
    # Get recent access logs
    cutoff_time = datetime.now(timezone.utc) - timedelta(days=days)
    recent_logs = APIAccessLog.query.filter(
        APIAccessLog.webhook_config_id == webhook_id,
        APIAccessLog.created_at >= cutoff_time
    ).order_by(APIAccessLog.created_at.desc()).limit(limit).all()
    
    # Calculate hourly usage for the last 24 hours
    last_24h = datetime.now(timezone.utc) - timedelta(hours=24)
    hourly_usage = db.session.query(
        db.func.date_trunc('hour', APIAccessLog.created_at).label('hour'),
        db.func.count(APIAccessLog.id).label('requests')
    ).filter(
        APIAccessLog.webhook_config_id == webhook_id,
        APIAccessLog.created_at >= last_24h
    ).group_by('hour').order_by('hour').all()
    
    usage_data = {
        'webhook_id': webhook_id,
        'webhook_name': webhook.webhook_name,
        'statistics': usage_stats,
        'recent_logs': [log.to_dict() for log in recent_logs],
        'hourly_usage': [
            {
                'hour': hour.isoformat() if hour else None,
                'requests': requests
            }
            for hour, requests in hourly_usage
        ]
    }
    
    return jsonify(usage_data), 200

@project_bp.route('/<project_id>/webhooks/<webhook_id>/test', methods=['POST'])
@jwt_required()
def test_webhook(project_id, webhook_id):
    """Test webhook endpoint with sample data"""
    project, webhook, error_response, status_code = get_project_webhook(project_id, webhook_id)
    if error_response:
        return error_response, status_code
    
    if not webhook.is_active:
        return jsonify({'error': 'Webhook is not active'}), 400
    
    if webhook.is_expired():
        return jsonify({'error': 'Webhook has expired'}), 400
    
    # Generate test URL
    test_url = f"/webhook/v1/{webhook.webhook_key}/data"
    
    # Sample test parameters
    test_params = {
        'start_date': (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d'),
        'end_date': datetime.now().strftime('%Y-%m-%d'),
        'format': webhook.output_format,
        'limit': 10
    }
    
    test_info = {
        'webhook_id': webhook_id,
        'webhook_name': webhook.webhook_name,
        'test_url': test_url,
        'test_params': test_params,
        'webhook_key': webhook.webhook_key,
        'instructions': {
            'curl_example': f"curl -X GET '{test_url}?" + "&".join([f"{k}={v}" for k, v in test_params.items()]) + "'",
            'excel_power_query': f"Web.Contents(\"{test_url}\", [Query=[" + ", ".join([f"{k}=\"{v}\"" for k, v in test_params.items()]) + "]])"
        }
    }
    
    return jsonify(test_info), 200

