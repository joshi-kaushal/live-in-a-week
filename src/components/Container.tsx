// import { useState } from 'react';
// import { Input } from './ui/input';
// import TaskItem from './TaskItem';
// import { addTask, getPendingTasks, getSomedayTasks } from '../utils/localStorage';

// import Navbar from './Navbar';
// import Week from './Week';


// const WeeklyCalendar = () => {
// 	const [currentDate, setCurrentDate] = useState(new Date());

// 	const previousWeek = () => {
// 		const newDate = new Date(currentDate);
// 		newDate.setDate(currentDate.getDate() - 7);
// 		setCurrentDate(newDate);
// 	};

// 	const nextWeek = () => {
// 		const newDate = new Date(currentDate);
// 		newDate.setDate(currentDate.getDate() + 7);
// 		setCurrentDate(newDate);
// 	};

// 	return (
// 		<div className="container max-w-6xl p-4 mx-auto">

// 			{/* <Navbar currentDate={currentDate} previousWeek={previousWeek} nextWeek={nextWeek} /> */}

// 			<Week currentDate={currentDate} />

// 			<div className="flex flex-col gap-8 mt-8">
// 				<div className="pt-2 border-t">
// 					<div className="mb-2 font-bold text-gray-500">Someday</div>
// 					<div className="flex flex-col gap-2">
// 						{getSomedayTasks()?.map((task) => (
// 							<TaskItem key={task.id} task={task} />
// 						))}
// 						<Input
// 							className="mt-2 text-sm w-full md:w-1/3"
// 							placeholder="Add task"
// 							onKeyDown={(e) => {
// 								if (e.key === 'Enter') {
// 									const target = e.target as HTMLInputElement;
// 									if (target.value.trim()) {
// 										addTask(target.value);
// 										target.value = '';
// 									}
// 								}
// 							}}
// 						/>
// 					</div>
// 				</div>
// 				<div className="pt-2 border-t">
// 					<div className="mb-2 font-bold text-gray-500">Pending tasks</div>
// 					<div className="grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
// 						{getPendingTasks()?.map((task) => (
// 							<TaskItem key={task.id} task={task} />
// 						))}
// 					</div>
// 				</div>
// 			</div>
// 		</div>
// 	);
// };

// export default WeeklyCalendar;