import { useLoading } from '../contexts/LoadingContext'
import { brandColors } from '../stylings'

export default function PageLoader() {
	const { loading } = useLoading()
	if (!loading) return null

	return (
		<div style={{
			position: 'fixed',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			background: 'rgba(255,255,255,0.6)',
			backdropFilter: 'blur(1px)',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			zIndex: 9999
		}}>
			<div style={{
				textAlign: 'center',
				padding: '1rem 1.5rem',
				background: '#ffffff',
				borderRadius: '12px',
				boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
				border: `1px solid ${brandColors.neutral[200]}`
			}}>
				<div style={{
					width: '40px',
					height: '40px',
					border: `3px solid ${brandColors.primary[200]}`,
					borderTop: `3px solid ${brandColors.primary[600]}`,
					borderRadius: '50%',
					animation: 'spin 1s linear infinite',
					margin: '0 auto 0.5rem'
				}} />
				<div style={{ color: brandColors.neutral[600], fontSize: '0.9rem' }}>Loading...</div>
			</div>
			<style>{`
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
			`}</style>
		</div>
	)
}


