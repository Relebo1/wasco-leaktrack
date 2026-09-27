import Image from "next/image";
import {
  ClipboardList, Search, UserCheck, Wrench, CheckCircle,
  MapPin, FileText, Tag, Camera, Phone,
  Users, Building2, ChevronRight, CheckCheck,
  BarChart3, Clock, AlertCircle, UserCog, History,
  Droplets, ShieldCheck, Map, UserPlus,
} from "lucide-react";

const processSteps = [
  { icon: ClipboardList, label: "Report", desc: "Public submits a leak report" },
  { icon: Search, label: "Review", desc: "WASCO staff reviews the report" },
  { icon: UserCheck, label: "Assign", desc: "Report assigned to a field team" },
  { icon: Wrench, label: "Investigate", desc: "Team investigates on-site" },
  { icon: CheckCircle, label: "Resolve", desc: "Leak is fixed and closed" },
];

const statusSteps = [
  "Submitted", "Under Review", "Assigned", "In Progress", "Resolved", "Closed",
];

const dashboardStats = [
  { label: "Total Reported", value: "1,240", color: "text-primary" },
  { label: "Pending", value: "87", color: "text-yellow-500" },
  { label: "Under Investigation", value: "134", color: "text-blue-500" },
  { label: "Assigned", value: "210", color: "text-purple-500" },
  { label: "Resolved", value: "809", color: "text-accent" },
];

const reportFields = [
  { icon: MapPin, label: "Location", desc: "GPS pin or address of the leak" },
  { icon: FileText, label: "Description", desc: "Details about the problem observed" },
  { icon: Tag, label: "Leak Category", desc: "Type of leak (pipe burst, seepage, etc.)" },
  { icon: Camera, label: "Photos", desc: "Supporting images of the leak" },
  { icon: Phone, label: "Contact Info", desc: "Your details for follow-up" },
];

