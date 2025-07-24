# AI-Powered Expense Tracker

Welcome to the AI-Powered Expense Tracker, a modern web application designed to help you manage your finances with ease and intelligence. This application allows you to track your income and expenses, visualize your spending patterns, and get personalized financial insights powered by Google's Gemini AI.

![Expense Tracker Dashboard](./public/placeholder.jpg)

## ✨ Features

-   **Secure User Authentication**: Sign up and log in using your email and password or with your Google account, powered by Firebase Authentication.
-   **Intuitive Transaction Management**: Easily add, edit, and delete your income and expense transactions.
-   **Interactive Dashboard**: Visualize your financial health at a glance with dynamic cards and charts showing your total income, expenses, and balance.
-   **AI-Powered Insights**: Ask questions about your spending habits in plain English and receive intelligent, personalized answers from the integrated Gemini AI assistant.
-   **Category Breakdown**: See detailed charts that break down your expenses by category and show the percentage distribution of your spending.
-   **Modern UI/UX**: A beautiful, responsive interface with a glassmorphism design and subtle animations for a smooth user experience.

## 🏗️ Architectural Overview

This application is built as a full-stack Next.js project, leveraging its features to create a cohesive and performant experience.

-   **Frontend**: The user interface is built with **React** and **TypeScript**. Components from **shadcn/ui** provide the building blocks, which are styled with **Tailwind CSS**. **Framer Motion** is used for UI animations. The entire frontend is client-side rendered and interacts with the backend through API calls.

-   **Backend (API Routes)**: The backend logic is handled by **Next.js API Routes**. These serverless functions are responsible for all communication with the database and external services. This includes all CRUD operations for transactions and proxying requests to the Google Gemini API.

-   **Database**: **MongoDB** serves as the database. A single, cached connection instance is managed in `lib/mongodb.ts` to ensure efficient database communication from the serverless API routes.

-   **Authentication Flow**: **Firebase Authentication** handles user identity. When a user signs up or logs in, Firebase provides a user object. A client-side `AuthContext` uses the `onAuthStateChanged` listener to manage the user's session state globally across the application, protecting routes and personalizing the user experience.

-   **AI Integration**: The AI features are powered by the **Google Gemini API**. The backend API route `/api/ask-ai` securely handles requests, fetches user data, constructs a detailed prompt, and sends it to the Gemini API, returning only the AI's response to the client.

## 🛠️ Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) 14 (with App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **UI Library**: [React](https://reactjs.org/) 19
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
-   **Database**: [MongoDB](https://www.mongodb.com/)
-   **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
-   **AI**: [Google Gemini API](https://ai.google.dev/)
-   **Animations**: [Framer Motion](https://www.framer.com/motion/)

## 🚀 Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

-   [Node.js](https://nodejs.org/en/) (v18 or later)
-   [npm](https://www.npmjs.com/)
-   Access to MongoDB, Google Gemini, and Firebase services.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/expense-tracker.git
cd expense-tracker
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

*Note: The `--legacy-peer-deps` flag is currently needed to resolve some peer dependency conflicts with React 19.*

### 3. Run the Development Server

You will need to have your environment variables set up locally for the application to connect to the necessary services.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔮 Future Enhancements

-   **Budgeting Tools**: Implement features for setting monthly or category-specific budgets and tracking progress against them.
-   **Financial Goal Setting**: Allow users to set financial goals (e.g., "Save for a vacation") and track their contributions.
-   **Data Export**: Add more options for exporting data, such as PDF reports or integrations with other financial software.
-   **Recurring Transactions**: Add support for automatically logging recurring transactions (e.g., monthly subscriptions or bills).
-   **Advanced Search & Filtering**: Implement more powerful search and filtering options for the transaction history.

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements or find any issues, please open an issue or submit a pull request.

---

Thank you for checking out the AI-Powered Expense Tracker! 