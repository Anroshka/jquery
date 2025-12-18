# Evidence-Based Security Research Framework

## Overview

This framework implements the **M.A.P.P.X. (Model, Assess, Prioritize, Converge)** methodology for evidence-based security auditing. It follows the principle of grounded analysis - building hypotheses ONLY on provided code evidence.

## Core Principles

### 1. No Hallucinations
Build hypotheses **ONLY** on the basis of provided code. Never assume vulnerabilities without concrete evidence.

### 2. Presumption of Security
If the provided code fragment does not contain obvious errors or architectural vulnerabilities, the tool will state: **"В данном фрагменте уязвимостей не обнаружено"** (No vulnerabilities detected in this fragment).

### 3. Right to Say "I Don't Know"
If there is insufficient data to make a conclusion (e.g., imported files not visible), the tool will state: **"СТАТУС: НЕДОСТАТОЧНО ДАННЫХ"** (STATUS: INSUFFICIENT DATA).

## M.A.P.P.X. Methodology

### Phase 1: MODEL (0% - 20%)
- Describes only what is visible in the code
- Compiles a list of **"Blind Zones"** (Gaps) - files or functions that are called but not yet analyzed
- **Knowns**: What we definitively know from the code
- **Unknowns**: What we need to complete the picture

### Phase 2: ASSESS (20% - 60%)
- Each hypothesis must have a **"Code Evidence"** field: reference to specific line or logical block
- If a vulnerability is theoretically possible but not visible in code, it's classified as **"THEORETICAL (NOT CONFIRMED)"**
- Vulnerabilities are categorized by type:
  - **XSS**: Cross-Site Scripting
  - **CODE_INJECTION**: Arbitrary code execution
  - **PROTOTYPE_POLLUTION**: JavaScript prototype manipulation
  - **REGEX_DOS**: Regular Expression Denial of Service

### Phase 3: PRIORITIZE & CONVERGE (60% - 100%)
- Selects a **"Golden Bullet"** only if confirmed by code
- If all attack vectors are closed by checks (filters, validation), concludes with: **"VERDICT: СИСТЕМА УСТОЙЧИВА К ВНЕШНИМ АТАКАМ В ДАННОМ СЕГМЕНТЕ"** (VERDICT: SYSTEM IS RESISTANT TO EXTERNAL ATTACKS IN THIS SEGMENT)

### Phase 4: REQUESTED INPUT
- Provides a clear list of what is needed from the operator to close "Blind Zones"
- Suggests additional files, context, or documentation needed

## Usage

### Basic Usage

```bash
node security-audit.cjs <file1> <file2> ... <fileN>
```

### Example

```bash
node security-audit.cjs src/core.js src/ajax.js src/event.js
```

### NPM Script Integration

Add to your `package.json`:

```json
{
  "scripts": {
    "security-audit": "node security-audit.cjs",
    "audit:core": "node security-audit.cjs src/core.js src/jquery.js",
    "audit:ajax": "node security-audit.cjs src/ajax.js",
    "audit:manipulation": "node security-audit.cjs src/manipulation.js"
  }
}
```

Then run:

```bash
npm run security-audit -- src/core.js
npm run audit:core
npm run audit:ajax
npm run audit:manipulation
```

## Output Format

The tool produces a structured report with four sections:

### 1. RECON PROGRESS
Shows completion percentage and current phase:
```
[1] RECON PROGRESS: [####------] 20%
```

**Knowns**: What we definitively analyzed
**Unknowns/Gaps**: What we're missing for complete analysis

### 2. CODE-BASED HYPOTHESES

For each potential vulnerability:
```
**H(1)**: XSS - HTML injection via .html()
  **Evidence**:
    File: src/manipulation.js
    Line: 123
    Code: elem.html( value )
  **Status**: THEORETICAL (NEEDS_CONTEXT)
```

**Status Values**:
- **CONFIRMED**: High-confidence vulnerability with clear evidence
- **THEORETICAL (NEEDS_CONTEXT)**: Pattern detected but needs more context
- **MITIGATED**: Vulnerability pattern found but proper protections exist
- **COMMENTED_OUT**: Code is commented out, not active

### 3. VERDICT

One of three outcomes:

#### ⚠️ GOLDEN BULLET FOUND
Critical vulnerabilities confirmed with code evidence.

#### ⚡ DATA MISSING / THEORETICAL RISKS
Potential vulnerabilities require additional context.

#### ✅ SECURE
No vulnerabilities detected. System is resistant to attacks in the analyzed segment.

### 4. REQUESTED INPUT

Specific list of what's needed to complete the audit:
- Missing files to analyze
- Context information needed
- Runtime behavior to verify

## Detection Patterns

The framework currently detects:

### XSS Vulnerabilities
- `.html()` method calls without sanitization
- `.append()` with user-controlled content
- Direct `innerHTML` assignments
- Unescaped template rendering

### Code Injection
- `eval()` usage
- `new Function()` dynamic function creation
- Dynamic script generation

### Prototype Pollution
- `__proto__` access
- `.constructor.prototype` manipulation
- Direct `Object.prototype` modifications

### ReDoS (Regular Expression DoS)
- Dynamic `RegExp` construction
- Complex regex patterns with user input

## Extending the Framework

To add new vulnerability patterns:

```javascript
const customPatterns = [
	{
		pattern: /yourPattern/g,
		type: "VULNERABILITY_TYPE",
		desc: "Description of the issue"
	}
];
```

## Integration with CI/CD

### GitHub Actions

```yaml
name: Security Audit

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Run Security Audit
        run: node security-audit.js src/**/*.js
```

### Pre-commit Hook

```bash
#!/bin/sh
# .husky/pre-commit

node security-audit.js $(git diff --cached --name-only --diff-filter=ACM | grep '\.js$')
```

## Limitations

1. **Static Analysis Only**: Does not execute code or test runtime behavior
2. **Pattern-Based**: May miss complex or obfuscated vulnerabilities
3. **Context-Limited**: Cannot analyze external dependencies without source
4. **No Flow Analysis**: Does not track data flow through the application

## Best Practices

1. **Run Regularly**: Integrate into your development workflow
2. **Analyze Changed Files**: Focus on recently modified code
3. **Review Theoretical Risks**: Investigate flagged patterns even if unconfirmed
4. **Combine with Other Tools**: Use alongside dynamic analysis and penetration testing
5. **Document Decisions**: Keep track of reviewed and accepted risks

## Security Contact

For security vulnerabilities in jQuery itself, please follow the [Security Policy](SECURITY.md) and report to security@jquery.com.

## License

This tool is provided as part of the jQuery project and follows the same MIT license.
