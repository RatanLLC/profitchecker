/** @format */

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

export default function AllCredits() {
	const [businessOptions, setBusinessOptions] = useState([]);
	const [selectedBusiness, setSelectedBusiness] = useState(null);
	const [amount, setAmount] = useState('');
	const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
	const [note, setNote] = useState('');
	const [credits, setCredits] = useState([]);

	const [filterBusiness, setFilterBusiness] = useState(null);
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	const [editId, setEditId] = useState(null);
	const [editBusiness, setEditBusiness] = useState(null);
	const [editAmount, setEditAmount] = useState('');
	const [editDate, setEditDate] = useState('');
	const [editNote, setEditNote] = useState('');

	const [loadingCredits, setLoadingCredits] = useState(false);
	const [loadingBusinesses, setLoadingBusinesses] = useState(false);

	useEffect(() => {
		fetchBusinesses();
		fetchCredits();
	}, []);

	const fetchBusinesses = async () => {
		setLoadingBusinesses(true);
		try {
			await toast.promise(
				(async () => {
					const snapshot = await getDocs(collection(db, 'businesses'));
					const options = snapshot.docs.map((doc) => ({
						label: doc.data().name,
						value: doc.data().name,
					}));
					setBusinessOptions(options);
				})(),
				{
					// pending: 'Loading businesses...',
					// success: 'Businesses loaded!',
					error: 'Failed to load businesses',
				}
			);
		} catch (error) {
			console.error('Error fetching businesses:', error);
		} finally {
			setLoadingBusinesses(false);
		}
	};

	const fetchCredits = async () => {
		setLoadingCredits(true);
		try {
			await toast.promise(
				(async () => {
					const snapshot = await getDocs(collection(db, 'credits'));
					const list = snapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
					}));
					setCredits(list);
				})(),
				{
					// pending: 'Loading credits...',
					// success: 'Credits loaded!',
					error: 'Failed to load credits',
				}
			);
		} catch (error) {
			console.error('Error fetching credits:', error);
		} finally {
			setLoadingCredits(false);
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

	const handleAddCredit = async () => {
		if (!selectedBusiness || !amount || !date) {
			toast.error('Please fill all required fields.');
			return;
		}
		const businessName = selectedBusiness.value.trim();
		await createBusinessIfNotExist(businessName);

		await addDoc(collection(db, 'credits'), {
			business: businessName,
			amount: parseFloat(amount),
			date,
			note: note.trim(),
		});

		setAmount('');
		setNote('');
		setSelectedBusiness(null);
		setDate(new Date().toISOString().slice(0, 10));
		await fetchCredits();
		toast.success('Credit added successfully!');
	};

	const handleDelete = async (id) => {
		const DeleteConfirmation = () => (
			<div className='flex flex-col gap-2'>
				<span>Are you sure you want to delete this credit?</span>
				<div className='flex justify-end gap-2'>
					<button
						onClick={async () => {
							await deleteDoc(doc(db, 'credits', id));
							await fetchCredits();
							toast.dismiss(deleteToastId);
							toast.success('Credit deleted!');
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

	const startEdit = (credit) => {
		setEditId(credit.id);
		setEditBusiness({ label: credit.business, value: credit.business });
		setEditAmount(credit.amount.toString());
		setEditDate(credit.date);
		setEditNote(credit.note || '');
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
		const businessName = editBusiness.value.trim();
		await createBusinessIfNotExist(businessName);

		const creditRef = doc(db, 'credits', editId);
		await updateDoc(creditRef, {
			business: businessName,
			amount: parseFloat(editAmount),
			date: editDate,
			note: editNote.trim(),
		});

		cancelEdit();
		await fetchCredits();
		toast.success('Credit updated successfully!');
	};

	const filteredCredits = credits.filter((credit) => {
		const matchBusiness = filterBusiness
			? credit.business === filterBusiness.value
			: true;
		const matchStart = startDate ? credit.date >= startDate : true;
		const matchEnd = endDate ? credit.date <= endDate : true;
		return matchBusiness && matchStart && matchEnd;
	});

	return (
		<div className='max-w-5xl mx-auto p-3 sm:p-6'>
			{/* Add Credit */}
			<div className='bg-white p-6 rounded-lg shadow-md mb-10'>
				<h2 className='text-2xl font-bold mb-4'>Add Credit</h2>
				<div className='grid sm:grid-cols-3 gap-4 mb-4'>
					<CreatableSelect
						isClearable
						options={businessOptions}
						onChange={setSelectedBusiness}
						value={selectedBusiness}
						placeholder='Business'
						className='text-sm'
						menuPortalTarget={document.body}
						styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
						isDisabled={loadingBusinesses}
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
					onClick={handleAddCredit}
					className='bg-green-600 text-white py-2 px-6 rounded hover:bg-green-700'>
					Add Credit
				</button>
			</div>

			{/* Filter Section */}
			<div className='bg-white p-6 rounded-xl shadow-md mb-4'>
				<h3 className='text-xl font-bold mb-4 text-gray-800'>Filter Credits</h3>
				<div className='grid md:grid-cols-3 gap-6'>
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
							menuPortalTarget={document.body}
							styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
							isDisabled={loadingBusinesses}
						/>
					</div>
					<div className='flex flex-col'>
						<label className='text-sm font-medium text-gray-700 mb-1'>Start Date</label>
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
					<div className='flex flex-col'>
						<label className='text-sm font-medium text-gray-700 mb-1'>End Date</label>
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

			{/* Credit Table */}
			<div className='bg-white p-4 rounded-lg shadow-md overflow-x-auto'>
				<h4 className='text-lg font-semibold mb-4'>Credits List</h4>

				{loadingCredits ? (
					<div className='flex justify-center items-center py-10'>
						<div className='w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
						<span className='ml-2 text-blue-600'>Loading...</span>
					</div>
				) : (
					<table className='min-w-full text-sm'>
						<thead className='bg-gray-100 text-left'>
							<tr>
								<th className='p-3 border-b'>Business</th>
								<th className='p-3 border-b text-center'>Amount <small>Tk</small></th>
								<th className='p-3 border-b text-center'>Date</th>
								<th className='p-3 border-b text-left'>Note</th>
								<th className='p-3 border-b text-center hidden md:table-cell'>Actions</th>
							</tr>
						</thead>
						<tbody>
							{filteredCredits.length === 0 ? (
								<tr>
									<td colSpan={5} className='text-center p-4 text-gray-500'>
										No credits found.
									</td>
								</tr>
							) : (
								filteredCredits
									.sort((a, b) => b.date.localeCompare(a.date))
									.map((credit) => (
										<tr key={credit.id} className='hover:bg-gray-100'>
											<td className='p-3'>
												{editId === credit.id ? (
													<CreatableSelect
														options={businessOptions}
														onChange={setEditBusiness}
														value={editBusiness}
														isClearable
														className='text-sm'
														menuPortalTarget={document.body}
														styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
													/>
												) : (
													credit.business
												)}
											</td>
											<td className='p-3 text-center'>
												{editId === credit.id ? (
													<input
														type='number'
														value={editAmount}
														onChange={(e) => setEditAmount(e.target.value)}
														className='border p-1 rounded w-full text-right'
													/>
												) : (
													`${credit.amount.toFixed(0)}`
												)}
											</td>
											<td className='p-3 text-center'>
												{editId === credit.id ? (
													<input
														type='date'
														value={editDate}
														onChange={(e) => setEditDate(e.target.value)}
														className='border p-1 rounded w-full'
													/>
												) : (
													credit.date
												)}
											</td>
											<td className='p-3 text-left'>
												{editId === credit.id ? (
													<input
														type='text'
														value={editNote}
														onChange={(e) => setEditNote(e.target.value)}
														className='border p-1 rounded w-full'
													/>
												) : (
													credit.note || '-'
												)}
											</td>
											<td className='p-3 text-center space-x-2 hidden md:table-cell'>
												{editId === credit.id ? (
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
															onClick={() => startEdit(credit)}
															className='bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500'>
															Edit
														</button>
														<button
															onClick={() => handleDelete(credit.id)}
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
