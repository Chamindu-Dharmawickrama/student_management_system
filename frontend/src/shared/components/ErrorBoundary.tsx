import { Component, type ErrorInfo, type ReactNode } from 'react';
// import * as Sentry from '@sentry/react'; // TODO: Setup Sentry DSN here

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Sentry.captureException(error, { extra: errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-primary)' }}>
          <h2>Oops, there was an error!</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Something went wrong. Please refresh the page.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: 'var(--color-primary)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
