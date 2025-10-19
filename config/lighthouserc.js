import { env } from 'node:process';

module.exports = {
  ci: {
    collect: {
      settings: {
        chromeFlags: ['--headless', env.CI && '--no-sandbox']
          .filter(Boolean)
          .join(' '),
      },
      url: env.PR_NUMBER
        ? `https://${env.PR_NUMBER}.review.spaced.fun`
        : `https://staging.spaced.fun`,
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.7 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:performance': ['error', { minScore: 0.7 }],
        // 'categories:pwa': ['error', { minScore: 0.9 }],
        // 'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
