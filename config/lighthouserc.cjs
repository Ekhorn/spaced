const { CI, PR_NUMBER } = process.env;

module.exports = {
  ci: {
    collect: {
      settings: {
        chromeFlags: ['--headless', CI && '--no-sandbox']
          .filter(Boolean)
          .join(' '),
      },
      url: PR_NUMBER
        ? `https://${PR_NUMBER}.review.spaced.fun`
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
