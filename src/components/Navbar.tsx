import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { Button } from "./ui/button";
import { MILLISECONDS_IN_A_DAY } from "../constants";

interface NavbarProps {
	currentDate: Date;
	previousWeek: () => void;
	nextWeek: () => void;
}
export default function Navbar({ currentDate, previousWeek, nextWeek }: NavbarProps) {

	const getWeekNumber = (date: Date): number => {
		const startOfYear = new Date(date.getFullYear(), 0, 1);
		const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / MILLISECONDS_IN_A_DAY;

		return Math.floor((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
	};

	const weekNumber = getWeekNumber(currentDate) + 1
	return (
		<div className="flex items-center justify-between mb-4">
			<div className="flex flex-col gap-1 lg:flex-row lg:gap-4 lg:items-center">
				<h1 className="text-2xl font-bold">
					{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
				</h1>
				<p className="text-lg font-semibold text-slate-800">Week {weekNumber}</p>
			</div>

			<div className="flex items-center space-x-2">
				<div className="p-2 bg-purple-200 rounded-full">
					<span className="font-bold text-purple-800">KJ</span>
				</div>
				<Button variant="ghost" size="icon">
					<MoreVertical className="w-4 h-4" />
				</Button>
				<Button variant="outline" size="icon" onClick={previousWeek}>
					<ChevronLeft className="w-4 h-4" />
				</Button>
				<Button variant="outline" size="icon" onClick={nextWeek}>
					<ChevronRight className="w-4 h-4" />
				</Button>
			</div>
		</div>
	)
}