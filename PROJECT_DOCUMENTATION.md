# MiniBlog — Project Documentation

## 1. Project Overview

### What the System Does
MiniBlog is a lightweight blogging web application. Visitors can read all posts published on the site. Registered users can sign up, log in, write their own posts, and delete posts they own.

### Problem It Solves
- Provides a minimal, easy-to-use platform to publish and read short blog posts.
- Avoids the complexity of large CMS platforms for users who only need basic create/read/delete with authenticated authoring.

### Target Users
- **Visitors (Anonymous Users):** Read public posts and browse the homepage.
- **Registered Users (Authors):** Sign up, log in, publish posts, and delete their own posts.

### Scope

**In-Scope (visible in the artifacts):**
- User signup with username, email, and password.
- User login with email and password.
- Browser-based session persistence.
- Logout.
- Listing all posts on the homepage.
- Viewing a single post.
- Creating a post (authenticated only).
- Deleting a post the user owns (authenticated only).
- Inline validation messages.
- Auth-aware top navigation.

**Out-of-Scope (not present in the artifacts):**
- Editing posts.
- Comments, likes, tags, categories, search.
- Password reset and email verification.
- Profiles, account settings.
- Pagination, sorting, drafts, filters.
- Roles or admin functionality.
- Image/file uploads.

---

## 2. System Understanding

### Main User Journey
A new visitor arrives, browses the latest posts on the homepage, signs up to become an author, gets logged in automatically, writes a post, publishes it, opens its detail page, optionally deletes it, and finally logs out. Returning users follow the same flow but log in instead of signing up.

### End-to-End Flow (Step-by-Step)
1. The user opens the homepage `/`.
2. The page displays all posts (newest first), each with title, author, date, and a content preview.
3. If there are no posts, the user sees an empty-state message.
4. The user clicks **Sign up** or **Login** in the navigation.
5. On the signup page, the user enters a username, email, and password (min 6 chars) and clicks **Sign up**.
6. On success, the user is logged in and redirected to the homepage.
7. On the login page, the user enters email and password and clicks **Log in**.
8. On success, the user is logged in and redirected to the homepage.
9. While logged in, the navigation shows **New Post**, a "Hi, <username>" greeting, and **Logout**.
10. The user clicks **New Post** to open the create-post page.
11. The user enters a title and content and clicks **Publish**.
12. On success, the user is redirected to the new post's detail page.
13. The user clicks any post on the homepage to open its detail page.
14. The detail page shows title, author, date, and full content.
15. If the logged-in user is the author, a **Delete** button appears.
16. The author clicks **Delete** and confirms in the browser dialog.
17. The post is deleted and the user is redirected to the homepage.
18. The user clicks **Logout** to end the session and return to the anonymous state.

---

## 3. Module Breakdown (UI Only)

### Authentication
- **Signup Page**
- **Login Page**
- **Logout (Navigation Action)**

### Posts
- **Home / Posts Listing Page**
- **Post Detail Page**
- **Create Post Page**
- **Delete Post (Action on Post Detail Page)**

### Shell / Navigation
- **Top Navigation Bar**

---

## 4. Module Details

### 4.1 Signup Page
**Basic Info**
- **Name:** Signup Page
- **Purpose:** Allow a new visitor to create an account and get logged in.
- **User Roles:** Anonymous Visitor.
- **Entry:** Click **Sign up** in the navigation, or open `/signup.html`.
- **Exit:** Success → homepage `/`. If already logged in → auto-redirect to `/`.

**Functional Behavior — Step-by-Step Flow**
1. The user opens the signup page.
2. If already logged in, the user is auto-redirected to the homepage.
3. The user fills the form fields.
4. The user clicks **Sign up**.
5. On success, the session is stored and the user is redirected to the homepage.
6. On failure, an inline error message is displayed.

**UI Elements**
- Top navigation.
- Heading "Create your account".
- Inline error banner.
- Inputs:
  - **Username** (text, required, minlength 3, maxlength 30)
  - **Email** (email, required)
  - **Password (min 6 chars)** (password, required, minlength 6)
