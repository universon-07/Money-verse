/**
 * Backward-compatible import path for the existing frontend.
 * The only live backend implementation is src/teacher/cloud.ts.
 * The UI team can switch imports to ../teacher/cloud and then remove this bridge.
 */
export * from '../teacher/cloud'
