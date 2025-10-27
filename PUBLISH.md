# Publication Guide for FormShield AI

This guide will help you publish FormShield AI to NPM and GitHub as an open-source project.

## ✅ Pre-Publication Checklist

All sensitive information has been removed:
- [x] No API keys in code
- [x] `.gitignore` configured
- [x] `.env.example` created (no real keys)
- [x] `.npmignore` configured
- [x] Personal information removed

All documentation is complete:
- [x] README.md with examples
- [x] LICENSE (MIT)
- [x] CONTRIBUTING.md
- [x] SECURITY.md
- [x] TESTING.md

Package is ready:
- [x] Tests passing (25/25 ✅)
- [x] Build successful (CJS + ESM + types)
- [x] TypeScript strict mode
- [x] Package.json configured

## Step 1: Create GitHub Repository

### Option A: GitHub CLI (Recommended)

```bash
# Install GitHub CLI if needed
brew install gh

# Login to GitHub
gh auth login

# Create repository
gh repo create formshield-ai --public --description "Open-source TypeScript spam filter with multi-model AI"

# Push code
git remote add origin https://github.com/YOUR_USERNAME/formshield-ai.git
git branch -M main
git commit -m "Initial commit: FormShield AI v1.1.0"
git push -u origin main
```

### Option B: Manual GitHub Setup

1. Go to https://github.com/new
2. Repository name: `formshield-ai`
3. Description: "Open-source TypeScript spam filter with multi-model AI"
4. Make it **Public**
5. Don't initialize with README (we already have one)
6. Click "Create repository"

Then push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/formshield-ai.git
git branch -M main
git commit -m "Initial commit: FormShield AI v1.1.0"
git push -u origin main
```

## Step 2: Update package.json

Before publishing, update the repository URLs in `package.json`:

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/formshield-ai"
  },
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/formshield-ai/issues"
  },
  "homepage": "https://github.com/YOUR_USERNAME/formshield-ai#readme"
}
```

## Step 3: Publish to NPM

### Create NPM Account

If you don't have one:
1. Go to https://www.npmjs.com/signup
2. Create account
3. Verify email

### Login to NPM

```bash
npm login
```

Enter your:
- Username
- Password
- Email

### Test the Package

```bash
# Dry run (doesn't actually publish)
npm publish --dry-run

# This will show you what files will be included
```

### Publish!

```bash
# First release
npm publish --access public

# The package will be available at:
# https://www.npmjs.com/package/@formshield/ai
```

## Step 4: Create GitHub Release

### Using GitHub CLI

```bash
gh release create v1.1.0 \
  --title "FormShield AI v1.1.0" \
  --notes "Initial release with multi-model AI support"
```

### Using GitHub Web Interface

1. Go to your repository on GitHub
2. Click "Releases" → "Create a new release"
3. Tag: `v1.1.0`
4. Title: "FormShield AI v1.1.0"
5. Description:
```markdown
## 🎉 Initial Release

### Features

✅ **Rules-First Spam Detection**
- Disposable email detection
- Gibberish email detection
- URL pattern analysis
- Keyword filtering
- Prompt injection protection

✅ **Multi-Model AI Support**
- OpenAI (GPT-4o-mini)
- Anthropic (Claude 3.5 Sonnet)
- Ollama (Local AI)
- 6 router strategies (fallback, vote, blend, canary, A/B)

✅ **Privacy & Security**
- Automatic PII hashing
- Budget controls
- Prompt injection defenses
- GDPR-friendly

✅ **Field-Agnostic**
- Works with any form structure
- Custom rules support
- Built-in and custom validators

### Installation

\`\`\`bash
npm install @formshield/ai
\`\`\`

### Quick Start

\`\`\`typescript
import { createFormShield } from '@formshield/ai';

const shield = createFormShield();
const decision = await shield.evaluate({
  email: 'user@example.com',
  message: 'Your message here'
});
\`\`\`

See [README.md](README.md) for full documentation.
```

6. Click "Publish release"

## Step 5: Add Topics on GitHub

Go to your repository and add topics:
- `spam-filter`
- `ai`
- `typescript`
- `openai`
- `anthropic`
- `form-protection`
- `security`
- `npm-package`

## Step 6: Set Up GitHub Actions (Optional)

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run build
```

## Step 7: Promote Your Package

### Add badges to README

```markdown
[![npm version](https://badge.fury.io/js/%40formshield%2Fai.svg)](https://www.npmjs.com/package/@formshield/ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://github.com/YOUR_USERNAME/formshield-ai/actions/workflows/test.yml/badge.svg)](https://github.com/YOUR_USERNAME/formshield-ai/actions)
```

### Share on:
- Twitter/X
- Reddit (r/javascript, r/typescript, r/opensource)
- Dev.to
- Hacker News
- Product Hunt

### Example Tweet:
```
Just released FormShield AI! 🛡️

Open-source spam filter with:
✅ Rules-first (cheap!)
✅ Multi-model AI (OpenAI, Anthropic, local)
✅ Privacy-focused (auto PII hashing)
✅ Edge-compatible

Perfect for form submissions!

npm: @formshield/ai
GitHub: [link]

#opensource #typescript #ai
```

## Maintenance

### Updating Versions

```bash
# Patch (bug fixes): 1.1.0 → 1.1.1
npm version patch

# Minor (new features): 1.1.0 → 1.2.0
npm version minor

# Major (breaking changes): 1.1.0 → 2.0.0
npm version major

# Then publish
npm publish
git push --tags
```

### Responding to Issues

- Acknowledge within 48 hours
- Label appropriately (bug, feature, question)
- Be welcoming to new contributors
- Link to CONTRIBUTING.md

### Security Updates

- Follow SECURITY.md process
- Release patches quickly
- Document in CHANGELOG.md
- Notify users via GitHub Security Advisories

## Support & Community

Consider creating:
- GitHub Discussions for Q&A
- Discord server for community
- Blog posts about features
- Video tutorials
- Example projects

## Monetization (Optional)

While keeping the core open-source, you could offer:
- Hosted service (managed API)
- Enterprise support
- Custom integrations
- Training & consulting
- Priority bug fixes

## License

This project is MIT licensed - anyone can use, modify, and distribute it freely!

---

## Quick Command Reference

```bash
# Initial setup
git init
git add -A
git commit -m "Initial commit"

# Create GitHub repo
gh repo create formshield-ai --public

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/formshield-ai.git
git push -u origin main

# Publish to NPM
npm login
npm publish --access public

# Create release
gh release create v1.1.0

# Update version
npm version patch/minor/major
npm publish
git push --tags
```

---

**Congratulations on open-sourcing FormShield AI!** 🎉

You're now contributing to the developer community!
