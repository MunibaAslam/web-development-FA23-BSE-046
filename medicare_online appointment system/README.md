# Medicare Online Appointment System

## Overview
A web-based healthcare appointment system with patient, doctor, and admin modules built using Node.js, Express, and MySQL.

## Features
- Patient registration, login, appointment booking, and history
- Doctor login, appointment review, and availability management
- Admin dashboard, doctor approval, patient management, and reports
- Role-based access with JWT authentication
- Responsive frontend using Bootstrap

## Project Structure
- `/frontend` - HTML, CSS, and JavaScript pages
- `/backend` - Express server, routes, controllers, models, and middleware
- `/database` - MySQL schema file

## Setup

<img width="1132" height="542" alt="image" src="https://github.com/user-attachments/assets/c1c7bc03-64d0-4707-a090-f67cf8eb1fe4" />
<img width="1133" height="805" alt="image" src="https://github.com/user-attachments/assets/387ad185-4c19-4701-a080-c578ea2417d1" />
<img width="1111" height="525" alt="image" src="https://github.com/user-attachments/assets/c2cc65fe-b616-45fa-9ab3-299e11ae6bbc" />
<img width="553" height="667" alt="image" src="https://github.com/user-attachments/assets/ab6b852c-a76b-4ff9-b3c2-cc01fc346fab" />
<img width="1124" height="518" alt="image" src="https://github.com/user-attachments/assets/bf2599ca-10f9-4e8a-9c15-25e86696275d" />
<img width="579" height="715" alt="image" src="https://github.com/user-attachments/assets/af3f085d-277d-4bb1-b877-0a5baca81e7e" />

1. Create a MySQL database and run `database/schema.sql`.
2. Copy `.env.example` to `.env` and configure database settings.
3. Install Node dependencies with `npm install`.
4. Start the server with `npm start`.
5. Open `http://localhost:5000` in your browser.

## Notes
- Admin login: `admin` / `admin123`
- Doctor accounts require admin approval before login
- Use the patient dashboard to book appointments and review history
