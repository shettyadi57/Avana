import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Bot, 
  User, 
  ShieldCheck, 
  Scale, 
  LifeBuoy,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  AlertTriangle
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from '../types';
import { cn } from '../lib/utils';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Speech Recognition Type
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "I am Avana Guardian AI, your elite safety and legal protector. I am specialized in women's safety, self-defense, and legal rights. How can I assist you in staying safe today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(undefined, transcript);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const speak = (text: string) => {
    if (!autoSpeak) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  const handleSend = async (e?: React.FormEvent, overrideInput?: string) => {
    if (e) e.preventDefault();
    const userMsg = overrideInput || input.trim();
    if (!userMsg || loading) return;

    if (!overrideInput) setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: userMsg,
        config: {
          systemInstruction: `You are 'Avana Guardian AI', an elite, powerful, and highly specialized safety assistant for women. 
          Your primary mission is the protection, legal empowerment, and safety of women.
          
          CORE CAPABILITIES:
          1. LEGAL RIGHTS: Provide expert-level knowledge on laws protecting women (e.g., POSH Act, Domestic Violence Act, Right to Zero FIR in India).
          2. EMERGENCY PROCEDURES: Give clear, tactical advice for dangerous situations (being followed, trapped in a cab, domestic threats).
          3. SELF-DEFENSE: Offer practical, effective self-defense tips.
          4. EMPATHY & STRENGTH: Be supportive but firm. You are a protector.
          
          STRICT RULES:
          - If the user is in immediate danger, start your response with: "🚨 EMERGENCY DETECTED: PLEASE TRIGGER THE SOS BUTTON NOW OR CALL 112."
          - Never give generic advice. Be specific and tactical.
          - Support English and Hindi fluently.
          - Your tone is professional, authoritative, and protective.`,
        }
      });

      const botText = response.text || "I apologize, I encountered a processing error. Please repeat your request.";
      setMessages(prev => [...prev, { role: 'model', text: botText }]);
      speak(botText);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Connection error. I am still standing by. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "I'm being followed, help!",
    "Legal rights against harassment",
    "How to use Zero FIR?",
    "Safety tips for night travel"
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-slate-950 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-slate-900/40 backdrop-blur-xl flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.4)]">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Avana Guardian AI</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-widest text-green-400">Elite Safety Protocol Active</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setAutoSpeak(!autoSpeak)}
            className={cn(
              "p-3 rounded-xl transition-all border",
              autoSpeak ? "bg-purple-600/20 border-purple-500/30 text-purple-400" : "bg-slate-800 border-white/5 text-slate-500"
            )}
          >
            {autoSpeak ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-white/5 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Encrypted
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex gap-4 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
              msg.role === 'user' ? "bg-purple-600" : "bg-slate-800 border border-white/10"
            )}>
              {msg.role === 'user' ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-purple-400" />}
            </div>
            <div className={cn(
              "p-5 rounded-[1.5rem] text-sm leading-relaxed shadow-xl",
              msg.role === 'user' 
                ? "bg-purple-600 text-white rounded-tr-none" 
                : "bg-slate-900/80 border border-white/5 text-slate-200 rounded-tl-none backdrop-blur-sm"
            )}>
              {msg.text}
              {msg.text.includes('🚨') && (
                <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 font-bold">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  Immediate Danger Detected
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex gap-4 mr-auto">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
              <Bot className="w-6 h-6 text-purple-400" />
            </div>
            <div className="bg-slate-900/80 border border-white/5 p-5 rounded-[1.5rem] rounded-tl-none">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-8 border-t border-white/5 bg-slate-900/40 backdrop-blur-xl">
        {messages.length < 3 && (
          <div className="flex flex-wrap gap-3 mb-6">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => { setInput(s); }}
                className="text-[10px] font-black uppercase tracking-widest px-5 py-2.5 bg-slate-900 border border-white/5 rounded-full text-slate-400 hover:border-purple-500/50 hover:text-purple-400 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSend} className="relative flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Speak or type your safety concern..."
              className="w-full bg-slate-950 border border-white/10 rounded-2xl py-5 pl-7 pr-16 text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all placeholder:text-slate-600 font-medium"
            />
            <button
              type="button"
              onClick={toggleListening}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all",
                isListening ? "bg-red-500 text-white animate-pulse" : "text-slate-500 hover:text-white"
              )}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 hover:scale-105 active:scale-95 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl flex items-center justify-center transition-all shadow-xl shrink-0"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
        
        <div className="mt-6 flex items-center justify-center gap-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-purple-500" />
            Legal Empowerment
          </div>
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-blue-500" />
            Tactical Safety
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Proactive Defense
          </div>
        </div>
      </div>
    </div>
  );
}
