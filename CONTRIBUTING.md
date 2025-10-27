# Contributing to FormShield AI

Thank you for your interest in contributing to FormShield AI! 🎉

## Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Submit code improvements
- 🧪 Add test cases
- 🤖 Add new AI provider integrations

## Getting Started

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/formshield-ai.git
cd formshield-ai
npm install
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Set Up Environment

```bash
cp .env.example .env
# Add your API keys for testing (optional)
```

### 4. Make Changes

- Write clean, readable code
- Follow existing code style
- Add tests for new features
- Update documentation as needed

### 5. Test Your Changes

```bash
# Run all tests
npm test

# Test specific functionality
npm run test:watch

# Check TypeScript types
npm run lint
```

### 6. Commit and Push

```bash
git add .
git commit -m "feat: add new feature" # or "fix: bug description"
git push origin feature/your-feature-name
```

### 7. Open a Pull Request

- Go to the repository on GitHub
- Click "New Pull Request"
- Describe your changes clearly
- Reference any related issues

## Code Style Guidelines

### TypeScript

- Use TypeScript strict mode
- Add types for all function parameters
- Avoid `any` when possible
- Export types for public APIs

### Naming Conventions

- `camelCase` for variables and functions
- `PascalCase` for types and interfaces
- `kebab-case` for file names
- Descriptive names (no single letters except loops)

### Comments

- Add JSDoc comments for public APIs
- Explain **why**, not **what**
- Keep comments up-to-date

### Example

```typescript
/**
 * Evaluate a form submission for spam
 * @param submission - The form data to evaluate
 * @returns Decision with action (allow/review/block) and score
 */
export async function evaluate(submission: Submission): Promise<Decision> {
  // Implementation
}
```

## Adding New Features

### Adding a New AI Provider

1. Create a new file in `src/providers/`
2. Implement the `AiProvider` interface
3. Add tests in `tests/`
4. Update README.md with usage example

Example:
```typescript
// src/providers/myai.ts
import type { AiProvider } from "../types";

export function myAiProvider(apiKey: string): AiProvider {
  return {
    id: "myai",
    async classify(input) {
      // Your implementation
      return {
        label: "human",
        confidence: 0.9,
        provider: "myai"
      };
    }
  };
}
```

### Adding a New Rule

1. Add rule function to `src/core/rules.ts`
2. Export from `src/index.ts`
3. Add test cases
4. Document in README.md

Example:
```typescript
export const ruleMyCustomRule: Rule = ({ normalized }) => {
  // Your logic
  if (condition) {
    return { score: 20, reasons: ["custom:my-rule"] };
  }
  return null;
};
```

## Testing

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Writing Tests

- Place tests in `tests/` directory
- Name files `*.test.ts`
- Use descriptive test names
- Test edge cases

Example:
```typescript
import { describe, it, expect } from "vitest";

describe("My Feature", () => {
  it("should handle valid input", () => {
    // Test implementation
  });

  it("should reject invalid input", () => {
    // Test implementation
  });
});
```

## Security Guidelines

### DO ✅

- Hash PII before AI classification
- Validate all user input
- Use strict JSON schemas for AI responses
- Include conservative fallbacks
- Add budget controls

### DON'T ❌

- Commit API keys or secrets
- Send raw PII to external services
- Trust AI outputs without validation
- Skip input sanitization
- Ignore errors silently

## Documentation

When adding features, update:

- README.md - Usage examples
- TESTING.md - Test instructions
- Type definitions - JSDoc comments
- CHANGELOG.md - Notable changes

## Pull Request Checklist

Before submitting, ensure:

- [ ] Code follows project style
- [ ] Tests pass (`npm test`)
- [ ] TypeScript compiles (`npm run lint`)
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] No sensitive data in commits
- [ ] Commit messages are clear
- [ ] PR description explains changes

## Issue Guidelines

### Reporting Bugs

Include:
- Node.js version
- Package version
- Steps to reproduce
- Expected vs actual behavior
- Error messages/logs

### Feature Requests

Describe:
- Use case and motivation
- Proposed solution
- Alternative approaches considered
- Impact on existing functionality

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Give constructive feedback
- Focus on the code, not the person
- Help others learn

## Questions?

- Open an issue for questions
- Check existing issues first
- Join discussions on GitHub

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to FormShield AI! 🚀
