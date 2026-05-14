# ReimburseEase 🚀

**ReimburseEase** is a premium, full-stack expense management platform designed to streamline the reimbursement process for employees, managers, and administrators. Built with the MERN stack, it features intelligent OCR receipt scanning, multi-currency support, and a robust role-based approval workflow.

---

## ✨ Key Features

### 🏢 For Employees
- **Intelligent OCR Scanner**: Submit expenses by simply uploading a receipt. Powered by **Tesseract.js**, it auto-fills amount and category.
- **Responsive Dashboard**: Track reimbursement status in real-time with beautiful charts and status badges.
- **Mobile-First Experience**: Fully responsive UI with a persistent bottom navigation bar and mobile card views for easy use on the go.

### 👥 For Managers
- **Pending Approvals**: View and process team expense requests with a single click.
- **Approval Timeline**: Track the history of each expense through the multi-stage approval chain.
- **Rejection Feedback**: Provide detailed comments when an expense requires revision.

### 🛡️ For Administrators
- **Dynamic Approval Rules**: Configure complex routing rules (sequential, percentage-based, or specific approvers) based on expense amount.
- **User Management**: Control roles (Admin, Manager, Employee) and manage team hierarchies.
- **Data Export**: Generate and download comprehensive PDF reports of all company expenses.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Bootstrap 5, Chart.js, Tesseract.js (OCR), Socket.io-client.
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT Authentication, Socket.io.
- **Design**: Modern UI with Glassmorphism, Responsive CSS Grid/Flexbox, and custom design tokens.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)

### 1. Clone the repository
```bash
git clone <repository-url>
cd Hackathon
```

### 2. Setup Backend
```bash
cd backend
npm install
# Create a .env file based on your environment needs
npm run dev
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 📁 Project Structure

```text
Hackathon/
├── backend/            # Express.js server & MongoDB models
│   ├── controllers/    # Request handlers
│   ├── models/         # Database schemas
│   ├── routes/         # API endpoints
│   └── utils/          # Middleware & Helpers
├── frontend/           # React + Vite application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── context/    # Auth & Global state
│   │   ├── pages/      # Route-level views
│   │   └── utils/      # API configurations
└── README.md           # You are here
```

---

## 📱 Responsive Design Viewports
- **Desktop (> 992px)**: Sidebar-driven high-density view.
- **Tablet (768px - 991px)**: Collapsible navigation with fluid grid layouts.
- **Mobile (< 768px)**: Bottom-tab navigation, card-based data tables, and Floating Action Buttons (FAB).

---

## 📄 License
This project was developed for the Hackathon 2026. All rights reserved.
