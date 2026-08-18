import React from 'react';
import { Sparkles, MessageSquare, Headphones, BookOpen, BarChart3, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSettings: () => void;
}

export const MobileTabBar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Sparkles },
    { id: 'speaking', label: 'Practice', icon: MessageSquare },
    { id: 'hands-free', label: 'Hands-Free', icon: Headphones },
    { id: 'vocabulary', label: 'Vocab', icon: BookOpen },
    { id: 'analytics', label: 'Progress', icon: BarChart3 },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 px-3 py-2 flex items-center justify-around shadow-2xl safe-bottom">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ${
              isActive
                ? 'text-indigo-400 bg-indigo-500/10 font-bold'
                : 'text-slate-400 hover:text-slate-200 active:scale-95'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'scale-110 text-indigo-400' : ''}`} />
            <span className="text-[10px] font-semibold">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
