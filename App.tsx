// Fix: Populated App.tsx with the main app component and screen router.
import React, { useState, useEffect, useContext } from 'react';
import { AppProvider, AppContext } from './context/AppContext.js';
import { Screen } from './types.js';

import SplashScreen from './components/SplashScreen.js';
import AuthScreen from './components/AuthScreen.js';
import HomeScreen from './components/HomeScreen.js';
import PartyManagementScreen from './components/PartyManagementScreen.js';
import PartyDetailScreen from './components/PartyDetailScreen.js';
import DayBookScreen from './components/DayBookScreen.js';
import StockBookScreen from './components/StockBookScreen.js';
import ItemListScreen from './components/ItemListScreen.js';
import ItemFormScreen from './components/ItemFormScreen.js';
import ItemDetailScreen from './components/ItemDetailScreen.js';
import StockTransactionFormScreen from './components/StockTransactionFormScreen.js';
import InvoicesScreen from './components/InvoicesScreen.js';
import InvoiceDetailScreen from './components/InvoiceDetailScreen.js';
import EditProfileScreen from './components/EditProfileScreen.js';
import AboutUsScreen from './components/AboutUsScreen.js';
import ContactUsScreen from './components/ContactUsScreen.js';
import PrivacyPolicyScreen from './components/PrivacyPolicyScreen.js';
import ReportsScreen from './components/ReportsScreen.js';
import PartyReportScreen from './components/PartyReportScreen.js';
import StockReportScreen from './components/StockReportScreen.js';

const AppContent: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { currentScreen, screenPayload, user } = state;
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        // Splash screen logic
        const splashShown = sessionStorage.getItem('splashShown');
        if (splashShown) {
            setShowSplash(false);
        }

    }, [dispatch]);

    const handleSplashDismiss = () => {
        sessionStorage.setItem('splashShown', 'true');
        setShowSplash(false);
    };
    
    if (showSplash) {
        return <SplashScreen onDismiss={handleSplashDismiss} />;
    }

    if (!user) {
        // If there's registration data in payload, show Privacy Policy screen
        if (currentScreen === Screen.PrivacyPolicy && screenPayload?.name && screenPayload?.email) {
            return <PrivacyPolicyScreen />;
        }
        return <AuthScreen />;
    }

    const screenToRender = (() => {
        switch (currentScreen) {
            case Screen.Home:
                return <HomeScreen />;
            case Screen.Customers:
                return <PartyManagementScreen partyType="Customer" />;
            case Screen.Suppliers:
                return <PartyManagementScreen partyType="Supplier" />;
            case Screen.PartyDetail:
                return <PartyDetailScreen partyId={screenPayload.partyId} />;
            case Screen.DayBook:
                return <DayBookScreen />;
            case Screen.StockBook:
                return <StockBookScreen />;
            case Screen.AllItems:
                return <ItemListScreen filter="all" />;
            case Screen.LowStockItems:
                return <ItemListScreen filter="low" />;
            case Screen.AddItem:
                return <ItemFormScreen />;
            case Screen.EditItem:
                return <ItemFormScreen itemId={screenPayload.itemId} />;
            case Screen.ItemDetail:
                return <ItemDetailScreen itemId={screenPayload.itemId} />;
            case Screen.StockTransaction:
                return <StockTransactionFormScreen itemId={screenPayload.itemId} transactionType={screenPayload.transactionType} transactionId={screenPayload.transactionId} />;
            case Screen.Invoices:
                return <InvoicesScreen />;
            case Screen.InvoiceDetail:
                return <InvoiceDetailScreen billNumber={screenPayload.billNumber} />;
            case Screen.EditProfile:
                return <EditProfileScreen />;
            case Screen.AboutUs:
                return <AboutUsScreen />;
            case Screen.ContactUs:
                return <ContactUsScreen />;
            case Screen.PrivacyPolicy:
                return <PrivacyPolicyScreen />;
            case Screen.PartyReport:
                return <PartyReportScreen partyId={screenPayload.partyId} />;
            case Screen.Reports:
                return <ReportsScreen />;
            case Screen.StockInReport:
                return <StockReportScreen reportType="Buy" />;
            case Screen.StockOutReport:
                return <StockReportScreen reportType="Sell" />;
            default:
                return <HomeScreen />;
        }
    })();
    
    return (
        <>
            {screenToRender}
        </>
    );
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App;