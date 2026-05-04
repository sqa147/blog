"""Generate module-wise-test-scenarios-and-cases.xlsx for MiniBlog QA review.

Business-readable rewrite: user-facing titles, realistic data, no selectors,
no code paths, no API/DOM/internal terminology.
"""
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

import os, time, sys
OUT = r"C:\Users\ACE\Desktop\blogging\module-wise-test-scenarios-and-cases.xlsx"
TMP = OUT + ".tmp.xlsx"

# ---- styles ----
HEADER_FILL = PatternFill("solid", fgColor="305496")
HEADER_FONT = Font(bold=True, color="FFFFFF", size=11)
SECTION_FILL = PatternFill("solid", fgColor="D9E1F2")
SECTION_FONT = Font(bold=True, size=12, color="1F3864")
TITLE_FONT = Font(bold=True, size=14, color="1F3864")
WRAP_TOP = Alignment(wrap_text=True, vertical="top")
THIN = Side(style="thin", color="BFBFBF")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

SCEN_HEADERS = ["Scenario ID", "Module Name", "Scenario Title", "Objective", "Covered Areas"]
TC_HEADERS = ["Test Case ID", "Scenario ID", "Module Name", "Title", "Priority",
              "Coverage Type", "Category", "Preconditions", "Test Data",
              "Steps", "Expected Result"]
SCEN_WIDTHS = [14, 22, 55, 55, 30]
TC_WIDTHS = [14, 14, 22, 55, 10, 14, 18, 38, 45, 75, 80]

