import { Component, type ReactNode } from 'react'

export class SceneBoundary extends Component<{ children: ReactNode; onUnavailable: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onUnavailable() }
  render() {
    return this.state.failed ? <div className="scene-unavailable" role="status">
      <strong>The 3D view couldn’t start.</strong>
      <p>You can still explore every section using the buttons and map.</p>
      <button type="button" onClick={() => window.location.reload()}>Reload 3D view</button>
    </div> : this.props.children
  }
}
