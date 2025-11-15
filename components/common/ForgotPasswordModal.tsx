import React, { useState } from 'react';
import Modal from './Modal.js';
import { EnvelopeIcon } from '../Icons.js';

const ForgotPasswordModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send a password reset link here.
    console.log(`Password reset requested for: ${email}`);
    setSubmitted(true);
  };
  
  const handleClose = () => {
      setSubmitted(false);
      setEmail('');
      onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reset Your Password">
      {submitted ? (
        <div className="text-center">
          <h3 className="text-lg font-medium text-slate-800">Check your inbox</h3>
          <p className="mt-2 text-sm text-slate-600">
            If an account exists for <span className="font-semibold">{email}</span>, you will receive an email with instructions on how to reset your password.
          </p>
          <button onClick={handleClose} className="mt-4 w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold">
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-slate-600">
            Enter the email address associated with your account, and we'll send you a link to reset your password.
          </p>
          <div>
            <label htmlFor="reset-email" className="sr-only">Email</label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3" aria-hidden="true">
                    <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                </span>
                <input
                    id="reset-email"
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-100 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    autoFocus
                />
            </div>
          </div>
          <button type="submit" className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold">
            Send Reset Link
          </button>
        </form>
      )}
    </Modal>
  );
};

export default ForgotPasswordModal;
