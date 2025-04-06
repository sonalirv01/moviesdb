# 🚀 MoviesBooking API

A RESTful API built using **Node.js**, **Express**, and **MongoDB** for managing user registration, login, profile access, logout, coupons, and more — featuring secure authentication and session management using UUID and tokens.

---

## 📦 Features

- ✅ User Registration (with unique `userid` generation)
- 🔑 Secure Login with Access Tokens
- 🚪 Logout support with token/session clearing
- 📄 Get, Update, and Delete Users
- 🎟️ Get user-specific coupons
- 🔍 Flexible User Lookup (by `userid`, `uuid`, `username`, or `_id`)
- 🔐 Password hashing with bcrypt

---

## 🧰 Technologies

- Node.js
- Express.js
- MongoDB (Mongoose)
- bcryptjs
- uuid, uuid-token-generator
- axios (for possible external requests)

---

---

## ⚙️ Setup Instructions

### 1. Clone the repo

git clone https://github.com/your-username/user-management-api.git
cd user-management-api

## install Dependencies
npm install

## Database 
mongoose.connect("mongodb://localhost:27017/your-db-name", { useNewUrlParser: true, useUnifiedTopology: true });

## start the server
node server.js

## Important!!!
PS:- For username, while login in after registering new account, the username would be first_name+last_name so if your first_name is "John" and last_name is "Doe" then the username will be "jhondoe"