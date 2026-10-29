import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import {
  Accessibility,
  ArrowRight,
  Gauge,
  Search,
  ShieldCheck,
  Smartphone,
  Zap,
} from 'lucide-react';

// The landing page. Replace the product name, the copy and the contact address with your own;
// keep one <h1>, the section headings in order, and real links (no buttons that only navigate).

const features = [
  {
    icon: Zap,
    title: 'Fast by default',
    text: 'A small first load and hashed assets cached for a year.',
  },
  {
    icon: Accessibility,
    title: 'Accessible',
    text: 'Checked with axe on every build, usable by keyboard.',
  },
  {
    icon: Search,
    title: 'Findable',
    text: 'A title, description, sitemap and robots.txt from day one.',
  },
  {
    icon: ShieldCheck,
    title: 'Safe headers',
    text: 'A Content-Security-Policy and security headers on every response.',
  },
  { icon: Smartphone, title: 'Mobile first', text: 'Layouts that reflow down to 320 pixels wide.' },
  {
    icon: Gauge,
    title: 'Measured',
    text: 'Lighthouse runs on every deploy preview before it goes live.',
  },
];

const steps = [
  { title: 'Tell the story', text: 'Say what the product does, for whom, in one sentence.' },
  {
    title: 'Show the proof',
    text: 'Three features, a screenshot or a number your users care about.',
  },
  { title: 'Ask for one thing', text: 'One call to action, repeated at the top and the bottom.' },
];

const questions = [
  {
    question: 'How do I change this page?',
    answer:
      'Edit apps/web/src/app/home-page.tsx; the theme lives in packages/ui/src/styles/globals.css.',
  },
  {
    question: 'Where does it deploy?',
    answer:
      'CI builds it, runs the end-to-end tests and Lighthouse on a Cloudflare Pages preview, then publishes main.',
  },
  {
    question: 'Can it grow into an app?',
    answer:
      'Start a web app for that (create it with --app): it brings the API layer and mocks this page leaves out.',
  },
];

export const HomePage = () => (
  <div className="flex flex-col gap-24">
    <section className="relative flex flex-col items-center gap-6 pt-8 text-center">
      <div
        aria-hidden
        className="absolute inset-x-0 -top-24 -z-10 mx-auto h-72 max-w-2xl rounded-full bg-gradient-to-r from-brand-cyan/30 to-brand-purple/30 blur-3xl"
      />
      <Badge variant="secondary">Acme 1.0 is out</Badge>
      <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-6xl">
        Launch your product with a page people{' '}
        <span className="bg-gradient-to-r from-brand-cyan via-primary to-brand-purple bg-clip-text text-transparent">
          understand
        </span>
      </h1>
      <p className="max-w-2xl text-balance text-lg text-muted-foreground">
        Acme turns a one-line idea into a fast, accessible landing page that ranks and converts.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <a href="#get-started">
            Get started <ArrowRight aria-hidden />
          </a>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href="#features">See the features</a>
        </Button>
      </div>
    </section>

    <section
      id="features"
      aria-labelledby="features-heading"
      className="flex scroll-mt-20 flex-col gap-6"
    >
      <h2 id="features-heading" className="font-heading text-2xl font-semibold tracking-tight">
        Everything a launch page needs
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, text }) => (
          <li key={title}>
            <Card className="h-full">
              <CardHeader>
                <Icon aria-hidden className="mb-2 size-6 text-primary" />
                <CardTitle>
                  <h3>{title}</h3>
                </CardTitle>
                <CardDescription>{text}</CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </section>

    <section aria-labelledby="steps-heading" className="flex flex-col gap-6">
      <h2 id="steps-heading" className="font-heading text-2xl font-semibold tracking-tight">
        How it works
      </h2>
      <ol className="grid gap-6 sm:grid-cols-3">
        {steps.map(({ title, text }, index) => (
          <li key={title} className="flex flex-col gap-2">
            <span className="font-mono text-sm text-primary">Step {index + 1}</span>
            <h3 className="font-heading text-lg font-semibold">{title}</h3>
            <p className="text-muted-foreground">{text}</p>
          </li>
        ))}
      </ol>
    </section>

    <section id="faq" aria-labelledby="faq-heading" className="flex scroll-mt-20 flex-col gap-4">
      <h2 id="faq-heading" className="font-heading text-2xl font-semibold tracking-tight">
        Questions
      </h2>
      {questions.map(({ question, answer }) => (
        <details key={question} className="group rounded-lg border px-4 py-3">
          <summary className="cursor-pointer font-medium">{question}</summary>
          <p className="mt-2 text-muted-foreground">{answer}</p>
        </details>
      ))}
    </section>

    <section
      id="get-started"
      aria-labelledby="get-started-heading"
      className="flex scroll-mt-20 flex-col items-center gap-4 rounded-2xl border bg-muted/40 px-6 py-12 text-center"
    >
      <h2 id="get-started-heading" className="font-heading text-3xl font-semibold tracking-tight">
        Ready to launch?
      </h2>
      <p className="max-w-xl text-muted-foreground">
        Tell us about your product and we will get back to you within a day.
      </p>
      <Button asChild size="lg">
        <a href="mailto:hello@example.com">Contact us</a>
      </Button>
    </section>
  </div>
);
