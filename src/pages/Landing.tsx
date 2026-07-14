import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/logo.svg";
import {
  Zap, Trophy, Target, Gift, Users, Rss, 
  ChevronRight, Star, Sparkles, ArrowRight,
  Shield, Car, BarChart3, Medal, Flame, Gem,
  Quote, Check, Menu, X, ChevronDown,
} from "lucide-react";

// ─── Constants ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Levels", href: "#levels" },
];

const FEATURES = [
  {
    icon: Zap,
    title: "XP Rewards System",
    description: "Every sale, test drive, and milestone earns XP. Watch your progress grow with every achievement.",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    icon: Trophy,
    title: "Live Leaderboards",
    description: "Compete daily, weekly, and monthly. See where you rank across branches, dealers, and regions.",
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    icon: Target,
    title: "Dynamic Challenges",
    description: "Auto-generated daily, weekly, and monthly missions keep the competition fresh and engaging.",
    gradient: "from-blue-400 to-indigo-500",
  },
  {
    icon: Gift,
    title: "Rewards Store",
    description: "Redeem your hard-earned XP for vouchers, fuel cards, leave days, and premium merchandise.",
    gradient: "from-violet-400 to-purple-500",
  },
  {
    icon: Users,
    title: "Team Hierarchy",
    description: "Earn not just for yourself — your success boosts your entire team up the management chain.",
    gradient: "from-rose-400 to-pink-500",
  },
  {
    icon: Rss,
    title: "Social Recognition",
    description: "Share achievements, cheer on colleagues, and build a culture of recognition and excellence.",
    gradient: "from-cyan-400 to-sky-500",
  },
];

const LEVELS = [
  { level: 1, title: "Rookie", xp: "0 - 500", color: "from-slate-400 to-slate-500" },
  { level: 2, title: "Driver", xp: "500 - 1.5K", color: "from-blue-400 to-blue-500" },
  { level: 3, title: "Sales Rider", xp: "1.5K - 3.5K", color: "from-emerald-400 to-emerald-500" },
  { level: 4, title: "Turbo Seller", xp: "3.5K - 7K", color: "from-amber-400 to-amber-500" },
  { level: 5, title: "Elite Dealer", xp: "7K - 12K", color: "from-orange-400 to-orange-500" },
  { level: 6, title: "Champion", xp: "12K - 20K", color: "from-rose-400 to-rose-500" },
  { level: 7, title: "Legend", xp: "20K+", color: "from-violet-400 to-violet-500" },
];

const STATS = [
  { value: 150, suffix: "+", label: "Dealerships" },
  { value: 2500, suffix: "+", label: "Active Users" },
  { value: "2.5M", suffix: "+", label: "XP Earned" },
  { value: 12000, suffix: "+", label: "Rewards Redeemed" },
];

const TESTIMONIALS = [
  {
    quote: "Carverse completely transformed our sales culture. Our team is more motivated than ever, and we've seen a 40% boost in performance since launch.",
    author: "Rajesh Khanna",
    role: "Regional Director, Silver Oak Motors",
  },
  {
    quote: "The gamification made everything competitive in the best way. Everyone wants to be on top of that leaderboard!",
    author: "Priya Sharma",
    role: "Branch Manager, Pinnacle Auto",
  },
  {
    quote: "Redeeming XP for actual rewards is genius. My team actually looks forward to Monday mornings now.",
    author: "Arun Nair",
    role: "Team Leader, Royal Wheels",
  },
];

// ─── CountUp Animation ──────────────────────────────────────────────────────

