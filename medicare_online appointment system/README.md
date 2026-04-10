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
1. Create a MySQL database and run `database/schema.sql`.
2. Copy `.env.example` to `.env` and configure database settings.
3. Install Node dependencies with `npm install`.
4. Start the server with `npm start`.
5. Open `http://localhost:5000` in your browser.

## Notes
- Admin login: `admin` / `admin123`
- Doctor accounts require admin approval before login
- Use the patient dashboard to book appointments and review history
