import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Catches a crash inside a mounted game so one broken game never takes down the app.
 * To reset it, remount it with a different `key` (the host does this per pillar and seed).
 * TODO(final-ui): wireframe. It only reports and renders what the parent gives it; no logic.
 */
export class GameErrorBoundary extends Component<{ children: ReactNode; fallback: (error: Error) => ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[game-host] a game crashed:', error, info.componentStack)
  }

  render() {
    return this.state.error ? this.props.fallback(this.state.error) : this.props.children
  }
}
