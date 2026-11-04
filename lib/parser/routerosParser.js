/**
 * Custom RouterOS Configuration Export Parser
 * 
 * Accurately parses MikroTik RouterOS script and export configurations into a normalized AST.
 * Handles:
 * - Line and block comments (# ...)
 * - Section transitions (/ip address, /ip pool, /ip firewall filter, etc.)
 * - Inline command syntax (/ip address add address=...)
 * - Multi-line commands with trailing backslash (\)
 * - Quoted strings with spaces or escaped characters
 * - Multiple commands under the same section
 * - RouterOS 6.x and 7.x differences
 */

import {
  stripComments,
  tokenizeCommandLine,
  parseTokensToParams,
  normalizeSectionPath,
} from "./parserUtils";

export function parseRouterOSConfig(rawConfig = "") {
  if (!rawConfig || typeof rawConfig !== "string") {
    return {
      raw: "",
      sections: [],
      allCommands: [],
      errors: [],
    };
  }

  const lines = rawConfig.split(/\r?\n/);
  const sectionsMap = new Map();
  const allCommands = [];
  const errors = [];

  let currentSection = "/";
  let accumulatedLine = "";
  let accumulatedStartLine = 1;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const rawLine = lines[lineIdx];
    const lineNum = lineIdx + 1;
    const clean = stripComments(rawLine);

    if (!clean) continue;

    // Handle line continuation ending with '\'
    if (clean.endsWith("\\")) {
      if (!accumulatedLine) {
        accumulatedStartLine = lineNum;
      }
      accumulatedLine += ` ${clean.slice(0, -1).trim()}`;
      continue;
    }

    const fullLine = (accumulatedLine ? `${accumulatedLine} ${clean}` : clean).trim();
    const effectiveLineNum = accumulatedLine ? accumulatedStartLine : lineNum;
    accumulatedLine = "";

    // Check if line is a section change or inline command
    if (fullLine.startsWith("/")) {
      handleSlashLine(fullLine, effectiveLineNum, sectionsMap, allCommands, errors, (newSec) => {
        currentSection = newSec;
      });
    } else {
      // Command within currentSection
      handleSubcommandLine(fullLine, effectiveLineNum, currentSection, sectionsMap, allCommands, errors);
    }
  }

  // Convert map to ordered array
  const sections = Array.from(sectionsMap.values());

  return {
    raw: rawConfig,
    sections,
    allCommands,
    errors,
  };
}

/**
 * Handles lines starting with '/'
 * Could be a section header: e.g. "/ip address"
 * Or an inline command: e.g. "/ip address add address=192.168.1.1/24 interface=ether2"
 */
function handleSlashLine(line, lineNum, sectionsMap, allCommands, errors, setCurrentSection) {
  const tokens = tokenizeCommandLine(line);
  if (tokens.length === 0) return;

  // Known command verbs in RouterOS
  const knownVerbs = new Set([
    "add",
    "set",
    "remove",
    "enable",
    "disable",
    "print",
    "export",
    "reset",
    "edit",
    "find",
    "get",
  ]);

  // Find where the verb appears in the tokens (e.g. ['/ip', 'address', 'add', ...])
  let verbIndex = -1;
  for (let i = 0; i < tokens.length; i++) {
    const tokenLower = tokens[i].toLowerCase();
    if (knownVerbs.has(tokenLower) && i > 0) {
      verbIndex = i;
      break;
    }
  }

  if (verbIndex !== -1) {
    // Inline command: section is tokens[0..verbIndex-1], verb is tokens[verbIndex]
    const sectionTokens = tokens.slice(0, verbIndex);
    const sectionPath = normalizeSectionPath(sectionTokens.join(" "));
    const verb = tokens[verbIndex].toLowerCase();
    const paramTokens = tokens.slice(verbIndex + 1);

    setCurrentSection(sectionPath);
    registerCommand(sectionPath, verb, paramTokens, line, lineNum, sectionsMap, allCommands);
  } else {
    // Pure section transition: e.g. "/ip firewall nat"
    const sectionPath = normalizeSectionPath(tokens.join(" "));
    setCurrentSection(sectionPath);
    getOrCreateSection(sectionPath, sectionsMap);
  }
}

/**
 * Handles subcommands under the active section
 * e.g. "add chain=srcnat action=masquerade out-interface=ether1"
 */
function handleSubcommandLine(line, lineNum, currentSection, sectionsMap, allCommands, errors) {
  const tokens = tokenizeCommandLine(line);
  if (tokens.length === 0) return;

  const firstToken = tokens[0].toLowerCase();
  const knownVerbs = new Set(["add", "set", "remove", "enable", "disable", "print", "export"]);

  let verb = "add";
  let paramTokens = tokens;

  if (knownVerbs.has(firstToken)) {
    verb = firstToken;
    paramTokens = tokens.slice(1);
  } else if (tokens[0].includes("=")) {
    // Implicit 'add' or 'set' when user just wrote "address=192.168.1.1/24 interface=ether2"
    verb = "add";
    paramTokens = tokens;
  }

  registerCommand(currentSection, verb, paramTokens, line, lineNum, sectionsMap, allCommands);
}

function registerCommand(sectionPath, verb, paramTokens, rawLine, lineNum, sectionsMap, allCommands) {
  const { params, flags } = parseTokensToParams(paramTokens);
  const section = getOrCreateSection(sectionPath, sectionsMap);

  const commandObj = {
    id: `cmd-${lineNum}-${allCommands.length + 1}`,
    section: sectionPath,
    verb,
    rawLine,
    lineNumber: lineNum,
    params,
    flags,
  };

  section.commands.push(commandObj);
  allCommands.push(commandObj);
}

function getOrCreateSection(path, map) {
  if (!map.has(path)) {
    map.set(path, {
      path,
      commands: [],
    });
  }
  return map.get(path);
}
