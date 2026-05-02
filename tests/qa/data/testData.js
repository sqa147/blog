// Realistic test data for the MiniBlog QA suite. Functions return fresh
// values per test so parallel runs do not collide on unique fields.

const ts = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

const users = {
  primary: () => {
    const t = ts();
    return {
      username: `ali.khan.${t}`.slice(0, 30),
      email: `ali.khan.${t}@miniblog.test`,
      password: 'Passw0rd!',
    };
  },
  secondary: () => {
    const t = ts();
    return {
      username: `sara.nadeem.${t}`.slice(0, 30),
      email: `sara.nadeem.${t}@miniblog.test`,
      password: 'Passw0rd!',
    };
  },
  fatima: () => {
    const t = ts();
    return {
      username: `fatima.a.${t}`.slice(0, 30),
      email: `fatima.a.${t}@miniblog.test`,
      password: 'abc123',
    };
  },
  noor: () => {
    const t = ts();
    return {
      username: `noor.e.${t}`.slice(0, 30),
      email: `noor.e.${t}@miniblog.test`,
      password: 'Strong#22',
    };
  },
};

const posts = {
  basic: () => ({
    title: `QA Roadmap ${ts()}`,
    content: 'Plans for automation, cross-browser, and security review.',
  }),
  with: (overrides) => ({
    title: `QA Roadmap ${ts()}`,
    content: 'Sample post content for automation.',
    ...overrides,
  }),
};

module.exports = { ts, users, posts };
