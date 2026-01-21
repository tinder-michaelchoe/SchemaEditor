/**
 * Utilities for working with JSON paths
 */

/**
 * Convert a path array to a dot-notation string
 */
export function pathToString(path: (string | number)[]): string {
  return path
    .map((segment, index) => {
      if (typeof segment === 'number') {
        return `[${segment}]`;
      }
      if (index === 0) {
        return segment;
      }
      // Use bracket notation for keys with special characters
      if (/[.\[\]\s]/.test(segment)) {
        return `["${segment}"]`;
      }
      return `.${segment}`;
    })
    .join('');
}

/**
 * Parse a dot-notation path string to an array
 */
export function stringToPath(pathStr: string): (string | number)[] {
  if (!pathStr) return [];
  
  const path: (string | number)[] = [];
  const regex = /([^.\[\]]+)|\[(\d+)\]|\["([^"]+)"\]/g;
  let match;
  
  while ((match = regex.exec(pathStr)) !== null) {
    if (match[1] !== undefined) {
      path.push(match[1]);
    } else if (match[2] !== undefined) {
      path.push(parseInt(match[2], 10));
    } else if (match[3] !== undefined) {
      path.push(match[3]);
    }
  }
  
  return path;
}

/**
 * Get a value from an object by path
 */
export function getValueAtPath(obj: unknown, path: (string | number)[]): unknown {
  let current: unknown = obj;
  
  for (const segment of path) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current === 'object') {
      current = (current as Record<string | number, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  
  return current;
}

/**
 * Set a value in an object by path, creating intermediate objects/arrays as needed
 */
export function setValueAtPath(
  obj: unknown,
  path: (string | number)[],
  value: unknown
): unknown {
  if (path.length === 0) {
    return value;
  }

  const result = structuredClone(obj) ?? {};
  let current: Record<string | number, unknown> = result as Record<string | number, unknown>;

  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    const nextSegment = path[i + 1];
    
    if (current[segment] === undefined || current[segment] === null) {
      // Create intermediate structure based on next segment type
      current[segment] = typeof nextSegment === 'number' ? [] : {};
    }
    
    current = current[segment] as Record<string | number, unknown>;
  }

  const lastSegment = path[path.length - 1];
  current[lastSegment] = value;

  return result;
}

/**
 * Delete a value from an object by path
 */
export function deleteValueAtPath(
  obj: unknown,
  path: (string | number)[]
): unknown {
  if (path.length === 0) {
    return undefined;
  }

  const result = structuredClone(obj);
  let current: Record<string | number, unknown> = result as Record<string | number, unknown>;

  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    if (current[segment] === undefined) {
      return result; // Path doesn't exist
    }
    current = current[segment] as Record<string | number, unknown>;
  }

  const lastSegment = path[path.length - 1];
  
  if (Array.isArray(current) && typeof lastSegment === 'number') {
    current.splice(lastSegment, 1);
  } else {
    delete current[lastSegment];
  }

  return result;
}

/**
 * Insert a value into an array at a specific index
 */
export function insertAtIndex(
  obj: unknown,
  path: (string | number)[],
  index: number,
  value: unknown
): unknown {
  const array = getValueAtPath(obj, path);
  
  if (!Array.isArray(array)) {
    return obj;
  }

  const newArray = [...array];
  newArray.splice(index, 0, value);
  
  return setValueAtPath(obj, path, newArray);
}

/**
 * Move an array item from one index to another
 */
export function moveArrayItem(
  obj: unknown,
  path: (string | number)[],
  fromIndex: number,
  toIndex: number
): unknown {
  const array = getValueAtPath(obj, path);
  
  if (!Array.isArray(array)) {
    return obj;
  }

  const newArray = [...array];
  const [item] = newArray.splice(fromIndex, 1);
  newArray.splice(toIndex, 0, item);
  
  return setValueAtPath(obj, path, newArray);
}
