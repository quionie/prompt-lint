'use strict';

function toPosixPath(value) {
  return value.replace(/\\/g, '/').replace(/^\.\//, '');
}

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function globToRegex(glob) {
  if (typeof glob !== 'string') {
    return null;
  }

  let pattern = glob.trim();
  if (!pattern) {
    return null;
  }

  let directoryOnly = false;
  if (pattern.endsWith('/')) {
    directoryOnly = true;
    pattern = pattern.slice(0, -1);
  }

  pattern = toPosixPath(pattern);

  let anchoredToRoot = false;
  if (pattern.startsWith('/')) {
    anchoredToRoot = true;
    pattern = pattern.slice(1);
  }

  const hasSlash = pattern.includes('/');
  let regexBody = '';

  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];

    if (char === '*') {
      if (pattern[i + 1] === '*') {
        const nextChar = pattern[i + 2];
        if (nextChar === '/') {
          regexBody += '(?:.*/)?';
          i += 2;
        } else {
          regexBody += '.*';
          i += 1;
        }
        continue;
      }

      regexBody += '[^/]*';
      continue;
    }

    if (char === '?') {
      regexBody += '[^/]';
      continue;
    }

    regexBody += escapeRegex(char);
  }

  const prefix = anchoredToRoot || hasSlash ? '^' : '(?:^|.*/)';
  const suffix = directoryOnly ? '(?:/.*)?$' : '$';

  return new RegExp(`${prefix}${regexBody}${suffix}`);
}

function compileGlobs(globs = []) {
  return globs.map(globToRegex).filter(Boolean);
}

function matchesAny(pathForMatch, compiledPatterns) {
  return compiledPatterns.some((pattern) => pattern.test(pathForMatch));
}

function shouldIncludePath(pathForMatch, filters) {
  const includePatterns = filters.includePatterns || [];
  const excludePatterns = filters.excludePatterns || [];
  const ignorePatterns = filters.ignorePatterns || [];

  if (includePatterns.length > 0 && !matchesAny(pathForMatch, includePatterns)) {
    return false;
  }

  if (excludePatterns.length > 0 && matchesAny(pathForMatch, excludePatterns)) {
    return false;
  }

  if (ignorePatterns.length > 0 && matchesAny(pathForMatch, ignorePatterns)) {
    return false;
  }

  return true;
}

module.exports = {
  toPosixPath,
  globToRegex,
  compileGlobs,
  shouldIncludePath
};
