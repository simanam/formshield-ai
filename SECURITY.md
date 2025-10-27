# Security Policy

## Reporting a Vulnerability

We take the security of FormShield AI seriously. If you discover a security vulnerability, please follow responsible disclosure practices.

### ⚠️ DO NOT

- Open a public GitHub issue for security vulnerabilities
- Disclose the vulnerability publicly before it's been addressed
- Exploit the vulnerability beyond what's necessary to demonstrate it

### ✅ DO

1. **Email the maintainers** at: [security@formshield.ai] or open a private security advisory on GitHub
2. **Include details**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. **Allow reasonable time** for us to address the issue before public disclosure (typically 90 days)

## Security Measures in FormShield AI

### PII Protection

- Email local-parts are hashed before AI classification
- Phone numbers are masked
- Messages are truncated and sanitized
- IP addresses are not sent to AI providers

### Prompt Injection Defenses

- Strict JSON schema validation
- Input treated as inert data
- Conservative fallback on parsing errors
- Pattern detection for injection attempts
- No tool/browse access for AI models

### AI Safety

- Budget controls prevent runaway costs
- Timeout limits on AI calls
- Fallback to rules-only on errors
- Output validation before use
- Conservative bias in uncertain cases

### Data Handling

- No persistent storage of user data
- Optional caching (disabled by default)
- Configurable PII policy
- No telemetry or tracking

## Known Limitations

### Not Protection Against

- **DDoS attacks** - Use rate limiting at infrastructure level
- **SQL injection** - This is a spam filter, not input sanitization
- **XSS attacks** - Sanitize user input before display
- **Account takeover** - Use proper authentication
- **Brute force** - Implement account lockout policies

### AI Model Risks

- **Model drift** - AI providers may update models
- **Adversarial inputs** - Sophisticated attacks may bypass detection
- **False negatives** - Some spam may slip through
- **False positives** - Legitimate emails may be flagged

## Best Practices for Users

### API Key Security

```bash
# ✅ DO: Use environment variables
OPENAI_API_KEY=sk-proj-xxx

# ❌ DON'T: Hardcode keys
const apiKey = "sk-proj-xxx"; // BAD!
```

### Configuration Security

```typescript
// ✅ DO: Hash PII
const shield = createFormShield({
  piiPolicy: "hash-local" // Default
});

// ⚠️ WARNING: Only use plain for self-hosted AI
const shield = createFormShield({
  piiPolicy: "plain" // Sends raw data to AI
});
```

### Budget Controls

```typescript
// ✅ DO: Set budget limits
const shield = createFormShield({
  aiBudget: {
    perRequestUsd: 0.01,
    rollingUsd: 10.0
  }
});
```

### Input Validation

```typescript
// ✅ DO: Validate before evaluation
if (!isValidEmail(submission.email)) {
  return { error: "Invalid email" };
}

const decision = await shield.evaluate(submission);
```

## Security Checklist

Before deploying:

- [ ] API keys in environment variables (not code)
- [ ] `.env` added to `.gitignore`
- [ ] Budget limits configured
- [ ] PII policy set appropriately
- [ ] Rate limiting implemented
- [ ] Input validation in place
- [ ] Output sanitization before display
- [ ] Logging doesn't include PII
- [ ] Dependencies regularly updated
- [ ] Tests include security scenarios

## Vulnerability Response

When a vulnerability is reported:

1. **Acknowledgment** within 48 hours
2. **Assessment** within 7 days
3. **Fix** based on severity:
   - Critical: 24-48 hours
   - High: 1 week
   - Medium: 2-4 weeks
   - Low: Next release
4. **Disclosure** coordinated with reporter
5. **Credit** given to reporter (if desired)

## Security Updates

Security fixes are released as patch versions:
- `1.0.x` → Security fix
- `1.x.0` → Feature release
- `x.0.0` → Breaking changes

Subscribe to releases on GitHub for notifications.

## Audit History

| Date | Type | Summary | Reporter |
|------|------|---------|----------|
| 2025-01 | Internal | Initial security review | Core team |

## Contact

- Security issues: [Create private security advisory on GitHub]
- General questions: [Open a public issue]
- Email: security@formshield.ai (if available)

---

**Thank you for helping keep FormShield AI secure!** 🔒
