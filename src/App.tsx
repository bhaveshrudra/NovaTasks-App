import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  Trash2, 
  Plus, 
  Mic, 
  Grid, 
  Calendar, 
  Clock, 
  Sliders, 
  User, 
  Search, 
  Bell, 
  MoreVertical, 
  Play, 
  Square,
  Volume2, 
  Activity, 
  Cpu, 
  Moon, 
  Sparkles, 
  Send,
  Loader2,
  AlertOctagon,
  VolumeX,
  Target,
  RefreshCw,
  Award,
  Link as LinkIcon,
  LogOut
} from 'lucide-react';
import { Task, Alarm, SysLog, ActiveObjective } from './types';
import { ambientSynth } from './utils/audio';
import { auth, db, handleFirestoreError, OperationType } from './utils/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { Auth } from './components/Auth';

// Pre-populated default tasks matching user mockups
const DEFAULT_TASKS: Task[] = [
  { id: 't1', title: 'Review Client Proposals', category: 'work', priority: 'high', completed: false, dueDateText: 'Weekly' },
  { id: 't2', title: 'Update Design Guidelines', category: 'work', priority: 'normal', completed: false, dueDateText: 'Shared' },
  { id: 't3', title: 'Evening Gym Session', category: 'personal', priority: 'normal', completed: false, dueDateText: '18:00' }
];

const DEFAULT_ALARMS: Alarm[] = [
  { id: 'a1', time: '09:30', title: 'Stand-up Sync', active: true },
  { id: 'a2', time: '12:00', title: 'Deep Work: Architecture', active: true },
  { id: 'a3', time: '15:45', title: 'System Maintenance', active: false }
];

const DEFAULT_OBJECTIVES: ActiveObjective[] = [
  { 
    title: 'Finalize Q4 Tech Architecture', 
    description: 'Review the microservices documentation and approve the deployment pipeline for the Nova Core update.', 
    critical: true 
  }
];