- **Sign up** button.
- Link "Already have an account? Log in".

**Input/Output**
- Inputs are trimmed on the client (except password).
- Output: redirect on success; error banner on failure.

**Validation Rules**
- All three fields required.
- Password must be at least 6 characters.
- Username and email must not already be in use.

---

### 4.2 Login Page
**Basic Info**
- **Name:** Login Page
- **Purpose:** Allow an existing user to start a new session.
- **User Roles:** Anonymous Visitor with an existing account.
- **Entry:** Click **Login** in the navigation, or open `/login.html`.
- **Exit:** Success → homepage `/`. If already logged in → auto-redirect to `/`.

**Functional Behavior — Step-by-Step Flow**
1. The user opens the login page.
2. If already logged in, the user is auto-redirected to the homepage.
3. The user enters email and password.
4. The user clicks **Log in**.
5. On success, the session is stored and the user is redirected to the homepage.
6. On failure, an inline error message is displayed.

**UI Elements**
- Top navigation.
- Heading "Log in".
- Inline error banner.
- Inputs:
  - **Email** (email, required)
  - **Password** (password, required)
- **Log in** button.
- Link "Don't have an account? Sign up".

**Input/Output**
- Email is trimmed on the client.
- Output: redirect on success; error banner on failure.

**Validation Rules**
- Email and password are both required.
- Credentials must match an existing account.

---

### 4.3 Logout (Navigation Action)
**Basic Info**
- **Name:** Logout
- **Purpose:** End the current user session.
- **User Roles:** Logged-in User.
- **Entry:** Click **Logout** in the navigation.
- **Exit:** Redirected to the homepage as an anonymous visitor.

**Functional Behavior — Step-by-Step Flow**
1. The user clicks **Logout**.
2. The session is cleared in the browser.
3. The user is redirected to the homepage.
4. The navigation re-renders showing **Login** and **Sign up**.

**UI Elements**
- **Logout** button in the navigation.

**Input/Output**
- No input. Output: session cleared and navigation updated.

**Validation Rules**
- Button is rendered only when a session is active.

---

### 4.4 Home / Posts Listing Page
**Basic Info**
- **Name:** Home / Posts Listing
- **Purpose:** Display all posts in reverse chronological order.
- **User Roles:** Anonymous Visitor and Logged-in User.
- **Entry:** Open `/`, or click the **MiniBlog** brand link.
- **Exit:** Click a post (→ detail), or any navigation link.

**Functional Behavior — Step-by-Step Flow**
1. The page loads and fetches the post list.
2. If posts exist, each is rendered as a card.
3. If no posts exist, an empty-state message is shown.
4. If the fetch fails, an error message replaces the list.
5. Clicking a post title opens its detail page.

**UI Elements**
- Top navigation.
- Heading "Latest posts".
- Post cards (title link, author, date, 240-char preview).
- Empty-state: "No posts yet. Be the first to write one!"
- Error: "Failed to load posts: …"

**Input/Output**
- No input. Output: rendered list, empty state, or error.

**Validation Rules**
- Read-only view; no validation.

---

### 4.5 Post Detail Page
**Basic Info**
- **Name:** Post Detail
- **Purpose:** Show a single post and allow the author to delete it.
- **User Roles:** Anonymous Visitor and Logged-in User.
- **Entry:** Click a post on the homepage, or open `/post.html?id=<id>`.
- **Exit:** "← Back to all posts" link, navigation links, or successful delete.

**Functional Behavior — Step-by-Step Flow**
1. The page reads `id` from the URL.
2. If `id` is missing, "Missing post id." is shown.
3. The post is fetched and rendered.
4. If the logged-in user is the author, the **Delete** button is shown.
5. Clicking **Delete** opens a browser confirmation dialog.
6. On confirm, the post is deleted and the user is redirected to the homepage.
7. On fetch failure, an error message is shown.

**UI Elements**
- Top navigation.
- Post card: title, author, date, full content.
- **Delete** button (author only).
- "← Back to all posts" link.
- Error block.

