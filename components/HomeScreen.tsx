// Fix: Populated HomeScreen.tsx with a dashboard component.
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext.js';
import { Screen } from '../types.js';
import Header from './common/Header.js';
import Footer from './common/Footer.js';
import { UsersIcon, TruckIcon, BookOpenIcon, ArchiveIcon, DocumentTextIcon, ChartBarIcon } from './Icons.js';

const HomeScreen: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { user } = state;

    const navigateTo = (screen: Screen) => {
        dispatch({ type: 'NAVIGATE', payload: { screen } });
    };

    const menuItems = [
        { screen: Screen.Customers, label: 'Customers', icon: UsersIcon, color: 'text-sky-500' },
        { screen: Screen.Suppliers, label: 'Suppliers', icon: TruckIcon, color: 'text-amber-500' },
        { screen: Screen.DayBook, label: 'Day Book', icon: BookOpenIcon, color: 'text-emerald-500' },
        { screen: Screen.StockBook, label: 'Stock Book', icon: ArchiveIcon, color: 'text-rose-500' },
        { screen: Screen.Invoices, label: 'Invoices', icon: DocumentTextIcon, color: 'text-indigo-500' },
        { screen: Screen.Reports, label: 'Reports', icon: ChartBarIcon, color: 'text-slate-500' },
    ];

    return (
        <div className="flex flex-col h-full bg-slate-100">
            <Header title="Mayra Khata" />
            <main id="home-screen-content" className="flex-grow p-4 overflow-y-auto pb-44">
                <div className="bg-white p-3 rounded-lg shadow-sm mb-3">
                    <h1 className="text-base font-bold text-slate-800">Welcome, {user?.name || 'User'}!</h1>
                    <p className="text-xs text-slate-500">Here's your business dashboard.</p>
                </div>
                
                <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="grid grid-cols-2 gap-4">
                        {menuItems.map(item => (
                            <button
                                key={item.label}
                                onClick={() => navigateTo(item.screen)}
                                className="bg-slate-50 p-4 rounded-lg shadow-sm text-center flex flex-col items-center justify-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition-transform duration-200"
                            >
                                <item.icon className={`h-8 w-8 ${item.color}`} />
                                <span className="font-medium text-slate-600 text-xs">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </main>
            <Footer currentScreen={Screen.Home} />
        </div>
    );
};

export default HomeScreen;