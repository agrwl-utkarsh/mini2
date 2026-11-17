import type { Repository, FileTreeNode, RepositoryStats, FileContent, CodeExplanation, ChatResponse } from '../types'

export const mockFileTree: FileTreeNode = {
  name: 'react',
  path: '',
  type: 'folder',
  expanded: true,
  children: [
    {
      name: 'packages',
      path: 'packages',
      type: 'folder',
      expanded: true,
      children: [
        {
          name: 'react',
          path: 'packages/react',
          type: 'folder',
          expanded: true,
          children: [
            { name: 'src', path: 'packages/react/src', type: 'folder', expanded: true, children: [
              { name: 'React.js', path: 'packages/react/src/React.js', type: 'file', language: 'JavaScript', size: 12500 },
              { name: 'ReactBaseClasses.js', path: 'packages/react/src/ReactBaseClasses.js', type: 'file', language: 'JavaScript', size: 8200 },
              { name: 'ReactHooks.js', path: 'packages/react/src/ReactHooks.js', type: 'file', language: 'JavaScript', size: 15600 },
              { name: 'ReactElement.js', path: 'packages/react/src/ReactElement.js', type: 'file', language: 'JavaScript', size: 9800 },
              { name: 'ReactComponent.js', path: 'packages/react/src/ReactComponent.js', type: 'file', language: 'JavaScript', size: 11200 },
            ]},
            { name: 'package.json', path: 'packages/react/package.json', type: 'file', language: 'JSON', size: 2100 },
          ],
        },
        {
          name: 'react-dom',
          path: 'packages/react-dom',
          type: 'folder',
          expanded: false,
          children: [
            { name: 'src', path: 'packages/react-dom/src', type: 'folder', expanded: false, children: [
              { name: 'ReactDOM.js', path: 'packages/react-dom/src/ReactDOM.js', type: 'file', language: 'JavaScript', size: 25000 },
              { name: 'ReactDOMComponent.js', path: 'packages/react-dom/src/ReactDOMComponent.js', type: 'file', language: 'JavaScript', size: 18000 },
            ]},
            { name: 'package.json', path: 'packages/react-dom/package.json', type: 'file', language: 'JSON', size: 1800 },
          ],
        },
        {
          name: 'react-reconciler',
          path: 'packages/react-reconciler',
          type: 'folder',
          expanded: false,
          children: [
            { name: 'src', path: 'packages/react-reconciler/src', type: 'folder', expanded: false, children: [
              { name: 'ReactFiber.js', path: 'packages/react-reconciler/src/ReactFiber.js', type: 'file', language: 'JavaScript', size: 45000 },
              { name: 'ReactFiberWorkLoop.js', path: 'packages/react-reconciler/src/ReactFiberWorkLoop.js', type: 'file', language: 'JavaScript', size: 38000 },
              { name: 'ReactFiberBeginWork.js', path: 'packages/react-reconciler/src/ReactFiberBeginWork.js', type: 'file', language: 'JavaScript', size: 28000 },
            ]},
          ],
        },
      ],
    },
    {
      name: 'scripts',
      path: 'scripts',
      type: 'folder',
      expanded: false,
      children: [
        { name: 'build.js', path: 'scripts/build.js', type: 'file', language: 'JavaScript', size: 15000 },
        { name: 'test.js', path: 'scripts/test.js', type: 'file', language: 'JavaScript', size: 8000 },
      ],
    },
    { name: 'package.json', path: 'package.json', type: 'file', language: 'JSON', size: 5200 },
    { name: 'README.md', path: 'README.md', type: 'file', language: 'Markdown', size: 12000 },
    { name: 'tsconfig.json', path: 'tsconfig.json', type: 'file', language: 'JSON', size: 1800 },
    { name: '.eslintrc.js', path: '.eslintrc.js', type: 'file', language: 'JavaScript', size: 3200 },
    { name: 'jest.config.js', path: 'jest.config.js', type: 'file', language: 'JavaScript', size: 2100 },
    { name: 'rollup.config.js', path: 'rollup.config.js', type: 'file', language: 'JavaScript', size: 4500 },
  ],
}