**Input/Output**
- Input: `id` query parameter; confirm/cancel from the browser dialog.
- Output: post rendering, error message, or redirect after delete.

**Validation Rules**
- A valid `id` query parameter is required.
- Only the author sees and can use **Delete**.

---

### 4.6 Create Post Page
**Basic Info**
- **Name:** Create Post
- **Purpose:** Allow a logged-in user to publish a new post.
- **User Roles:** Logged-in User.
- **Entry:** Click **New Post** in the navigation, or open `/create.html`.
- **Exit:** Success → new post's detail page. Not logged in → redirect to `/login.html`.

**Functional Behavior — Step-by-Step Flow**
1. The user opens the create-post page.
2. If not logged in, the user is redirected to the login page.
3. The user enters a title and content.
4. The user clicks **Publish**.
5. On success, the user is redirected to the new post's detail page.
6. On failure, an inline error message is displayed.
7. If the failure message references a token, the session is cleared and the user is redirected to login after a short delay.

**UI Elements**
- Top navigation.
- Heading "Write a new post".
- Inline error banner.
- Inputs:
  - **Title** (text, required, maxlength 200)
  - **Content** (textarea, required)
- **Publish** button.

**Input/Output**
- Inputs are trimmed on the client.
- Output: redirect on success; error banner on failure.

**Validation Rules**
- Title and content are both required.
- A valid session is required.

---

### 4.7 Delete Post (Action)
**Basic Info**
- **Name:** Delete Post
- **Purpose:** Permanently remove a post owned by the user.
- **User Roles:** Logged-in User who is the author.
- **Entry:** Click **Delete** on the post detail page.
- **Exit:** Success → homepage. Failure → error banner on the same page.

**Functional Behavior — Step-by-Step Flow**
1. The author clicks **Delete**.
2. A browser dialog "Delete this post?" appears.
3. If the author cancels, no action is taken.
4. If the author confirms, the delete request is sent.
5. On success, the user is redirected to the homepage.
6. On failure, an error message is displayed.

**UI Elements**
- **Delete** button (author only).
- Browser-native confirmation dialog.
- Inline error banner.

**Input/Output**
- No fields. Output: redirect on success or error message on failure.

**Validation Rules**
- Author-only action.
- A valid session is required.

---

### 4.8 Top Navigation Bar
**Basic Info**
- **Name:** Top Navigation Bar
- **Purpose:** Provide auth-aware navigation across all pages.
- **User Roles:** Anonymous Visitor and Logged-in User.
- **Entry:** Visible on every page.
- **Exit:** Clicking a link navigates to the targeted page.

**Functional Behavior — Step-by-Step Flow**
1. On every page load, the navigation renders based on session state.
2. Anonymous → **Login**, **Sign up**.
3. Logged in → **New Post**, "Hi, <username>", **Logout**.
4. Clicking **MiniBlog** brand returns to the homepage.

**UI Elements**
- **MiniBlog** brand link.
- Right side: dynamic auth links / greeting / **Logout**.

**Input/Output**
- Click events. Output: page navigation or session clear.

**Validation Rules**
- Greeting and **Logout** rendered only when the user is logged in.
- Username in greeting is HTML-escaped.

---

## 5. Scenarios (Per Module)

### 5.1 Signup Page
- **Positive:** Valid username/email/password (≥ 6 chars) → account created, user logged in, redirected.
- **Negative:** Empty fields → "username, email and password are required". Short password → "Password must be at least 6 characters". Duplicate username/email → "Username or email already in use".
- **Boundary:** Password exactly 6 chars → accepted. Username length 3 / 30 enforced at input level.
- **Edge:** Already logged-in user opening this page → auto-redirected to `/`.

### 5.2 Login Page
- **Positive:** Correct credentials → logged in, redirected.
- **Negative:** Empty fields → "email and password are required". Wrong credentials → "Invalid email or password".
- **Boundary:** Email lookup is case-sensitive.
- **Edge:** Already logged-in user opening this page → auto-redirected to `/`.

