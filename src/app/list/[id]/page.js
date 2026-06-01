"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, onValue, push, set, remove, runTransaction, get } from "firebase/database";
import { RateLimiter } from "@/lib/rateLimiter";
import { 
  ArrowLeft,
  Share2,
  ThumbsUp,
  ShieldAlert,
  Search,
  FolderPlus,
  Plus,
  Check,
  Flame,
  UserCheck,
  ListChecks,
  X,
  TrendingUp,
  Filter,
  CheckCircle2,
  User,
  Users,
  LogIn,
  Crown
} from "lucide-react";

const ITEM_CATEGORIES = [
  "Bedding & Linens",
  "Toiletries & Bath",
  "Academics & Desk",
  "Electronics & Tech",
  "Laundry & Cleaning",
  "Kitchen & Dining",
  "Medical & First Aid",
  "Clothing & Apparel",
  "Other"
];

export default function ListDetails() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  // Username / Member gate
  const [username, setUsername] = useState("");
  const [enteredName, setEnteredName] = useState("");
  const [showNameGate, setShowNameGate] = useState(true);
  const [members, setMembers] = useState([]);

  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("All");
  const [mounted, setMounted] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  // Per-user packed state (synced via Firebase RTDB)
  const [packedItems, setPackedItems] = useState(new Set());
  const packedUnsubRef = useRef(null);

  // Sanitize username for use as a Firebase key (no . # $ [ ] /)
  const sanitizeKey = (str) => {
    return str.replace(/[.#$\[\]\/]/g, '_').toLowerCase();
  };

  // User Settings
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State for Adding Item
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("Bedding & Linens");
  const [showAddForm, setShowAddForm] = useState(false);
  const [justAdded, setJustAdded] = useState(null);

  // Cooldown / Security State
  const [cooldownTime, setCooldownTime] = useState(0);
  const [cooldownExpiry, setCooldownExpiry] = useState(0);
  const [showSpamOverlay, setShowSpamOverlay] = useState(false);
  
  const rateLimiterRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  // Check if user already has a stored name for this list
  useEffect(() => {
    if (!id) return;
    const storedName = localStorage.getItem(`listron-user-${id}`);
    if (storedName) {
      setUsername(storedName);
      setShowNameGate(false);
    }
  }, [id]);

  // Real-time listener for per-user packed state from Firebase
  useEffect(() => {
    if (!id || !username) return;

    // Clean up previous listener
    if (packedUnsubRef.current) {
      packedUnsubRef.current();
    }

    const safeKey = sanitizeKey(username);
    const packedRef = ref(db, `lists/${id}/packedBy/${safeKey}`);

    const unsubscribe = onValue(packedRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPackedItems(new Set(Object.keys(data)));
      } else {
        setPackedItems(new Set());
      }
    });

    packedUnsubRef.current = unsubscribe;

    return () => {
      unsubscribe();
      packedUnsubRef.current = null;
    };
  }, [id, username]);

  // Initialize Rate Limiter
  useEffect(() => {
    rateLimiterRef.current = new RateLimiter(`rate-limiter-${id}`);
    
    const check = rateLimiterRef.current.checkLimit();
    if (check.isLimited) {
      setCooldownTime(check.remainingSeconds);
      setCooldownExpiry(check.cooldownExpiry);
      setShowSpamOverlay(true);
      startCountdown(check.cooldownExpiry);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [id]);

  // Load Checklist, Items & Members
  useEffect(() => {
    if (!id) return;
    const listRef = ref(db, `lists/${id}`);
    
    const unsubscribe = onValue(listRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setList({
          title: val.title,
          description: val.description,
          category: val.category,
          createdAt: val.createdAt
        });

        if (val.items) {
          const parsedItems = Object.keys(val.items).map((key) => ({
            id: key,
            ...val.items[key]
          })).sort((a, b) => {
            if (b.upvotes !== a.upvotes) {
              return b.upvotes - a.upvotes;
            }
            return b.createdAt - a.createdAt;
          });
          setItems(parsedItems);
        } else {
          setItems([]);
        }

        // Load members
        if (val.members) {
          const parsedMembers = Object.keys(val.members).map((key) => ({
            id: key,
            ...val.members[key]
          })).sort((a, b) => a.joinedAt - b.joinedAt);
          setMembers(parsedMembers);
        } else {
          setMembers([]);
        }
      } else {
        setList(null);
        setItems([]);
        setMembers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  // Handle name entry and register as member
  const handleJoinList = async (e) => {
    e.preventDefault();
    const name = enteredName.trim();
    if (!name) return;
    if (name.length > 30) return;

    // Store name locally
    localStorage.setItem(`listron-user-${id}`, name);
    setUsername(name);
    setShowNameGate(false);
    // Packed state will be loaded automatically by the useEffect listener above

    // Add to members in Firebase (check if name already exists)
    try {
      const membersRef = ref(db, `lists/${id}/members`);
      const snapshot = await get(membersRef);
      const existingMembers = snapshot.val();
      
      // Check if name already exists
      let alreadyMember = false;
      if (existingMembers) {
        Object.values(existingMembers).forEach((m) => {
          if (m.name.toLowerCase() === name.toLowerCase()) {
            alreadyMember = true;
          }
        });
      }

      if (!alreadyMember) {
        const newMemberRef = push(membersRef);
        await set(newMemberRef, {
          name: name,
          joinedAt: Date.now()
        });
      }
    } catch (err) {
      console.error("Error adding member:", err);
    }
  };

  // Start Cooldown Ticker
  const startCountdown = (expiry) => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      const now = Date.now();
      if (now >= expiry) {
        clearInterval(countdownIntervalRef.current);
        setCooldownTime(0);
        setShowSpamOverlay(false);
      } else {
        setCooldownTime(Math.ceil((expiry - now) / 1000));
      }
    }, 1000);
  };

  // Add suggestion
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const rateLimiter = rateLimiterRef.current;
    if (!rateLimiter) return;

    const limitCheck = rateLimiter.checkLimit();
    if (limitCheck.isLimited) {
      setCooldownTime(limitCheck.remainingSeconds);
      setCooldownExpiry(limitCheck.cooldownExpiry);
      setShowSpamOverlay(true);
      startCountdown(limitCheck.cooldownExpiry);
      return;
    }

    const allowed = rateLimiter.recordAttempt();
    if (!allowed) {
      const forceCheck = rateLimiter.checkLimit();
      setCooldownTime(forceCheck.remainingSeconds);
      setCooldownExpiry(forceCheck.cooldownExpiry);
      setShowSpamOverlay(true);
      startCountdown(forceCheck.cooldownExpiry);
      return;
    }

    try {
      const itemsRef = ref(db, `lists/${id}/items`);
      const newItemRef = push(itemsRef);
      
      const itemData = {
        name: itemName.trim(),
        category: itemCategory,
        addedBy: username || "Anonymous",
        upvotes: 0,
        createdAt: Date.now()
      };

      await set(newItemRef, itemData);
      setJustAdded(newItemRef.key);
      setTimeout(() => setJustAdded(null), 2000);
      setItemName("");
      setShowAddForm(false);
    } catch (err) {
      console.error("Error adding suggestion:", err);
    }
  };

  // Upvote item
  const handleUpvote = (itemId) => {
    const itemUpvotesRef = ref(db, `lists/${id}/items/${itemId}/upvotes`);
    runTransaction(itemUpvotesRef, (currentUpvotes) => {
      return (currentUpvotes || 0) + 1;
    });
  };

  // Toggle Packed status (per-user, synced to Firebase RTDB)
  const handleTogglePacked = (itemId) => {
    if (!username) return;
    const safeKey = sanitizeKey(username);
    const itemPackedRef = ref(db, `lists/${id}/packedBy/${safeKey}/${itemId}`);

    if (packedItems.has(itemId)) {
      // Unpack — remove from Firebase
      remove(itemPackedRef);
    } else {
      // Pack — write true to Firebase
      set(itemPackedRef, true);
    }
    // State will be updated automatically by the onValue listener
  };

  // Copy Shareable link
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Get initials from name
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Generate a consistent color for a name
  const getNameColor = (name) => {
    const colors = [
      'from-rose-400 to-rose-500',
      'from-pink-400 to-pink-500',
      'from-fuchsia-400 to-fuchsia-500',
      'from-violet-400 to-violet-500',
      'from-indigo-400 to-indigo-500',
      'from-blue-400 to-blue-500',
      'from-cyan-400 to-cyan-500',
      'from-teal-400 to-teal-500',
      'from-emerald-400 to-emerald-500',
      'from-amber-400 to-amber-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-32 min-h-screen bg-mesh-app">
        <div className="relative">
          <span className="w-10 h-10 border-2 border-rose-100 border-t-rose-500 rounded-full animate-spin block" />
          <div className="absolute inset-0 w-10 h-10 rounded-full bg-rose-500/5 animate-ping" />
        </div>
        <p className="text-[10px] text-rose-400 font-bold tracking-wider uppercase animate-pulse">Syncing packlist...</p>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-5 py-32 px-4 text-center min-h-screen bg-mesh-app">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center animate-float">
          <ShieldAlert className="w-8 h-8 text-rose-400" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-slate-800">Packlist Not Found</h2>
          <p className="text-xs text-slate-400 max-w-xs">
            The checklist you are trying to view does not exist or has been removed.
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="btn-primary px-5 py-2.5 text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </button>
      </div>
    );
  }

  // ==========================================
  // NAME ENTRY GATE
  // ==========================================
  if (showNameGate) {
    return (
      <div className="bg-mesh-landing min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        
        {/* Decorative blobs */}
        <div className="fixed pointer-events-none inset-0 overflow-hidden">
          <div className="blob-cherry absolute w-[400px] h-[400px] -top-40 -right-40 opacity-40" />
          <div className="blob-cherry-sm absolute w-[250px] h-[250px] bottom-20 -left-20 opacity-30" />
        </div>

        <div className="relative z-10 w-full max-w-sm animate-scaleIn">
          <div className="cherry-card rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            
            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 via-rose-500 to-rose-400" />
            
            <div className="text-center space-y-5">
              {/* Logo */}
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                <User className="w-8 h-8 text-white" />
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-extrabold text-slate-900">Join this List</h1>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Enter your name to view and contribute to <span className="text-rose-500 font-bold">&quot;{list.title}&quot;</span>
                </p>
              </div>

              {/* Members already in */}
              {members.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {members.length} {members.length === 1 ? 'member' : 'members'} already joined
                  </p>
                  <div className="flex items-center justify-center -space-x-2">
                    {members.slice(0, 5).map((m) => (
                      <div
                        key={m.id}
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${getNameColor(m.name)} flex items-center justify-center text-white text-[9px] font-bold border-2 border-white shadow-sm`}
                        title={m.name}
                      >
                        {getInitials(m.name)}
                      </div>
                    ))}
                    {members.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[9px] font-bold border-2 border-white">
                        +{members.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleJoinList} className="space-y-4 pt-2">
                <div>
                  <input
                    type="text"
                    placeholder="Your name (e.g. Rahul Kumar)"
                    value={enteredName}
                    onChange={(e) => setEnteredName(e.target.value)}
                    className="input-cherry w-full px-4 py-3.5 rounded-xl outline-none text-sm text-slate-800 placeholder-slate-350 text-center"
                    maxLength={30}
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Enter List</span>
                </button>
              </form>

              <p className="text-[10px] text-slate-300 font-medium">
                Your name will be visible to other members
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN LIST VIEW (after name entry)
  // ==========================================

  // Derived Stats
  const totalItems = items.length;
  const packedCount = items.filter(i => packedItems.has(i.id)).length;
  const progressPercent = totalItems > 0 ? Math.round((packedCount / totalItems) * 100) : 0;
  const totalUpvotes = items.reduce((a, c) => a + (c.upvotes || 0), 0);

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedSubCategory === "All" || item.category === selectedSubCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-mesh-app min-h-screen relative">
      
      {/* Decorative blobs */}
      <div className="fixed pointer-events-none inset-0 overflow-hidden">
        <div className="blob-cherry-sm absolute w-[200px] h-[200px] -top-20 right-0 opacity-25" />
      </div>

      <main className={`relative z-10 flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      
        {/* Rate Limit Spam Overlay */}
        {showSpamOverlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/15 backdrop-blur-md p-4 animate-fadeIn">
            <div className="cherry-card border-rose-100 rounded-3xl p-7 max-w-sm w-full text-center space-y-5 shadow-2xl relative animate-shake">
              
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 via-rose-500 to-rose-400 rounded-t-3xl" />
              
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-100 flex items-center justify-center">
                <Flame className="w-7 h-7 text-rose-500 animate-bounce" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-slate-800">Security Lock</h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  You&apos;re adding items too fast. Cooldown duration doubles for consecutive spam to protect the checklist.
                </p>
              </div>

              <div className="py-4 px-8 bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-100 rounded-2xl inline-flex flex-col items-center">
                <span className="text-3xl font-extrabold text-rose-600 tabular-nums animate-counter">
                  {cooldownTime}s
                </span>
                <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider mt-1">Cooldown active</span>
              </div>

              <button
                onClick={() => {
                  const check = rateLimiterRef.current.checkLimit();
                  if (!check.isLimited) {
                    setShowSpamOverlay(false);
                  }
                }}
                className="btn-primary w-full py-3 text-xs cursor-pointer"
              >
                Verify Cooldown Expiry
              </button>
            </div>
          </div>
        )}

        {/* Members Sidebar/Drawer */}
        {showMembers && (
          <div className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-sm flex items-end sm:items-center justify-end p-0 sm:p-4 animate-fadeIn" onClick={() => setShowMembers(false)}>
            <div className="w-full sm:max-w-xs bg-white rounded-t-3xl sm:rounded-2xl p-6 border border-rose-50 shadow-2xl relative animate-slideUp sm:mr-4" onClick={(e) => e.stopPropagation()}>
              
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 via-rose-500 to-rose-400 rounded-t-3xl sm:rounded-t-2xl" />
              
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-rose-50 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center">
                    <Users className="w-4 h-4 text-rose-500" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Members ({members.length})
                  </h2>
                </div>
                <button 
                  onClick={() => setShowMembers(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {members.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No members yet</p>
                ) : (
                  members.map((member, index) => (
                    <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-rose-50/30 transition">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getNameColor(member.name)} flex items-center justify-center text-white text-[10px] font-bold shadow-sm flex-shrink-0`}>
                        {getInitials(member.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-800 truncate">{member.name}</p>
                          {index === 0 && (
                            <Crown className="w-3 h-3 text-amber-500 flex-shrink-0" />
                          )}
                          {member.name === username && (
                            <span className="text-[8px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-100 flex-shrink-0">You</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header Actions */}
        <div className={`flex items-center justify-between mb-6 transition-all duration-500 ${mounted ? 'animate-slideDown' : 'opacity-0'}`}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/app")}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-500 font-bold transition cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Directory</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* User badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-rose-100/50 text-[11px] font-semibold text-slate-600 shadow-sm">
              <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${getNameColor(username)} flex items-center justify-center text-white text-[7px] font-bold`}>
                {getInitials(username)}
              </div>
              <span className="max-w-[80px] truncate">{username}</span>
            </div>
            
            {/* Members button */}
            <button
              onClick={() => setShowMembers(true)}
              className="flex items-center gap-1 px-2.5 py-2 rounded-full bg-white border border-rose-100/50 text-slate-500 hover:text-rose-500 hover:border-rose-200 transition cursor-pointer shadow-sm"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">{members.length}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-bold cursor-pointer transition-all shadow-sm ${
                copiedLink 
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : "btn-secondary"
              }`}
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 animate-scaleIn" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </>
              )}
            </button>
          </div>
        </div>

        {/* Checklist Meta Details */}
        <section className={`cherry-card rounded-2xl p-5 sm:p-6 mb-6 relative overflow-hidden transition-all duration-500 delay-100 ${mounted ? 'animate-slideUp' : 'opacity-0'}`}>
          
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-400 to-transparent" />
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center border border-rose-100/50 flex-shrink-0">
                <ListChecks className="w-5 h-5 text-rose-500" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 break-words">{list.title}</h1>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{list.description}</p>
              </div>
            </div>

            {/* Members row */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setShowMembers(true)}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div className="flex items-center -space-x-1.5">
                  {members.slice(0, 4).map((m) => (
                    <div
                      key={m.id}
                      className={`w-6 h-6 rounded-full bg-gradient-to-br ${getNameColor(m.name)} flex items-center justify-center text-white text-[7px] font-bold border-2 border-white`}
                    >
                      {getInitials(m.name)}
                    </div>
                  ))}
                  {members.length > 4 && (
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[7px] font-bold border-2 border-white">
                      +{members.length - 4}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold group-hover:text-rose-500 transition">
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </span>
              </button>
            </div>
            
            {/* Progress Section */}
            <div className="pt-4 border-t border-rose-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Pack Progress</span>
                <span className="text-[11px] text-rose-600 font-extrabold bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100/50">
                  {progressPercent}% Packed
                </span>
              </div>
              
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center gap-4 text-[10px] font-semibold pt-1">
                <div className="flex items-center gap-1 text-slate-400">
                  <ListChecks className="w-3 h-3" />
                  <span>{totalItems} Items</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{packedCount} Packed</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>{totalUpvotes} Upvotes</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Add Item CTA */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className={`w-full mb-6 py-3.5 px-4 rounded-xl border-2 border-dashed border-rose-200 hover:border-rose-400 text-rose-500 hover:text-rose-600 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer bg-white/60 backdrop-blur-sm hover:bg-rose-50/30 hover:shadow-md hover:shadow-rose-500/5 active:scale-[0.99] transition-all duration-500 delay-150 ${mounted ? 'animate-slideUp' : 'opacity-0'}`}
          >
            <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span>Suggest Item to Pack</span>
          </button>
        )}

        {/* Suggestion Form */}
        {showAddForm && (
          <div className="cherry-card rounded-2xl p-5 mb-6 space-y-4 border-rose-100 shadow-lg relative overflow-hidden animate-slideUp">
            
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-400 to-transparent" />
            
            <div className="flex items-center justify-between pb-3 border-b border-rose-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recommend Item</h3>
                  <p className="text-[10px] text-slate-400">Adding as {username}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddForm(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Extension board / Surge protector"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="input-cherry w-full px-4 py-3 rounded-xl outline-none text-sm text-slate-800 placeholder-slate-350"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="input-cherry w-full px-4 py-3 rounded-xl outline-none text-xs text-slate-700 cursor-pointer"
                >
                  {ITEM_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                Add Suggestion
              </button>
            </form>
          </div>
        )}

        {/* Checklist items List */}
        <section className={`space-y-4 transition-all duration-500 delay-200 ${mounted ? 'animate-slideUp' : 'opacity-0'}`}>
          
          {/* Filter row */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-rose-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-cherry w-full pl-9 pr-3.5 py-2.5 rounded-xl outline-none text-xs text-slate-800 placeholder-slate-350"
              />
            </div>

            <div className="relative">
              <Filter className="w-3 h-3 text-rose-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                className="input-cherry w-full sm:w-auto pl-8 pr-4 py-2.5 rounded-xl outline-none text-xs text-slate-600 font-semibold cursor-pointer appearance-none"
              >
                <option value="All">All Categories</option>
                {ITEM_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Item Rows */}
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center cherry-card border-dashed !border-rose-100 rounded-2xl p-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center mb-4 animate-float">
                <FolderPlus className="w-7 h-7 text-rose-300" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 mb-1">No items yet</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Use the suggest button above to add packing recommendations for hostel living.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item, index) => {
                const isNew = item.id === justAdded;
                return (
                  <div
                    key={item.id}
                    className={`cherry-card rounded-2xl p-4 flex items-center justify-between transition-all duration-300 group ${
                      packedItems.has(item.id) ? "bg-slate-50/50 border-slate-100 opacity-60" : "hover:border-rose-200 hover:shadow-md hover:shadow-rose-500/5"
                    } ${isNew ? "animate-scaleIn ring-2 ring-rose-300/30 ring-offset-2" : ""}`}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleTogglePacked(item.id)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all border-2 cursor-pointer flex-shrink-0 ${
                          packedItems.has(item.id) 
                            ? "bg-gradient-to-br from-rose-500 to-rose-600 border-rose-400 text-white shadow-sm shadow-rose-500/20" 
                            : "border-rose-200 bg-white hover:border-rose-400 text-transparent hover:bg-rose-50/50"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold break-words transition-all ${
                            packedItems.has(item.id) ? "line-through text-slate-400" : "text-slate-800"
                          }`}>
                            {item.name}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider">
                            {item.category}
                          </span>
                          {item.addedBy && (
                            <>
                              <span className="text-[8px] text-slate-200">•</span>
                              <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                                <User className="w-2.5 h-2.5" />
                                {item.addedBy}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Upvote Button */}
                    <div className="flex items-center gap-2 pl-3 flex-shrink-0">
                      <button
                        onClick={() => handleUpvote(item.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-100/50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition-all active:scale-90 cursor-pointer group/vote"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 group-hover/vote:scale-110 transition-transform" />
                        <span className="text-[11px] font-extrabold tabular-nums">{item.upvotes || 0}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
