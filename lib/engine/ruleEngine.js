/**
 * Custom Rule-Based Verification Engine for MikroTik RouterOS
 * 
 * Verifies parsed configuration AST against question-specific declarative rules.
 * Generates rich diagnostic reports including:
 * - Expected vs Actual values
 * - Actionable suggested fixes
 * - Detailed pass / fail criteria
 * - Distinguishes configuration presence from live operational status
 */

import { parseRouterOSConfig } from "../parser/routerosParser";
import { normalizeSectionPath } from "../parser/parserUtils";

export function verifyConfiguration(configText, question, selectedVersion = "7.x") {
  // If no rules exist for this question
  if (!question.rules || !Array.isArray(question.rules) || question.rules.length === 0) {
    return {
      passed: false,
      isSupported: false,
      message: "Verification rules are not available yet for this configuration task.",
      totalRules: 0,
      passedRules: 0,
      failedRules: 0,
      missingRules: 0,
      checks: [],
      timestamp: new Date().toISOString(),
      disclaimer: "Verification evaluates syntax presence against lab rules and does not guarantee live runtime reachability.",
    };
  }

  // Parse raw text into structured commands
  const ast = parseRouterOSConfig(configText);

  if (!configText || configText.trim().length === 0 || ast.allCommands.length === 0) {
    return {
      passed: false,
      isSupported: true,
      message: "No RouterOS commands were detected in the editor. Please paste your configuration export.",
      totalRules: question.rules.length,
      passedRules: 0,
      failedRules: question.rules.length,
      missingRules: question.rules.length,
      checks: question.rules.map((rule) => ({
        ruleId: rule.id,
        ruleTitle: rule.title,
        required: rule.required !== false,
        status: "missing",
        explanation: `Section ${Array.isArray(rule.section) ? rule.section[0] : rule.section} command not found in configuration.`,
        suggestedFix: `Add ${Array.isArray(rule.section) ? rule.section[0] : rule.section} command with required parameters.`,
        paramResults: [],
      })),
      timestamp: new Date().toISOString(),
      disclaimer: "Static export verification tests syntax structure. Live network reachability cannot be tested statically.",
    };
  }

  let totalRules = 0;
  let passedRules = 0;
  let failedRules = 0;
  let missingRules = 0;
  let allMandatoryPassed = true;

  const ruleResults = [];

  for (const rule of question.rules) {
    totalRules++;
    const isRequired = rule.required !== false;

    // Filter candidate commands matching this rule's target section(s) and verb(s)
    const matchingCommands = findCandidateCommands(ast, rule);

    if (matchingCommands.length === 0) {
      // Configuration section/command is missing entirely
      missingRules++;
      if (isRequired) {
        failedRules++;
        allMandatoryPassed = false;
      }

      ruleResults.push({
        ruleId: rule.id,
        ruleTitle: rule.title,
        required: isRequired,
        status: "missing",
        explanation: `Missing expected command under ${formatSectionDisplay(rule.section)}.`,
        suggestedFix: rule.description || `Configure ${formatSectionDisplay(rule.section)}.`,
        paramResults: (rule.checks || []).map((c) => ({
          field: c.field,
          status: "missing",
          expected: formatExpected(c.expected),
          actual: "None (command missing)",
          explanation: `Field '${c.field}' was not present.`,
          fixSuggestion: c.fixSuggestion || `Specify ${c.field}=${formatExpected(c.expected)}`,
        })),
      });
      continue;
    }

    // Evaluate parameters against candidate commands
    // Pick the candidate that scores best across checks
    const evaluation = evaluateCandidateCommands(matchingCommands, rule, selectedVersion);

    if (evaluation.passed) {
      passedRules++;
      ruleResults.push({
        ruleId: rule.id,
        ruleTitle: rule.title,
        required: isRequired,
        status: "passed",
        matchedLine: evaluation.bestCommand.rawLine,
        lineNumber: evaluation.bestCommand.lineNumber,
        explanation: "All mandatory parameter checks matched successfully.",
        suggestedFix: null,
        paramResults: evaluation.paramResults,
      });
    } else {
      failedRules++;
      if (isRequired) {
        allMandatoryPassed = false;
      }
      ruleResults.push({
        ruleId: rule.id,
        ruleTitle: rule.title,
        required: isRequired,
        status: "failed",
        matchedLine: evaluation.bestCommand?.rawLine || null,
        lineNumber: evaluation.bestCommand?.lineNumber || null,
        explanation: evaluation.errorSummary,
        suggestedFix: evaluation.primarySuggestion,
        paramResults: evaluation.paramResults,
      });
    }
  }

  return {
    passed: allMandatoryPassed,
    isSupported: true,
    totalRules,
    passedRules,
    failedRules,
    missingRules,
    checks: ruleResults,
    timestamp: new Date().toISOString(),
    disclaimer: "Static configuration verification proves configuration existence and parameter adherence, not active hardware link status.",
  };
}

/**
 * Find candidate commands in the AST matching the rule's section and verb
 */
function findCandidateCommands(ast, rule) {
  const targetSections = Array.isArray(rule.section)
    ? rule.section.map(normalizeSectionPath)
    : [normalizeSectionPath(rule.section)];

  const targetVerbs = Array.isArray(rule.command)
    ? rule.command.map((v) => v.toLowerCase())
    : rule.command
    ? [rule.command.toLowerCase()]
    : ["add", "set"];

  return ast.allCommands.filter((cmd) => {
    const sectionMatch = targetSections.some(
      (ts) => cmd.section === ts || cmd.section.startsWith(`${ts} `) || ts.startsWith(`${cmd.section} `)
    );
    const verbMatch = targetVerbs.includes(cmd.verb);
    return sectionMatch && verbMatch;
  });
}