### 5.3 Logout
- **Positive:** Click → session cleared, navigation re-renders for anonymous, redirect to `/`.
- **Negative:** None visible.
- **Edge:** Multiple tabs do not auto-sync until reload.

### 5.4 Home / Posts Listing
- **Positive:** Posts exist → list rendered newest first.
- **Negative:** Fetch failure → "Failed to load posts: …".
- **Boundary:** Content > 240 chars → preview truncated with ellipsis.
- **Edge:** No posts → empty-state message. Special characters escaped.

### 5.5 Post Detail
- **Positive:** Valid `id` → post rendered. Author → **Delete** visible.
- **Negative:** Missing `id` → "Missing post id.". Non-existent `id` → "Failed to load post: Post not found".
- **Boundary:** Non-numeric `id` → "Post not found".
- **Edge:** Non-author → no **Delete** button. HTML in content rendered safely.

### 5.6 Create Post
- **Positive:** Valid title and content → post created, redirected to detail.
- **Negative:** Empty title or content → "title and content are required". Expired session → error and redirect to login.
- **Boundary:** Title at maxlength 200 → accepted.
- **Edge:** Anonymous user opening this page → redirected to login. Whitespace-only inputs → trimmed/rejected.

### 5.7 Delete Post
- **Positive:** Author confirms → post removed, redirected to `/`.
- **Negative:** Cancel dialog → no action. Non-author bypass via direct call → "You can only delete your own posts". Missing post → "Post not found".
- **Edge:** Deleting the only post → empty-state on homepage afterward.

### 5.8 Top Navigation Bar
- **Positive:** Anonymous → Login/Sign up; Logged in → New Post/greeting/Logout.
- **Negative:** None visible.
- **Edge:** Username with special characters HTML-escaped. Multi-tab drift on login/logout.

---

## 6. Failure Scenarios

### User Errors
- Submitting empty Signup, Login, or Create Post forms.
- Password shorter than 6 chars on Signup.
- Duplicate username or email on Signup.
- Wrong email or password on Login.
- Navigating to **Create Post** while logged out.
- Visiting `/post.html` without an `id` query param.

### Validation Failures
- "username, email and password are required"
- "Password must be at least 6 characters"
- "Username or email already in use"
- "email and password are required"
- "Invalid email or password"
- "title and content are required"

### System-Visible Failures
- Home fetch failure → "Failed to load posts: …".
- Detail fetch failure → "Failed to load post: …".
- Generic server failure → "Internal server error" via the error banner.

### API/Network Failures (Visible)
- Missing/invalid token on protected actions → "Missing token" / "Invalid or expired token".
- Delete on non-owned post → "You can only delete your own posts".
- Delete on non-existent post → "Post not found".
- Network error → generic failure shown in the banner.

---

## 7. Dependencies

### Connected Modules (UI)
- Signup Page → Top Navigation; success → Home.
- Login Page → Top Navigation; success → Home.
- Logout → depends on active session; → Home (anonymous).
- Home → links to Post Detail.
- Post Detail → requires post `id`; hosts Delete; back link → Home.
- Create Post → requires session; success → Post Detail.
- Delete Post → requires session and ownership; success → Home.
- Top Navigation → present on every page.

### Visible APIs
| Method | Path | Auth | Purpose | Used By |
|---|---|---|---|---|
| POST | `/api/auth/signup` | No | Register a new user | Signup Page |
| POST | `/api/auth/login` | No | Log in existing user | Login Page |
| GET | `/api/posts` | No | List all posts | Home Page |
| GET | `/api/posts/:id` | No | Get a single post | Post Detail Page |
| POST | `/api/posts` | Yes (Bearer) | Create a post | Create Post Page |
| DELETE | `/api/posts/:id` | Yes (Bearer) | Delete own post | Delete Post action |

### Required Inputs
- Post Detail requires `id` from the Home page link.
- Create Post and Delete Post require an active session from Signup or Login.
- Top Navigation requires session state set by Signup/Login and cleared by Logout.

---

## 8. QA / Testing

