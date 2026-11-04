/**
 * RouterOS Parser Utilities
 * 
 * Helper functions for tokenizing RouterOS script lines, extracting key=value parameters,
 * handling double quotes with escape sequences, comments, and line continuations.
 */

/**
 * Remove line comments (# ...) and trim trailing whitespace.
 * Preserves # inside quotes.
 */
export function stripComments(line) {
  if (!line) return "";
  let insideQuotes = false;
  let quoteChar = null;
  let result = "";

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const prevChar = i > 0 ? line[i - 1] : null;

    if ((char === '"' || char === "'") && prevChar !== "\\") {
      if (!insideQuotes) {
        insideQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        insideQuotes = false;
        quoteChar = null;
      }
    }

    if (char === "#" && !insideQuotes) {
      break; // Rest of the line is a comment
    }

    result += char;
  }

  return result.trim();
}

/**
 * Tokenize a command line into individual argument strings respecting quoted substrings.
 * e.g., 'add address=192.168.1.1/24 comment="LAN Port" interface=ether2'
 * => ['add', 'address=192.168.1.1/24', 'comment="LAN Port"', 'interface=ether2']
 */
export function tokenizeCommandLine(line) {
  const tokens = [];
  let currentToken = "";
  let insideQuotes = false;
  let quoteChar = null;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const prevChar = i > 0 ? line[i - 1] : null;

    if ((char === '"' || char === "'") && prevChar !== "\\") {
      insideQuotes = !insideQuotes;
      quoteChar = insideQuotes ? char : null;
      currentToken += char;
    } else if (/\s/.test(char) && !insideQuotes) {
      if (currentToken.length > 0) {
        tokens.push(currentToken);
        currentToken = "";
      }
    } else {
      currentToken += char;
    }
  }

  if (currentToken.length > 0) {
    tokens.push(currentToken);
  }

  return tokens;
}

/**
 * Parses key=value tokens into an object.
 * Strips outer quotes from values.
 */
export function parseTokensToParams(tokens) {
  const params = {};
  const flags = [];

  for (const token of tokens) {
    const eqIdx = token.indexOf("=");
    if (eqIdx !== -1) {
      const key = token.substring(0, eqIdx).trim().toLowerCase();
      let value = token.substring(eqIdx + 1).trim();

      // Strip matching wrapping quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      params[key] = value;
    } else if (token.length > 0) {
      // Flag without equal sign (e.g. disabled, dynamic)
      flags.push(token.toLowerCase());
    }
  }

  return { params, flags };
}

/**
 * Normalizes section path:
 * e.g. "/ip address" -> "/ip address"
 * "ip address" -> "/ip address"
 * "/IP/ADDRESS" -> "/ip address"
 */
export function normalizeSectionPath(path) {
  if (!path) return "/";
  let normalized = path.trim().toLowerCase();
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  // Replace slashes with spaces or normalize multiple slashes
  normalized = normalized.replace(/\/+/g, "/").replace(/\s+/g, " ");
  // Trim trailing slash unless root
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}
