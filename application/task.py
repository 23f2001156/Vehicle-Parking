from celery import shared_task
from .models import User, Reservation
import datetime
import csv
from .utils import format_report
from .mail import send_email
import requests
import json

@shared_task(ignore_result=False, name="download_csv_report")
def csv_report():
    reservation = Reservation.query.all()
    csv_file_name = f"resveration_{datetime.datetime.now().strftime('%f')}.csv"
    with open(f'static/{csv_file_name}', 'w', newline="") as csvfile:
        sr_no = 1
        reservation_csv = csv.writer(csvfile, delimiter=',')
        reservation_csv.writerow(['Sr No', 'User', 'User id', 'Location', 'Spot id', 'Parking Time', 'Leaving Time', 'cost'])
        for r in reservation:
            this_reservation = [
                sr_no, r.user.username, r.user_id, r.spot.lot.prime_location_name, r.spot_id, 
                r.parking_timestamp, r.leaving_timestamp, r.parking_cost
            ]
            reservation_csv.writerow(this_reservation)
            sr_no += 1
    return csv_file_name



@shared_task(ignore_result=False, name="download_monthly_report")
def monthly_report():
    users = User.query.all()
    current_date = datetime.datetime.now()
    current_month_num = current_date.month 
    current_year = current_date.year       
    current_month_str = current_date.strftime('%B %Y') 
    
    for user in users:
        user_data = {}
        user_data['username'] = user.username
        user_data['email'] = user.email
        user_data['month'] = current_month_str
        
        user_reservations = []
        total_cost = 0.0
        
        # Filter reservations for the current month and year
        for r in user.reservations:
            # Ensure parking_timestamp exists and is within the current month and year
            if r.parking_timestamp and \
               r.parking_timestamp.month == current_month_num and \
               r.parking_timestamp.year == current_year:
                
                reservation_data = {
                    'location': r.spot.lot.prime_location_name,
                    'address': r.spot.lot.address,
                    'vehicle': r.vehicle.vehicle_number if r.vehicle else 'N/A',
                    'vehicle_model': r.vehicle.model if r.vehicle else 'N/A',
                    'spot_id': r.spot_id,
                    'parking_time': r.parking_timestamp.strftime('%Y-%m-%d %H:%M:%S') if r.parking_timestamp else '',
                    'leaving_time': r.leaving_timestamp.strftime('%Y-%m-%d %H:%M:%S') if r.leaving_timestamp else '',
                    'cost': r.parking_cost or 0.0
                }
                user_reservations.append(reservation_data)
                total_cost += r.parking_cost or 0.0
        
        
        user_data['user_reservations'] = user_reservations 
        user_data['total_cost'] = round(total_cost, 2)
            
        message = format_report('templates/mail.html', user_data)
        send_email(user.email, subject="Monthly Report - ParkPal Parking Service", message=message)
    
    return "Monthly reports sent"



@shared_task(ignore_result=False, name="daily_reminder")
def parking_status(username):
    text = f"Hi {username}, Thank You for using ParkPal. Please check Your total at http://127.0.0.1:5000/api/user/reservations"
    response = requests.post("https://chat.googleapis.com/v1/spaces/AAQANUDtcQk/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=sYvUPeltiSJ6uFbOcQIC85VeCZK7f7iMbiIFbBOwC9g", json = {"text": text})
    print(response.status_code)
    return "Parking status updated"