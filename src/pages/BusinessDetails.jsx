/** @format */

// File: src/pages/BusinessDetails.jsx
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import dayjs from 'dayjs';
import {
	ResponsiveContainer,
	LineChart,
	Line,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
	CartesianGrid,
} from 'recharts';

export default function BusinessDetails() {
	const { businessName } = useParams();
	const [data, setData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			const expSnapshot = await getDocs(collection(db, 'expenses'));
			const creditSnapshot = await getDocs(collection(db, 'credits'));

			const expenses = expSnapshot.docs.map((doc) => doc.data());
			const credits = creditSnapshot.docs.map((doc) => doc.data());

			const businessExpenses = expenses.filter(
				(e) => e.business === businessName
			);
			const businessCredits = credits.filter(
				(c) => c.business === businessName
			);

			const chartMap = {};

			businessExpenses.forEach((e) => {
				const month = dayjs(e.date).format('MMM YYYY');
				chartMap[month] = chartMap[month] || { month, rent: 0, renovation: 0 };
				chartMap[month].renovation += e.amount;
			});

			businessCredits.forEach((c) => {
				const month = dayjs(c.date).format('MMM YYYY');
				chartMap[month] = chartMap[month] || { month, rent: 0, renovation: 0 };
				chartMap[month].rent += c.amount;
			});

			const chart = Object.values(chartMap).sort(
				(a, b) => new Date(a.month) - new Date(b.month)
			);
			const totalExp = businessExpenses.reduce((sum, e) => sum + e.amount, 0);
			const totalCred = businessCredits.reduce((sum, c) => sum + c.amount, 0);
			const profit = totalCred - totalExp;

			setData({
				chart,
				totalExp,
				totalCred,
				profit,
				expenses: businessExpenses,
				credits: businessCredits,
			});
			setIsLoading(false);
		};

		fetchData();
	}, [businessName]);

	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-screen'>
				<div className='animate-spin rounded-full h-20 w-20 border-4 border-blue-500 border-t-transparent'></div>
			</div>
		);
	}

	return (
		<div className='max-w-5xl mx-auto py-10 px-4 space-y-10'>
			<div>
				<h1 className='text-2xl font-bold text-gray-800'>
					📈 {businessName} Details
				</h1>

				<div className='grid grid-cols-3 gap-3'>
					<div className='bg-red-100 p-5 rounded-xl text-center'>
						<p className='text-sm'>Expenses</p>
						<p className='text-xl font-bold text-red-900'>Tk {data.totalExp}</p>
					</div>
					<div className='bg-green-100 p-5 rounded-xl text-center'>
						<p className='text-sm'>Credits</p>
						<p className='text-xl font-bold text-green-900'>
							Tk {data.totalCred}
						</p>
					</div>
					<div
						className={`p-5 rounded-xl text-center ${
							data.profit >= 0
								? 'bg-blue-100 text-blue-800'
								: 'bg-red-200 text-red-900'
						}`}>
						<p className='text-sm'>Profit</p>
						<p className='text-xl font-bold'>Tk {data.profit}</p>
					</div>
                </div>
                <br />

				<ResponsiveContainer width='100%' height={300}>
					<LineChart data={data.chart}>
						<CartesianGrid strokeDasharray='3 3' />
						<XAxis dataKey='month' />
						<YAxis />
						<Tooltip />
						<Legend />
						<Line
							type='monotone'
							dataKey='rent'
							stroke='#10B981'
							name='Credits'
						/>
						<Line
							type='monotone'
							dataKey='renovation'
							stroke='#F59E0B'
							name='Expenses'
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
			<div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
				{/* Credits Table */}
				<div>
					<h2 className='text-lg font-semibold mb-2 text-green-700'>
						Credits (Income)
					</h2>
					<div className='overflow-x-auto'>
						<table className='min-w-full bg-white shadow-md rounded-xl overflow-hidden'>
							<thead className='bg-green-100 text-left'>
								<tr>
									<th className='p-3'>Date</th>
									<th className='p-3'>Amount</th>
									<th className='p-3'>Note</th>
								</tr>
							</thead>
							<tbody>
								{data.credits.map((credit, index) => (
									<tr key={index} className='border-t'>
										<td className='p-3'>
											{dayjs(credit.date).format('DD MMM YYYY')}
										</td>
										<td className='p-3 text-green-700 font-medium'>
											Tk {credit.amount}
										</td>
										<td className='p-3'>{credit.note || '-'}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* Expenses Table */}
				<div>
					<h2 className='text-lg font-semibold mb-2 text-red-700'>Expenses</h2>
					<div className='overflow-x-auto'>
						<table className='min-w-full bg-white shadow-md rounded-xl overflow-hidden'>
							<thead className='bg-red-100 text-left'>
								<tr>
									<th className='p-3'>Date</th>
									<th className='p-3'>Amount</th>
									<th className='p-3'>Note</th>
								</tr>
							</thead>
							<tbody>
								{data.expenses.map((expense, index) => (
									<tr key={index} className='border-t'>
										<td className='p-3'>
											{dayjs(expense.date).format('DD MMM YYYY')}
										</td>
										<td className='p-3 text-red-700 font-medium'>
											Tk {expense.amount}
										</td>
										<td className='p-3'>{expense.note || '-'}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}