### Test Strategy
- Drive end-to-end flows in a real browser and verify visible UI outcomes.
- Reset/seed data before each run for repeatability.
- Cover authentication first because all post actions depend on it.
- Combine UI tests with direct API checks to confirm validation and authorization at both layers.

### Test Coverage

**Functional**
- Signup happy path and all validation errors.
- Login happy path and all validation errors.
- Logout clears session and updates the navigation.
- Home renders zero, one, and many posts in newest-first order; preview truncation.
- Post Detail renders an existing post; clear errors for missing/invalid `id`.
- Create Post happy path and validation errors.
- Delete Post happy path, cancel-confirm path, non-author path, and missing-post path.
- Navigation renders correctly for anonymous and logged-in users.

**UI**
- Auth-aware navigation rendering.
- Redirect rules (signup/login when already in; create when not in).
- Error banner messages.
- Delete button visibility based on ownership.
- HTML escaping (XSS safety) for titles, content, and usernames.

**API (Visible)**
- All six endpoints in §7 covered (status, body, side-effects).
- Bearer token parsing: missing, wrong scheme, expired, tampered.

**Integration**
- End-to-end happy path: Signup → Create → View on Home → View Detail → Delete → Verify removal.
- Cross-user: User A creates; User B cannot delete.
- Token expiry: simulate expired session; create-post page redirects to login.

### Test Types
- **Smoke:** App loads, signup works, logged-in user can publish.
- **Sanity:** Navigation reflects state; new post appears at top of home.
- **Regression:** Duplicate signup blocked; non-author cannot delete; HTML rendered safely; password length still enforced; redirects still apply.

### Risk Areas
- Authentication lifecycle (signup/login → session → expiry → forced re-login).
- Ownership enforcement on **Delete**.
- Multi-tab session synchronization.

### Automation Scope (Priority)
1. Signup, Login, session handling.
2. Create Post and Delete Post (ownership-checked).
3. Home and Post Detail rendering.
4. Navigation and redirect rules.
5. XSS escaping of user-supplied text.

---

## 9. Assumptions & Gaps

### Assumptions
- Site is single-origin; pages and API share the host.
- Browser-based session is intended to persist across reloads.
- Posts are plain text; no Markdown/HTML interpretation.
- The default development secret is replaced before production.

### Missing / Not Visible
- No edit-post flow.
- No password reset, email verification, or "forgot password".
- No profile or account-settings UI.
- No pagination, search, sorting, tags, categories.
- No comments, likes, or social interactions.
- No image/file uploads.
- No loading indicators while fetching.
- No "session expired" toast/banner outside of create-post.
- No multi-tab session sync.
- No test suite, CI, or deployment configuration in the project.

### Worth Confirming
- Should email lookup be case-insensitive?
- Should server-side length limits be enforced for username, email, title, content?
- Should the home preview truncate at a word boundary?
- Should logout invalidate the session server-side?

---

## 10. Automation (Playwright JS)

This automation covers the main user journey end-to-end: signup → create post → view on home → view detail → delete post → logout. It uses a simple Page Object Model, web-first assertions, and unique test data per run so it does not collide with prior data.

### 10.1 Setup Instructions

Run these from the project root (`C:\Users\ACE\Desktop\blogging`):

```bash
# 1) install runtime deps if not already installed
npm install

# 2) install Playwright as a dev dependency and download browsers
npm install -D @playwright/test
npx playwright install

# 3) start the application (in a separate terminal, leave running)
npm start
# server logs: "Blog running at http://localhost:8080"

# 4) run the tests
npx playwright test

# Optional: run headed with traces
npx playwright test --headed --trace=on
```

The Playwright config below points the `baseURL` to `http://localhost:8080`. You can override with `PW_BASE_URL=http://localhost:3000 npx playwright test`.

### 10.2 File Layout

Create these files at the project root:

```
playwright.config.js
tests/
  pages/
    NavBar.js
    HomePage.js
    SignupPage.js
    LoginPage.js
    CreatePostPage.js
    PostDetailPage.js
  main-journey.spec.js
```

