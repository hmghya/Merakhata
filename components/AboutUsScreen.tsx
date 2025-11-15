import React from 'react';
// Fix: Added .js extension to imports
import { Screen } from '../types.js';
import Header from './common/Header.js';
import { EnvelopeIcon, GlobeAltIcon } from './Icons.js';

const AboutUsScreen: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-slate-100">
      <Header title="About Us" backScreen={Screen.Home} />
      <main id="about-us-content" className="flex-grow p-4 space-y-4 overflow-y-auto">

        <section className="bg-white p-6 rounded-lg shadow-sm text-center">
            <h1 className="text-xl font-bold text-slate-800"> Ghulam Yasin Arain </h1>
            <p className="text-slate-500 mt-1">CEO </p>
        </section>

        <section className="bg-white p-6 rounded-lg shadow-sm text-center">
            <h1 className="text-xl font-bold text-slate-800">Apps Talk SMC Private Limited (Kahror Pakka)</h1>
            <p className="text-slate-500 mt-1">Innovative Solutions for Modern Business</p>
        </section>

        <section className="bg-white p-4 rounded-lg shadow-sm">
             <h2 className="text-base font-semibold text-slate-700 mb-3 border-b pb-2">Contact Information</h2>
             <div className="space-y-3">
                <a href="mailto:Appstalk3@gmail.com" className="flex items-center gap-3 text-slate-600 hover:text-purple-600 transition-colors">
                    <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                    <span>Appstalk3@gmail.com</span>
                </a>
                 <a href="https://appstalk.online" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-600 hover:text-purple-600 transition-colors">
                    <GlobeAltIcon className="h-5 w-5 text-slate-400" />
                    <span>appstalk.online</span>
                </a>
             </div>
        </section>

        <section className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-base font-semibold text-slate-700 mb-2">Our Introduction</h2>
            <p className="text-slate-600 leading-relaxed">
                Apps Talk is a dynamic and forward-thinking technology company specializing in the development of intuitive and powerful mobile and web applications. We are committed to providing cutting-edge solutions that help businesses streamline their operations, enhance productivity, and achieve their goals.
            </p>
        </section>
        
        <section className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-base font-semibold text-slate-700 mb-2">Our Vision</h2>
            <p className="text-slate-600 leading-relaxed">
                Our vision is to empower businesses of all sizes with accessible, user-friendly, and efficient digital tools. We believe that technology should be a catalyst for growth, and we strive to create products that are not only functional but also a pleasure to use.
            </p>
        </section>

        <section className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-base font-semibold text-slate-700 mb-2">Our Work</h2>
            <p className="text-slate-600 leading-relaxed">
                We specialize in creating bespoke software solutions tailored to the unique needs of our clients. From comprehensive business management applications like Mayra Khata to specialized tools for various industries, our work is defined by its quality, reliability, and attention to detail. We focus on creating seamless user experiences backed by robust and scalable technology.
            </p>
        </section>

      </main>
    </div>
  );
};

export default AboutUsScreen;