import React, { useState, useEffect } from 'react';
import { useProject } from '../store/ProjectContext';
import { Zap, Mail, Lock, User, Building, ArrowRight, Loader2, ArrowLeft, Building2, UserPlus, Gift } from 'lucide-react';

export const Auth: React.FC = () => {
  const { login, signup, signupWithInvite, resetPassword, isLoading, acceptInvite, showToast } = useProject();
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT' | 'INVITE_SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState<string>('');

  // Check for invite token in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('invite');
    const invitedEmail = urlParams.get('email');
    
    if (token) {
      setInviteToken(token);
      if (invitedEmail) {
        setInviteEmail(invitedEmail);
        setEmail(invitedEmail);
      }
      setMode('INVITE_SIGNUP');
      // Clean URL without reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    if (mode === 'LOGIN') {
      await login(email, password);
    } else if (mode === 'SIGNUP') {
      // New user creating their own organization
      await signup(name, email, workspaceName, 'Founder', password, orgName);
    } else if (mode === 'INVITE_SIGNUP') {
      // Invited user - create account and accept invite
      if (!inviteToken) {
        showToast("Invalid invite link", "error");
        return;
      }
      await signupWithInvite(name, email, password, inviteToken);
    } else if (mode === 'FORGOT') {
      await resetPassword(email);
    }
  };

  // Invited user signup form (simpler - no org/workspace creation)
  if (mode === 'INVITE_SIGNUP') {
    return (
      <div className="min-h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-white overflow-y-auto overflow-x-hidden">
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="min-h-full w-full flex flex-col items-center justify-center py-12 px-6 relative z-10">
          <div className="w-full max-w-md">
            <div className="mb-10 text-center animate-fade-in-up">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/30 mb-6">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">You're Invited!</h1>
              <p className="text-lg text-slate-500">Create your account to join the team</p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 w-full animate-fade-in-up delay-100">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 ml-1">Full Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      required 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 ml-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input 
                      type="email" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!!inviteEmail} // Lock if email came from invite
                      className={`block w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm ${inviteEmail ? 'bg-slate-50' : ''}`}
                      placeholder="name@company.com"
                    />
                  </div>
                  {inviteEmail && (
                    <p className="text-xs text-slate-400 mt-1 ml-1">This email was specified in your invite</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 ml-1">Create Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input 
                      type="password" 
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className={`w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 transform transition-all active:scale-[0.98] flex items-center justify-center space-x-2 mt-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      <span>Join Team</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-center text-sm text-slate-500">
                  Already have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => { setMode('LOGIN'); setInviteToken(null); }}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-white overflow-y-auto overflow-x-hidden">
      
      {/* Decorative background elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
      </div>

      {/* Scrollable Content Container */}
      <div className="min-h-full w-full flex flex-col items-center justify-center py-12 px-6 relative z-10">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-6 transform hover:rotate-6 transition-transform duration-300">
              <Zap className="w-8 h-8 text-white" fill="currentColor" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">VibeTrack</h1>
            <p className="text-lg text-slate-500">Manage projects at the speed of thought.</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 w-full animate-fade-in-up delay-100">
            
            {/* Toggle Switch */}
            {mode !== 'FORGOT' && (
                <div className="bg-slate-100/80 p-1.5 rounded-xl flex mb-8 relative">
                <button 
                    type="button"
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 z-10 ${mode === 'LOGIN' ? 'text-indigo-900 shadow-sm bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setMode('LOGIN')}
                >
                    Log In
                </button>
                <button 
                    type="button"
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 z-10 ${mode === 'SIGNUP' ? 'text-indigo-900 shadow-sm bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setMode('SIGNUP')}
                >
                    Sign Up
                </button>
                </div>
            )}

            {mode === 'FORGOT' && (
                <div className="mb-8 text-center animate-fade-in-up">
                    <h3 className="text-xl font-bold text-slate-800">Reset Password</h3>
                    <p className="text-sm text-slate-500 mt-2">Enter your email to receive a reset link.</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'SIGNUP' && (
                <div className="space-y-5 animate-fade-in-up">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 ml-1">Full Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input 
                        type="text" 
                        required 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 ml-1">Organization Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input 
                        type="text" 
                        required 
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                        placeholder="Acme Inc."
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 ml-1">Your organization is the top-level container for all workspaces</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 ml-1">First Workspace</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input 
                        type="text" 
                        required 
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                        placeholder="Product Team"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 ml-1">Create your first workspace within the organization</p>
                  </div>
                  
                  {/* Info: User will be Organization Founder */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                    <p className="text-xs text-indigo-700 font-medium">✨ You'll be the Organization Founder with full admin access</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              {mode !== 'FORGOT' && (
                <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 ml-1">Password</label>
                    <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input 
                        type="password" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                        placeholder="••••••••"
                    />
                    </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 transform transition-all active:scale-[0.98] flex items-center justify-center space-x-2 mt-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                    </>
                ) : (
                    <>
                        <span>{mode === 'LOGIN' ? 'Sign In' : mode === 'SIGNUP' ? 'Create Account' : 'Send Reset Link'}</span>
                        <ArrowRight className="w-5 h-5" />
                    </>
                )}
              </button>
            </form>

            {mode === 'LOGIN' && (
              <p className="mt-6 text-center text-sm text-slate-400">
                Forgot your password? <button type="button" onClick={() => setMode('FORGOT')} className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline">Reset here</button>
              </p>
            )}

            {mode === 'FORGOT' && (
                <button 
                    type="button" 
                    onClick={() => setMode('LOGIN')}
                    className="w-full mt-6 text-sm text-slate-500 hover:text-slate-800 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign In
                </button>
            )}
          </div>
          
          <p className="mt-8 text-center text-sm text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} VibeTrack. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};