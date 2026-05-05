import { useState, useEffect, useRef } from "react";
import { 
  Calendar, CheckSquare, Wallet, Users, Store, 
  Plus, Trash2, Check, Clock, MapPin, Phone,
  TrendingUp, TrendingDown, Home, Search,
  AlertCircle, Star, ChevronDown, ChevronUp, Target,
  Cloud, CloudOff, Loader2
} from "lucide-react";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

export default function WeddingPlanner() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("connecting"); // connecting | synced | saving | error
  const isInitialLoad = useRef(true);
  
  const [weddingInfo, setWeddingInfo] = useState({
    weddingDate: "",
    venue: "",
    budget: 0,
  });

  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState({ title: "", category: "Persiapan", deadline: "", priority: "Sedang" });
  const [showTodoForm, setShowTodoForm] = useState(false);

  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", location: "", notes: "" });
  const [showEventForm, setShowEventForm] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({ description: "", amount: "", type: "expense", category: "Venue" });
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  const [guests, setGuests] = useState([]);
  const [newGuest, setNewGuest] = useState({ name: "", phone: "", group: "Keluarga", rsvp: "Belum", seats: 1 });
  const [showGuestForm, setShowGuestForm] = useState(false);

  const [vendors, setVendors] = useState([]);
  const [newVendor, setNewVendor] = useState({ name: "", category: "Catering", contact: "", price: "", status: "Negosiasi", notes: "" });
  const [showVendorForm, setShowVendorForm] = useState(false);

  const [wishlistVendors, setWishlistVendors] = useState([]);
  const [newWishlist, setNewWishlist] = useState({ 
    name: "", category: "Catering", type: "Paket", price: "", 
    contact: "", location: "", rating: 0, pros: "", cons: "", notes: "", link: ""
  });
  const [showWishlistForm, setShowWishlistForm] = useState(false);
  const [wishlistFilter, setWishlistFilter] = useState("Semua");
  const [expandedWishlist, setExpandedWishlist] = useState(null);

  // Real-time sync dengan Firestore
  useEffect(() => {
    const docRef = doc(db, "wedding", "main");
    
    const unsubscribe = onSnapshot(docRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.weddingInfo) setWeddingInfo(data.weddingInfo);
          if (data.todos) setTodos(data.todos);
          if (data.events) setEvents(data.events);
          if (data.transactions) setTransactions(data.transactions);
          if (data.guests) setGuests(data.guests);
          if (data.vendors) setVendors(data.vendors);
          if (data.wishlistVendors) setWishlistVendors(data.wishlistVendors);
        }
        setSyncStatus("synced");
        setLoading(false);
        isInitialLoad.current = false;
      },
      (error) => {
        console.error("Firestore error:", error);
        setSyncStatus("error");
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, []);

  // Helper untuk simpan data ke Firestore
  const saveToFirestore = async (updates) => {
    if (isInitialLoad.current) return;
    setSyncStatus("saving");
    try {
      const docRef = doc(db, "wedding", "main");
      await setDoc(docRef, updates, { merge: true });
      setSyncStatus("synced");
    } catch (e) {
      console.error("Save error:", e);
      setSyncStatus("error");
    }
  };

  // Helper backward-compatible untuk semua handler yang sudah ada
  const saveData = (key, data) => {
    const fieldMap = {
      "weddingInfoV2": "weddingInfo",
      "todos": "todos",
      "events": "events",
      "transactions": "transactions",
      "guests": "guests",
      "vendors": "vendors",
      "wishlistVendors": "wishlistVendors"
    };
    const field = fieldMap[key];
    if (field) {
      saveToFirestore({ [field]: data });
    }
  };

  const updateWeddingInfo = (field, value) => {
    const updated = { ...weddingInfo, [field]: value };
    setWeddingInfo(updated);
    saveData("weddingInfoV2", updated);
  };

  const addTodo = () => {
    if (!newTodo.title.trim()) return;
    const updated = [...todos, { ...newTodo, id: Date.now(), completed: false }];
    setTodos(updated);
    saveData("todos", updated);
    setNewTodo({ title: "", category: "Persiapan", deadline: "", priority: "Sedang" });
    setShowTodoForm(false);
  };
  const toggleTodo = (id) => {
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTodos(updated);
    saveData("todos", updated);
  };
  const deleteTodo = (id) => {
    const updated = todos.filter(t => t.id !== id);
    setTodos(updated);
    saveData("todos", updated);
  };

  const addEvent = () => {
    if (!newEvent.title.trim() || !newEvent.date) return;
    const updated = [...events, { ...newEvent, id: Date.now() }].sort((a, b) => new Date(a.date) - new Date(b.date));
    setEvents(updated);
    saveData("events", updated);
    setNewEvent({ title: "", date: "", time: "", location: "", notes: "" });
    setShowEventForm(false);
  };
  const deleteEvent = (id) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    saveData("events", updated);
  };

  const addTransaction = () => {
    if (!newTransaction.description.trim() || !newTransaction.amount) return;
    const updated = [...transactions, { ...newTransaction, id: Date.now(), amount: parseFloat(newTransaction.amount), date: new Date().toISOString().split("T")[0] }];
    setTransactions(updated);
    saveData("transactions", updated);
    setNewTransaction({ description: "", amount: "", type: "expense", category: "Venue" });
    setShowTransactionForm(false);
  };
  const deleteTransaction = (id) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    saveData("transactions", updated);
  };

  const addGuest = () => {
    if (!newGuest.name.trim()) return;
    const updated = [...guests, { ...newGuest, id: Date.now(), seats: parseInt(newGuest.seats) || 1 }];
    setGuests(updated);
    saveData("guests", updated);
    setNewGuest({ name: "", phone: "", group: "Keluarga", rsvp: "Belum", seats: 1 });
    setShowGuestForm(false);
  };
  const updateGuestRsvp = (id, rsvp) => {
    const updated = guests.map(g => g.id === id ? { ...g, rsvp } : g);
    setGuests(updated);
    saveData("guests", updated);
  };
  const deleteGuest = (id) => {
    const updated = guests.filter(g => g.id !== id);
    setGuests(updated);
    saveData("guests", updated);
  };

  const addVendor = () => {
    if (!newVendor.name.trim()) return;
    const updated = [...vendors, { ...newVendor, id: Date.now(), price: parseFloat(newVendor.price) || 0 }];
    setVendors(updated);
    saveData("vendors", updated);
    setNewVendor({ name: "", category: "Catering", contact: "", price: "", status: "Negosiasi", notes: "" });
    setShowVendorForm(false);
  };
  const updateVendorStatus = (id, status) => {
    const updated = vendors.map(v => v.id === id ? { ...v, status } : v);
    setVendors(updated);
    saveData("vendors", updated);
  };
  const deleteVendor = (id) => {
    // Cari vendor untuk tau wishlistId-nya
    const vendor = vendors.find(v => v.id === id);
    const updated = vendors.filter(v => v.id !== id);
    setVendors(updated);
    saveData("vendors", updated);
    
    // Jika vendor ini dari wishlist, reset status selected-nya
    if (vendor && vendor.wishlistId) {
      const updatedW = wishlistVendors.map(w => 
        w.id === vendor.wishlistId ? { ...w, selected: false, selectedVendorId: null } : w
      );
      setWishlistVendors(updatedW);
      saveData("wishlistVendors", updatedW);
    }
  };

  const addWishlist = () => {
    if (!newWishlist.name.trim()) return;
    const updated = [...wishlistVendors, { 
      ...newWishlist, id: Date.now(), 
      price: parseFloat(newWishlist.price) || 0,
      rating: parseInt(newWishlist.rating) || 0
    }];
    setWishlistVendors(updated);
    saveData("wishlistVendors", updated);
    setNewWishlist({ 
      name: "", category: "Catering", type: "Paket", price: "", 
      contact: "", location: "", rating: 0, pros: "", cons: "", notes: "", link: ""
    });
    setShowWishlistForm(false);
  };
  const deleteWishlist = (id) => {
    const updated = wishlistVendors.filter(w => w.id !== id);
    setWishlistVendors(updated);
    saveData("wishlistVendors", updated);
  };
  const moveToVendor = (wishlist) => {
    // Cek jika sudah dipilih, jangan tambah lagi
    if (wishlist.selected) return;
    
    const vendorId = Date.now();
    const newV = {
      id: vendorId,
      wishlistId: wishlist.id, // tautan ke wishlist asal
      name: wishlist.name,
      category: wishlist.category,
      contact: wishlist.contact,
      price: wishlist.price,
      status: "Negosiasi",
      notes: `${wishlist.type === "Eceran" ? "[Eceran] " : ""}${wishlist.notes || ""}`
    };
    const updatedV = [...vendors, newV];
    setVendors(updatedV);
    saveData("vendors", updatedV);
    
    // Tandai wishlist sebagai sudah dipilih (TIDAK dihapus)
    const updatedW = wishlistVendors.map(w => 
      w.id === wishlist.id ? { ...w, selected: true, selectedVendorId: vendorId } : w
    );
    setWishlistVendors(updatedW);
    saveData("wishlistVendors", updatedW);
    setActiveTab("vendors");
  };

  const unselectFromWishlist = (wishlistId) => {
    // Cari wishlist
    const wishlist = wishlistVendors.find(w => w.id === wishlistId);
    if (!wishlist || !wishlist.selected) return;
    
    // Hapus vendor terkait dari daftar vendor terpilih
    const updatedV = vendors.filter(v => v.wishlistId !== wishlistId);
    setVendors(updatedV);
    saveData("vendors", updatedV);
    
    // Reset status selected di wishlist
    const updatedW = wishlistVendors.map(w => 
      w.id === wishlistId ? { ...w, selected: false, selectedVendorId: null } : w
    );
    setWishlistVendors(updatedW);
    saveData("wishlistVendors", updatedW);
  };
  const setRating = (rating) => {
    setNewWishlist({ ...newWishlist, rating });
  };

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const budgetUsed = weddingInfo.budget > 0 ? (totalExpense / weddingInfo.budget) * 100 : 0;

  // Target dana dari vendor terpilih (kecuali yang dibatalkan)
  const activeVendors = vendors.filter(v => v.status !== "Dibatalkan");
  const totalTargetVendor = activeVendors.reduce((s, v) => s + (v.price || 0), 0);
  const totalLunasVendor = vendors.filter(v => v.status === "Lunas").reduce((s, v) => s + (v.price || 0), 0);
  const totalBookedVendor = vendors.filter(v => v.status === "Booked").reduce((s, v) => s + (v.price || 0), 0);
  const totalNegoVendor = vendors.filter(v => v.status === "Negosiasi").reduce((s, v) => s + (v.price || 0), 0);
  const sisaTarget = totalTargetVendor - totalIncome;
  const targetProgress = totalTargetVendor > 0 ? (totalIncome / totalTargetVendor) * 100 : 0;

  // Group vendor target by category
  const vendorByCategory = activeVendors.reduce((acc, v) => {
    if (!acc[v.category]) acc[v.category] = { total: 0, count: 0, lunas: 0 };
    acc[v.category].total += v.price || 0;
    acc[v.category].count += 1;
    if (v.status === "Lunas") acc[v.category].lunas += v.price || 0;
    return acc;
  }, {});
  const completedTodos = todos.filter(t => t.completed).length;
  const todoProgress = todos.length > 0 ? (completedTodos / todos.length) * 100 : 0;
  const confirmedGuests = guests.filter(g => g.rsvp === "Hadir").length;
  const totalSeats = guests.filter(g => g.rsvp === "Hadir").reduce((s, g) => s + (g.seats || 1), 0);
  const bookedVendors = vendors.filter(v => v.status === "Booked" || v.status === "Lunas").length;
  const daysUntil = weddingInfo.weddingDate 
    ? Math.ceil((new Date(weddingInfo.weddingDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const formatRupiah = (num) => {
    if (!num) return "Rp 0";
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  };

  const filteredWishlist = wishlistFilter === "Semua" 
    ? wishlistVendors 
    : wishlistVendors.filter(w => w.category === wishlistFilter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <Loader2 className="w-6 h-6 text-stone-400 animate-spin mx-auto mb-4" />
          <p className="text-stone-400 text-sm tracking-widest uppercase">Menghubungkan...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard", label: "Beranda", icon: Home },
    { id: "todos", label: "Tugas", icon: CheckSquare },
    { id: "schedule", label: "Jadwal", icon: Calendar },
    { id: "finance", label: "Keuangan", icon: Wallet },
    { id: "guests", label: "Tamu", icon: Users },
    { id: "wishlist", label: "Riset Vendor", icon: Search },
    { id: "vendors", label: "Vendor Terpilih", icon: Store },
  ];

  const StarRating = ({ rating, onRate, size = "w-4 h-4" }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={onRate ? () => onRate(n) : undefined}
          className={onRate ? "cursor-pointer" : "cursor-default"}
        >
          <Star 
            className={`${size} ${n <= rating ? "fill-stone-700 text-stone-700" : "text-stone-300"}`} 
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;1,400&family=Inter:wght@300;400;500;600&display=swap');
        body, * { font-family: 'Inter', system-ui, sans-serif; }
        .serif { font-family: 'Fraunces', Georgia, serif; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.3s ease-out; }
        .scroll-hide::-webkit-scrollbar { display: none; }
        .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #57534e;
        }
      `}</style>

      <header className="border-b border-stone-200 bg-stone-50 relative">
        {/* Indikator Sync */}
        <div className="absolute top-3 right-4 flex items-center gap-1.5 text-xs">
          {syncStatus === "synced" && (
            <><Cloud className="w-3 h-3 text-emerald-600" /><span className="text-stone-500 hidden sm:inline">Tersinkron</span></>
          )}
          {syncStatus === "saving" && (
            <><Loader2 className="w-3 h-3 text-stone-500 animate-spin" /><span className="text-stone-500 hidden sm:inline">Menyimpan...</span></>
          )}
          {syncStatus === "connecting" && (
            <><Loader2 className="w-3 h-3 text-stone-500 animate-spin" /><span className="text-stone-500 hidden sm:inline">Menghubungkan...</span></>
          )}
          {syncStatus === "error" && (
            <><CloudOff className="w-3 h-3 text-red-600" /><span className="text-red-600 hidden sm:inline">Gagal sync</span></>
          )}
        </div>
        <div className="max-w-5xl mx-auto px-6 py-10 sm:py-14 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-4">Wedding Planner</p>
          <h1 className="serif text-3xl sm:text-5xl font-light text-stone-900 italic">
            Rinaldi <span className="text-stone-400 not-italic mx-2">&</span> Naura Syifa
          </h1>
          {daysUntil !== null && daysUntil >= 0 && (
            <p className="text-xs tracking-widest uppercase text-stone-500 mt-6">
              {daysUntil === 0 ? "Hari pernikahan" : `${daysUntil} hari menuju pernikahan`}
            </p>
          )}
        </div>
      </header>

      <nav className="sticky top-0 z-30 bg-stone-50/95 backdrop-blur border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-2">
          <div className="flex overflow-x-auto scroll-hide">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 sm:px-5 whitespace-nowrap text-sm transition-colors ${
                    isActive 
                      ? "text-stone-900 border-b border-stone-900" 
                      : "text-stone-500 hover:text-stone-800 border-b border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8 sm:py-12">
        
        {activeTab === "dashboard" && (
          <div className="fade-in space-y-8">
            <section>
              <p className="text-xs tracking-widest uppercase text-stone-500 mb-4">Informasi Acara</p>
              <div className="bg-white border border-stone-200 p-6 space-y-4">
                <div>
                  <label className="block text-xs tracking-wider uppercase text-stone-500 mb-2">Tanggal Pernikahan</label>
                  <input type="date" value={weddingInfo.weddingDate} onChange={(e) => updateWeddingInfo("weddingDate", e.target.value)} className="w-full px-3 py-2 border border-stone-200 bg-white text-stone-900" />
                </div>
                <div>
                  <label className="block text-xs tracking-wider uppercase text-stone-500 mb-2">Lokasi</label>
                  <input type="text" value={weddingInfo.venue} onChange={(e) => updateWeddingInfo("venue", e.target.value)} placeholder="Mis. Hotel Mulia, Jakarta" className="w-full px-3 py-2 border border-stone-200 bg-white text-stone-900" />
                </div>
                <div>
                  <label className="block text-xs tracking-wider uppercase text-stone-500 mb-2">Total Anggaran</label>
                  <input type="number" value={weddingInfo.budget} onChange={(e) => updateWeddingInfo("budget", parseFloat(e.target.value) || 0)} placeholder="100000000" className="w-full px-3 py-2 border border-stone-200 bg-white text-stone-900" />
                </div>
              </div>
            </section>

            <section>
              <p className="text-xs tracking-widest uppercase text-stone-500 mb-4">Ringkasan</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-stone-200 border border-stone-200">
                <div className="bg-white p-5">
                  <p className="text-xs tracking-wider uppercase text-stone-500 mb-2">Tugas</p>
                  <p className="serif text-3xl font-light">{Math.round(todoProgress)}<span className="text-lg text-stone-400">%</span></p>
                  <p className="text-xs text-stone-500 mt-1">{completedTodos}/{todos.length} selesai</p>
                </div>
                <div className="bg-white p-5">
                  <p className="text-xs tracking-wider uppercase text-stone-500 mb-2">Anggaran</p>
                  <p className="serif text-3xl font-light">{Math.round(budgetUsed)}<span className="text-lg text-stone-400">%</span></p>
                  <p className="text-xs text-stone-500 mt-1">{formatRupiah(totalExpense)}</p>
                </div>
                <div className="bg-white p-5">
                  <p className="text-xs tracking-wider uppercase text-stone-500 mb-2">Tamu Hadir</p>
                  <p className="serif text-3xl font-light">{confirmedGuests}</p>
                  <p className="text-xs text-stone-500 mt-1">{totalSeats} kursi</p>
                </div>
                <div className="bg-white p-5">
                  <p className="text-xs tracking-wider uppercase text-stone-500 mb-2">Vendor</p>
                  <p className="serif text-3xl font-light">{bookedVendors}</p>
                  <p className="text-xs text-stone-500 mt-1">dari {vendors.length} vendor</p>
                </div>
              </div>
            </section>

            {/* Quick Target Dana di Dashboard */}
            {activeVendors.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs tracking-widest uppercase text-stone-500">Target Dana Vendor</p>
                  <button onClick={() => setActiveTab("finance")} className="text-xs text-stone-600 hover:text-stone-900 underline">
                    Detail →
                  </button>
                </div>
                <div className="bg-stone-900 text-stone-50 p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs tracking-wider uppercase opacity-60 mb-1">Total Dibutuhkan</p>
                      <p className="serif text-2xl sm:text-3xl font-light">{formatRupiah(totalTargetVendor)}</p>
                    </div>
                    <div>
                      <p className="text-xs tracking-wider uppercase opacity-60 mb-1">{sisaTarget > 0 ? "Sisa Yang Perlu" : "Status"}</p>
                      <p className={`serif text-2xl sm:text-3xl font-light ${sisaTarget > 0 ? "text-amber-300" : "text-emerald-300"}`}>
                        {sisaTarget > 0 ? formatRupiah(sisaTarget) : "Tercapai ✓"}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-stone-700 h-1">
                    <div 
                      className={`h-1 transition-all ${targetProgress >= 100 ? "bg-emerald-400" : "bg-stone-50"}`}
                      style={{ width: `${Math.min(targetProgress, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs opacity-60 mt-2">{Math.round(targetProgress)}% terkumpul • {formatRupiah(totalIncome)} dari pemasukan</p>
                </div>
              </section>
            )}

            {events.length > 0 && (
              <section>
                <p className="text-xs tracking-widest uppercase text-stone-500 mb-4">Jadwal Mendatang</p>
                <div className="space-y-2">
                  {events.slice(0, 3).map(event => (
                    <div key={event.id} className="bg-white border border-stone-200 p-4 flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 text-center pt-1">
                        <p className="serif text-2xl font-light leading-none">{new Date(event.date).getDate()}</p>
                        <p className="text-xs uppercase text-stone-500 mt-1">{new Date(event.date).toLocaleDateString("id-ID", { month: "short" })}</p>
                      </div>
                      <div className="flex-1 border-l border-stone-200 pl-4">
                        <p className="serif text-lg">{event.title}</p>
                        <p className="text-xs text-stone-500 mt-0.5">{event.time && `${event.time} • `}{event.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {todos.filter(t => !t.completed).length > 0 && (
              <section>
                <p className="text-xs tracking-widest uppercase text-stone-500 mb-4">Tugas Belum Selesai</p>
                <div className="bg-white border border-stone-200">
                  {todos.filter(t => !t.completed).slice(0, 5).map((todo, i) => (
                    <div key={todo.id} className={`flex items-center gap-3 p-4 ${i !== 0 ? "border-t border-stone-100" : ""}`}>
                      <button onClick={() => toggleTodo(todo.id)} className="flex-shrink-0 w-4 h-4 border border-stone-400 hover:border-stone-700"></button>
                      <p className="flex-1 text-sm">{todo.title}</p>
                      <span className="text-xs text-stone-500">{todo.deadline}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === "todos" && (
          <div className="fade-in">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="serif text-3xl font-light italic">Tugas</h2>
                <p className="text-xs tracking-widest uppercase text-stone-500 mt-1">Daftar persiapan</p>
              </div>
              <button onClick={() => setShowTodoForm(!showTodoForm)} className="flex items-center gap-2 px-4 py-2 border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-stone-50 transition-colors text-xs tracking-wider uppercase">
                <Plus className="w-3 h-3" /> Tambah
              </button>
            </div>

            {showTodoForm && (
              <div className="bg-white border border-stone-300 p-6 mb-6 fade-in">
                <p className="text-xs tracking-widest uppercase text-stone-500 mb-4">Tugas Baru</p>
                <div className="space-y-3">
                  <input type="text" placeholder="Judul tugas" value={newTodo.title} onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })} className="w-full px-3 py-2 border border-stone-200 bg-white" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select value={newTodo.category} onChange={(e) => setNewTodo({ ...newTodo, category: e.target.value })} className="px-3 py-2 border border-stone-200 bg-white">
                      <option>Persiapan</option><option>Dokumen</option><option>Dekorasi</option><option>Fashion</option><option>Catering</option><option>Undangan</option><option>Lainnya</option>
                    </select>
                    <select value={newTodo.priority} onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })} className="px-3 py-2 border border-stone-200 bg-white">
                      <option>Rendah</option><option>Sedang</option><option>Tinggi</option>
                    </select>
                    <input type="date" value={newTodo.deadline} onChange={(e) => setNewTodo({ ...newTodo, deadline: e.target.value })} className="px-3 py-2 border border-stone-200 bg-white" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={addTodo} className="px-5 py-2 bg-stone-900 text-stone-50 text-xs tracking-wider uppercase hover:bg-stone-800">Simpan</button>
                  <button onClick={() => setShowTodoForm(false)} className="px-5 py-2 border border-stone-300 text-stone-700 text-xs tracking-wider uppercase hover:bg-stone-100">Batal</button>
                </div>
              </div>
            )}

            {todos.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-stone-300">
                <p className="text-sm text-stone-500">Belum ada tugas</p>
              </div>
            ) : (
              <div className="bg-white border border-stone-200">
                {todos.map((todo, i) => (
                  <div key={todo.id} className={`flex items-center gap-3 p-4 ${i !== 0 ? "border-t border-stone-100" : ""} ${todo.completed ? "opacity-50" : ""}`}>
                    <button onClick={() => toggleTodo(todo.id)} className={`flex-shrink-0 w-4 h-4 border flex items-center justify-center transition-colors ${todo.completed ? "bg-stone-900 border-stone-900" : "border-stone-400 hover:border-stone-700"}`}>
                      {todo.completed && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${todo.completed ? "line-through" : ""}`}>{todo.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
                        <span>{todo.category}</span>
                        {todo.deadline && <span>{todo.deadline}</span>}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 ${todo.priority === "Tinggi" ? "bg-stone-900 text-stone-50" : todo.priority === "Sedang" ? "bg-stone-200 text-stone-700" : "bg-stone-100 text-stone-500"}`}>{todo.priority}</span>
                    <button onClick={() => deleteTodo(todo.id)} className="text-stone-400 hover:text-stone-700">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="fade-in">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="serif text-3xl font-light italic">Jadwal</h2>
                <p className="text-xs tracking-widest uppercase text-stone-500 mt-1">Rencana acara</p>
              </div>
              <button onClick={() => setShowEventForm(!showEventForm)} className="flex items-center gap-2 px-4 py-2 border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-stone-50 transition-colors text-xs tracking-wider uppercase">
                <Plus className="w-3 h-3" /> Tambah
              </button>
            </div>

            {showEventForm && (
              <div className="bg-white border border-stone-300 p-6 mb-6 fade-in">
                <p className="text-xs tracking-widest uppercase text-stone-500 mb-4">Jadwal Baru</p>
                <div className="space-y-3">
                  <input type="text" placeholder="Judul acara" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} className="w-full px-3 py-2 border border-stone-200 bg-white" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="px-3 py-2 border border-stone-200 bg-white" />
                    <input type="time" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} className="px-3 py-2 border border-stone-200 bg-white" />
                  </div>
                  <input type="text" placeholder="Lokasi" value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} className="w-full px-3 py-2 border border-stone-200 bg-white" />
                  <textarea placeholder="Catatan" value={newEvent.notes} onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })} rows="2" className="w-full px-3 py-2 border border-stone-200 bg-white resize-none" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={addEvent} className="px-5 py-2 bg-stone-900 text-stone-50 text-xs tracking-wider uppercase hover:bg-stone-800">Simpan</button>
                  <button onClick={() => setShowEventForm(false)} className="px-5 py-2 border border-stone-300 text-stone-700 text-xs tracking-wider uppercase hover:bg-stone-100">Batal</button>
                </div>
              </div>
            )}

            {events.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-stone-300">
                <p className="text-sm text-stone-500">Belum ada jadwal</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map(event => (
                  <div key={event.id} className="bg-white border border-stone-200 p-5 flex items-start gap-5">
                    <div className="flex-shrink-0 w-16 text-center border-r border-stone-200 pr-5">
                      <p className="serif text-3xl font-light leading-none">{new Date(event.date).getDate()}</p>
                      <p className="text-xs uppercase text-stone-500 mt-1">{new Date(event.date).toLocaleDateString("id-ID", { month: "short" })}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{new Date(event.date).getFullYear()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="serif text-xl">{event.title}</p>
                      {event.time && <p className="text-xs text-stone-500 mt-1"><Clock className="w-3 h-3 inline mr-1" />{event.time}</p>}
                      {event.location && <p className="text-xs text-stone-500 mt-1"><MapPin className="w-3 h-3 inline mr-1" />{event.location}</p>}
                      {event.notes && <p className="text-sm text-stone-600 mt-2 italic">{event.notes}</p>}
                    </div>
                    <button onClick={() => deleteEvent(event.id)} className="text-stone-400 hover:text-stone-700 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "finance" && (
          <div className="fade-in">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="serif text-3xl font-light italic">Keuangan</h2>
                <p className="text-xs tracking-widest uppercase text-stone-500 mt-1">Pemasukan & pengeluaran</p>
              </div>
              <button onClick={() => setShowTransactionForm(!showTransactionForm)} className="flex items-center gap-2 px-4 py-2 border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-stone-50 transition-colors text-xs tracking-wider uppercase">
                <Plus className="w-3 h-3" /> Tambah
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-stone-200 border border-stone-200 mb-6">
              <div className="bg-white p-5">
                <p className="text-xs tracking-wider uppercase text-stone-500 mb-2">Pemasukan</p>
                <p className="serif text-2xl font-light">{formatRupiah(totalIncome)}</p>
              </div>
              <div className="bg-white p-5">
                <p className="text-xs tracking-wider uppercase text-stone-500 mb-2">Pengeluaran</p>
                <p className="serif text-2xl font-light">{formatRupiah(totalExpense)}</p>
              </div>
              <div className="bg-white p-5">
                <p className="text-xs tracking-wider uppercase text-stone-500 mb-2">Saldo</p>
                <p className={`serif text-2xl font-light ${balance < 0 ? "text-red-700" : ""}`}>{formatRupiah(balance)}</p>
              </div>
            </div>

            {/* TARGET DANA DARI VENDOR TERPILIH */}
            {activeVendors.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-stone-700" />
                    <p className="text-xs tracking-widest uppercase text-stone-700 font-medium">Target Dana Vendor</p>
                  </div>
                  <p className="text-xs text-stone-500">{activeVendors.length} vendor terpilih</p>
                </div>

                <div className="bg-white border border-stone-300 p-6">
                  {/* Total Target Besar */}
                  <div className="text-center pb-5 border-b border-stone-200 mb-5">
                    <p className="text-xs tracking-widest uppercase text-stone-500 mb-2">Total Dana Dibutuhkan</p>
                    <p className="serif text-4xl sm:text-5xl font-light">{formatRupiah(totalTargetVendor)}</p>
                    <p className="text-xs text-stone-500 mt-2 italic">
                      Berdasarkan harga semua vendor terpilih (Negosiasi + Booked + Lunas)
                    </p>
                  </div>

                  {/* Status Breakdown */}
                  <div className="grid grid-cols-3 gap-px bg-stone-200 border border-stone-200 mb-5">
                    <div className="bg-white p-3 text-center">
                      <p className="text-xs tracking-wider uppercase text-stone-500 mb-1">Negosiasi</p>
                      <p className="serif text-sm sm:text-base">{formatRupiah(totalNegoVendor)}</p>
                    </div>
                    <div className="bg-white p-3 text-center">
                      <p className="text-xs tracking-wider uppercase text-stone-500 mb-1">Booked</p>
                      <p className="serif text-sm sm:text-base">{formatRupiah(totalBookedVendor)}</p>
                    </div>
                    <div className="bg-white p-3 text-center">
                      <p className="text-xs tracking-wider uppercase text-stone-500 mb-1">Lunas</p>
                      <p className="serif text-sm sm:text-base">{formatRupiah(totalLunasVendor)}</p>
                    </div>
                  </div>

                  {/* Progress Pengumpulan Dana */}
                  <div className="mb-5">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs tracking-wider uppercase text-stone-500">Dana Terkumpul</p>
                      <p className="text-xs text-stone-700">{Math.round(targetProgress)}%</p>
                    </div>
                    <div className="w-full bg-stone-100 h-2">
                      <div 
                        className={`h-2 transition-all ${targetProgress >= 100 ? "bg-emerald-700" : "bg-stone-900"}`} 
                        style={{ width: `${Math.min(targetProgress, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs">
                      <span className="text-stone-600">{formatRupiah(totalIncome)} terkumpul</span>
                      <span className="text-stone-600">dari {formatRupiah(totalTargetVendor)}</span>
                    </div>
                  </div>

                  {/* Sisa Yang Perlu Dikumpulkan */}
                  <div className={`p-4 ${sisaTarget > 0 ? "bg-amber-50 border border-amber-200" : "bg-emerald-50 border border-emerald-200"}`}>
                    {sisaTarget > 0 ? (
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs tracking-wider uppercase text-amber-800 mb-1">Masih Butuh Dana</p>
                          <p className="serif text-2xl text-amber-900">{formatRupiah(sisaTarget)}</p>
                          <p className="text-xs text-amber-700 mt-1 italic">
                            Tambahkan ke pemasukan untuk mencapai target dana vendor
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs tracking-wider uppercase text-emerald-800 mb-1">Target Tercapai</p>
                          <p className="serif text-2xl text-emerald-900">Selamat!</p>
                          <p className="text-xs text-emerald-700 mt-1 italic">
                            Dana sudah cukup untuk semua vendor terpilih{sisaTarget < 0 ? `, surplus ${formatRupiah(Math.abs(sisaTarget))}` : ""}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rincian Per Kategori */}
                  {Object.keys(vendorByCategory).length > 0 && (
                    <div className="mt-5 pt-5 border-t border-stone-200">
                      <p className="text-xs tracking-widest uppercase text-stone-500 mb-3">Rincian Per Kategori</p>
                      <div className="space-y-2">
                        {Object.entries(vendorByCategory).map(([cat, data]) => (
                          <div key={cat} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                            <div className="flex-1">
                              <p className="text-sm">{cat}</p>
                              <p className="text-xs text-stone-500">{data.count} vendor{data.lunas > 0 && ` • ${formatRupiah(data.lunas)} lunas`}</p>
                            </div>
                            <p className="serif text-sm">{formatRupiah(data.total)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {weddingInfo.budget > 0 && (
              <div className="bg-white border border-stone-200 p-5 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs tracking-wider uppercase text-stone-500">Penggunaan Anggaran</p>
                  <p className="text-xs text-stone-700">{Math.round(budgetUsed)}% dari {formatRupiah(weddingInfo.budget)}</p>
                </div>
                <div className="w-full bg-stone-100 h-1">
                  <div className={`h-1 transition-all ${budgetUsed > 90 ? "bg-red-700" : "bg-stone-900"}`} style={{ width: `${Math.min(budgetUsed, 100)}%` }}></div>
                </div>
                {budgetUsed > 90 && (
                  <p className="text-xs text-red-700 mt-2">
                    <AlertCircle className="w-3 h-3 inline mr-1" /> Hampir mencapai batas anggaran
                  </p>
                )}
              </div>
            )}

            {showTransactionForm && (
              <div className="bg-white border border-stone-300 p-6 mb-6 fade-in">
                <p className="text-xs tracking-widest uppercase text-stone-500 mb-4">Transaksi Baru</p>
                <div className="space-y-3">
                  <input type="text" placeholder="Deskripsi" value={newTransaction.description} onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })} className="w-full px-3 py-2 border border-stone-200 bg-white" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="Jumlah (Rp)" value={newTransaction.amount} onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })} className="px-3 py-2 border border-stone-200 bg-white" />
                    <select value={newTransaction.type} onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })} className="px-3 py-2 border border-stone-200 bg-white">
                      <option value="expense">Pengeluaran</option>
                      <option value="income">Pemasukan</option>
                    </select>
                  </div>
                  <select value={newTransaction.category} onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })} className="w-full px-3 py-2 border border-stone-200 bg-white">
                    <option>Venue</option><option>Catering</option><option>Dekorasi</option><option>Fotografi</option><option>Busana</option><option>Make Up</option><option>Undangan</option><option>Souvenir</option><option>MC & Hiburan</option><option>Mahar & Seserahan</option><option>Lainnya</option>
                  </select>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={addTransaction} className="px-5 py-2 bg-stone-900 text-stone-50 text-xs tracking-wider uppercase hover:bg-stone-800">Simpan</button>
                  <button onClick={() => setShowTransactionForm(false)} className="px-5 py-2 border border-stone-300 text-stone-700 text-xs tracking-wider uppercase hover:bg-stone-100">Batal</button>
                </div>
              </div>
            )}

            {transactions.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-stone-300">
                <p className="text-sm text-stone-500">Belum ada transaksi</p>
              </div>
            ) : (
              <div className="bg-white border border-stone-200">
                {transactions.slice().reverse().map((t, i) => (
                  <div key={t.id} className={`flex items-center gap-3 p-4 ${i !== 0 ? "border-t border-stone-100" : ""}`}>
                    {t.type === "income" ? <TrendingUp className="w-4 h-4 text-stone-700 flex-shrink-0" /> : <TrendingDown className="w-4 h-4 text-stone-700 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{t.description}</p>
                      <p className="text-xs text-stone-500">{t.category} • {t.date}</p>
                    </div>
                    <p className="text-sm font-medium flex-shrink-0">
                      {t.type === "income" ? "+" : "−"} {formatRupiah(t.amount)}
                    </p>
                    <button onClick={() => deleteTransaction(t.id)} className="text-stone-400 hover:text-stone-700 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "guests" && (
          <div className="fade-in">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="serif text-3xl font-light italic">Tamu</h2>
                <p className="text-xs tracking-widest uppercase text-stone-500 mt-1">Daftar undangan</p>
              </div>
              <button onClick={() => setShowGuestForm(!showGuestForm)} className="flex items-center gap-2 px-4 py-2 border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-stone-50 transition-colors text-xs tracking-wider uppercase">
                <Plus className="w-3 h-3" /> Tambah
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-stone-200 border border-stone-200 mb-6">
              <div className="bg-white p-4">
                <p className="text-xs tracking-wider uppercase text-stone-500 mb-1">Total</p>
                <p className="serif text-2xl font-light">{guests.length}</p>
              </div>
              <div className="bg-white p-4">
                <p className="text-xs tracking-wider uppercase text-stone-500 mb-1">Hadir</p>
                <p className="serif text-2xl font-light">{guests.filter(g => g.rsvp === "Hadir").length}</p>
              </div>
              <div className="bg-white p-4">
                <p className="text-xs tracking-wider uppercase text-stone-500 mb-1">Tidak Hadir</p>
                <p className="serif text-2xl font-light">{guests.filter(g => g.rsvp === "Tidak Hadir").length}</p>
              </div>
              <div className="bg-white p-4">
                <p className="text-xs tracking-wider uppercase text-stone-500 mb-1">Belum</p>
                <p className="serif text-2xl font-light">{guests.filter(g => g.rsvp === "Belum").length}</p>
              </div>
            </div>

            {showGuestForm && (
              <div className="bg-white border border-stone-300 p-6 mb-6 fade-in">
                <p className="text-xs tracking-widest uppercase text-stone-500 mb-4">Tamu Baru</p>
                <div className="space-y-3">
                  <input type="text" placeholder="Nama" value={newGuest.name} onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })} className="w-full px-3 py-2 border border-stone-200 bg-white" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="tel" placeholder="No. Telepon" value={newGuest.phone} onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })} className="px-3 py-2 border border-stone-200 bg-white" />
                    <input type="number" placeholder="Jumlah kursi" value={newGuest.seats} min="1" onChange={(e) => setNewGuest({ ...newGuest, seats: e.target.value })} className="px-3 py-2 border border-stone-200 bg-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={newGuest.group} onChange={(e) => setNewGuest({ ...newGuest, group: e.target.value })} className="px-3 py-2 border border-stone-200 bg-white">
                      <option>Keluarga</option><option>Teman Naura</option><option>Teman Rinaldi</option><option>Rekan Kerja</option><option>Tetangga</option><option>Lainnya</option>
                    </select>
                    <select value={newGuest.rsvp} onChange={(e) => setNewGuest({ ...newGuest, rsvp: e.target.value })} className="px-3 py-2 border border-stone-200 bg-white">
                      <option>Belum</option><option>Hadir</option><option>Tidak Hadir</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={addGuest} className="px-5 py-2 bg-stone-900 text-stone-50 text-xs tracking-wider uppercase hover:bg-stone-800">Simpan</button>
                  <button onClick={() => setShowGuestForm(false)} className="px-5 py-2 border border-stone-300 text-stone-700 text-xs tracking-wider uppercase hover:bg-stone-100">Batal</button>
                </div>
              </div>
            )}

            {guests.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-stone-300">
                <p className="text-sm text-stone-500">Belum ada tamu</p>
              </div>
            ) : (
              <div className="bg-white border border-stone-200">
                {guests.map((g, i) => (
                  <div key={g.id} className={`p-4 ${i !== 0 ? "border-t border-stone-100" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{g.name}</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-stone-500">
                          <span>{g.group}</span>
                          {g.phone && <span>{g.phone}</span>}
                          <span>{g.seats} kursi</span>
                        </div>
                      </div>
                      <button onClick={() => deleteGuest(g.id)} className="text-stone-400 hover:text-stone-700 flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-1 mt-3">
                      {["Hadir", "Tidak Hadir", "Belum"].map(status => (
                        <button key={status} onClick={() => updateGuestRsvp(g.id, status)} className={`flex-1 text-xs py-1.5 transition-colors ${g.rsvp === status ? "bg-stone-900 text-stone-50" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "wishlist" && (
          <div className="fade-in">
            <div className="flex items-end justify-between mb-2">
              <div>
                <h2 className="serif text-3xl font-light italic">Riset Vendor</h2>
                <p className="text-xs tracking-widest uppercase text-stone-500 mt-1">Daftar idaman & perbandingan</p>
              </div>
              <button onClick={() => setShowWishlistForm(!showWishlistForm)} className="flex items-center gap-2 px-4 py-2 border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-stone-50 transition-colors text-xs tracking-wider uppercase">
                <Plus className="w-3 h-3" /> Tambah
              </button>
            </div>
            <p className="text-sm text-stone-600 mb-6 leading-relaxed">
              Catat vendor yang sedang dipertimbangkan, baik paket lengkap maupun eceran. Bandingkan harga dan keunggulan sebelum memutuskan. Vendor yang sudah dipilih tetap di sini, jadi Anda bisa kapan saja mengganti pilihan dengan kombinasi lain.
            </p>

            {showWishlistForm && (
              <div className="bg-white border border-stone-300 p-6 mb-6 fade-in">
                <p className="text-xs tracking-widest uppercase text-stone-500 mb-4">Vendor Idaman Baru</p>
                <div className="space-y-3">
                  <input type="text" placeholder="Nama vendor" value={newWishlist.name} onChange={(e) => setNewWishlist({ ...newWishlist, name: e.target.value })} className="w-full px-3 py-2 border border-stone-200 bg-white" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select value={newWishlist.category} onChange={(e) => setNewWishlist({ ...newWishlist, category: e.target.value })} className="px-3 py-2 border border-stone-200 bg-white">
                      <option>Catering</option><option>Dekorasi</option><option>Fotografi</option><option>Videografi</option><option>MUA / Make Up</option><option>Wedding Organizer</option><option>Venue</option><option>Hiburan / Band</option><option>MC</option><option>Souvenir</option><option>Undangan</option><option>Busana</option><option>Mahar & Seserahan</option><option>Bunga</option><option>Lainnya</option>
                    </select>
                    <select value={newWishlist.type} onChange={(e) => setNewWishlist({ ...newWishlist, type: e.target.value })} className="px-3 py-2 border border-stone-200 bg-white">
                      <option value="Paket">Paket Lengkap</option>
                      <option value="Eceran">Eceran / Satuan</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="number" placeholder="Harga (Rp)" value={newWishlist.price} onChange={(e) => setNewWishlist({ ...newWishlist, price: e.target.value })} className="px-3 py-2 border border-stone-200 bg-white" />
                    <input type="text" placeholder="Lokasi (mis. Bandung)" value={newWishlist.location} onChange={(e) => setNewWishlist({ ...newWishlist, location: e.target.value })} className="px-3 py-2 border border-stone-200 bg-white" />
                  </div>
                  <input type="text" placeholder="Kontak (No. Telp / WA / IG)" value={newWishlist.contact} onChange={(e) => setNewWishlist({ ...newWishlist, contact: e.target.value })} className="w-full px-3 py-2 border border-stone-200 bg-white" />
                  <input type="text" placeholder="Link / Website / IG (opsional)" value={newWishlist.link} onChange={(e) => setNewWishlist({ ...newWishlist, link: e.target.value })} className="w-full px-3 py-2 border border-stone-200 bg-white" />
                  
                  <div>
                    <label className="block text-xs tracking-wider uppercase text-stone-500 mb-2">Penilaian</label>
                    <StarRating rating={newWishlist.rating} onRate={setRating} size="w-6 h-6" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <textarea placeholder="Kelebihan" value={newWishlist.pros} onChange={(e) => setNewWishlist({ ...newWishlist, pros: e.target.value })} rows="3" className="px-3 py-2 border border-stone-200 bg-white resize-none" />
                    <textarea placeholder="Kekurangan" value={newWishlist.cons} onChange={(e) => setNewWishlist({ ...newWishlist, cons: e.target.value })} rows="3" className="px-3 py-2 border border-stone-200 bg-white resize-none" />
                  </div>
                  <textarea placeholder="Catatan tambahan (paket apa saja, fasilitas, dll)" value={newWishlist.notes} onChange={(e) => setNewWishlist({ ...newWishlist, notes: e.target.value })} rows="2" className="w-full px-3 py-2 border border-stone-200 bg-white resize-none" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={addWishlist} className="px-5 py-2 bg-stone-900 text-stone-50 text-xs tracking-wider uppercase hover:bg-stone-800">Simpan</button>
                  <button onClick={() => setShowWishlistForm(false)} className="px-5 py-2 border border-stone-300 text-stone-700 text-xs tracking-wider uppercase hover:bg-stone-100">Batal</button>
                </div>
              </div>
            )}

            {wishlistVendors.length > 0 && (
              <div className="mb-6 flex gap-2 flex-wrap">
                <button onClick={() => setWishlistFilter("Semua")} className={`text-xs px-3 py-1.5 transition-colors ${wishlistFilter === "Semua" ? "bg-stone-900 text-stone-50" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
                  Semua ({wishlistVendors.length})
                </button>
                {[...new Set(wishlistVendors.map(w => w.category))].map(cat => (
                  <button key={cat} onClick={() => setWishlistFilter(cat)} className={`text-xs px-3 py-1.5 transition-colors ${wishlistFilter === cat ? "bg-stone-900 text-stone-50" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
                    {cat} ({wishlistVendors.filter(w => w.category === cat).length})
                  </button>
                ))}
              </div>
            )}

            {wishlistVendors.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-stone-300">
                <Search className="w-8 h-8 text-stone-300 mx-auto mb-3" />
                <p className="text-sm text-stone-500">Belum ada vendor di daftar riset</p>
                <p className="text-xs text-stone-400 mt-1">Mulai catat vendor idaman untuk dibandingkan</p>
              </div>
            ) : (
              <>
                {wishlistFilter !== "Semua" && filteredWishlist.length > 1 && (
                  <div className="mb-6 bg-stone-100 border border-stone-200 p-4">
                    <p className="text-xs tracking-widest uppercase text-stone-500 mb-3">Perbandingan — {wishlistFilter}</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-stone-300">
                            <th className="text-left py-2 px-2 text-xs tracking-wider uppercase text-stone-500 font-normal">Nama</th>
                            <th className="text-left py-2 px-2 text-xs tracking-wider uppercase text-stone-500 font-normal">Tipe</th>
                            <th className="text-right py-2 px-2 text-xs tracking-wider uppercase text-stone-500 font-normal">Harga</th>
                            <th className="text-center py-2 px-2 text-xs tracking-wider uppercase text-stone-500 font-normal">Rating</th>
                            <th className="text-center py-2 px-2 text-xs tracking-wider uppercase text-stone-500 font-normal">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredWishlist.slice().sort((a, b) => a.price - b.price).map(w => (
                            <tr key={w.id} className={`border-b border-stone-200 last:border-0 ${w.selected ? "bg-stone-50" : ""}`}>
                              <td className="py-2 px-2 serif">{w.name}</td>
                              <td className="py-2 px-2 text-xs text-stone-500">{w.type}</td>
                              <td className="py-2 px-2 text-right">{formatRupiah(w.price)}</td>
                              <td className="py-2 px-2"><div className="flex justify-center"><StarRating rating={w.rating} size="w-3 h-3" /></div></td>
                              <td className="py-2 px-2 text-center">
                                {w.selected ? (
                                  <span className="text-xs px-2 py-0.5 bg-stone-900 text-stone-50">Dipilih</span>
                                ) : (
                                  <span className="text-xs text-stone-400">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {filteredWishlist.map(w => {
                    const isExpanded = expandedWishlist === w.id;
                    return (
                      <div key={w.id} className={`bg-white border ${w.selected ? "border-stone-900 border-2" : "border-stone-200"}`}>
                        {w.selected && (
                          <div className="bg-stone-900 text-stone-50 px-4 py-1.5 text-xs tracking-widest uppercase flex items-center gap-2">
                            <Check className="w-3 h-3" /> Sudah Dipilih
                          </div>
                        )}
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <p className="serif text-xl">{w.name}</p>
                                <span className={`text-xs px-2 py-0.5 ${w.type === "Paket" ? "bg-stone-900 text-stone-50" : "bg-stone-200 text-stone-700"}`}>{w.type}</span>
                              </div>
                              <p className="text-xs tracking-wider uppercase text-stone-500">{w.category}</p>
                              {w.location && <p className="text-xs text-stone-500 mt-1"><MapPin className="w-3 h-3 inline mr-1" />{w.location}</p>}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="serif text-lg">{formatRupiah(w.price)}</p>
                              <div className="flex justify-end mt-1"><StarRating rating={w.rating} size="w-3 h-3" /></div>
                            </div>
                          </div>

                          {(w.pros || w.cons) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                              {w.pros && (
                                <div className="border-l-2 border-stone-700 pl-3">
                                  <p className="text-xs tracking-wider uppercase text-stone-500 mb-1">Kelebihan</p>
                                  <p className="text-sm text-stone-700">{w.pros}</p>
                                </div>
                              )}
                              {w.cons && (
                                <div className="border-l-2 border-stone-300 pl-3">
                                  <p className="text-xs tracking-wider uppercase text-stone-500 mb-1">Kekurangan</p>
                                  <p className="text-sm text-stone-600">{w.cons}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {isExpanded && (
                            <div className="space-y-2 pt-3 border-t border-stone-100 fade-in">
                              {w.contact && <p className="text-xs text-stone-600"><Phone className="w-3 h-3 inline mr-1" />{w.contact}</p>}
                              {w.link && <p className="text-xs text-stone-600 break-all">🔗 {w.link}</p>}
                              {w.notes && <p className="text-sm text-stone-600 italic">{w.notes}</p>}
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-3">
                            {(w.contact || w.link || w.notes) && (
                              <button onClick={() => setExpandedWishlist(isExpanded ? null : w.id)} className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1">
                                {isExpanded ? <><ChevronUp className="w-3 h-3" /> Sembunyikan</> : <><ChevronDown className="w-3 h-3" /> Detail</>}
                              </button>
                            )}
                            <div className="flex-1"></div>
                            {w.selected ? (
                              <button 
                                onClick={() => unselectFromWishlist(w.id)} 
                                className="text-xs px-3 py-1.5 border border-stone-900 text-stone-900 hover:bg-stone-100 tracking-wider uppercase"
                              >
                                Batalkan Pilihan
                              </button>
                            ) : (
                              <button 
                                onClick={() => moveToVendor(w)} 
                                className="text-xs px-3 py-1.5 bg-stone-900 text-stone-50 hover:bg-stone-800 tracking-wider uppercase"
                              >
                                Pilih Ini
                              </button>
                            )}
                            <button 
                              onClick={() => deleteWishlist(w.id)} 
                              className="text-stone-400 hover:text-stone-700 p-1.5"
                              title="Hapus dari riset"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "vendors" && (
          <div className="fade-in">
            <div className="flex items-end justify-between mb-2">
              <div>
                <h2 className="serif text-3xl font-light italic">Vendor Terpilih</h2>
                <p className="text-xs tracking-widest uppercase text-stone-500 mt-1">Vendor yang sudah dihubungi</p>
              </div>
              <button onClick={() => setShowVendorForm(!showVendorForm)} className="flex items-center gap-2 px-4 py-2 border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-stone-50 transition-colors text-xs tracking-wider uppercase">
                <Plus className="w-3 h-3" /> Tambah
              </button>
            </div>
            <p className="text-sm text-stone-600 mb-6 leading-relaxed">
              Vendor yang sudah dipilih dan sedang dalam proses negosiasi atau booking.
            </p>

            {showVendorForm && (
              <div className="bg-white border border-stone-300 p-6 mb-6 fade-in">
                <p className="text-xs tracking-widest uppercase text-stone-500 mb-4">Vendor Baru</p>
                <div className="space-y-3">
                  <input type="text" placeholder="Nama vendor" value={newVendor.name} onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })} className="w-full px-3 py-2 border border-stone-200 bg-white" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select value={newVendor.category} onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })} className="px-3 py-2 border border-stone-200 bg-white">
                      <option>Catering</option><option>Dekorasi</option><option>Fotografi</option><option>Videografi</option><option>MUA / Make Up</option><option>Wedding Organizer</option><option>Venue</option><option>Hiburan / Band</option><option>MC</option><option>Souvenir</option><option>Undangan</option><option>Busana</option><option>Lainnya</option>
                    </select>
                    <select value={newVendor.status} onChange={(e) => setNewVendor({ ...newVendor, status: e.target.value })} className="px-3 py-2 border border-stone-200 bg-white">
                      <option>Negosiasi</option><option>Booked</option><option>Lunas</option><option>Dibatalkan</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="text" placeholder="Kontak" value={newVendor.contact} onChange={(e) => setNewVendor({ ...newVendor, contact: e.target.value })} className="px-3 py-2 border border-stone-200 bg-white" />
                    <input type="number" placeholder="Harga (Rp)" value={newVendor.price} onChange={(e) => setNewVendor({ ...newVendor, price: e.target.value })} className="px-3 py-2 border border-stone-200 bg-white" />
                  </div>
                  <textarea placeholder="Catatan" value={newVendor.notes} onChange={(e) => setNewVendor({ ...newVendor, notes: e.target.value })} rows="2" className="w-full px-3 py-2 border border-stone-200 bg-white resize-none" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={addVendor} className="px-5 py-2 bg-stone-900 text-stone-50 text-xs tracking-wider uppercase hover:bg-stone-800">Simpan</button>
                  <button onClick={() => setShowVendorForm(false)} className="px-5 py-2 border border-stone-300 text-stone-700 text-xs tracking-wider uppercase hover:bg-stone-100">Batal</button>
                </div>
              </div>
            )}

            {vendors.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-stone-300">
                <Store className="w-8 h-8 text-stone-300 mx-auto mb-3" />
                <p className="text-sm text-stone-500">Belum ada vendor terpilih</p>
                <p className="text-xs text-stone-400 mt-1">Pilih dari halaman Riset Vendor atau tambah baru</p>
              </div>
            ) : (
              <>
                {/* Ringkasan Target dari Vendor */}
                <div className="bg-stone-900 text-stone-50 p-5 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <p className="text-xs tracking-widest uppercase">Total Target Dana</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab("finance")} 
                      className="text-xs underline hover:no-underline opacity-80 hover:opacity-100"
                    >
                      Lihat Detail →
                    </button>
                  </div>
                  <p className="serif text-3xl sm:text-4xl font-light">{formatRupiah(totalTargetVendor)}</p>
                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-stone-700">
                    <div>
                      <p className="text-xs opacity-60 uppercase tracking-wider">Terkumpul</p>
                      <p className="serif text-base mt-1">{formatRupiah(totalIncome)}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-60 uppercase tracking-wider">Sisa Target</p>
                      <p className={`serif text-base mt-1 ${sisaTarget > 0 ? "text-amber-300" : "text-emerald-300"}`}>
                        {sisaTarget > 0 ? formatRupiah(sisaTarget) : "Tercapai ✓"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs opacity-60 uppercase tracking-wider">Progres</p>
                      <p className="serif text-base mt-1">{Math.round(targetProgress)}%</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vendors.map(v => (
                  <div key={v.id} className="bg-white border border-stone-200 p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="serif text-lg">{v.name}</p>
                        <p className="text-xs tracking-wider uppercase text-stone-500">{v.category}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 flex-shrink-0 ${v.status === "Lunas" ? "bg-stone-900 text-stone-50" : v.status === "Booked" ? "bg-stone-700 text-stone-50" : v.status === "Negosiasi" ? "bg-stone-200 text-stone-700" : "bg-red-100 text-red-700"}`}>{v.status}</span>
                    </div>
                    {v.contact && <p className="text-xs text-stone-600 mt-1"><Phone className="w-3 h-3 inline mr-1" />{v.contact}</p>}
                    {v.price > 0 && <p className="serif text-lg mt-2">{formatRupiah(v.price)}</p>}
                    {v.notes && <p className="text-xs text-stone-500 italic mt-2">{v.notes}</p>}
                    <div className="flex gap-1 mt-3">
                      {["Negosiasi", "Booked", "Lunas"].map(status => (
                        <button key={status} onClick={() => updateVendorStatus(v.id, status)} className={`flex-1 text-xs py-1.5 transition-colors ${v.status === status ? "bg-stone-900 text-stone-50" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
                          {status}
                        </button>
                      ))}
                      <button onClick={() => deleteVendor(v.id)} className="px-2 text-stone-400 hover:text-stone-700">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </div>
        )}

      </main>

      <footer className="text-center py-10 mt-8 border-t border-stone-200">
        <p className="text-xs tracking-[0.3em] uppercase text-stone-400">Rinaldi & Naura Syifa</p>
      </footer>
    </div>
  );
}