const features = [
  { icon: Droplets, label: "Leak Reporting" },
  { icon: Map, label: "Location Management" },
  { icon: BarChart3, label: "Report Tracking" },
  { icon: UserCheck, label: "Staff Assignment" },
  { icon: Clock, label: "Status Management" },
  { icon: UserCog, label: "User & Role Management" },
  { icon: BarChart3, label: "Reporting & Statistics" },
  { icon: History, label: "Historical Records" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral font-sans text-gray-800">

      {/* Navbar */}
      <nav className="bg-neutral text-primary sticky top-0 z-50 shadow-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image src="/Logo.png" alt="WASCO Logo" width={42} height={42} className="object-contain" />
            <div>
              <p className="font-extrabold text-lg leading-none text-primary">WASCO</p>
              <p className="text-accent text-xs font-medium tracking-widest uppercase">Leak Track</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#how-it-works" className="hover:text-secondary transition-colors">How It Works</a>
            <a href="#tracking" className="hover:text-secondary transition-colors">Tracking</a>
            <a href="#features" className="hover:text-secondary transition-colors">Features</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/login" className="border border-primary text-primary px-4 py-2 rounded-full text-sm font-medium hover:bg-primary hover:text-neutral transition-colors">
              Staff Login
            </a>
            <a href="/report" className="bg-accent text-neutral px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
              Report a Leak
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-primary text-neutral py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block bg-secondary/20 text-secondary text-xs font-semibold tracking-widest uppercase px-4 py-1 rounded-full mb-6">
            A Public Service Platform by WASCO
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-5">
            Report Water Leaks.<br />
            <span className="text-secondary">Track Every Step.</span>
          </h1>
          <p className="text-neutral/75 text-lg md:text-xl mb-4 max-w-2xl mx-auto">
            A digital water leak reporting and management platform.
          </p>
          <p className="text-neutral/60 text-base mb-10 max-w-xl mx-auto">
            Members of the public can report water leaks instantly. WASCO staff manage, assign, and resolve every report from one central system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/report" className="bg-accent text-neutral px-10 py-4 rounded-full font-bold text-lg hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2">
              <Droplets size={20} /> Report a Water Leak
            </a>
            <a href="/login" className="border-2 border-neutral/40 text-neutral px-10 py-4 rounded-full font-semibold text-lg hover:bg-neutral/10 transition-colors flex items-center justify-center gap-2">
              Staff Login <ChevronRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* Two Audiences */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="bg-neutral rounded-2xl border border-gray-200 p-8 shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Users size={24} className="text-primary" />
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">For the Public</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Spotted a water leak in your area? Submit a report in minutes — no account needed. Provide the location, describe the problem, attach photos, and leave your contact details. You&apos;ll receive a reference number to track progress.
            </p>
            <a href="/report" className="inline-flex items-center gap-2 mt-6 bg-primary text-neutral px-6 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
              <Droplets size={16} /> Report a Leak
            </a>
          </div>
          <div className="bg-primary rounded-2xl p-8 shadow-sm text-neutral">
            <div className="w-12 h-12 bg-neutral/10 rounded-xl flex items-center justify-center mb-4">
              <Building2 size={24} className="text-secondary" />
            </div>
            <h3 className="text-xl font-bold text-secondary mb-2">For WASCO Staff</h3>
            <p className="text-neutral/75 text-sm leading-relaxed">
              Access the management dashboard to review incoming reports, assign field teams, update statuses, and close resolved cases — all from one centralised system with full audit history.
            </p>
            <a href="/login" className="inline-flex items-center gap-2 mt-6 bg-secondary text-primary px-6 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
              <ShieldCheck size={16} /> Staff Login
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-neutral">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-primary">How It Works</h2>
          <p className="text-gray-500 mt-2">From report to resolution — here&apos;s the full process.</p>
        </div>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-stretch gap-0">
          {processSteps.map(({ icon: Icon, label, desc }, i) => (
            <div key={label} className="flex md:flex-col items-center flex-1">
              <div className="flex md:flex-col items-center flex-1 w-full">
                <div className="flex flex-col md:flex-row items-center w-full md:w-auto">
                  {i > 0 && <div className="hidden md:block h-0.5 w-full bg-secondary flex-1" />}
                  <div className="bg-primary text-neutral w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-md z-10">
                    <Icon size={24} />
                  </div>
                  {i < processSteps.length - 1 && <div className="hidden md:block h-0.5 w-full bg-secondary flex-1" />}
                </div>
                <div className="text-center mt-4 px-2">
                  <p className="font-bold text-primary text-sm">{label}</p>
                  <p className="text-gray-500 text-xs mt-1">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What to Report */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary">What You&apos;ll Need to Report</h2>
            <p className="text-gray-500 mt-2">Providing accurate details helps our teams respond faster.</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {reportFields.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-neutral rounded-2xl border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon size={20} className="text-primary" />
                </div>
                <p className="font-bold text-primary text-sm mb-1">{label}</p>
                <p className="text-gray-500 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tracking */}
      <section id="tracking" className="bg-primary py-20 px-6 text-neutral">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">Track Your Report</h2>
          <p className="text-neutral/70 mb-12 max-w-xl mx-auto">
            Every submitted report receives a unique reference number. Use it to monitor progress through the full lifecycle.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {statusSteps.map((status, i) => (
              <div key={status} className="flex items-center gap-3">
                <div className={`px-5 py-2.5 rounded-full text-sm font-semibold border-2 ${i === 0 ? "bg-secondary text-primary border-secondary" : "border-neutral/30 text-neutral/70"}`}>
                  {status}
                </div>
                {i < statusSteps.length - 1 && <ChevronRight size={18} className="text-secondary" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary">Staff Management Dashboard</h2>
            <p className="text-gray-500 mt-2">WASCO staff get a full overview of all reports in one place.</p>
          </div>
          <div className="bg-primary rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-primary/90 px-6 py-4 flex items-center justify-between border-b border-neutral/10">
              <div className="flex items-center gap-3">
                <Image src="/Logo.png" alt="WASCO" width={28} height={28} className="object-contain" />
                <span className="text-neutral font-bold text-sm">WASCO LeakTrack — Staff Dashboard</span>
              </div>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-accent" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-neutral/10">
              {dashboardStats.map(({ label, value, color }) => (
                <div key={label} className="bg-neutral/5 p-6 text-center">
                  <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
                  <p className="text-neutral/60 text-xs mt-1">{label}</p>
                </div>
              ))}
            </div>
            <div className="p-6">
              <div className="bg-neutral/5 rounded-xl overflow-hidden">
                <div className="grid grid-cols-4 text-xs font-semibold text-neutral/50 uppercase px-4 py-3 border-b border-neutral/10">
                  <span>Ref #</span><span>Location</span><span>Category</span><span>Status</span>
                </div>
                {[
                  ["#LT-0041", "Maseru Central", "Pipe Burst", "In Progress", "text-blue-400"],
                  ["#LT-0040", "Leribe District", "Seepage", "Assigned", "text-purple-400"],
                  ["#LT-0039", "Mafeteng", "Main Line", "Under Review", "text-yellow-400"],
                  ["#LT-0038", "Mohale's Hoek", "Meter Leak", "Resolved", "text-accent"],
                ].map(([ref, loc, cat, status, color]) => (
                  <div key={ref} className="grid grid-cols-4 text-xs text-neutral/70 px-4 py-3 border-b border-neutral/5 hover:bg-neutral/5">
                    <span className="text-secondary font-mono">{ref}</span>
                    <span>{loc}</span>
                    <span>{cat}</span>
                    <span className={`font-semibold ${color}`}>{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-neutral py-20 px-6">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-primary">Platform Features</h2>
          <p className="text-gray-500 mt-2">Everything needed to manage water leaks end-to-end.</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <Icon size={16} className="text-accent shrink-0" />
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Why It Exists */}
      <section className="bg-secondary py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">Why This Platform Exists</h2>
          <p className="text-primary/80 text-lg leading-relaxed">
            &ldquo;Wasco Leak Track helps create a structured connection between water leak reports and the teams responsible for responding to them.&rdquo;
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary py-24 px-6 text-center text-neutral">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">See a water leak?</h2>
        <p className="text-neutral/70 text-xl mb-10">Report it. We&apos;ll take it from there.</p>
        <a href="/report" className="bg-accent text-neutral px-12 py-5 rounded-full font-bold text-xl hover:opacity-90 transition-opacity shadow-xl inline-flex items-center gap-3">
          <Droplets size={24} /> Report a Leak
        </a>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-3">
            <Image src="/Logo.png" alt="WASCO" width={32} height={32} className="object-contain opacity-70" />
            <span>© 2025 WASCO Leak Track. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <a href="#how-it-works" className="hover:text-neutral transition-colors">How It Works</a>
            <a href="#features" className="hover:text-neutral transition-colors">Features</a>
            <a href="mailto:support@wasco.ls" className="hover:text-neutral transition-colors">support@wasco.ls</a>
            <a href="/login" className="hover:text-neutral transition-colors">Staff Login</a>
          </div>
        </div>
      </footer>

    </main>
  );
}
