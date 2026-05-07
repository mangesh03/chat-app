# Server Folder Architecture & Flow

Here is a step-by-step explanation of how your `server` folder is structured, how it works, and how all the files are connected. This structure follows a classic Node.js + Express + MongoDB architecture.

## 1. The Entry Point: `index.js`
This is the heart of your server. When you run `npm run dev` or `npm start`, this is the file that Node.js executes first.
*   **What it does:**
    *   It imports necessary libraries like `express` (the web framework), `cors` (allows your frontend to talk to your backend), and `dotenv` (loads secret variables).
    *   It calls `connectDB()` (imported from `config/db.js`) to establish a connection to your database.
    *   It sets up middleware: `app.use(express.json())` tells the server to understand incoming JSON data (like when a user submits a form).
    *   It defines the base URL for your authentication routes: `app.use('/api/auth', require('./routes/auth'))`. This means any request starting with `/api/auth` will be handled by the `routes/auth.js` file.
    *   Finally, it tells the server to start listening for requests on a specific port (usually 5000).

## 2. Configuration & Database
*   **`.env`**: This is where you keep your secrets. It contains your `PORT`, `MONGO_URI` (database connection string), and `JWT_SECRET` (used for creating secure login tokens). *Connection: `index.js` and `db.js` read this file to know how to connect and run.*
*   **`config/db.js`**: This file contains the logic to connect to your database using Mongoose.
    *   *Note:* You are currently using `mongodb-memory-server` here. This means your server is spinning up a temporary, in-memory database every time it starts. When the server stops, all data is lost.
    *   *Connection:* Imported and executed in `index.js` right when the server starts.

## 3. The Data Structure: `models/User.js`
Before you can save a user to the database, MongoDB needs to know what a "User" looks like.
*   **What it does:** It uses Mongoose to define a schema. It says that every user must have a `name` (string), `email` (string, unique), and `password` (string). It also automatically adds `createdAt` and `updatedAt` timestamps.
*   **Connection:** This file is imported into `routes/auth.js` so that the route logic can actually create, find, or verify users in the database.

## 4. Handling Requests: `routes/auth.js`
This file contains the actual business logic for authentication. It listens for specific HTTP requests and decides what to do.
*   **`POST /register`**:
    *   Checks if the user provided a valid name, email, and a password of at least 6 characters.
    *   Checks if the user already exists in the database.
    *   Hashes (encrypts) the password using `bcryptjs`.
    *   Saves the new user to the database using the `User` model.
    *   Creates a JWT (JSON Web Token) and sends it back to the client so they are logged in.
*   **`POST /login`**:
    *   Finds the user by their email.
    *   Compares the provided password with the hashed password in the database.
    *   If correct, generates a JWT and sends it back.
*   **`GET /me`**:
    *   This route returns the details of the currently logged-in user. It is protected by the `authMiddleware`.
*   **Connection:** This file is "mounted" into `index.js` at the `/api/auth` path. It uses `models/User.js` to talk to the database and `middleware/auth.js` to protect certain routes.

## 5. Security Check: `middleware/auth.js`
Middleware is code that runs *between* receiving a request and sending a response. This specific file acts as a bouncer for protected routes (like getting a user's profile).
*   **What it does:**
    *   It looks at the incoming request and checks for an `Authorization` header containing a token.
    *   If there's no token, it rejects the request (Status 401: Unauthorized).
    *   If there is a token, it tries to verify it using your `JWT_SECRET`.
    *   If valid, it extracts the user's ID from the token, attaches it to the request (`req.user = decoded`), and calls `next()` to allow the request to proceed to the actual route handler (like the `/me` route).
*   **Connection:** Used in `routes/auth.js` specifically on the `router.get('/me', authMiddleware, ...)` route.

---

## Summary: The Flow of a Request
Let's say a user tries to log in. Here is the step-by-step path the data takes:

1.  **Client (Frontend)** sends a `POST` request with an email and password to `http://localhost:5000/api/auth/login`.
2.  **`index.js`** receives the request. It sees it starts with `/api/auth` and forwards it to `routes/auth.js`.
3.  **`routes/auth.js`** sees the `/login` path. It validates the input.
4.  **`routes/auth.js`** uses `models/User.js` to look up the email in the MongoDB database (connected via `config/db.js`).
5.  If the password is correct, it generates a token using the secret from `.env`.
6.  The response (token + user data) is sent back to the client.

If the client then tries to access their profile via `GET /api/auth/me`:
1.  **`index.js`** routes it to **`routes/auth.js`**.
2.  Before the route code runs, **`middleware/auth.js`** intercepts it, checks the token, and verifies who the user is.
3.  If verified, the **`routes/auth.js`** code runs, fetches the user from the database using **`models/User.js`**, and sends the data back.
