import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Button } from "../components/ui/button"
import { Calendar } from "../components/ui/calendar"
import { format } from 'date-fns'
import { Trash2 } from 'lucide-react'
import { Task } from '../types'
import { deleteTask as deleteTaskFromLocalStorage, updateTask as updateTaskFromLocalStorage } from '../utils/localStorage';

interface TaskItemProps {
	task: Task
}

export default function TaskItem({ task }: TaskItemProps) {
	const [isOpen, setIsOpen] = useState(false)

	// const getEnergyColor = (level: 'low' | 'medium' | 'high') => {
	// 	switch (level) {
	// 		case 'low': return 'text-red-500'
	// 		case 'medium': return 'text-yellow-500'
	// 		case 'high': return 'text-green-500'
	// 		default: return 'text-gray-500'
	// 	}
	// }

	// const getTimeColor = (time: 'low' | 'medium' | 'high') => {
	// 	switch (time) {
	// 		case 'low': return 'text-green-500'
	// 		case 'medium': return 'text-yellow-500'
	// 		case 'high': return 'text-red-500'
	// 		default: return 'text-gray-500'
	// 	}
	// }

	const deleteTask = (id: number) => {
		const deleted = deleteTaskFromLocalStorage(id);
		console.log(deleted)
	}

	const updateTask = (id: number, updatedData: Partial<Task>) => {
		const updated = updateTaskFromLocalStorage(id, updatedData);
		console.log("Updated task: ", updated)
	}

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<div className="flex items-center justify-between p-2 mt-2 text-sm transition-colors duration-200 border-b cursor-pointer hover:bg-gray-100">
					<span className={`flex-grow ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>{task.title}</span>
					{/* <div className="flex items-center space-x-2">
						<Battery size={16} className={getEnergyColor(task.energyLevel)} />
						<Clock size={16} className={getTimeColor(task.timeRequired)} />
						{task.status === 'completed' && <CheckCircle size={16} className="text-green-500" />}
						{task.dueDate && <CalendarIcon size={16} className="text-blue-500" />}
					</div> */}
				</div>
			</PopoverTrigger>
			<PopoverContent className="w-80">
				<div className="space-y-4">
					<Input
						value={task.title}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTask(task.id!, { title: e.target.value })}
						className="font-bold"
						placeholder="Task title"
					/>
					<Textarea
						value={task.description}
						onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateTask(task.id!, { description: e.target.value })}
						className="w-full p-2 border rounded"
						placeholder="Description"
					/>
					<Select
						value={task.status}
						onValueChange={(value: 'pending' | 'completed') => updateTask(task.id!, { status: value as 'pending' | 'completed' })}
					>
						<SelectTrigger>
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="pending">Pending</SelectItem>
							<SelectItem value="completed">Completed</SelectItem>
						</SelectContent>
					</Select>
					<Select
						value={task.energyLevel}
						onValueChange={(value: 'low' | 'medium' | 'high') => updateTask(task.id!, { energyLevel: value as 'low' | 'medium' | 'high' })}
					>
						<SelectTrigger>
							<SelectValue placeholder="Energy Level" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="low">Low Energy</SelectItem>
							<SelectItem value="medium">Medium Energy</SelectItem>
							<SelectItem value="high">High Energy</SelectItem>
						</SelectContent>
					</Select>
					<Select
						value={task.timeRequired}
						onValueChange={(value: 'low' | 'medium' | 'high') => updateTask(task.id!, { timeRequired: value as 'low' | 'medium' | 'high' })}
					>
						<SelectTrigger>
							<SelectValue placeholder="Time Required" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="low">Quick</SelectItem>
							<SelectItem value="medium">Medium</SelectItem>
							<SelectItem value="high">Time-consuming</SelectItem>
						</SelectContent>
					</Select>
					<div>
						<p className="mb-2 text-sm font-medium">Due Date</p>
						<Calendar
							mode="single"
							selected={new Date(task.dueDate)}
							onSelect={(date: Date | undefined) => {
								if (date) {
									updateTask(task.id!, { dueDate: format(date, "MM-dd-yyyy") });
								}
							}}
							className="border rounded-md"
						/>
					</div>
					<div className="flex justify-between">
						<Button
							variant="outline"
							onClick={() => {
								deleteTask(task.id!)
								setIsOpen(false)
							}}
						>
							<Trash2 className="w-4 h-4 mr-2" />
							Delete
						</Button>
						<Button onClick={() => setIsOpen(false)}>
							Close
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	)
}