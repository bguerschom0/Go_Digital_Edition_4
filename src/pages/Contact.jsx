import React from 'react';
import { Mail, Phone, Briefcase, ExternalLink, MapPin, User } from 'lucide-react';

const ContactCard = ({ name, title, email, phone, office, imageUrl }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
    <div className="p-6">
      <div className="flex items-center">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-16 w-16 flex items-center justify-center overflow-hidden">
          {/* Replace actual user images with a User icon */}
          <User className="h-8 w-8 text-gray-500 dark:text-gray-400" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{title}</p>
        </div>
      </div>
      
      <div className="mt-4 space-y-3">
        {email && (
          <div className="flex items-center">
            <Mail className="h-5 w-5 text-gray-400 mr-3" />
            <a href={`mailto:${email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
              {email}
            </a>
          </div>
        )}
        
        {phone && (
          <div className="flex items-center">
            <Phone className="h-5 w-5 text-gray-400 mr-3" />
            <a href={`tel:${phone}`} className="text-gray-700 dark:text-gray-300">
              {phone}
            </a>
          </div>
        )}
        
        {office && (
          <div className="flex items-center">
            <Briefcase className="h-5 w-5 text-gray-400 mr-3" />
            <span className="text-gray-700 dark:text-gray-300">{office}</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const Contact = () => {
  // Contact information data
  const contacts = [
    {
      name: 'Bigirimana Guerschom',
      title: 'Security and Safety Technical Operations Officer',
      email: 'guerschom.bigirimana@mtn.com',
      phone: '+250 78831 5218',
      office: 'Security & Safety'

    },
    {
      name: 'Isimbi Esther',
      title: 'Security and Safety Officer',
      email: 'esther.isimbi@mtn.com',
      phone: '+250 78831 7452',
      office: 'Security & Safety'

    },
    {
      name: 'Niragire Theogene',
      title: 'Security & Safety Manager',
      email: 'theogene.niragire@mtn.com',
      phone: '+250 78831 2914',
      office: 'Security & Safety'

    },
        {
      name: 'Nkomati Modeste',
      title: 'Security and Safety Officer',
      email: 'modeste.nkomati@mtn.com',
      phone: '+250 78831 3047',
      office: 'Security & Safety'

    },
    {
      name: 'Tuyisenge Candide',
      title: 'Security and Safety Digital Support Officer',
      email: 'candide.tuyisenge@mtn.com',
      phone: '+250 78831 7504',
      office: 'Security & Safety'

    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Contact Us</h1>
          <p className="text-gray-600 dark:text-gray-300">
            If you need assistance with submitted requests or have questions about the system,
            please contact one of our team members below.
          </p>
        </div>
        
        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {contacts.map((contact, index) => (
            <ContactCard key={index} {...contact} />
          ))}
        </div>
        
        {/* Office Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Office Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-start mb-4">
                <MapPin className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Main Office</p>
                  <p className="text-base text-gray-900 dark:text-white">
                    Physical Address<br />
                    MTN Rwanda Headquarters, KG 9 Ave, Kigali, Rwanda<br />

                    Postal Address<br />
                    MTN Centre, Nyarutarama P.O. Box 264. Kigali, Rwanda
                  </p>
                </div>
              </div>
              
            </div>
            
            <div>
              <div className="flex items-start mb-4">
                <Mail className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">General Inquiries & Support</p>
                  <p className="text-base text-gray-900 dark:text-white">Security.RW@mtn.com</p>
                </div>
              </div>
              
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hours of Operation: Monday - Friday, 9:00 AM - 5:00 PM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
