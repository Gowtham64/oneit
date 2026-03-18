export default function UnauthorizedPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <h1 className="text-4xl font-bold mb-4 text-red-600">403 - Unauthorized</h1>
            <p className="text-xl mb-8 text-muted-foreground">You do not have permission to access this page.</p>
            <a
                href="/"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
                Return to Dashboard
            </a>
        </div>
    );
}
