/** @format */

// File: src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';

export default function Dashboard() {
	const [summary, setSummary] = useState({});
	const [isLoading, setIsLoading] = useState(true); // 👈 Loading state

	useEffect(() => {
		const fetchData = async () => {
			const expSnapshot = await getDocs(collection(db, 'expenses'));
			const creditSnapshot = await getDocs(collection(db, 'credits'));

			const expenseData = expSnapshot.docs.map((doc) => doc.data());
			const creditData = creditSnapshot.docs.map((doc) => doc.data());

			const businesses = new Set([
				...expenseData.map((e) => e.business),
				...creditData.map((c) => c.business),
			]);

			const result = {};
			const overallChartMap = {};

			businesses.forEach((name) => {
				const businessExpenses = expenseData.filter((e) => e.business === name);
				const businessCredits = creditData.filter((c) => c.business === name);

				const chartMap = {};

				businessExpenses.forEach((e) => {
					const month = dayjs(e.date).format('MMM YYYY');
					chartMap[month] = chartMap[month] || {
						month,
						rent: 0,
						renovation: 0,
					};
					chartMap[month].renovation += e.amount;

					overallChartMap[month] = overallChartMap[month] || {
						month,
						rent: 0,
						renovation: 0,
					};
					overallChartMap[month].renovation += e.amount;
				});

				businessCredits.forEach((c) => {
					const month = dayjs(c.date).format('MMM YYYY');
					chartMap[month] = chartMap[month] || {
						month,
						rent: 0,
						renovation: 0,
					};
					chartMap[month].rent += c.amount;

					overallChartMap[month] = overallChartMap[month] || {
						month,
						rent: 0,
						renovation: 0,
					};
					overallChartMap[month].rent += c.amount;
				});

				const chart = Object.values(chartMap).sort(
					(a, b) => new Date(a.month) - new Date(b.month)
				);
				const totalExp = businessExpenses.reduce((sum, e) => sum + e.amount, 0);
				const totalCred = businessCredits.reduce((sum, c) => sum + c.amount, 0);

				result[name] = {
					expense: totalExp,
					credit: totalCred,
					profit: totalCred - totalExp,
					chart,
				};
			});

			const totalExpense = expenseData.reduce((sum, e) => sum + e.amount, 0);
			const totalCredit = creditData.reduce((sum, c) => sum + c.amount, 0);

			const overallChart = Object.values(overallChartMap).sort(
				(a, b) => new Date(a.month) - new Date(b.month)
			);

			setSummary({
				businesses: result,
				overall: {
					expense: totalExpense,
					credit: totalCredit,
					profit: totalCredit - totalExpense,
					chart: overallChart,
				},
			});
			setIsLoading(false); // 👈 Stop loading after data fetch
		};

		fetchData();
	}, []);

	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-screen'>
				<div className='animate-spin rounded-full h-20 w-20 border-4 border-blue-500 border-t-transparent'></div>
			</div>
		);
	}
	return (
		<div className='max-w-7xl mx-auto p-3 sm:p-6 py-10 space-y-16'>
			<h1 className='text-2xl font-bold tracking-tight text-gray-800'>
				📊 Dashboard Overview
			</h1>
			{/* Modern Business Summary Table */}
			<section className='space-y-6'>
				<h2 className='text-3xl font-bold text-gray-800'>Business Summary</h2>
				<div className='overflow-x-auto rounded-2xl border border-gray-200 shadow-sm'>
					<table className='min-w-full text-sm text-gray-700'>
						<thead className='bg-gray-50'>
							<tr>
								<th className='px-6 py-4 text-left font-semibold hidden md:table-cell'>
									Rank
								</th>
								<th className='px-6 py-4 text-left font-semibold'>
									Business Name
								</th>
								<th className='px-6 py-4  text-center font-semibold hidden md:table-cell'>
									Expenses (Tk)
								</th>
								<th className='px-6 py-4  text-center font-semibold hidden md:table-cell'>
									Credit (Tk)
								</th>
								<th className='px-6 py-4  text-center font-semibold'>
									Profit (Tk)
								</th>
								<th className='px-6 py-4  text-center font-semibold'>
									Profit Margin (%)
								</th>
							</tr>
						</thead>
						<tbody className='divide-y divide-gray-100'>
							{summary.businesses &&
								Object.entries(summary.businesses)
									.map(([name, data]) => {
										const profitMargin =
											data.credit > 0
												? ((data.profit / data.credit) * 100).toFixed(2)
												: '0.00';
										return { name, ...data, profitMargin };
									})
									.sort((a, b) => b.profitMargin - a.profitMargin)
									.map((data, index) => (
										<tr
											key={data.name}
											className='odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition'>
											<td className='px-6 py-4 font-medium hidden md:table-cell'>
												{index + 1}
											</td>
											<td className='px-6 py-4 font-semibold text-gray-800'>
												{data.name}
											</td>
											<td className='px-6 py-4 text-center hidden md:table-cell'>
												{data.expense}
											</td>
											<td className='px-6 py-4 text-center hidden md:table-cell'>
												{data.credit}
											</td>
											<td className='px-6 py-4 text-center'>{data.profit}</td>
											<td className='px-6 py-4 text-center text-green-600 font-bold'>
												{data.profitMargin}%
											</td>
										</tr>
									))}
						</tbody>
					</table>
				</div>
			</section>

			{/* Overall Summary */}
			<section className='space-y-2'>
				<h2 className='text-2xl font-semibold text-gray-700'>
					Overall Summary
				</h2>
				<ResponsiveContainer width='100%' height={300}>
					<LineChart data={summary.overall?.chart || []}>
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
				<div className='grid grid-cols-3 gap-1'>
					<div className='bg-gradient-to-r from-red-100 to-red-200 text-red-900 p-5 rounded-lg text-center shadow'>
						<div className='text-sm font-medium'>Total Expenses</div>
						<div className='text-2xl font-bold'>
							<small>Tk</small> {summary.overall?.expense || 0}
						</div>
					</div>
					<div className='bg-gradient-to-r from-green-100 to-green-200 text-green-900 p-5 rounded-lg text-center shadow'>
						<div className='text-sm font-medium'>Total Credits</div>
						<div className='text-2xl font-bold'>
							<small>Tk</small> {summary.overall?.credit || 0}
						</div>
					</div>
					<div
						className={`p-5 rounded-lg text-center shadow ${
							summary.overall?.profit >= 0
								? 'bg-blue-100 text-blue-800'
								: 'bg-red-200 text-red-900'
						}`}>
						<div className='text-sm font-medium'>Total Profit</div>
						<div className='text-2xl font-bold'>
							<small>Tk</small> {summary.overall?.profit || 0}
						</div>
					</div>
				</div>
			</section>

			{/* Business Performance */}
			<section className='space-y-10'>
				<h2 className='text-2xl font-semibold  text-gray-700'>
					Business Performance
				</h2>
				{summary.businesses &&
					Object.entries(summary.businesses).map(([name, data]) => (
						<div
							key={name}
							className='bg-white p-6 rounded-2xl shadow-md space-y-6 border border-gray-100'>
							<h3 className='text-xl text-center font-semibold text-gray-800'>
								{name}
							</h3>
							<ResponsiveContainer width='100%' height={250}>
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

							<div className='grid grid-cols-3  gap-1'>
								<div className='bg-gradient-to-r from-red-100 to-red-200 text-red-900 p-4 rounded-lg text-center shadow-sm'>
									<div className='text-sm font-medium'>Expenses</div>
									<div className='text-2xl font-bold'>
										<small>Tk</small> {data.expense}{' '}
									</div>
								</div>
								<div className='bg-gradient-to-r from-green-100 to-green-200 text-green-900 p-4 rounded-lg text-center shadow-sm'>
									<div className='text-sm font-medium'>Credits</div>
									<div className='text-2xl font-bold'>
										<small>Tk</small> {data.credit}
									</div>
								</div>
								<div
									className={`p-4 rounded-lg text-center shadow-sm ${
										data.profit >= 0
											? 'bg-blue-100 text-blue-800'
											: 'bg-red-200 text-red-900'
									}`}>
									<div className='text-sm font-medium'>Profit</div>
									<div className='text-2xl font-bold'>
										<small>Tk</small> {data.profit}
									</div>
								</div>
							</div>
						</div>
					))}
			</section>
		</div>
	);
}
