from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError
from user import db, User
from project import Project
from data_source import DataSource
from datetime import datetime, timezone
import json

project_bp = Blueprint('project', __name__, url_prefix='/api/v1/projects')

# ----------------------- Schemas ----------------------- #
class ProjectCreateSchema(Schema):
    name = fields.Str(required=True)
    description = fields.Str(load_default=None)

class ProjectUpdateSchema(Schema):
    name = fields.Str()
    description = fields.Str()
    is_active = fields.Bool()

class DataSourceCreateSchema(Schema):
    credential_id = fields.Str(required=True)
    platform = fields.Str(required=True)
    source_name = fields.Str(required=True)
    extraction_config = fields.Dict(load_default={})
    schedule_config = fields.Dict(load_default={})

# ----------------------- Helpers ----------------------- #

def get_current_user():
    current_user_id = get_jwt_identity()
    return User.query.get(current_user_id)

# ----------------------- Routes ----------------------- #

@project_bp.route('', methods=['GET'])
@jwt_required()
def list_projects():
    user = get_current_user()
    projects = Project.query.filter_by(user_id=user.id).order_by(Project.created_at.desc()).all()
    return jsonify({'projects': [p.to_dict() for p in projects]}), 200

@project_bp.route('', methods=['POST'])
@jwt_required()
def create_project():
    user = get_current_user()
    try:
        data = ProjectCreateSchema().load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400

    # Ensure unique project name per user
    if Project.query.filter_by(user_id=user.id, name=data['name']).first():
        return jsonify({'error': 'Project with this name already exists'}), 409

    project = Project(user_id=user.id, **data)
    db.session.add(project)
    db.session.commit()
    return jsonify({'message': 'Project created', 'project': project.to_dict()}), 201

@project_bp.route('/<project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    user = get_current_user()
    project = Project.query.filter_by(id=project_id, user_id=user.id).first()
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    return jsonify({'project': project.to_dict(include_relationships=True)}), 200

@project_bp.route('/<project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    user = get_current_user()
    project = Project.query.filter_by(id=project_id, user_id=user.id).first()
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    try:
        data = ProjectUpdateSchema().load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400

    for k, v in data.items():
        setattr(project, k, v)
    project.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({'message': 'Project updated', 'project': project.to_dict()}), 200

@project_bp.route('/<project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    user = get_current_user()
    project = Project.query.filter_by(id=project_id, user_id=user.id).first()
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    db.session.delete(project)
    db.session.commit()
    return jsonify({'message': 'Project deleted'}), 200

# -------- Data Source configuration -------- #

@project_bp.route('/<project_id>/data-sources', methods=['POST'])
@jwt_required()
def create_data_source(project_id):
    user = get_current_user()
    project = Project.query.filter_by(id=project_id, user_id=user.id).first()
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    try:
        data = DataSourceCreateSchema().load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400

    data_source = DataSource(project_id=project_id, **data)
    db.session.add(data_source)
    db.session.commit()
    return jsonify({'message': 'Data source added', 'data_source': data_source.to_dict()}), 201

@project_bp.route('/<project_id>/data-sources', methods=['GET'])
@jwt_required()
def list_data_sources(project_id):
    user = get_current_user()
    project = Project.query.filter_by(id=project_id, user_id=user.id).first()
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    sources = DataSource.query.filter_by(project_id=project_id).order_by(DataSource.created_at.desc()).all()
    return jsonify({'data_sources': [ds.to_dict() for ds in sources]}), 200

# -------- Export endpoint -------- #

@project_bp.route('/<project_id>/export', methods=['GET'])
@jwt_required()
def export_project(project_id):
    """Simple export stub: returns list of data sources as JSON or CSV."""
    fmt = request.args.get('format', 'json').lower()
    user = get_current_user()
    project = Project.query.filter_by(id=project_id, user_id=user.id).first()
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    sources = DataSource.query.filter_by(project_id=project_id).all()
    rows = [ds.to_dict() for ds in sources]
    if fmt == 'csv':
        # naive CSV
        import csv, io
        if not rows:
            return ('', 204)
        headers = rows[0].keys()
        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)
        return (buf.getvalue(), 200, {
            'Content-Type': 'text/csv',
            'Content-Disposition': f'attachment; filename="project_{project_id}_export.csv"'
        })
    # default JSON
    return jsonify(rows), 200 