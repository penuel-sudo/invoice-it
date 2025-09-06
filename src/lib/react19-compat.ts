// React 19 Compatibility Patch
// This file provides compatibility for libraries that haven't been updated for React 19

import React from 'react'

// Polyfill for React.Children which was removed in React 19
if (!React.Children) {
  (React as any).Children = {
    map: (children: any, fn: any) => {
      if (children == null) return children
      return React.Children.map(children, fn)
    },
    forEach: (children: any, fn: any) => {
      if (children == null) return
      React.Children.forEach(children, fn)
    },
    count: (children: any) => {
      if (children == null) return 0
      return React.Children.count(children)
    },
    only: (children: any) => {
      if (children == null) return children
      return React.Children.only(children)
    },
    toArray: (children: any) => {
      if (children == null) return []
      return React.Children.toArray(children)
    }
  }
}

// Ensure useLayoutEffect is available
if (!React.useLayoutEffect) {
  (React as any).useLayoutEffect = React.useEffect
}

export {}
