import React from 'react';

function SignInScreen({ onSignIn, error }) {
  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => {
    setLoading(true);
    await onSignIn();
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-50 to-slate-100 p-6 text-center">
      <div className="mb-5">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto text-indigo-500">
          <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.6"/>
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Vocabulary Note</h1>
      <p className="text-sm text-gray-500 mb-7">Sign in to access your vocabulary</p>
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Signing in...
          </>
        ) : (
          'Sign in with Google'
        )}
      </button>
      {error && (
        <p className="mt-4 text-sm text-red-600 max-w-xs">{error}</p>
      )}
    </div>
  );
}

export default SignInScreen;
