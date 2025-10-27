# @formshield/ai

Open-source TypeScript spam filter using **rules-first scoring** and **optional multi-model AI** for form submissions.

## Features

- 🛡️ **Rules-first approach**: Cheap, fast heuristics catch obvious spam
- 🤖 **Multi-model AI**: Optional OpenAI, Anthropic, Ollama for edge cases
- 🔒 **Privacy-focused**: Hash PII before AI, GDPR-friendly
- ⚡ **Edge-compatible**: Works on Vercel Edge, Cloudflare Workers, Node.js
- 🎯 **Field-agnostic**: Works with any form structure
- 💰 **Cost-optimized**: AI only for gray-zone submissions
- 🔐 **Prompt-injection safe**: Strict JSON schema, conservative fallbacks

## Installation

```bash
npm install @formshield/ai
```

Optional peer dependencies:

```bash
# For OpenAI
npm install openai

# For Anthropic
npm install @anthropic-ai/sdk
```

## Quick Start

### Basic Usage (Rules Only)

```typescript
import { createFormShield } from '@formshield/ai';

const shield = createFormShield();

const decision = await shield.evaluate({
  email: 'user@example.com',
  name: 'John Doe',
  message: 'I am interested in your services.',
  url: 'https://yoursite.com/contact',
  userAgent: req.headers['user-agent'],
});

console.log(decision);
// {
//   action: 'allow' | 'review' | 'block',
//   score: 85, // 0-100, higher = more human
//   reasons: ['email:valid', 'msg:legitimate'],
//   details: {}
// }
```

### With OpenAI (Fallback Strategy)

```typescript
import { createFormShield, openAiProvider } from '@formshield/ai';

const shield = createFormShield({
  aiProviders: [openAiProvider(process.env.OPENAI_API_KEY!)],
  router: { mode: 'first-available', order: ['openai'] },
  grayBand: [45, 65], // Only use AI for scores 45-65
});
```

### Multi-Model Voting

```typescript
import { createFormShield, openAiProvider, anthropicProvider } from '@formshield/ai';

const shield = createFormShield({
  aiProviders: [
    openAiProvider(process.env.OPENAI_API_KEY!),
    anthropicProvider(process.env.ANTHROPIC_API_KEY!),
  ],
  router: {
    mode: 'vote',
    members: ['openai', 'anthropic'],
    minAgree: 2, // Require agreement
  },
});
```

### Fallback with Budget Control

```typescript
const shield = createFormShield({
  aiProviders: [
    openAiProvider(process.env.OPENAI_API_KEY!),
    stubProvider('backup'),
  ],
  router: {
    mode: 'fallback',
    primary: 'openai',
    secondary: 'backup',
  },
  aiBudget: {
    perRequestUsd: 0.01,
    rollingUsd: 10.0, // $10/day rolling window
  },
});
```

## Configuration

```typescript
type Config = {
  // Domain filtering
  allowDomains?: string[]; // Auto-allow these domains
  blockDomains?: string[]; // Auto-block these domains
  disposableDomains?: string[]; // Additional disposable domains

  // Email filtering
  allowEmailsHashed?: string[]; // SHA256 hashes of allowed emails
  blockEmailsHashed?: string[]; // SHA256 hashes of blocked emails

  // Content filtering
  blockKeywords?: string[]; // Keywords that trigger blocking

  // TLD risk scoring
  tldRisk?: Record<string, number>; // e.g., { 'xyz': -10, 'ru': -15 }

  // AI configuration
  aiProviders?: AiProvider[];
  router?: RouterStrategy;
  grayBand?: [number, number]; // Default: [45, 65]
  aiBudget?: { perRequestUsd?: number; rollingUsd?: number };

  // Privacy
  piiPolicy?: 'hash-local' | 'plain'; // Default: 'hash-local'

  // Performance
  cacheTtlMs?: number; // Default: 24 hours
  enableMxCheck?: boolean; // Default: false (Node-only)

  // Custom rules
  customRules?: Rule[];
};
```

## Router Strategies

### `none`
Rules-only, no AI classification.

### `first-available`
Use the first provider in order.

```typescript
{ mode: 'first-available', order: ['openai', 'anthropic'] }
```

