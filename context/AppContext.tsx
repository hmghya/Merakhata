import React, { createContext, useReducer, useEffect, ReactNode } from 'react';
import { Screen, Party, PartyType, DayBookEntry, StockItem, StockTransaction, StockTransactionType, Batch, User, Notification } from '../types.js';

export interface AppState {
  currentScreen: Screen;
  screenPayload: any;
  user: User | null;
  parties: Party[];
  dayBookEntries: DayBookEntry[];
  stockItems: StockItem[];
  stockTransactions: StockTransaction[];
  itemCategories: string[];
  notifications: Notification[];
}

type Action =
  | { type: 'NAVIGATE'; payload: { screen: Screen; payload?: any } }
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER_PROFILE'; payload: User }
  | { type: 'ADD_PARTY'; payload: Party }
  | { type: 'EDIT_PARTY'; payload: Party }
  | { type: 'DELETE_PARTY'; payload: string }
  | { type: 'ADD_DAYBOOK_ENTRY'; payload: DayBookEntry }
  | { type: 'EDIT_DAYBOOK_ENTRY'; payload: DayBookEntry }
  | { type: 'DELETE_DAYBOOK_ENTRY'; payload: string }
  | { type: 'ADD_STOCK_ITEM'; payload: StockItem }
  | { type: 'EDIT_STOCK_ITEM'; payload: StockItem }
  | { type: 'DELETE_STOCK_ITEM'; payload: string }
  | { type: 'ADD_STOCK_TRANSACTION'; payload: StockTransaction }
  | { type: 'EDIT_STOCK_TRANSACTION'; payload: StockTransaction }
  | { type: 'DELETE_STOCK_TRANSACTION'; payload: string }
  | { type: 'ADD_ITEM_CATEGORY'; payload: string }
  | { type: 'RESTORE_STATE'; payload: Partial<AppState> }
  | { type: 'ADD_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'MARK_NOTIFICATION_READ'; payload: { id: string } }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'CLEAR_READ_NOTIFICATIONS' }
  | { type: 'SAVE_ITEM_BILL'; payload: { stockTransactions: StockTransaction[]; dayBookEntries: DayBookEntry[] } };

const initialState: AppState = {
  currentScreen: Screen.Home,
  screenPayload: null,
  user: null,
  parties: [],
  dayBookEntries: [],
  stockItems: [],
  stockTransactions: [],
  itemCategories: ['General', 'Groceries', 'Electronics', 'Clothing', 'Stationery'],
  notifications: [],
};

// --- New Storage Keys for Multi-User Support ---
const MULTI_USER_DATA_KEY = 'mayraKhataMultiUserData';
const CURRENT_USER_EMAIL_KEY = 'mayraKhataCurrentUserEmail';

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, currentScreen: action.payload.screen, screenPayload: action.payload.payload || null };
    
    case 'LOGIN': {
        const allUsersData = JSON.parse(localStorage.getItem(MULTI_USER_DATA_KEY) || '{}');
        const userEmail = action.payload.email;
        let userState = allUsersData[userEmail];

        if (!userState) { // New user registration
            userState = {
                ...initialState, // A fresh slate
                user: { // With the new user's details
                    name: action.payload.name,
                    email: action.payload.email,
                    photoUrl: action.payload.photoUrl || undefined,
                    address: action.payload.address || '',
                    phone: action.payload.phone || '',
                    alternatePhone: action.payload.alternatePhone || '',
                    cnic: action.payload.cnic || '',
                    businessName: action.payload.businessName || '',
                }
            };
        }
        
        localStorage.setItem(CURRENT_USER_EMAIL_KEY, userEmail);
        
        // Return the state for this user (either existing or new)
        return {
            ...userState,
            currentScreen: Screen.Home,
            screenPayload: null,
        };
    }

    case 'LOGOUT':
        localStorage.removeItem(CURRENT_USER_EMAIL_KEY);
        // Reset to the base initial state, clearing all data from the reducer's memory.
        // The user's data remains safe in the multi-user storage object.
        return {
            ...initialState,
            user: null,
            currentScreen: Screen.Home,
            screenPayload: null,
        };

    case 'UPDATE_USER_PROFILE':
        if (!state.user) return state; // Should not happen if called correctly
        return { ...state, user: { ...state.user, ...action.payload } };

    case 'ADD_PARTY':
      return { ...state, parties: [...state.parties, action.payload] };

    case 'EDIT_PARTY':
      return {
        ...state,
        parties: state.parties.map((p) => (p.id === action.payload.id ? action.payload : p)),
      };
    
    case 'DELETE_PARTY': {
        const partyId = action.payload;
        // Also remove related entries
        return {
            ...state,
            parties: state.parties.filter(p => p.id !== partyId),
            dayBookEntries: state.dayBookEntries.filter(e => e.partyId !== partyId),
            stockTransactions: state.stockTransactions.filter(t => t.partyId !== partyId)
        }
    }

    case 'ADD_DAYBOOK_ENTRY': {
      const entry = action.payload;
      const newParties = state.parties.map(p => {
        if (p.id === entry.partyId) {
          return { ...p, balance: p.balance + entry.cashIn - entry.cashOut };
        }
        return p;
      });
      return { ...state, dayBookEntries: [...state.dayBookEntries, entry], parties: newParties };
    }
    
    case 'EDIT_DAYBOOK_ENTRY': {
        const updatedEntry = action.payload;
        const originalEntry = state.dayBookEntries.find(e => e.id === updatedEntry.id);
        if (!originalEntry) return state;

        const partiesToUpdate = new Map<string, Party>();

        // Find and prepare the original party for update
        if (originalEntry.partyId) {
            const originalParty = state.parties.find(p => p.id === originalEntry.partyId);
            if (originalParty) partiesToUpdate.set(originalParty.id, {...originalParty});
        }

        // Find and prepare the new party for update
        if (updatedEntry.partyId && updatedEntry.partyId !== originalEntry.partyId) {
            const newParty = state.parties.find(p => p.id === updatedEntry.partyId);
            if (newParty) partiesToUpdate.set(newParty.id, {...newParty});
        }

        // Revert balance change from original party
        if (originalEntry.partyId) {
            const party = partiesToUpdate.get(originalEntry.partyId);
            if (party) {
                party.balance -= (originalEntry.cashIn - originalEntry.cashOut);
            }
        }
        
        // Apply balance change to new party
        if (updatedEntry.partyId) {
            const party = partiesToUpdate.get(updatedEntry.partyId);
            if (party) {
                party.balance += (updatedEntry.cashIn - updatedEntry.cashOut);
            }
        }
        
        // Merge updated parties back into the main list
        const newParties = state.parties.map(p => partiesToUpdate.get(p.id) || p);
        
        // Update the day book entry itself
        const newDayBookEntries = state.dayBookEntries.map(e => e.id === updatedEntry.id ? updatedEntry : e);

        return {
            ...state,
            parties: newParties,
            dayBookEntries: newDayBookEntries,
        };
    }

    case 'DELETE_DAYBOOK_ENTRY': {
        const entryId = action.payload;
        const entry = state.dayBookEntries.find(e => e.id === entryId);
        if (!entry) return state;

        let newParties = [...state.parties];

        if (entry.partyId) {
            const partyIndex = newParties.findIndex(p => p.id === entry.partyId);
            if (partyIndex > -1) {
                const party = newParties[partyIndex];
                // Revert the balance change
                const balanceChange = entry.cashIn - entry.cashOut;
                newParties[partyIndex] = { ...party, balance: party.balance - balanceChange };
            }
        }

        const newDayBookEntries = state.dayBookEntries.filter(e => e.id !== entryId);

        return {
            ...state,
            parties: newParties,
            dayBookEntries: newDayBookEntries,
        };
    }

    case 'ADD_STOCK_ITEM':
        return { ...state, stockItems: [...state.stockItems, action.payload] };

    case 'EDIT_STOCK_ITEM':
        return {
            ...state,
            stockItems: state.stockItems.map((item) => item.id === action.payload.id ? action.payload : item)
        };

    case 'DELETE_STOCK_ITEM': {
        const itemId = action.payload;
        const lowStockNotificationId = `low-stock-${itemId}`;
        return {
            ...state,
            stockItems: state.stockItems.filter(item => item.id !== itemId),
            stockTransactions: state.stockTransactions.filter(t => t.itemId !== itemId),
            notifications: state.notifications.filter(n => n.id !== lowStockNotificationId) // Also remove related notification
        }
    }

    case 'ADD_ITEM_CATEGORY': {
        const newCategory = action.payload;
        if (state.itemCategories.find(c => c.toLowerCase() === newCategory.toLowerCase())) {
            return state; // Prevent duplicates (case-insensitive)
        }
        const updatedCategories = [...state.itemCategories, newCategory].sort((a, b) => a.localeCompare(b));
        return { ...state, itemCategories: updatedCategories };
    }

    case 'ADD_STOCK_TRANSACTION': {
        const transaction = action.payload;
        let newStockItems = [...state.stockItems];
        let newParties = [...state.parties];
        let newDayBookEntries = [...state.dayBookEntries];
        
        const item = state.stockItems.find(i => i.id === transaction.itemId);
        if (!item) return state; // Should not happen, but good practice

        const itemIndex = newStockItems.findIndex(i => i.id === transaction.itemId);
        if (itemIndex > -1) {
            const currentItem = { ...newStockItems[itemIndex] };
            currentItem.batches = [...currentItem.batches.map(b => ({...b}))]; // Deep copy batches

            if (transaction.type === 'Buy') {
                const batchIndex = currentItem.batches.findIndex(b => b.batchNumber === transaction.batchNumber);
                if (batchIndex > -1) {
                    currentItem.batches[batchIndex].quantity += transaction.quantity;
                } else {
                    currentItem.batches.push({
                        batchNumber: transaction.batchNumber,
                        expiryDate: transaction.expiryDate,
                        quantity: transaction.quantity
                    });
                }
            } else { // Sell
                const batchIndex = currentItem.batches.findIndex(b => b.batchNumber === transaction.batchNumber);
                if (batchIndex > -1) {
                    const currentBatch = currentItem.batches[batchIndex];
                    if (currentBatch.quantity < transaction.quantity) {
                        console.error(`Insufficient stock for item ${currentItem.name}, batch ${currentBatch.batchNumber}. Required: ${transaction.quantity}, Available: ${currentBatch.quantity}`);
                        alert(`Transaction failed: Insufficient stock for item ${currentItem.name} in batch ${currentBatch.batchNumber}.`);
                        return state;
                    }
                    
                    currentItem.batches[batchIndex].quantity -= transaction.quantity;
                    if (currentItem.batches[batchIndex].quantity <= 0) {
                        currentItem.batches.splice(batchIndex, 1);
                    }
                } else {
                    // Trying to sell from a batch that doesn't exist.
                    console.error(`Attempted to sell from non-existent batch ${transaction.batchNumber} for item ${currentItem.name}`);
                    alert(`Transaction failed: Batch not found for item ${currentItem.name}.`);
                    return state;
                }
            }
            newStockItems[itemIndex] = currentItem;
        }

        // Create a corresponding Day Book entry for financial tracking
        const dayBookEntry: DayBookEntry = {
            id: `db-${transaction.id}`,
            date: transaction.date,
            details: transaction.details || `${transaction.type} ${item.name}`,
            cashIn: transaction.type === 'Sell' ? transaction.totalAmount : 0,
            cashOut: transaction.type === 'Buy' ? transaction.totalAmount : 0,
            partyId: transaction.partyId,
        };
        newDayBookEntries.push(dayBookEntry);
        
        // Update party balance based on the new day book entry
        if (transaction.partyId) {
            const partyIndex = newParties.findIndex(p => p.id === transaction.partyId);
            if (partyIndex > -1) {
                const party = newParties[partyIndex];
                const balanceChange = dayBookEntry.cashIn - dayBookEntry.cashOut;
                newParties[partyIndex] = { ...party, balance: party.balance + balanceChange };
            }
        }

        return {
            ...state,
            stockItems: newStockItems,
            parties: newParties,
            stockTransactions: [...state.stockTransactions, transaction],
            dayBookEntries: newDayBookEntries
        };
    }
    
    case 'EDIT_STOCK_TRANSACTION': {
        const updatedTransaction = action.payload;
        const originalTransaction = state.stockTransactions.find(t => t.id === updatedTransaction.id);

        if (!originalTransaction) return state;
        
        // Find the index of the original transaction to preserve order
        const originalIndex = state.stockTransactions.findIndex(t => t.id === updatedTransaction.id);

        // Create a temporary state by logically "deleting" the original transaction.
        // This correctly reverts stock and balance changes.
        const tempState = appReducer(state, { type: 'DELETE_STOCK_TRANSACTION', payload: originalTransaction.id });
        
        // Now, "add" the updated transaction to this temporary state.
        // This correctly applies the new stock and balance changes.
        const finalState = appReducer(tempState, { type: 'ADD_STOCK_TRANSACTION', payload: updatedTransaction });

        // The transaction list in finalState has the new transaction at the end.
        // We need to re-insert it at its original position for a non-disruptive UX.
        const finalTransactions = [...finalState.stockTransactions.filter(t => t.id !== updatedTransaction.id)];
        
        if (originalIndex !== -1) {
            finalTransactions.splice(originalIndex, 0, updatedTransaction);
        } else {
            // Fallback, though this should not be reached
            finalTransactions.push(updatedTransaction);
        }

        return {
            ...finalState,
            stockTransactions: finalTransactions
        };
    }

    case 'DELETE_STOCK_TRANSACTION': {
        const transactionId = action.payload;
        const transaction = state.stockTransactions.find(t => t.id === transactionId);
        if (!transaction) return state;

        let newStockItems = [...state.stockItems];
        let newParties = [...state.parties];

        const itemIndex = newStockItems.findIndex(i => i.id === transaction.itemId);
        if (itemIndex > -1) {
            const item = { ...newStockItems[itemIndex] };
            item.batches = [...item.batches.map(b => ({...b}))];
            const batchIndex = item.batches.findIndex(b => b.batchNumber === transaction.batchNumber);
            
            if (transaction.type === 'Buy') { // Revert buy by subtracting
                if (batchIndex > -1) {
                    item.batches[batchIndex].quantity -= transaction.quantity;
                }
            } else { // Revert sell by adding back
                if (batchIndex > -1) {
                    item.batches[batchIndex].quantity += transaction.quantity;
                } else {
                    item.batches.push({
                        batchNumber: transaction.batchNumber,
                        expiryDate: transaction.expiryDate,
                        quantity: transaction.quantity
                    });
                }
            }
            item.batches = item.batches.filter(b => b.quantity > 0);
            newStockItems[itemIndex] = item;
        }

        if (transaction.partyId) {
            const partyIndex = newParties.findIndex(p => p.id === transaction.partyId);
            if (partyIndex > -1) {
                const party = newParties[partyIndex];
                 // Revert the financial transaction
                const balanceChange = (transaction.type === 'Sell' ? transaction.totalAmount : 0) - (transaction.type === 'Buy' ? transaction.totalAmount : 0);
                newParties[partyIndex] = { ...party, balance: party.balance - balanceChange };
            }
        }
        
        // Also remove the associated DayBook entry
        const newDayBookEntries = state.dayBookEntries.filter(e => e.id !== `db-${transactionId}`);
        
        return {
            ...state,
            stockItems: newStockItems,
            parties: newParties,
            stockTransactions: state.stockTransactions.filter(t => t.id !== transactionId),
            dayBookEntries: newDayBookEntries
        };
    }

    case 'SAVE_ITEM_BILL': {
        const { stockTransactions, dayBookEntries } = action.payload;

        let newStockItems = [...state.stockItems];
        let newParties = [...state.parties];

        // 1. Update stock quantities for each item
        stockTransactions.forEach(transaction => {
            const itemIndex = newStockItems.findIndex(i => i.id === transaction.itemId);
            if (itemIndex > -1) {
                const item = { ...newStockItems[itemIndex] };
                item.batches = [...item.batches.map(b => ({...b}))];

                if (transaction.type === 'Buy') {
                    const batchIndex = item.batches.findIndex(b => b.batchNumber === transaction.batchNumber);
                    if (batchIndex > -1) {
                        item.batches[batchIndex].quantity += transaction.quantity;
                    } else {
                        item.batches.push({
                            batchNumber: transaction.batchNumber,
                            expiryDate: transaction.expiryDate,
                            quantity: transaction.quantity
                        });
                    }
                } else { // Sell
                    const batchIndex = item.batches.findIndex(b => b.batchNumber === transaction.batchNumber);
                    if (batchIndex > -1) {
                        item.batches[batchIndex].quantity -= transaction.quantity;
                        if (item.batches[batchIndex].quantity <= 0) {
                            item.batches.splice(batchIndex, 1);
                        }
                    }
                }
                newStockItems[itemIndex] = item;
            }
        });
        
        // 2. Update party balance based on all new day book entries
        if (dayBookEntries.length > 0 && dayBookEntries[0].partyId) {
            const partyId = dayBookEntries[0].partyId;
            const partyIndex = newParties.findIndex(p => p.id === partyId);
            if (partyIndex > -1) {
                const party = newParties[partyIndex];
                const totalBalanceChange = dayBookEntries.reduce((acc, entry) => {
                    return acc + (entry.cashIn - entry.cashOut);
                }, 0);
                newParties[partyIndex] = { ...party, balance: party.balance + totalBalanceChange };
            }
        }

        // 3. Add all new entries to state
        return {
            ...state,
            stockItems: newStockItems,
            parties: newParties,
            stockTransactions: [...state.stockTransactions, ...stockTransactions],
            dayBookEntries: [...state.dayBookEntries, ...dayBookEntries]
        };
    }

    case 'RESTORE_STATE': {
        const restoredState = { ...state, ...action.payload };
        if (restoredState.stockItems && Array.isArray(restoredState.stockItems)) {
            restoredState.stockItems = restoredState.stockItems.map((item: any) => {
                if (!item.batches) {
                    return { ...item, batches: item.quantity ? [{ batchNumber: 'default', quantity: item.quantity }] : [] };
                }
                return item;
            });
        } else {
            restoredState.stockItems = [];
        }
        restoredState.parties = restoredState.parties || [];
        restoredState.dayBookEntries = restoredState.dayBookEntries || [];
        restoredState.stockTransactions = restoredState.stockTransactions || [];
        restoredState.notifications = [];
        restoredState.currentScreen = Screen.Home;
        restoredState.screenPayload = null;
        return restoredState;
    }

    case 'ADD_NOTIFICATIONS': {
      const existingIds = new Set(state.notifications.map(n => n.id));
      const newNotifications = action.payload.filter(n => !existingIds.has(n.id));
      if (newNotifications.length === 0) return state;
      return {
        ...state,
        notifications: [...state.notifications, ...newNotifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      };
    }
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => n.id === action.payload.id ? { ...n, isRead: true } : n),
      };
    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      };
    case 'CLEAR_READ_NOTIFICATIONS':
      return {
        ...state,
        notifications: state.notifications.filter(n => !n.isRead),
      };

    default:
      return state;
  }
};

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> }>({
  state: initialState,
  dispatch: () => null,
});

const AppProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState, (init): AppState => {
    try {
      const allUsersData = JSON.parse(localStorage.getItem(MULTI_USER_DATA_KEY) || '{}');
      const currentUserEmail = localStorage.getItem(CURRENT_USER_EMAIL_KEY);
      
      if (currentUserEmail && allUsersData[currentUserEmail]) {
        const userState = allUsersData[currentUserEmail];

        // Merge with initial state to add any new properties from code updates
        const mergedState: AppState = { ...init, ...userState };
        
        // Migration logic for older data structures
        if (mergedState.stockItems && Array.isArray(mergedState.stockItems)) {
            mergedState.stockItems = mergedState.stockItems.map((item: any) => {
                if (!item.batches) {
                    return { ...item, batches: item.quantity ? [{ batchNumber: 'default', quantity: item.quantity }] : [] };
                }
                return item;
            });
        } else {
            mergedState.stockItems = [];
        }

        // Always start at home after a reload for a clean experience
        mergedState.currentScreen = Screen.Home;
        mergedState.screenPayload = null;

        return mergedState;
      }
    } catch (error) {
      console.error("Could not load state from localStorage, using initial state.", error);
    }
    // No user logged in, or an error occurred. Return a clean initial state.
    return init;
  });

  useEffect(() => {
    // This effect now saves the state for the CURRENT user.
    if (state.user && state.user.email) {
        try {
            const allUsersData = JSON.parse(localStorage.getItem(MULTI_USER_DATA_KEY) || '{}');
            allUsersData[state.user.email] = state;
            localStorage.setItem(MULTI_USER_DATA_KEY, JSON.stringify(allUsersData));
        } catch (error) {
            console.error("Could not save state to localStorage", error);
        }
    }
  }, [state]);

  // Effect for generating notifications
  useEffect(() => {
    if (!state.user) return; // Don't run notifications if logged out

    const newNotifications: Notification[] = [];
    const existingNotificationIds = new Set(
      state.notifications.map(n => n.id)
    );

    // 1. Check for low stock items
    state.stockItems.forEach(item => {
        const totalQuantity = item.batches.reduce((sum, batch) => sum + batch.quantity, 0);
        if (totalQuantity > 0 && totalQuantity <= item.lowStockLimit) {
            const notificationId = `low-stock-${item.id}`;
            if (!existingNotificationIds.has(notificationId)) {
                newNotifications.push({
                    id: notificationId,
                    type: 'lowStock',
                    message: `${item.name} is running low on stock (${totalQuantity} ${item.unit} left).`,
                    link: { screen: Screen.ItemDetail, payload: { itemId: item.id } },
                    isRead: false,
                    timestamp: new Date().toISOString(),
                });
            }
        }
    });

    // 2. Check for due dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    state.dayBookEntries.forEach(entry => {
        if (entry.dueDate) {
            const dueDate = new Date(entry.dueDate);
            dueDate.setHours(0, 0, 0, 0); // Normalize to start of day
            
            let message = '';
            if (dueDate < today) {
                message = `Payment for "${entry.details}" was due on ${dueDate.toLocaleDateString()}.`;
            } else if (dueDate <= threeDaysFromNow) {
                message = `Payment for "${entry.details}" is due on ${dueDate.toLocaleDateString()}.`;
            }

            if (message) {
                const notificationId = `due-date-${entry.id}`;
                if (!existingNotificationIds.has(notificationId)) {
                    newNotifications.push({
                        id: notificationId,
                        type: 'dueDate',
                        message: message,
                        link: { screen: Screen.DayBook, payload: null },
                        isRead: false,
                        timestamp: new Date().toISOString(),
                    });
                }
            }
        }
    });

    if (newNotifications.length > 0) {
        // FIX: Defer the notification dispatch to avoid state transition conflicts.
        // Dispatching immediately within this effect can cause a "Cannot transition state during state transition"
        // error, especially after a LOGIN action that changes the data this effect depends on.
        const timer = setTimeout(() => {
            dispatch({ type: 'ADD_NOTIFICATIONS', payload: newNotifications });
        }, 0);
        // Add a cleanup function to clear the timeout if the component unmounts or the effect re-runs.
        return () => clearTimeout(timer);
    }
  }, [state.stockItems, state.dayBookEntries, state.user, dispatch, state.notifications]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};

export { AppContext, AppProvider };