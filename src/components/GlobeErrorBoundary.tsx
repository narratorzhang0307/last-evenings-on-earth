import { Component, type ErrorInfo, type ReactNode } from 'react';

interface GlobeErrorBoundaryProps {
  children: ReactNode;
}

interface GlobeErrorBoundaryState {
  hasError: boolean;
}

export class GlobeErrorBoundary extends Component<GlobeErrorBoundaryProps, GlobeErrorBoundaryState> {
  state: GlobeErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): GlobeErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.warn('夜晚地球渲染失败，已保留档案入口。', error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="globe-fallback" role="status">
          <strong>夜晚地球暂时无法点亮</strong>
          <span>城市、档案和电台入口仍可使用。</span>
        </div>
      );
    }

    return this.props.children;
  }
}
