import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  handleReload = () => {
    window.location.href = '/'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-bg-deep">
        <p
          className="uppercase mb-3 text-6xl"
          style={{ fontFamily: '"Bebas Neue", sans-serif', color: '#F5E6C8', letterSpacing: '0.05em' }}
        >
          Algo se quemó
        </p>
        <p className="text-muted text-sm font-body max-w-md mb-8 leading-relaxed">
          Tuvimos un inconveniente cargando la página. Probá recargar o escribinos directo por WhatsApp.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={this.handleReload}
            className="px-8 py-3 bg-accent text-white font-bold uppercase tracking-widest text-sm transition-all hover:opacity-90 rounded"
          >
            Recargar
          </button>
          <a
            href="https://wa.me/5492235799301"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 border border-cream/30 text-cream font-bold uppercase tracking-widest text-sm hover:bg-white/5 rounded"
          >
            WhatsApp
          </a>
        </div>
      </div>
    )
  }
}
