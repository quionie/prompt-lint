'use strict';

const fs = require('fs');
const path = require('path');

const SUPPORTED_EXTENSIONS = new Set(['.js', '.ts', '.jsx', '.tsx']);
const RAG_DOCUMENT_EXTENSIONS = new Set(['.md', '.txt', '.json', '.csv']);
const TARGET_CALLS = [
  'openai.chat.completions.create',
  'client.chat.completions.create',
  'anthropic.messages.create',
  'model.generateContent',
  'ai.generateText'
];

const SKIP_DIRECTORIES = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);

function shouldSkipDirectory(dirName) {
  return SKIP_DIRECTORIES.has(dirName);
}

function resolveBaseDirectory(startPath) {
  const stat = fs.statSync(startPath);
  return stat.isDirectory() ? startPath : path.dirname(startPath);
}

function collectFilesByExtensions(startPath, extensions) {
  const files = [];
  let stat;

  try {
    stat = fs.statSync(startPath);
  } catch {
    return files;
  }

  if (stat.isFile()) {
    if (extensions.has(path.extname(startPath))) {
      return [startPath];
    }
    return files;
  }

  const stack = [startPath];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    let entries;

    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (!shouldSkipDirectory(entry.name)) {
          stack.push(fullPath);
        }
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (extensions.has(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }

  files.sort();
  return files;
}

function collectSourceFiles(startPath) {
  return collectFilesByExtensions(startPath, SUPPORTED_EXTENSIONS);
}

function isEscaped(text, index) {
  let backslashCount = 0;
  for (let i = index - 1; i >= 0 && text[i] === '\\'; i -= 1) {
    backslashCount += 1;
  }
  return backslashCount % 2 === 1;
}

function skipQuotedString(text, startIndex) {
  const quote = text[startIndex];
  let i = startIndex + 1;

  while (i < text.length) {
    if (text[i] === quote && !isEscaped(text, i)) {
      return i + 1;
    }
    i += 1;
  }

  return -1;
}

function skipTemplateLiteral(text, startIndex) {
  let i = startIndex + 1;

  while (i < text.length) {
    const char = text[i];

    if (char === '`' && !isEscaped(text, i)) {
      return i + 1;
    }

    if (char === '$' && text[i + 1] === '{' && !isEscaped(text, i)) {
      const interpolationEnd = findMatchingDelimiter(text, i + 1, '{', '}');
      if (interpolationEnd === -1) {
        return -1;
      }
      i = interpolationEnd;
      continue;
    }

    i += 1;
  }

  return -1;
}

function skipLineComment(text, startIndex) {
  let i = startIndex + 2;
  while (i < text.length && text[i] !== '\n') {
    i += 1;
  }
  return i;
}

function skipBlockComment(text, startIndex) {
  const end = text.indexOf('*/', startIndex + 2);
  if (end === -1) {
    return -1;
  }
  return end + 2;
}

function findMatchingDelimiter(text, openIndex, openChar, closeChar) {
  let depth = 1;
  let i = openIndex + 1;

  while (i < text.length) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' || char === "'") {
      const end = skipQuotedString(text, i);
      if (end === -1) {
        return -1;
      }
      i = end;
      continue;
    }

    if (char === '`') {
      const end = skipTemplateLiteral(text, i);
      if (end === -1) {
        return -1;
      }
      i = end;
      continue;
    }

    if (char === '/' && next === '/') {
      i = skipLineComment(text, i);
      continue;
    }

    if (char === '/' && next === '*') {
      const end = skipBlockComment(text, i);
      if (end === -1) {
        return -1;
      }
      i = end;
      continue;
    }

    if (char === openChar) {
      depth += 1;
    } else if (char === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return i + 1;
      }
    }

    i += 1;
  }

  return -1;
}

function findNextNonWhitespace(text, startIndex) {
  let i = startIndex;
  while (i < text.length && /\s/.test(text[i])) {
    i += 1;
  }
  return i;
}

function isIdentifierBoundary(text, index) {
  if (index < 0 || index >= text.length) {
    return true;
  }
  return !/[A-Za-z0-9_$]/.test(text[index]);
}

function findCallArgumentObject(source, callName, fromIndex) {
  const index = source.indexOf(callName, fromIndex);
  if (index === -1) {
    return null;
  }

  if (!isIdentifierBoundary(source, index - 1) || !isIdentifierBoundary(source, index + callName.length)) {
    return { nextIndex: index + callName.length };
  }

  let cursor = findNextNonWhitespace(source, index + callName.length);
  if (source[cursor] !== '(') {
    return { nextIndex: cursor + 1 };
  }

  const callEnd = findMatchingDelimiter(source, cursor, '(', ')');
  if (callEnd === -1) {
    return { nextIndex: cursor + 1 };
  }

  cursor = findNextNonWhitespace(source, cursor + 1);
  if (source[cursor] !== '{') {
    return { nextIndex: callEnd };
  }

  const objectEnd = findMatchingDelimiter(source, cursor, '{', '}');
  if (objectEnd === -1 || objectEnd > callEnd) {
    return { nextIndex: callEnd };
  }

  return {
    index,
    nextIndex: callEnd,
    objectStart: cursor,
    objectEnd
  };
}

