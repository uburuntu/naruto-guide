import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-display font-bold text-primary">404</h1>
        <p className="text-lg text-muted-foreground">Страница не найдена</p>
        <Link href="/" className="inline-block px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
          На главную
        </Link>
      </div>
    </div>
  );
}
