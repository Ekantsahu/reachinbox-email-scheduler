export default function Login() {
  const handleGoogleLogin = () => {
    window.location.href =
      "http://localhost:5000/api/auth/google";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-black text-lg font-bold text-white">
            R
          </div>

          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome to ReachInbox
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Sign in to manage your email campaigns
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M21.35 12.23c0-.79-.07-1.55-.22-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.95 2.94v2.45h3.16c1.85-1.7 2.9-4.2 2.9-7.42Z"
              />
              <path
                fill="#34A853"
                d="M12 21.5c2.65 0 4.87-.88 6.49-2.38l-3.16-2.45c-.88.59-2 .94-3.33.94-2.56 0-4.73-1.73-5.51-4.05H3.22v2.53A9.8 9.8 0 0 0 12 21.5Z"
              />
              <path
                fill="#FBBC05"
                d="M6.49 13.56A5.9 5.9 0 0 1 6.18 12c0-.54.11-1.07.31-1.56V7.91H3.22A9.8 9.8 0 0 0 2.5 12c0 1.58.38 3.07 1.03 4.38l2.96-2.82Z"
              />
              <path
                fill="#EA4335"
                d="M12 6.39c1.44 0 2.73.5 3.75 1.48l2.81-2.81C16.86 3.43 14.65 2.5 12 2.5a9.8 9.8 0 0 0-8.78 5.41l2.96 2.53C7.27 8.12 9.44 6.39 12 6.39Z"
              />
            </svg>

            Continue with Google
          </button>

          <p className="mt-6 text-center text-xs text-gray-500">
            By continuing, you agree to use ReachInbox for managing
            your email campaigns.
          </p>
        </div>
      </div>
    </div>
  );
}