MODULES = [
    # --------------------------------------------------------------------- M1
    {
        "key": "M1-TopNav",
        "name": "M1 Top Navigation",
        "scenarios": [
            ["TS-NAV-01", "Top Navigation",
             "Visitor sees public navigation options",
             "Verify that visitors who are not logged in see Login and Sign Up options.",
             "Positive, UI, Functional"],
            ["TS-NAV-02", "Top Navigation",
             "Logged-in user sees author navigation",
             "Verify that logged-in users see New Post, a personal greeting, and Logout.",
             "Positive, UI, State Change"],
            ["TS-NAV-03", "Top Navigation",
             "User can return to the home page from any page",
             "Verify that clicking the MiniBlog logo always opens the home page.",
             "Navigation, UI"],
        ],
        "cases": [
            ["TC-NAV-01", "TS-NAV-01", "Top Navigation",
             "Visitor sees Login and Sign Up options in the top menu",
             "High", "Smoke", "Positive",
             "The user is not logged in.",
             "No data required.",
             "1. Open the MiniBlog home page.\n2. Look at the top navigation menu.",
             "The top menu clearly shows Login and Sign up options. New Post, the greeting, and Logout are not visible."],

            ["TC-NAV-02", "TS-NAV-02", "Top Navigation",
             "Logged-in user sees New Post, greeting, and Logout in the top menu",
             "High", "Smoke", "Positive",
             "The user has a valid account.",
             "Username: ali.khan",
             "1. Log in as Ali Khan.\n2. Open the home page.\n3. Look at the top navigation menu.",
             "The top menu shows New Post, a greeting reading \"Hi, ali.khan\", and a Logout button. Login and Sign up are no longer shown."],

            ["TC-NAV-03", "TS-NAV-02", "Top Navigation",
             "Username with special characters is shown safely in the greeting",
             "Medium", "Regression", "Validation",
             "An account exists whose username contains special characters.",
             "Username: Ali <Khan>",
             "1. Log in with the special-character username.\n2. Look at the greeting in the top menu.",
             "The greeting displays the special characters as plain readable text. The page does not break and no unintended formatting appears."],

            ["TC-NAV-04", "TS-NAV-03", "Top Navigation",
             "User returns to the home page from the New Post page using the logo",
             "Medium", "Regression", "Navigation",
             "The user is logged in.",
             "No data required.",
             "1. Open the New Post page.\n2. Click the MiniBlog logo in the top menu.",
             "The home page is displayed with the \"Latest posts\" heading."],

            ["TC-NAV-05", "TS-NAV-03", "Top Navigation",
             "User returns to the home page from a post detail page using the logo",
             "Medium", "Regression", "Navigation",
             "At least one post exists.",
             "No data required.",
             "1. Open any post's detail page.\n2. Click the MiniBlog logo.",
             "The home page is displayed with the list of posts."],

            ["TC-NAV-06", "TS-NAV-02", "Top Navigation",
             "Logout button is hidden when the user is not logged in",
             "Medium", "Regression", "UI",
             "The user is not logged in.",
             "No data required.",
             "1. While not logged in, open the home page, the Sign Up page, and the Login page in turn.\n2. Look for a Logout button on each.",
             "No Logout button is shown on any of the three pages."],
        ],
    },

    # --------------------------------------------------------------------- M2
    {
        "key": "M2-Signup",
        "name": "M2 Sign Up",
        "scenarios": [
            ["TS-SUP-01", "Sign Up",
             "New visitor can register an account successfully",
             "Verify that a visitor can register with valid details and is automatically logged in.",
             "Positive, Functional"],
            ["TS-SUP-02", "Sign Up",
             "Sign Up form enforces required fields",
             "Verify that empty required fields are not accepted.",
             "Negative, Validation"],
            ["TS-SUP-03", "Sign Up",
             "Password length must be at least six characters",
             "Verify the minimum password length rule.",
             "Boundary, Validation"],
            ["TS-SUP-04", "Sign Up",
             "Duplicate username or email is not allowed",
             "Verify uniqueness of username and email at registration.",
             "Negative, Functional"],
            ["TS-SUP-05", "Sign Up",
             "Logged-in user is redirected away from the Sign Up page",
             "Verify that already logged-in users do not see the Sign Up form.",
             "Edge, Navigation"],
        ],
        "cases": [
            ["TC-SUP-01", "TS-SUP-01", "Sign Up",
             "User registers a new account with valid details",
             "High", "Smoke", "Positive",
             "The user does not have an existing account.",
             "Username: ali.khan\nEmail: ali.khan@gmail.com\nPassword: Passw0rd!",
             "1. Open the Sign Up page.\n2. Enter the username, email, and password.\n3. Click Sign up.",
             "The account is created and the user is taken to the home page, automatically logged in. The greeting \"Hi, ali.khan\" appears in the top menu."],

            ["TC-SUP-02", "TS-SUP-02", "Sign Up",
             "Sign Up form blocks submission when no fields are filled",
             "High", "Regression", "Negative",
             "The user is on the Sign Up page.",
             "Leave Username, Email, and Password blank.",
             "1. Open the Sign Up page.\n2. Click Sign up without entering any details.",
             "The form does not submit. The first empty required field shows a \"please fill out this field\" prompt."],

            ["TC-SUP-03", "TS-SUP-02", "Sign Up",
             "Relevant validation message is shown when required fields are missing",
             "Medium", "Regression", "Negative",
             "The user is registering without filling all required fields.",
             "Username: blank\nEmail: blank\nPassword: blank",
             "1. Submit a registration request with all fields empty.",
             "The validation message \"username, email and password are required\" is displayed and the account is not created."],

            ["TC-SUP-04", "TS-SUP-03", "Sign Up",
             "Password with exactly six characters is accepted",
             "High", "Regression", "Boundary",
             "The user does not have an existing account.",
             "Username: fatima.a\nEmail: fatima.a@gmail.com\nPassword: abc123",
             "1. Open the Sign Up page.\n2. Enter the data above.\n3. Click Sign up.",
             "The account is created and the user is taken to the home page. The greeting \"Hi, fatima.a\" appears in the top menu."],

            ["TC-SUP-05", "TS-SUP-03", "Sign Up",
             "Password shorter than six characters is rejected",
             "High", "Regression", "Boundary",
             "The user is on the Sign Up page.",
             "Username: fatima.a\nEmail: fatima.a@gmail.com\nPassword: Ali@1",
             "1. Open the Sign Up page.\n2. Enter the data above.\n3. Click Sign up.",
             "The validation message \"Password must be at least 6 characters\" is displayed and the account is not created."],

            ["TC-SUP-06", "TS-SUP-03", "Sign Up",
             "Username shorter than three characters is not accepted",
             "Medium", "Regression", "Boundary",
             "The user is on the Sign Up page.",
             "Username: ab\nEmail: bilal@gmail.com\nPassword: Passw0rd!",
             "1. Open the Sign Up page.\n2. Enter the data above.\n3. Click Sign up.",
             "The form does not submit. The Username field shows a prompt asking for at least three characters."],

            ["TC-SUP-07", "TS-SUP-03", "Sign Up",
             "Username field stops accepting input after thirty characters",
             "Low", "Regression", "Boundary",
             "The user is on the Sign Up page.",
             "Type a 31-letter username (e.g., \"a\" repeated 31 times).",
             "1. Open the Sign Up page.\n2. Type 31 letters into the Username field.",
             "Only the first thirty letters are accepted in the Username field."],

            ["TC-SUP-08", "TS-SUP-04", "Sign Up",
             "Sign up is rejected when the email is already registered",
             "High", "Regression", "Negative",
             "An account with the email ali.khan@gmail.com already exists.",
             "Username: ali.khan2\nEmail: ali.khan@gmail.com\nPassword: Passw0rd!",
             "1. Open the Sign Up page.\n2. Enter the data above.\n3. Click Sign up.",
             "The validation message \"Username or email already in use\" is displayed and the user remains on the Sign Up page."],

            ["TC-SUP-09", "TS-SUP-04", "Sign Up",
             "Sign up is rejected when the username is already registered",
             "High", "Regression", "Negative",
             "A user named ali.khan already exists.",
             "Username: ali.khan\nEmail: new.email@gmail.com\nPassword: Passw0rd!",
             "1. Open the Sign Up page.\n2. Enter the data above.\n3. Click Sign up.",
             "The validation message \"Username or email already in use\" is displayed."],

            ["TC-SUP-10", "TS-SUP-01", "Sign Up",
             "Username and email are saved without leading or trailing spaces",
             "Medium", "Regression", "Validation",
             "The user does not have an existing account.",
             "Username: \"  bilal.dev  \"\nEmail: \"  bilal@gmail.com  \"\nPassword: Passw0rd!",
             "1. Open the Sign Up page.\n2. Enter the username and email with extra spaces, and a valid password.\n3. Click Sign up.",
             "The account is created. The greeting reads \"Hi, bilal.dev\" without extra spaces."],

            ["TC-SUP-11", "TS-SUP-01", "Sign Up",
             "Sign up does not accept an invalid email format",
             "Medium", "Regression", "Negative",
             "The user is on the Sign Up page.",
             "Username: kashan\nEmail: ali.khan.gmail.com\nPassword: Passw0rd!",
             "1. Open the Sign Up page.\n2. Enter the data above.\n3. Click Sign up.",
             "The form does not submit. The Email field shows a \"please enter a valid email address\" prompt."],

            ["TC-SUP-12", "TS-SUP-05", "Sign Up",
             "Logged-in user is redirected away from the Sign Up page",
             "Medium", "Regression", "Edge",
             "The user is already logged in.",
             "No data required.",
             "1. While logged in, open the Sign Up page directly.",
             "The user is taken straight to the home page. The Sign Up form is not shown."],

            ["TC-SUP-13", "TS-SUP-01", "Sign Up",
             "User remains logged in after refreshing the page",
             "High", "Regression", "Functional",
             "The user does not have an existing account.",
             "Username: zara.t\nEmail: zara.tariq@gmail.com\nPassword: Strong#22",
             "1. Sign up using the data above.\n2. Refresh the home page.",
             "The user remains logged in. The greeting \"Hi, zara.t\" continues to be shown after refresh."],

            ["TC-SUP-14", "TS-SUP-02", "Sign Up",
             "\"Already have an account? Log in\" link opens the Login page",
             "Low", "Regression", "Navigation",
             "The user is on the Sign Up page.",
             "No data required.",
             "1. Open the Sign Up page.\n2. Click the Log in link at the bottom.",
             "The Login page is displayed with the \"Log in\" heading."],
        ],
    },

    # --------------------------------------------------------------------- M3
    {
        "key": "M3-Login",
        "name": "M3 Login",
        "scenarios": [
            ["TS-LGN-01", "Login",
             "Registered user can log in with valid credentials",
             "Verify the happy-path login flow.",
             "Positive, Functional"],
            ["TS-LGN-02", "Login",
             "Login form enforces required fields",
             "Verify that empty fields are not accepted.",
             "Negative, Validation"],
            ["TS-LGN-03", "Login",
             "Invalid credentials are rejected with a clear message",
             "Verify that wrong credentials show a generic invalid-credentials message.",
             "Negative, Edge"],
            ["TS-LGN-04", "Login",
             "Logged-in user is redirected away from the Login page",
             "Verify the guard for already-logged-in users.",
             "Edge, Navigation"],
            ["TS-LGN-05", "Login",
             "Remember me option appears and behaves correctly on the Login page",
             "Verify that the Remember me checkbox is shown on the Login page, is unchecked by default, and toggles when its label is clicked.",
             "Positive, UI, Validation"],
            ["TS-LGN-06", "Login",
             "Remember me extends the session across browser restarts",
             "Verify that ticking Remember me at login keeps the user signed in for thirty days, even after the browser is closed.",
             "Positive, Functional"],
            ["TS-LGN-07", "Login",
             "Without Remember me, the session ends with the current browser tab",
             "Verify that logging in without Remember me ends the session when the tab is closed and the token only lasts one day.",
             "Positive, Boundary, Functional"],
            ["TS-LGN-08", "Login",
             "Remember me does not bypass credential validation",
             "Verify that ticking Remember me does not allow login with wrong credentials.",
             "Negative, Security"],
        ],
        "cases": [
            ["TC-LGN-01", "TS-LGN-01", "Login",
             "User logs in with correct email and password",
             "High", "Smoke", "Positive",
             "An account exists with email ali.khan@gmail.com and password Passw0rd!.",
             "Email: ali.khan@gmail.com\nPassword: Passw0rd!",
             "1. Open the Login page.\n2. Enter the email and password.\n3. Click Log in.",
             "The user is taken to the home page. The greeting \"Hi, ali.khan\" appears in the top menu."],

            ["TC-LGN-02", "TS-LGN-02", "Login",
             "Login form blocks submission when no fields are filled",
             "Medium", "Regression", "Negative",
             "The user is on the Login page.",
             "Leave Email and Password blank.",
             "1. Open the Login page.\n2. Click Log in without entering any details.",
             "The form does not submit. The Email field shows a \"please fill out this field\" prompt."],

            ["TC-LGN-03", "TS-LGN-02", "Login",
             "Relevant validation message is shown when required fields are missing",
             "Medium", "Regression", "Negative",
             "The user is logging in without filling all required fields.",
             "Email: blank\nPassword: blank",
             "1. Submit a login request with empty email and password.",
             "The validation message \"email and password are required\" is displayed and the user is not logged in."],

            ["TC-LGN-04", "TS-LGN-03", "Login",
             "Login is rejected when the password is incorrect",
             "High", "Regression", "Negative",
             "An account exists with email ali.khan@gmail.com.",
             "Email: ali.khan@gmail.com\nPassword: WrongPass1",
             "1. Open the Login page.\n2. Enter the email and a wrong password.\n3. Click Log in.",
             "The validation message \"Invalid email or password\" is displayed. The user remains on the Login page."],

            ["TC-LGN-05", "TS-LGN-03", "Login",
             "Login is rejected when the email is not registered",
             "High", "Regression", "Negative",
             "No account exists for ghost.user@gmail.com.",
             "Email: ghost.user@gmail.com\nPassword: AnyPass1",
             "1. Open the Login page.\n2. Enter the email and any password.\n3. Click Log in.",
             "The validation message \"Invalid email or password\" is displayed."],

            ["TC-LGN-06", "TS-LGN-03", "Login",
             "Login fails when the email casing does not match the registered email",
             "Medium", "Regression", "Edge",
             "The registered email is ali.khan@gmail.com.",
             "Email: ALI.KHAN@gmail.com\nPassword: Passw0rd!",
             "1. Open the Login page.\n2. Enter the uppercased email and the correct password.\n3. Click Log in.",
             "The validation message \"Invalid email or password\" is displayed."],

            ["TC-LGN-07", "TS-LGN-01", "Login",
             "Email is accepted even with extra spaces around it",
             "Medium", "Regression", "Functional",
             "An account exists for ali.khan@gmail.com.",
             "Email: \"  ali.khan@gmail.com  \"\nPassword: Passw0rd!",
             "1. Open the Login page.\n2. Enter the email with leading and trailing spaces and the correct password.\n3. Click Log in.",
             "Login succeeds and the user is taken to the home page."],

            ["TC-LGN-08", "TS-LGN-01", "Login",
             "User remains logged in after refreshing the page",
             "High", "Regression", "Functional",
             "An account exists.",
             "Email: ali.khan@gmail.com\nPassword: Passw0rd!",
             "1. Log in with the correct details.\n2. Refresh the home page.",
             "The user remains logged in. The greeting continues to be shown."],

            ["TC-LGN-09", "TS-LGN-04", "Login",
             "Logged-in user is redirected away from the Login page",
             "Medium", "Regression", "Edge",
             "The user is already logged in.",
             "No data required.",
             "1. While logged in, open the Login page directly.",
             "The user is taken straight to the home page. The Login form is not shown."],

            ["TC-LGN-10", "TS-LGN-02", "Login",
             "\"Don't have an account? Sign up\" link opens the Sign Up page",
             "Low", "Regression", "Navigation",
             "The user is on the Login page.",
             "No data required.",
             "1. Open the Login page.\n2. Click the Sign up link.",
             "The Sign Up page is displayed with the \"Create your account\" heading."],

            # ── Remember me (PR de4575a) ────────────────────────────────
            ["TC-LGN-11", "TS-LGN-05", "Login",
             "Remember me checkbox is visible on the Login page",
             "High", "Smoke", "Positive",
             "The user is on the Login page and not logged in.",
             "No data required.",
             "1. Open the Login page.\n2. Look at the area between the Password field and the Log in button.",
             "A checkbox with the label \"Remember me\" is shown directly above the Log in button."],

            ["TC-LGN-12", "TS-LGN-05", "Login",
             "Remember me checkbox is unchecked by default on a fresh visit",
             "High", "Regression", "Validation",
             "The Login page is opened in a new browser session.",
             "No data required.",
             "1. Open the Login page in a fresh browser window.\n2. Look at the Remember me checkbox.",
             "The Remember me checkbox is unchecked. The user must opt in to a long session."],

            ["TC-LGN-13", "TS-LGN-05", "Login",
             "Clicking the Remember me label toggles the checkbox",
             "Medium", "Regression", "UI",
             "The Login page is open.",
             "No data required.",
             "1. Open the Login page.\n2. Click the area of the \"Remember me\" label (not the checkbox itself).\n3. Click the same area again.",
             "Each click toggles the checkbox state. After the first click it becomes checked, after the second it becomes unchecked again."],

            ["TC-LGN-14", "TS-LGN-07", "Login",
             "Logging in without Remember me ends the session when the tab is closed",
             "High", "Smoke", "Positive",
             "An account exists with email ali.khan@gmail.com and password Passw0rd!.",
             "Email: ali.khan@gmail.com\nPassword: Passw0rd!\nRemember me: unchecked",
             "1. Open the Login page.\n2. Enter the email and password.\n3. Leave Remember me unchecked.\n4. Click Log in.\n5. Close the browser tab.\n6. Open the home page in a new tab.",
             "After login the user is on the home page with the greeting visible. After closing and reopening the tab, the home page shows Login and Sign up again. The user is no longer signed in."],

            ["TC-LGN-15", "TS-LGN-06", "Login",
             "Logging in with Remember me keeps the user signed in across browser restarts",
             "High", "Smoke", "Positive",
             "An account exists with email sara.n@gmail.com and password Passw0rd!.",
             "Email: sara.n@gmail.com\nPassword: Passw0rd!\nRemember me: checked",
             "1. Open the Login page.\n2. Enter the email and password.\n3. Tick Remember me.\n4. Click Log in.\n5. Close the entire browser.\n6. Reopen the browser and open the home page.",
             "After login the user is on the home page with the greeting \"Hi, sara.n\". After closing and reopening the browser, the home page still shows the greeting and the user is still signed in."],

            ["TC-LGN-16", "TS-LGN-06", "Login",
             "Choosing Remember me on a second login replaces the prior short session cleanly",
             "Medium", "Regression", "Edge",
             "An account exists with email ali.khan@gmail.com and password Passw0rd!.",
             "First login: Remember me unchecked\nSecond login: Remember me checked",
             "1. Log in with Remember me unchecked.\n2. Click Logout.\n3. Open the Login page again.\n4. Log in with the same details and Remember me ticked.\n5. Close and reopen the browser.\n6. Open the home page.",
             "After step 6 the user is still signed in. There is no leftover short session from the first login interfering with the long session."],

            ["TC-LGN-17", "TS-LGN-06", "Login",
             "Logout signs the user out from both short and long sessions",
             "High", "Regression", "Functional",
             "The user has just logged in with Remember me ticked.",
             "No data required.",
             "1. After logging in with Remember me ticked, click Logout in the top menu.\n2. Open the home page.\n3. Close and reopen the browser, then open the home page again.",
             "After step 1 the home page shows Login and Sign up. The greeting and Logout are no longer visible. After step 3 the user is still signed out — the long session does not return."],

            ["TC-LGN-18", "TS-LGN-07", "Login",
             "API call without Remember me issues a one-day session",
             "High", "Regression", "Boundary",
             "An account exists.",
             "Email: ali.khan@gmail.com\nPassword: Passw0rd!\nRemember me: false",
             "1. Submit a login request with the data above and Remember me set to false.\n2. Inspect the lifetime of the issued session token.",
             "The login succeeds and the issued session token is valid for one day from the time of issue."],

            ["TC-LGN-19", "TS-LGN-06", "Login",
             "API call with Remember me issues a thirty-day session",
             "High", "Smoke", "Functional",
             "An account exists.",
             "Email: sara.n@gmail.com\nPassword: Passw0rd!\nRemember me: true",
             "1. Submit a login request with the data above and Remember me set to true.\n2. Inspect the lifetime of the issued session token.",
             "The login succeeds and the issued session token is valid for thirty days from the time of issue."],

            ["TC-LGN-20", "TS-LGN-07", "Login",
             "Login request without the Remember me field defaults to a one-day session",
             "Medium", "Regression", "Edge",
             "An account exists. The legacy client does not send a Remember me field.",
             "Email: ali.khan@gmail.com\nPassword: Passw0rd! (no Remember me field)",
             "1. Submit a login request with email and password only (no Remember me field).\n2. Inspect the lifetime of the issued session token.",
             "The login succeeds. The issued session token is valid for one day, the same as if Remember me had been explicitly unchecked."],

            ["TC-LGN-21", "TS-LGN-06", "Login",
             "Truthy Remember me value other than true is treated as Remember me ON",
             "Low", "Regression", "Edge",
             "An account exists.",
             "Email: ali.khan@gmail.com\nPassword: Passw0rd!\nRemember me: \"yes\"",
             "1. Submit a login request with Remember me set to a truthy non-boolean value such as \"yes\".\n2. Inspect the lifetime of the issued session token.",
             "The login succeeds and the issued session token is valid for thirty days, the same as if Remember me had been explicitly checked."],

            ["TC-LGN-22", "TS-LGN-08", "Login",
             "Wrong password with Remember me ticked is still rejected and no session is started",
             "High", "Smoke", "Negative",
             "An account exists with email ali.khan@gmail.com.",
             "Email: ali.khan@gmail.com\nPassword: WrongPass1\nRemember me: checked",
             "1. Open the Login page.\n2. Enter the email and a wrong password.\n3. Tick Remember me.\n4. Click Log in.",
             "The validation message \"Invalid email or password\" is displayed. The user remains on the Login page and is not signed in. No long session is started."],
        ],
    },

    # --------------------------------------------------------------------- M4
    {
        "key": "M4-Logout",
        "name": "M4 Logout",
        "scenarios": [
            ["TS-LGT-01", "Logout",
             "User can log out and is returned to the home page",
             "Verify that logout from any page returns the user to the visitor state.",
             "Positive, State Change"],
            ["TS-LGT-02", "Logout",
             "Author-only pages are protected after logout",
             "Verify that protected pages cannot be reached after logout.",
             "Negative, Navigation"],
        ],
        "cases": [
            ["TC-LGT-01", "TS-LGT-01", "Logout",
             "User logs out from the home page",
             "High", "Smoke", "Positive",
             "The user is logged in and on the home page.",
             "No data required.",
             "1. Open the home page while logged in.\n2. Click Logout in the top menu.",
             "The user is returned to the home page as a visitor. The top menu now shows Login and Sign up. The greeting and Logout are no longer visible."],

            ["TC-LGT-02", "TS-LGT-01", "Logout",
             "User logs out from the New Post page",
             "Medium", "Regression", "Functional",
             "The user is logged in.",
             "No data required.",
             "1. Open the New Post page.\n2. Click Logout in the top menu.",
             "The user is returned to the home page as a visitor."],

            ["TC-LGT-03", "TS-LGT-01", "Logout",
             "User logs out from a post detail page",
             "Medium", "Regression", "Functional",
             "The user is logged in. At least one post exists.",
             "No data required.",
             "1. Open any post's detail page.\n2. Click Logout in the top menu.",
             "The user is returned to the home page as a visitor."],

            ["TC-LGT-04", "TS-LGT-02", "Logout",
             "Visitor is sent to the Login page when trying to write a post after logout",
             "High", "Regression", "Negative",
             "The user has just logged out.",
             "No data required.",
             "1. Click Logout from the top menu.\n2. Try to open the New Post page.",
             "The Login page opens with the \"Log in\" heading. The New Post form is not shown."],
        ],
    },

    # --------------------------------------------------------------------- M5
    {
        "key": "M5-Home",
        "name": "M5 Home / Posts Listing",
        "scenarios": [
            ["TS-HOM-01", "Home",
             "Posts are listed newest-first with full card details",
             "Verify the home page renders posts with title, author, date, and a preview.",
             "Positive, UI, Functional"],
            ["TS-HOM-02", "Home",
             "Empty state and error state are clearly shown",
             "Verify the page when no posts exist or the list cannot be loaded.",
             "Edge, Negative, UI"],
            ["TS-HOM-03", "Home",
             "Long content is shortened in the list with three dots",
             "Verify the 240-character preview boundary.",
             "Boundary, UI"],
            ["TS-HOM-04", "Home",
             "Special characters in posts are shown safely",
             "Verify safe rendering of post content and titles.",
             "Validation, UI"],
        ],
        "cases": [
            ["TC-HOM-01", "TS-HOM-01", "Home",
             "Each post shows title, author, date, and a short preview",
             "High", "Smoke", "Positive",
             "At least one post exists.",
             "Title: Welcome to MiniBlog\nContent: Hello world\nAuthor: ali.khan",
             "1. Open the home page.\n2. Look at the first post in the list.",
             "The post card shows the title \"Welcome to MiniBlog\" as a clickable link, the author label \"by ali.khan\", a date, and the preview text \"Hello world\"."],

            ["TC-HOM-02", "TS-HOM-01", "Home",
             "Newest post appears at the top of the list",
             "High", "Regression", "Functional",
             "Two posts have been created in known order.",
             "First post created: \"First Post\"\nSecond post created: \"Second Post\"",
             "1. Open the home page after both posts are created.",
             "\"Second Post\" appears above \"First Post\" in the list."],

            ["TC-HOM-03", "TS-HOM-02", "Home",
             "Empty list shows a friendly message",
             "Medium", "Regression", "Edge",
             "No posts exist on the platform.",
             "No data required.",
             "1. Open the home page when there are no posts.",
             "The page shows the message \"No posts yet. Be the first to write one!\" and no post cards are displayed."],

            ["TC-HOM-04", "TS-HOM-03", "Home",
             "Long content is shortened with three dots in the list",
             "High", "Regression", "Boundary",
             "A post with long content exists.",
             "Content: 300 characters of the letter \"a\".",
             "1. Open the home page.\n2. Look at the long post's preview.",
             "The preview shows the first 240 characters of the content followed by three dots."],

            ["TC-HOM-05", "TS-HOM-03", "Home",
             "Content of exactly 240 characters is shown without three dots",
             "Medium", "Regression", "Boundary",
             "A post exists whose content is exactly 240 characters long.",
             "Content: 240 characters of the letter \"a\".",
             "1. Open the home page.\n2. Look at the post's preview.",
             "The full content is shown in the preview without trailing dots."],

            ["TC-HOM-06", "TS-HOM-04", "Home",
             "Title containing HTML-like text is shown as plain text",
             "High", "Regression", "Validation",
             "A post has been created whose title contains script-like text (input-sanitization check).",
             "Title: <script>alert(1)</script>\nContent: Sample post content",
             "1. Open the home page.\n2. Look at the post card with the script-like title.",
             "The title is shown as plain readable text. No script runs and no popup appears."],

            ["TC-HOM-07", "TS-HOM-01", "Home",
             "Post date is shown in a human-readable format",
             "Low", "Regression", "UI",
             "A post exists.",
             "No data required.",
             "1. Open the home page.\n2. Look at the date next to the author on a post card.",
             "A human-readable date and time are shown."],

            ["TC-HOM-08", "TS-HOM-01", "Home",
             "User opens a post's detail page by clicking its title",
             "High", "Smoke", "Navigation",
             "A post exists.",
             "Title: Welcome to MiniBlog",
             "1. Open the home page.\n2. Click the post title \"Welcome to MiniBlog\".",
             "The post detail page opens with \"Welcome to MiniBlog\" as the heading."],

            ["TC-HOM-09", "TS-HOM-02", "Home",
             "Clear error message appears when posts cannot be loaded",
             "Medium", "Regression", "Negative",
             "The platform cannot retrieve posts (for example, the service is unavailable).",
             "No data required.",
             "1. Open the home page when posts cannot be retrieved.",
             "A \"Failed to load posts\" message is shown in place of the list."],
        ],
    },

    # --------------------------------------------------------------------- M6
    {
        "key": "M6-PostDetail",
        "name": "M6 Post Detail",
        "scenarios": [
            ["TS-PDT-01", "Post Detail",
             "Existing post is displayed with full details",
             "Verify the happy-path render of a single post.",
             "Positive, UI"],
            ["TS-PDT-02", "Post Detail",
             "Missing post selection is handled gracefully",
             "Verify that opening the post page without selecting a post is handled.",
             "Negative, Edge"],
            ["TS-PDT-03", "Post Detail",
             "Unknown post selection shows a not-found message",
             "Verify that a non-existent post shows a clear error.",
             "Negative, Edge"],
            ["TS-PDT-04", "Post Detail",
             "Delete button is shown only to the author of the post",
             "Verify that only the author can see the Delete button.",
             "Validation, UI, Negative"],
            ["TS-PDT-05", "Post Detail",
             "Special characters in posts are displayed safely",
             "Verify safe rendering of title and content on the detail page.",
             "Validation, UI"],
        ],
        "cases": [
            ["TC-PDT-01", "TS-PDT-01", "Post Detail",
             "Existing post displays title, author, date, and full content",
             "High", "Smoke", "Positive",
             "A post exists on the platform.",
             "An existing post (e.g., title \"Welcome to MiniBlog\").",
             "1. Open the home page.\n2. Click the post title to open its detail page.",
             "The page shows the post heading, the author label, the date, and the full content of the post."],

            ["TC-PDT-02", "TS-PDT-02", "Post Detail",
             "Post detail page shows a clear message when no post is selected",
             "Medium", "Regression", "Negative",
             "No post is selected.",
             "No data required.",
             "1. Open the post detail page without selecting a post.",
             "The page shows the message \"Missing post id.\" and no post is loaded."],

            ["TC-PDT-03", "TS-PDT-03", "Post Detail",
             "Opening a non-existent post shows a not-found message",
             "High", "Regression", "Negative",
             "A post with the chosen reference does not exist.",
             "Post reference: 999999",
             "1. Open the post detail page for the non-existent post.",
             "The page shows the message \"Failed to load post: Post not found\"."],

            ["TC-PDT-04", "TS-PDT-03", "Post Detail",
             "Opening a post with an invalid reference shows a not-found message",
             "Medium", "Regression", "Edge",
             "The post reference is not a valid number.",
             "Post reference: abc",
             "1. Open the post detail page using an invalid reference.",
             "The page shows the message \"Failed to load post: Post not found\"."],

            ["TC-PDT-05", "TS-PDT-04", "Post Detail",
             "Author sees the Delete button on their own post",
             "High", "Smoke", "Positive",
             "The user is logged in as the post's author.",
             "Author: ali.khan\nThe author has at least one post.",
             "1. Log in as Ali Khan.\n2. Open one of Ali Khan's posts.",
             "A Delete button is visible on the post detail page."],

            ["TC-PDT-06", "TS-PDT-04", "Post Detail",
             "Visitor does not see the Delete button",
             "High", "Regression", "Negative",
             "The user is not logged in.",
             "An existing post.",
             "1. Make sure no user is logged in.\n2. Open any post detail page.",
             "No Delete button is shown."],

            ["TC-PDT-07", "TS-PDT-04", "Post Detail",
             "Logged-in user does not see Delete on someone else's post",
             "High", "Regression", "Negative",
             "User Sara is logged in. The post belongs to Ali Khan.",
             "Other user: sara.n / sara.n@gmail.com\nPost owner: ali.khan",
             "1. Log in as Sara.\n2. Open Ali Khan's post detail page.",
             "No Delete button is shown."],

            ["TC-PDT-08", "TS-PDT-05", "Post Detail",
             "Title containing HTML-like text is shown safely",
             "High", "Regression", "Validation",
             "A post has been created whose title contains image/script-like text (input-sanitization check).",
             "Title: <img src=x onerror=alert(1)>\nContent: Sample content",
             "1. Open that post's detail page.",
             "The title is shown as plain text. No image is loaded and no popup appears."],

            ["TC-PDT-09", "TS-PDT-05", "Post Detail",
             "Content with line breaks and special characters is shown safely",
             "Medium", "Regression", "UI",
             "A post has been created with mixed text content.",
             "Title: Mixed sample\nContent: Line one and line two with & and <html>",
             "1. Open that post's detail page.",
             "The content is shown as plain readable text. No formatting tags are rendered."],

            ["TC-PDT-10", "TS-PDT-01", "Post Detail",
             "\"Back to all posts\" link returns the user to the home page",
             "Low", "Regression", "Navigation",
             "A post exists.",
             "No data required.",
             "1. Open any post's detail page.\n2. Click the \"Back to all posts\" link.",
             "The home page opens with the list of posts."],
        ],
    },

    # --------------------------------------------------------------------- M7
    {
        "key": "M7-CreatePost",
        "name": "M7 New Post",
        "scenarios": [
            ["TS-CRT-01", "New Post",
             "Author can publish a post with valid title and content",
             "Verify the happy-path post creation flow.",
             "Positive, Functional"],
            ["TS-CRT-02", "New Post",
             "New Post form enforces required fields",
             "Verify that empty title or content is not accepted.",
             "Negative, Validation"],
            ["TS-CRT-03", "New Post",
             "Title length stops at the maximum allowed",
             "Verify the 200-character title boundary.",
             "Boundary, UI"],
            ["TS-CRT-04", "New Post",
             "Visitor cannot reach the New Post page",
             "Verify the access guard for visitors.",
             "Negative, Navigation"],
            ["TS-CRT-05", "New Post",
             "Expired session is handled gracefully",
             "Verify the session-expired flow during post creation.",
             "Negative, Edge, Functional"],
        ],
        "cases": [
            ["TC-CRT-01", "TS-CRT-01", "New Post",
             "Author publishes a new post with valid details",
             "High", "Smoke", "Positive",
             "The user is logged in as ali.khan.",
             "Title: QA Roadmap 2026\nContent: Plans for automation, cross-browser, and security review.",
             "1. Click New Post in the top menu.\n2. Enter the title and content.\n3. Click Publish.",
             "The post detail page opens with the new title as the heading and the full content shown. The author is shown as ali.khan and a Delete button is visible."],

            ["TC-CRT-02", "TS-CRT-02", "New Post",
             "Title cannot be left empty",
             "Medium", "Regression", "Negative",
             "The user is logged in.",
             "Title: blank\nContent: Some content",
             "1. Open the New Post page.\n2. Leave Title blank, fill Content.\n3. Click Publish.",
             "The form does not submit. The Title field shows a \"please fill out this field\" prompt."],

            ["TC-CRT-03", "TS-CRT-02", "New Post",
             "Content cannot be left empty",
             "Medium", "Regression", "Negative",
             "The user is logged in.",
             "Title: Hello\nContent: blank",
             "1. Open the New Post page.\n2. Fill Title only.\n3. Click Publish.",
             "The form does not submit. The Content field shows a \"please fill out this field\" prompt."],

            ["TC-CRT-04", "TS-CRT-02", "New Post",
             "Relevant validation message is shown when title or content is missing",
             "Medium", "Regression", "Negative",
             "The user is logged in and submits without filling required fields.",
             "Title: blank\nContent: blank",
             "1. Submit a post creation request with title and content empty.",
             "The validation message \"title and content are required\" is displayed and no post is created."],

            ["TC-CRT-05", "TS-CRT-02", "New Post",
             "Title containing only spaces is treated as empty",
             "Medium", "Regression", "Edge",
             "The user is logged in.",
             "Title: \"     \"\nContent: valid",
             "1. Open the New Post page.\n2. Type only spaces in Title and \"valid\" in Content.\n3. Click Publish.",
             "The validation message \"title and content are required\" is displayed and no post is created."],

            ["TC-CRT-06", "TS-CRT-03", "New Post",
             "Title with exactly 200 characters is accepted",
             "High", "Regression", "Boundary",
             "The user is logged in.",
             "Title: 200 letters of \"a\"\nContent: Boundary test",
             "1. Open the New Post page.\n2. Paste a 200-character title and a short content.\n3. Click Publish.",
             "The post is created. The detail page opens with all 200 characters shown in the heading."],

            ["TC-CRT-07", "TS-CRT-03", "New Post",
             "Title field stops accepting input after 200 characters",
             "Medium", "Regression", "Boundary",
             "The user is logged in.",
             "Type a 250-character title.",
             "1. Open the New Post page.\n2. Type 250 characters into the Title field.",
             "The Title field accepts only the first 200 characters."],

            ["TC-CRT-08", "TS-CRT-04", "New Post",
             "Visitor is redirected to Login when opening the New Post page",
             "High", "Smoke", "Negative",
             "The user is not logged in.",
             "No data required.",
             "1. Make sure no user is logged in.\n2. Try to open the New Post page.",
             "The Login page opens. The New Post form is not shown."],

            ["TC-CRT-09", "TS-CRT-05", "New Post",
             "User without a valid session is sent to the Login page when opening New Post",
             "Medium", "Regression", "Negative",
             "The user's session has been cleared.",
             "No data required.",
             "1. Clear the active session.\n2. Open the New Post page.",
             "The Login page opens immediately. The New Post form is not shown."],

            ["TC-CRT-10", "TS-CRT-05", "New Post",
             "Expired session shows an error and returns the user to Login",
             "High", "Regression", "Edge",
             "The user has an invalid or expired session.",
             "Title: Test\nContent: Should fail",
             "1. With an invalid session, open the New Post page.\n2. Enter the title and content.\n3. Click Publish.",
             "An error message about an invalid or expired session is shown. After a short delay, the Login page opens. The user must log in again before publishing."],

            ["TC-CRT-11", "TS-CRT-01", "New Post",
             "Title and content are saved without leading or trailing spaces",
             "Medium", "Regression", "Functional",
             "The user is logged in.",
             "Title: \"  Padded Title  \"\nContent: \"  body  \"",
             "1. Open the New Post page.\n2. Enter the padded title and content.\n3. Click Publish.",
             "The post detail page shows the heading \"Padded Title\" without extra spaces and the content trimmed."],
        ],
    },

    # --------------------------------------------------------------------- M8
    {
        "key": "M8-DeletePost",
        "name": "M8 Delete Post",
        "scenarios": [
            ["TS-DEL-01", "Delete Post",
             "Author can delete their own post after confirming",
             "Verify the happy-path delete flow.",
             "Positive, Functional"],
            ["TS-DEL-02", "Delete Post",
             "Author can cancel the delete confirmation safely",
             "Verify that cancelling the prompt keeps the post intact.",
             "Negative"],
            ["TS-DEL-03", "Delete Post",
             "Only the post's author can delete the post",
             "Verify ownership is enforced for deletion.",
             "Negative, Critical"],
            ["TS-DEL-04", "Delete Post",
             "Deleting an unknown post shows a not-found message",
             "Verify the not-found behavior on delete.",
             "Negative, Edge"],
        ],
        "cases": [
            ["TC-DEL-01", "TS-DEL-01", "Delete Post",
             "Author deletes their own post and is returned to the home page",
             "High", "Smoke", "Positive",
             "The user is logged in as the post's author.",
             "The author's existing post.",
             "1. Open the post detail page for the author's post.\n2. Click Delete.\n3. Confirm \"Delete this post?\".",
             "The user is returned to the home page. The deleted post no longer appears in the list."],

            ["TC-DEL-02", "TS-DEL-02", "Delete Post",
             "Cancelling the confirmation keeps the post intact",
             "High", "Regression", "Negative",
             "The user is logged in as the post's author.",
             "The author's existing post.",
             "1. Open the post detail page.\n2. Click Delete.\n3. Cancel the \"Delete this post?\" prompt.",
             "The user remains on the post detail page. The post is not deleted and still appears on the home page."],

            ["TC-DEL-03", "TS-DEL-03", "Delete Post",
             "A user cannot delete a post that belongs to someone else",
             "High", "Regression", "Negative",
             "User Sara is logged in. The post belongs to Ali Khan.",
             "Other user: sara.n / sara.n@gmail.com\nPost owner: ali.khan",
             "1. Log in as Sara.\n2. Try to delete Ali Khan's post.",
             "The action is rejected with the message \"You can only delete your own posts\". The post still appears on the home page."],

            ["TC-DEL-04", "TS-DEL-04", "Delete Post",
             "Deleting a non-existent post shows a not-found message",
             "Medium", "Regression", "Edge",
             "The user is logged in. The chosen post does not exist.",
             "Post reference: 999999",
             "1. While logged in, try to delete a post that does not exist.",
             "The validation message \"Post not found\" is displayed and no post is deleted."],

            ["TC-DEL-05", "TS-DEL-01", "Delete Post",
             "Deleting the only existing post shows the empty list message",
             "Medium", "Regression", "Edge",
             "Only one post exists, owned by the current user.",
             "The user's only post.",
             "1. Open the post detail page.\n2. Click Delete and confirm.",
             "The home page opens and shows \"No posts yet. Be the first to write one!\"."],

            ["TC-DEL-06", "TS-DEL-03", "Delete Post",
             "A delete attempt without a valid session is rejected",
             "High", "Regression", "Negative",
             "The user is not signed in.",
             "An existing post.",
             "1. Without being signed in, try to delete a post.",
             "The action is rejected with the message \"Missing token\". The post still exists."],

            ["TC-DEL-07", "TS-DEL-03", "Delete Post",
             "A delete attempt with an invalid session is rejected",
             "High", "Regression", "Negative",
             "The user's session is invalid or has expired.",
             "An existing post.",
             "1. With an invalid session, try to delete a post.",
             "The action is rejected with the message \"Invalid or expired token\". The post still exists."],

            ["TC-DEL-08", "TS-DEL-01", "Delete Post",
             "End-to-end: register, publish a post, delete it, and verify it is gone",
             "High", "Smoke", "Functional",
             "A new visitor with no posts.",
             "Username: noor.e\nEmail: noor.e@gmail.com\nPassword: Strong#22\nTitle: Soon to be deleted\nContent: Bye",
             "1. Register a new account.\n2. Create a post with the title and content above.\n3. Open the post's detail page and delete it.\n4. Open the home page.\n5. Try to open the deleted post's detail page again.",
             "The post no longer appears on the home page. Opening the deleted post's detail page shows \"Failed to load post: Post not found\"."],
        ],
    },

]


