import { FC, useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, HelpCircle, LogOut, UserCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { LoginModal } from './auth/LoginModal';
import { LogoutModal } from './auth/LogoutModal';
import { formatIndianNumber } from '../services/api';

interface NavbarProps {
	weekStart: Date;
	weekEnd: Date;
	onPrevWeek: () => void;
	onNextWeek: () => void;
	onToday: () => void;
	onShowHelp: () => void;
}

const Navbar: FC<NavbarProps> = ({ weekStart, weekEnd, onPrevWeek, onNextWeek, onToday, onShowHelp }) => {
	const startLabel = format(weekStart, 'MMM d');
	const endLabel = format(weekEnd, 'MMM d, yyyy');
	const monthYear = format(weekStart, 'MMMM yyyy');

	const { token, user } = useAuthStore();
	const isAuthenticated = !!token && !!user;

	const [loginOpen, setLoginOpen] = useState(false);
	const [logoutOpen, setLogoutOpen] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				setDropdownOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const getWeekNumber = (d: Date) => {
		const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
		date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
		const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
		return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
	};

	function getInitials(name: string | null, phone: string): string {
		if (name) {
			return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
		}
		return phone.slice(-2);
	}

	return (
		<div className="navbar-inner">
			{/* Left: Brand */}
			<div className="navbar-brand">
				<img src="/LiveInAWeek-24.svg" alt="Live in a week logo" width={24} height={24} />
				<span className="brand-name">Live in a Week</span>
			</div>

			{/* Center: Week info */}
			<div className="navbar-center">
				<span className="navbar-month">{monthYear}</span>
				<span className="navbar-week-range">{startLabel} – {endLabel}</span>
				<span className="navbar-week-num">W{getWeekNumber(weekStart)}</span>
			</div>

			{/* Right: Controls */}
			<div className="navbar-controls">
				<button className="nav-btn nav-btn--text" onClick={onToday} title="Go to today (t)">Today</button>
				<div className="nav-btn-group">
					<button className="nav-btn nav-btn--icon" onClick={onPrevWeek} aria-label="Previous week (Ctrl+←)">
						<ChevronLeft size={16} />
					</button>
					<button className="nav-btn nav-btn--icon" onClick={onNextWeek} aria-label="Next week (Ctrl+→)">
						<ChevronRight size={16} />
					</button>
				</div>
				<button className="nav-btn nav-btn--icon nav-btn--help" onClick={onShowHelp} aria-label="Keyboard shortcuts (?)">
					<HelpCircle size={15} />
				</button>

				{isAuthenticated ? (
					<div className="relative" ref={dropdownRef}>
						<button
							className="flex items-center justify-center w-7 h-7 rounded-full text-white text-[10px] font-bold select-none hover:opacity-90 transition-opacity"
							style={{ backgroundColor: '#3B6FE8' }}
							onClick={() => setDropdownOpen((o) => !o)}
							title={user.display_name ?? formatIndianNumber(user.phone_number)}
						>
							{getInitials(user.display_name, user.phone_number)}
						</button>
						{dropdownOpen && (
							<div className="absolute right-0 top-full mt-1 w-44 rounded-md border bg-popover shadow-md z-50 py-1">
								<div className="px-3 py-2 text-xs text-muted-foreground border-b truncate">
									{user.display_name ?? formatIndianNumber(user.phone_number)}
								</div>
								<button
									className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-accent transition-colors text-left"
									onClick={() => { setLogoutOpen(true); setDropdownOpen(false); }}
								>
									<LogOut size={13} />
									Logout
								</button>
							</div>
						)}
					</div>
				) : (
					<button
						className="flex items-center justify-center w-7 h-7 rounded-full hover:opacity-80 transition-opacity"
						style={{ color: '#3B6FE8' }}
						onClick={() => setLoginOpen(true)}
						title="Sign in"
					>
						<UserCircle2 size={22} />
					</button>
				)}
			</div>

			<LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
			<LogoutModal open={logoutOpen} onOpenChange={setLogoutOpen} />
		</div>
	);
};

export default Navbar;