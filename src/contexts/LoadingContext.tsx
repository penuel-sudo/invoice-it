import { createContext, useContext, useMemo, useState, ReactNode } from 'react'

interface LoadingContextValue {
	loading: boolean
	setLoading: (value: boolean) => void
	withLoading: <T>(fn: () => Promise<T>) => Promise<T>
}

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined)

export function LoadingProvider({ children }: { children: ReactNode }) {
	const [loading, setLoading] = useState(false)

	const value = useMemo<LoadingContextValue>(() => ({
		loading,
		setLoading,
		withLoading: async (fn) => {
			setLoading(true)
			try {
				return await fn()
			} finally {
				setLoading(false)
			}
		}
	}), [loading])

	return (
		<LoadingContext.Provider value={value}>
			{children}
		</LoadingContext.Provider>
	)
}

export function useLoading() {
	const ctx = useContext(LoadingContext)
	if (!ctx) throw new Error('useLoading must be used within LoadingProvider')
	return ctx
}