### 10.3 `playwright.config.js`

```javascript
// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PW_BASE_URL || 'http://localhost:8080',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

### 10.4 Page Objects

**`tests/pages/NavBar.js`**
```javascript
// Auth-aware top navigation present on every page.
class NavBar {
  constructor(page) {
    this.page = page;
    this.brand = page.locator('nav a.brand', { hasText: 'MiniBlog' });
    this.links = page.locator('#nav-links');
    this.loginLink = this.links.locator('a', { hasText: 'Login' });
    this.signupLink = this.links.locator('a', { hasText: 'Sign up' });
    this.newPostLink = this.links.locator('a', { hasText: 'New Post' });
    this.greeting = this.links.locator('span.muted-link');
    this.logoutBtn = this.links.locator('#logout-btn');
  }

  async expectAnonymous() {
    await this.loginLink.waitFor({ state: 'visible' });
    await this.signupLink.waitFor({ state: 'visible' });
  }

  async expectLoggedIn(username) {
    await this.newPostLink.waitFor({ state: 'visible' });
    await this.logoutBtn.waitFor({ state: 'visible' });
    if (username) {
      await this.page
        .locator('#nav-links span.muted-link', { hasText: `Hi, ${username}` })
        .waitFor({ state: 'visible' });
    }
  }

  async logout() {
    await this.logoutBtn.click();
    await this.page.waitForURL('**/');
  }
}

module.exports = { NavBar };
```

**`tests/pages/HomePage.js`**
```javascript
class HomePage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Latest posts' });
    this.posts = page.locator('#posts');
    this.postCards = this.posts.locator('article.post-card');
    this.empty = this.posts.locator('.empty');
  }

  async goto() {
    await this.page.goto('/');
    await this.heading.waitFor({ state: 'visible' });
  }

  postCardByTitle(title) {
    return this.postCards.filter({ has: this.page.locator('h2 a', { hasText: title }) });
  }

  async openPostByTitle(title) {
    await this.postCardByTitle(title).locator('h2 a').click();
    await this.page.waitForURL(/\/post\.html\?id=\d+/);
  }
}

module.exports = { HomePage };
```

**`tests/pages/SignupPage.js`**
```javascript
class SignupPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Create your account' });
    this.username = page.locator('#username');
    this.email = page.locator('#email');
    this.password = page.locator('#password');
    this.submit = page.getByRole('button', { name: 'Sign up' });
    this.error = page.locator('#error');
  }

  async goto() {
    await this.page.goto('/signup.html');
    await this.heading.waitFor({ state: 'visible' });
  }

  async signup({ username, email, password }) {
    await this.username.fill(username);
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}

module.exports = { SignupPage };
```

**`tests/pages/LoginPage.js`**
```javascript
class LoginPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Log in' });
    this.email = page.locator('#email');
    this.password = page.locator('#password');
    this.submit = page.getByRole('button', { name: 'Log in' });
    this.error = page.locator('#error');
  }

  async goto() {
    await this.page.goto('/login.html');
    await this.heading.waitFor({ state: 'visible' });
  }

  async login({ email, password }) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}

module.exports = { LoginPage };
```

**`tests/pages/CreatePostPage.js`**
```javascript
class CreatePostPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Write a new post' });
    this.title = page.locator('#title');
    this.content = page.locator('#content');
    this.publish = page.getByRole('button', { name: 'Publish' });
    this.error = page.locator('#error');
  }

  async goto() {
    await this.page.goto('/create.html');
    await this.heading.waitFor({ state: 'visible' });
  }

  async publishPost({ title, content }) {
    await this.title.fill(title);
    await this.content.fill(content);
    await this.publish.click();
    // After publish the user is redirected to the post detail page.
    await this.page.waitForURL(/\/post\.html\?id=\d+/);
  }
}

