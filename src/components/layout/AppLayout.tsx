import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  HelpCircle,
  LogOut,
  Brain,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/help',      icon: HelpCircle,      label: 'Help' },
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
    <div className="flex min-h-screen bg-professional">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col"
        style={{ backgroundColor: '#003361' }}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-blue-900">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6" style={{ color: '#FEDC00' }} />
            <div>
              <div className="text-white font-bold text-base leading-tight tracking-tight"
                style={{ fontFamily: '"Tex Gyre Heros Condensed", Arimo, sans-serif' }}>
                headway
              </div>
              <div className="text-blue-300 text-xs leading-tight">cognitive rehab</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-headway-navy font-bold'
                    : 'text-blue-200 hover:text-white hover:bg-blue-900'
                }`
              }
              style={({ isActive }) => isActive ? { backgroundColor: '#FEDC00', color: '#003361' } : {}}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Connectivity indicator */}
        <div className="px-5 py-3 border-t border-blue-900">
          <div className={`flex items-center gap-2 text-xs ${isOnline ? 'text-green-300' : 'text-amber-300'}`}>
            {isOnline
              ? <><Wifi className="w-3 h-3" /> Online</>
              : <><WifiOff className="w-3 h-3" /> Offline — data will sync</>
            }
          </div>
        </div>

        {/* User menu */}
        <div className="px-3 py-4 border-t border-blue-900">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost"
                className="w-full flex items-center gap-3 px-3 text-blue-200 hover:text-white hover:bg-blue-900 justify-start">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="text-xs font-bold"
                    style={{ backgroundColor: '#6491C0', color: 'white' }}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm truncate max-w-[100px]">{user?.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={async () => { await signOut(); navigate('/login'); }}
                className="text-red-600 focus:text-red-600 cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
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
