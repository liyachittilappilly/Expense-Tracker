# **Project Report: In-Depth Analysis of the Development of an AI-Powered Expense Tracker**

## **1. Introduction**

### **1.1. Project Vision and Goals**

This document provides a comprehensive technical overview of the development of the Expense Tracker, a sophisticated web application built to provide users with a powerful and intuitive tool for personal financial management. The project's core vision was to move beyond simple data entry and create an intelligent assistant that not only tracks expenses but also provides actionable, AI-driven insights.

The primary objectives were:

1. **Develop a Secure, Multi-User Platform:** Implement a robust authentication system to ensure user data is private and secure.
2. **Provide Intuitive Data Management:** Create a seamless user interface for adding, editing, and deleting financial transactions.
3. **Visualize Financial Data:** Integrate dynamic charts and tables to help users easily understand their spending patterns.
4. **Integrate Artificial Intelligence:** Leverage a powerful language model to offer personalized financial advice based on a user's actual data.
5. **Ensure a Modern User Experience:** Deliver a responsive, visually appealing, and animated interface that makes financial management engaging rather than a chore.

### **1.2. Technology Stack**

The technology stack was carefully chosen to meet the project's goals, prioritizing developer experience, performance, and scalability.

- **Framework:** **Next.js 14** with the App Router was selected for its hybrid rendering capabilities (Server-Side Rendering and Static Site Generation), integrated API routes, and file-system-based routing, which simplified the development of a full-stack application.
- **Language:** **TypeScript** was used throughout the project to ensure type safety, reduce runtime errors, and improve code maintainability and developer productivity, especially in a growing codebase.
- **UI Library:** **React 19** was used for building the interactive user interface. Its component-based architecture facilitated the creation of reusable UI elements.
- **Styling:** **Tailwind CSS** was chosen for its utility-first approach, enabling rapid and consistent styling directly within the HTML. This was complemented by **shadcn/ui**, a component library that provides beautifully designed, accessible, and unstyled components built on top of Tailwind CSS.
- **Database:** **MongoDB**, a NoSQL document database, was selected for its flexible schema, which is ideal for storing varied transaction data, and its scalability. The official `mongodb` Node.js driver was used for database interaction.
- **Authentication:** **Firebase Authentication** was integrated for its ease of use, comprehensive feature set (including multiple sign-in providers like Google), and robust security.
- **AI Integration:** The **Google Gemini API** (specifically the `gemini-1.5-flash-latest` model) was chosen for its advanced reasoning capabilities and generous free tier, making it ideal for providing high-quality financial insights.
- **Animations:** **Framer Motion** was used to add fluid, declarative animations to the UI, enhancing the overall user experience.

---

## **2. Initial Setup and Dependency Management**

The project's foundation was a pre-existing Next.js boilerplate. A significant initial effort was dedicated to stabilizing the development environment by resolving critical dependency conflicts.

### **2.1. React 19 Peer Dependency Conflicts**

Upon running `npm install`, the build process failed due to peer dependency conflicts between `react@19.1.0` and several key packages.

- **`react-day-picker@8.10.1`:** This package, a dependency for the `Calendar` component, required React version `^16.8.0 || ^17.0.0 || ^18.0.0`.

  - **Solution:** The conflict was resolved by upgrading the package to the latest version (`9.8.0`) and using the `--legacy-peer-deps` flag. This flag instructs NPM to ignore peer dependency mismatches, which was necessary for several other packages that had not yet been updated for React 19.
  - **Code Refactoring:** The upgrade to `react-day-picker` v9 introduced breaking changes. The `components/ui/calendar.tsx` file was refactored to align with the new API. For instance, `classNames` properties were renamed (e.g., `caption_label` to `month_caption`) and the `Chevron` component for navigation had to be explicitly passed in the `components` prop.

  ```tsx
  // components/ui/calendar.tsx - Excerpt of changes for react-day-picker v9
  <DayPicker
    // ...
    classNames={{
      // old: caption_label: "text-sm font-medium",
      month_caption: "text-sm font-medium", // new
      // old: nav_button_previous: "absolute left-1",
      button_previous: "absolute left-1", // new
      // ... other class name changes
    }}
    components={{
      Chevron: ({ orientation, ...rest }) => {
        const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
        return <Icon className="h-4 w-4" {...rest} />;
      },
    }}
    // ...
  />
  ```

