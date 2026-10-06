import Link from 'next/link';
import { ArrowRight, Sparkles, Wand2, LayoutGrid, Compass, Plane, Home as HomeIcon, BookOpen, Wallet, HeartPulse, Palette, Briefcase } from 'lucide-react';

const heroImage = 'https://images.pexels.com/photos/36252681/pexels-photo-36252681.jpeg?auto=compress&cs=tinysrgb&w=1920';
const travelImage = 'https://images.pexels.com/photos/1714456/pexels-photo-1714456.jpeg?auto=compress&cs=tinysrgb&w=800';
const homeImage = 'https://images.pexels.com/photos/2889618/pexels-photo-2889618.jpeg?auto=compress&cs=tinysrgb&w=800';
const readingImage = 'https://images.pexels.com/photos/6789634/pexels-photo-6789634.jpeg?auto=compress&cs=tinysrgb&w=800';
const officeImage = 'https://images.pexels.com/photos/20540999/pexels-photo-20540999.jpeg?auto=compress&cs=tinysrgb&w=800';

const categoryIcons: Record<string, React.ReactNode> = {
  Career: <Briefcase className="h-5 w-5" />,
  Finance: <Wallet className="h-5 w-5" />,
  Travel: <Plane className="h-5 w-5" />,
  Home: <HomeIcon className="h-5 w-5" />,
  Wellness: <HeartPulse className="h-5 w-5" />,
  Learning: <BookOpen className="h-5 w-5" />,
  Hobbies: <Palette className="h-5 w-5" />,
  Lifestyle: <Sparkles className="h-5 w-5" />,
};

const categories = ['Career', 'Finance', 'Travel', 'Home', 'Wellness', 'Learning', 'Hobbies', 'Lifestyle'];

const steps = [
  {
    icon: <Compass className="h-6 w-6" />,
    step: '01',
    title: 'Describe your goals',
    description: 'Tell us about the life you want to build in your own words. No forms, no checklists — just your vision, naturally.',
  },
  {
    icon: <LayoutGrid className="h-6 w-6" />,
    step: '02',
    title: 'Build your visual board',
    description: 'Your goals transform into a personalized visual board with beautiful imagery. Drag, resize, and arrange everything.',
  },
  {
    icon: <Wand2 className="h-6 w-6" />,
    step: '03',
    title: 'Turn your vision into action',
    description: 'Keep your board visible, track your progress, and stay inspired as you work toward the life you\'ve imagined.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Visionary</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center rounded-lg bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/90 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Modern sunlit architectural interior"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/30 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 pt-32 pb-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 backdrop-blur-sm px-4 py-1.5 mb-8 animate-fade-in">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground tracking-wide">AI-powered vision boarding</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-balance leading-[1.05] animate-fade-in-up">
              Visualize the life<br />
              you&apos;re building.
            </h1>

            <p className="mt-8 text-lg text-muted-foreground max-w-xl leading-relaxed animate-fade-in-up stagger-1">
              Turn your goals into a personalized visual board. Describe what you want
              to achieve in your own words, and watch your vision come to life — one
              element at a time.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-fade-in-up stagger-2">
              <Link
                href="/signup"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-foreground px-7 text-sm font-medium text-background hover:bg-foreground/90 transition-all"
              >
                Create your vision board
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-background/60 backdrop-blur-sm px-7 text-sm font-medium text-foreground hover:bg-accent transition-all"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-16 flex flex-wrap gap-2 animate-fade-in-up stagger-3">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/40 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  {categoryIcons[cat]}
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase mb-4">How it works</p>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-balance max-w-2xl mx-auto">
              From words to vision in three steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div
                key={step.step}
                className="group relative rounded-2xl border border-border/60 bg-card p-8 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground mb-6">
                  {step.icon}
                </div>
                <div className="text-xs font-mono text-muted-foreground/60 mb-3">{step.step}</div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual gallery showcase */}
      <section className="py-32 px-6 bg-secondary/40">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl mb-16">
            <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase mb-4">Every element matters</p>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-balance">
              Not a single image. A living, editable board.
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed text-lg">
              Each visual on your board is an independent element you can move, resize,
              rotate, and customize. Your vision isn&apos;t frozen — it evolves with you.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { src: travelImage, label: 'Travel' },
              { src: homeImage, label: 'Home' },
              { src: readingImage, label: 'Learning' },
              { src: officeImage, label: 'Career' },
            ].map((item, i) => (
              <div
                key={item.label}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
              >
                <img
                  src={item.src}
                  alt={item.label}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="text-sm font-medium text-white">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl sm:text-6xl font-semibold tracking-tight text-balance">
            Your future is worth<br />visualizing.
          </h2>
          <p className="mt-8 text-muted-foreground text-lg max-w-xl mx-auto">
            Start building your vision board today. It takes less than a minute to begin.
          </p>
          <Link
            href="/signup"
            className="group mt-10 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-foreground px-8 text-sm font-medium text-background hover:bg-foreground/90 transition-all"
          >
            Create your vision board
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-12 px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Visionary</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Visualize the life you&apos;re building.
          </p>
        </div>
      </footer>
    </div>
  );
}
