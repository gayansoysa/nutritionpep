export default function AuthErrorPage() {
	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<div className="max-w-md w-full text-center">
				<h1 className="text-2xl font-semibold mb-2">Sign-in failed</h1>
				<p className="text-sm text-gray-600">Please try again or contact support.</p>
			</div>
		</div>
	);
}