from flask import request, jsonify,render_template,send_from_directory
from flask_security import auth_required, roles_accepted, current_user,roles_required
from flask_security.utils import verify_password, hash_password
from application.models import User, Role, ParkingLot, ParkingSpot, Reservation, Vehicle
from application.database import db
from sqlalchemy import func
from .utils import roles_list,send_gchat_notification
from app import app 
from datetime import datetime,timezone
from .task import csv_report,monthly_report,parking_status,notify_new_lot,daily_user_reminder
from celery.result import AsyncResult
import time
from flask_cache import cache
from .task import user_csv_report

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
    if not user.active:
        return jsonify({"error": "Your account is blocked,plz contact admin"}), 403

    token = user.get_auth_token()

    return jsonify({
        "message": "Login successful",
        "token": token,
        "roles": [role.name for role in user.roles],
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "roles": [role.name for role in user.roles]
        }
    }), 200


'''@app.route('/api/profile', methods=['GET'])
@auth_required('token')
@roles_accepted('user', 'admin')
def profile():
    return jsonify({
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "roles": [role.name for role in current_user.roles]
    }), 200'''


@app.route('/api/export')
def export_csv(): 
    result= csv_report.delay()
    return jsonify({
        "id": result.id,
        "result": result.result,
    })


@app.route('/api/csv_result/<id>')
def csv_result(id):
    res= AsyncResult(id)
    return send_from_directory('static', res.result)

@app.route('/api/user/export')
def export_user_csv():
    result = user_csv_report.delay(current_user.id)
    return jsonify({
        "id": result.id,
        "result": result.result,
    })

@app.route('/api/user/csv_result/<id>')
def user_csv_result(id):
    res = AsyncResult(id)
    return send_from_directory('static', res.result)

#################### ADMIN ROUTES ###################

