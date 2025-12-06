import React, { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { Zap, Mail, Lock, User, Building, ArrowRight, Loader2, ArrowLeft, Building2, Users, Shield, Hash } from 'lucide-react';

type LoginMode = 'admin' | 'member';
type AuthMode = 'LOGIN' | 'SIGNUP' | 'FORGOT';

export const Auth: React.FC = () => {
  const { login, memberLogin, signup, resetPassword, isLoading, showToast } = useProject();
  
  // Login mode selection
  const [loginMode, setLoginMode] = useState<LoginMode>('admin');
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  
  // Admin login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Member login fields
  const [scopeCode, setScopeCode] = useState('');  // e.g., "ORG-1234"
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  
  // Signup fields (for admins/founders only)
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    if (mode === 'LOGIN') {
      if (loginMode === 'admin') {
        // Admin/Founder login via Supabase Auth
        await login(email, password);
      } else {
        // Team member login via custom auth
        if (!scopeCode.trim()) {
          showToast("Please enter your Entity ID", "error");
          return;
        }
        await memberLogin(memberEmail, memberPassword, scopeCode.trim().toUpperCase());
      }
    } else if (mode === 'SIGNUP') {
      // Only admins/founders can signup (they create their organization)
      await signup(name, email, workspaceName, 'Founder', password, orgName);
    } else if (mode === 'FORGOT') {
      await resetPassword(email);
    }
  };

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
          {/* Logo Header */}
          <div className="mb-10 text-center animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-6 transform hover:rotate-6 transition-transform duration-300">
              <Zap className="w-8 h-8 text-white" fill="currentColor" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">VibeTrack</h1>
            <p className="text-lg text-slate-500">Manage projects at the speed of thought.</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 w-full animate-fade-in-up delay-100">
            
            {/* Main Mode Toggle: Login vs Signup (only for admins) */}
            {mode !== 'FORGOT' && loginMode === 'admin' && (
              <div className="bg-slate-100/80 p-1.5 rounded-xl flex mb-6 relative">
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

            {/* Login Mode Selector: Admin vs Member */}
            {mode === 'LOGIN' && (
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 ml-1">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLoginMode('admin')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      loginMode === 'admin'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Shield className="w-6 h-6" />
                    <span className="text-sm font-semibold">Admin / Founder</span>
                    <span className="text-xs text-slate-400">Organization owner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMode('member')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      loginMode === 'member'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Users className="w-6 h-6" />
                    <span className="text-sm font-semibold">Team Member</span>
                    <span className="text-xs text-slate-400">Added by admin</span>
                  </button>
                </div>
              </div>
            )}

            {mode === 'FORGOT' && (
              <div className="mb-8 text-center animate-fade-in-up">
                <h3 className="text-xl font-bold text-slate-800">Reset Password</h3>
                <p className="text-sm text-slate-500 mt-2">Enter your email to receive a reset link.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* ============================================ */}
              {/* SIGNUP FORM (Admin/Founder Only) */}
              {/* ============================================ */}
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
                    <p className="text-xs text-slate-400 mt-1 ml-1">A unique ID will be generated for your organization</p>
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
                  </div>
                  
                  {/* Info box */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                    <p className="text-xs text-indigo-700 font-medium">
                      ✨ You'll be the Organization Founder. You can add team members after signup.
                    </p>
                  </div>
                </div>
              )}

              {/* ============================================ */}
              {/* ADMIN LOGIN FORM */}
              {/* ============================================ */}
              {mode === 'LOGIN' && loginMode === 'admin' && (
                <>
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
                        placeholder="admin@company.com"
                      />
                    </div>
                  </div>

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
                </>
              )}

              {/* ============================================ */}
              {/* MEMBER LOGIN FORM */}
              {/* ============================================ */}
              {mode === 'LOGIN' && loginMode === 'member' && (
                <div className="space-y-5 animate-fade-in-up">
                  {/* Scope Code (6-digit numeric) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 ml-1">
                      6-Digit Access Code
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      </div>
                      <input 
                        type="text" 
                        required 
                        maxLength={6}
                        pattern="[0-9]{6}"
                        value={scopeCode}
                        onChange={(e) => setScopeCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="block w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm font-mono text-center text-lg tracking-widest"
                        placeholder="123456"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 ml-1">Enter the 6-digit code provided by your admin</p>
                  </div>

                  {/* Member Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 ml-1">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      </div>
                      <input 
                        type="email" 
                        required 
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>

                  {/* Member Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 ml-1">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      </div>
                      <input 
                        type="password" 
                        required 
                        value={memberPassword}
                        onChange={(e) => setMemberPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                        placeholder="••••••••"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 ml-1">Use the password assigned by your admin</p>
                  </div>
                </div>
              )}

              {/* ============================================ */}
              {/* FORGOT PASSWORD FORM */}
              {/* ============================================ */}
              {mode === 'FORGOT' && (
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
                      placeholder="admin@company.com"
                    />
                  </div>
                </div>
              )}

              {/* Signup form email and password */}
              {mode === 'SIGNUP' && (
                <>
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
                        placeholder="admin@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 ml-1">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input 
                        type="password" 
                        required 
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full ${
                  mode === 'LOGIN' && loginMode === 'member'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-200'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-indigo-200'
                } text-white font-bold py-3.5 rounded-xl shadow-lg transform transition-all active:scale-[0.98] flex items-center justify-center space-x-2 mt-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === 'LOGIN' 
                        ? (loginMode === 'admin' ? 'Sign In as Admin' : 'Sign In as Member')
                        : mode === 'SIGNUP' 
                          ? 'Create Organization' 
                          : 'Send Reset Link'
                      }
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Links */}
            {mode === 'LOGIN' && loginMode === 'admin' && (
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
