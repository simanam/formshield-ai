# Testing FormShield AI with OpenAI

## Quick Test with Your OpenAI Key

### Step 1: Set Your API Key

```bash
export OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
```

### Step 2: Run the Test

```bash
npx tsx examples/test-openai.ts
```

## What the Test Does

The test will evaluate 5 different submissions:

1. ✅ **Legitimate inquiry** - Should be allowed
2. ❌ **SEO spam** - Should be blocked
3. ❌ **Crypto spam** - Should be blocked
4. ⚠️  **Borderline case** - May need review
5. ❌ **Prompt injection** - Should be blocked

For each submission, you'll see:
- The action (ALLOW/REVIEW/BLOCK)
- The confidence score (0-100)
- The reasons for the decision
- AI classification results
- Processing time

## Example Output

```
🛡️  FormShield AI - OpenAI Test

✅ API Key found: sk-proj-xxxxxxxxxxxxx...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Test: ✅ Legitimate inquiry

Input:
  Email: john.doe@company.com
  Name: John Doe
  Message: Hello, I am interested in learning more about your services...

Decision:
  Action: ✅ ALLOW
  Score: 78/100
  Duration: 1234ms
  Reasons: ai:human, email:valid, msg:legitimate

  AI Classification:
    - openai: human (confidence: 92%)
```

## Testing Without OpenAI (Free)

If you don't have an OpenAI key, you can still test with rules-only:

```bash
npx tsx examples/test-rules-only.ts
```

## Testing with Local AI (Free)

Install Ollama and run locally:

```bash
# Install Ollama: https://ollama.ai
ollama pull mistral

# Test with local model
npx tsx examples/test-ollama.ts
```

## Cost Estimation

OpenAI gpt-4o-mini pricing (as of 2024):
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

Each evaluation uses approximately:
- ~200 input tokens
- ~50 output tokens
- **Cost: ~$0.00004 per evaluation** (less than $0.0001)

With gray band filtering (default 45-65), AI is only called for ~20-30% of submissions, making the average cost even lower.

## Troubleshooting

### "OpenAI SDK not found"

```bash
npm install openai
```

### "API key not valid"

Make sure your key starts with `sk-proj-` and is not expired.

### "Rate limit exceeded"

OpenAI free tier has rate limits. Upgrade your account or wait a few minutes.

## Next Steps

1. Try the test with your own form submissions
2. Adjust the `grayBand` to control when AI is used
3. Add custom rules for your specific use case
4. Integrate into your application (see README.md)
