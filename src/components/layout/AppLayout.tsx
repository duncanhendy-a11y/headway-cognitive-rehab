import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  HouseSimple,
  Question,
  SignOut,
  Brain,
  WifiHigh,
  WifiSlash,
  MapTrifold,
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: HouseSimple,  label: 'Dashboard' },
  { to: '/roadmap',   icon: MapTrifold,   label: 'Roadmap' },
  { to: '/help',      icon: Question,     label: 'Help' },
];

export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const setOnline  = () => setIsOnline(true);
    const setOffline = () => setIsOnline(false);
    window.addEventListener('online',  setOnline);
    window.addEventListener('offline', setOffline);
    return () => {
      window.removeEventListener('online',  setOnline);
      window.removeEventListener('offline', setOffline);
    };
  }, []);

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '??';

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 flex flex-col border-r border-slate-200"
        style={{ backgroundColor: '#003361' }}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Brain weight="fill" className="w-5 h-5 flex-shrink-0" style={{ color: '#FEDC00' }} />
            <div>
              <div className="text-white font-bold text-base leading-tight tracking-tight">
                headway
              </div>
              <div className="text-blue-300 text-xs leading-tight tracking-wide">cognitive rehab</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white'
                    : 'text-blue-200 hover:text-white hover:bg-white/8'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                      style={{ backgroundColor: '#FEDC00' }} />
                  )}
                  <Icon weight={isActive ? 'fill' : 'regular'} className="w-4 h-4 flex-shrink-0" />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Connectivity indicator */}
        <div className="px-5 py-3 border-t border-white/10">
          <Tooltip>
            <TooltipTrigger>
              <div className={`flex items-center gap-2 text-xs cursor-default ${isOnline ? 'text-green-300' : 'text-amber-300'}`}>
                {isOnline
                  ? <><WifiHigh className="w-3.5 h-3.5" /> Online</>
                  : <><WifiSlash className="w-3.5 h-3.5" /> Offline</>
                }
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isOnline
                ? 'Connected. All session data is being saved.'
                : 'No connection. Reconnect before starting a new session.'
              }
            </TooltipContent>
          </Tooltip>
        </div>

        {/* User menu */}
        <div className="px-2 py-3 border-t border-white/10">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost"
                className="w-full flex items-center gap-3 px-3 text-blue-200 hover:text-white hover:bg-white/8 justify-start h-auto py-2">
                <Avatar className="w-7 h-7 flex-shrink-0">
                  <AvatarFallback className="text-xs font-semibold"
                    style={{ backgroundColor: '#6491C0', color: 'white' }}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm truncate max-w-[100px]">{user?.email?.split('@')[0]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={async () => { await signOut(); navigate('/login'); }}
                className="text-red-600 focus:text-red-600 cursor-pointer gap-2">
                <SignOut className="w-4 h-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
