import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Phone, 
  Trash2, 
  Plus,
  Save,
  ChevronRight,
  Lock,
  Eye,
  Smartphone,
  MapPin
} from 'lucide-react';
import { motion } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { cn } from '../lib/utils';

export default function SettingsPage() {
  const { profile } = useAuth();
  const [name, setName] = useState(profile?.displayName || '');
  const [language, setLanguage] = useState(profile?.language || 'en');
  const [contacts, setContacts] = useState(profile?.emergencyContacts || []);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    setLoading(true);
    const path = `users/${profile.uid}`;
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        displayName: name,
        language,
        emergencyContacts: contacts
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setLoading(false);
    }
  };

  const addContact = () => {
    if (!newContact.name || !newContact.phone) return;
    setContacts([...contacts, newContact]);
    setNewContact({ name: '', phone: '', relation: '' });
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const SettingSection = ({ title, icon: Icon, children }: any) => (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-purple-600/10 rounded-xl text-purple-400">
          <Icon className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage your profile and safety preferences.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all disabled:opacity-50"
        >
          {loading ? 'Saving...' : success ? 'Saved!' : 'Save Changes'}
          <Save className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Profile Section */}
        <SettingSection title="Profile Information" icon={User}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 ml-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-600 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 ml-1">Email Address</label>
              <input
                type="email"
                value={profile?.email}
                disabled
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-500 cursor-not-allowed outline-none"
              />
            </div>
          </div>
        </SettingSection>

        {/* Emergency Contacts */}
        <SettingSection title="Emergency Contacts" icon={Phone}>
          <div className="space-y-4">
            {contacts.map((contact, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-purple-400 font-bold">
                    {contact.name[0]}
                  </div>
                  <div>
                    <p className="text-white font-bold">{contact.name}</p>
                    <p className="text-slate-500 text-xs">{contact.phone} • {contact.relation}</p>
                  </div>
                </div>
                <button 
                  onClick={() => removeContact(i)}
                  className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              <input
                type="text"
                placeholder="Name"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-purple-500"
              />
              <input
                type="text"
                placeholder="Phone"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-purple-500"
              />
              <button
                onClick={addContact}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>
        </SettingSection>

        {/* Preferences */}
        <SettingSection title="Preferences" icon={Globe}>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm font-bold text-white">App Language</p>
                  <p className="text-xs text-slate-500">Choose your preferred language</p>
                </div>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-xl py-2 px-4 text-white text-sm outline-none"
              >
                <option value="en">English</option>
                <option value="hi">Hindi (हिन्दी)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-sm font-bold text-white">Push Notifications</p>
                  <p className="text-xs text-slate-500">Alerts for nearby incidents</p>
                </div>
              </div>
              <button className="w-12 h-6 bg-purple-600 rounded-full relative">
                <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>
          </div>
        </SettingSection>

        {/* Security */}
        <SettingSection title="Security & Privacy" icon={Shield}>
          <div className="space-y-3">
            {[
              { title: 'Background Safety Mode', desc: 'Detect screams and unusual motion', icon: Smartphone, active: true },
              { title: 'Location Sharing', desc: 'Share live location with contacts', icon: MapPin, active: true },
              { title: 'Anonymous Reporting', desc: 'Hide identity on community feed', icon: Eye, active: false },
              { title: 'Two-Factor Auth', desc: 'Extra layer of protection', icon: Lock, active: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-950/50 rounded-2xl transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-purple-400 transition-colors">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </div>
            ))}
          </div>
        </SettingSection>
      </div>
    </div>
  );
}
