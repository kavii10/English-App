import React, { useState, useEffect } from 'react';
import {
  Key,
  Mic,
  Volume2,
  Trash2,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Sliders,
  Shield,
  User,
  LogIn,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useAudioVisualizer } from '../../hooks/useAudioVisualizer';
import { api } from '../../services/api';
import { useToast } from '../common/Toast';
import { UserProfile } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onDataReset,
  user,
  onOpenAuth,
  onLogout,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keyStatusMessage, setKeyStatusMessage] = useState<string | null>(null);

  // Mic test
  const [isTestingMic, setIsTestingMic] = useState(false);
  const { audioLevel, frequencyData } = useAudioVisualizer(isTestingMic);

  // Speech TTS settings
  const {
    voices,
    selectedVoice,
    setSelectedVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    speak,
  } = useSpeechSynthesis();

  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      setHasApiKey(res.has_gemini_api_key);
      setMaskedKey(res.masked_api_key || '');
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    setIsSavingKey(true);
    setKeyStatusMessage(null);

    try {
      const res = await api.saveGeminiApiKey(apiKeyInput.trim());
      setHasApiKey(true);
      setMaskedKey(`${apiKeyInput.slice(0, 6)}...${apiKeyInput.slice(-4)}`);
      setApiKeyInput('');
      setKeyStatusMessage('✅ Gemini API connected and verified successfully!');
      showToast('Gemini API Key saved!', 'success');
    } catch (err: any) {
      setKeyStatusMessage(`❌ ${err.message || 'Failed to authenticate key.'}`);
      showToast('Invalid API Key', 'error');
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all conversation history?')) return;
    try {
      const activeUserId = user?.id || localStorage.getItem('speakwise_user_id') || 'usr_default';
      await api.clearConversationHistory(activeUserId);
      showToast('Speaking history cleared', 'info');
      onDataReset();
    } catch (err) {
      showToast('Failed to clear history', 'error');
    }
  };

  const handleResetMistakes = async () => {
    if (!window.confirm('Are you sure you want to reset weakness tracking?')) return;
    try {
      const activeUserId = user?.id || localStorage.getItem('speakwise_user_id') || 'usr_default';
      await api.resetMistakes(activeUserId);
      showToast('Weakness tracking reset', 'info');
      onDataReset();
    } catch (err) {
      showToast('Failed to reset weaknesses', 'error');
    }
  };

  const handleResetFlashcards = async () => {
    if (!window.confirm('Are you sure you want to reset vocabulary flashcards progress?')) return;
    try {
      const activeUserId = user?.id || localStorage.getItem('speakwise_user_id') || 'usr_default';
      await api.resetFlashcards(activeUserId);
      showToast('Flashcard progress reset', 'info');
      onDataReset();
    } catch (err) {
      showToast('Failed to reset flashcards', 'error');
    }
  };

  const handleExportData = async () => {
    try {
      const activeUserId = user?.id || localStorage.getItem('speakwise_user_id') || 'usr_default';
      const data = await api.exportLearningData(activeUserId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `speakwise_learning_data_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Learning data exported successfully!', 'success');
    } catch (err) {
      showToast('Failed to export data', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings & Preferences" maxWidth="2xl">
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* 1. Account & Profile / Cloud Sync Section */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-extrabold text-white">Account & Cloud Sync</h3>
            </div>
            {user?.email ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Cloud Synced</span>
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Guest Mode
              </span>
            )}
          </div>

          {user?.email ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">{user.name}</div>
                <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                <div className="text-[10px] text-indigo-400 font-semibold pt-0.5">
                  Level: {user.level || 'Intermediate'} • Streak: {user.streak ?? 0} days
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    showToast('Logged out successfully', 'info');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">Sign In to Save Your Progress</div>
                <p className="text-[11px] text-slate-400">
                  Sync all your speaking diagnostics, vocabulary cards, and streaks to Supabase cloud.
                </p>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold shadow-md transition-all shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. Google Gemini API Key Setup */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-extrabold text-white">Google Gemini API Key</h3>
            </div>
            {hasApiKey ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Configured ({maskedKey})</span>
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Default / Cloud Engine Active</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400">
            Enter your Google AI Studio Gemini API Key for high-speed AI speaking analysis. (The key is stored safely in your backend and never exposed).
          </p>

          <div className="flex gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={hasApiKey ? 'Enter new key to update...' : 'AIzaSy...'}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSaveApiKey}
              disabled={!apiKeyInput.trim() || isSavingKey}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50 transition-all shrink-0"
            >
              {isSavingKey ? 'Verifying...' : 'Save & Test'}
            </button>
          </div>

          {keyStatusMessage && (
            <p className="text-xs font-medium text-slate-200 mt-1">{keyStatusMessage}</p>
          )}
        </div>

        {/* 3. AI Voice & TTS Tuning */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-extrabold text-white">AI Voice & Audio Pronunciation</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Select Natural English Voice:</label>
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const v = voices.find((item) => item.name === e.target.value);
                  setSelectedVoice(v || null);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {voices
                  .filter((v) => v.lang.startsWith('en'))
                  .map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Speaking Rate</span>
                  <span className="font-mono">{rate}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.3"
                  step="0.05"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Pitch</span>
                  <span className="font-mono">{pitch}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.05"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={() => speak('Hello! Great to practice spoken English with you today.')}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200"
            >
              🔊 Test AI Voice
            </button>
          </div>
        </div>

        {/* 4. Microphone Input Diagnostic */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-extrabold text-white">Microphone Diagnostic</h3>
          </div>

          <p className="text-xs text-slate-400">
            Speak into your microphone to verify that audio frequencies and volume levels are detected properly.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTestingMic(!isTestingMic)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isTestingMic
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
            >
              {isTestingMic ? 'Stop Test' : 'Test Microphone Live'}
            </button>

            {isTestingMic && (
              <div className="flex-1 bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="bg-emerald-500 h-full transition-all duration-75"
                  style={{ width: `${Math.min(100, audioLevel * 2.5)}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* 5. Data Privacy & Reset Controls */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-rose-500/20 space-y-3">
          <div className="flex items-center gap-2 text-rose-400">
            <Shield className="w-5 h-5" />
            <h3 className="text-sm font-extrabold">Data Privacy & Management</h3>
          </div>

          <p className="text-xs text-slate-400">
            Export your learning progress or reset history anytime. All your learning data is 100% under your control.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
            <button
              onClick={handleExportData}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Export Learning JSON</span>
            </button>

            <button
              onClick={handleClearHistory}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/30 text-rose-300 font-bold flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear History</span>
            </button>

            <button
              onClick={handleResetMistakes}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Reset Weaknesses</span>
            </button>

            <button
              onClick={handleResetFlashcards}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-purple-400" />
              <span>Reset Flashcards</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
