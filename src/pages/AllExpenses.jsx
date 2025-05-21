/** @format */

// AllExpenses.jsx
import React, { useState, useEffect } from 'react';
import {
	collection,
	addDoc,
	getDocs,
	query,
	where,
	deleteDoc,
	doc,
	updateDoc,
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import CreatableSelect from 'react-select/creatable';
import { CalendarDays } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AllExpenses() {
	const [businessOptions, setBusinessOptions] = useState([]);
	const [selectedBusiness, setSelectedBusiness] = useState(null);
	const [amount, setAmount] = useState('');
	const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
	const [note, setNote] = useState('');
	const [expenses, setExpenses] = useState([]);

	// Filters
	const [filterBusiness, setFilterBusiness] = useState(null);
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	// Edit state
	const [editId, setEditId] = useState(null);
	const [editBusiness, setEditBusiness] = useState(null);
	const [editAmount, setEditAmount] = useState('');
	const [editDate, setEditDate] = useState('');
	const [editNote, setEditNote] = useState('');

	// Loading states
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		fetchBusinesses();
		fetchExpenses();
	}, []);

	const fetchBusinesses = async () => {
		setLoading(true);
		try {
			const snapshot = await getDocs(collection(db, 'businesses'));
			const options = snapshot.docs.map((doc) => ({
				label: doc.data().name,
				value: doc.data().name,
			}));
			setBusinessOptions(options);
		} catch (error) {
			toast.error('Failed to load businesses');
		} finally {
			setLoading(false);
		}
	};

	const fetchExpenses = async () => {
		setLoading(true);
		try {
			const snapshot = await getDocs(collection(db, 'expenses'));
			const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
			setExpenses(list);
		} catch (error) {
			toast.error('Failed to load expenses');
		} finally {
			setLoading(false);
		}
	};

	const createBusinessIfNotExist = async (businessName) => {
		const q = query(
			collection(db, 'businesses'),
			where('name', '==', businessName)
		);
		const snapshot = await getDocs(q);
		if (snapshot.empty) {
			await addDoc(collection(db, 'businesses'), { name: businessName });
			await fetchBusinesses();
		}
	};

	const handleAddExpense = async () => {
		if (!selectedBusiness || !amount || !date) {
			toast.error('Please fill all required fields.');
			return;
		}
		setSubmitting(true);
		try {
			const businessName = selectedBusiness.value.trim();
			await createBusinessIfNotExist(businessName);

			await addDoc(collection(db, 'expenses'), {
				business: businessName,
				amount: parseFloat(amount),
				date,
				note: note.trim(),
			});

			setAmount('');
			setNote('');
			setSelectedBusiness(null);
			setDate(new Date().toISOString().slice(0, 10));
			await fetchExpenses();
			toast.success('Expense added!');
		} catch (error) {
			toast.error('Failed to add expense.');
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async (id) => {
		const DeleteConfirmation = () => (
			<div className='flex flex-col gap-2'>
				<span>Are you sure you want to delete this expense?</span>
				<div className='flex justify-end gap-2'>
					<button
						onClick={async () => {
							setSubmitting(true);
							await deleteDoc(doc(db, 'expenses', id));
							await fetchExpenses();
							toast.dismiss(deleteToastId);
							toast.success('Expense deleted!');
							setSubmitting(false);
						}}
						className='bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700'>
						Confirm
					</button>
					<button
						onClick={() => toast.dismiss(deleteToastId)}
						className='bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500'>
						Cancel
					</button>
				</div>
			</div>
		);
		const deleteToastId = toast.info(<DeleteConfirmation />, {
			position: 'bottom-right',
			closeOnClick: false,
			closeButton: false,
			autoClose: false,
			draggable: false,
		});
	};

	const startEdit = (expense) => {
		setEditId(expense.id);
		setEditBusiness({ label: expense.business, value: expense.business });
		setEditAmount(expense.amount.toString());
		setEditDate(expense.date);
		setEditNote(expense.note || '');
	};

	const cancelEdit = () => {
		setEditId(null);
		setEditBusiness(null);
		setEditAmount('');
		setEditDate('');
		setEditNote('');
	};

	const saveEdit = async () => {
		if (!editBusiness || !editAmount || !editDate) {
			toast.error('Please fill all required fields.');
			return;
		}
		setSubmitting(true);
		try {
			const businessName = editBusiness.value.trim();
			await createBusinessIfNotExist(businessName);

			const expenseRef = doc(db, 'expenses', editId);
			await updateDoc(expenseRef, {
				business: businessName,
				amount: parseFloat(editAmount),
				date: editDate,
				note: editNote.trim(),
			});

			cancelEdit();
			await fetchExpenses();
			toast.success('Expense updated!');
		} catch (error) {
			toast.error('Failed to update expense.');
		} finally {
			setSubmitting(false);
		}
	};

	const filteredExpenses = expenses.filter((expense) => {
		const matchBusiness = filterBusiness
			? expense.business === filterBusiness.value
			: true;
		const matchStart = startDate ? expense.date >= startDate : true;
		const matchEnd = endDate ? expense.date <= endDate : true;
		return matchBusiness && matchStart && matchEnd;
	});

	return (
		<div className='max-w-5xl mx-auto p-3 sm:p-6'>
			{/* Add Expense Form */}
			<div className='bg-white p-6 rounded-lg shadow-md mb-10'>
				<h3 className='text-2xl font-bold mb-4'>Add Expense</h3>

				<div className='grid sm:grid-cols-3 gap-4 mb-4'>
					<CreatableSelect
						isClearable
						options={businessOptions}
						onChange={setSelectedBusiness}
						value={selectedBusiness}
						placeholder='Business'
					/>
					<input
						type='number'
						placeholder='Amount'
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						className='border p-2 rounded w-full'
					/>
					<input
						type='date'
						value={date}
						onChange={(e) => setDate(e.target.value)}
						className='border p-2 rounded w-full'
					/>
				</div>

				<input
					type='text'
					placeholder='Note (optional)'
					value={note}
					onChange={(e) => setNote(e.target.value)}
					className='border p-2 rounded w-full mb-4'
				/>

				<button
					onClick={handleAddExpense}
					disabled={submitting}
					className='bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition'>
					{submitting ? 'Saving...' : 'Add Expense'}
				</button>
			</div>

			{/* Filter Expenses */}
			<div className='bg-gray-50 p-6 rounded-xl shadow-md mb-4'>
				<h4 className='text-xl font-semibold mb-4 text-gray-800'>
					Filter Expenses
				</h4>

				<div className='grid sm:grid-cols-1 md:grid-cols-3 gap-6'>
					{/* Business Filter */}
					<div className='flex flex-col'>
						<label className='text-sm font-medium text-gray-700 mb-1'>
							Business
						</label>
						<CreatableSelect
							isClearable
							options={businessOptions}
							onChange={setFilterBusiness}
							value={filterBusiness}
							placeholder='Select or create business'
							className='text-sm'
						/>
					</div>

					{/* Start Date */}
					<div className='flex flex-col'>
						<label className='text-sm font-medium text-gray-700 mb-1'>
							Start Date
						</label>
						<div className='relative'>
							<CalendarDays className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
							<input
								type='date'
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								className='pl-10 pr-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500'
							/>
						</div>
					</div>

					{/* End Date */}
					<div className='flex flex-col'>
						<label className='text-sm font-medium text-gray-700 mb-1'>
							End Date
						</label>
						<div className='relative'>
							<CalendarDays className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
							<input
								type='date'
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								className='pl-10 pr-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500'
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Expenses Table */}
			<div className='bg-white p-4 rounded-lg shadow-md overflow-x-auto'>
				<h4 className='text-lg font-semibold mb-4'>Expenses List</h4>
				{loading ? (
					<div className='flex justify-center items-center py-10'>
						<div className='w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
						<span className='ml-2 text-blue-600'>Loading...</span>
					</div>
				) : (
					<table className='min-w-full text-sm'>
						<thead>
							<tr className='bg-gray-100 text-left text-gray-600'>
								<th className='p-2'>Business</th>
								<th className='p-2 text-center'>
									Amount <small>Tk</small>
								</th>
								<th className='p-2 text-center'>Date</th>
								<th className='p-2 text-left'>Note</th>
								<th className='p-2 text-center hidden md:table-cell'>
									Actions
								</th>
							</tr>
						</thead>
						<tbody>
							{filteredExpenses.length === 0 ? (
								<tr>
									<td colSpan='5' className='text-center py-6 text-gray-500'>
										No expenses found.
									</td>
								</tr>
							) : (
								filteredExpenses
									.sort((a, b) => b.date.localeCompare(a.date))
									.map((expense) => (
										<tr key={expense.id} className='border-b hover:bg-gray-100'>
											<td className='p-2'>
												{editId === expense.id ? (
													<CreatableSelect
														options={businessOptions}
														value={editBusiness}
														onChange={setEditBusiness}
														isClearable
														menuPortalTarget={document.body}
														styles={{
															menuPortal: (base) => ({ ...base, zIndex: 9999 }),
														}}
													/>
												) : (
													expense.business
												)}
											</td>
											<td className='p-2 text-center'>
												{editId === expense.id ? (
													<input
														type='number'
														value={editAmount}
														onChange={(e) => setEditAmount(e.target.value)}
														className='border p-1 rounded w-full text-right'
													/>
												) : (
													`${expense.amount.toFixed(0)}`
												)}
											</td>
											<td className='p-2 text-center'>
												{editId === expense.id ? (
													<input
														type='date'
														value={editDate}
														onChange={(e) => setEditDate(e.target.value)}
														className='border p-1 rounded w-full'
													/>
												) : (
													expense.date
												)}
											</td>
											<td className='p-2 text-left'>
												{editId === expense.id ? (
													<input
														type='text'
														value={editNote}
														onChange={(e) => setEditNote(e.target.value)}
														className='border p-1 rounded w-full'
													/>
												) : (
													expense.note || '-'
												)}
											</td>
											<td className='p-2 text-center space-x-2 hidden md:table-cell'>
												{editId === expense.id ? (
													<>
														<button
															onClick={saveEdit}
															className='bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700'>
															Save
														</button>
														<button
															onClick={cancelEdit}
															className='bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500'>
															Cancel
														</button>
													</>
												) : (
													<>
														<button
															onClick={() => startEdit(expense)}
															className='bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500'>
															Edit
														</button>
														<button
															onClick={() => handleDelete(expense.id)}
															className='bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700'>
															Delete
														</button>
													</>
												)}
											</td>
										</tr>
									))
							)}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