/**
 * Score candidate commands and evaluate parameter checks
 */
function evaluateCandidateCommands(candidates, rule, selectedVersion) {
  let bestScore = -1;
  let bestCandidate = null;
  let bestEvaluation = null;

  const checks = rule.checks || [];

  for (const cmd of candidates) {
    let score = 0;
    let cmdPassed = true;
    const paramResults = [];
    let firstErrorFix = null;
    let firstErrorMsg = null;

    for (const check of checks) {
      const field = check.field.toLowerCase();
      const actualVal = cmd.params[field];
      const matchRes = evaluateFieldCheck(actualVal, check, selectedVersion);

      if (matchRes.matched) {
        score += 2;
        paramResults.push({
          field,
          status: "passed",
          expected: formatExpected(check.expected),
          actual: actualVal || "(default/omitted)",
          explanation: matchRes.explanation || `Field '${field}' matches expected specification.`,
          fixSuggestion: null,
        });
      } else {
        cmdPassed = false;
        paramResults.push({
          field,
          status: actualVal === undefined ? "missing" : "failed",
          expected: formatExpected(check.expected),
          actual: actualVal !== undefined ? actualVal : "Missing",
          explanation: matchRes.explanation,
          fixSuggestion: check.fixSuggestion || `Set ${field}=${formatExpected(check.expected)}`,
        });

        if (!firstErrorFix) {
          firstErrorFix = check.fixSuggestion || `Set ${field}=${formatExpected(check.expected)}`;
          firstErrorMsg = matchRes.explanation;
        }
      }
    }

    if (score > bestScore || bestCandidate === null) {
      bestScore = score;
      bestCandidate = cmd;
      bestEvaluation = {
        passed: cmdPassed,
        bestCommand: cmd,
        paramResults,
        errorSummary: firstErrorMsg || "One or more parameters did not match the expected values.",
        primarySuggestion: firstErrorFix,
      };
    }
  }

  return bestEvaluation;
}

/**
 * Evaluate single check against actual parameter value
 */
function evaluateFieldCheck(actual, check, selectedVersion) {
  const matchType = check.matchType || "exact";
  const expected = check.expected;

  if (matchType === "exactOrMissingIfDefault") {
    // e.g. dst-address=0.0.0.0/0 can be omitted in MikroTik default routes
    if (actual === undefined || actual === null || actual === "") {
      return { matched: true, explanation: "Default route prefix 0.0.0.0/0 is implied." };
    }
    const allowed = Array.isArray(expected) ? expected : [expected];
    const normActual = normalizeString(actual);
    const matched = allowed.some((exp) => normalizeString(exp) === normActual);
    return {
      matched,
      explanation: matched
        ? "Parameter matched expected default prefix."
        : `Expected dst-address ${formatExpected(expected)}, got '${actual}'.`,
    };
  }

  if (actual === undefined || actual === null) {
    return {
      matched: false,
      explanation: `Missing required parameter '${check.field}'.`,
    };
  }

  const normActual = normalizeString(actual);

  switch (matchType) {
    case "exact": {
      const normExpected = normalizeString(expected);
      const matched = normActual === normExpected;
      return {
        matched,
        explanation: matched
          ? `Correct parameter '${check.field}=${actual}'.`
          : `Expected '${expected}', but got '${actual}'.`,
      };
    }

    case "oneOf": {
      const allowed = Array.isArray(expected) ? expected : [expected];
      const matched = allowed.some((exp) => normalizeString(exp) === normActual);
      return {
        matched,
        explanation: matched
          ? `Parameter '${check.field}=${actual}' matches accepted options.`
          : `Expected one of [${allowed.join(", ")}], but got '${actual}'.`,
      };
    }

    case "containsAny": {
      const allowed = Array.isArray(expected) ? expected : [expected];
      const actualTokens = normActual.split(/[\s,]+/).map((t) => t.trim());
      const matched = allowed.some((exp) => {
        const expNorm = normalizeString(exp);
        return (
          actualTokens.includes(expNorm) ||
          normActual.includes(expNorm) ||
          expNorm.split(",").every((sub) => actualTokens.includes(sub))
        );
      });
      return {
        matched,
        explanation: matched
          ? `Parameter contains expected value.`
          : `Expected to contain [${allowed.join(", ")}], got '${actual}'.`,
      };
    }

    case "exists": {
      const matched = normActual.length > 0;
      return {
        matched,
        explanation: matched
          ? `Optional field '${check.field}' is present.`
          : `Field '${check.field}' is not set.`,
      };
    }

    default:
      return {
        matched: normActual === normalizeString(expected),
        explanation: `Verified against expected value.`,
      };
  }
}

function normalizeString(val) {
  if (val === undefined || val === null) return "";
  return String(val).trim().toLowerCase();
}

function formatExpected(exp) {
  if (Array.isArray(exp)) {
    return exp.join(" or ");
  }
  return String(exp);
}

function formatSectionDisplay(section) {
  if (Array.isArray(section)) {
    return section.join(" or ");
  }
  return String(section);
}
