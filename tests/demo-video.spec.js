// tests/demo-video.spec.js
//
// Records the full client demo of MiniBlog with cursor, highlights,
// step titles and a Node-side voiceover timeline. Designed to look like
// a real guided product walkthrough.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const {
  setupDemoOverlay,
  showDemoTitle,
  hideDemoTitle,
  narrate,
  awaitNarrationEnd,
  resetTimeline,
  flushTimeline,
  demoClick,
  demoFill,
  waitForDemo,
  OUTPUT_DIR,
} = require('./helpers/demoEffects');

function uniqueUser() {
  const tag = Date.now().toString(36) + Math.floor(Math.random() * 1000);
  return {
    username: `demo_${tag}`,
    email: `demo_${tag}@example.com`,
    password: 'Passw0rd!',
  };
}

test.describe('MiniBlog · client demo with voiceover', () => {
  test.afterEach(async () => {
    flushTimeline();
  });

  test('signup → publish → view → delete → logout', async ({ page }) => {
    test.setTimeout(240_000);

    // Reset Node-side narration timeline before recording starts.
    resetTimeline();

    // Inject overlay (title + cursor) on every page navigation.
    await setupDemoOverlay(page);

    const user = uniqueUser();
    const post = {
      title: `Welcome to MiniBlog — ${new Date().toLocaleDateString()}`,
      content:
        'MiniBlog lets anyone publish a short post in seconds. This is our very first one!',
    };

    // ── STEP 1 · Land on the homepage ──────────────────────────────
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Latest posts' })).toBeVisible();
    await showDemoTitle(page, 'Welcome to MiniBlog');
    await narrate(
      page,
      'Welcome to MiniBlog, a simple platform to read and publish blog posts.'
    );
    await awaitNarrationEnd();
    await waitForDemo(page, 600);

    // ── STEP 2 · Open the Sign up page ─────────────────────────────
    await demoClick(
      page,
      page.locator('#nav-links').getByRole('link', { name: 'Sign up', exact: true }),
      {
        title: 'Step 1 · Create your account',
        voiceover: 'Let us create a new account by clicking Sign up.',
      }
    );
    await page.waitForURL(/\/signup\.html$/);
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();

    // ── STEP 3 · Fill the signup form ──────────────────────────────
    await demoFill(page, page.getByLabel('Username'), user.username, {
      title: 'Step 2 · Pick a username',
      voiceover: 'We pick a username.',
    });
    await demoFill(page, page.getByLabel('Email'), user.email, {
      title: 'Step 3 · Add your email',
      voiceover: 'We add an email address.',
    });
    await demoFill(page, page.getByLabel(/Password/i), user.password, {
      title: 'Step 4 · Choose a password',
      voiceover: 'And we choose a secure password.',
    });

    // ── STEP 4 · Submit signup ─────────────────────────────────────
    await demoClick(
      page,
      page.getByRole('button', { name: 'Sign up', exact: true }),
      {
        title: 'Step 5 · Sign up',
        voiceover: 'Now we sign up. The app logs us in automatically.',
      }
    );
    await page.waitForURL((url) => url.pathname === '/' || url.pathname === '');
    await expect(page.getByRole('heading', { name: 'Latest posts' })).toBeVisible();
    await expect(
      page.locator('#nav-links').getByRole('link', { name: 'New Post', exact: true })
    ).toBeVisible();
    await waitForDemo(page, 800);

    // ── STEP 5 · Log out so we can demo the Login module ───────────
    await demoClick(page, page.locator('#logout-btn'), {
      title: 'Step 6 · Log out to show Login',
      voiceover:
        'To demo the login screen, let us first log out of the new account.',
    });
    await expect(
      page.locator('#nav-links').getByRole('link', { name: 'Login', exact: true })
    ).toBeVisible();
    await expect(
      page.locator('#nav-links').getByRole('link', { name: 'Sign up', exact: true })
    ).toBeVisible();
    await waitForDemo(page, 600);

    // ── STEP 6 · Open the Login page ───────────────────────────────
    await demoClick(
      page,
      page.locator('#nav-links').getByRole('link', { name: 'Login', exact: true }),
      {
        title: 'Step 7 · Log back in',
        voiceover: 'Now we click Login to sign back into the same account.',
      }
    );
    await page.waitForURL(/\/login\.html$/);
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();

    // ── STEP 7 · Fill the login form ───────────────────────────────
    await demoFill(page, page.getByLabel('Email'), user.email, {
      title: 'Step 8 · Enter your email',
      voiceover: 'We enter the email we just signed up with.',
    });
    await demoFill(page, page.getByLabel('Password'), user.password, {
      title: 'Step 9 · Enter your password',
      voiceover: 'And the same password.',
    });

    // ── STEP 8 · Submit login ──────────────────────────────────────
    await demoClick(
      page,
      page.getByRole('button', { name: 'Log in', exact: true }),
      {
        title: 'Step 10 · Log in',
        voiceover: 'We hit Log in, and we are right back into our account.',
      }
    );
    await page.waitForURL((url) => url.pathname === '/' || url.pathname === '');
    await expect(page.getByRole('heading', { name: 'Latest posts' })).toBeVisible();
    await expect(
      page.locator('#nav-links').getByRole('link', { name: 'New Post', exact: true })
    ).toBeVisible();
    await waitForDemo(page, 800);

    // ── STEP 9 · Open the New Post page ────────────────────────────
    await demoClick(
      page,
      page.locator('#nav-links').getByRole('link', { name: 'New Post', exact: true }),
      {
        title: 'Step 11 · Write a new post',
        voiceover: 'We click New Post to start writing.',
      }
    );
    await page.waitForURL(/\/create\.html$/);
    await expect(page.getByRole('heading', { name: 'Write a new post' })).toBeVisible();

    // ── STEP 6 · Fill title and content ────────────────────────────
    await demoFill(page, page.getByLabel('Title'), post.title, {
      title: 'Step 12 · Add a title',
      voiceover: 'We give the post a clear title.',
    });
    await demoFill(page, page.getByLabel('Content'), post.content, {
      title: 'Step 13 · Write the content',
      voiceover: 'And we write a short message for our readers.',
    });

    // ── STEP 7 · Publish the post ──────────────────────────────────
    await demoClick(
      page,
      page.getByRole('button', { name: 'Publish', exact: true }),
      {
        title: 'Step 14 · Publish',
        voiceover: 'We hit Publish, and the post is live right away.',
      }
    );
    await page.waitForURL(/\/post\.html\?id=\d+/);
    await expect(page.locator('#post h1')).toHaveText(post.title);

    // ── STEP 8 · Confirm the post detail page ──────────────────────
    await showDemoTitle(page, 'Step 15 · Your post is live');
    await narrate(
      page,
      'Here is the published post with the title, the author and the full content.'
    );
    await awaitNarrationEnd();
    await waitForDemo(page, 800);

    // ── STEP 9 · Back to the homepage ──────────────────────────────
    await demoClick(page, page.locator('nav a.brand'), {
      title: 'Step 16 · Back to all posts',
      voiceover: 'Going back to the homepage, the new post sits at the top.',
    });
    await page.waitForURL((url) => url.pathname === '/' || url.pathname === '');
    const newCard = page
      .locator('article.post-card')
      .filter({ has: page.locator('h2 a', { hasText: post.title }) })
      .first();
    await expect(newCard).toBeVisible();
    await waitForDemo(page, 1000);

    // ── STEP 10 · Open the post from the listing ───────────────────
    await demoClick(page, newCard.locator('h2 a'), {
      title: 'Step 17 · Open the post',
      voiceover: 'Anyone can click a post to read the full version.',
    });
    await page.waitForURL(/\/post\.html\?id=\d+/);
    await expect(page.locator('#post h1')).toHaveText(post.title);

    // ── STEP 11 · Delete the post (author only) ────────────────────
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await demoClick(page, page.locator('#delete-btn'), {
      title: 'Step 18 · Delete (author only)',
      voiceover: 'Because we wrote this post, we can also delete it.',
    });
    await page.waitForURL((url) => url.pathname === '/' || url.pathname === '');

    // ── STEP 12 · Verify the post is gone ──────────────────────────
    await showDemoTitle(page, 'Step 19 · Post removed');
    await narrate(page, 'And just like that, the post is gone from the list.');
    await expect(
      page
        .locator('article.post-card')
        .filter({ has: page.locator('h2 a', { hasText: post.title }) })
    ).toHaveCount(0);
    await awaitNarrationEnd();
    await waitForDemo(page, 700);

    // ── STEP 13 · Log out ──────────────────────────────────────────
    await demoClick(page, page.locator('#logout-btn'), {
      title: 'Step 20 · Log out',
      voiceover:
        'Finally, we log out and the navigation goes back to its starting state.',
    });
    await expect(
      page.locator('#nav-links').getByRole('link', { name: 'Login', exact: true })
    ).toBeVisible();
    await expect(
      page.locator('#nav-links').getByRole('link', { name: 'Sign up', exact: true })
    ).toBeVisible();

    await showDemoTitle(page, 'Thank you for watching');
    await narrate(
      page,
      'That is the full MiniBlog experience — simple, fast and focused on the essentials.'
    );
    await awaitNarrationEnd();
    await waitForDemo(page, 1000);
    await hideDemoTitle(page);

    // Capture the Playwright video path so the voiceover builder finds it.
    const video = page.video();
    if (video) {
      try {
        const videoPath = await video.path();
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        fs.writeFileSync(
          path.join(OUTPUT_DIR, 'last-video-path.txt'),
          videoPath,
          'utf8'
        );
        console.log(`\n[demo] Video will be saved at: ${videoPath}`);
      } catch (e) {
        console.warn('[demo] Could not resolve video path:', e.message);
      }
    }
  });
});
