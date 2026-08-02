import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/** Catches render-time errors so a single failing screen can't white-screen the app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface in the console for diagnostics; a real reporter (e.g. Sentry) can hook in here.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('Unhandled UI error:', error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center"
        >
          <h1 className="text-lg font-bold text-heading">حدث خطأ غير متوقع</h1>
          <p className="max-w-sm text-sm text-body">نعتذر، حدث خلل أثناء العرض. يرجى إعادة تحميل الصفحة.</p>
          <button
            onClick={() => window.location.reload()}
            className="h-11 rounded-lg bg-brand-green px-5 text-sm font-medium text-white hover:bg-brand-green-hover"
          >
            إعادة التحميل
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
