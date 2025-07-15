# Vehicle Parking Management System

This is a web-based Vehicle Parking Management System built with Flask, Celery, and Redis. It allows users to book parking spots, manage vehicles, view parking history, and receive monthly reports. Admins can manage lots, force release spots, and send notifications.

## Features

- User Registration & Login (Token-based authentication via Flask-Security)
- Book Parking Spots at available locations
- Release Parking Spots and view cost/duration
- Manage Vehicles (add, delete)
- Parking History & CSV Export
- Monthly Parking Report (sent via email)
- Admin Panel for lot management and emergency spot release
- GChat Notifications for urgent admin actions
- Scheduled Tasks (daily reminders, monthly reports) via Celery Beat
- Responsive Dashboard UI (Bootstrap)

## Tech Stack

- Backend: Flask, Flask-Security, SQLAlchemy
- Frontend: Vue.js (in templates), Bootstrap 5
- Task Queue: Celery
- Broker/Backend: Redis
- Email: SMTP (MailHog for local testing)
- Database: SQLite (default, can be changed)

## Setup Instructions

1. **Clone the repository**
   ```sh
   git clone https://github.com/yourusername/vehicle-parking.git
   cd vehicle-parking
   ```

2. **Create and activate a virtual environment**
   ```sh
   python3 -m venv venv
   source venv/bin/activate   # On macOS/Linux
   venv\Scripts\activate   # On Windows
   ```

3. **Install dependencies**
   ```sh
   pip install -r requirements.txt
   ```

4. **Start Redis server**
   ```sh
   redis-server
   ```

5. **Start MailHog (for local email testing)**
   - Download from https://github.com/mailhog/MailHog
   - Run: `MailHog`

6. **Initialize the database**
   ```sh
   python app.py
   ```

7. **Start Celery worker and beat (in separate terminals)**
   ```sh
   celery -A app.celery worker --loglevel=info
   celery -A app.celery beat --loglevel=info
   ```

8. **Access the app**
   - Open [http://localhost:5000](http://localhost:5000) in your browser.

## Usage

- **User:** Register, add vehicles, book/release spots, view history, export CSV, receive monthly report.
- **Admin:** Manage lots, force release spots, send notifications.

## Configuration

- Celery/Redis: See `celery_config.py`
- Email: See `application/mail.py`
- Scheduled Tasks: See `application/task.py` and `app.py`



## License

MIT License

```
MIT License

Copyright (c) 2025 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

**For any issues or contributions, please open an issue or pull request on GitHub.**