def write_table(ws, start_row, headers, widths, rows):
    """Write a table with bold filled header. Returns row after the table."""
    for col_idx, header in enumerate(headers, start=1):
        cell = ws.cell(row=start_row, column=col_idx, value=header)
        cell.font = HEADER_FONT
        cell.fill = HEADER_FILL
        cell.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
        cell.border = BORDER
    ws.row_dimensions[start_row].height = 28

    for i, row in enumerate(rows, start=start_row + 1):
        for col_idx, val in enumerate(row, start=1):
            cell = ws.cell(row=i, column=col_idx, value=val)
            cell.alignment = WRAP_TOP
            cell.border = BORDER

    for col_idx, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(col_idx)].width = w

    return start_row + 1 + len(rows)


def write_section(ws, row, label):
    cell = ws.cell(row=row, column=1, value=label)
    cell.font = SECTION_FONT
    cell.fill = SECTION_FILL
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=11)
    ws.row_dimensions[row].height = 22
    return row + 1


def write_title(ws, row, label):
    cell = ws.cell(row=row, column=1, value=label)
    cell.font = TITLE_FONT
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=11)
    ws.row_dimensions[row].height = 26
    return row + 1


# ---- build workbook ----
wb = Workbook()

summary = wb.active
summary.title = "Summary"
write_title(summary, 1, "MiniBlog QA Coverage — Module-wise Test Scenarios & Test Cases")
summary.cell(row=2, column=1,
             value="Project: MiniBlog | Base URL: http://localhost:8080 | Date: 2026-05-02"
             ).font = Font(italic=True, color="595959")
