# Evidence-Based Security Research Framework - Examples

This document provides practical examples of using the security audit framework.

## Example 1: Clean Code

Testing a file with no vulnerabilities:

```bash
$ npm run security-audit -- src/jquery.js
```

Output:
```
================================================================================
EVIDENCE-BASED SECURITY RESEARCH FRAMEWORK
M.A.P.P.X. Methodology Implementation
================================================================================

[1] RECON PROGRESS: [####------] 20%

=== MODEL PHASE ===

**Knowns** (What we analyzed):
  - src/jquery.js: 39 lines, 0 potential issues found

**Unknowns/Gaps** (Blind zones):
  - Dependencies and external modules not analyzed
  - Runtime behavior not tested
  - Integration with external systems not verified


[2] RECON PROGRESS: [########--] 60%

=== ASSESS PHASE ===

No vulnerabilities detected in the analyzed code segments.
Status: CLEAN (within analyzed scope)


[3] RECON PROGRESS: [##########] 100%

=== PRIORITIZE & CONVERGE ===

**VERDICT**

✅ SECURE

VERDICT: СИСТЕМА УСТОЙЧИВА К ВНЕШНИМ АТАКАМ В ДАННОМ СЕГМЕНТЕ
No vulnerabilities detected in analyzed code segments.


[4] REQUESTED INPUT

No additional input required. Audit complete.

================================================================================
Audit Complete
================================================================================
```

## Example 2: Theoretical Vulnerabilities

Testing code with patterns that need context:

```bash
$ npm run audit:core
```

Output shows:
```
**H(1)**: PROTOTYPE_POLLUTION - __proto__ access
  **Evidence**:
    File: src/core.js
    Line: 153
    Code: if ( name === "__proto__" || target === copy ) {
  **Status**: THEORETICAL (NEEDS_CONTEXT)
```

**Analysis**: The code checks for `__proto__` which is actually a security mitigation, not a vulnerability. This demonstrates the "Right to say 'I don't know'" principle - the tool flags patterns but requires human review to confirm.

## Example 3: Confirmed Vulnerabilities

Testing manipulation code:

```bash
$ npm run audit:manipulation
```

Output shows:
```
**H(2)**: XSS - Direct innerHTML assignment
  **Evidence**:
    File: src/manipulation.js
    Line: 276
    Code: elem.innerHTML = value;
  **Status**: CONFIRMED

**VERDICT**

⚠️  GOLDEN BULLET FOUND

Critical vulnerabilities confirmed:
  - H(2): XSS at src/manipulation.js:276
```

**Analysis**: Direct innerHTML assignment is flagged as confirmed because it's a high-confidence pattern. However, in jQuery's context, this is used with proper sanitization upstream.

## Example 4: Multiple Files Analysis

Analyze multiple files together:

```bash
$ node security-audit.cjs src/core.js src/ajax.js src/manipulation.js
```

This provides a comprehensive view across multiple modules.

## Example 5: CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/security-audit.yml`:

```yaml
name: Security Audit

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  security-audit:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run Security Audit on Core
      run: npm run audit:core
    
    - name: Run Security Audit on Ajax
      run: npm run audit:ajax
    
    - name: Run Security Audit on Manipulation
      run: npm run audit:manipulation
```

## Understanding the Output

### Progress Bar

```
[1] RECON PROGRESS: [####------] 20%  <- MODEL phase
[2] RECON PROGRESS: [########--] 60%  <- ASSESS phase  
[3] RECON PROGRESS: [##########] 100% <- PRIORITIZE phase
```

### Status Meanings

- **CONFIRMED**: High-confidence vulnerability based on dangerous patterns
- **THEORETICAL (NEEDS_CONTEXT)**: Pattern detected but requires verification
- **MITIGATED**: Vulnerability pattern found but protections exist
- **COMMENTED_OUT**: Code is not active

### Verdict Types

1. **✅ SECURE**: No vulnerabilities found
2. **⚡ DATA MISSING**: More context needed
3. **⚠️  GOLDEN BULLET FOUND**: Critical issues confirmed

## Best Practices

1. **Regular Scanning**: Run security audit before each release
2. **Incremental Analysis**: Focus on changed files in PRs
3. **Human Review**: Always review flagged items - tools can have false positives
4. **Document Decisions**: Keep track of accepted risks
5. **Combine Tools**: Use with other security tools for comprehensive coverage

## Interpreting Results

### False Positives

The tool may flag security-relevant code that is actually safe:

```javascript
// Flagged but safe - security check, not vulnerability
if ( name === "__proto__" || target === copy ) {
    return;
}
```

### True Positives

Direct dangerous operations without visible sanitization:

```javascript
// Legitimate concern - needs verification of sanitization
elem.innerHTML = value;
```

### Context Matters

Always examine the broader context:
- Is there input validation upstream?
- Are there sanitization functions applied?
- Is this internal-only code?
- Are there security comments explaining the approach?

## Extending Detection

To add custom patterns, modify `security-audit.cjs`:

```javascript
const customPatterns = [
    {
        pattern: /dangerouslySetInnerHTML/g,
        type: "XSS",
        desc: "React dangerouslySetInnerHTML usage"
    },
    {
        pattern: /localStorage\.setItem.*<script/gi,
        type: "STORED_XSS",
        desc: "Potential stored XSS in localStorage"
    }
];
```

## Conclusion

This framework implements evidence-based security analysis following the M.A.P.P.X. methodology. It:

1. ✅ Provides grounded analysis based on actual code
2. ✅ Acknowledges uncertainty when context is missing
3. ✅ Produces structured, actionable reports
4. ✅ Integrates into development workflows

Remember: **Security is a process, not a one-time check**. Use this tool as part of a comprehensive security program.