- **`recharts` Build Error:** The charting library produced a build error: `Module not found: Can't resolve 'react-is'`. This occurred because `recharts` has a transitive dependency on `react-is` but did not list it in a way that modern package managers would always correctly hoist.

  - **Solution:** This was resolved by explicitly adding `react-is` to the project's `package.json` with `npm install react-is --legacy-peer-deps`.

---

## **3. Database Integration with MongoDB**

### **3.1. Connection Management**

A robust and efficient connection to the MongoDB database was established in `lib/mongodb.ts`. To prevent creating a new database connection on every API request in a serverless environment, a global caching strategy was implemented.

```typescript
// lib/mongodb.ts - Connection Caching Strategy
import { MongoClient } from "mongodb";

// ... (URI check)

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development, use a global variable to preserve the value across HMR reloads.
  // @ts-ignore
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    // @ts-ignore
    global._mongoClientPromise = client.connect();
  }
  // @ts-ignore
  clientPromise = global._mongoClientPromise;
} else {
  // In production, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
```

### **3.2. Data Modeling and Seeding**

A simple `Expense` interface was defined in `lib/models/expense.ts` to ensure type safety when handling transaction data.

```typescript
// lib/models/expense.ts
import { ObjectId } from "mongodb";

export interface Expense {
  _id: ObjectId;
  description: string;
  amount: number;
  category: string;
  date: Date;
}
```

To populate the database with mock data for development, a seeding script (`scripts/seed.ts`) was created. This script first deletes all existing documents in the `expenses` collection to ensure a clean state, then inserts an array of predefined expense objects.

The execution of this script faced challenges due to Node.js's native handling of TypeScript. The final, successful command in `package.json` utilized `tsx`, a modern runtime that handles TypeScript compilation and environment variable loading seamlessly:

```json
// package.json - seed script
"scripts": {
  "seed": "tsx --env-file .env.local scripts/seed.ts"
}
```

---

## **4. Backend API Development with Next.js API Routes**

A RESTful API was implemented using Next.js API Routes to handle all data persistence logic, effectively separating the frontend from the database.

### **4.1. Transaction API (CRUD)**

- **`app/api/transactions/route.ts`**:

  - `GET`: Fetches all transactions. It connects to MongoDB, queries the `expenses` collection, and returns the data as a JSON array.
  - `POST`: Creates a new transaction. It reads the new transaction data from the request body, adds a `createdAt` timestamp, inserts it into the database, and returns the newly created document.

- **`app/api/transactions/[id]/route.ts`**: This dynamic route handles operations on a single transaction.

  - `PUT`: Updates an existing transaction identified by `[id]`.
  - `DELETE`: Deletes a transaction identified by `[id]`.

- **`app/api/transactions/all/route.ts`**:

  - `DELETE`: A custom endpoint created to handle the "Clear All Transactions" feature. It uses MongoDB's `deleteMany({})` to efficiently remove all documents from the `expenses` collection.

```typescript
// Example from app/api/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(); // Database name inferred from MONGODB_URI
    const expenses = await db.collection("expenses").find({}).toArray();
    return NextResponse.json(expenses);
  } catch (error) {
    // ... error handling
  }
}
```

---

## **5. AI-Powered Financial Insights with Google Gemini**

### **5.1. Gemini API Integration**

A core feature of the application is its ability to provide AI-driven analysis. This was achieved by integrating Google's Gemini API.

- **API Endpoint (`app/api/ask-ai/route.ts`)**: This endpoint serves as the backend for all AI interactions.
  1. **Data Fetching**: It first retrieves all of the user's expense transactions from MongoDB.
  2. **Edge Case Handling**: It includes a check to see if the user has any transactions. If not, it returns a friendly message instead of calling the AI.
  3. **Prompt Engineering**: It formats the fetched expense data into a clean JSON string and embeds it within a carefully crafted prompt. This prompt instructs the AI to act as an expert financial assistant and answer the user's question based on the provided data.
  4. **API Call**: It uses the `@google/generative-ai` SDK to send the complete prompt to the `gemini-1.5-flash-latest` model.
  5. **Response Handling**: It parses the text response from the AI and returns it to the frontend.

