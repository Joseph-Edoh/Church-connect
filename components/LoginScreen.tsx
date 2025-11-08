import React, { useState, useEffect } from 'react';
import { User, Church, UserRole, Unit } from '../types';
import { useAuth } from '../App';
import db from '../services/db';
import { UsersIcon } from './icons/UsersIcon';

type View = 'options' | 'create' | 'admin_login' | 'worker_login';

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [view, setView] = useState<View>('options');
  
  const renderView = () => {
    switch (view) {
      case 'create':
        return <CreateChurchAccountView onBack={() => setView('options')} />;
      case 'admin_login':
        return <LoginView onBack={() => setView('options')} isAdminLogin={true} />;
      case 'worker_login':
        return <WorkerLoginRegisterView onBack={() => setView('options')} />;
      case 'options':
      default:
        return (
          <div className="space-y-4">
            <button
                onClick={() => setView('create')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150 ease-in-out"
            >
                1. Create Church Account
            </button>
            <button
                onClick={() => setView('admin_login')}
                className="w-full flex justify-center py-3 px-4 border border-primary rounded-md shadow-sm text-sm font-medium text-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150 ease-in-out"
            >
                2. Login as Pastor / Super Admin
            </button>
            <button
                onClick={() => setView('worker_login')}
                className="w-full flex justify-center py-3 px-4 border border-primary rounded-md shadow-sm text-sm font-medium text-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150 ease-in-out"
            >
                3. Login / Register as Worker or Minister
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
            <UsersIcon className="mx-auto h-12 w-auto text-primary" />
          <h1 className="text-3xl font-bold text-dark-text mt-4">ChurchConnect CMS</h1>
          <p className="text-light-text mt-2">
            {view === 'options' && 'Welcome! Please select an option to continue.'}
            {view === 'create' && 'Register a new church account.'}
            {view === 'admin_login' && 'Log in as a church administrator.'}
            {view === 'worker_login' && 'Log in or register as a church worker or member.'}
          </p>
        </div>
        {renderView()}
      </div>
    </div>
  );
};

// --- Sub-components for different views ---

interface ViewProps {
    onBack: () => void;
}

const CreateChurchAccountView: React.FC<ViewProps> = ({ onBack }) => {
    const { login } = useAuth();
    const [churchName, setChurchName] = useState('');
    const [pastorName, setPastorName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!churchName || !pastorName || !phone || !email || !password) {
            alert('Please fill in all fields.');
            return;
        }
        setIsLoading(true);
        const newChurch = await db.addChurch(churchName);
        const newPastor = await db.addUser(newChurch.id, pastorName, phone, email, password, UserRole.SuperAdmin);
        setIsLoading(false);
        login(newPastor);
    }
    
    return (
        <form onSubmit={handleCreate} className="space-y-4">
            <div>
                <label htmlFor="pastorName" className="block text-sm font-medium text-gray-700">Your Full Name (Pastor)</label>
                <input id="pastorName" type="text" value={pastorName} onChange={e => setPastorName(e.target.value)} required className="mt-1 block w-full input-style" placeholder="e.g., John Doe"/>
            </div>
             <div>
                <label htmlFor="churchName" className="block text-sm font-medium text-gray-700">Church Name</label>
                <input id="churchName" type="text" value={churchName} onChange={e => setChurchName(e.target.value)} required className="mt-1 block w-full input-style" placeholder="e.g., Grace Cathedral"/>
            </div>
            <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="mt-1 block w-full input-style" placeholder="e.g., 555-123-4567"/>
            </div>
             <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full input-style" placeholder="e.g., pastor.john@email.com"/>
            </div>
             <div>
                <label htmlFor="password"ria-label="Password for new account" className="block text-sm font-medium text-gray-700">Password</label>
                <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full input-style" placeholder="Choose a secure password"/>
            </div>
             <button type="submit" disabled={isLoading} className="w-full btn-primary">
                {isLoading ? 'Creating...' : 'Create & Login'}
             </button>
             <button type="button" onClick={onBack} className="w-full btn-secondary">Back</button>
        </form>
    );
};

interface LoginViewProps extends ViewProps {
    isAdminLogin: boolean;
}
const LoginView: React.FC<LoginViewProps> = ({ onBack, isAdminLogin }) => {
    const { login } = useAuth();
    const [churches, setChurches] = useState<Church[]>([]);
    const [selectedChurchId, setSelectedChurchId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    useEffect(() => {
        db.getChurches().then(data => {
            setChurches(data);
            setIsLoading(false);
        });
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChurchId || !email || !password) {
            setError('Please select a church and enter your credentials.');
            return;
        }
        setError(null);
        setIsLoggingIn(true);
        
        const userToLogin = await db.authenticateUser(selectedChurchId, email, password);
        
        setIsLoggingIn(false);

        if (userToLogin) {
            const isUserAdmin = userToLogin.role === UserRole.SuperAdmin;
            if (isAdminLogin && !isUserAdmin) {
                 setError('This user is not an admin. Please use the worker login.');
            } else if (!isAdminLogin && isUserAdmin) {
                 setError('Admins must use the Pastor/Admin login.');
            } else {
                login(userToLogin);
            }
        } else {
            setError('Invalid email or password.');
        }
    };

    return (
        <form onSubmit={handleLogin} className="space-y-4">
             <div>
                <label htmlFor="church-select" className="block text-sm font-medium text-gray-700">Select Church</label>
                <select id="church-select" value={selectedChurchId} onChange={e => setSelectedChurchId(e.target.value)} className="mt-1 block w-full input-style" disabled={isLoading}>
                    <option value="">{isLoading ? 'Loading churches...' : 'Select a church'}</option>
                    {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
             </div>
             <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full input-style" placeholder="your.email@example.com" disabled={!selectedChurchId} />
            </div>
             <div>
                <label htmlFor="login-password"aria-label="Password for login" className="block text-sm font-medium text-gray-700">Password</label>
                <input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full input-style" placeholder="Your password" disabled={!selectedChurchId} />
            </div>
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
             <button type="submit" disabled={!selectedChurchId || isLoggingIn} className="w-full btn-primary">
                {isLoggingIn ? 'Logging in...' : 'Login'}
             </button>
             <button type="button" onClick={onBack} className="w-full btn-secondary">Back</button>
        </form>
    );
}

const WorkerLoginRegisterView: React.FC<ViewProps> = ({ onBack }) => {
    const { login } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    
    // Common state
    const [churches, setChurches] = useState<Church[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedChurchId, setSelectedChurchId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form fields state
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        db.getChurches().then(data => {
            setChurches(data);
            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        if (selectedChurchId) {
            db.getUnits(selectedChurchId).then(setUnits);
            // Reset unit selection when church changes
            setSelectedUnitIds([]);
        } else {
            setUnits([]);
        }
    }, [selectedChurchId]);

    const handleUnitSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
        const unitId = e.target.value;
        setSelectedUnitIds(prev => 
            e.target.checked ? [...prev, unitId] : prev.filter(id => id !== unitId)
        );
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChurchId || !email || !password) {
            setError('Please select a church and enter your credentials.');
            return;
        }
        setError(null);
        setIsSubmitting(true);
        const userToLogin = await db.authenticateUser(selectedChurchId, email, password);
        setIsSubmitting(false);

        if (userToLogin) {
            if (userToLogin.role === UserRole.SuperAdmin) {
                setError('Admins must use the Pastor/Admin login.');
            } else {
                login(userToLogin);
            }
        } else {
            setError('Invalid email or password.');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChurchId || !fullName || !phone || !email || !password) {
            setError('Please fill in all required fields.');
            return;
        }
        setError(null);
        setIsSubmitting(true);
        const newUser = await db.addUser(selectedChurchId, fullName, phone, email, password, UserRole.GeneralMember, selectedUnitIds);
        setIsSubmitting(false);
        if (newUser) {
            login(newUser); // Auto-login after registration
        } else {
            setError('Registration failed. Please try again.');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-center rounded-md shadow-sm">
                <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`px-4 py-2 text-sm font-medium ${mode === 'login' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} rounded-l-md border border-gray-300 focus:z-10 focus:ring-2 focus:ring-primary focus:border-primary`}
                >
                    Login
                </button>
                <button
                    type="button"
                    onClick={() => setMode('register')}
                    className={`-ml-px px-4 py-2 text-sm font-medium ${mode === 'register' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} rounded-r-md border border-gray-300 focus:z-10 focus:ring-2 focus:ring-primary focus:border-primary`}
                >
                    Register
                </button>
            </div>

            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                 <div>
                    <label htmlFor="church-select" className="block text-sm font-medium text-gray-700">Select Your Church</label>
                    <select id="church-select" value={selectedChurchId} onChange={e => setSelectedChurchId(e.target.value)} className="mt-1 block w-full input-style" disabled={isLoading}>
                        <option value="">{isLoading ? 'Loading churches...' : 'Select a church'}</option>
                        {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                
                {mode === 'register' && (
                    <>
                        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="input-style" placeholder="Full Name"/>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="input-style" placeholder="Phone Number"/>
                    </>
                )}

                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input-style" placeholder="Email Address" disabled={!selectedChurchId}/>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="input-style" placeholder="Password" disabled={!selectedChurchId}/>
                
                {mode === 'register' && units.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Select Your Unit(s)</label>
                        <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                            {units.map(unit => (
                                <label key={unit.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        value={unit.id}
                                        checked={selectedUnitIds.includes(unit.id)}
                                        onChange={handleUnitSelection}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">{unit.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
                
                {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                <button type="submit" disabled={!selectedChurchId || isSubmitting} className="w-full btn-primary">
                    {isSubmitting ? 'Submitting...' : (mode === 'login' ? 'Login' : 'Register & Login')}
                </button>
                <button type="button" onClick={onBack} className="w-full btn-secondary">Back</button>
            </form>
        </div>
    );
}


// Add CSS-in-JS for shared styles to avoid repetition in Tailwind classes
const styles = `
    .input-style {
        border-radius: 0.375rem;
        border-width: 1px;
        border-color: #D1D5DB;
        padding: 0.5rem 0.75rem;
        width: 100%;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        color: #212529; /* dark-text color */
    }
    .input-style:focus {
        outline: 2px solid transparent;
        outline-offset: 2px;
        --tw-ring-color: #0D47A1;
        box-shadow: 0 0 0 2px var(--tw-ring-color);
        border-color: #0D47A1;
    }
    .input-style:disabled {
        background-color: #F3F4F6;
        cursor: not-allowed;
    }
    .btn-primary {
        display: flex;
        justify-content: center;
        padding: 0.75rem 1rem;
        border: 1px solid transparent;
        border-radius: 0.375rem;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        font-size: 0.875rem;
        font-weight: 500;
        color: white;
        background-color: #0D47A1;
        transition: background-color 0.15s ease-in-out;
    }
    .btn-primary:hover {
        background-color: #0B3B84;
    }
    .btn-primary:disabled {
        background-color: #6B7280;
        cursor: not-allowed;
    }
    .btn-secondary {
         display: flex;
        justify-content: center;
        padding: 0.75rem 1rem;
        border: 1px solid #D1D5DB;
        border-radius: 0.375rem;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        background-color: white;
        transition: background-color 0.15s ease-in-out;
    }
    .btn-secondary:hover {
        background-color: #F9FAFB;
    }
`;

const StyleInjector: React.FC = () => <style>{styles}</style>;


const EnhancedLoginScreen: React.FC = () => (
    <>
        <StyleInjector />
        <LoginScreen />
    </>
);

export default EnhancedLoginScreen;