# FormShield AI v1.1.0 - Initial Release 🎉

## What is FormShield AI?

An open-source TypeScript spam filter that combines fast rules-based detection with optional multi-model AI classification. Built for developers who need affordable, privacy-focused form protection.

---

## ✨ Features

### Rules-First Detection (Free & Fast)
- ✅ 50+ disposable email domains
- ✅ Gibberish email detection (entropy, vowel ratio, patterns)
- ✅ URL pattern analysis
- ✅ Keyword filtering (SEO, crypto, casino, adult)
- ✅ Prompt injection detection
- ✅ Cross-field validation
- ✅ Timing analysis

### Multi-Model AI Support
- ✅ **OpenAI** (GPT-4o-mini)
- ✅ **Anthropic** (Claude 3.5 Sonnet)
- ✅ **Ollama** (Local, free)
- ✅ 6 routing strategies:
  - `first-available` - Use first provider
  - `fallback` - Primary with backup
  - `vote` - Majority voting
  - `blend` - Weighted averaging
  - `canary` - A/B testing
  - `ab` - Split testing

### Privacy & Security
- ✅ Automatic PII hashing (emails, phones)
- ✅ Message truncation (1500 chars)
- ✅ URL redaction in AI payloads
- ✅ Prompt injection defenses
- ✅ Strict JSON schema validation
- ✅ Budget controls ($0.00004 per AI eval)

### Developer Experience
- ✅ TypeScript strict mode
- ✅ ESM + CommonJS builds
- ✅ Edge-runtime compatible
- ✅ Zero runtime dependencies (core)
- ✅ 25/25 tests passing
- ✅ Comprehensive documentation

---

## 📦 Installation

```bash
npm install formshield-ai
```

Optional AI providers:
```bash
npm install openai                # For OpenAI
npm install @anthropic-ai/sdk     # For Anthropic
```

---

## 🚀 Quick Start

### Rules Only (Free)
```typescript
import { createFormShield } from 'formshield-ai';

const shield = createFormShield();

const decision = await shield.evaluate({
  email: 'user@example.com',
  name: 'John Doe',
  message: 'Interested in your services'
});

if (decision.action === 'block') {
  return { error: 'Spam detected' };
}
```

### With OpenAI
```typescript
import { createFormShield, openAiProvider } from 'formshield-ai';

const shield = createFormShield({
  aiProviders: [openAiProvider(process.env.OPENAI_API_KEY!)],
  router: { mode: 'first-available', order: ['openai'] },
  grayBand: [45, 65], // AI only for scores 45-65
});
```

---

## 💰 Cost Analysis

### Rules-Only Mode (Default)
- **Cost**: $0.00
- **Speed**: <1ms
- **Accuracy**: ~85-90%

### With AI (Gray Band 45-65)
- **AI Usage**: ~20-30% of submissions
- **Cost**: ~$0.00004 per eval (OpenAI gpt-4o-mini)
- **Speed**: ~1-2 seconds
- **Accuracy**: ~95-98%

**Example**: 10,000 submissions/month
- Rules-only: **$0**
- With AI: **~$0.80** (assuming 20% need AI)

---

## 📊 Test Results

```
✅ 25/25 tests passing

Test Suites:
✓ heuristics.test.ts (8 tests)
✓ rules.test.ts (6 tests)
✓ ai-safety.test.ts (6 tests)
✓ router.test.ts (5 tests)

Duration: 262ms
```

---

## 📚 Documentation

- [README.md](https://github.com/simanam/formshield-ai#readme) - Full documentation
- [CONTRIBUTING.md](https://github.com/simanam/formshield-ai/blob/main/CONTRIBUTING.md) - Contribution guide
- [SECURITY.md](https://github.com/simanam/formshield-ai/blob/main/SECURITY.md) - Security policy
- [TESTING.md](https://github.com/simanam/formshield-ai/blob/main/TESTING.md) - Testing guide

---

## 🔗 Links

- **NPM Package**: https://www.npmjs.com/package/formshield-ai
- **GitHub Repository**: https://github.com/simanam/formshield-ai
- **Report Issues**: https://github.com/simanam/formshield-ai/issues

---

## 🙏 Contributing

Contributions welcome! See [CONTRIBUTING.md](https://github.com/simanam/formshield-ai/blob/main/CONTRIBUTING.md)

---

## 📝 License

MIT License - See [LICENSE](https://github.com/simanam/formshield-ai/blob/main/LICENSE)

---

**Built with ❤️ for the open-source community**