export default function App() {
  // Active user session state
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [guestMode, setGuestMode] = useState(false);

  // Splash Screen loading state
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState("Connecting to Neural Link...");

  // Primary task and system states
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasknova_tasks');
    return saved ? JSON.parse(saved) : DEFAULT_TASKS;
  });

  const [alarms, setAlarms] = useState<Alarm[]>(() => {
    const saved = localStorage.getItem('tasknova_alarms');
    return saved ? JSON.parse(saved) : DEFAULT_ALARMS;
  });

  const [activeObjective, setActiveObjective] = useState<ActiveObjective>(DEFAULT_OBJECTIVES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tabs: 'dashboard', 'alarms', 'ai-command', 'focus-timer', 'settings'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alarms' | 'ai-command' | 'focus-timer' | 'settings'>('dashboard');

  // AI Command terminal states
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutputLog, setAiOutputLog] = useState<string>("Affirmative, Commander. Ready to calibrate and parse commands.");
  const [aiSuggestions, setAiSuggestions] = useState<Array<{title: string, priority: string, estimatedEnergy: string, category: 'work' | 'personal'}>>([
    { title: "Finalize Q4 Strategy Deck", priority: "high", estimatedEnergy: "Due in 2 hours • 85% completion energy required", category: 'work' },
    { title: "Schedule Dev Sync", priority: "system", estimatedEnergy: "Recommended based on team availability", category: 'work' }
  ]);
  const [suggestionInsight, setSuggestionInsight] = useState("Peak focus detected. Suggesting high-energy tasks for the next 45 minutes.");

  // System logs state
  const [sysLogs, setSysLogs] = useState<SysLog[]>([
    { id: 'l1', text: 'Updated "Project Nova" documentation', time: '2m ago', type: 'primary' },
    { id: 'l2', text: 'Sync completed with Neural Calendar', time: '15m ago', type: 'secondary' }
  ]);

  // Task creation helper state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<'work' | 'personal'>('work');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'normal' | 'system'>('normal');
  const [newTaskDue, setNewTaskDue] = useState('');

  // Deep Focus Timer state
  const [focusTimeLeft, setFocusTimeLeft] = useState(25 * 60); // 25:00
  const [isFocusing, setIsFocusing] = useState(false);
  const [soundscape, setSoundscape] = useState<'rain' | 'cyber' | 'space' | null>(null);
  const [audioVolume, setAudioVolume] = useState(0.5);
  const [completedSessions, setCompletedSessions] = useState(6);
  const [totalSessionsGoal] = useState(8);

  // Critical Alert screen state
  const [activeAlert, setActiveAlert] = useState<{ id: string; title: string, time: string } | null>(null);
  const [alertDuration, setAlertDuration] = useState(15); // visual countdown or timer increment
  const [waveBars, setWaveBars] = useState<number[]>(new Array(40).fill(25));

  // Current System time state (displayed in app)
  const [systemTime, setSystemTime] = useState('');

  // Auth state listener on check in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecking(false);
      if (user) {
        addLog(`Mainframe link established with: ${user.phoneNumber || user.email || "Active commander"}`, 'primary');
      }
    });
    return () => unsub();
  }, []);

  // Helper to persist task to Firestore
  const persistTask = async (task: Task) => {
    if (!auth.currentUser) return;
    try {
      const taskDocRef = doc(db, "tasks", task.id);
      await setDoc(taskDocRef, {
        id: task.id,
        title: task.title,
        category: task.category,
        priority: task.priority,
        completed: task.completed,
        dueDateText: task.dueDateText || "Today",
        estimatedEnergy: task.estimatedEnergy || "Synthesized load",
        userId: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  // Helper to delete task from Firestore
  const removePersistedTask = async (taskId: string) => {
    if (!auth.currentUser) return;
    try {
      const taskDocRef = doc(db, "tasks", taskId);
      await deleteDoc(taskDocRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tasks/${taskId}`);
    }
  };

  // Helper to persist alarm to Firestore
  const persistAlarm = async (alarm: Alarm) => {
    if (!auth.currentUser) return;
    try {
      const alarmDocRef = doc(db, "alarms", alarm.id);
      await setDoc(alarmDocRef, {
        id: alarm.id,
        title: alarm.title,
        time: alarm.time,
        active: alarm.active,
        userId: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `alarms/${alarm.id}`);
    }
  };

  // Helper to delete alarm from Firestore
  const removePersistedAlarm = async (alarmId: string) => {
    if (!auth.currentUser) return;
    try {
      const alarmDocRef = doc(db, "alarms", alarmId);
      await deleteDoc(alarmDocRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `alarms/${alarmId}`);
    }
  };

  // Sync firestore data back dynamically
  useEffect(() => {
    if (!currentUser) return;
    
    const loadFirestoreData = async () => {
      try {
        addLog("Synchronizing data with neural database...", "secondary");
        
        // Fetch tasks
        const tasksQuery = query(collection(db, "tasks"), where("userId", "==", currentUser.uid));
        const tasksSnap = await getDocs(tasksQuery);
        const fetchedTasks: Task[] = [];
        tasksSnap.forEach(d => {
          fetchedTasks.push({ id: d.id, ...d.data() } as Task);
        });

        if (fetchedTasks.length > 0) {
          setTasks(fetchedTasks);
        }

        // Fetch alarms
        const alarmsQuery = query(collection(db, "alarms"), where("userId", "==", currentUser.uid));
        const alarmsSnap = await getDocs(alarmsQuery);
        const fetchedAlarms: Alarm[] = [];
        alarmsSnap.forEach(d => {
          fetchedAlarms.push({ id: d.id, ...d.data() } as Alarm);
        });

        if (fetchedAlarms.length > 0) {
          setAlarms(fetchedAlarms);
        }

        addLog("Neural database synchronization complete.", "primary");
      } catch (err) {
        console.error("Firestore sync error:", err);
      }
    };

    loadFirestoreData();
  }, [currentUser]);

  // Save states to local storage
  useEffect(() => {
    localStorage.setItem('tasknova_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('tasknova_alarms', JSON.stringify(alarms));
  }, [alarms]);

  // Update digital clocks every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setSystemTime(`${h}:${m}:${s}`);

      // Alarm checker logic
      alarms.forEach(alarm => {
        if (alarm.active && `${h}:${m}` === alarm.time && s === '00' && !activeAlert) {
          triggerAlarm(alarm);
        }
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [alarms, activeAlert]);

  // Splash Loading progression
  useEffect(() => {
    if (!loading) return;
    const progressInterval = setInterval(() => {
      setLoadingProgress(p => {
        const next = p + Math.floor(Math.random() * 8) + 3;
        if (next >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setLoading(false);
          }, 400);
          return 100;
        }

        // Change Status Text based on progress segments
        if (next < 25) {
          setLoadingStatus("Connecting to Neural Link...");
        } else if (next < 50) {
          setLoadingStatus("Loading Task Clusters...");
        } else if (next < 75) {
          setLoadingStatus("Calibrating Interface...");
        } else if (next < 90) {
          setLoadingStatus("Awaiting Authorization...");
        } else {
          setLoadingStatus("Ready for Liftoff");
        }
        return next;
      });
    }, 150);

    return () => clearInterval(progressInterval);
  }, [loading]);

  // Soundscape audio controller trigger
  useEffect(() => {
    if (soundscape) {
      ambientSynth.play(soundscape);
      ambientSynth.setVolume(audioVolume);
    } else {
      ambientSynth.stop();
    }
    return () => {
      ambientSynth.stop();
    };
  }, [soundscape]);

  // Focus timer countdown hook
  useEffect(() => {
    let focusInterval: any = null;
    if (isFocusing) {
      focusInterval = setInterval(() => {
        setFocusTimeLeft(t => {
          if (t <= 1) {
            clearInterval(focusInterval);
            setIsFocusing(false);
            setCompletedSessions(prev => prev + 1);
            addLog(`Deep Focus session complete! Daily efficiency heightened.`, 'primary');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(focusInterval);
    }
    return () => clearInterval(focusInterval);
  }, [isFocusing]);

  // Alert Wave oscillation hook
  useEffect(() => {
    if (!activeAlert) return;
    const waveInterval = setInterval(() => {
      setWaveBars(prev => prev.map(() => Math.floor(Math.random() * 70) + 30));
    }, 120);
    return () => clearInterval(waveInterval);
  }, [activeAlert]);

  // Helper to trigger alert manually or automatically
  const triggerAlarm = (alarm: Alarm | { id: string; title: string, time: string }) => {
    setActiveAlert(alarm);
    addLog(`Critical alert triggered: "${alarm.title}"`, 'primary');

    // Synthesis of high-tech priority alarm frequencies
    try {
      ambientSynth.playAlarmSound();
    } catch (soundErr) {
      console.warn("Synthesizer direct playback blocked or restricted", soundErr);
    }

    // Speech voice synthesis fallback if permitted
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(
          `Critical Alert. Emergency: ${alarm.title}. Standing by for commander intervention.`
        );
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch(e) {
      console.log('Voice speech synth skipped', e);
    }
  };

  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("Tap mic node as active authorization to dictate tasks.");

  const startVoiceAssistant = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceTranscript("Browser speech recognition not found. Injecting manual bypass...");
      addLog("Speech recognition fallback active.", "secondary");
      handleVoiceCommandProcess("Schedule team sync tomorrow morning at 0930");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setVoiceTranscript("Nova link active. Speak instruction...");
        try {
          ambientSynth.stop();
        } catch (e) {}
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error", e);
        setIsListening(false);
        setVoiceTranscript("Transcribe error or silent link. Tap mic to retry.");
      };

      rec.ononend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setVoiceTranscript(`Analyzing verbal data: "${text}"`);
        handleVoiceCommandProcess(text);
      };

      rec.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const handleVoiceCommandProcess = async (text: string) => {
    setAiLoading(true);
    setAiOutputLog(`Transcribing neural voice: "${text}"... Dispatching to cognitive advisory gateway...`);
    
    try {
      const res = await fetch('/api/gemini/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!res.ok) {
        throw new Error("Voice assistant link unavailable.");
      }

      const parsed = await res.json();
      const { action, talkResponse, taskData, alarmData } = parsed;

      setAiOutputLog(talkResponse);
      addLog(`AI Voice Response: ${talkResponse}`, 'primary');

      // Speak result using Gemini TTS with high fidelity
      speakBack(talkResponse);

      // Perform dynamic structural action changes
      if (action === "CREATE_TASK" && taskData) {
        const newTask: Task = {
          id: 'ai_voice_' + Date.now(),
          title: taskData.title,
          category: taskData.category || 'work',
          priority: taskData.priority || 'normal',
          completed: false,
          dueDateText: taskData.dueDateText || 'Today',
          estimatedEnergy: taskData.estimatedEnergy || 'Stabilized balance'
        };
        setTasks(prev => [newTask, ...prev]);
        persistTask(newTask);
      } else if (action === "CREATE_ALARM" && alarmData) {
        const newAlarm: Alarm = {
          id: 'ai_alarm_' + Date.now(),
          title: alarmData.title || 'Voice Alarm',
          time: alarmData.time || '18:30',
          active: true
        };
        setAlarms(prev => [...prev, newAlarm]);
        persistAlarm(newAlarm);
      } else if (action === "SUGGEST_STRATEGY") {
        triggerSuggestionUpdate(tasks);
      }

    } catch (err) {
      console.warn("Speech assistant process fallback:", err);
      const fallbackResponse = `Offline override. Action parameters created for instructions: ${text}`;
      setAiOutputLog(fallbackResponse);
      speakBack(fallbackResponse);
    } finally {
      setAiLoading(false);
    }
  };

  const speakBack = async (phrase: string) => {
    // Attempt Gemini Neural TTS
    try {
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: phrase })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.audioData) {
          const binary = atob(data.audioData);
          const arrayBuffer = new ArrayBuffer(binary.length);
          const view = new Uint8Array(arrayBuffer);
          for (let i = 0; i < binary.length; i++) {
            view[i] = binary.charCodeAt(i);
          }
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const buffer = await audioCtx.decodeAudioData(arrayBuffer);
          const source = audioCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(audioCtx.destination);
          source.start();
          return;
        }
      }
    } catch(err) {
      console.warn("Gemini TTS pipeline issue, transferring to local speech synthesiser", err);
    }

    // Local native system override SpeechSynthesizer
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch(e) {
      console.error("Local synth restricted", e);
    }
  };

  // Add system log helper
  const addLog = (text: string, type: 'primary' | 'secondary' = 'primary') => {
    const newLog: SysLog = {
      id: 'log_' + Date.now(),
      text,
      time: 'Just now',
      type
    };
    setSysLogs(prev => [newLog, ...prev.slice(0, 9)]);
  };

  // Check off task function
  const toggleTaskCompletion = (taskId: string) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === taskId) {
          const newState = !t.completed;
          addLog(`${newState ? 'Completed' : 'Restored'} task: "${t.title}"`, 'secondary');
          const finalTask = { ...t, completed: newState };
          persistTask(finalTask);
          return finalTask;
        }
        return t;
      });
      return updated;
    });
  };

  // Dismiss a checklist task
  const deleteTask = (taskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;
    setTasks(prev => prev.filter(t => t.id !== taskId));
    addLog(`Deleted objective: "${target.title}"`, 'secondary');
    removePersistedTask(taskId);
  };

  // Trigger Gemini parsing via server route
  const handleAiCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    setAiLoading(true);
    const textIssued = aiInput.trim();
    setAiInput('');
    setAiOutputLog(`Connecting to mainframe... Synthesizing intelligence vector for task command: "${textIssued}"`);

    try {
      const res = await fetch('/api/gemini/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textIssued })
      });

      if (!res.ok) {
        throw new Error("Failure from mainframe API parser.");
      }

      const parsedTask = await res.json();
      
      const created: Task = {
        id: 'ai_' + Date.now(),
        title: parsedTask.title,
        category: parsedTask.category || 'work',
        priority: parsedTask.priority || 'normal',
        completed: false,
        estimatedEnergy: parsedTask.estimatedEnergy,
        dueDateText: parsedTask.dueDateText
      };

      setTasks(prev => [created, ...prev]);
      persistTask(created);
      setAiOutputLog(`Success. Neural linked command verified. Placed item "${created.title}" [Urgency: ${created.priority.toUpperCase()}] in category [${created.category.toUpperCase()}]. Timeline calibration: "${created.dueDateText}".`);
      addLog(`AI calibrated task: "${created.title}"`, 'primary');

      // Fetch dynamic suggestions too to update AI Suggested panel
      triggerSuggestionUpdate([created, ...tasks]);

    } catch (err: any) {
      // Graceful local parsing if server fails
      console.warn("Server parse failing, falling back to local fallback parser:", err);
      const isPersonal = textIssued.toLowerCase().includes("gym") || textIssued.toLowerCase().includes("run") || textIssued.toLowerCase().includes("dinner");
      const created: Task = {
        id: 'ai_' + Date.now(),
        title: textIssued,
        category: isPersonal ? 'personal' : 'work',
        priority: 'normal',
        completed: false,
        estimatedEnergy: 'Cognitive load balanced',
        dueDateText: 'Recommended today'
      };
      setTasks(prev => [created, ...prev]);
      persistTask(created);
      setAiOutputLog(`Local linked override success. Created task: "${created.title}" in category [${created.category.toUpperCase()}].`);
      addLog(`Task created: "${created.title}"`, 'secondary');
    } finally {
      setAiLoading(false);
    }
  };

  const triggerSuggestionUpdate = async (currentTasks: Task[]) => {
    try {
      const res = await fetch('/api/gemini/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: currentTasks, focusTask: activeObjective })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.insight) setSuggestionInsight(data.insight);
        if (data.suggestedTasks) setAiSuggestions(data.suggestedTasks);
      }
    } catch(e) {
      console.warn("Suggestions fetched fallback", e);
    }
  };

  // Add customized task manually
  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const created: Task = {
      id: 'manual_' + Date.now(),
      title: newTaskTitle,
      category: newTaskCategory,
      priority: newTaskPriority,
      completed: false,
      dueDateText: newTaskDue || 'Today'
    };

    setTasks(prev => [created, ...prev]);
    persistTask(created);
    setNewTaskTitle('');
    setNewTaskDue('');
    setShowAddModal(false);
    addLog(`Commander scheduled: "${created.title}"`, 'primary');
  };

  // Calculated Metrics
  const totalChecklisted = tasks.length;
  const completedChecklisted = tasks.filter(t => t.completed).length;
  const rawEfficiency = totalChecklisted > 0 ? Math.round((completedChecklisted / totalChecklisted) * 100) : 0;
  // Blend base efficiency target to match mockup metric ranges (normally 72% / 75%)
  const displayEfficiency = totalChecklisted > 0 ? rawEfficiency : 72;

  // Search filtered tasks
  const filteredTasks = searchQuery.trim() 
    ? tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : tasks;

  // Render function for Splash Screen loading
  if (loading) {
    return (
      <div className="bg-[#050608] select-none text-[#e2e2e8] h-screen w-full flex flex-col items-center justify-center relative overflow-hidden font-sans">
        {/* Animated Nebular background */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#020305] via-[#120822] to-[#04121a] pointer-events-none z-0" />
        
        {/* Ambient background particle glows */}
        <div className="absolute top-[20%] left-[20%] w-[350px] h-[350px] bg-[#7000ff] opacity-[0.08] blur-[100px] rounded-full" />
        <div className="absolute bottom-[20%] right-[20%] w-[350px] h-[350px] bg-[#00f2ff] opacity-[0.06] blur-[100px] rounded-full" />

        {/* Tiny stars container */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
          <div className="absolute top-[15%] left-[10%] w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute top-[40%] left-[80%] w-1.5 h-1.5 bg-[#00f2ff] rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute top-[75%] left-[25%] w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: '2.5s' }} />
          <div className="absolute top-[85%] left-[70%] w-1 h-1 bg-[#d1bcff] rounded-full animate-pulse" style={{ animationDuration: '3.5s' }} />
        </div>

        {/* Logo and Progress */}
        <main className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative mb-8"
          >
            {/* Logo Backdrop Blue Glow */}
            <div className="absolute -inset-10 bg-[#00f2ff] opacity-[0.12] blur-[40px] rounded-full animate-pulse" />
            
            <div className="relative flex items-center justify-center w-24 h-24 md:w-32 md:h-32">
              {/* Diamond border rotators */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#7000ff] to-[#00f2ff] opacity-10 rounded-2xl border border-[#00f2ff]/40 rotate-45 transform animate-[spin_12s_linear_infinite]" />
              <div className="absolute inset-2 bg-gradient-to-bl from-[#050608] to-[#1e2024]/80 rounded-2xl border border-white/5 rotate-45" />
              <span className="relative font-display text-[56px] md:text-[72px] text-[#00f2ff] font-extrabold tracking-tighter drop-shadow-[0_0_15px_rgba(0,242,255,0.6)]">N</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="space-y-2 mb-8"
          >
            <h1 className="text-3xl font-semibold uppercase tracking-[0.18em] text-[#e2e2e8] font-display">TaskNova</h1>
            <p className="text-xs text-[#00f2ff]/80 font-mono tracking-widest flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#d1bcff] animate-pulse" />
              POWERED BY AI
            </p>
          </motion.div>

          {/* Progress gauge */}
          <div className="w-full max-w-[260px] space-y-4">
            <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-[#00f2ff] transition-all duration-150 ease-out shadow-[0_0_15px_rgba(0,242,255,0.8)]" 
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] font-mono font-medium text-white/40">
              <span>{loadingStatus}</span>
              <span className="text-[#00f2ff]/80 ml-2">{loadingProgress}%</span>
            </div>
          </div>
        </main>

        {/* Footer info */}
        <footer className="absolute bottom-12 text-center text-[10px] uppercase font-mono tracking-[0.25em] text-[#e2e2e8]/30">
          <p>SYNCHRONIZING WITH COSMOS 1.0</p>
          <p className="mt-1 text-[#00f2ff]/40 font-bold">by Bhavesh Rudra</p>
        </footer>
      </div>
    );
  }

  // Authorisation portal check before landing
  if (!currentUser && !guestMode) {
    return (
      <Auth 
        onAuthSuccess={() => {
          setCurrentUser(auth.currentUser);
          setGuestMode(false);
        }} 
        onSkipAuth={() => {
          setGuestMode(true);
          addLog("Authorized session bypass. Sandbox guest state active.", "secondary");
        }} 
      />
    );
  }

  return (
    <div id="tasknova_root" className="bg-[#0d0d12] text-white min-h-screen relative overflow-x-hidden font-sans flex flex-col pb-32">
      {/* Subtle modern background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0 opacity-60" />
      
      {/* Background ambient glows */}
      <div className="absolute top-[5%] left-[5%] w-[500px] h-[500px] bg-[#3b82f6] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] bg-[#10b981] opacity-[0.02] blur-[120px] rounded-full pointer-events-none" />

      {/* FIXED HEADER */}
      <header className="sticky top-0 w-full z-40 bg-[#0d0d12]/85 backdrop-blur-md border-b border-white/5 flex justify-between items-center px-6 md:px-12 h-16 md:h-20 select-none">
        <div className="flex items-center gap-3">
          {/* Avatar Profile Mockup */}
          <div 
            onClick={() => setActiveTab('settings')}
            className="w-9 h-9 md:w-11 md:h-11 rounded-full overflow-hidden border border-[#3b82f6]/30 hover:border-[#3b82f6] transition-all cursor-pointer bg-[#ffffff05] flex items-center justify-center shrink-0"
          >
            <User className="w-5 h-5 text-[#3b82f6]" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-display font-bold tracking-wide text-white cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              Task<span className="text-[#3b82f6]">Nova</span>
            </h1>
            <p className="text-[10px] font-mono uppercase text-white/40 tracking-wider font-semibold hidden md:block">Tactical Life Engine</p>
          </div>
        </div>

        {/* Current system clock & Action toggles */}
        <div className="flex items-center gap-3.5">
          <div className="font-mono text-xs text-white/80 bg-[#ffffff05] border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
            <span className="tabular-nums font-medium tracking-wider">{systemTime || '11:44:40'}</span>
          </div>

          <button 
            onClick={() => addLog("Diagnostic scanning operational. Latency minimal.", "secondary")}
            className="p-1.5 md:p-2 rounded-full hover:bg-white/5 border border-transparent hover:border-white/5 text-white/50 hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => {
              // Trigger a mockup alarm directly so user can play with Alert screen
              triggerAlarm({
                id: 'test_alert',
                title: activeObjective.title,
                time: 'Test Mode'
              });
            }}
            className="p-1.5 md:p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[#3b82f6] hover:text-[#3b82f6]/80 transition-all active:scale-95 relative cursor-pointer"
            title="Trigger test Critical Alert"
          >
            <Bell className="w-4 h-4 animate-swing" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pt-8 flex-grow">
        
        {/* TAB SWITCHER */}
        <AnimatePresence mode="wait">
          
          {/* 1. DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Profile welcome */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xs uppercase font-mono tracking-[0.2em] text-[#3b82f6] font-semibold">System Online</h2>
                  <h3 className="text-2xl md:text-4xl font-display font-medium text-white leading-tight">
                    Good Morning, Alex <br className="md:hidden" />
                    <span className="text-white/40">Your center has </span>
                    <span className="text-[#3b82f6] font-semibold">{tasks.filter(t => !t.completed).length} items</span>
                    <span className="text-white/40"> pending.</span>
                  </h3>
                </div>
                
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-mono text-xs rounded-full border border-white/5 flex items-center gap-2 shadow-sm hover:scale-102 active:scale-98 transition-all duration-200 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  NEW INSTRUCTION
                </button>
              </div>

              {/* BENTO GRID LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Column Left (8 cols): Today's Active Objective + Tasks list */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  
                  {/* Today's Focus Card */}
                  <div className="bg-[#ffffff03] backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-[24px] relative overflow-hidden group hover:border-white/15 transition-all">
                    <div className="absolute top-4 right-4 z-10">
                      <span className="px-3 py-1 rounded-full bg-red-950/25 border border-red-500/30 text-red-400 text-[10px] font-mono font-semibold tracking-wider uppercase">
                        Active Objective
                      </span>
                    </div>

                    <div className="relative z-10 max-w-xl">
                      <span className="text-[#3b82f6] text-[10px] tracking-widest uppercase font-mono font-semibold flex items-center gap-1.5 mb-3">
                        <Target className="w-4 h-4 text-[#3b82f6]" />
                        MAPPED MISSION TASK
                      </span>
                      <h4 className="text-2xl font-display font-medium text-white mb-3 tracking-wide select-all">
                        {activeObjective.title}
                      </h4>
                      <p className="text-sm text-white/60 leading-relaxed mb-6">
                        {activeObjective.description}
                      </p>

                      <div className="flex gap-3">
                        <button 
                          onClick={() => {
                            setActiveTab('focus-timer');
                            setIsFocusing(true);
                            addLog(`Initiated focused interval on active objective`, 'primary');
                          }}
                          className="px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-full font-mono text-xs font-semibold shadow-md hover:scale-102 active:scale-95 transition-all cursor-pointer"
                        >
                          Resume Task
                        </button>
                        <button 
                          onClick={() => triggerAlarm({ id: 'arch_demo', title: activeObjective.title, time: 'Now' })}
                          className="px-5 py-2.5 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-full font-mono text-xs transition-all active:scale-95 cursor-pointer"
                        >
                          Trigger Simulated Alarm
                        </button>
                      </div>
                    </div>

                    {/* Subtle aesthetic laser background vector */}
                    <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-[#3b82f6]/5 blur-[90px] rounded-full group-hover:bg-[#3b82f6]/10 transition-all duration-700" />
                  </div>

                  {/* AI Suggested Bento panel */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <h4 className="text-xs uppercase font-mono tracking-wider font-semibold text-white/50 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#3b82f6] animate-pulse" />
                        AI SUGGESTIONS
                      </h4>
                      <span className="text-[10px] font-mono text-white/40 uppercase">Optimized via Gemini</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiSuggestions.map((s, index) => (
                        <div 
                          key={index} 
                          onClick={() => {
                            // Easily adopt this suggestion as a task
                            const exist = tasks.some(t => t.title.toLowerCase() === s.title.toLowerCase());
                            if (!exist) {
                              const created: Task = {
                                id: 'ai_suggest_' + Date.now() + index,
                                title: s.title,
                                category: s.category || 'work',
                                priority: s.priority as any || 'normal',
                                completed: false,
                                dueDateText: 'Adopted Suggestion',
                                estimatedEnergy: s.estimatedEnergy
                              };
                              setTasks(prev => [created, ...prev]);
                              addLog(`Adopted AI task suggestion: "${s.title}"`, 'primary');
                            } else {
                              addLog(`Task "${s.title}" already added!`, 'secondary');
                            }
                          }}
                          className="relative p-5 rounded-[24px] bg-[#ffffff03] backdrop-blur-md border border-white/10 hover:border-[#3b82f6]/40 hover:bg-[#ffffff05] transition-all cursor-pointer group flex flex-col justify-between min-h-[140px]"
                        >
                          {/* Pulsing gradient rotating outer edge highlight */}
                          <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6]/5 to-transparent rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          <div className="relative z-10 w-full">
                            <div className="flex justify-between items-center mb-2">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono border ${
                                s.priority === 'high' 
                                  ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                                  : 'bg-[#3b82f6]/10 border-[#3b82f6]/20 text-[#3b82f6]'
                              }`}>
                                {s.priority === 'high' ? 'High Priority' : s.priority === 'system' ? 'System Sync' : 'Recommended'}
                              </span>
                              <MoreVertical className="w-3.5 h-3.5 text-white/30 group-hover:text-[#3b82f6] transition-colors" />
                            </div>
                            <h5 className="text-sm font-semibold text-white mb-1 group-hover:text-[#3b82f6] transition-colors line-clamp-2">
                              {s.title}
                            </h5>
                          </div>
                          
                          <p className="relative z-10 text-[11px] text-white/40 font-mono line-clamp-1">
                            {s.estimatedEnergy}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-white/5 border border-white/10 rounded-[16px] flex items-center gap-2.5">
                      <Cpu className="w-4 h-4 text-[#3b82f6] shrink-0 animate-pulse" />
                      <p className="text-xs text-white/60 italic select-none">
                        &quot;{suggestionInsight}&quot;
                      </p>
                    </div>
                  </div>

                  {/* Checklist Categories: Work & Personal */}
                  <div className="space-y-6">
                    {/* Search bar inside list switcher */}
                    <div className="flex items-center gap-3">
                      <div className="relative flex-grow">
                        <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-white/30" />
                        <input 
                          type="text" 
                          placeholder="Search commander matrix..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/40 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none transition-all placeholder-white/20"
                        />
                      </div>
                      
                      {/* Search Clear */}
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="text-xs font-mono text-[#3b82f6] hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    {/* Category: WORK list */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono uppercase text-white/50 tracking-widest pl-2 flex items-center gap-2 border-l border-[#3b82f6]">
                        Work Operations
                      </h4>
                      <div className="space-y-2">
                        {filteredTasks.filter(t => t.category === 'work').length === 0 ? (
                          <p className="text-xs text-white/20 italic pl-3">No active work items calibrated.</p>
                        ) : (
                          filteredTasks.filter(t => t.category === 'work').map(t => (
                            <div 
                              key={t.id} 
                              className={`p-4 rounded-xl flex items-center justify-between gap-4 transition-all duration-300 border ${
                                t.completed 
                                  ? 'bg-[#ffffff01] border-white/5 opacity-40 line-through' 
                                  : 'bg-[#ffffff03] backdrop-blur-md border-white/5 hover:border-[#3b82f6]/20'
                              }`}
                            >
                              <div className="flex items-center gap-3.5 flex-grow min-w-0">
                                <button 
                                  onClick={() => toggleTaskCompletion(t.id)}
                                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                                    t.completed 
                                      ? 'border-[#3b82f6] bg-[#3b82f6]/20 text-[#3b82f6]'
                                      : 'border-[#3b82f6]/40 hover:border-[#3b82f6] bg-transparent text-transparent'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{t.title}</p>
                                  <div className="flex items-center gap-2.5 mt-1 text-[11px] font-mono text-white/40">
                                    {t.priority === 'high' && (
                                      <span className="text-red-400 font-bold flex items-center gap-0.5">
                                        ❗ High
                                      </span>
                                    )}
                                    {t.dueDateText && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {t.dueDateText}
                                      </span>
                                    )}
                                    {t.estimatedEnergy && (
                                      <span className="hidden sm:inline">• {t.estimatedEnergy}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                {/* Visual glow priority edge indicator marker */}
                                <div className={`w-1.5 h-8 rounded-full blur-[1px] ${
                                  t.priority === 'high' ? 'bg-red-500/40' : 'bg-[#3b82f6]/40'
                                }`} />
                                
                                <button 
                                  onClick={() => deleteTask(t.id)}
                                  className="p-1 text-white/20 hover:text-red-400 rounded transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Category: PERSONAL list */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono uppercase text-white/50 tracking-widest pl-2 flex items-center gap-2 border-l border-[#3b82f6]">
                        Personal Objectives
                      </h4>
                      <div className="space-y-2">
                        {filteredTasks.filter(t => t.category === 'personal').length === 0 ? (
                           <p className="text-xs text-white/20 italic pl-3">No active personal items calibrated.</p>
                        ) : (
                          filteredTasks.filter(t => t.category === 'personal').map(t => (
                            <div 
                              key={t.id} 
                              className={`p-4 rounded-xl flex items-center justify-between gap-4 transition-all duration-300 border ${
                                t.completed 
                                  ? 'bg-[#ffffff01] border-white/5 opacity-40 line-through' 
                                  : 'bg-[#ffffff03] backdrop-blur-md border-white/5 hover:border-[#3b82f6]/20'
                              }`}
                            >
                              <div className="flex items-center gap-3.5 flex-grow min-w-0">
                                <button 
                                  onClick={() => toggleTaskCompletion(t.id)}
                                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                                    t.completed 
                                      ? 'border-[#3b82f6] bg-[#3b82f6]/20 text-[#3b82f6]'
                                      : 'border-[#3b82f6]/40 hover:border-[#3b82f6] bg-transparent text-transparent'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{t.title}</p>
                                  <div className="flex items-center gap-2.5 mt-1 text-[11px] font-mono text-white/40">
                                    {t.priority === 'high' && (
                                      <span className="text-red-400 font-bold">❗ High</span>
                                    )}
                                    {t.dueDateText && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {t.dueDateText}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                {/* Visual glow priority edge indicator marker */}
                                <div className="w-1.5 h-8 rounded-full blur-[1px] bg-[#3b82f6]/40" />
                                
                                <button 
                                  onClick={() => deleteTask(t.id)}
                                  className="p-1 text-white/20 hover:text-red-400 rounded transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Column Right (4 cols): Stats + System logs */}
                <aside className="lg:col-span-4 flex flex-col gap-6">
                  
                  {/* Stats card */}
                  <div className="bg-[#ffffff03] backdrop-blur-md border border-white/10 p-6 rounded-[24px] flex flex-col">
                    <h4 className="text-xs uppercase font-mono tracking-wider font-semibold text-white/50 mb-6">
                      Efficiency Engine
                    </h4>

                    {/* Radial gauge */}
                    <div className="relative w-full aspect-square max-w-[200px] mx-auto flex items-center justify-center mb-6 select-none">
                      <svg className="w-full h-full -rotate-90">
                        <circle className="text-white/5" cx="50%" cy="50%" fill="transparent" r="42%" stroke="currentColor" strokeWidth="6" />
                        <motion.circle 
                          className="text-[#3b82f6]" 
                          cx="50%" 
                          cy="50%" 
                          fill="transparent" 
                          r="42%" 
                          stroke="currentColor" 
                          strokeWidth="6"
                          strokeDasharray="264"
                          initial={{ strokeDashoffset: 264 }}
                          animate={{ strokeDashoffset: 264 - (264 * displayEfficiency) / 100 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          strokeLinecap="round"
                          style={{ filter: "drop-shadow(0 0 8px #00f2ff)" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-display font-bold text-white tracking-tight">{displayEfficiency}%</span>
                        <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">DAILY LOAD</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                        <p className="text-[10px] font-mono text-white/40 mb-1 uppercase">Objective Checked</p>
                        <p className="text-lg font-bold text-[#3b82f6] tabular-nums">{completedChecklisted}</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                        <p className="text-[10px] font-mono text-white/40 mb-1 uppercase font-semibold">Total Target</p>
                        <p className="text-lg font-bold text-white/60 tabular-nums">{totalChecklisted}</p>
                      </div>
                    </div>
                  </div>

                  {/* Star map visualization style */}
                  <div className="bg-[#ffffff03] backdrop-blur-md border border-white/10 p-6 rounded-[24px] select-none group">
                    <h4 className="text-xs font-mono uppercase text-white/50 tracking-widest mb-4">
                      Upcoming Schedule
                    </h4>
                    <div className="relative overflow-hidden rounded-xl h-36 border border-white/5">
                      <img 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9pptpdQOaYfvH2H_TKyL2wOQ6dK89FIsyH3v1jGtWWd2vttSrTN3iZVJlbL_G7dp3kJSizI3msGas2InRMiPV2ARupZVGcalc7VrKk4UJrM-Z3nKAe4gvsyhDPEUDAYfIEAc1QTsOLIA2JlRv4O5a05oeqCQFZAxHoCDJnkR7VjVtBAXPh8vr4fsZ3Rm1PovZGJkW_g-jnWGAEJpJNqPBYl9jGWx5UNHlI8K-LWH4HoqVV310Hta8MpS9evNI6w0e7khlpu_mTSld"
                        alt="TaskNova cosmic engine trajectory visualizer"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-25 grayscale group-hover:grayscale-0 group-hover:opacity-45 transition-all duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 font-mono text-[9px] text-[#3b82f6]">
                        <Activity className="w-3.5 h-3.5 animate-pulse" />
                        COSMIC ALIGNMENT STABLE
                      </div>
                    </div>
                  </div>

                  {/* System Log */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono uppercase text-white/50 tracking-widest pl-2">
                      System Logs
                    </h4>
                    
                    <div className="bg-[#ffffff03] backdrop-blur-md rounded-[24px] border border-white/10 overflow-hidden">
                      <div className="divide-y divide-white/5">
                        {sysLogs.map((log) => (
                          <div key={log.id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                log.type === 'primary' ? 'bg-[#3b82f6]' : 'bg-white/40'
                              }`} />
                              <p className="text-xs text-white/70 truncate">{log.text}</p>
                            </div>
                            <span className="text-[10px] font-mono text-white/20 shrink-0">{log.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </aside>
              </div>

            </motion.div>
          )}

          {/* 2. NEXT INTERCEPTS / SCHEDULER TAB */}
          {activeTab === 'alarms' && (
            <motion.div
              key="alarms"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl mx-auto space-y-8"
            >
              <div>
                <h3 className="text-xs uppercase font-mono tracking-[0.2em] text-[#3b82f6] font-semibold">CALIBRATION PROTOCOLS</h3>
                <h4 className="text-2xl font-display font-medium text-white">Next Intercepts</h4>
                <p className="text-xs text-white/40 mt-1 font-mono">Select specific neural timings to trigger priority overlays.</p>
              </div>

              <div className="bg-[#ffffff03] backdrop-blur-md border border-white/10 rounded-[24px] p-6 space-y-6">
                <div className="space-y-4">
                  {alarms.map((alarm) => (
                    <div 
                      key={alarm.id} 
                      className={`p-4 rounded-xl flex items-center justify-between transition-all border ${
                        alarm.active 
                          ? 'bg-white/[0.03] border-[#3b82f6]/30 shadow-sm' 
                          : 'bg-transparent border-white/5 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Clock className={`w-5 h-5 ${alarm.active ? 'text-[#3b82f6]' : 'text-white/25'}`} />
                        <div>
                          <span className={`text-2xl font-display font-medium tracking-wide ${alarm.active ? 'text-white' : 'text-white/40'}`}>
                            {alarm.time}
                          </span>
                          <p className="text-xs text-white/40">{alarm.title}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Interactive Test trigger */}
                        {alarm.active && (
                          <button 
                            onClick={() => triggerAlarm(alarm)}
                            className="px-2.5 py-1 text-[10px] uppercase font-mono border border-[#3b82f6]/30 hover:border-[#3b82f6] hover:bg-[#3b82f6]/10 rounded text-[#3b82f6] transition-all cursor-pointer"
                          >
                            Forced Fire
                          </button>
                        )}
                        
                        {/* Switch component */}
                        <button
                          onClick={() => {
                            setAlarms(prev => prev.map(a => {
                              if (a.id === alarm.id) {
                                const updated = { ...a, active: !a.active };
                                persistAlarm(updated);
                                return updated;
                              }
                              return a;
                            }));
                            addLog(`Toggled trigger timing for "${alarm.title}"`, 'secondary');
                          }}
                          className={`w-10 h-6 rounded-full flex items-center px-1 transition-all cursor-pointer ${
                            alarm.active ? 'bg-[#3b82f6]/30 border border-[#3b82f6]/50' : 'bg-white/10'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full transition-all ${
                            alarm.active ? 'bg-[#3b82f6] translate-x-4' : 'bg-white/40'
                          }`} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/5">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const title = fd.get('title') as string;
                    const time = fd.get('time') as string;
                    if (!title || !time) return;

                    const created: Alarm = {
                      id: 'manual_alarm_' + Date.now(),
                      title,
                      time,
                      active: true
                    };
                    setAlarms(prev => [...prev, created]);
                    persistAlarm(created);
                    e.currentTarget.reset();
                    addLog(`Created tactical timing: "${title}" at ${time}`, 'primary');
                  }} className="space-y-3">
                    <h5 className="text-[11px] font-mono text-[#3b82f6] uppercase tracking-wider font-semibold">Deploy Schedule Intercept</h5>
                    <div className="grid grid-cols-3 gap-2">
                      <input 
                        type="time" 
                        name="time"
                        required 
                        className="col-span-1 bg-white/5 border border-white/10 focus:border-[#3b82f6]/40 rounded-xl py-2 px-3 text-xs text-white focus:outline-none placeholder-white/20"
                      />
                      <input 
                        type="text" 
                        name="title" 
                        placeholder="Label, e.g. Design Review" 
                        required
                        className="col-span-2 bg-white/5 border border-white/10 focus:border-[#3b82f6]/40 rounded-xl py-2 px-3 text-xs text-white focus:outline-none placeholder-white/20"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-2.5 bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 border border-[#3b82f6]/30 text-[#3b82f6] font-mono text-xs rounded-xl transition-all cursor-pointer font-semibold"
                    >
                      + ADD TRIGGER POINT
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. FOCUS TIMER & SOUNDSCAPES TAB */}
          {activeTab === 'focus-timer' && (
            <motion.div
              key="focus-timer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl mx-auto space-y-8"
            >
              <div>
                <h3 className="text-xs uppercase font-mono tracking-[0.2em] text-[#3b82f6] font-semibold">NEURAL TRANQUILITY</h3>
                <h4 className="text-2xl font-display font-medium text-white">Deep Focus Module</h4>
              </div>

              {/* Countdown panel */}
              <div className="bg-[#ffffff03] backdrop-blur-md border border-white/10 rounded-[24px] p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-4 left-4 font-mono text-[9px] text-[#3b82f6] tracking-widest uppercase bg-[#3b82f6]/10 px-2.5 py-1 rounded border border-[#3b82f6]/20 font-semibold">
                  DEEP FOCUS PHASE
                </div>

                <div className="relative w-48 h-48 flex items-center justify-center select-none text-white my-6">
                  {/* Rotating glow ring around clock */}
                  <div className={`absolute inset-0 rounded-full border border-dashed border-[#3b82f6]/20 ${isFocusing ? 'animate-[spin_40s_linear_infinite]' : ''}`} />
                  <div className="text-5xl font-display font-bold tabular-nums drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                    {Math.floor(focusTimeLeft / 60).toString().padStart(2, '0')}:
                    {(focusTimeLeft % 60).toString().padStart(2, '0')}
                  </div>
                </div>

                <div className="flex gap-4 w-full max-w-sm mb-2 z-10">
                  <button 
                    onClick={() => {
                      setIsFocusing(!isFocusing);
                      addLog(`${isFocusing ? 'Paused' : 'Resumed'} deep focus session timer`, 'secondary');
                    }}
                    className={`flex-grow py-3 rounded-full font-mono text-xs uppercase font-bold tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                      isFocusing 
                        ? 'bg-white hover:brightness-110 text-black shadow-md'
                        : 'bg-[#3b82f6] hover:bg-[#2563eb] text-white shadow-md'
                    }`}
                  >
                    {isFocusing ? (
                      <>
                        <Square className="w-4 h-4" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" /> Resume Session
                      </>
                    )}
                  </button>

                  <button 
                    onClick={() => {
                      setIsFocusing(false);
                      setFocusTimeLeft(25 * 60);
                      addLog(`Reset focus session timer`, 'secondary');
                    }}
                    className="px-6 py-3 border border-white/10 hover:border-red-400/40 bg-white/5 text-white/60 hover:text-white rounded-full font-mono text-xs transition-all active:scale-95 cursor-pointer"
                  >
                    RESET
                  </button>
                </div>
                
                <p className="text-[10px] font-mono text-white/30 uppercase mt-2">
                  Session {completedSessions} of {totalSessionsGoal} ({(completedSessions/totalSessionsGoal)*100}% of daily goals secured)
                </p>
              </div>

              {/* Soundscape Control */}
              <div className="bg-[#ffffff03] backdrop-blur-md border border-white/10 rounded-[24px] p-6 space-y-4">
                <div className="flex justify-between items-center pr-1">
                  <h4 className="text-xs uppercase font-mono tracking-widest text-[#3b82f6] font-semibold flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4" /> Soundscape Synthesizer
                  </h4>
                  <span className="text-[9px] font-mono text-white/30">HTML5 Synth</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'rain', label: 'Rain', icon: '🌧️' },
                    { id: 'cyber', label: 'Cyber-Ambient', icon: '🌌' },
                    { id: 'space', label: 'Deep Space', icon: '🪐' }
                  ].map((s) => (
                    <button 
                      key={s.id}
                      onClick={() => {
                        if (soundscape === s.id) {
                          setSoundscape(null);
                          addLog(`Deactivated soundscape synthesizer`, 'secondary');
                        } else {
                          setSoundscape(s.id as any);
                          addLog(`Synthesized soundscape stream: "${s.label}"`, 'primary');
                        }
                      }}
                      className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all active:scale-95 ${
                        soundscape === s.id 
                           ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6]'
                           : 'bg-white/5 border-white/5 hover:border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      <span className="text-xl select-none">{s.icon}</span>
                      <span className="text-xs font-mono font-medium tracking-wide">{s.label}</span>
                    </button>
                  ))}
                </div>

                {/* Audio volume slider */}
                <div className="pt-2 flex items-center gap-4 text-xs font-mono text-white/60 select-none">
                  {audioVolume === 0 ? <VolumeX className="w-4 h-4 shrink-0" /> : <Volume2 className="w-4 h-4 shrink-0" />}
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05"
                    value={audioVolume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setAudioVolume(v);
                      ambientSynth.setVolume(v);
                    }}
                    className="flex-grow accent-[#3b82f6] h-1"
                  />
                  <span>{Math.round(audioVolume * 100)}%</span>
                </div>
              </div>

              {/* Goal milestone tracker */}
              <div className="bg-[#ffffff03] border border-white/10 p-6 rounded-[24px] flex justify-between items-center gap-4">
                <div>
                  <h5 className="text-xs font-mono uppercase text-[#3b82f6] font-semibold mb-1">Daily Focus Meter</h5>
                  <p className="text-xs text-white/40">Complete 8 sessions to gain system credentials.</p>
                </div>
                <div className="flex items-center gap-2 text-[#3b82f6] font-sans font-semibold">
                  <Award className="w-5 h-5 text-[#3b82f6] animate-bounce" />
                  <span>+200 XP</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* 4. AI COMMAND TERMINAL / ASSISTANT TAB */}
          {activeTab === 'ai-command' && (
            <motion.div
              key="ai-command"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl mx-auto space-y-8"
            >
              <div>
                <h3 className="text-xs uppercase font-mono tracking-[0.2em] text-[#3b82f6] font-semibold">NEURAL INTELLIGENCE</h3>
                <h4 className="text-2xl font-display font-medium text-white">Commander Assist</h4>
                <p className="text-xs text-white/40 mt-1 pr-4">Type instructions to let Nova AI automatically categorize, prioritize and schedule your tasks.</p>
              </div>

              <div className="bg-[#ffffff03] backdrop-blur-md border border-white/10 rounded-[24px] p-6 flex flex-col gap-4">
                
                {/* AI Log display */}
                <div className="bg-[#0d0d12]/60 rounded-[16px] p-4 border border-white/10 min-h-[140px] flex flex-col justify-between font-mono text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-[#3b82f6]">
                      <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-ping" />
                      <span>NOVA ADVISORY UNIT:</span>
                    </div>
                    {aiLoading ? (
                      <div className="flex items-center gap-2 text-white/50 italic py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#3b82f6]" />
                        <span>Calibrating task arrays... Awaiting Gemini parameters...</span>
                      </div>
                    ) : (
                      <p className="text-white/80 leading-relaxed whitespace-pre-line">{aiOutputLog}</p>
                    )}
                  </div>
                  <span className="text-[9px] text-white/25 uppercase tracking-widest text-right mt-4 select-none">Nova Cosmos Ver 1.0</span>
                </div>

                {/* AI Text instructions Form */}
                <form onSubmit={handleAiCommand} className="relative flex items-center">
                  <input 
                    type="text" 
                    required
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="E.g. Schedule dev sync tomorrow morning at 10..." 
                    disabled={aiLoading}
                    className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/30 focus:outline-none rounded-2xl py-3 pl-4 pr-12 text-sm text-white placeholder-white/20 transition-all text-ellipsis"
                  />
                  <button 
                    type="submit"
                    disabled={aiLoading}
                    className="absolute right-2 p-2 bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 text-[#3b82f6] disabled:opacity-50 rounded-xl border border-[#3b82f6]/30 hover:scale-102 active:scale-95 transition-all cursor-pointer"
                  >
                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>

                {/* Voice recording and active analysis dashboard */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-medium text-[#3b82f6] uppercase tracking-wide flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-[#3b82f6]" /> Live Voice Assistant
                    </span>
                    <span className="text-[9px] font-mono text-[#00f2ff] uppercase tracking-widest font-bold">ACTIVE DEPLOY</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      type="button"
                      onClick={startVoiceAssistant}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-95 cursor-pointer ${
                        isListening 
                          ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                          : 'bg-[#3b82f6]/10 border border-[#3b82f6]/30 hover:bg-[#3b82f6]/20 text-[#3b82f6]'
                      }`}
                    >
                      <Mic className={`w-5 h-5 ${isListening ? 'animate-bounce' : ''}`} />
                    </button>
                    <div className="flex-grow space-y-1 min-w-0">
                      <p className="text-xs text-white/80 font-mono leading-snug truncate">{voiceTranscript}</p>
                      {isListening ? (
                        <div className="flex items-center gap-1">
                          <span className="w-1 bg-red-400 h-3 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                          <span className="w-1 bg-[#3b82f6] h-5 rounded-full animate-pulse" />
                          <span className="w-1 bg-red-400 h-2 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          <span className="w-1 bg-[#3b82f6] h-4 rounded-full animate-pulse" />
                        </div>
                      ) : (
                        <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
                          TAP MIC NODE TO DICTATE INSTRUCTIONS
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-white/30 mt-2 italic leading-relaxed">
                    Say things like: &quot;Set alarm for 18:30&quot; or &quot;Add task to code reviews tomorrow morning&quot;. Dynamic artificial intelligence processes actions with synthesized voice feedbacks.
                  </p>
                </div>
              </div>

              {/* Suggestions shortcuts */}
              <div className="space-y-3">
                <h5 className="text-[11px] font-mono text-white/40 uppercase tracking-widest pl-1">Command Presets:</h5>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    "Schedule stand-up sync tomorrow morning at 09:30",
                    "Add personal evening gym session at 19:00",
                    "Draft client proposal critical reports"
                  ].map((preset, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setAiInput(preset)}
                      className="px-3.5 py-2 bg-white/5 border border-white/10 hover:border-[#3b82f6]/30 rounded-full text-white/70 hover:text-white transition-all text-left cursor-pointer"
                    >
                      &quot;{preset}&quot;
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* 5. SYSTEM SETTINGS TAB */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl mx-auto space-y-8"
            >
              <div>
                <h3 className="text-xs uppercase font-mono tracking-[0.2em] text-[#3b82f6] font-semibold">SYSTEM CONTROL</h3>
                <h4 className="text-2xl font-display font-medium text-white">Central Config</h4>
              </div>

              <div className="bg-[#ffffff03] backdrop-blur-md border border-white/10 rounded-[24px] p-6 space-y-6">
                
                {/* Profile Metric settings */}
                <div className="space-y-4">
                  <h5 className="text-xs uppercase font-mono text-[#3b82f6] tracking-widest font-semibold">Commander Profile</h5>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-mono text-white/40 uppercase mb-1">Target Persona Name</label>
                      <input 
                        type="text" 
                        value={activeObjective.title} 
                        onChange={(e) => setActiveObjective(p => ({ ...p, title: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/30 focus:outline-none rounded-xl py-2 px-3 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-white/40 uppercase mb-1">Target Mission Objective</label>
                      <textarea
                        rows={3}
                        value={activeObjective.description}
                        onChange={(e) => setActiveObjective(p => ({ ...p, description: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/30 focus:outline-none rounded-xl py-2 px-3 text-xs text-white resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Security Credentials sync controls */}
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <h5 className="text-xs uppercase font-mono text-[#3b82f6] tracking-widest font-semibold">Security & Credentials</h5>
                  {currentUser ? (
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-3">
                      <div>
                        <p className="text-[10px] uppercase font-mono text-white/40">Authorized Client Link</p>
                        <p className="text-xs text-[#00f2ff] font-sans font-medium mt-1 select-all break-all">
                          {currentUser.phoneNumber || currentUser.email || "Tactical Link"}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          await signOut(auth);
                          setCurrentUser(null);
                          setGuestMode(false);
                          addLog("Unlinked interactive session profile.", "secondary");
                        }}
                        className="px-4 py-2 w-full bg-red-950/25 border border-red-500/40 text-red-400 text-xs font-mono rounded-xl transition-all cursor-pointer hover:bg-red-950/40 flex items-center justify-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        DISCONNECT CLIENT MAINFRAME
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                      <p className="text-xs text-white/60 font-medium">Guest sandbox status active. Cloud databases unsaved.</p>
                      <button
                        onClick={() => {
                          setGuestMode(false);
                          addLog("Redirecting to authorization gateway.", "secondary");
                        }}
                        className="px-4 py-2 w-full bg-[#3b82f6]/10 hover:bg-[#3b82f6]/15 border border-[#3b82f6]/30 text-[#3b82f6] text-xs font-mono rounded-xl transition-all cursor-pointer hover:bg-[#3b82f6]/20 font-bold"
                      >
                        AUTHENTICATE MAINFRAME CREDENTIALS
                      </button>
                    </div>
                  )}
                </div>

                {/* Developer system reset controls */}
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <h5 className="text-xs uppercase font-mono text-red-500 tracking-widest font-semibold">Mainframe Redundancy</h5>
                  <p className="text-xs text-white/40">Clear persistent databases and rollback configurations to factory states.</p>
                  
                  <div className="flex gap-2.5">
                    <button 
                      onClick={() => {
                        localStorage.removeItem('tasknova_tasks');
                        localStorage.removeItem('tasknova_alarms');
                        setTasks(DEFAULT_TASKS);
                        setAlarms(DEFAULT_ALARMS);
                        addLog("Rollback diagnostic complete. Core database cleared.");
                      }}
                      className="px-4 py-2 bg-red-950/20 border border-red-500/40 text-red-400 text-xs font-mono rounded-xl transition-all cursor-pointer hover:bg-red-950/40"
                    >
                      WIPE DATABASE
                    </button>

                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-white/5 border border-white/10 text-white/80 text-xs font-mono rounded-xl transition-all cursor-pointer hover:bg-white/10"
                    >
                      FORCE REBOOT
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* FLOAT ACTION BUTTON TO MODAL (DESKTOP / FLOATING ONLY) */}
      <div className="fixed bottom-24 right-6 md:right-12 z-30">
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-14 h-14 bg-[#3b82f6] hover:bg-[#2563eb] rounded-full flex items-center justify-center text-white shadow-md hover:scale-105 active:scale-95 transition-all group cursor-pointer border border-white/10"
        >
          <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* BOTTOM TAB MENU NAVIGATION BAR */}
      <footer className="fixed bottom-0 left-0 right-0 z-40">
        <nav className="bg-[#0d0d12]/85 backdrop-blur-md border-t border-white/10 flex justify-around items-center px-4 pb-safe h-20 md:max-w-md md:mx-auto md:mb-6 md:rounded-full md:border shadow-2xl shrink-0 select-none">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center p-3 rounded-full transition-all duration-300 active:scale-90 cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30 shadow-sm' 
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>

          <button 
            onClick={() => setActiveTab('alarms')}
            className={`flex flex-col items-center justify-center p-3 rounded-full transition-all duration-300 active:scale-90 cursor-pointer ${
              activeTab === 'alarms' 
                ? 'bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30 shadow-sm' 
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Calendar className="w-5 h-5" />
          </button>

          <button 
            onClick={() => setActiveTab('ai-command')}
            className={`flex flex-col items-center justify-center p-3 rounded-full transition-all duration-300 active:scale-90 cursor-pointer ${
              activeTab === 'ai-command' 
                ? 'bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30 shadow-sm' 
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>

          <button 
            onClick={() => setActiveTab('focus-timer')}
            className={`flex flex-col items-center justify-center p-3 rounded-full transition-all duration-300 active:scale-90 cursor-pointer ${
              activeTab === 'focus-timer' 
                ? 'bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30 shadow-sm' 
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Clock className="w-5 h-5" />
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center p-3 rounded-full transition-all duration-300 active:scale-90 cursor-pointer ${
              activeTab === 'settings' 
                ? 'bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30 shadow-sm' 
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Sliders className="w-5 h-5" />
          </button>
        </nav>
      </footer>

      {/* MODAL overlay: ADD TASK MANUALLY */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0c0e12] border border-white/10 rounded-[24px] p-6 w-full max-w-sm space-y-4"
            >
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-display">Schedule New Instruction</h4>
              
              <form onSubmit={handleAddNewTask} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-white/40 uppercase mb-1 font-semibold">Instruction Title</label>
                  <input 
                    type="text" 
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="E.g. Code Review meeting"
                    className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/30 focus:outline-none rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono text-white/40 uppercase mb-1 font-semibold">Matrix Category</label>
                    <select 
                      value={newTaskCategory}
                      onChange={(e) => setNewTaskCategory(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/30 focus:outline-none rounded-xl py-2 px-3 text-xs text-white"
                    >
                      <option value="work" className="bg-[#0c0e12]">Work Operation</option>
                      <option value="personal" className="bg-[#0c0e12]">Personal Object</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-white/40 uppercase mb-1 font-semibold">Mission Urgency</label>
                    <select 
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/30 focus:outline-none rounded-xl py-2 px-3 text-xs text-white"
                    >
                      <option value="normal" className="bg-[#0c0e12]">Normal Priority</option>
                      <option value="high" className="bg-[#0c0e12]">High Priority</option>
                      <option value="system" className="bg-[#0c0e12]">System Priority</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-white/40 uppercase mb-1 font-semibold">Scheduled Intercept / Deadline</label>
                  <input 
                    type="text" 
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    placeholder="E.g. Today, Tomorrow, 15:45"
                    className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/30 focus:outline-none rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="flex-grow py-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 font-mono text-xs rounded-xl transition-all cursor-pointer"
                  >
                    ABORT
                  </button>
                  <button 
                    type="submit"
                    className="flex-grow py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-mono text-xs rounded-xl shadow-sm transition-all cursor-pointer font-semibold"
                  >
                    DEPLOY
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DYNAMIC URGENT ALARM SCREEN OVERLAY */}
      <AnimatePresence>
        {activeAlert && (
          <div className="fixed inset-0 bg-transparent z-50 overflow-hidden flex flex-col font-sans select-none select-text">
            {/* Urgent dark red breathing atmosphere */}
            <div className="absolute inset-0 bg-[#0c0e12]/95 z-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-red-950/20 to-black z-0 pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />

            {/* Pulse expansion rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <div className="absolute w-[300px] h-[300px] rounded-full border border-red-500/10 animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute w-[500px] h-[500px] rounded-full border border-red-500/5 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
            </div>

            {/* Alarm UI Canvas */}
            <main className="relative z-10 flex-grow flex flex-col items-center justify-between py-12 px-6 text-center select-text">
              
              {/* Identity Segment */}
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <AlertOctagon className="w-5 h-5 text-red-500 animate-bounce" />
                  <span className="font-mono text-xs text-red-400 uppercase tracking-widest leading-none font-semibold">Critical Alert</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-display font-bold text-white tracking-widest drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                  {activeAlert.time === 'Test Mode' ? '04:26' : activeAlert.time}
                </h2>
                <p className="text-base md:text-lg font-mono text-white/80 max-w-sm md:max-w-xl mx-auto uppercase tracking-wide font-medium">
                  Emergency: {activeAlert.title}
                </p>
              </div>

              {/* Sound Wave Visualization - Simulated Bar bounces */}
              <div className="w-full max-w-xl flex items-end justify-center gap-1 h-32 md:h-44 overflow-hidden my-6 select-none">
                <div className="flex items-end gap-1.5 h-full">
                  {waveBars.map((h, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 md:w-2 bg-gradient-to-t from-[#3b82f6] to-[#ef4444] rounded-full transition-all duration-100 ease-in-out" 
                      style={{ 
                        height: `${h}%`,
                        opacity: h / 100 * 0.7 + 0.3
                      }} 
                    />
                  ))}
                </div>
              </div>

              {/* Transcription Section */}
              <div className="bg-[#ffffff03] backdrop-blur-md border-l-[3.5px] border-l-[#3b82f6] border border-white/10 rounded-2xl p-6 max-w-lg w-full text-center relative overflow-hidden my-4 select-text">
                <div className="flex items-center justify-center gap-2 mb-3 text-[#3b82f6] select-none font-semibold">
                  <Mic className="w-4 h-4 text-[#3b82f6]" />
                  <span className="font-mono text-xs uppercase tracking-wider">Voice Transcription</span>
                </div>
                <p className="text-sm italic text-white/70 leading-relaxed select-text font-medium">
                  &quot;Nova, this is a critical reminder for the final product launch sync. All stakeholders are standing by. Review the objectives immediately for prompt core deployment.&quot;
                </p>
              </div>

              {/* Action trigger decisions */}
              <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-2 gap-4 px-4 mb-4 select-none">
                
                <button 
                  onClick={() => {
                    setActiveAlert(null);
                    addLog(`Alarm "${activeAlert.title}" was snoozed. Re-calibration in 10m.`, 'secondary');
                    
                    // Stop any speaking audio or alarm tones
                    try {
                      ambientSynth.stop();
                    } catch (synthErr) {}
                    try { window.speechSynthesis.cancel(); } catch(e){}
                  }}
                  className="group py-4 px-6 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl transition-all cursor-pointer shrink-0 flex items-center justify-center gap-3 active:scale-95 text-left"
                >
                  <Clock className="w-5 h-5 text-white/40 font-mono transition-transform group-hover:rotate-12" />
                  <div>
                    <span className="block text-sm font-bold text-white">Snooze</span>
                    <span className="block text-[10px] font-mono text-white/40">Recalibrate 10m</span>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    const alertId = activeAlert.id;
                    const alertTitle = activeAlert.title;
                    setActiveAlert(null);
                    
                    // Also gracefully mark any equivalent task checked completed!
                    setTasks(prev => prev.map(t => {
                      if (t.title.toLowerCase().includes(alertTitle.toLowerCase())) {
                        const modified = { ...t, completed: true };
                        persistTask(modified);
                        return modified;
                      }
                      return t;
                    }));

                    addLog(`Objective completed and dismissed: "${alertTitle}"`, 'primary');
                    
                    // Stop any speaking audio or alarm tones
                    try {
                      ambientSynth.stop();
                    } catch (synthErr) {}
                    try { window.speechSynthesis.cancel(); } catch(e){}
                  }}
                  className="group py-4 px-6 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-xl transition-all cursor-pointer shrink-0 font-bold flex items-center justify-center gap-3 active:scale-95 text-left shadow-md"
                >
                  <Check className="w-5 h-5 text-white animate-pulse" />
                  <div>
                    <span className="block text-sm font-bold text-white">Dismiss Alert</span>
                    <span className="block text-[10px] font-mono text-white/80 font-medium">Mark complete</span>
                  </div>
                </button>

              </div>

            </main>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
