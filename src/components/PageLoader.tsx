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
				width: '40px',
				height: '40px',
				border: `3px solid ${brandColors.primary[200]}`,
				borderTop: `3px solid ${brandColors.primary[600]}`,
				borderRadius: '50%',
				animation: 'spin 1s linear infinite'
			}} />
			<style>{`
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
			`}</style>
		</div>
	)
}


