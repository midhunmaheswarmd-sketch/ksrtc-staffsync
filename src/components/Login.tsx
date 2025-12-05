import React, { useState } from 'react';
import { Bus, ArrowRight, UserCog, Building2 } from 'lucide-react';
import { UNIT_CODES, DEFAULT_PASSWORD, ADMIN_USERNAME, ADMIN_PASSWORD } from '../constants';
import { Button } from './Button';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole, unitCode: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loginMode, setLoginMode] = useState<'UNIT' | 'ADMIN'>('UNIT');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate network delay
    setTimeout(() => {
      if (loginMode === 'UNIT') {
        if (!selectedUnit) {
          setError('Please select a Unit');
          setLoading(false);
          return;
        }
        if (password !== DEFAULT_PASSWORD) {
          setError('Invalid unit password.');
          setLoading(false);
          return;
        }
        onLogin('UNIT_HEAD', selectedUnit);
      } else {
        if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
          setError('Invalid admin credentials.');
          setLoading(false);
          return;
        }
        onLogin('ADMIN', 'ALL');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-red-700 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-800 text-yellow-400 mb-4 shadow-inner">
            <Bus size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">KSRTC StaffSync</h1>
          <p className="text-red-200 mt-2 text-sm">Unit Strength Management System</p>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-4 text-sm font-medium text-center focus:outline-none transition-colors ${loginMode === 'UNIT' ? 'text-red-700 border-b-2 border-red-700 bg-red-50' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setLoginMode('UNIT'); setError(''); setPassword(''); }}
          >
            <div className="flex items-center justify-center">
              <Building2 size={16} className="mr-2" /> Unit Login
            </div>
          </button>
          <button
            className={`flex-1 py-4 text-sm font-medium text-center focus:outline-none transition-colors ${loginMode === 'ADMIN' ? 'text-red-700 border-b-2 border-red-700 bg-red-50' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setLoginMode('ADMIN'); setError(''); setPassword(''); }}
          >
             <div className="flex items-center justify-center">
              <UserCog size={16} className="mr-2" /> Admin Login
            </div>
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {loginMode === 'UNIT' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Unit Code</label>
                <div className="relative">
                  <select
                    className="block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-lg border bg-white"
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    required
                  >
                    <option value="" disabled>Choose Unit...</option>
                    {UNIT_CODES.map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg flex items-center animate-pulse">
                <span className="mr-2">⚠️</span> {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full flex justify-center py-3"
              isLoading={loading}
            >
              {loginMode === 'ADMIN' ? 'Admin Access' : 'Unit Access'} <ArrowRight size={16} className="ml-2" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};