# 🚀 Kiddy.ai Bootcamp Registration & Management Portal

A modern, responsive, production-ready, and fully functional **Bootcamp Registration & Management Portal** designed for Kiddy.ai. This portal utilizes a modern frontend built with Bootstrap 5 and Vanilla JavaScript, powered by Firebase Authentication and Cloud Firestore for high-performance serverless backend services. It is optimized to be deployed directly on **Vercel** for free.

---

## ✨ Features

### For Students:
*   **Landing Page (`index.html`):** Beautifully styled landing page with details on about sections, timelines, FAQs, and trainer info.
*   **Registration Portal (`register.html`):** Real-time client-side validated registration profile creation (Full Name, Contact, Academic and Location details, Goal Statement).
*   **Secure Authentication (`login.html`):** Password show/hide, remember me session persistent login, and email verification.
*   **Forgot Password:** Password reset modal linked directly with Firebase password reset triggers.
*   **Student Dashboard (`dashboard.html`):** Protected user dashboard showing profile card, registration status badge, system announcements, and upcoming live classes.
*   **Profile Settings:** Modal form allowing students to update their contact details, college info, and location.

### For Administrators:
*   **Secure Admin Route Protection (`admin.html`):** Automatically routes users based on role credentials (`role: 'admin'`). The default admin account is `admin@kiddyai.in`.
*   **Live Statistics Counter:** Dynamic stats tracking total registrations, approved students, contact form submissions, and active accounts.
*   **Applicant Approval System:** View details, approve applicant status, reject applications, and delete records permanently.
*   **Announcement Management (CRUD):** Real-time publishing, updating, and deletion of boot camp announcements.
*   **Inquiry Viewer:** View and delete contact form submissions.

---

## 🛠️ Tech Stack & Services

*   **Frontend UI:** HTML5, CSS3, Bootstrap 5.3.3, Bootstrap Icons, Google Fonts (Outfit & Inter)
*   **Backend Services:** Firebase v10.8.0 Web SDK (Authentication & Firestore Database)
*   **Hosting:** Vercel (Configured via static output routing in `vercel.json`)
*   **Language:** Vanilla JS (ES Modules import syntax)

---

## 📂 Project Structure

```text
kiddyai-bootcamp/
│
├── index.html          # Core Landing Page (Curriculum Timeline, Trainers, Contact Form)
├── register.html       # Student Registration Form
├── login.html          # Login Panel & Forgot Password Modal
├── dashboard.html      # Protected Student Dashboard (Profile, Announcements, Live Sessions)
├── admin.html          # Protected Admin Control Panel (Applicants, Announcements, Inquiries)
│
├── css/
│   └── style.css       # Premium styling system, Glassmorphism panels, & Transitions
│
├── js/
│   ├── firebase-config.js  # Firebase Initialization & LocalStorage Custom Configuration
│   ├── auth.js             # Route Protection Guards, Toast Notifications, & Authentication
│   ├── register.js         # Register submit controller & client validation logic
│   ├── dashboard.js        # Student profile loaders & announcements rendering
│   ├── admin.js            # Admin statistics, applicant actions, CRUD announcements
│   └── contact.js          # Contact form handler for submissions
│
├── assets/
│   ├── images/         # Student & Trainer avatar illustration assets
│   ├── icons/          # Icon packs and branding assets
│   └── logos/          # Logo variations
│
├── firestore.rules     # Database Security Rules for Role-Based Access Control
├── vercel.json         # Vercel server headers and clean URL routing configuration
└── README.md           # Documentation guide (this file)
```

---

## ⚙️ Database Architecture

### Collection: `users`
Each document corresponds to a user's unique Authentication UID (`uid`).
```json
{
  "uid": "USER_AUTH_UID_STRING",
  "fullName": "Rahul Sharma",
  "email": "student@example.com",
  "phone": "9876543210",
  "dob": "2002-05-15",
  "gender": "Male",
  "college": "St. Xavier's College",
  "department": "Computer Science",
  "year": "3rd Year",
  "city": "Mumbai",
  "state": "Maharashtra",
  "reason": "I want to build chatbots and understand LLMs.",
  "role": "student", // 'student' or 'admin'
  "status": "pending", // 'pending', 'approved', or 'rejected'
  "createdAt": "Timestamp"
}
```

### Collection: `contacts`
```json
{
  "name": "Sender Name",
  "email": "sender@example.com",
  "phone": "9876543210",
  "message": "Inquiry details text...",
  "createdAt": "Timestamp"
}
```

### Collection: `announcements`
```json
{
  "title": "Bootcamp Orientation Schedule",
  "description": "The orientation will start on June 15th at 4:00 PM IST.",
  "createdAt": "Timestamp"
}
```

---

## 🔒 Security Rules (`firestore.rules`)

To secure student information, deploy the rules defined in `firestore.rules` inside your Firebase Console:
1.  **Users:** Authenticated owners can read/write their own details (excluding `role` and `status` updates). Administrators have full access.
2.  **Contacts:** Public write access is enabled so visitors can leave messages. Only administrators can read or delete submissions.
3.  **Announcements:** Anyone can read announcements. Only administrators can write (create/update/delete) them.

---

## 🚀 Local Development Setup

### 1. Configure Firebase Credentials
Open `/js/firebase-config.js` and input your Firebase Project Credentials:
```javascript
const defaultFirebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```
> [!TIP]
> If you deploy this locally or to Vercel before entering your credentials, a **demo config banner** will show on the webpage. You can click **"Configure Database Connection"** to paste your credentials directly into the browser storage so you don't have to hardcode keys!

### 2. Run the App
Since the project uses modern ES Modules imports directly in HTML, you need to run a local server (e.g. VS Code Live Server or python server) to view it properly.
```bash
# Using python:
python3 -m http.server 8000
```
Open `http://localhost:8000` in your web browser.

---

## ✈️ Vercel Deployment Guide

Deploying directly on Vercel is free and takes less than a minute:

1.  **Install Vercel CLI** (Optional, or link via GitHub integration):
    ```bash
    npm install -g vercel
    ```
2.  **Run Deployment:**
    ```bash
    vercel
    ```
3.  **Production Release:**
    ```bash
    vercel --prod
    ```

Vercel automatically detects the configuration and static HTML routing via the settings configured inside the `vercel.json` file.
