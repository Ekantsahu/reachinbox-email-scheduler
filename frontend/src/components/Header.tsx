interface HeaderProps {
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  onLogout?: () => void;
}

export default function Header({
  userName = "User",
  userEmail = "user@example.com",
  userAvatar,
  onLogout,
}: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-sm font-bold text-white">
          R
        </div>

        <span className="text-lg font-semibold">ReachInbox</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium">{userName}</p>
          <p className="text-xs text-gray-500">{userEmail}</p>
        </div>

        {userAvatar ? (
          <img
            src={userAvatar}
            alt={userName}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-medium">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}

        <button
          type="button"
          onClick={onLogout}
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}