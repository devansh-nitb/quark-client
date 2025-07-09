# 🔐 QUARK — Question Upload and Access Repository Kit

A secure platform for managing, uploading, and accessing question papers or assessment modules.

---

## 📘 Overview

**QUARK** (Question Upload and Access Repository Kit) is a robust, full-stack web application made for ensuring secure and streamlined management of question papers. It features dedicated interfaces for **Admins**, **Teachers**, and **Students**, with suitable features for each user role. Security is prioritized using **Counter Mode (CTR) Encryption**, **OTP-based downloads**, and **dynamic watermarking**.

---

## 🚀 Key Features

###  Security

- **Counter Mode Encryption:** Ensures confidentiality and integrity of uploaded papers.
- **Multi-Layered Authentication:**
  - JWT-based secure login
  - Optional paper-specific password
  - OTP verification for secure downloads
- **Dynamic Watermarking:** Adds user-specific watermarks (email, IP, timestamp) on viewed papers.
- **Audit Logging:** All key activities (logins, uploads, downloads, role changes) are logged for transparency.

### Role-Based Dashboards

#### Admin Dashboard
- Full user management (add/edit/delete roles)
- Bulk upload of users via CSV
- Academic structure management: Departments, Courses, Sections
- Complete audit log viewer
- Overview of all uploaded question papers

#### Teacher Dashboard
- Upload question papers with encryption
- Assign papers to specific sections/students
- Set paper validity and optional passwords
- Manage papers (view, delete)
- Schedule and manage exam sessions

#### Student Dashboard
- View accessible question papers based on assigned section/time window
- Secure online viewing with dynamic watermarking
- Paper download via OTP & password verification (if enabled)

---

## 🛠️ Tech Stack

Built using the **MERN Stack**:

| Layer       | Technologies Used                              |
|-------------|-------------------------------------------------|
| Frontend    | React, Material-UI (MUI), Axios, react-pdf     |
| Backend     | Node.js, Express.js, MongoDB, JWT, CORS        |
| Security    | Encryption Algorithm, OTP, JWT       |

---

## 🔐 Encryption Technique: Counter Mode (CTR)

QUARK uses the **Counter (CTR)  encryption**, which offers:

- High performance with parallel encryption.
- Strong security against tampering and unauthorized access.
- Authenticated encryption for both confidentiality and data integrity.

Even with basic passwords, brute-forcing is computationally infeasible due to the complexity of the algorithm.

---

## 📡 Real-Time Examination Workflow

-  **Teacher Uploads:**
   - Uploads encrypted papers with a validity window and optional password.

- **Student Access:**
   - Logs in during exam time.
   - If authorized, views the decrypted paper with a dynamic watermark.
   - OTP is required to download (if permitted).

- **Audit Logs:**
   - Every action (access, view, download, failed attempt) is logged.

This ensures **full traceability**, **access control**, and **data security** throughout the exam lifecycle.

---

## 📂 Project Status

- Core functionalities implemented
- Secure login and role-based access in place
- Encryption and watermarking tested
- Deployment-ready (MongoDB, Node.js, React)

---
