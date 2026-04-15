import React, { useState, useEffect, useRef } from 'react';
import { db, collection, onSnapshot } from '../firebase';
import { Sparkles, Send, Bot, User, Brain, Zap, MessageSquare, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function AIAssistant() {
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch context from all collections to give the AI "sight" of the business
    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snap) => {
      const data = snap.docs.map(doc => doc.data());
      setContext(prev => ({ ...prev, employees: data }));
    });
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snap) => {
      const data = snap.docs.map(doc => doc.data());
      setContext(prev => ({ ...prev, invoices: data }));
    });
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      const data = snap.docs.map(doc => doc.data());
      setContext(prev => ({ ...prev, projects: data }));
    });
    return () => { unsubEmployees(); unsubInvoices(); unsubProjects(); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const systemInstruction = `
        أنت "ذكاء الربدي"، المساعد الذكي لمؤسسات الربدي. 
        لديك وصول إلى بيانات المؤسسة التالية:
        - الموظفين: ${JSON.stringify(context?.employees || [])}
        - الفواتير: ${JSON.stringify(context?.invoices || [])}
        - المشاريع: ${JSON.stringify(context?.projects || [])}
        
        مهمتك هي مساعدة الإدارة في تحليل البيانات، تقديم نصائح مالية، والإجابة على الاستفسارات حول شئون العمال والمشاريع.
        تحدث بلهجة احترافية وودودة وباللغة العربية.
        إذا سألك المستخدم عن شيء لا تعرفه، قل أنك لا تملك البيانات الكافية حالياً.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: {
          systemInstruction: systemInstruction,
        },
      });

      const botResponse = response.text || "عذراً، لم أستطع معالجة طلبك حالياً.";
      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'bot', text: "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي. يرجى المحاولة لاحقاً." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col bg-card rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-border overflow-hidden transition-all duration-500" dir="rtl">
      <header className="p-8 border-b border-border bg-gradient-to-r from-background to-card text-foreground flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-highlight/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="flex items-center gap-5 relative z-10">
          <div className="bg-highlight/10 p-4 rounded-2xl border border-highlight/20 shadow-xl">
            <Sparkles size={32} className="text-highlight" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">ذكاء الربدي</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <p className="text-xs text-secondary font-bold uppercase tracking-widest">مساعدك الإداري الذكي متصل</p>
            </div>
          </div>
        </div>
        <button onClick={() => setMessages([])} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-border text-secondary hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 relative z-10">
          <Trash2 size={22} />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth custom-scrollbar bg-background/30">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
            <div className="relative">
              <div className="absolute inset-0 bg-highlight/20 blur-3xl rounded-full animate-pulse" />
              <div className="w-32 h-32 bg-card rounded-[2.5rem] flex items-center justify-center border border-border shadow-2xl relative z-10">
                <Brain size={64} className="text-highlight" />
              </div>
            </div>
            <div className="max-w-md">
              <p className="text-2xl font-black text-foreground tracking-tight mb-3">كيف يمكنني مساعدتك اليوم؟</p>
              <p className="text-secondary font-medium leading-relaxed">أنا هنا لتحليل بيانات مؤسستك، تقديم تقارير عن الرواتب، متابعة أداء المشاريع، أو حتى تقديم نصائح مالية ذكية.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
              <button onClick={() => setInput("حلل لي أداء المشاريع الحالية")} className="p-4 rounded-2xl bg-card border border-border text-secondary text-xs font-bold hover:border-highlight/50 hover:text-foreground transition-all">حلل لي أداء المشاريع</button>
              <button onClick={() => setInput("ما هو إجمالي الرواتب لهذا الشهر؟")} className="p-4 rounded-2xl bg-card border border-border text-secondary text-xs font-bold hover:border-highlight/50 hover:text-foreground transition-all">إجمالي الرواتب</button>
            </div>
          </div>
        )}
        
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[75%] flex gap-5 ${msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl border ${msg.role === 'user' ? 'bg-border border-border text-secondary' : 'bg-highlight/10 border-highlight/20 text-highlight'}`}>
                  {msg.role === 'user' ? <User size={24} /> : <Bot size={24} />}
                </div>
                <div className={`p-6 rounded-[2rem] text-sm font-bold leading-relaxed shadow-2xl ${msg.role === 'user' ? 'bg-border text-foreground rounded-tr-none border border-border' : 'bg-gradient-to-br from-highlight to-[#2563eb] text-white rounded-tl-none border border-white/10'}`}>
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-end">
            <div className="flex gap-5 flex-row-reverse items-center">
              <div className="w-12 h-12 rounded-2xl bg-highlight/10 border border-highlight/20 flex items-center justify-center animate-pulse">
                <Bot size={24} className="text-highlight" />
              </div>
              <div className="bg-card p-6 rounded-[2rem] rounded-tl-none border border-border flex gap-2">
                <span className="w-2 h-2 bg-highlight rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-highlight rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-highlight rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 border-t border-border bg-background/50 backdrop-blur-xl">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-highlight/20 to-primary/20 rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="اسأل ذكاء الربدي عن أي شيء..."
            className="w-full pr-6 pl-20 py-5 rounded-[1.5rem] bg-background border border-border text-foreground outline-none focus:ring-2 focus:ring-highlight transition-all font-bold shadow-2xl relative z-10"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-highlight text-white w-14 h-14 rounded-2xl hover:bg-highlight/80 transition-all disabled:opacity-50 shadow-lg shadow-highlight/20 flex items-center justify-center z-20"
          >
            <Send size={24} />
          </button>
        </div>
        <div className="flex items-center justify-center gap-2 mt-4 opacity-40">
          <Zap size={12} className="text-highlight" />
          <p className="text-[10px] text-secondary font-black uppercase tracking-widest">
            مدعوم بتقنيات الذكاء الاصطناعي المتقدمة - يرجى التحقق من البيانات المالية الهامة
          </p>
        </div>
      </div>
    </div>
  );
}
