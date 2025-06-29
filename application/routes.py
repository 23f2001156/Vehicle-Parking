from flask import request, jsonify,render_template
from flask_security import auth_required, roles_accepted, current_user,roles_required
from flask_security.utils import verify_password, hash_password
from application.models import User, Role, ParkingLot, ParkingSpot, Reservation
from application.database import db
from sqlalchemy import func
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

#################### ADMIN ROUTES ###################

@app.route('/api/admin/summary', methods=['GET'])
@auth_required('token')  # Added 'token' parameter
@roles_required('admin')
def get_summary():
    """Get dashboard summary statistics"""
    try:
        total_lots = ParkingLot.query.count()
        
        # Get spot statistics
        available_spots = ParkingSpot.query.filter_by(status='A').count()
        occupied_spots = ParkingSpot.query.filter_by(status='O').count()
        
        # Get user count (excluding admins) - Fixed the query
        total_users = db.session.query(User).join(User.roles).filter(Role.name == 'user').count()
        
        return jsonify({
            'totalLots': total_lots,
            'availableSpots': available_spots,
            'occupiedSpots': occupied_spots,
            'totalUsers': total_users
        })
    except Exception as e:
        print(f"Error in get_summary: {str(e)}")  # Added logging
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/parking-lots', methods=['GET'])
@auth_required('token')  # Added 'token' parameter
@roles_required('admin')
def get_parking_lots():
    """Get all parking lots with availability info"""
    try:
        # Fixed the query - using db.session.query properly
        lots_query = db.session.query(ParkingLot).outerjoin(ParkingSpot).all()
        
        result = []
        for lot in lots_query:
            # Calculate available spots for each lot
            available_spots = ParkingSpot.query.filter_by(lot_id=lot.id, status='A').count()
            
            result.append({
                'id': lot.id,
                'prime_location_name': lot.prime_location_name,
                'address': lot.address,
                'pin_code': lot.pin_code,
                'price_per_hour': lot.price_per_hour,
                'number_of_spots': lot.number_of_spots,
                'available_spots': available_spots
            })
        
        return jsonify(result)
    except Exception as e:
        print(f"Error in get_parking_lots: {str(e)}")  # Added logging
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/parking-lots', methods=['POST'])
@auth_required('token')  # Added 'token' parameter
@roles_required('admin')
def create_parking_lot():
    """Create a new parking lot with specified number of spots"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('prime_location_name') or not data.get('price_per_hour') or not data.get('number_of_spots'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Create parking lot
        lot = ParkingLot(
            prime_location_name=data['prime_location_name'],
            address=data.get('address', ''),
            pin_code=data.get('pin_code', ''),
            price_per_hour=float(data['price_per_hour']),
            number_of_spots=int(data['number_of_spots'])
        )
        
        db.session.add(lot)
        db.session.flush()  # Get the lot ID
        
        # Create parking spots for this lot
        for i in range(lot.number_of_spots):
            spot = ParkingSpot(lot_id=lot.id, status='A')
            db.session.add(spot)
        
        db.session.commit()
        
        return jsonify({'message': 'Parking lot created successfully', 'id': lot.id}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error in create_parking_lot: {str(e)}")  # Added logging
        return jsonify({'error': str(e)}), 400

@app.route('/api/admin/parking-lots/<int:lot_id>', methods=['PUT'])
@auth_required('token')  # Added 'token' parameter
@roles_required('admin')
def update_parking_lot(lot_id):
    """Update parking lot details"""
    try:
        lot = ParkingLot.query.get_or_404(lot_id)
        data = request.get_json()
        
        # Update basic info
        lot.prime_location_name = data['prime_location_name']
        lot.address = data.get('address', '')
        lot.pin_code = data.get('pin_code', '')
        lot.price_per_hour = float(data['price_per_hour'])
        
        # Handle spot count changes
        new_spot_count = int(data['number_of_spots'])
        current_spot_count = ParkingSpot.query.filter_by(lot_id=lot_id).count()
        
        if new_spot_count != current_spot_count:
            if new_spot_count < current_spot_count:
                # Remove excess spots (only if they're available)
                spots_to_remove = current_spot_count - new_spot_count
                excess_spots = ParkingSpot.query.filter_by(lot_id=lot_id, status='A').limit(spots_to_remove).all()
                
                if len(excess_spots) < spots_to_remove:
                    return jsonify({'error': 'Cannot reduce spots - some are occupied'}), 400
                
                for spot in excess_spots:
                    db.session.delete(spot)
            else:
                # Add new spots
                spots_to_add = new_spot_count - current_spot_count
                for i in range(spots_to_add):
                    spot = ParkingSpot(lot_id=lot_id, status='A')
                    db.session.add(spot)
        
        lot.number_of_spots = new_spot_count
        db.session.commit()
        
        return jsonify({'message': 'Parking lot updated successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error in update_parking_lot: {str(e)}")  # Added logging
        return jsonify({'error': str(e)}), 400

@app.route('/api/admin/parking-lots/<int:lot_id>', methods=['DELETE'])
@auth_required('token')  # Added 'token' parameter
@roles_required('admin')
def delete_parking_lot(lot_id):
    """Delete parking lot if all spots are empty"""
    try:
        lot = ParkingLot.query.get_or_404(lot_id)
        
        # Check if any spots are occupied
        occupied_spots = ParkingSpot.query.filter_by(lot_id=lot_id, status='O').count()
        if occupied_spots > 0:
            return jsonify({'error': 'Cannot delete parking lot with occupied spots'}), 400
        
        # Delete all spots and the lot
        ParkingSpot.query.filter_by(lot_id=lot_id).delete()
        db.session.delete(lot)
        db.session.commit()
        
        return jsonify({'message': 'Parking lot deleted successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error in delete_parking_lot: {str(e)}")  # Added logging
        return jsonify({'error': str(e)}), 400

@app.route('/api/admin/parking-lots/<int:lot_id>/spots', methods=['GET'])
@auth_required('token')  # Added 'token' parameter
@roles_required('admin')
def get_parking_spots(lot_id):
    """Get all spots for a specific parking lot with current reservation info"""
    try:
        spots = ParkingSpot.query.filter_by(lot_id=lot_id).all()
        
        result = []
        for spot in spots:
            spot_data = {
                'id': spot.id,
                'status': spot.status,
                'current_reservation': None
            }
            
            # If occupied, get current reservation details
            if spot.status == 'O':
                current_reservation = Reservation.query.filter_by(
                    spot_id=spot.id,
                    leaving_timestamp=None
                ).join(User).first()
                
                if current_reservation:
                    spot_data['current_reservation'] = {
                        'user_email': current_reservation.user.email,
                        'parking_timestamp': current_reservation.parking_timestamp.isoformat()
                    }
            
            result.append(spot_data)
        
        return jsonify(result)
    except Exception as e:
        print(f"Error in get_parking_spots: {str(e)}")  # Added logging
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users', methods=['GET'])
@auth_required('token')  # Added 'token' parameter
@roles_required('admin')
def get_users():
   
    try:
        
        users_with_counts = db.session.query(
            User,
            func.count(Reservation.id).label('reservation_count')
        ).outerjoin(Reservation).group_by(User.id).filter(Role.name == 'user').all()
        
        result = []
        for user, reservation_count in users_with_counts:
            result.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'active': user.active,
                'roles': [{'id': role.id, 'name': role.name} for role in user.roles],
                'reservation_count': reservation_count or 0
            })
        
        return jsonify(result)
    except Exception as e:
        print(f"Error in get_users: {str(e)}") 
        return jsonify({'error': str(e)}), 500