### `fallback`
Try primary, fall back to secondary on error/timeout.

```typescript
{ mode: 'fallback', primary: 'openai', secondary: 'anthropic' }
```

### `vote`
Majority vote across multiple providers.

```typescript
{ mode: 'vote', members: ['openai', 'anthropic', 'ollama'] }
```

### `blend`
Weighted average of confidence scores.

```typescript
{
  mode: 'blend',
  members: [
    { id: 'openai', weight: 2 },
    { id: 'anthropic', weight: 1 }
  ]
}
```

### `canary`
Send % of traffic to candidate model for evaluation.

```typescript
{ mode: 'canary', control: 'openai', candidate: 'new-model', pct: 10 }
```

### `ab`
Split traffic by hash for A/B testing.

```typescript
{ mode: 'ab', a: 'openai', b: 'anthropic', salt: 'test' }
```

## Custom Rules

```typescript
import type { Rule } from '@formshield/ai';

const blockCompetitors: Rule = ({ normalized }) => {
  const domain = normalized.email?.split('@')[1];
  if (domain === 'competitor.com') {
    return { action: 'block', score: 0, reasons: ['competitor'] };
  }
  return null;
};

const shield = createFormShield({
  customRules: [blockCompetitors],
});
```

## Built-in Rules

```typescript
import {
  rulePhoneLooksFake,
  ruleUrlOnlyMessage,
  ruleCompanyVsDomainMismatch,
  ruleExcessiveCaps,
  ruleCryptoSpam,
  ruleSeoSpam,
} from '@formshield/ai';
```

## Field Descriptors

For better heuristics, provide field type hints:

```typescript
await shield.evaluate({
  fields: {
    firstName: 'John',
    lastName: 'Doe',
    company: 'Acme Inc',
    email: 'john@acme.com',
    phone: '+1-555-123-4567',
    message: 'I need help with...',
  },
  descriptors: [
    { key: 'firstName', type: 'name' },
    { key: 'lastName', type: 'name' },
    { key: 'company', type: 'company' },
    { key: 'email', type: 'email', required: true },
    { key: 'phone', type: 'phone' },
    { key: 'message', type: 'message', required: true },
  ],
});
```

## Examples

### Next.js API Route (Edge)

```typescript
// app/api/contact/route.ts
import { createFormShield, openAiProvider } from '@formshield/ai';

const shield = createFormShield({
  aiProviders: [openAiProvider(process.env.OPENAI_API_KEY!)],
  router: { mode: 'first-available', order: ['openai'] },
});

export const runtime = 'edge';

export async function POST(req: Request) {
  const body = await req.json();

  const decision = await shield.evaluate({
    email: body.email,
    name: body.name,
    message: body.message,
    url: req.url,
    userAgent: req.headers.get('user-agent') || undefined,
    timestampMs: Date.now(),
  });

  if (decision.action === 'block') {
    return Response.json({ error: 'Submission blocked' }, { status: 403 });
  }

  if (decision.action === 'review') {
    // Queue for manual review
    await queueForReview(body, decision);
  }

  // Process submission
  return Response.json({ success: true });
}
```

### Express.js

```typescript
import express from 'express';
import { createFormShield, anthropicProvider } from '@formshield/ai';

const app = express();
const shield = createFormShield({
  aiProviders: [anthropicProvider(process.env.ANTHROPIC_API_KEY!)],
  router: { mode: 'first-available', order: ['anthropic'] },
});

app.post('/api/contact', async (req, res) => {
  const decision = await shield.evaluate({
    email: req.body.email,
    name: req.body.name,
    message: req.body.message,
    url: req.get('origin'),
    userAgent: req.get('user-agent'),
    ip: req.ip,
  });

  if (decision.action === 'block') {
    return res.status(403).json({ error: 'Spam detected' });
  }

  // Process submission
  res.json({ success: true });
});
```

## Local AI with Ollama

```typescript
import { createFormShield, ollamaProvider } from '@formshield/ai';

const shield = createFormShield({
  aiProviders: [
    ollamaProvider('mistral:7b', 'http://localhost:11434')
  ],
  router: { mode: 'first-available', order: ['ollama'] },
});
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Lint
npm run lint
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
