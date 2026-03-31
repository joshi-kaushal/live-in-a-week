import { FC } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';

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

	const getWeekNumber = (d: Date) => {
		const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
		date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
		const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
		return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
	};

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
			</div>
		</div>
	);
};

export default Navbar;