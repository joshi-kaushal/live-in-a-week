import { useState } from 'react';
import { Input } from './ui/input';
import TaskItem from './TaskItem';
import { addTask, getPendingTasks, getSomedayTasks } from '../utils/localStorage';

import Navbar from './Navbar';
import Week from './Week';


const WeeklyCalendar = () => {
	const [currentDate, setCurrentDate] = useState(new Date());

	const previousWeek = () => {
		const newDate = new Date(currentDate);
		newDate.setDate(currentDate.getDate() - 7);
		setCurrentDate(newDate);
	};

	const nextWeek = () => {
		const newDate = new Date(currentDate);
		newDate.setDate(currentDate.getDate() + 7);
		setCurrentDate(newDate);
	};

	return (
		<div className="container max-w-6xl p-4 mx-auto">

			<Navbar currentDate={currentDate} previousWeek={previousWeek} nextWeek={nextWeek} />

			<Week currentDate={currentDate} />

			<div className="flex flex-col gap-8 mt-8 lg:flex-row lg:gap-32">
				<div className="pt-2 border-t">
					<div className="mb-2 text-sm text-gray-500">Someday</div>
					<Input
						className="text-sm"
						placeholder="Add task"
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								const target = e.target as HTMLInputElement;
								addTask(target.value);
								target.value = '';
							}
						}}
					/>
					{getSomedayTasks()?.map((task) => (
						<TaskItem key={task.id} task={task} />
					))}
				</div>
				<div className="pt-2 border-t">
					<div className="mb-2 text-sm text-gray-500">Pending tasks</div>

					{getPendingTasks()?.map((task) => (
						<TaskItem key={task.id} task={task} />
					))}
				</div>
			</div>
		</div>
	);
};

export default WeeklyCalendar;