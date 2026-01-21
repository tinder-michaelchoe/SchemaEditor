# Contributing Guide

Thank you for your interest in contributing to the Schema Editor! This guide covers how to contribute effectively, whether you're fixing bugs, adding features, or improving documentation.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Types of Contributions](#types-of-contributions)
4. [Contribution Workflow](#contribution-workflow)
5. [Code Standards](#code-standards)
6. [Testing Requirements](#testing-requirements)
7. [Documentation Requirements](#documentation-requirements)
8. [Review Process](#review-process)
9. [Community Guidelines](#community-guidelines)

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Git
- A code editor (VS Code recommended)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/schema-editor.git
cd schema-editor

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test:core
```

---

## Development Setup

### Project Structure

```
schema-editor/
├── src/
│   ├── core/           # Plugin system core
│   │   ├── types/      # TypeScript interfaces
│   │   ├── store/      # Zustand stores
│   │   ├── hooks/      # React hooks
│   │   ├── testing/    # Test utilities
│   │   └── __tests__/  # Core tests
│   ├── plugins/        # Plugin implementations
│   │   ├── tree-view/
│   │   ├── preview/
│   │   └── templates/
│   ├── components/     # Shared UI components
│   └── utils/          # Utility functions
├── scripts/            # CLI tools
├── docs/               # Documentation
└── public/             # Static assets
```

### Environment Setup

1. **VS Code Extensions** (recommended):
   - ESLint
   - Prettier
   - TypeScript Vue Plugin (Volar)

2. **Git Hooks** (automatic):
   - Pre-commit: lint-staged
   - Pre-push: tests

### Running the App

```bash
# Development mode (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Types of Contributions

### Bug Fixes

1. Search existing issues to avoid duplicates
2. Create an issue describing the bug
3. Fork and create a branch: `fix/issue-123-description`
4. Fix the bug with tests
5. Submit PR referencing the issue

### New Features

1. **Discuss first**: Open an issue or discussion
2. Get feedback on the approach
3. Create branch: `feature/description`
4. Implement with tests and docs
5. Submit PR

### Plugins

See [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md) for creating plugins.

1. Use the scaffolding CLI
2. Follow plugin best practices
3. Include tests
4. Submit PR to `src/plugins/`

### Documentation

1. Fix typos: Direct PR is fine
2. New guides: Open issue first to discuss scope
3. API docs: Update alongside code changes

### Performance Improvements

1. Include benchmarks before/after
2. Explain the optimization
3. Ensure no functionality regression

---

## Contribution Workflow

### 1. Fork and Clone

```bash
# Fork on GitHub, then:
git clone https://github.com/YOUR-USERNAME/schema-editor.git
cd schema-editor
git remote add upstream https://github.com/original-org/schema-editor.git
```

### 2. Create a Branch

```bash
git checkout -b type/description

# Branch naming:
# - fix/issue-123-description
# - feature/add-new-capability
# - docs/update-api-reference
# - refactor/simplify-event-bus
```

### 3. Make Changes

- Follow code standards
- Write tests
- Update documentation
- Keep commits focused

### 4. Commit Messages

Use [Conventional Commits](https://conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples**:
```
feat(core): add onService activation event

fix(plugin-registry): handle circular dependencies

docs(api): clarify capability requirements

test(event-bus): add strict mode validation tests
```

### 5. Push and Create PR

```bash
git push origin type/description
```

Then create a Pull Request on GitHub.

### 6. Address Review Feedback

- Respond to all comments
- Make requested changes
- Re-request review when ready

---

## Code Standards

### TypeScript

- Use strict TypeScript (`strict: true`)
- Avoid `any` - use `unknown` or proper types
- Export interfaces, not types when possible
- Document public APIs with JSDoc

```typescript
/**
 * Registers a new plugin with the registry.
 * 
 * @param manifest - The plugin manifest
 * @param definition - The plugin definition
 * @returns Registration result with success/failure
 * @throws Never - returns error in result
 * 
 * @example
 * ```typescript
 * const result = registry.register(manifest, definition);
 * if (!result.success) {
 *   console.error(result.errors);
 * }
 * ```
 */
register(
  manifest: PluginManifest,
  definition: PluginDefinition
): PluginRegistrationResult { ... }
```

### React

- Functional components only
- Use hooks appropriately
- Memoize expensive computations
- Handle loading and error states

```tsx
// ✅ Good
function MyComponent({ data }: Props) {
  const api = usePluginAPI();
  
  if (!data) {
    return <Loading />;
  }
  
  return <div>{data.name}</div>;
}

// ❌ Bad - class component, no loading state
class MyComponent extends React.Component { ... }
```

### CSS/Styling

- Use Tailwind CSS utilities
- Use CSS variables for theming
- Mobile-first responsive design

```tsx
// ✅ Good
<div className="p-4 bg-[var(--bg-primary)] text-[var(--text-primary)]">

// ❌ Bad - inline styles, hardcoded colors
<div style={{ padding: '16px', background: '#ffffff' }}>
```

### File Organization

- One component per file
- Index files for public exports
- Co-locate tests with source

```
component/
├── MyComponent.tsx
├── MyComponent.test.tsx
├── helpers.ts
└── index.ts
```

---

## Testing Requirements

### What to Test

- **Must test**: Public APIs, core functionality
- **Should test**: Component rendering, event handling
- **Can skip**: Internal implementation details

### Test Structure

```typescript
describe('ComponentName', () => {
  // Setup
  let component: ComponentType;
  
  beforeEach(() => {
    component = new ComponentType();
  });
  
  // Group related tests
  describe('methodName', () => {
    it('should handle normal case', () => { ... });
    it('should handle edge case', () => { ... });
    it('should handle error case', () => { ... });
  });
});
```

### Running Tests

```bash
# All tests
npm test

# Core tests only
npm run test:core

# With coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

### Coverage Requirements

- Core: 80% minimum
- Plugins: 70% minimum
- New code: Must maintain or improve coverage

---

## Documentation Requirements

### When to Document

- New public APIs
- Changed behavior
- New configuration options
- New plugins

### Documentation Types

| Type | Location | Purpose |
|------|----------|---------|
| JSDoc | In code | API documentation |
| README | Component directories | Quick overview |
| Guides | `docs/` | How-to articles |
| API Reference | `docs/API_REFERENCE.md` | Complete API |

### Documentation Style

- Use clear, simple language
- Include code examples
- Show common use cases
- Document edge cases

```markdown
## Method Name

Brief description of what it does.

### Parameters

| Name | Type | Description |
|------|------|-------------|
| `param1` | `string` | What this param does |

### Returns

`ReturnType` - Description of return value

### Example

\`\`\`typescript
const result = methodName('example');
\`\`\`

### Notes

- Important consideration 1
- Important consideration 2
```

---

## Review Process

### PR Requirements

Before requesting review:

- [ ] Tests pass (`npm run test:core`)
- [ ] No linter errors (`npm run lint`)
- [ ] Documentation updated
- [ ] Commits are clean and descriptive
- [ ] PR description explains the change

### PR Template

```markdown
## Description

Brief description of changes.

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Testing

- How was this tested?
- What test cases were added?

## Checklist

- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Timeline

- First review: Within 2 business days
- Follow-up reviews: Within 1 business day
- Merge: After approval and CI pass

### Reviewer Guidelines

Reviewers should check:

1. **Correctness**: Does it work as intended?
2. **Tests**: Are edge cases covered?
3. **Performance**: Any concerns?
4. **Security**: Any vulnerabilities?
5. **Style**: Follows conventions?
6. **Documentation**: Updated appropriately?

---

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Give constructive feedback
- Help newcomers
- Focus on the code, not the person

### Communication

- GitHub Issues: Bug reports, feature requests
- GitHub Discussions: Questions, ideas
- Pull Requests: Code contributions

### Getting Help

- Read existing documentation first
- Search closed issues
- Ask in discussions
- Tag maintainers if urgent

### Recognition

Contributors are recognized in:
- CONTRIBUTORS.md
- Release notes
- GitHub contributors page

---

## Quick Reference

### Common Commands

```bash
# Development
npm run dev           # Start dev server
npm run build         # Build for production
npm run lint          # Run linter
npm run test:core     # Run core tests

# Plugin Development
npm run create-plugin <name>     # Scaffold plugin
npm run validate-plugin <path>   # Validate manifest
npm run analyze-plugin <path>    # Static analysis

# Documentation
npm run generate-context         # Generate LLM context
```

### Useful Links

- [Architecture Overview](./ARCHITECTURE.md)
- [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md)
- [API Reference](./API_REFERENCE.md)
- [Tooling Guide](./TOOLING.md)

---

Thank you for contributing! 🎉
