import ProfileDropdown from "./ProfileDropdown";

interface NavbarProps {
  userName?: string;
  isConnected?: boolean;
}

const Navbar = ({ userName = "User", isConnected = false }: NavbarProps) => {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/30 bg-white/40 backdrop-blur-xl shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Left: Profile Dropdown + Logo + Title */}
          <div className="flex items-center gap-4">
            <ProfileDropdown />
            <div className="flex items-center gap-3">
              <img 
                src="/netravaani-logo.png" 
                alt="NetraVaani Logo" 
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  // Fallback if logo image not found
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* <div className="hidden sm:block">
                <p className="text-xs text-gray-500 font-semibold">Blink Communication System</p>
              </div> */}
            </div>
          </div>

          {/* Center: Tagline (hidden on mobile) */}
          <div className="hidden lg:block">
            <h1 className="text-base font-bold text-gray-600 flex items-center gap-2">
              <span className="text-lg">👁️</span>
              Your voice, through your eyes
            </h1>
          </div>

          {/* Right: Device Status */}
          <div className="flex items-center gap-3">
            <div
              className={`rounded-2xl px-5 py-3 font-bold shadow-lg transition-all ${
                isConnected 
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse-slow shadow-green-500/50" 
                  : "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-red-500/50"
              }`}
            >
              <span className="text-sm uppercase tracking-wider flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-white animate-pulse' : 'bg-white/70'}`}></span>
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
