export const AuthLoadingSkeleton = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-48 mx-auto animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-32 mx-auto animate-pulse"></div>
      </div>
      <p className="text-gray-600 mt-4 text-sm">Loading...</p>
    </div>
  </div>
);
