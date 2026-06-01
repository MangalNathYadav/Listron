"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, push, set, onValue } from "firebase/database";
import { 
  Sparkles, 
  Plus, 
  Search, 
  Compass, 
  GraduationCap, 
  BookOpen, 
  Tv, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  Zap
} from "lucide-react";

const CATEGORIES = [
  { id: "All", label: "All Items", icon: Layers },
  { id: "Hostel Essentials", label: "Hostel Essentials", icon: GraduationCap },
  { id: "Academics", label: "Academic Supplies", icon: BookOpen },
  { id: "Electronics", label: "Electronics & Tech", icon: Tv },
];

export default function Home() {
  const router = useRouter();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false); // Mobile-first collapsible creator

  // Load public lists from RTDB
  useEffect(() => {
    const listsRef = ref(db, "lists");
    const unsubscribe = onValue(listsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.keys(data).map((key) => {
          const val = data[key];
          const itemArray = val.items ? Object.values(val.items) : [];
          return {
            id: key,
            ...val,
            itemCount: itemArray.length,
            packedCount: itemArray.filter(i => i.packed).length
          };
        }).sort((a, b) => b.createdAt - a.createdAt);
        setLists(parsed);
      } else {
        setLists([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase read error: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle Form Submission
  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setErrorMsg("Please provide a checklist title.");
      return;
    }
    if (newTitle.length > 80) {
      setErrorMsg("Title is too long (maximum 80 characters).");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const listsRef = ref(db, "lists");
      const newListRef = push(listsRef);
      const newListId = newListRef.key;

      const listData = {
        title: newTitle.trim(),
        description: newDesc.trim() || "Hostel & college essentials recommended by campus seniors.",
        category: "Hostel Essentials", // Defaulted category as requested (no selector)
        createdAt: Date.now(),
      };

      await set(newListRef, listData);
      setNewTitle("");
      setNewDesc("");
      setShowCreateModal(false);
      
      router.push(`/list/${newListId}`);
    } catch (err) {
      console.error("Error creating checklist:", err);
      setErrorMsg("Failed to create checklist. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtering Logic
  const filteredLists = lists.filter((list) => {
    const matchesSearch = list.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          list.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || list.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Brand Header */}
      <header className="flex flex-col items-center text-center space-y-4 mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-500 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          Campuspack lists
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          CampusPack
        </h1>
        
        <p className="text-sm text-slate-500 max-w-md font-normal leading-relaxed">
          Create collaborative essentials checklists for your college hostel. Shared with seniors who anonymously suggest what to pack.
        </p>

        {/* Feature Pill Tags */}
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50/50 border border-rose-100/50 text-[10px] font-medium text-rose-600">
            <ShieldCheck className="w-3 h-3 text-rose-500" /> Spam-proof
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50/50 border border-rose-100/50 text-[10px] font-medium text-rose-600">
            <Zap className="w-3 h-3 text-rose-500" /> Real-time
          </span>
        </div>
      </header>

      {/* Mobile-first Floating Create List Button */}
      {!showCreateModal && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-6 right-6 z-40 md:static md:w-full md:mb-8 flex items-center justify-center gap-2 px-5 py-3.5 rounded-full md:rounded-2xl font-bold bg-rose-500 hover:bg-rose-600 text-white text-sm shadow-xl shadow-rose-500/20 active:scale-95 transition-all duration-150 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Public List</span>
        </button>
      )}

      {/* Creative Drawer Modal for Creating a List */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-905/10 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 border border-rose-50 shadow-2xl relative animate-slideUp">
            <div className="flex items-center justify-between mb-4 border-b border-rose-50 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Create public list</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-xs font-semibold text-rose-500 hover:text-rose-700 px-2.5 py-1 rounded-lg bg-rose-50"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Checklist Title</label>
                <input
                  type="text"
                  placeholder="e.g. IIT Hostel H15 Essentials"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-rose-100 focus:border-rose-400 focus:ring-1 focus:ring-rose-400/20 outline-none text-sm text-slate-800 placeholder-slate-450"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  placeholder="Details about your college, room type, block, etc."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows="3"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-rose-100 focus:border-rose-400 focus:ring-1 focus:ring-rose-400/20 outline-none text-sm text-slate-800 placeholder-slate-450 resize-none"
                />
              </div>

              {errorMsg && (
                <div className="text-xs text-rose-600 p-2 rounded-lg bg-rose-50 border border-rose-100">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white text-sm shadow-md transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Launch Packing List
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Directory Section */}
      <section className="space-y-4">
        {/* Search Input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-rose-350 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search checklists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-rose-100/60 focus:border-rose-400/50 focus:ring-1 focus:ring-rose-400/10 outline-none text-sm text-slate-800 transition placeholder-slate-450"
          />
        </div>

        {/* Scrollable category selector */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-2 border-b border-rose-50">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition ${
                  isSelected
                    ? "bg-rose-50 text-rose-600 border border-rose-100"
                    : "text-slate-400 hover:text-rose-500 bg-transparent"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Packing lists listings */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <span className="w-6 h-6 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
            <p className="text-[10px] text-rose-400 font-bold tracking-wider uppercase">Syncing lists directory...</p>
          </div>
        ) : filteredLists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center cherry-card border-dashed rounded-2xl p-6">
            <Compass className="w-10 h-10 text-rose-200 mb-3 animate-float" />
            <h3 className="text-sm font-bold text-slate-700">No checklists found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              Launch a public checklist using the "New Public List" button above to get suggestions from seniors.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredLists.map((list) => {
              const progress = list.itemCount > 0 ? Math.round((list.packedCount / list.itemCount) * 100) : 0;
              return (
                <div
                  key={list.id}
                  onClick={() => router.push(`/list/${list.id}`)}
                  className="cherry-card cherry-card-hover rounded-2xl p-4.5 cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-rose-400 bg-rose-50/50 px-2 py-0.5 rounded border border-rose-100/50">
                        {list.category}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-rose-300 group-hover:text-rose-600 transition-colors" />
                    </div>
                    
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                      {list.title}
                    </h3>
                    
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {list.description}
                    </p>
                  </div>

                  {/* Packing Progress */}
                  <div className="space-y-1.5 pt-2 border-t border-rose-50 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">
                      {list.itemCount} suggested items
                    </span>
                    {list.itemCount > 0 ? (
                      <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                        {progress}% packed
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">No recommendations yet</span>
                    )}
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