@app.route('/api/admin/summary', methods=['GET'])
@auth_required('token')
@roles_required('admin')
@cache.cached(timeout=90, key_prefix='admin_summary')
def get_summary():
    try:
        total_lots = ParkingLot.query.count()
        
        
        available_spots = ParkingSpot.query.filter_by(status='A').count()
        occupied_spots = ParkingSpot.query.filter_by(status='O').count()
       
        total_users = db.session.query(User).join(User.roles).filter(Role.name == 'user').count()
        
        return jsonify({
            'totalLots': total_lots,
            'availableSpots': available_spots,
            'occupiedSpots': occupied_spots,
            'totalUsers': total_users
        })
    except Exception as e:
        print(f"Error in get_summary: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/parking-lots', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def get_parking_lots():
    try:
        lots = ParkingLot.query.all()
        
        result = []
        for lot in lots:
           
            available_spots = ParkingSpot.query.filter_by(lot_id=lot.id, status='A').count()
            revenue = db.session.query(func.sum(Reservation.parking_cost)) \
                .join(ParkingSpot, Reservation.spot_id == ParkingSpot.id) \
                .filter(ParkingSpot.lot_id == lot.id) \
                .scalar() or 0
            result.append({
                'id': lot.id,
                'prime_location_name': lot.prime_location_name,
                'address': lot.address,
                'pin_code': lot.pin_code,
                'price_per_hour': float(lot.price_per_hour),
                'number_of_spots': lot.number_of_spots,
                'available_spots': available_spots,
                'revenue': float(revenue),
                
            })
        
        return jsonify(result)
    except Exception as e:
        print(f"Error in get_parking_lots: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/parking-lots', methods=['POST'])
@auth_required('token')
@roles_required('admin')
def create_parking_lot():
    
    try:
        data = request.get_json()
        print(f"Received data: {data}")  
        
       
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        required_fields = ['prime_location_name', 'price_per_hour', 'number_of_spots']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        
        try:
            price_per_hour = float(data['price_per_hour'])
            number_of_spots = int(data['number_of_spots'])
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid data types for price_per_hour or number_of_spots'}), 400
        
        if price_per_hour <= 0 or number_of_spots <= 0:
            return jsonify({'error': 'Price and number of spots must be positive numbers'}), 400
        
       
        lot = ParkingLot(
            prime_location_name=data['prime_location_name'],
            address=data.get('address', ''),
            pin_code=data.get('pin_code', ''),
            price_per_hour=price_per_hour,
            number_of_spots=number_of_spots
        )
        
        db.session.add(lot)
        db.session.flush()  
        
        for i in range(lot.number_of_spots):
            spot = ParkingSpot(lot_id=lot.id, status='A')
            db.session.add(spot)
        
        db.session.commit()
        notify_new_lot.delay(lot.id)
        
        return jsonify({'message': 'Parking lot created successfully', 'id': lot.id}), 201
        
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in create_parking_lot: {str(e)}")
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@app.route('/api/admin/parking-lots/<int:lot_id>', methods=['PUT'])
@auth_required('token')
@roles_required('admin')
def update_parking_lot(lot_id):
    
    try:
        lot = ParkingLot.query.get_or_404(lot_id)
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
       
        try:
            price_per_hour = float(data['price_per_hour'])
            number_of_spots = int(data['number_of_spots'])
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid data types'}), 400
        
        lot.prime_location_name = data['prime_location_name']
        lot.address = data.get('address', '')
        lot.pin_code = data.get('pin_code', '')
        lot.price_per_hour = price_per_hour
        
      
        current_spot_count = ParkingSpot.query.filter_by(lot_id=lot_id).count()
        
        if number_of_spots != current_spot_count:
            if number_of_spots < current_spot_count:
               
                spots_to_remove = current_spot_count - number_of_spots
                excess_spots = ParkingSpot.query.filter_by(lot_id=lot_id, status='A').limit(spots_to_remove).all()
                
                if len(excess_spots) < spots_to_remove:
                    return jsonify({'error': 'Cannot reduce spots - some are occupied'}), 400
                
                for spot in excess_spots:
                    db.session.delete(spot)
            else:
              
                spots_to_add = number_of_spots - current_spot_count
                for i in range(spots_to_add):
                    spot = ParkingSpot(lot_id=lot_id, status='A')
                    db.session.add(spot)
        
        lot.number_of_spots = number_of_spots
        db.session.commit()
        
        return jsonify({'message': 'Parking lot updated successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error in update_parking_lot: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/parking-lots/<int:lot_id>', methods=['DELETE'])
@auth_required('token')
@roles_required('admin')
def delete_parking_lot(lot_id):
    
    try:
        lot = ParkingLot.query.get_or_404(lot_id)
        
        
        occupied_spots = ParkingSpot.query.filter_by(lot_id=lot_id, status='O').count()
        if occupied_spots > 0:
            return jsonify({'error': 'Cannot delete parking lot with occupied spots'}), 400
        
       
        ParkingSpot.query.filter_by(lot_id=lot_id).delete()
        db.session.delete(lot)
        db.session.commit()
        
        return jsonify({'message': 'Parking lot deleted successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error in delete_parking_lot: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/parking-lots/<int:lot_id>/spots', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def get_parking_spots(lot_id):
    
    try:
        spots = ParkingSpot.query.filter_by(lot_id=lot_id).all()
        
        result = []
        for spot in spots:
            spot_data = {
                'id': spot.id,
                'status': spot.status,
                'current_reservation': None
            }
            
            
            if spot.status == 'O':
                current_reservation = Reservation.query.filter_by(
                    spot_id=spot.id,
                    leaving_timestamp=None
                ).join(User).first()
                
                if current_reservation:
                    vehicle=current_reservation.vehicle
                    spot_data['current_reservation'] = {
                        'user_email': current_reservation.user.email,
                        'parking_timestamp': current_reservation.parking_timestamp.isoformat(),
                        'vehicle_no': vehicle.vehicle_number if vehicle else None,
                        'vehicle_model': vehicle.model if vehicle else None,
                        'vehicle_color': vehicle.color if vehicle else None
                    }
                    
            
            result.append(spot_data)
        
        return jsonify(result)
    except Exception as e:
        print(f"Error in get_parking_spots: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def get_users():
    
    try:
       
        users_with_counts = db.session.query(
            User,
            func.count(Reservation.id).label('reservation_count')
        ).outerjoin(Reservation).join(User.roles).filter(Role.name == 'user').group_by(User.id).all()
        
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

@app.route('/api/admin/users/<int:user_id>/block', methods=['POST'])
@auth_required('token')
@roles_required('admin')
def block_user(user_id):
    user = User.query.get_or_404(user_id)
    user.active=False
    db.session.commit()
    return jsonify({'message': 'User blocked successfully'})
@app.route('/api/admin/users/<int:user_id>/unblock', methods=['POST'])
@auth_required('token')
@roles_required('admin')
def unblock_user(user_id):
    user=User.query.get_or_404(user_id)
    user.active=True
    db.session.commit()
    return jsonify({'message': 'User unblocked successfully'})

@app.route('/api/admin/vehicles', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def get_vehicles():
    vehicles=Vehicle.query.all()
    result = []
    for vehicle in vehicles:
        result.append({
            'id': vehicle.id,
            'vehicle_number': vehicle.vehicle_number,
            'model': vehicle.model,
            'color': vehicle.color,
            'user_id': vehicle.user.username
        })
    return jsonify(result)

@app.route('/api/admin/force-release/<int:spot_id>', methods=['POST'])
@auth_required('token')
@roles_required('admin')
def force_release_spot(spot_id):
    spot = ParkingSpot.query.get_or_404(spot_id)
    if spot.status != 'O':
        return jsonify({'error': 'Spot is not occupied'}), 400

    reservation = Reservation.query.filter_by(spot_id=spot_id, leaving_timestamp=None).first()
    send_gchat_notification(
        reservation.user.username,
        "Admin requests you to urgently release your parking spot due to an emergency. Please vacate as soon as possible."
    )
    return jsonify({'message': f'GChat notification sent to {reservation.user.username}.'})


#### USER ROUTES ####

@app.route('/api/user/history', methods=['GET'])
@auth_required('token')
@roles_required('user')
def user_history():
    reservations = Reservation.query.filter_by(user_id=current_user.id).order_by(Reservation.parking_timestamp.desc()).all()
    result = []
    for r in reservations:
        lot = r.spot.lot
        vehicle = r.vehicle
        result.append({
            'id': r.id,
            'location': lot.prime_location_name,
            'address': lot.address,
            'vehicle_no': vehicle.vehicle_number if vehicle else '',
            'in': r.parking_timestamp.isoformat() + 'Z' if r.parking_timestamp else None,
            'out': r.leaving_timestamp.isoformat() + 'Z' if r.leaving_timestamp else None,
            'spot_id': r.spot_id,
            'cost': r.parking_cost
        })
    return jsonify(result)

@app.route('/api/user/lots', methods=['GET'])
@cache.cached(timeout=90, key_prefix='user_lots')
@auth_required('token')
@roles_required('user')
def user_lots():
    lots = ParkingLot.query.all()
    result = []
    for lot in lots:
        available = ParkingSpot.query.filter_by(lot_id=lot.id, status='A').count()
        result.append({
            'id': lot.id,
            'address': lot.address,
            'prime_location_name': lot.prime_location_name,
            'available': available
        })
    return jsonify(result)

@app.route('/api/user/book', methods=['POST'])
@auth_required('token')
@roles_required('user')
def user_book():
    data = request.get_json()
    lot_id = data.get('lot_id')
    vehicle_id = data.get('vehicle_id')
    spot = ParkingSpot.query.filter_by(lot_id=lot_id, status='A').first()
    if not spot:
        return jsonify({'error': 'No available spots'}), 400
    active_res=Reservation.query.filter_by(vehicle_id=vehicle_id, leaving_timestamp=None).first()
    if active_res:
        return jsonify({'error' : 'Vehicle already has an active reservation'}), 400
    reservation = Reservation(user_id=current_user.id, spot_id=spot.id, vehicle_id=vehicle_id)
    spot.status = 'O'
    db.session.add(reservation)
    db.session.commit()
    return jsonify({'message': 'Spot booked', 'spot_id': spot.id, 'reservation_id': reservation.id})

@app.route('/api/user/release', methods=['POST'])
@auth_required('token')
def user_release():
    data = request.get_json()
    reservation_id = data.get('reservation_id')
    reservation = Reservation.query.filter_by(id=reservation_id, user_id=current_user.id, leaving_timestamp=None).first()
    if not reservation:
        return jsonify({'error': 'Reservation not found or already released'}), 404
    reservation.leaving_timestamp = datetime.utcnow()
    reservation.spot.status = 'A'
    reservation.calculate_cost(reservation.spot.lot.price_per_hour)
    db.session.commit()
    from .utils import send_gchat_notification
    send_gchat_notification(
        current_user.username,
        f"you have successfully released your parking spot. Your total cost was {reservation.parking_cost}."
    )
    return jsonify({'message': 'Spot released', 'cost': reservation.parking_cost})

@app.route('/api/user/vehicles', methods=['GET'])
@auth_required('token')
@roles_required('user')
def user_vehicles():
    vehicles = Vehicle.query.filter_by(user_id=current_user.id).all()
    return jsonify([{'id': v.id, 'vehicle_number': v.vehicle_number, 'model': v.model, 'color': v.color} for v in vehicles])

@app.route('/api/user/vehicles', methods=['POST'])
@auth_required('token')
@roles_required('user')
def add_vehicle():
    data = request.get_json()
    vehicle_number = data.get('vehicle_number')
    model = data.get('model')
    color = data.get('color')
    if not vehicle_number:
        return jsonify({'error': 'Vehicle number required'}), 400
    if Vehicle.query.filter_by(vehicle_number=vehicle_number).first():
        return jsonify({'error': 'Vehicle already exists'}), 409
    vehicle = Vehicle(
        user_id=current_user.id,
        vehicle_number=vehicle_number,
        model=model,
        color=color
    )
    db.session.add(vehicle)
    db.session.commit()
    return jsonify({'message': 'Vehicle added', 'id': vehicle.id})

@app.route('/api/user/vehicles/<int:vehicle_id>', methods=['DELETE'])
@auth_required('token')
@roles_required('user')
def delete_vehicle(vehicle_id):
    vehicle = Vehicle.query.filter_by(id=vehicle_id, user_id=current_user.id).first()
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
   
    active_res = Reservation.query.filter_by(vehicle_id=vehicle_id, leaving_timestamp=None).first()
    if active_res:
        return jsonify({'error': 'Cannot delete vehicle with active reservation'}), 400
    db.session.delete(vehicle)
    db.session.commit()
    return jsonify({'message': 'Vehicle deleted'})



@app.route('/api/test-cache')
@cache.cached(timeout=60,key_prefix='test_cache')
def test_cache():
    import time
    now = time.time()
    return jsonify({"cached_time": now})