row = 4

summary_headers = ["Module", "Sheet", "Scenarios", "Test Cases"]
summary_widths = [32, 20, 14, 14]
summary_rows = []
total_scen, total_tc = 0, 0
for m in MODULES:
    s, t = len(m["scenarios"]), len(m["cases"])
    summary_rows.append([m["name"], m["key"], s, t])
    total_scen += s
    total_tc += t
summary_rows.append(["TOTAL", "", total_scen, total_tc])

write_table(summary, row, summary_headers, summary_widths, summary_rows)
total_row_idx = row + len(summary_rows)  # last data row
for col in range(1, 5):
    summary.cell(row=total_row_idx, column=col).font = Font(bold=True, color="1F3864")
summary.freeze_panes = "A5"

for m in MODULES:
    ws = wb.create_sheet(title=m["key"])
    r = write_title(ws, 1, m["name"])
    r += 1
    r = write_section(ws, r, "Test Scenarios")
    r = write_table(ws, r, SCEN_HEADERS, SCEN_WIDTHS, m["scenarios"])
    r += 1
    r = write_section(ws, r, "Test Cases")
    r = write_table(ws, r, TC_HEADERS, TC_WIDTHS, m["cases"])
    ws.freeze_panes = "A4"

wb.save(TMP)
try:
    if os.path.exists(OUT):
        os.remove(OUT)
    os.rename(TMP, OUT)
    final = OUT
except PermissionError:
    final = TMP
    print("NOTE: target file appears to be open in Excel; wrote to TMP path instead.", file=sys.stderr)
print("Saved:", final)
print(f"Modules={len(MODULES)} Scenarios={total_scen} TestCases={total_tc}")
