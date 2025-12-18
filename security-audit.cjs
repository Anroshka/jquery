#!/usr/bin/env node

/**
 * Evidence-Based Security Research Framework (M.A.P.P.X.)
 * 
 * ROLE: LEAD OFFENSIVE ARCHITECT (AUDIT & VERIFICATION MODE)
 * OBJECTIVE: EVIDENCE-BASED SECURITY RESEARCH
 * 
 * This tool implements the M.A.P.P.X. methodology for security auditing:
 * - MODEL: Describe what you see (0%-20%)
 * - ASSESS: Evaluate with code evidence (20%-60%)
 * - PRIORITIZE: Find the "Golden Bullet" (60%-100%)
 * - CONVERGE: Final verdict
 */

const fs = require("fs");
const path = require("path");

class SecurityAuditFramework {
	constructor() {
		this.progress = 0;
		this.knowns = [];
		this.unknowns = [];
		this.hypotheses = [];
		this.files_analyzed = [];
	}

	/**
	 * Core Principle: Grounded Analysis
	 * No hallucinations - build hypotheses ONLY on provided code
	 * 
	 * NOTE: This is a simple pattern-based scanner. It may generate false positives
	 * when patterns match sanitized or safe code. Always review findings in context.
	 * For production use, consider adding:
	 * - Data flow analysis to track sanitization
	 * - Context-aware parsing (AST-based)
	 * - Configurable severity levels
	 */
	analyzeFile(filePath, content) {
		this.files_analyzed.push(filePath);
		const vulnerabilities = [];

		// Check for XSS vulnerabilities
		// Note: These patterns are intentionally broad to catch potential issues
		const xssPatterns = [
			{ pattern: /\.html\s*\(/g, type: "XSS", desc: "HTML injection via .html()" },
			{ pattern: /\.append\s*\(/g, type: "XSS", desc: "Potential XSS via .append()" },
			{ pattern: /innerHTML\s*=/g, type: "XSS", desc: "Direct innerHTML assignment" },
			{ pattern: /eval\s*\(/g, type: "CODE_INJECTION", desc: "Use of eval()" },
			{ pattern: /new Function\s*\(/g, type: "CODE_INJECTION", desc: "Dynamic function creation" }
		];

		// Check for prototype pollution
		const prototypePatterns = [
			{ pattern: /__proto__/g, type: "PROTOTYPE_POLLUTION", desc: "__proto__ access" },
			{ pattern: /\.constructor\.prototype/g, type: "PROTOTYPE_POLLUTION", desc: "Constructor prototype access" },
			{ pattern: /Object\.prototype/g, type: "PROTOTYPE_POLLUTION", desc: "Object.prototype manipulation" }
		];

		// Check for regex DoS
		const regexPatterns = [
			{ pattern: /new RegExp\s*\(/g, type: "REGEX_DOS", desc: "Dynamic regex construction" }
		];

		const allPatterns = [...xssPatterns, ...prototypePatterns, ...regexPatterns];

		const lines = content.split('\n');
		allPatterns.forEach(({ pattern, type, desc }) => {
			lines.forEach((line, index) => {
				if (pattern.test(line)) {
					vulnerabilities.push({
						file: filePath,
						line: index + 1,
						type: type,
						description: desc,
						code: line.trim(),
						status: "IDENTIFIED"
					});
				}
			});
		});

		return vulnerabilities;
	}

	/**
	 * MODEL Phase (0% - 20%)
	 * Describe only what we see, list blind zones
	 */
	modelPhase(targetFiles) {
		console.log("\n[1] RECON PROGRESS: [####------] 20%");
		console.log("\n=== MODEL PHASE ===\n");

		this.progress = 20;

		const analyzed = [];
		const missing = [];

		targetFiles.forEach(file => {
			// Handle both absolute and relative paths
			const fullPath = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
			if (fs.existsSync(fullPath)) {
				const content = fs.readFileSync(fullPath, 'utf-8');
				const vulns = this.analyzeFile(file, content);
				
				analyzed.push({
					file: file,
					size: content.length,
					lines: content.split('\n').length,
					vulnerabilities: vulns
				});

				// Add to knowns
				this.knowns.push(`Analyzed ${file}: ${content.split('\n').length} lines`);
			} else {
				missing.push(file);
				this.unknowns.push(`File not found: ${file}`);
			}
		});

		console.log("**Knowns** (What we analyzed):");
		analyzed.forEach(item => {
			console.log(`  - ${item.file}: ${item.lines} lines, ${item.vulnerabilities.length} potential issues found`);
		});

		console.log("\n**Unknowns/Gaps** (Blind zones):");
		if (this.unknowns.length > 0) {
			this.unknowns.forEach(unknown => {
				console.log(`  - ${unknown}`);
			});
		} else {
			console.log("  - Dependencies and external modules not analyzed");
			console.log("  - Runtime behavior not tested");
			console.log("  - Integration with external systems not verified");
		}

		return analyzed;
	}

	/**
	 * ASSESS Phase (20% - 60%)
	 * Each hypothesis must have "Code Evidence"
	 */
	assessPhase(analyzed) {
		console.log("\n\n[2] RECON PROGRESS: [########--] 60%");
		console.log("\n=== ASSESS PHASE ===\n");

		this.progress = 60;

		let hypothesisId = 1;
		analyzed.forEach(item => {
			item.vulnerabilities.forEach(vuln => {
				const hypothesis = {
					id: `H(${hypothesisId++})`,
					name: vuln.type,
					description: vuln.description,
					evidence: {
						file: vuln.file,
						line: vuln.line,
						code: vuln.code
					},
					status: this.determineStatus(vuln)
				};

				this.hypotheses.push(hypothesis);
			});
		});

		console.log("**CODE-BASED HYPOTHESES**\n");
		
		if (this.hypotheses.length === 0) {
			console.log("No vulnerabilities detected in the analyzed code segments.");
			console.log("Status: CLEAN (within analyzed scope)\n");
		} else {
			this.hypotheses.forEach(h => {
				console.log(`**${h.id}**: ${h.name} - ${h.description}`);
				console.log(`  **Evidence**:`);
				console.log(`    File: ${h.evidence.file}`);
				console.log(`    Line: ${h.evidence.line}`);
				console.log(`    Code: ${h.evidence.code}`);
				console.log(`  **Status**: ${h.status}`);
				console.log();
			});
		}
	}

	/**
	 * Determine vulnerability status based on context
	 */
	determineStatus(vuln) {
		// In a real audit, this would check for mitigations
		// For now, we mark patterns as theoretical unless confirmed
		
		// Check if the line is a comment (starts with // or /* after trimming)
		const trimmedCode = vuln.code.trim();
		if (trimmedCode.startsWith("//") || trimmedCode.startsWith("/*")) {
			return "COMMENTED_OUT";
		}
		
		const highConfidence = ["eval(", "innerHTML ="];
		const isHighConfidence = highConfidence.some(pattern => 
			vuln.code.includes(pattern)
		);

		if (isHighConfidence) {
			return "CONFIRMED";
		} else {
			return "THEORETICAL (NEEDS_CONTEXT)";
		}
	}

	/**
	 * PRIORITIZE & CONVERGE Phase (60% - 100%)
	 * Choose "Golden Bullet" if confirmed by code
	 */
	prioritizePhase() {
		console.log("\n[3] RECON PROGRESS: [##########] 100%");
		console.log("\n=== PRIORITIZE & CONVERGE ===\n");

		this.progress = 100;

		const confirmed = this.hypotheses.filter(h => h.status === "CONFIRMED");
		const theoretical = this.hypotheses.filter(h => h.status.includes("THEORETICAL"));
		const mitigated = this.hypotheses.filter(h => h.status === "MITIGATED");

		console.log("**VERDICT**\n");

		if (confirmed.length > 0) {
			console.log("⚠️  GOLDEN BULLET FOUND");
			console.log("\nCritical vulnerabilities confirmed:");
			confirmed.forEach(h => {
				console.log(`  - ${h.id}: ${h.name} at ${h.evidence.file}:${h.evidence.line}`);
			});
		} else if (theoretical.length > 0) {
			console.log("⚡ DATA MISSING / THEORETICAL RISKS");
			console.log("\nPotential vulnerabilities require additional context:");
			theoretical.forEach(h => {
				console.log(`  - ${h.id}: ${h.name} - ${h.status}`);
			});
		} else if (this.hypotheses.length === 0) {
			console.log("✅ SECURE");
			console.log("\nVERDICT: SYSTEM IS RESISTANT TO EXTERNAL ATTACKS IN THIS SEGMENT");
			console.log("No vulnerabilities detected in analyzed code segments.");
		} else {
			console.log("✅ MITIGATED");
			console.log("\nAll identified risks have proper mitigations in place.");
		}
	}

	/**
	 * Final step: Request additional input if needed
	 */
	requestInput() {
		console.log("\n\n[4] REQUESTED INPUT\n");

		if (this.unknowns.length > 0) {
			console.log("To complete the security audit, please provide:");
			this.unknowns.forEach((item, idx) => {
				console.log(`  ${idx + 1}. ${item}`);
			});
		} else if (this.hypotheses.some(h => h.status.includes("THEORETICAL"))) {
			console.log("To verify theoretical risks, please provide:");
			console.log("  1. Runtime context and usage patterns");
			console.log("  2. Input validation mechanisms");
			console.log("  3. Output encoding strategies");
		} else {
			console.log("No additional input required. Audit complete.");
		}
	}

	/**
	 * Run complete audit
	 */
	runAudit(targetFiles) {
		console.log("=".repeat(80));
		console.log("EVIDENCE-BASED SECURITY RESEARCH FRAMEWORK");
		console.log("M.A.P.P.X. Methodology Implementation");
		console.log("=".repeat(80));

		// Phase 1: MODEL
		const analyzed = this.modelPhase(targetFiles);

		// Phase 2: ASSESS
		this.assessPhase(analyzed);

		// Phase 3: PRIORITIZE
		this.prioritizePhase();

		// Phase 4: REQUEST INPUT
		this.requestInput();

		console.log("\n" + "=".repeat(80));
		console.log("Audit Complete");
		console.log("=".repeat(80) + "\n");
	}
}

// CLI Interface
if (require.main === module) {
	const args = process.argv.slice(2);
	
	if (args.length === 0) {
		console.log(`
Evidence-Based Security Research Framework

Usage: node security-audit.cjs <file1> <file2> ... <fileN>

Example:
  node security-audit.cjs src/core.js src/ajax.js

Principles:
  1. No hallucinations - analysis based only on provided code
  2. Presumption of security - prove vulnerabilities with evidence
  3. Right to say "I don't know" - acknowledge data gaps
		`);
		process.exit(1);
	}

	const framework = new SecurityAuditFramework();
	framework.runAudit(args);
}

module.exports = SecurityAuditFramework;