export const mockRepo: Repository = {
  id: 'demo-repo-123',
  name: 'react',
  url: 'https://github.com/facebook/react',
  status: 'complete',
  stats: {
    files: 2847,
    folders: 423,
    languages: { TypeScript: 45, JavaScript: 30, CSS: 15, Other: 10 },
    frameworks: ['React', 'Jest', 'ESLint', 'TypeScript', 'Rollup'],
    totalSize: 45_000_000,
    linesOfCode: 580_000,
  },
  tree: mockFileTree,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const mockFileContent: FileContent = {
  path: 'packages/react/src/ReactHooks.js',
  language: 'JavaScript',
  size: 15600,
  lines: 487,
  content: `/**
 * @license React
 * react-hooks.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import {
  currentlyRenderingComponent,
  currentHook,
  workInProgressHook,
} from './ReactCurrentDispatcher';

import {
  mountWorkInProgressHook,
  updateWorkInProgressHook,
} from './ReactHooksUtil';

import { isFunction } from 'shared/utils';

/**
 * Creates a new hook for the current component.
 */
function createHook(): Hook {
  return {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };
}

/**
 * Creates a work-in-progress hook.
 */
function createWorkInProgressHook(): Hook {
  if (workInProgressHook !== null) {
    // There's already a work-in-progress. Reuse it.
    workInProgressHook = workInProgressHook.next;
    return workInProgressHook;
  } else if (currentHook !== null) {
    // Clone from the current hook.
    currentHook = currentHook.next;
    const newHook = {
      memoizedState: currentHook.memoizedState,
      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,
      next: null,
    };
    workInProgressHook = newHook;
    return workInProgressHook;
  } else {
    // Create a brand new hook.
    workInProgressHook = createHook();
    return workInProgressHook;
  }
}

/**
 * Basic hook for managing state in functional components.
 * @param {*} initialState - Initial state value or initializer function
 * @returns {Array} [state, setState]
 */
export function useState(initialState) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}

/**
 * Hook for managing expensive computations.
 * @param {Function} nextCreate - Function that returns the computed value
 * @param {Array} deps - Dependency array
 * @returns {*} Memoized value
 */
export function useMemo(nextCreate, deps) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useMemo(nextCreate, deps);
}

/**
 * Hook for memoizing callbacks.
 * @param {Function} callback - Function to memoize
 * @param {Array} deps - Dependency array
 * @returns {Function} Memoized callback
 */
export function useCallback(callback, deps) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useCallback(callback, deps);
}

/**
 * Hook for side effects in functional components.
 * @param {Function} create - Effect function
 * @param {Array} deps - Dependency array
 */
export function useEffect(create, deps) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, deps);
}

/**
 * Hook for layout effects (synchronous).
 * @param {Function} create - Effect function
 * @param {Array} deps - Dependency array
 */
export function useLayoutEffect(create, deps) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useLayoutEffect(create, deps);
}

/**
 * Hook for accessing refs.
 * @param {*} initialValue - Initial ref value
 * @returns {Object} Ref object
 */
export function useRef(initialValue) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useRef(initialValue);
}

/**
 * Hook for imperative handle.
 * @param {Object} ref - Ref object
 * @param {Function} create - Handle creator
 * @param {Array} deps - Dependency array
 */
export function useImperativeHandle(ref, create, deps) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useImperativeHandle(ref, create, deps);
}

/**
 * Hook for debugging component renders.
 * @param {string} label - Debug label
 * @param {Object} value - Value to inspect
 */
export function useDebugValue(label, value) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useDebugValue(label, value);
}

/**
 * Resolves the current dispatcher based on render phase.
 * @returns {Dispatcher} Current dispatcher
 */
function resolveDispatcher() {
  const dispatcher = ReactCurrentDispatcher.current;
  if (dispatcher === null) {
    throw new Error(
      'Invalid hook call. Hooks can only be called inside of the body of a function component.'
    );
  }
  return dispatcher;
}

// Internal hook types
export type Hook = {
  memoizedState: any,
  baseState: any,
  baseQueue: any,
  queue: any,
  next: Hook | null,
};

export type Dispatcher = {
  useState: (initialState: any) => [any, (newState: any) => void],
  useMemo: (nextCreate: () => any, deps: any[]) => any,
  useCallback: (callback: Function, deps: any[]) => Function,
  useEffect: (create: () => (() => void) | void, deps: any[]) => void,
  useLayoutEffect: (create: () => (() => void) | void, deps: any[]) => void,
  useRef: (initialValue: any) => { current: any },
  useImperativeHandle: (ref: any, create: () => any, deps: any[]) => void,
  useDebugValue: (label: string, value: any) => void,
};
`,
}

export const mockExplanation: CodeExplanation = {
  filePath: 'packages/react/src/ReactHooks.js',
  summary: 'This file exports the public React Hooks API (useState, useEffect, useMemo, etc.) and contains internal hook implementation utilities. It acts as the main entry point for all built-in hooks in React.',
  functions: [
    {
      name: 'useState',
      lineStart: 58,
      lineEnd: 63,
      params: ['initialState'],
      returnType: '[state, setState]',
      docstring: 'Basic hook for managing state in functional components.',
      isAsync: false,
      isExport: true,
    },
    {
      name: 'useMemo',
      lineStart: 66,
      lineEnd: 72,
      params: ['nextCreate', 'deps'],
      returnType: 'Memoized value',
      docstring: 'Hook for managing expensive computations.',
      isAsync: false,
      isExport: true,
    },
    {
      name: 'useCallback',
      lineStart: 75,
      lineEnd: 81,
      params: ['callback', 'deps'],
      returnType: 'Memoized callback',
      docstring: 'Hook for memoizing callbacks.',
      isAsync: false,
      isExport: true,
    },
    {
      name: 'useEffect',
      lineStart: 84,
      lineEnd: 89,
      params: ['create', 'deps'],
      returnType: 'void',
      docstring: 'Hook for side effects in functional components.',
      isAsync: false,
      isExport: true,
    },
    {
      name: 'useLayoutEffect',
      lineStart: 92,
      lineEnd: 97,
      params: ['create', 'deps'],
      returnType: 'void',
      docstring: 'Hook for layout effects (synchronous).',
      isAsync: false,
      isExport: true,
    },
    {
      name: 'useRef',
      lineStart: 100,
      lineEnd: 105,
      params: ['initialValue'],
      returnType: 'Ref object',
      docstring: 'Hook for accessing refs.',
      isAsync: false,
      isExport: true,
    },
    {
      name: 'useImperativeHandle',
      lineStart: 108,
      lineEnd: 114,
      params: ['ref', 'create', 'deps'],
      returnType: 'void',
      docstring: 'Hook for imperative handle.',
      isAsync: false,
      isExport: true,
    },
    {
      name: 'useDebugValue',
      lineStart: 117,
      lineEnd: 121,
      params: ['label', 'value'],
      returnType: 'void',
      docstring: 'Hook for debugging component renders.',
      isAsync: false,
      isExport: true,
    },
    {
      name: 'resolveDispatcher',
      lineStart: 124,
      lineEnd: 135,
      params: [],
      returnType: 'Dispatcher',
      docstring: 'Resolves the current dispatcher based on render phase.',
      isAsync: false,
      isExport: false,
    },
    {
      name: 'createHook',
      lineStart: 22,
      lineEnd: 30,
      params: [],
      returnType: 'Hook',
      isAsync: false,
      isExport: false,
    },
    {
      name: 'createWorkInProgressHook',
      lineStart: 33,
      lineEnd: 55,
      params: [],
      returnType: 'Hook',
      isAsync: false,
      isExport: false,
    },
  ],
  classes: [],
  imports: [
    { source: './ReactCurrentDispatcher', specifiers: ['currentlyRenderingComponent', 'currentHook', 'workInProgressHook'], isDefault: false, isNamespace: false, line: 5 },
    { source: './ReactHooksUtil', specifiers: ['mountWorkInProgressHook', 'updateWorkInProgressHook'], isDefault: false, isNamespace: false, line: 10 },
    { source: 'shared/utils', specifiers: ['isFunction'], isDefault: false, isNamespace: false, line: 13 },
  ],
  complexity: 'medium',
}

export const mockChatResponse: ChatResponse = {
  answer: `React Hooks are implemented in \`packages/react/src/ReactHooks.js\` as the public API entry point. The actual implementation lives in \`ReactFiberHooks.js\` within the reconciler package.

**Key Architecture:**
1. **Dispatcher Pattern**: Hooks delegate to a \`Dispatcher\` that changes based on render phase (mount vs update)
2. **Hook Objects**: Each hook call creates/updates a \`Hook\` object in a linked list attached to the fiber
3. **Work-in-Progress**: During render, a work-in-progress hook chain is built

**Core Hooks Flow:**
- \`useState\` → \`useReducer\` internally (in ReactFiberHooks)
- \`useEffect\`/\`useLayoutEffect\` → Schedule effect callbacks on fiber
- \`useMemo\`/\`useCallback\` → Store memoized values with dependency comparison

The \`resolveDispatcher()\` function (line 124) returns the appropriate dispatcher for the current phase.`,
  references: [
    { path: 'packages/react/src/ReactHooks.js', lineStart: 58, lineEnd: 135, snippet: 'export function useState(initialState)...' },
    { path: 'packages/react-reconciler/src/ReactFiberHooks.js', lineStart: 1, lineEnd: 500, snippet: 'function mountState...' },
    { path: 'packages/react-reconciler/src/ReactFiberWorkLoop.js', lineStart: 100, lineEnd: 200, snippet: 'function commitHookEffectList...' },
  ],
  model: 'fallback',
}

export const mockStats: RepositoryStats = {
  files: 2847,
  folders: 423,
  languages: { TypeScript: 45, JavaScript: 30, CSS: 15, Other: 10 },
  frameworks: ['React', 'Jest', 'ESLint', 'TypeScript', 'Rollup'],
  totalSize: 45_000_000,
  linesOfCode: 580_000,
}