function CountUp({ value, suffix = "", duration = 2000 }: { value: number | string; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isViewed = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isViewed.current) {
          isViewed.current = true;
          if (typeof value === "number") {
            const start = performance.now();
            const animate = (now: number) => {
              const elapsed = now - start;
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setCount(Math.floor(eased * value));
              if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
          }
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{typeof value === "number" ? count.toLocaleString() : value}{suffix}</span>;
}

// ─── Feature Card ───────────────────────────────────────────────────────────

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const Icon = feature.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative"
    >
      <div className="relative p-6 sm:p-7 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:border-border/70 h-full">
        {/* Hover glow */}
        <div className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.gradient} p-2.5 flex items-center justify-center mb-4 shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Level Card ─────────────────────────────────────────────────────────────

function LevelCard({ level, index }: { level: typeof LEVELS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="flex items-center gap-4 p-4 rounded-xl bg-card/40 border border-border/30 hover:bg-card/60 hover:border-border/50 transition-all duration-200 group"
    >
      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${level.color} flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200`}>
        <span className="text-lg font-bold text-white">{level.level}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{level.title}</p>
        <p className="text-xs text-muted-foreground">{level.xp} XP</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
    </motion.div>
  );
}

// ─── Testimonial Card ───────────────────────────────────────────────────────

function TestimonialCard({ testimonial, index }: { testimonial: typeof TESTIMONIALS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="relative p-6 sm:p-8 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm"
    >
      <Quote className="h-8 w-8 text-amber-500/20 absolute top-4 right-4" />
      <p className="text-sm leading-relaxed text-muted-foreground mb-6 italic">
        "{testimonial.quote}"
      </p>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
          {testimonial.author.split(" ").map(n => n[0]).join("")}
        </div>
        <div>
          <p className="text-sm font-semibold">{testimonial.author}</p>
          <p className="text-xs text-muted-foreground">{testimonial.role}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Floating Elements ──────────────────────────────────────────────────────

function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-5">
      {/* Floating orbs */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-[0.03] dark:opacity-[0.05]"
          style={{
            width: `${200 + i * 150}px`,
            height: `${200 + i * 150}px`,
            background: `radial-gradient(circle, oklch(0.7 0.15 80), transparent)`,
            left: `${20 + i * 25}%`,
            top: `${15 + i * 20}%`,
          }}
          animate={{
            y: [0, -30, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 6 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.5,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Landing Page ──────────────────────────────────────────────────────

export default function Landing() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  // Redirect if authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const scrollTo = (href: string) => {
    setMobileMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Navigation ─────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/10 bg-background/70 backdrop-blur-xl"
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <motion.button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-3 group"
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative">
                <img src={logo} alt="Carverse" className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg" />
                <div className="absolute -inset-1 rounded-lg bg-amber-500/10 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-bold tracking-tight">Carverse</span>
                <span className="hidden sm:inline text-[10px] font-medium text-amber-500/80 uppercase tracking-widest">Gamified</span>
              </div>
            </motion.button>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollTo(item.href)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 right-0 h-px bg-foreground/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </button>
              ))}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <motion.button
                onClick={() => navigate("/auth")}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                whileHover={{ scale: 1.02 }}
              >
                Sign In
              </motion.button>
              <motion.button
                onClick={() => navigate("/auth")}
                className="relative px-5 py-2 text-sm font-semibold text-white rounded-xl overflow-hidden group"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600" />
                <span className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center gap-2">
                  Get Started
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-border/10 bg-background/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-4 py-4 space-y-3">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => scrollTo(item.href)}
                    className="block w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
                <hr className="border-border/20 my-2" />
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate("/auth"); }}
                  className="block w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate("/auth"); }}
                  className="block w-full text-center px-4 py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-amber-500 to-orange-600"
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-20 sm:pt-24 overflow-hidden">
        <FloatingShapes />

        {/* Background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black,transparent)]" />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
        >
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6 sm:mb-8"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">The Ultimate Dealership Gamification Platform</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
            >
              Drive Your{" "}
              <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                Success
              </span>
              <br />
              <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-muted-foreground/80 font-semibold">
                Earn. Compete. Conquer.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Transform your dealership into a competitive powerhouse. 
              Gamify every sale, motivate your team, and watch performance 
              soar with XP, leaderboards, and real rewards.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.button
                onClick={() => navigate("/auth")}
                className="relative w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white rounded-xl overflow-hidden group"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600" />
                <span className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center justify-center gap-2">
                  Employee Portal
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>

              <motion.button
                onClick={() => navigate("/catalog")}
                className="relative w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white rounded-xl overflow-hidden group"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600" />
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center justify-center gap-2">
                  Customer Catalog
                  <Car className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>

              <motion.button
                onClick={() => navigate("/exchange")}
                className="w-full sm:w-auto px-8 py-3.5 text-base font-medium rounded-xl border border-border/40 bg-card/30 hover:bg-card/50 transition-colors backdrop-blur-sm"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Evaluate Old Car
              </motion.button>
            </motion.div>

            {/* Floating level preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-12 sm:mt-16 inline-flex items-center gap-3 sm:gap-6 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-card/40 border border-border/30 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-500" />
                <span className="text-xs sm:text-sm font-semibold">7 Levels</span>
              </div>
              <div className="h-4 w-px bg-border/40" />
              <div className="flex items-center gap-2">
                <Medal className="h-4 w-4 text-emerald-500" />
                <span className="text-xs sm:text-sm font-semibold">15 Badges</span>
              </div>
              <div className="h-4 w-px bg-border/40" />
              <div className="flex items-center gap-2">
                <Gem className="h-4 w-4 text-violet-500" />
                <span className="text-xs sm:text-sm font-semibold">Real Rewards</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-muted-foreground/50"
          >
            <span className="text-[10px] font-medium uppercase tracking-widest">Scroll</span>
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats Section ──────────────────────────────────────────── */}
      <section className="relative py-16 sm:py-20 border-y border-border/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ────────────────────────────────────────── */}
      <section id="features" className="relative py-20 sm:py-28">
        {/* Background accent */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/2 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">Everything You Need</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              A Complete{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Gamification Engine
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
              From earning XP to climbing the leaderboard and redeeming rewards — 
              every feature is designed to drive performance.
            </p>
          </motion.div>

          {/* Features grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {FEATURES.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────── */}
      <section id="how-it-works" className="relative py-20 sm:py-28 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <Target className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">Simple Process</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              How It{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground text-sm sm:text-base">
              Three simple steps to transform your dealership culture.
            </p>
          </motion.div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8 sm:gap-12 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-amber-500/20 via-amber-400/40 to-amber-500/20" />

            {[
              {
                step: "01",
                title: "Sell & Perform",
                description: "Every booking, test drive, delivery, and finance approval earns you XP. The more you achieve, the more you earn.",
                icon: Car,
                color: "from-amber-400 to-orange-500",
              },
              {
                step: "02",
                title: "Compete & Rise",
                description: "Climb daily, weekly, and monthly leaderboards. Level up from Rookie to Legend and unlock 15 unique badges.",
                icon: Trophy,
                color: "from-emerald-400 to-teal-500",
              },
              {
                step: "03",
                title: "Redeem & Reward",
                description: "Spend your XP in the Rewards Store on vouchers, fuel cards, leave days, merchandise, and more.",
                icon: Gift,
                color: "from-violet-400 to-purple-500",
              },
            ].map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-xl`}>
                  <step.icon className="h-7 w-7 text-white" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground/40 tracking-widest mb-2">{step.step}</span>
                <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Level System Preview ──────────────────────────────────── */}
      <section id="levels" className="relative py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
                <Star className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-xs font-medium text-amber-400">Progression System</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                7 Levels of{" "}
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  Mastery
                </span>
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
                Start as a Rookie and climb your way to Legend. Each level unlocks new 
                opportunities, recognition, and rewards. Track your progress in real-time 
                and see exactly what it takes to reach the next tier.
              </p>
              <div className="flex flex-wrap gap-3">
                {["Automatic progression", "15 earnable badges", "Real-time tracking", "Team multiplier"].map((item) => (
                  <div key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: Level Cards */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-2.5"
            >
              {LEVELS.map((level, i) => (
                <LevelCard key={level.title} level={level} index={i} />
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────── */}
      <section className="relative py-20 sm:py-28 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
              <Quote className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">Testimonials</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Trusted by{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Dealerships
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.author} testimonial={t} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">Get Started Today</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Ready to{" "}
            <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              Supercharge
            </span>{" "}
            Your Dealership?
          </h2>
          
          <p className="text-muted-foreground text-sm sm:text-base mb-8 max-w-xl mx-auto">
            Join thousands of sales professionals already earning, competing, 
            and conquering with Carverse. Your journey starts here.
          </p>

          <motion.button
            onClick={() => navigate("/auth")}
            className="relative inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-xl overflow-hidden group"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600" />
            <span className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative flex items-center gap-2">
              Get Started Free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>

          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required · Free for dealerships · Set up in minutes
          </p>
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-border/10 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={logo} alt="Carverse" className="h-8 w-8 rounded-lg" />
                <span className="text-lg font-bold">Carverse</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                The ultimate gamification platform for automotive dealerships. 
                Drive performance, recognition, and rewards across your entire organization.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Product</h4>
              <ul className="space-y-2.5">
                {["Features", "Pricing", "Integrations", "Changelog"].map((item) => (
                  <li key={item}>
                    <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Company</h4>
              <ul className="space-y-2.5">
                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Carverse. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <button className="hover:text-foreground transition-colors">Privacy Policy</button>
              <button className="hover:text-foreground transition-colors">Terms of Service</button>
              <span className="flex items-center gap-1">
                Powered by{" "}
                <a href="https://freebuff.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
                  freebuff.com
                </a>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
