# Git Commit Rules for Kiro Agent

## ⚠️ CRITICAL: Commit Message Format

### ❌ DO NOT USE Multi-line Commit Messages

**NEVER use this pattern:**
```bash
git commit -m "title

- bullet point 1
- bullet point 2
- bullet point 3"
```

**Problem:** Multi-line commit messages with newlines (`\n`) can cause git commit to hang/block indefinitely in the Kiro environment.

### ✅ ALWAYS Use Single-line Commit Messages

**Use this pattern instead:**
```bash
git commit -m "feat: short descriptive title - additional details in single line separated by dashes or commas"
```

**Examples:**

✅ **Good:**
```bash
git commit -m "feat: implement AI Settings page (Task 24.3) - read-only display of AI config"
```

✅ **Good:**
```bash
git commit -m "fix: resolve message handler navigation bug - add showingBaseList state flag"
```

✅ **Good:**
```bash
git commit -m "docs: update Milestone 5 progress to 75% - completed message bases management"
```

❌ **Bad (will hang):**
```bash
git commit -m "feat: implement AI Settings page

- Add AI settings API endpoint
- Create React component
- Display provider and model info"
```

## Best Practices

1. **Keep it concise:** Single line, under 100 characters if possible
2. **Use conventional commits:** `feat:`, `fix:`, `docs:`, `refactor:`, etc.
3. **Add details after dash:** Use ` - ` to separate title from additional context
4. **Use commas for lists:** Instead of bullet points, use comma-separated items
5. **Reference tasks:** Include task numbers like `(Task 24.3)` when applicable

## Why This Matters

The Kiro execution environment may not properly handle multi-line strings in bash commands, causing the git commit process to hang indefinitely. This blocks all further progress and requires manual intervention.

**Always use single-line commit messages to ensure smooth operation.**

---

**Created:** 2025-11-29  
**Reason:** Prevent git commit hangs in Kiro agent execution
