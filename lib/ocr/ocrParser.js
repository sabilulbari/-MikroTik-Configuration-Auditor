/**
 * OCR Text Extraction & Question Parser
 * 
 * Takes raw recognized text and extracts numbered questions, titles, and categories.
 */

import { QUESTION_CATEGORIES } from "@/lib/data/defaultQuestions";

/**
 * Infer category from question text safely without substring collisions (e.g. 'nat' inside 'destination')
 */
export function inferCategory(text) {
  const lower = text.toLowerCase();
  
  if (/\b(?:vlan|trunk|802\.1q)\b/i.test(lower)) return "VLAN";
  if (/\b(?:pppoe|ppp|rate-limit|bandwidth limit)\b/i.test(lower)) return "PPPoE";
  if (/\b(?:masquerade|dst-nat|src-nat|netmap|redirect)\b/i.test(lower) || /\bnat\b/i.test(lower)) return "NAT";
  if (/\b(?:firewall|filter|drop|accept|chain)\b/i.test(lower)) return "Firewall";
  if (/\b(?:route|routing|ospf|bgp|default route|gateway)\b/i.test(lower)) return "Routing";
  if (/\b(?:dhcp|dhcp-server|lease|dns)\b/i.test(lower)) return "DHCP";
  if (/\b(?:ip address|subnet|ip pool|arp)\b/i.test(lower) || /\bip\b/i.test(lower)) return "IP Addressing";
  
  return "Custom";
}

/**
 * Parses raw text from OCR into an array of structured questions
 * 
 * Recognizes formats such as:
 * - 1. Configure WAN IP
 * - 1) Configure WAN IP
 * - Question 1: Configure WAN IP
 * - Q1. Configure WAN IP
 * - Task 1 - Configure WAN IP
 * - Step 1: Configure WAN IP
 * 
 * @param {string} rawText 
 * @param {number} startingNumber 
 * @returns {Array} parsed questions
 */
export function parseOcrTextToQuestions(rawText, startingNumber = 1) {
  if (!rawText || typeof rawText !== "string") return [];

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const results = [];
  let currentItem = null;
  let counter = startingNumber;

  // Regex patterns to detect question starters
  const itemHeaderRegex = /^(?:(?:Question|Task|Step|Q)\s*#?(\d+)[\s.:\-)\]]+|(\d+)[\.\)\:\-\]]\s+)/i;

  for (const line of lines) {
    const match = line.match(itemHeaderRegex);

    if (match) {
      // Save previously accumulated item
      if (currentItem) {
        results.push(finalizeOcrItem(currentItem));
      }

      const explicitNum = parseInt(match[1] || match[2], 10);
      const titleCandidate = line.replace(itemHeaderRegex, "").trim();

      currentItem = {
        number: isNaN(explicitNum) ? counter++ : explicitNum,
        title: titleCandidate,
        description: "",
      };
    } else {
      if (currentItem) {
        if (!currentItem.title) {
          currentItem.title = line;
        } else {
          // If title already exists, subsequent lines belong to the description
          currentItem.description = currentItem.description
            ? `${currentItem.description} ${line}`
            : line;
        }
      } else {
        if (line.length > 3) {
          currentItem = {
            number: counter++,
            title: line,
            description: "",
          };
        }
      }
    }
  }

  if (currentItem) {
    results.push(finalizeOcrItem(currentItem));
  }

  // If no items were detected by regex, fall back to paragraph chunking
  if (results.length === 0) {
    const paragraphs = rawText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    return paragraphs.map((para, idx) => {
      const firstLine = para.split("\n")[0].trim();
      const rest = para.substring(firstLine.length).trim();
      return {
        id: `ocr-${Date.now()}-${idx + 1}`,
        number: startingNumber + idx,
        title: cleanTitle(firstLine),
        category: inferCategory(para),
        description: rest,
        status: "pending",
        configText: "",
        routerOSVersion: "7.x",
        verificationResult: null,
        rules: null,
      };
    });
  }

  return results;
}

function cleanTitle(title) {
  return title
    .replace(/^[\d\s.\-):]+/, "")
    .trim()
    .slice(0, 120);
}

function finalizeOcrItem(item) {
  const title = cleanTitle(item.title) || `Extracted Task #${item.number}`;
  const fullText = `${title} ${item.description}`;
  return {
    id: `ocr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    number: item.number,
    title,
    category: inferCategory(fullText),
    description: (item.description || "").trim(),
    status: "pending",
    configText: "",
    routerOSVersion: "7.x",
    verificationResult: null,
    rules: null,
  };
}
