'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Send error to Sentry
    Sentry.withScope((scope) => {
      // Add extra context
      scope.setContext('errorBoundary', {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
      });
      
      // Set error level
      scope.setLevel('error');
      
      // Capture the exception
      Sentry.captureException(error);
    });
  }

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <div className="error-boundary">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h2>Något gick fel</h2>
            <p>Ett oväntat fel inträffade. Vänligen ladda om sidan eller försök igen.</p>
            <div className="error-actions">
              <button 
                className="error-button primary"
                onClick={() => window.location.reload()}
              >
                Ladda om sida
              </button>
              <button 
                className="error-button secondary"
                onClick={() => window.history.back()}
              >
                Gå tillbaka
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Technical Details (Dev Only)</summary>
                <pre>{this.state.error?.toString()}</pre>
              </details>
            )}
          </div>

          <style jsx>{`
            .error-boundary {
              min-height: 400px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              background: #f9fafb;
              border-radius: 8px;
              margin: 20px 0;
            }

            .error-content {
              text-align: center;
              max-width: 500px;
              background: white;
              padding: 40px 30px;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .error-icon {
              font-size: 48px;
              margin-bottom: 20px;
            }

            .error-content h2 {
              color: #dc2626;
              margin: 0 0 12px 0;
              font-size: 24px;
              font-weight: 600;
            }

            .error-content p {
              color: #6b7280;
              margin: 0 0 32px 0;
              line-height: 1.5;
            }

            .error-actions {
              display: flex;
              gap: 12px;
              justify-content: center;
              margin-bottom: 20px;
            }

            .error-button {
              padding: 12px 24px;
              border: none;
              border-radius: 6px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
            }

            .error-button.primary {
              background: #dc2626;
              color: white;
            }

            .error-button.primary:hover {
              background: #b91c1c;
            }

            .error-button.secondary {
              background: #f3f4f6;
              color: #374151;
            }

            .error-button.secondary:hover {
              background: #e5e7eb;
            }

            .error-details {
              margin-top: 20px;
              text-align: left;
              background: #f3f4f6;
              padding: 12px;
              border-radius: 4px;
              font-size: 12px;
            }

            .error-details pre {
              white-space: pre-wrap;
              word-break: break-word;
              margin: 8px 0 0 0;
              color: #dc2626;
            }

            .error-details summary {
              cursor: pointer;
              color: #6b7280;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;