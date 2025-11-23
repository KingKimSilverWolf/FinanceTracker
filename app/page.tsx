import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Receipt, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">D</span>
            </div>
            <span className="font-bold text-xl">DuoFi</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center py-20 md:py-32">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 max-w-3xl">
            Finance for Two or More
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
            Track shared expenses, split bills fairly, and settle up with friends, roommates, or
            family. Simplified expense tracking for groups of any size.
          </p>
          <div className="flex gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-20 max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center p-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Flexible Groups</h3>
            <p className="text-muted-foreground">
              Create groups for any occasion - roommates, trips, events, or regular hangouts with
              2+ people.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy Expense Tracking</h3>
            <p className="text-muted-foreground">
              Quickly add expenses, split them custom or equally, and see who owes what in
              real-time.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Settlement</h3>
            <p className="text-muted-foreground">
              Our algorithm minimizes transactions needed to settle up, saving time and hassle.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 DuoFi. Made with ❤️ for shared expenses.</p>
        </div>
      </footer>
    </div>
  );
}
