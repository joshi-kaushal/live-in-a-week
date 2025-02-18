import { format } from "date-fns";
import { getTaskForDueDate, addTask } from "../utils/localStorage";
import TaskItem from "./TaskItem";
import { Input } from "./ui/input";

interface WeekProps {
	currentDate: Date;
}

export default function Week({ currentDate }: WeekProps) {
	const getDaysOfWeek = (date: Date) => {
		const week = [];
		for (let i = 0; i < 7; i++) {
			const day = new Date(date);
			day.setDate(date.getDate() - date.getDay() + i);
			week.push(day);
		}
		return week;
	};

	const weekDays = getDaysOfWeek(currentDate);
	return (
		<div className="grid grid-cols-7 gap-4">
			{weekDays.map((day, index) => {
				const isToday = day.toDateString() === new Date().toDateString();
				const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
				const tasksForToday = getTaskForDueDate(format(day, "MM-dd-yyyy"))

				return (
					<div key={index} className="pt-2 border-t">
						<div className={`text-sm mb-2 ${isToday ? 'text-blue-500 font-bold' : 'text-gray-500'}`}>
							{dayName}
						</div>
						<div className="font-bold">{format(day, "MMM dd")}</div>
						{tasksForToday.map((task) => (
							<TaskItem
								key={task.id}
								task={task}
							/>
						))}
						<Input
							className="mt-2 text-sm"
							placeholder="Add task"
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									const target = e.target as HTMLInputElement;
									addTask(target.value, day);
									target.value = '';
								}
							}}
						/>
						{new Array(6 - tasksForToday?.length).fill(null).map((_, index) => (
							<div key={index} className="px-2 py-2 mt-1 text-sm border-b h-7 border-b-slate-100" />
						))}
					</div>
				);
			})}
		</div>
	)
}