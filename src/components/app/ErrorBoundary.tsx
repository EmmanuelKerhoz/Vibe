import React, { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorInfo: null };

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  render() {
    const { error, errorInfo } = this.state;
    if (!error) return this.props.children;

    const isDev = import.meta.env.DEV;

    return (
      <div
        role="alert"
        aria-live="assertive"
        style={{
          fontFamily: 'monospace',
          padding: '2rem',
          background: '#0a0a0a',
          color: '#f87171',
          minHeight: '100dvh',
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          ⚠ Application error
        </div>
        <div style={{ color: '#fca5a5', marginBottom: '1rem' }}>
          {error.message}
        </div>
        {isDev && errorInfo && (
          <pre
            style={{
              fontSize: '0.72rem',
              color: '#6b7280',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              background: '#111',
              padding: '1rem',
              borderRadius: '6px',
              maxHeight: '60dvh',
              overflowY: 'auto',
            }}
          >
            {error.stack}
            {'\n\nComponent stack:'}
            {errorInfo.componentStack}
          </pre>
        )}
        <button
          aria-label="Reload application"
          onClick={() => window.location.reload()}
          style={{
            marginTop: '1.5rem',
            padding: '0.5rem 1.5rem',
            background: '#1d4ed8',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
