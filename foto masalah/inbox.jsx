import React, { useState } from 'react';
import { 
  MessageSquare, 
  Users, 
  Settings, 
  Search, 
  Bell, 
  MoreVertical, 
  Paperclip, 
  Send, 
  Copy, 
  CheckCircle, 
  Clock, 
  Filter,
  RefreshCw,
  Zap,
  LayoutGrid,
  CreditCard,
  User,
  Inbox,
  Command,
  ChevronDown,
  Bot,
  Smartphone,
  Menu,
  Plus,
  Ticket,
  ShoppingBag,
  FileText,
  UserPlus,
  AlertCircle,
  Check,
  ChevronRight,
  Smile,
  Image as ImageIcon,
  Calendar,
  Shield,
  Lock,
  Instagram,
  Power,
  Keyboard,
  Circle,
  MessageCircle,
  Phone
} from 'lucide-react';

// --- Prism Theme Constants ---
const THEME = {
  colors: {
    bg: 'bg-slate-50',
    surface: 'bg-white',
    textPrimary: 'text-slate-800',
    textSecondary: 'text-slate-500',
    border: 'border-slate-200',
    // Signature Gradient
    primaryGradient: 'bg-gradient-to-r from-orange-500 to-pink-500',
    primaryGradientText: 'bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-pink-600',
    primaryGradientHover: 'hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/30',
    // Functional Colors
    focusRing: 'focus:ring-2 focus:ring-orange-100 focus:border-orange-200 transition-all',
    badgePending: 'bg-rose-50 text-rose-600 border border-rose-100',
    badgeAssigned: 'bg-orange-50 text-orange-600 border border-orange-100',
    successSoft: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  },
  shapes: {
    card: 'rounded-[24px]',
    button: 'rounded-xl',
    input: 'rounded-2xl',
  }
};

