import { Link } from "react-router-dom";
import {
  Shield,
  Smartphone,
  BarChart3,
  Wallet,
  Wrench,
  Users,
  ArrowRight,
  CheckCircle2,
  Star,
  Home as HomeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroImage from "@/assets/hero-apartment.jpg";
import townhouseImage from "@/assets/property-townhouse.jpg";
import villaImage from "@/assets/property-villa.jpg";

const features = [
  { icon: Wallet, title: "M-Pesa Rent Collection", description: "Automated rent collection via Safaricom M-Pesa STK Push with real-time payment validation and digital receipts." },
  { icon: BarChart3, title: "Smart Dashboard", description: "Real-time summaries of rent collected, outstanding balances, arrears trends, and occupancy analytics." },
  { icon: Wrench, title: "Maintenance Tracking", description: "Tenants submit requests online. Track, assign, and resolve issues with full audit trails." },
  { icon: Shield, title: "Secure & Role-Based", description: "Property owners, managers, field officers, and super admins — each with tailored access levels." },
  { icon: Smartphone, title: "Mobile-First Design", description: "Fully responsive interface designed for Kenyan landlords and tenants on the go." },
  { icon: Users, title: "Tenant Management", description: "Centralized records for all tenants, lease terms, balances, and communication history." },
];

const stats = [
  { value: "500+", label: "Properties Managed" },
  { value: "KES 50M+", label: "Rent Collected" },
  { value: "2,000+", label: "Happy Tenants" },
  { value: "99.9%", label: "Uptime" },
];

const testimonials = [
  { name: "Jane Wambui", role: "Landlord, Kilimani", quote: "EASE RENTER has transformed how I collect rent. No more chasing tenants — M-Pesa does it all automatically!", rating: 5 },
  { name: "Peter Odhiambo", role: "Property Manager, Westlands", quote: "The dashboard gives me a clear picture of all my properties. Arrears tracking alone has saved me thousands.", rating: 5 },
  { name: "Grace Muthoni", role: "Tenant, South B", quote: "Paying rent through my phone is so convenient. I get instant receipts and can track my payment history.", rating: 4 },
];

const propertyShowcase = [
  { image: heroImage, title: "Luxury Apartments, Kilimani", units: "48 Units" },
  { image: townhouseImage, title: "Modern Townhouses, Karen", units: "24 Units" },
  { image: villaImage, title: "Premium Villas, Runda", units: "12 Units" },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <HomeIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">EASE RENTER</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero with real image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Modern apartment building in Nairobi" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-foreground/30" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-24 md:py-36">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-4 py-1.5 text-sm font-medium text-primary-foreground">
              <Smartphone className="h-4 w-4" />
              Built for Kenya's Property Market
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
              Smart Property Management,{" "}
              <span className="bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent">
                Simplified
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/80">
              Automate rent collection via M-Pesa, track arrears in real time, manage tenants
              and maintenance — all from one beautiful dashboard.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/signup">
                <Button size="lg" className="gap-2 px-8 text-base">
                  Start Managing Properties
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="border-white/30 px-8 text-base text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-12 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-extrabold text-primary">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Property Showcase */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-foreground">Properties We Help Manage</h2>
          <p className="mt-3 text-muted-foreground">From luxury apartments to modern townhouses across Kenya</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {propertyShowcase.map((prop) => (
            <Card key={prop.title} className="overflow-hidden border-border/50 transition-all hover:shadow-xl">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={prop.image} alt={prop.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-110" />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground">{prop.title}</h3>
                <p className="text-sm text-muted-foreground">{prop.units}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">Everything You Need to Manage Properties</h2>
            <p className="mt-3 text-muted-foreground">Purpose-built features for the Kenyan rental market</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="group border-border/50 transition-all hover:border-primary/30 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
          <p className="mt-3 text-muted-foreground">Get started in three simple steps</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { step: "01", title: "Add Your Properties", desc: "Register your properties and housing units with locations, types, and rent amounts." },
            { step: "02", title: "Onboard Tenants", desc: "Add tenant records, assign units, and set up automated M-Pesa rent collection." },
            { step: "03", title: "Collect & Track", desc: "Receive rent payments automatically, generate receipts, and monitor arrears in real time." },
          ].map((item) => (
            <div key={item.step} className="relative text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
                {item.step}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">Trusted by Kenyan Landlords</h2>
            <p className="mt-3 text-muted-foreground">Hear from property managers across Kenya</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-border/50">
                <CardContent className="p-6">
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="mb-4 text-sm italic leading-relaxed text-muted-foreground">"{t.quote}"</p>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-sidebar to-sidebar/90">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold text-sidebar-foreground">Ready to Simplify Your Property Management?</h2>
          <p className="mx-auto mt-4 max-w-xl text-sidebar-foreground/70">
            Join hundreds of Kenyan landlords using EASE RENTER to automate rent collection and manage properties effortlessly.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/signup">
              <Button size="lg" className="gap-2 px-8 text-base">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-sidebar-foreground/60">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Free to try</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> M-Pesa integrated</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> No setup fees</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
          <div className="flex items-center gap-2">
            <HomeIcon className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">EASE RENTER</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 EASE RENTER. Built for Kenya.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
