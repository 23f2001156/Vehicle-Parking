from flask import request, jsonify,render_template
from flask_security import auth_required, roles_accepted, current_user
from flask_security.utils import verify_password, hash_password
from application.models import User, Role
from application.database import db
from .utils import roles_list
from app import app 

@app.route('/', methods = ['GET'])
def home():
    return render_template('index.html')

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get("email")
    username = data.get("username")
    password = data.get("password")

    if not email or not username or not password:
        return jsonify({"error": "Email, username and password required"}), 400

    if User.query.filter((User.email == email) | (User.username == username)).first():
        return jsonify({"error": "User already exists"}), 409

    role = Role.query.filter_by(name='user').first()
    if not role:
        return jsonify({"error": "Role not found. Please seed roles first."}), 500

    user = User(
        email=email,
        username=username,
        password=hash_password(password),
        fs_uniquifier=username + "_token_key",
        active=True,
        roles=[role]
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not verify_password(password, user.password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = user.get_auth_token()

    return jsonify({
        "message": "Login successful",
        "token": token,
        "roles": [role.name for role in user.roles],  # Add this line
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "roles": [role.name for role in user.roles]
        }
    }), 200


@app.route('/api/profile', methods=['GET'])
@auth_required('token')
@roles_accepted('user', 'admin')
def profile():
    return jsonify({
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "roles": [role.name for role in current_user.roles]
    }), 200


print(app.url_map)