module.exports = { CreatePostPage };
```

**`tests/pages/PostDetailPage.js`**
```javascript
class PostDetailPage {
  constructor(page) {
    this.page = page;
    this.container = page.locator('#post');
    this.title = this.container.locator('h1');
    this.meta = this.container.locator('.meta');
    this.content = this.container.locator('.post-content');
    this.deleteBtn = this.container.locator('#delete-btn');
    this.error = page.locator('#error');
  }

  async waitLoaded() {
    await this.title.waitFor({ state: 'visible' });
  }

  async deletePost({ confirm = true } = {}) {
    // Handle the browser confirm() dialog before clicking.
    this.page.once('dialog', async (dialog) => {
      if (confirm) await dialog.accept(); else await dialog.dismiss();
    });
    await this.deleteBtn.click();
    if (confirm) {
      await this.page.waitForURL('**/');
    }
  }
}

module.exports = { PostDetailPage };
```

### 10.5 Main Journey Test

**`tests/main-journey.spec.js`**
```javascript
// End-to-end main user journey for MiniBlog (client demo flow).
const { test, expect } = require('@playwright/test');

const { NavBar } = require('./pages/NavBar');
const { HomePage } = require('./pages/HomePage');
const { SignupPage } = require('./pages/SignupPage');
const { LoginPage } = require('./pages/LoginPage');
const { CreatePostPage } = require('./pages/CreatePostPage');
const { PostDetailPage } = require('./pages/PostDetailPage');

// Unique data per run to avoid duplicate-user conflicts.
function uniqueUser() {
  const tag = Date.now() + '_' + Math.floor(Math.random() * 1e4);
  return {
    username: `demo_${tag}`,
    email: `demo_${tag}@example.com`,
    password: 'Passw0rd!',
  };
}

