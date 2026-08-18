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
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useAudioVisualizer } from '../../hooks/useAudioVisualizer';
import { api } from '../../services/api';
import { useToast } from '../common/Toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onDataReset,
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
      await api.clearConversationHistory();
      showToast('Speaking history cleared', 'info');
      onDataReset();
    } catch (err) {
      showToast('Failed to clear history', 'error');
    }
  };

  const handleResetMistakes = async () => {
    if (!window.confirm('Are you sure you want to reset weakness tracking?')) return;
    try {
      await api.resetMistakes();
      showToast('Weakness tracking reset', 'info');
      onDataReset();
    } catch (err) {
      showToast('Failed to reset weaknesses', 'error');
    }
  };

  const handleResetFlashcards = async () => {
    if (!window.confirm('Are you sure you want to reset vocabulary flashcards progress?')) return;
    try {
      await api.resetFlashcards();
      showToast('Flashcard progress reset', 'info');
      onDataReset();
    } catch (err) {
      showToast('Failed to reset flashcards', 'error');
    }
  };

  const handleExportData = async () => {
    try {
      const data = await api.exportLearningData();
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
        {/* 1. Google Gemini API Key Setup */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-500/30 space-y-3">
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
                <span>Default / Offline Engine Active</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400">
            Enter your Google AI Studio Gemini API Key for high-speed AI speaking analysis. (The key is stored safely in your local session/backend and never exposed).
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

        {/* 2. AI Voice & TTS Tuning */}
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
                  const v = voices.find((voice) => voice.name === e.target.value);
                  if (v) setSelectedVoice(v);
                }}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
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
                  <span>Speaking Rate:</span>
                  <span className="font-bold text-white">{rate}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.05"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Pitch:</span>
                  <span className="font-bold text-white">{pitch}</span>
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
              onClick={() => speak('Hello! This is SpeakWise AI, your personal English speaking coach.')}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Test Voice Preview</span>
            </button>
          </div>
        </div>

        {/* 3. Microphone Hardware & Permission Test */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-extrabold text-white">Microphone Input Level Test</h3>
            </div>
            <button
              onClick={() => setIsTestingMic(!isTestingMic)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                isTestingMic
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isTestingMic ? 'Stop Test' : 'Test Microphone'}
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Speak a sentence into your microphone to verify audio capture sensitivity.
          </p>

          {isTestingMic && (
            <div className="space-y-2 pt-2 animate-fadeIn">
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-rose-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, audioLevel * 250)}%` }}
                />
              </div>
              <div className="text-[10px] text-center text-slate-400 font-mono">
                Input Level: {Math.round(audioLevel * 100)}%
              </div>
            </div>
          )}
        </div>

        {/* 4. Privacy & Data Management */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-extrabold text-white">Privacy & Learning Data</h3>
          </div>

          <p className="text-xs text-slate-400">
            Your conversations and speaking transcripts are stored locally in your private database. You can export or clear your data at any time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={handleExportData}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Export Learning Data (.json)</span>
            </button>

            <button
              onClick={handleClearHistory}
              className="p-3 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-rose-300 text-xs font-bold border border-slate-800 hover:border-rose-500/30 flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Clear Conversation History</span>
            </button>

            <button
              onClick={handleResetMistakes}
              className="p-3 rounded-xl bg-slate-900 hover:bg-amber-950/40 text-amber-300 text-xs font-bold border border-slate-800 hover:border-amber-500/30 flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Reset Weakness Catalog</span>
            </button>

            <button
              onClick={handleResetFlashcards}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-purple-400" />
              <span>Reset Flashcard SRS Stats</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
