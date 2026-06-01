"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, onValue, push, set, update, runTransaction } from "firebase/database";
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
  UserCheck
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

  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("All");

  // User Settings
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State for Adding Item
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("Bedding & Linens");
  const [showAddForm, setShowAddForm] = useState(false); // Mobile collapsible form

  // Cooldown / Security State
  const [cooldownTime, setCooldownTime] = useState(0);
  const [cooldownExpiry, setCooldownExpiry] = useState(0);
  const [showSpamOverlay, setShowSpamOverlay] = useState(false);
  
  const rateLimiterRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Initialize Rate Limiter
  useEffect(() => {
    rateLimiterRef.current = new RateLimiter(`rate-limiter-${id}`);
    
    // Check initial limit status
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

  // Load Checklist & Items
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
      } else {
        setList(null);
        setItems([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

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

    // Check rate limit before recording attempt
    const limitCheck = rateLimiter.checkLimit();
    if (limitCheck.isLimited) {
      setCooldownTime(limitCheck.remainingSeconds);
      setCooldownExpiry(limitCheck.cooldownExpiry);
      setShowSpamOverlay(true);
      startCountdown(limitCheck.cooldownExpiry);
      return;
    }

    // Try to record attempt. If false, we are rate limited
    const allowed = rateLimiter.recordAttempt();
    if (!allowed) {
      const forceCheck = rateLimiter.checkLimit();
      setCooldownTime(forceCheck.remainingSeconds);
      setCooldownExpiry(forceCheck.cooldownExpiry);
      setShowSpamOverlay(true);
      startCountdown(forceCheck.cooldownExpiry);
      return;
    }

    // Add item logic
    try {
      const itemsRef = ref(db, `lists/${id}/items`);
      const newItemRef = push(itemsRef);
      
      const itemData = {
        name: itemName.trim(),
        category: itemCategory,
        role: "Anonymous", // Defaulted to Anonymous as requested
        upvotes: 0,
        packed: false,
        createdAt: Date.now()
      };

      await set(newItemRef, itemData);
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

  // Toggle Packed status
  const handleTogglePacked = (itemId, currentStatus) => {
    const itemRef = ref(db, `lists/${id}/items/${itemId}`);
    update(itemRef, { packed: !currentStatus });
  };

  // Copy Shareable link
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-32">
        <span className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
        <p className="text-[10px] text-rose-400 font-bold tracking-wider uppercase animate-pulse">Syncing packlist...</p>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-32 px-4 text-center">
        <ShieldAlert className="w-10 h-10 text-rose-500 animate-float" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800">Packlist Not Found</h2>
          <p className="text-xs text-slate-400 max-w-xs">
            The checklist you are trying to view does not exist or has been removed.
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white text-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return Directory
        </button>
      </div>
    );
  }

  // Derived Stats
  const totalItems = items.length;
  const packedCount = items.filter(i => i.packed).length;
  const progressPercent = totalItems > 0 ? Math.round((packedCount / totalItems) * 100) : 0;

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedSubCategory === "All" || item.category === selectedSubCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 sm:py-10 relative">
      
      {/* Rate Limit Spam Overlay */}
      {showSpamOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/10 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="cherry-card border-rose-100 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl relative animate-shake">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
              <Flame className="w-6 h-6 text-rose-500 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-800">Security Lock</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                You are adding items too fast! Cooldown duration doubles for consecutive spam to secure the public checklist.
              </p>
            </div>

            <div className="py-3 px-6 bg-rose-50 border border-rose-100 rounded-2xl inline-block">
              <span className="text-2xl font-extrabold text-rose-600 tabular-nums">
                {cooldownTime}s
              </span>
              <span className="block text-[9px] text-rose-400 font-bold uppercase tracking-wider mt-0.5">Cooldown active</span>
            </div>

            <button
              onClick={() => {
                const check = rateLimiterRef.current.checkLimit();
                if (!check.isLimited) {
                  setShowSpamOverlay(false);
                }
              }}
              className="w-full py-2.5 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white text-xs transition cursor-pointer"
            >
              Verify Cooldown Expiry
            </button>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-xs text-slate-455 hover:text-rose-500 font-bold transition cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Directory
        </button>

        <button
          onClick={handleCopyLink}
          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer transition ${
            copiedLink 
              ? "bg-rose-50 text-rose-650 border-rose-200"
              : "bg-white border-rose-100 text-slate-600 hover:bg-rose-50/30"
          }`}
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-rose-600 animate-scaleIn" />
              Copied Link!
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              Copy Share Link
            </>
          )}
        </button>
      </div>

      {/* Checklist Meta Details */}
      <section className="cherry-card rounded-2xl p-5 mb-6 relative overflow-hidden">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-rose-500 bg-rose-50/50 px-2 py-0.5 rounded border border-rose-100/50">
              {list.category}
            </span>
          </div>
          
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{list.title}</h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">{list.description}</p>
          
          {/* Progress Section */}
          <div className="pt-3.5 border-t border-rose-50 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-550">
              <span className="text-slate-400">Freshman Pack Progress</span>
              <span className="text-rose-600 bg-rose-50 border border-rose-100/50 px-2 py-0.5 rounded-md text-[10px] font-extrabold">
                {progressPercent}% Packed
              </span>
            </div>
            
            <div className="w-full bg-slate-50 border border-rose-100/50 h-2.5 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center gap-4 text-[10px] text-slate-405 font-bold uppercase tracking-wider pt-1">
              <span>{totalItems} Suggested</span>
              <span>•</span>
              <span>{items.reduce((a,c) => a + c.upvotes, 0)} Total Upvotes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile-first Collapsible Suggest Form Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full mb-6 py-3 px-4 rounded-xl border border-dashed border-rose-200 hover:border-rose-450 text-rose-500 hover:text-rose-600 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer bg-white transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Suggest Item to Pack</span>
        </button>
      )}

      {/* Suggestion Form Panel (Role selector completely removed) */}
      {showAddForm && (
        <div className="cherry-card rounded-2xl p-5 mb-6 space-y-4 border-rose-100 shadow-md">
          <div className="flex items-center justify-between border-b border-rose-50 pb-2.5">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-rose-500" />
              Recommend item
            </h3>
            <button 
              onClick={() => setShowAddForm(false)}
              className="text-[10px] font-bold text-rose-400 hover:text-rose-600 px-2 py-0.5 rounded-md bg-slate-50"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleAddItem} className="space-y-4.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Item Name</label>
              <input
                type="text"
                placeholder="e.g. Extension board / Surge protector"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-rose-100 focus:border-rose-400 focus:ring-1 focus:ring-rose-400/20 outline-none text-xs sm:text-sm text-slate-800 placeholder-slate-450"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-rose-100 focus:border-rose-400 focus:ring-1 focus:ring-rose-400/20 outline-none text-xs text-slate-700"
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
              className="w-full py-3 px-4 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white text-xs sm:text-sm shadow-md transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Add Suggestion
            </button>
          </form>
        </div>
      )}

      {/* Checklist items List */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-rose-350 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-rose-100/50 focus:border-rose-400/50 focus:ring-1 focus:ring-rose-400/10 outline-none text-xs text-slate-800 placeholder-slate-450"
            />
          </div>

          {/* Sub-Category selection */}
          <select
            value={selectedSubCategory}
            onChange={(e) => setSelectedSubCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-50 border border-rose-100/55 focus:border-rose-400/50 focus:ring-1 focus:ring-rose-400/10 outline-none text-xs text-slate-500 font-bold"
          >
            <option value="All">All Packing Subcategories</option>
            {ITEM_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Item Rows */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center cherry-card border-dashed rounded-2xl p-6">
            <FolderPlus className="w-8 h-8 text-rose-205 mb-3 animate-float" />
            <h3 className="text-xs font-bold text-slate-650">No suggested items</h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
              Use the packing recommendation card above to add items for hostel living.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => {
              return (
                <div
                  key={item.id}
                  className={`cherry-card rounded-2xl p-3.5 flex items-center justify-between transition-all duration-200 ${
                    item.packed ? "bg-slate-50/50 border-rose-50 opacity-60" : "hover:border-rose-100"
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleTogglePacked(item.id, item.packed)}
                      className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center transition border cursor-pointer ${
                        item.packed 
                          ? "bg-rose-500 border-rose-400 text-white shadow-sm" 
                          : "border-rose-200 bg-white hover:border-rose-500 text-transparent"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                    </button>

                    <div className="min-w-0 space-y-1">
                      <span className={`text-sm font-bold text-slate-800 break-words transition ${
                        item.packed ? "line-through text-slate-400 font-medium" : ""
                      }`}>
                        {item.name}
                      </span>

                      <div className="flex flex-wrap items-center gap-2 text-[9px] font-semibold">
                        <span className="text-rose-400 uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Upvote Button */}
                  <div className="flex items-center gap-2 pl-3">
                    <button
                      onClick={() => handleUpvote(item.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 border border-rose-100/50 hover:border-rose-200 text-slate-500 hover:text-rose-600 transition active:scale-95 cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
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
  );
}