function readStringLiteralAt(text, startIndex) {
  const quote = text[startIndex];
  if (quote !== '"' && quote !== "'" && quote !== '`') {
    return null;
  }

  let i = startIndex + 1;
  let value = '';

  while (i < text.length) {
    const char = text[i];

    if (char === quote && !isEscaped(text, i)) {
      return {
        value,
        endIndex: i + 1
      };
    }

    if (quote === '`' && char === '$' && text[i + 1] === '{' && !isEscaped(text, i)) {
      return null;
    }

    value += char;
    i += 1;
  }

  return null;
}

function parsePropertyStringLiterals(objectBody, baseOffset) {
  const prompts = [];
  const propertyPattern = /\b(prompt|content|messages)\b\s*:/g;
  let propertyMatch;

  while ((propertyMatch = propertyPattern.exec(objectBody)) !== null) {
    const key = propertyMatch[1];
    let cursor = propertyMatch.index + propertyMatch[0].length;
    cursor = findNextNonWhitespace(objectBody, cursor);

    if (key === 'messages') {
      if (objectBody[cursor] !== '[') {
        continue;
      }

      const messagesEnd = findMatchingDelimiter(objectBody, cursor, '[', ']');
      if (messagesEnd === -1) {
        continue;
      }

      const messagesBody = objectBody.slice(cursor + 1, messagesEnd - 1);
      const messagesOffset = baseOffset + cursor + 1;
      prompts.push(...parseMessagesContent(messagesBody, messagesOffset));
      continue;
    }

    const literal = readStringLiteralAt(objectBody, cursor);
    if (!literal) {
      continue;
    }

    prompts.push({
      promptText: literal.value,
      offset: baseOffset + cursor
    });
  }

  return prompts;
}

function parseMessagesContent(messagesBody, baseOffset) {
  const prompts = [];
  const contentPattern = /\bcontent\b\s*:/g;
  let contentMatch;

  while ((contentMatch = contentPattern.exec(messagesBody)) !== null) {
    let cursor = contentMatch.index + contentMatch[0].length;
    cursor = findNextNonWhitespace(messagesBody, cursor);

    const literal = readStringLiteralAt(messagesBody, cursor);
    if (!literal) {
      continue;
    }

    prompts.push({
      promptText: literal.value,
      offset: baseOffset + cursor
    });
  }

  return prompts;
}

function buildLineStarts(source) {
  const starts = [0];
  for (let i = 0; i < source.length; i += 1) {
    if (source[i] === '\n') {
      starts.push(i + 1);
    }
  }
  return starts;
}

function lineForIndex(lineStarts, index) {
  let left = 0;
  let right = lineStarts.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (lineStarts[mid] <= index) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return right + 1;
}

function extractPromptsFromSource(source) {
  const prompts = [];
  const seen = new Set();
  const lineStarts = buildLineStarts(source);

  for (const callName of TARGET_CALLS) {
    let fromIndex = 0;

    while (fromIndex < source.length) {
      const callMatch = findCallArgumentObject(source, callName, fromIndex);
      if (!callMatch) {
        break;
      }

      fromIndex = callMatch.nextIndex;

      if (typeof callMatch.objectStart !== 'number' || typeof callMatch.objectEnd !== 'number') {
        continue;
      }

      const objectBody = source.slice(callMatch.objectStart + 1, callMatch.objectEnd - 1);
      const extracted = parsePropertyStringLiterals(objectBody, callMatch.objectStart + 1);

      for (const prompt of extracted) {
        const line = lineForIndex(lineStarts, prompt.offset);
        const dedupeKey = `${line}:${prompt.promptText}`;

        if (seen.has(dedupeKey)) {
          continue;
        }

        seen.add(dedupeKey);
        prompts.push({
          line,
          promptText: prompt.promptText
        });
      }
    }
  }

  return prompts;
}

function scanDirectory(startPath) {
  const baseDir = resolveBaseDirectory(startPath);
  const sourceFiles = collectSourceFiles(startPath);
  const findings = [];

  for (const filePath of sourceFiles) {
    let source;

    try {
      source = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    const extractedPrompts = extractPromptsFromSource(source);

    for (const prompt of extractedPrompts) {
      findings.push({
        file: path.relative(baseDir, filePath),
        line: prompt.line,
        promptText: prompt.promptText
      });
    }
  }

  return findings;
}

function scanRagDocuments(startPath, ragRule) {
  const baseDir = resolveBaseDirectory(startPath);
  const documentFiles = collectFilesByExtensions(startPath, RAG_DOCUMENT_EXTENSIONS);
  const warnings = [];

  for (const filePath of documentFiles) {
    let source;

    try {
      source = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    const lines = source.split(/\r?\n/);

    for (let i = 0; i < lines.length; i += 1) {
      const warning = ragRule.check(lines[i]);
      if (!warning) {
        continue;
      }

      warnings.push({
        file: path.relative(baseDir, filePath),
        line: i + 1,
        rule: warning.rule,
        message: warning.message,
        suggestion: warning.suggestion
      });
    }
  }

  return warnings;
}

module.exports = {
  scanDirectory,
  scanRagDocuments,
  extractPromptsFromSource,
  collectSourceFiles,
  collectFilesByExtensions,
  TARGET_CALLS,
  RAG_DOCUMENT_EXTENSIONS
};
