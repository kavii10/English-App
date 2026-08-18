import React, { useState } from 'react';
import { User, Mail, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, LogIn, LogOut, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { UserProfile } from '../../types';
import { api } from '../../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout?: () => void;
  currentUser: UserProfile | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onLogout,
  currentUser,
}) => {
  const [name, setName] = useState<string>(currentUser?.name || '');
  const [email, setEmail] = useState<string>(currentUser?.email || '');
  const [level, setLevel] = useState<string>(currentUser?.level || 'Intermediate');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.loginOrRegister({
        name: name.trim() || 'Learner',
        email: email.trim().toLowerCase(),
        level,
      });

      if (res.user) {
        localStorage.setItem('speakwise_user_id', res.user.id);
        localStorage.setItem('speakwise_user_email', res.user.email || '');
        localStorage.setItem('speakwise_user_name', res.user.name);
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutClick = () => {
    localStorage.removeItem('speakwise_user_id');
    localStorage.removeItem('speakwise_user_email');
    localStorage.removeItem('speakwise_user_name');
    if (onLogout) {
      onLogout();
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentUser?.email ? 'Account & Profile' : 'Sign In to SpeakWise AI'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="text-center space-y-1.5 pb-1">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {currentUser?.email ? `Signed in as ${currentUser.name}` : 'Connect Your Progress'}
          </h3>
          <p className="text-xs text-slate-400">
            {currentUser?.email
              ? 'You will remain securely signed in on this device until you choose to log out.'
              : 'Your conversations, mistakes, and vocabulary flashcards are synced securely to the cloud.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 text-center">
            {error}
          </div>
        )}

        <div className="space-y-3.5">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Your Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Level Field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">English Proficiency Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Beginner">Beginner (Foundations & Simple Sentences)</option>
              <option value="Intermediate">Intermediate (Conversational English)</option>
              <option value="Advanced">Advanced (Workplace & Executive Fluency)</option>
            </select>
          </div>
        </div>

        {/* Submit CTA & Logout Actions */}
        <div className="space-y-2 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>{currentUser?.email ? 'Update Profile' : 'Sign In / Connect Account'}</span>
              </>
            )}
          </button>

          {currentUser?.email && (
            <button
              type="button"
              onClick={handleLogoutClick}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 text-xs font-bold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out of this Account</span>
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};