test.describe('MiniBlog — main user journey', () => {
  test('signup → create → view → delete → logout', async ({ page }) => {
    const user = uniqueUser();
    const post = {
      title: `Hello world ${Date.now()}`,
      content: 'This is my first post on MiniBlog. It demonstrates the full flow.',
    };

    const nav = new NavBar(page);
    const home = new HomePage(page);
    const signup = new SignupPage(page);
    const create = new CreatePostPage(page);
    const detail = new PostDetailPage(page);

    // 1) Anonymous user lands on the homepage.
    await home.goto();
    await nav.expectAnonymous();

    // 2) Sign up for a new account → expect redirect to home and logged-in nav.
    await signup.goto();
    await signup.signup(user);
    await page.waitForURL('**/');
    await nav.expectLoggedIn(user.username);

    // 3) Create a new post → land on the post's detail page.
    await nav.newPostLink.click();
    await page.waitForURL(/\/create\.html$/);
    await create.publishPost(post);
    await detail.waitLoaded();
    await expect(detail.title).toHaveText(post.title);
    await expect(detail.content).toContainText(post.content);
    await expect(detail.deleteBtn).toBeVisible();

    // 4) Go back to the homepage and confirm the post is listed at the top.
    await nav.brand.click();
    await page.waitForURL('**/');
    await expect(home.postCardByTitle(post.title).first()).toBeVisible();

    // 5) Open the post from the listing and delete it.
    await home.openPostByTitle(post.title);
    await detail.waitLoaded();
    await detail.deletePost({ confirm: true });

    // 6) Back on the homepage, confirm the post is gone.
    await expect(home.heading).toBeVisible();
    await expect(home.postCardByTitle(post.title)).toHaveCount(0);

    // 7) Log out → navigation reverts to the anonymous state.
    await nav.logout();
    await nav.expectAnonymous();
  });

  test('signup validation: short password', async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.goto();
    // Bypass HTML5 minlength to verify server-side validation message.
    await signup.username.fill('shortpw_user');
    await signup.email.fill(`shortpw_${Date.now()}@example.com`);
    await signup.password.evaluate((el, v) => { el.value = v; }, '123');
    await signup.submit.click();
    await expect(signup.error).toHaveText(/at least 6 characters/i);
  });

  test('login validation: invalid credentials', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login({ email: 'nobody@example.com', password: 'wrong-password' });
    await expect(login.error).toHaveText(/invalid email or password/i);
  });

  test('create post is gated for anonymous users', async ({ page }) => {
    // Visiting /create.html while logged out should redirect to /login.html.
    await page.goto('/create.html');
    await page.waitForURL(/\/login\.html$/);
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
  });
});
```

### 10.6 How To Run The Demo Test Only
```bash
# Run just the main journey (good for the client demo recording)
npx playwright test tests/main-journey.spec.js -g "signup → create → view → delete → logout" --headed
```

---

## 11. Demo Video Flow (Client Perspective)

### 11.1 Demo Flow Script (Step-by-Step Actions)
1. Start on a clean homepage that shows existing posts (or the empty state for a fresh setup).
2. Highlight the top navigation (Login / Sign up).
3. Click **Sign up**.
4. Fill in username, email, and password.
5. Click **Sign up**. Show the redirect to the homepage with the new logged-in navigation (New Post / Hi, <user> / Logout).
6. Click **New Post**.
7. Fill in a clear title (e.g., "Welcome to MiniBlog") and a short paragraph for the content.
8. Click **Publish**. Show the redirect to the post detail page with the title, author, date, and full content.
9. Click the **MiniBlog** brand to return to the homepage. Show the new post at the top of the list.
10. Click the post in the list to reopen the detail page.
11. Show the **Delete** button and explain it only appears for the author.
12. Click **Delete**, confirm in the browser dialog. Show redirection to the homepage.
13. Confirm visually that the post no longer appears in the list.
14. Click **Logout**. Show the navigation reverting to Login / Sign up.
15. End the recording on the homepage in the anonymous state.

### 11.2 Voice Over Script (Client-Friendly)
1. "Welcome to MiniBlog — a simple platform to read and publish blog posts."
2. "Anyone can read posts on the homepage without signing in."
3. "To start writing, we'll create an account. I'll click Sign up."
4. "I'll enter a username, email, and a password."
5. "After signing up, the system logs me in automatically and brings me back to the homepage."
6. "Now that I'm signed in, I'll click New Post to write something."
7. "I'll add a title and the body of the post."
8. "When I click Publish, my post is saved and I'm taken straight to its page."
9. "Going back to the homepage, you can see the new post sitting at the top of the list."
10. "Let me click it to open the post in detail."
11. "Because I'm the author, I see a Delete button. Other users won't see this on my post."
12. "I'll delete the post and confirm. The system removes it and returns me to the homepage."
13. "You can see the post is gone from the list."
14. "Finally, I'll log out, and the navigation goes back to its original state."
15. "That's the full MiniBlog experience — simple, fast, and focused on the essentials."

### 11.3 Visual Highlight Instructions
- Start each recording at 1080p resolution with the browser window maximized.
- Add a soft zoom or spotlight on these elements when they appear:
  - The top navigation (Sign up / Login).
  - The signup form fields one by one as they are filled.
  - The auth-aware navigation right after signup (New Post, Hi, <user>, Logout).
  - The Title and Content fields on the Create Post page.
  - The new post card on the homepage after publishing.
  - The **Delete** button on the post detail page.
  - The browser confirmation dialog for delete.
  - The empty position in the homepage list right after deletion.
- Use a click ripple/cursor highlight overlay so every click is visible.
- Apply a subtle dim on the rest of the page when highlighting a region.
- Use smooth crossfade transitions (300–500 ms) between major steps (Home → Signup → Home → Create → Detail → Home → Detail → Home).
- Pause for 1.5–2 seconds on every important state change (post just created, post just deleted, navigation just updated).

### 11.4 Video Requirements
- **Resolution:** 1080p (Full HD), 30 fps.
- **Browser:** Chromium-based, default zoom 100%, window maximized.
- **Pacing:** Slow and readable; type at a moderate cadence and pause briefly between actions.
- **Audio:** Clear voice-over without background noise; no technical jargon.
- **Captions:** On-screen captions for each step that match the voice-over.
- **Length target:** 90–120 seconds total.
- **No PII or real credentials:** Use demo data such as `demo_user@example.com` and a generic password.
