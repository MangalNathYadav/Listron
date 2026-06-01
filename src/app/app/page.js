"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, push, set, onValue } from "firebase/database";
import { 
  Plus, 
  Search, 
  Compass, 
  ArrowRight,
  ArrowLeft,
  ListChecks,
  Package,
  Clock,
  Sparkles,
  X
} from "lucide-react";

export default function AppDirectory() {
  const router = useRouter();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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
    return list.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
           list.description?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="bg-mesh-app min-h-screen relative">
      
      {/* Decorative blobs */}
      <div className="fixed pointer-events-none inset-0 overflow-hidden">
        <div className="blob-cherry-sm absolute w-[250px] h-[250px] -top-20 right-10 opacity-30" />
        <div className="blob-cherry absolute w-[200px] h-[200px] bottom-40 -left-20 opacity-20" />
      </div>

      <main className="relative z-10 flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* App Header */}
        <header className={`flex items-center justify-between mb-8 pb-4 border-b border-rose-50 transition-all duration-500 ${mounted ? 'animate-slideDown' : 'opacity-0'}`}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push("/")}
              className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-rose-500 transition px-2 py-1.5 rounded-xl hover:bg-rose-50/50 cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Home
            </button>
            <div className="w-px h-5 bg-rose-100" />
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-md shadow-rose-500/15">
                <ListChecks className="w-3.5 h-3.5 text-white" />
              </div>
              <h1 className="text-base font-extrabold text-slate-800 tracking-tight">Listron</h1>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary px-4 py-2.5 text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New List</span>
          </button>
        </header>

        {/* Directory Section */}
        <section className={`space-y-5 transition-all duration-500 delay-100 ${mounted ? 'animate-slideUp' : 'opacity-0'}`}>
          
          {/* Section title */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-bold text-slate-800">Checklists Directory</h2>
            </div>
            <p className="text-xs text-slate-400 pl-7">Explore and manage packing checklists created by students.</p>
          </div>

          {/* Search Input */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-rose-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search checklists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-cherry w-full pl-10 pr-4 py-3 rounded-xl outline-none text-sm text-slate-800 placeholder-slate-350"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lists */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="relative">
                <span className="w-8 h-8 border-2 border-rose-100 border-t-rose-500 rounded-full animate-spin block" />
                <div className="absolute inset-0 w-8 h-8 rounded-full bg-rose-500/5 animate-ping" />
              </div>
              <p className="text-[10px] text-rose-400 font-bold tracking-wider uppercase">Syncing directory...</p>
            </div>
          ) : filteredLists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center cherry-card border-dashed !border-rose-100 rounded-2xl p-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center mb-4 animate-float">
                <Package className="w-7 h-7 text-rose-300" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 mb-1">No checklists found</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Create a public checklist using the &quot;New List&quot; button to start getting suggestions from seniors.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-5 btn-primary px-5 py-2.5 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Create First List
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLists.map((list, index) => {
                const progress = list.itemCount > 0 ? Math.round((list.packedCount / list.itemCount) * 100) : 0;
                return (
                  <div
                    key={list.id}
                    onClick={() => router.push(`/list/${list.id}`)}
                    className="cherry-card cherry-card-hover rounded-2xl p-5 cursor-pointer flex flex-col justify-between space-y-3 group"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center border border-rose-100/50">
                            <ListChecks className="w-4 h-4 text-rose-500" />
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(list.createdAt)}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-rose-200 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors pl-0.5">
                        {list.title}
                      </h3>
                      
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed pl-0.5">
                        {list.description}
                      </p>
                    </div>

                    {/* Progress */}
                    <div className="pt-3 border-t border-rose-50/80">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {list.itemCount} {list.itemCount === 1 ? 'item' : 'items'} suggested
                        </span>
                        {list.itemCount > 0 ? (
                          <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100/50">
                            {progress}% packed
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No items yet</span>
                        )}
                      </div>
                      {list.itemCount > 0 && (
                        <div className="progress-bar-track !h-1.5">
                          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Create List Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/15 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
            <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 border border-rose-50 shadow-2xl relative animate-slideUp">
              
              {/* Decorative top accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 via-rose-500 to-rose-400 rounded-t-3xl sm:rounded-t-2xl" />
              
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-rose-50 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-rose-500" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">Create New List</h2>
                </div>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateList} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Checklist Title</label>
                  <input
                    type="text"
                    placeholder="e.g. IIT Hostel H15 Essentials"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="input-cherry w-full px-4 py-3 rounded-xl outline-none text-sm text-slate-800 placeholder-slate-350"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea
                    placeholder="Details about your college, room type, block, etc."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows="3"
                    className="input-cherry w-full px-4 py-3 rounded-xl outline-none text-sm text-slate-800 placeholder-slate-350 resize-none"
                  />
                </div>

                {errorMsg && (
                  <div className="text-xs text-rose-600 p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Launch Packing List
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
