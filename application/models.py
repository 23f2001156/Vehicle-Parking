from .database import db
from flask_security import UserMixin, RoleMixin
from datetime import datetime
import uuid

# Many-to-many table between User and Role
class UsersRoles(db.Model):
    __tablename__ = 'users_roles'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'))

# Role model
class Role(db.Model, RoleMixin):
    __tablename__ = 'role'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(255))

# User model
class User(db.Model, UserMixin):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    fs_uniquifier = db.Column(db.String(255), unique=True, nullable=False)
    active = db.Column(db.Boolean(), nullable=False, default=True)

    # Flask-Security fields
    roles = db.relationship('Role', secondary='users_roles', backref='users')

    # Custom relationship
    reservations = db.relationship('Reservation', backref='user', lazy=True)

    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        if not self.fs_uniquifier:
            self.fs_uniquifier = str(uuid.uuid4())

# Parking lot model
class ParkingLot(db.Model):
    __tablename__ = 'parking_lot'
    id = db.Column(db.Integer, primary_key=True)
    prime_location_name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(200))
    pin_code = db.Column(db.String(10))
    price_per_hour = db.Column(db.Float, nullable=False)
    number_of_spots = db.Column(db.Integer, nullable=False)

    spots = db.relationship('ParkingSpot', backref='lot', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<ParkingLot {self.prime_location_name}>'

# Parking spot model
class ParkingSpot(db.Model):
    __tablename__ = 'parking_spot'
    id = db.Column(db.Integer, primary_key=True)
    lot_id = db.Column(db.Integer, db.ForeignKey('parking_lot.id'), nullable=False)
    status = db.Column(db.String(1), default='A')  

    reservations = db.relationship('Reservation', backref='spot', lazy=True)

    def __repr__(self):
        return f'<ParkingSpot {self.id} - {self.status}>'
    
class Reservation(db.Model):
    __tablename__ = 'reservation'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    spot_id = db.Column(db.Integer, db.ForeignKey('parking_spot.id'), nullable=False)

    parking_timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    leaving_timestamp = db.Column(db.DateTime, nullable=True)
    parking_cost = db.Column(db.Float, default=0.0)

    def calculate_cost(self, price_per_hour):
        if self.leaving_timestamp:
            duration = (self.leaving_timestamp - self.parking_timestamp).total_seconds() / 3600
            self.parking_cost = round(duration * price_per_hour, 2)
        else:
            self.parking_cost = 0.0
        return self.parking_cost

    def __repr__(self):
        return f'<Reservation {self.id} - User {self.user_id} - Spot {self.spot_id}>'
    