```typescript
// Prompt Engineering in app/api/ask-ai/route.ts
const fullPrompt = `You are an expert financial assistant. Analyze the following expense data and answer the user's question. Provide a concise and helpful response. Do not use markdown and dont give too long texts, just simple english with clear 

Expense Data:
${JSON.stringify(expenses, null, 2)}

User Question:
${prompt}`;

const result = await model.generateContent(fullPrompt);
```

### **5.2. Frontend Implementation**

On the frontend, the `AIComponent` (`components/ai-component.tsx`) provides a simple input field and button, allowing users to submit questions. It manages loading and response states, displaying the AI's answer in a card.

---

## **6. User Authentication with Firebase**

A secure and reliable authentication system was implemented using Firebase.

### **6.1. Firebase Configuration**

The Firebase app was initialized in `lib/firebase.ts`, loading API keys and other credentials from `.env.local`. Environment variables were prefixed with `NEXT_PUBLIC_` to make them accessible on the client-side.

### **6.2. Authentication Context and Hooks**

To manage authentication state globally, a React Context was created in `context/auth-context.tsx`.

- **`AuthProvider`**: This component wraps the entire application. It uses Firebase's `onAuthStateChanged` listener to detect changes in the user's login state (login, logout). It stores the user object and a `loading` state in the context.
- **`useAuth` Hook**: A custom hook that allows any component in the tree to easily access the current `user` and `loading` state.

### **6.3. Sign-In/Sign-Up Pages**

The authentication pages were refactored to use Firebase functions while preserving their original UI design.

- **`app/auth/signin/page.tsx`**: The form's `onSubmit` handler was wired to `signInWithEmailAndPassword`. A "Sign in with Google" button was added, which triggers a popup flow using `signInWithPopup` and the `GoogleAuthProvider`.
- **`app/auth/signup/page.tsx`**: The sign-up form uses `createUserWithEmailAndPassword`. After a successful creation, it also uses `updateProfile` to set the user's display name.

### **6.4. Protected Routes**

The main dashboard at `app/page.tsx` was secured.

```tsx
// Protecting the dashboard in app/page.tsx
const { user, loading } = useAuth();
const router = useRouter();

useEffect(() => {
  if (!loading && !user) {
    router.push("/auth/signin"); // Redirect if not logged in
  }
}, [user, loading, router]);

if (loading || !user) {
  return <p>Loading...</p>; // Or a spinner component
}
```

---

## **7. UI/UX Enhancements**

### **7.1. Glassmorphism and Animations**

To create a modern and visually appealing interface, a glassmorphism effect was implemented.

- **CSS**: A `.glass-card` class was added to `app/globals.css`. This class applies a semi-transparent background color and a `backdrop-filter: blur()` to create the frosted glass effect.

  ```css
  /* app/globals.css */
  .glass-card {
    background-color: hsl(var(--card) / 0.5);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  ```

- **Animations**: The `framer-motion` library was used to add subtle entry animations. Each major section of the dashboard was wrapped in a `motion.div` component with a staggered `delay`, causing them to fade in and slide up sequentially as the page loads.

  ```tsx
  // Animation implementation in app/page.tsx
  <motion.div
    initial="hidden"
    animate="visible"
    transition={{ duration: 0.5, delay: 0.1 }}
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    }}
    className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
  >
    {/* ... Card components with the glass-card class ... */}
  </motion.div>
  ```

### **7.2. Layout**

The main layout in `app/layout.tsx` was structured using Flexbox to ensure the new `Footer` component would always stick to the bottom of the page, even on pages with little content.

---

## **8. Conclusion**

The Expense Tracker project successfully integrated a complex set of modern web technologies to deliver a feature-rich, intelligent, and user-friendly application. The development journey involved overcoming significant challenges in dependency management, asynchronous operations, and third-party API integration.

The final product is a robust platform that provides secure authentication, seamless data management, and unique AI-powered financial insights. The application's architecture is scalable and maintainable, providing a solid foundation for future enhancements, such as advanced budgeting tools, financial goal setting, and multi-account integration. This project serves as a strong testament to the power of modern web development stacks in creating sophisticated and practical real-world applications.
