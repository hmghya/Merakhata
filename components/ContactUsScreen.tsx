import React from 'react';
// Fix: Added .js extension to imports
import { Screen } from '../types.js';
import Header from './common/Header.js';
import { EnvelopeIcon, GlobeAltIcon, MapPinIcon } from './Icons.js';

const ContactUsScreen: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-slate-100">
      <Header title="Contact Us" backScreen={Screen.Home} />
      <main id="contact-us-content" className="flex-grow p-4 space-y-4 overflow-y-auto">
        
        <section className="bg-white p-6 rounded-lg shadow-sm text-center">
            <h1 className="text-xl font-bold text-slate-800">Get in Touch</h1>
            <p className="text-slate-500 mt-1">We'd love to hear from you!</p>
        </section>

        <section className="bg-white p-4 rounded-lg shadow-sm">
             <h2 className="text-base font-semibold text-slate-700 mb-3 border-b pb-2">Our Contact Details</h2>
             <div className="space-y-4">
                <a href="mailto:Appstalk3@gmail.com" className="flex items-center gap-3 p-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors">
                    <EnvelopeIcon className="h-6 w-6 text-teal-500" />
                    <div>
                        <span className="font-semibold text-slate-700">Email Us</span>
                        <p className="text-sm text-slate-600">Appstalk3@gmail.com</p>
                    </div>
                </a>
                 <a href="https://appstalk.online" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors">
                    <GlobeAltIcon className="h-6 w-6 text-teal-500" />
                    <div>
                        <span className="font-semibold text-slate-700">Visit Our Website</span>
                        <p className="text-sm text-slate-600">appstalk.online</p>
                    </div>
                </a>
                <a href="https://maps.app.goo.gl/2mDxyxSHhwc2F1c96" target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors">
                    <MapPinIcon className="h-6 w-6 text-teal-500 flex-shrink-0 mt-1" />
                    <div>
                        <span className="font-semibold text-slate-700">Our Office</span>
                        <p className="text-sm text-slate-600">Apps Talk SMC Private Limited (Kahror Pakka)</p>
                    </div>
                </a>
             </div>
        </section>

        <section className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-slate-600 leading-relaxed text-center">
                For any inquiries, support requests, or feedback, please don't hesitate to reach out to us through the channels above.
            </p>
        </section>

      </main>
    </div>
  );
};

export default ContactUsScreen;