const App = () => {
  const [activeTab, setActiveTab] = useState('inbox');
  const [rightPanelTab, setRightPanelTab] = useState('info'); 
  const [messageInput, setMessageInput] = useState('');
  const [hoveredNav, setHoveredNav] = useState(null);
  
  // New State for AI Control
  const [isAIActive, setIsAIActive] = useState(false);

  const chatHistory = [
    { type: 'system_error', text: 'Error: Request failed with status code 401', time: '09/04/25 21:05' },
    { 
      type: 'agent', 
      text: 'Halo kak! 👋 Sebaiknya kakak menghubungi bot franchise kami melalui link berikut: https://wa.me/62813...', 
      time: '09/04/25 21:05', 
      sender: 'Tea by Selalu Teh',
      status: 'read'
    },
    { type: 'system_log', text: 'Conversation assigned to Faris Akbar', time: '16/04/25 20:12' },
    { 
      type: 'agent', 
      text: 'Halo! Aku Ori, asisten virtual di sini yang akan membantu menjawab seputar franchise. Silahkan hubungi...', 
      time: '16/04/25 20:12', 
      sender: 'selaluteh.id',
      status: 'read'
    },
    { 
      type: 'user', 
      text: 'Dapatkan saya mengetahui lebih lanjut tentang franchise Selalu Teh?', 
      time: '16/04/25 20:12', 
      sender: 'alanyogaasikin',
      status: 'sent'
    },
    { type: 'system_log', text: 'Super Admin IT Core self assigned to this conversation', time: '17/11/25 09:51' },
  ];

  return (
    <div className={`h-screen max-h-screen ${THEME.colors.bg} font-sans text-slate-800 flex overflow-hidden selection:bg-orange-100 selection:text-orange-900`}>
      {/* Load Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
      `}</style>

      {/* --- Main Content Area (Sidebar Removed) --- */}
      <main className="flex-1 flex h-full overflow-hidden bg-slate-50/50">
        
        {/* --- 2. Inbox List Column --- */}
        <section className={`w-[360px] flex flex-col border-r ${THEME.colors.border} bg-white`}>
          {/* Header Controls */}
          <div className="px-5 py-5 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Messages</h1>
                <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200">12 New</span>
             </div>
             <div className="flex items-center gap-1">
                <IconButton icon={<Filter size={18} />} />
                <IconButton icon={<Plus size={18} className="text-orange-500" />} />
             </div>
          </div>

          {/* Search Bar */}
          <div className="px-5 pb-3">
             <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-orange-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search chats..." 
                  className={`w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border-none ${THEME.shapes.input} focus:ring-2 focus:ring-orange-100 focus:bg-white transition-all`}
                />
             </div>
          </div>

          {/* Modern Tabs */}
          <div className="flex px-5 border-b border-slate-100 gap-6">
             <TabButton label="Assigned" count={120} active />
             <TabButton label="Unassigned" />
             <TabButton label="Mentions" />
          </div>

          {/* List Items (NO AVATAR - Clean UI) */}
          <div className="flex-1 overflow-y-auto pt-2 pb-4">
             <InboxListItem 
                active 
                name="alanyogaasikin"
                platformName="selaluteh.id"
                lastMsg="Super Admin IT Core self assigned..."
                time="11/17"
                status="Assigned"
                badgeCount={2}
                platform="instagram"
                agentName="Testing Bot"
             />
             <InboxListItem 
                name="Rezakia"
                platformName="Selalu Teh by Ori"
                lastMsg="Betul sekali, Tetangga..."
                time="11/08"
                status="Pending"
                platform="whatsapp"
                agentName="Sales AI"
             />
             <InboxListItem 
                name="Taufiq"
                platformName="Selalu Teh by Ori"
                lastMsg="Tetanggaku Taufiq, unt..."
                time="11/03"
                status="Pending"
                platform="whatsapp"
                agentName="Support Bot"
             />
             <InboxListItem 
                name="HASAN"
                platformName="Selalu Teh by Ori"
                lastMsg="Terimakasih.. Saya san..."
                time="Fri 13:49"
                status="Assigned"
                badgeCount={1}
                platform="whatsapp"
                agentName="Testing Bot"
             />
          </div>
        </section>


        {/* --- 3. Chat Area (Center) --- */}
        <section className={`flex-1 flex flex-col bg-[#F8FAFC] relative`}>
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-[0.4] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          {/* Header */}
          <header className="h-[76px] px-6 border-b border-slate-200/60 bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-sm">
             <div className="flex items-center gap-4">
               {/* Kept Header Avatar for Context, but simpler */}
               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-bold text-slate-600 border border-white shadow-sm">
                 A
               </div>
               <div>
                  <h2 className="font-bold text-slate-800 text-[15px] flex items-center gap-2">
                    alanyogaasikin
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                     <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full text-[10px] border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
                        <Instagram size={10} className="text-pink-600" /> selaluteh.id
                     </span>
                  </div>
               </div>
             </div>
             
             <div className="flex items-center gap-3">
                {/* Switch to AI Agent Button */}
                {!isAIActive ? (
                  <button 
                    onClick={() => setIsAIActive(true)}
                    className={`${THEME.colors.primaryGradient} text-white px-4 py-2 ${THEME.shapes.button} text-sm font-semibold shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2`}
                  >
                     <Bot size={16} /> Switch to AI Agent
                  </button>
                ) : (
                  <div className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-sm font-bold border border-orange-100 flex items-center gap-2 animate-pulse">
                     <Bot size={16} /> AI Active
                  </div>
                )}
                
                <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>
                <IconButton icon={<Search size={18} />} tooltip="Search in chat" />
                <IconButton icon={<MoreVertical size={18} />} tooltip="More options" />
             </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth z-10">
            {chatHistory.map((msg, idx) => {
              if (msg.type === 'system_error' || msg.type === 'system_log') {
                 const isError = msg.type === 'system_error';
                 return (
                    <div key={idx} className="flex justify-center w-full my-2 animate-in fade-in slide-in-from-bottom-2">
                       <div className={`
                          flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium border shadow-sm
                          ${isError ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-100 text-slate-500 border-slate-200'}
                       `}>
                          {isError ? <AlertCircle size={12} /> : <Zap size={12} />}
                          {msg.text}
                          <span className="opacity-60 text-[10px] ml-1 border-l border-current pl-2">{msg.time.split(' ')[1]}</span>
                       </div>
                    </div>
                 )
              }

              const isAgent = msg.type === 'agent';
              return (
                <div key={idx} className={`flex w-full ${isAgent ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-4`}>
                   <div className={`flex flex-col max-w-[65%] ${isAgent ? 'items-end' : 'items-start'}`}>
                      <div className={`
                         px-5 py-3.5 text-sm leading-relaxed shadow-sm relative
                         ${isAgent 
                           ? `${THEME.colors.primaryGradient} text-white rounded-[20px] rounded-br-sm shadow-orange-500/10` 
                           : 'bg-white text-slate-700 border border-slate-100 rounded-[20px] rounded-bl-sm shadow-slate-200/50'}
                      `}>
                         {msg.text}
                      </div>
                      
                      <div className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-medium px-1 ${isAgent ? 'flex-row-reverse text-slate-400' : 'text-slate-400'}`}>
                         {isAgent && (
                            <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                               <Bot size={10} /> 
                               <span>AI Agent</span>
                            </div>
                         )}
                         <span>{msg.time.split(' ')[1]}</span>
                         <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                         <span>{isAgent ? 'Read' : 'Sent'}</span>
                      </div>
                   </div>
                </div>
              )
            })}
          </div>

          {/* Floating Input or Takeover Button */}
          <div className="p-5 z-20 bg-gradient-to-t from-white via-white/80 to-transparent">
             {isAIActive ? (
                // Takeover Button Mode
                <div className="flex justify-center pb-4">
                  <button 
                    onClick={() => setIsAIActive(false)}
                    className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 shadow-xl shadow-orange-500/10 rounded-full hover:scale-105 active:scale-95 transition-all group"
                  >
                     <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <Keyboard size={20} />
                     </div>
                     <div className="text-left">
                        <div className="text-sm font-bold text-slate-800">Takeover Chat</div>
                        <div className="text-[10px] text-slate-500 font-medium">Switch to manual typing</div>
                     </div>
                  </button>
                </div>
             ) : (
                // Standard Input Mode
                <div className={`
                   relative flex items-end gap-2 p-1.5 bg-white rounded-[24px] 
                   shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 
                   ring-1 ring-slate-50 focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-200 transition-all
                `}>
                   <button className="p-3 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors">
                      <Plus size={20} />
                   </button>
                   
                   <textarea
                     value={messageInput}
                     onChange={(e) => setMessageInput(e.target.value)}
                     placeholder="Type your message..." 
                     className="w-full bg-transparent border-none px-2 py-3.5 text-sm focus:ring-0 outline-none resize-none min-h-[48px] max-h-32 text-slate-700 placeholder-slate-400 font-medium"
                     rows={1}
                   />
                   
                   <div className="flex items-center gap-1 pb-1 pr-1">
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
                         <ImageIcon size={18} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
                         <Smile size={18} />
                      </button>
                      <button 
                         className={`${messageInput ? THEME.colors.primaryGradient : 'bg-slate-100 text-slate-300'} w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ml-1`}
                      >
                         <Send size={18} className={messageInput ? 'text-white ml-0.5' : 'ml-0.5'} />
                      </button>
                   </div>
                </div>
             )}
          </div>
        </section>


        {/* --- 4. Right Details Panel --- */}
        <section className={`w-[360px] bg-white border-l ${THEME.colors.border} flex flex-col h-full`}>
          
          {/* Custom Tabs */}
          <div className="px-2 pt-2 pb-0 border-b border-slate-100 flex items-center justify-around z-10 shrink-0">
             <RightPanelTab label="Info" icon={<AlertCircle size={16}/>} active={rightPanelTab === 'info'} onClick={() => setRightPanelTab('info')} />
             <RightPanelTab label="Ticket" icon={<Ticket size={16}/>} active={rightPanelTab === 'ticket'} onClick={() => setRightPanelTab('ticket')} />
             <RightPanelTab label="Orders" icon={<ShoppingBag size={16}/>} active={rightPanelTab === 'orders'} onClick={() => setRightPanelTab('orders')} />
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
             
             {/* 1. Header Profile */}
             <div>
                <div className="flex justify-between items-start mb-1">
                   <h2 className="text-xl font-bold text-slate-800">alanyogaasikin</h2>
                   <button className="text-slate-400 hover:text-orange-600 transition-colors"><Copy size={16}/></button>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-3">
                   <Instagram size={16} /> selaluteh.id
                </div>
                <button className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors">
                   <span className="flex items-center gap-2"><Filter size={14}/> Select Pipeline Status</span>
                   <ChevronDown size={14}/>
                </button>
             </div>

             <div className="h-[1px] bg-slate-100"></div>

             {/* 2. Labels */}
             <div>
                <div className="flex justify-between items-center mb-2">
                   <h4 className="text-xs font-bold text-slate-500">Labels</h4>
                   <button className="text-orange-600 text-xs font-bold border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50 flex items-center gap-1 transition-colors">
                      <Plus size={12} strokeWidth={3} /> Add Label
                   </button>
                </div>
                <div className="text-xs text-slate-400 font-medium py-1">No labels yet</div>
             </div>

             <div className="h-[1px] bg-slate-100"></div>

             {/* 3. Session History (Accordion) */}
             <AccordionItem title="Session History">
                <div className="text-xs text-slate-400 font-medium text-center py-4">No sessions available</div>
             </AccordionItem>

             <div className="h-[1px] bg-slate-100"></div>

             {/* 4. Handled By */}
             <div>
                <label className="text-xs font-bold text-slate-500 mb-2 block">Handled By</label>
                <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-orange-200 transition-colors cursor-pointer group">
                   <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                      <User size={14} />
                   </div>
                   <span className="text-sm font-semibold text-slate-700 flex-1">Super Admin IT Core</span>
                   <ChevronDown size={14} className="text-slate-400" />
                </div>
             </div>

             <div className="h-[1px] bg-slate-100"></div>

             {/* 5. Collaborators */}
             <div>
                <div className="flex justify-between items-center mb-2">
                   <h4 className="text-xs font-bold text-slate-500">Collaborators</h4>
                   <button className="text-orange-600 text-xs font-bold border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50 flex items-center gap-1 transition-colors">
                      <UserPlus size={14} /> Add Collaborator
                   </button>
                </div>
                <div className="text-xs text-slate-400 font-medium py-1">No collaborators yet</div>
             </div>

             <div className="h-[1px] bg-slate-100"></div>

             {/* 6. Notes */}
             <div>
                <label className="text-xs font-bold text-slate-500 mb-2 block">Notes</label>
                <div className="relative">
                   <textarea 
                      placeholder="Add a note..." 
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-3 text-xs min-h-[60px] focus:ring-2 focus:ring-orange-100 focus:bg-white outline-none resize-none transition-all placeholder-slate-400"
                   ></textarea>
                   <div className="absolute bottom-2 right-2 text-slate-300">
                      <Plus size={14} className="bg-slate-200 rounded-full p-0.5" />
                   </div>
                </div>
             </div>

             <div className="h-[1px] bg-slate-100"></div>

             {/* 7. AI Summary */}
             <div>
                <label className="text-xs font-bold text-slate-500 mb-2 block">AI Summary</label>
                <button className="w-full py-2.5 bg-orange-50 text-orange-600 text-xs font-bold rounded-xl hover:bg-orange-100 transition-colors border border-orange-100">
                   Generate AI Summary
                </button>
             </div>

             <div className="h-[1px] bg-slate-100"></div>

             {/* 8. Additional Data */}
             <AccordionItem title="Additional Data">
                <button className="w-full py-2.5 bg-white text-orange-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors border border-orange-200 mt-2">
                   Add New Additional Info
                </button>
             </AccordionItem>

             <div className="h-[1px] bg-slate-100"></div>

             {/* 9. Conversation Details */}
             <div>
                <h4 className="text-xs font-bold text-slate-500 mb-3">Conversation Details</h4>
                <div className="space-y-2.5">
                   <DetailGridItem label="Assigned By" value="-" icon={<User size={12}/>} />
                   <DetailGridItem label="Handled By" value="Super Admin IT Core" icon={<User size={12}/>} />
                   <DetailGridItem label="Resolved By" value="-" icon={<User size={12}/>} />
                   <DetailGridItem label="AI Handoff At" value="-" icon={<Bot size={12}/>} />
                   <DetailGridItem label="Assigned At" value="-" icon={<Clock size={12}/>} />
                   <DetailGridItem label="Created At" value="April 9th 2025, 9:05 pm" icon={<Calendar size={12}/>} highlight />
                   <DetailGridItem label="Resolved At" value="-" icon={<CheckCircle size={12}/>} />
                </div>
             </div>

             <div className="h-[1px] bg-slate-100"></div>

             {/* 10. Access Controls */}
             <div className="space-y-3">
                <div>
                   <label className="text-xs font-bold text-slate-500 mb-1.5 block">Conversation Access</label>
                   <div className={`w-full py-2 px-3 ${THEME.colors.successSoft} rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:opacity-90`}>
                      <Shield size={14} /> Active - Click to Block
                   </div>
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 mb-1.5 block">AI Access</label>
                   <div className={`w-full py-2 px-3 ${THEME.colors.successSoft} rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:opacity-90`}>
                      <Bot size={14} /> AI Active - Click to Block
                   </div>
                </div>
             </div>

             <div className="h-[1px] bg-slate-100"></div>

             {/* 11. Tickets */}
             <div className="pb-10">
                <label className="text-xs font-bold text-slate-500 mb-2 block">Tickets</label>
                <button className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors mb-2">
                   <span className="flex items-center gap-2"><LayoutGrid size={14}/> Default Board</span>
                   <ChevronDown size={14}/>
                </button>
                <div className="text-xs text-slate-400 font-medium text-center py-2">No tickets yet</div>
             </div>

          </div>
        </section>

      </main>
    </div>
  );
};

// --- Sub-Components (Optimized for Reuse) ---

const TabButton = ({ label, count, active }) => (
  <button className={`
     relative pb-3 text-sm font-medium transition-colors
     ${active ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}
  `}>
     {label}
     {count && <span className="ml-1.5 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md border border-slate-200">{count}</span>}
     {active && (
        <span className={`absolute bottom-0 left-0 w-full h-[3px] rounded-t-full ${THEME.colors.primaryGradient}`}></span>
     )}
  </button>
);

const IconButton = ({ icon, onClick, className, tooltip }) => (
  <button onClick={onClick} title={tooltip} className={`p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors ${className}`}>
    {icon}
  </button>
);

// UPDATED: BRAND ICONS FOR PLATFORMS
const InboxListItem = ({ active, name, platformName, lastMsg, time, status, badgeCount, platform, agentName }) => (
  <div className={`
     px-5 py-4 border-b border-slate-50 cursor-pointer flex flex-col gap-2 relative transition-all group
     ${active ? 'bg-orange-50/40' : 'hover:bg-slate-50'}
  `}>
    {active && <div className={`absolute left-0 top-0 bottom-0 w-[4px] rounded-r-full ${THEME.colors.primaryGradient}`}></div>}
    
    <div className="flex justify-between items-start">
       <div className="flex items-center gap-2 min-w-0">
          {/* Platform Logo (Replaces Dot) */}
          <div className="shrink-0">
             {platform === 'whatsapp' ? (
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white" title="WhatsApp">
                   <MessageCircle size={12} fill="currentColor" />
                </div>
             ) : (
                <div className="w-5 h-5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white" title="Instagram">
                   <Instagram size={12} />
                </div>
             )}
          </div>
          
          <h4 className={`text-sm font-bold truncate ${active ? 'text-slate-800' : 'text-slate-700'}`}>{name}</h4>
       </div>
       <span className={`text-[10px] font-medium shrink-0 ${active ? 'text-orange-600' : 'text-slate-400'}`}>{time}</span>
    </div>
    
    <p className={`text-xs truncate pl-7 ${active ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
       {lastMsg}
    </p>

    <div className="flex items-center justify-between mt-1 pl-7">
       <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
             status === 'Assigned' ? THEME.colors.badgeAssigned : THEME.colors.badgePending
          }`}>
             {status}
          </span>
          {agentName && (
             <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                <Bot size={10} className="text-orange-500" />
                {agentName}
             </div>
          )}
       </div>
    </div>
  </div>
);

const RightPanelTab = ({ label, icon, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`
       flex-1 pb-3 pt-3 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all relative
       ${active ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50 rounded-t-lg'}
    `}
  >
     {icon}
     {label}
     {active && <span className={`absolute bottom-0 w-full h-[2px] ${THEME.colors.primaryGradient}`}></span>}
  </button>
);

const AccordionItem = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div>
      <div 
        className="flex justify-between items-center cursor-pointer group py-1"
        onClick={() => setIsOpen(!isOpen)}
      >
         <label className="text-xs font-bold text-slate-500 group-hover:text-orange-600 transition-colors">{title}</label>
         <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && <div className="animate-in fade-in slide-in-from-top-1 duration-200">{children}</div>}
    </div>
  );
};

const DetailGridItem = ({ label, value, icon, highlight }) => (
  <div className="flex items-center gap-3">
    <div className="w-5 flex justify-center text-slate-300">
       {icon}
    </div>
    <div className="flex-1">
       <div className="text-[10px] font-bold text-slate-400">{label}</div>
       <div className={`text-xs font-medium ${highlight ? 'text-orange-600' : 'text-slate-600'}`}>
          {value}
       </div>
    </div>
  </div>
);

export default App;