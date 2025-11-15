

import React, { useState, useContext, useCallback, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext.js';
import { Screen, User } from '../types.js';
import { EnvelopeIcon, LockClosedIcon, GoogleIcon, EyeIcon, EyeOffIcon, CheckIcon, UserCircleIcon } from './Icons.js';
import ForgotPasswordModal from './common/ForgotPasswordModal.js';
import Modal from './common/Modal.js';

// Declare global variables from CDN scripts for TypeScript
declare global {
    interface Window {
        google: {
            accounts: {
                id: any;
                oauth2: any;
            };
            // Fix: Add picker property to make the global Window type consistent across files.
            picker: any;
        };
    }
}

// These are placeholder values.
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";


type AuthMode = 'login' | 'register';

const PasswordStrengthIndicator: React.FC<{ criteria: Record<string, boolean> }> = ({ criteria }) => {
    const criteriaList = [
      { key: 'minLength', text: 'At least 8 characters' },
      { key: 'uppercase', text: 'An uppercase letter' },
      { key: 'lowercase', text: 'A lowercase letter' },
      { key: 'number', text: 'A number' },
    ];
  
    return (
      <div className="mt-2 space-y-1">
        <ul className="pl-1">
          {criteriaList.map(item => (
            <li 
              key={item.key} 
              className={`flex items-center text-xs transition-colors ${criteria[item.key] ? 'text-emerald-600' : 'text-slate-500'}`}
            >
              {criteria[item.key] ? (
                <svg className="w-4 h-4 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              )}
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    );
};
  

const AuthScreen: React.FC = () => {
    const { dispatch } = useContext(AppContext);
    const [mode, setMode] = useState<AuthMode>('login');
    
    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // UI state
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProvider, setLoadingProvider] = useState<'email' | 'google' | null>(null);
    const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
    
    // Fake Google Sign-In Flow State
    const [fakeSignInStep, setFakeSignInStep] = useState<'none' | 'chooser' | 'consent' | 'manual'>('none');
    const [selectedFakeAccount, setSelectedFakeAccount] = useState<{name: string; email: string; photoUrl: string} | null>(null);
    const [fakeManualEmail, setFakeManualEmail] = useState('');
    
    // Validation & Feedback state
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [passwordCriteria, setPasswordCriteria] = useState({
      minLength: false,
      uppercase: false,
      lowercase: false,
      number: false,
    });
    
    // Animation state
    const [shake, setShake] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [successProvider, setSuccessProvider] = useState<'email' | 'google' | null>(null);

    const emailInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { emailInputRef.current?.focus(); }, [mode]);

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 820);
    };
    
    const handleLoginSuccess = useCallback((provider: 'email' | 'google', user: User) => {
        setSuccessProvider(provider);
        setLoginSuccess(true);
        setIsLoading(false);
        setLoadingProvider(null);

        setTimeout(() => {
            dispatch({ type: 'LOGIN', payload: user });
        }, 1000);
    }, [dispatch]);

    const validatePassword = useCallback((value: string) => {
        const criteria = {
            minLength: value.length >= 8,
            uppercase: /[A-Z]/.test(value),
            lowercase: /[a-z]/.test(value),
            number: /[0-9]/.test(value),
        };
        setPasswordCriteria(criteria);
        return Object.values(criteria).every(Boolean);
    }, []);

    const validate = (currentMode: AuthMode) => {
        const newErrors: { [key: string]: string } = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (currentMode === 'register' && !name.trim()) {
            newErrors.name = "Full name is required.";
        }
        
        if (!email.trim()) {
            newErrors.email = "Email is required.";
        } else if (!emailRegex.test(email)) {
            newErrors.email = "Please enter a valid email address.";
        }

        if (!password) {
            newErrors.password = "Password is required.";
        } else if (currentMode === 'register' && !validatePassword(password)) {
            newErrors.password = "Password does not meet all criteria.";
        }
        
        if (currentMode === 'register' && password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate('login')) {
            triggerShake();
            return;
        }
        setLoadingProvider('email');
        setIsLoading(true);
        setTimeout(() => {
            handleLoginSuccess('email', { name: 'Demo User', email: email });
        }, 1000);
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate('register')) {
            triggerShake();
            return;
        }
        dispatch({ type: 'NAVIGATE', payload: { screen: Screen.PrivacyPolicy, payload: { name, email } } });
    };

    // --- FAKE GOOGLE SIGN IN FLOW ---
    const fakeAccounts = [
        { name: 'Ada Lovelace', email: 'ada.lovelace@example.com', photoUrl: 'https://i.pravatar.cc/150?u=ada' },
        { name: 'Charles Babbage', email: 'c.babbage@example.com', photoUrl: 'https://i.pravatar.cc/150?u=charles' },
    ];

    const handleSelectFakeAccount = (account: typeof fakeAccounts[0]) => {
        setSelectedFakeAccount(account);
        setFakeSignInStep('consent');
    };

    const handleFakeConsent = () => {
        if (selectedFakeAccount) {
            handleLoginSuccess('google', selectedFakeAccount);
        }
        setFakeSignInStep('none');
        setSelectedFakeAccount(null);
    };
    
    const handleFakeManualSignIn = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fakeManualEmail) return;
        const userName = fakeManualEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        handleLoginSuccess('google', {
            name: userName || 'New User',
            email: fakeManualEmail
        });
        setFakeSignInStep('none');
        setFakeManualEmail('');
    };

    const handleCancelFakeSignIn = () => {
        setFakeSignInStep('none');
        setSelectedFakeAccount(null);
        setFakeManualEmail('');
        setLoadingProvider(null);
        setIsLoading(false);
    };
    // --- END FAKE GOOGLE SIGN IN FLOW ---

    const handleGoogleLogin = () => {
        // Start the fake sign-in flow
        setLoadingProvider('google');
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false); // Spinner on button stops
            setFakeSignInStep('chooser'); // Modal opens
        }, 500);
    };

    const Spinner: React.FC<{className?: string}> = ({className = ''}) => (
        <svg className={`animate-spin h-5 w-5 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );
    
    const isEmailLoading = isLoading && loadingProvider === 'email';
    const isEmailSuccess = loginSuccess && successProvider === 'email';
    const isGoogleLoading = isLoading && loadingProvider === 'google';
    const isGoogleSuccess = loginSuccess && successProvider === 'google';


    const inputClass = (hasError: boolean) => `w-full pl-10 pr-4 py-3 bg-slate-100 border-2 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${hasError ? 'border-rose-500 focus:ring-rose-500' : 'border-transparent'}`;

    return (
        <>
            <div className="flex flex-col h-full bg-slate-100 justify-center items-center p-4">
                 <div className={`w-full max-w-md p-1 rounded-2xl shadow-xl bg-gradient-to-r from-cyan-500 to-teal-600 transition-all duration-300 ${shake ? 'animate-shake' : ''}`}>
                    <div className="bg-white rounded-xl p-6 md:p-8">
                        <div className="text-center mb-6">
                            <h1 className="text-xl font-bold text-slate-800">{mode === 'login' ? 'Welcome Back!' : 'Create an Account'}</h1>
                            <p className="text-slate-500 mt-2 text-xs">{mode === 'login' ? 'Sign in to continue.' : 'Get started with a new account.'}</p>
                        </div>
                        
                        <div className="flex border-b border-slate-200 mb-4">
                            <button onClick={() => setMode('login')} className={`flex-1 py-2 text-center font-semibold text-sm ${mode === 'login' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500'}`}>Login</button>
                            <button onClick={() => setMode('register')} className={`flex-1 py-2 text-center font-semibold text-sm ${mode === 'register' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500'}`}>Register</button>
                        </div>

                        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                            {mode === 'register' && (
                                <div>
                                    <div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><UserCircleIcon className="h-5 w-5 text-slate-400" /></span><input id="name_reg" type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className={inputClass(!!errors.name)} required /></div>
                                    {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
                                </div>
                            )}
                            <div>
                                <div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><EnvelopeIcon className="h-5 w-5 text-slate-400" /></span><input ref={emailInputRef} id="email" type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className={inputClass(!!errors.email)} required /></div>
                                {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
                            </div>
                            <div>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockClosedIcon className="h-5 w-5 text-slate-400" /></span>
                                    <input id="password" type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onFocus={() => setPasswordTouched(true)} onBlur={() => validatePassword(password)} className={inputClass(!!errors.password)} required />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3"><span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>{showPassword ? <EyeOffIcon className="h-5 w-5 text-slate-400" /> : <EyeIcon className="h-5 w-5 text-slate-400" />}</button>
                                </div>
                                {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password}</p>}
                                {mode === 'register' && passwordTouched && <PasswordStrengthIndicator criteria={passwordCriteria} />}
                            </div>
                             {mode === 'register' && (
                                <div>
                                    <div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockClosedIcon className="h-5 w-5 text-slate-400" /></span><input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass(!!errors.confirmPassword)} required /></div>
                                    {errors.confirmPassword && <p className="mt-1 text-xs text-rose-500">{errors.confirmPassword}</p>}
                                </div>
                            )}
                            {mode === 'login' && (
                                <div className="text-right text-sm"><button type="button" onClick={() => setIsForgotPasswordModalOpen(true)} className="font-medium text-teal-600 hover:text-teal-500">Forgot password?</button></div>
                            )}
                             <button type="submit" disabled={isLoading} className={`w-full relative flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-300 ${isEmailSuccess ? 'bg-emerald-500' : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-75`}>
                                <span className={`transition-opacity duration-200 ${isEmailLoading || isEmailSuccess ? 'opacity-0' : 'opacity-100'}`}>
                                    {mode === 'login' ? 'Sign In' : 'Register'}
                                </span>
                                {isEmailLoading && <span className="absolute inset-0 flex items-center justify-center"><Spinner className="text-white"/></span>}
                                {isEmailSuccess && <span className="absolute inset-0 flex items-center justify-center"><CheckIcon className="h-6 w-6 text-white"/></span>}
                            </button>
                        </form>

                        <div className="mt-6 relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-300" /></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-500">OR</span></div></div>
                        <div className="mt-6 grid grid-cols-1 gap-3">
                            <button onClick={handleGoogleLogin} disabled={isLoading} className="w-full relative inline-flex justify-center py-3 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-75">
                                 <span className={`transition-opacity duration-200 flex items-center ${isGoogleLoading || isGoogleSuccess ? 'opacity-0' : 'opacity-100'}`}>
                                    <GoogleIcon className="w-5 h-5 mr-2" />
                                    Sign in with Google
                                </span>
                                {isGoogleLoading && <span className="absolute inset-0 flex items-center justify-center"><Spinner className="text-teal-500"/></span>}
                                {isGoogleSuccess && <span className="absolute inset-0 flex items-center justify-center"><CheckIcon className="h-6 w-6 text-emerald-500"/></span>}
                            </button>
                        </div>
                        
                    </div>
                </div>
            </div>
            <ForgotPasswordModal isOpen={isForgotPasswordModalOpen} onClose={() => setIsForgotPasswordModalOpen(false)} />
            
            {/* Simulated Google Sign-In Modal */}
            <Modal isOpen={fakeSignInStep !== 'none'} onClose={handleCancelFakeSignIn} title={
                fakeSignInStep === 'chooser' ? 'Choose an account' : 'Sign in with Google'
            }>
                {fakeSignInStep === 'chooser' && (
                    <div className="space-y-2">
                        <div className="text-center mb-4">
                            <GoogleIcon className="h-8 w-8 mx-auto" />
                            <p className="text-slate-500 mt-2 text-sm">to continue to Mayra Khata</p>
                        </div>
                        {fakeAccounts.map(account => (
                            <button key={account.email} onClick={() => handleSelectFakeAccount(account)} className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors">
                                <img src={account.photoUrl} alt={account.name} className="w-10 h-10 rounded-full" />
                                <div>
                                    <p className="font-semibold text-slate-800 text-left">{account.name}</p>
                                    <p className="text-sm text-slate-500 text-left">{account.email}</p>
                                </div>
                            </button>
                        ))}
                        <button onClick={() => setFakeSignInStep('manual')} className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors">
                            <UserCircleIcon className="w-10 h-10 text-slate-400 p-1" />
                            <div>
                                <p className="font-semibold text-slate-800 text-left">Use another account</p>
                            </div>
                        </button>
                    </div>
                )}
                {fakeSignInStep === 'consent' && selectedFakeAccount && (
                    <div className="text-center">
                        <GoogleIcon className="h-8 w-8 mx-auto" />
                        <h3 className="text-lg font-medium text-slate-800 mt-4">Mayra Khata wants to access your Google Account</h3>
                        <div className="flex items-center gap-3 p-4 my-4 bg-slate-100 rounded-lg">
                            <img src={selectedFakeAccount.photoUrl} alt={selectedFakeAccount.name} className="w-10 h-10 rounded-full" />
                            <p className="text-sm text-slate-600">{selectedFakeAccount.email}</p>
                        </div>
                        <p className="text-sm text-slate-500 text-left mb-4">
                            This will allow Mayra Khata to:
                        </p>
                        <ul className="text-left text-sm text-slate-600 space-y-2 mb-6 pl-4">
                            <li className="flex items-start gap-2">
                                <CheckIcon className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5"/>
                                <span>See your personal info, including any personal info you've made publicly available</span>
                            </li>
                        </ul>
                        <p className="text-xs text-slate-400 text-left">
                            Make sure you trust Mayra Khata.
                        </p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={handleCancelFakeSignIn} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 font-semibold">Cancel</button>
                            <button onClick={handleFakeConsent} className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-md hover:from-teal-700 hover:to-cyan-700 font-semibold">Allow</button>
                        </div>
                    </div>
                )}
                {fakeSignInStep === 'manual' && (
                    <div className="text-center">
                        <GoogleIcon className="h-8 w-8 mx-auto" />
                        <h3 className="text-xl font-medium text-slate-800 mt-4">Sign in</h3>
                        <p className="text-sm text-slate-500 mt-1">to continue to Mayra Khata</p>
                        <form onSubmit={handleFakeManualSignIn} className="mt-6 space-y-4 text-left">
                            <div>
                                <input
                                    type="email"
                                    placeholder="Email or phone"
                                    value={fakeManualEmail}
                                    onChange={(e) => setFakeManualEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    required
                                    autoFocus
                                />
                            </div>
                            <p className="text-xs text-slate-500">This is a simulated login. Any email will work.</p>
                            <div className="flex justify-between items-center mt-6">
                                <button type="button" onClick={handleCancelFakeSignIn} className="px-4 py-2 text-teal-600 rounded-md hover:bg-teal-50 font-semibold">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-md hover:from-teal-700 hover:to-cyan-700 font-semibold">
                                    Next
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default AuthScreen;