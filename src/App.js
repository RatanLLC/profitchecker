/** @format */

// File: src/App.jsx
import {
	BrowserRouter as Router,
	Routes,
	Route,
	NavLink,
} from 'react-router-dom';
import AllExpenses from './pages/AllExpenses';
import AllCredits from './pages/AllCredits';
import Dashboard from './pages/Dashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import BusinessDetails from './pages/BusinessDetails';

function Navbar() {
	const linkClasses = ({ isActive }) =>
		isActive
			? 'text-blue-600 font-semibold border-b-2 border-blue-600 px-3 py-2'
			: 'text-gray-600 hover:text-blue-600 px-3 py-2';

	// grid grid-cols-1 sm:grid-cols-3 gap-4

	return (
		<nav className='sticky top-0 z-50 bg-white shadow-md'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='flex flex-col items-center justify-center h-auto py-4 space-y-0 sm:space-y-0 sm:flex-row sm:justify-between sm:h-16 sm:py-0'>
					{/* Logo */}
					<div className='text-x font-bold text-blue-600'>
						<NavLink to='/'>RATAN LLC</NavLink>
					</div>

					{/* Menu */}
					<div className='flex flex-wrap justify-center space-x-6'>
						<NavLink to='/dashboard' className={linkClasses}>
							Dashboard
						</NavLink>
						<NavLink to='/all-expenses' className={linkClasses}>
							Expenses
						</NavLink>
						<NavLink to='/all-credits' className={linkClasses}>
							Credits
						</NavLink>
					</div>
				</div>
			</div>
		</nav>
	);
}
export default function App() {
	return (
		<Router>
			<Navbar />
			<div className='py-4 sm:px-6 lg:px-8 bg-sky-50 min-h-screen'>
				<ToastContainer position='top-right' autoClose={3000} />
				<Routes>
					<Route path='/' element={<Dashboard />} />
					<Route path='/dashboard' element={<Dashboard />} />
					<Route path='/all-expenses' element={<AllExpenses />} />
					<Route path='/all-credits' element={<AllCredits />} />
					<Route path='/:businessName' element={<BusinessDetails />} />
				</Routes>
			</div>
		</Router>
	);
}
