import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { askReportChatbot } from '@/lib/ai/chatbot.functions';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ReportChatbotProps {
  reportContent: string;
  analysisType: string;
  isOpen: boolean;
  onClose: () => void;
  /** Called when the user clicks a citation; receives the citation text so the dashboard can highlight & scroll to it. */
  onCitationClick?: (quote: string) => void;
}

const ReportChatbot: React.FC<ReportChatbotProps> = ({
  reportContent,
  analysisType,
  isOpen,
  onClose,
  onCitationClick
}) => {
  const { theme } = useTheme();
  const isDark = theme.isDark;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'سلام! من دستیار هوشمند گزارش شما هستم. هر سوالی درباره گزارش تحلیل دارید بپرسید.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== '1')
        .map((m) => ({ role: m.role, content: m.content }));

      const result = await askReportChatbot({
        data: {
          reportContent,
          analysisType,
          history,
          question: userMessage.content,
        },
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.text || 'متأسفانه پاسخی دریافت نشد.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errMsg = error instanceof Error ? error.message : 'متأسفانه خطایی رخ داد. لطفاً دوباره تلاش کنید.';
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errMsg,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    'خلاصه مهم‌ترین نکات؟',
    'علل اصلی تاخیر چیست؟',
    'مبالغ خسارت چقدر است؟',
    'نتیجه‌گیری کلی؟'
  ];

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 backdrop-blur-sm overflow-y-auto ${isDark ? 'bg-black/60' : 'bg-slate-900/40'}`}>
      {/* Always-visible floating close button (works even when scrolled / zoomed) */}
      <button
        onClick={onClose}
        aria-label="بستن"
        className="fixed top-3 left-3 z-[60] w-11 h-11 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40 flex items-center justify-center transition-all active:scale-95"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-2 border ${
        isDark
          ? 'bg-[#0a0a0f] border-slate-700/50 shadow-violet-500/10'
          : 'bg-white border-slate-200 shadow-indigo-500/10'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between shrink-0 border-b ${
          isDark
            ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-slate-700/50'
            : 'bg-gradient-to-r from-violet-50 to-indigo-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>دستیار هوشمند گزارش</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>سوالات خود را درباره گزارش بپرسید</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-700/50 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>


        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[300px]">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : isDark
                      ? 'bg-slate-800/80 text-slate-200 border border-slate-700/50'
                      : 'bg-slate-50 text-slate-800 border border-slate-200'
                }`}
              >
                {message.role === 'assistant'
                  ? (() => {
                      const text = message.content;
                      const match = text.match(/استناد\s*[::]/);
                      if (!match) {
                        return <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>;
                      }
                      const idx = match.index!;
                      const answer = text.slice(0, idx).replace(/^پاسخ\s*[::]\s*/, '').trim();
                      const cites = text.slice(idx + match[0].length).trim();
                      const citeLines = cites.split('\n').map(l => l.trim()).filter(Boolean);
                      return (
                        <div className="space-y-2">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{answer}</p>
                          <div className="mt-2 pt-2 border-t border-violet-500/20">
                            <div className="text-[10px] font-black text-violet-300 mb-1.5 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              استناد به گزارش
                            </div>
                            <ul className="space-y-1">
                              {citeLines.map((c, i) => {
                                const clean = c.replace(/^[•\-\*]\s*/, '');
                                // extract the «...» quote (or fallback to the whole line)
                                const m = clean.match(/[«"](.+?)[»"]/);
                                const quote = (m ? m[1] : clean).trim();
                                return (
                                  <li key={i}>
                                    <button
                                      type="button"
                                      onClick={() => onCitationClick?.(quote)}
                                      title="نمایش این بخش در گزارش داشبورد"
                                      className={`group w-full text-right text-[11px] leading-relaxed border-r-2 pr-2 pl-2 py-1.5 rounded transition-colors flex items-start gap-1.5 ${
                                        isDark
                                          ? 'text-slate-200 bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/60 hover:border-violet-400'
                                          : 'text-slate-700 bg-violet-50 hover:bg-violet-100 border-violet-400 hover:border-violet-500'
                                      }`}
                                    >
                                      <svg className={`w-3 h-3 mt-0.5 shrink-0 ${isDark ? 'text-violet-400 group-hover:text-violet-300' : 'text-violet-600 group-hover:text-violet-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                      </svg>
                                      <span className="flex-1">{clean}</span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      );
                    })()
                  : <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                }
                <p className={`text-[10px] mt-1 ${message.role === 'user' ? 'text-violet-200' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {message.timestamp.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-end">
              <div className={`rounded-2xl px-4 py-3 border ${
                isDark ? 'bg-slate-800/80 text-slate-200 border-slate-700/50' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>در حال پردازش...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        <div className={`px-6 py-3 border-t shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setInputValue(q)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  isDark
                    ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white border-slate-700/50'
                    : 'bg-slate-50 hover:bg-violet-50 text-slate-600 hover:text-violet-700 border-slate-200 hover:border-violet-300'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className={`p-4 border-t shrink-0 ${isDark ? 'border-slate-800 bg-[#0a0a0f]' : 'border-slate-200 bg-white'}`}>
          <div className={`flex items-stretch gap-2 rounded-2xl border overflow-hidden focus-within:ring-2 focus-within:ring-violet-500/40 ${
            isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-300'
          }`}>
            <input
              ref={inputRef}
              type="text"
              dir="rtl"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="سوال خود را بنویسید..."
              className={`flex-1 bg-transparent px-4 py-3 text-sm font-medium focus:outline-none ${
                isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
              }`}
              style={{ fontFamily: 'inherit' }}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className={`px-5 my-1 ml-1 rounded-xl font-bold text-white text-sm transition-all flex items-center gap-2 shrink-0 ${
                isLoading || !inputValue.trim()
                  ? 'bg-violet-600/40 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.98]'
              }`}
              style={{ fontFamily: 'inherit' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              ارسال
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportChatbot;

