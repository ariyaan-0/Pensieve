# Pensieve - A video sharing platform 

_A practice project to comprehand backend workflow better!_

## Best Practices & Steps

## 1. Database Communication Workflow
- **Always expect failures** — DB connections and queries can fail due to network, credentials, or query issues.
- **Wrap all DB calls in try/catch** to prevent app crashes and provide clear error messages.
- **Use `async/await`** for cleaner, synchronous-looking asynchronous code.
- **Create a dedicated DB connection function** in a `db/` directory.
- **Connect to DB before starting the server** — only start listening to requests after a successful connection.
- **In `index.js`**, call the DB connection function and use `.then().catch()` to start the server or handle connection errors.

---

## 2. Express Configuration with `use()`
- Use `app.use()` to register middlewares globally.
- Always configure these in the early stage of the app:
  1. **`express.json()`** → Parse JSON request bodies.
  2. **`express.urlencoded({ extended: true })`** → Parse URL-encoded form data (HTML forms).
  3. **`express.static()`** → Serve static assets from a public directory.
  4. **`cookie-parser`** → Parse cookies for authentication/session handling.
- Keep middleware setup **at the top** before route definitions.

---

## 3. Utility Function for `asyncHandler`
- Avoid repetitive `try/catch` in every async route handler.
- Create a utility function (`utils/asyncHandler.js`) to wrap async controllers.
- This wrapper automatically catches errors and forwards them to Express error middleware.
- Use `asyncHandler` for **every async route** to maintain a clean and consistent controller structure.

---

## 4. Standardizing API Errors and Responses
- Create a **custom API Error class** (`utils/ApiError.js`):
  - Stores `statusCode`, `message`, `errors[]`, and `stack trace`.
  - Ensures all errors follow the same structure.
- Create a **custom API Response class** (`utils/ApiResponse.js`):
  - Stores `statusCode`, `data`, `message`, and `success` flag.
  - Makes all successful responses consistent.
- **Benefits:**
  - Easier frontend integration (predictable response shape).
  - Simplified logging & debugging.
