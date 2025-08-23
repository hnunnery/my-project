import {
  Header,
  Hero,
  LogoCloud,
  Features,
  Testimonial,
  Pricing,
  FAQ,
  CTA,
  Footer,
} from '@/components'

export default function Home() {
  return (
    <div className="bg-white dark:bg-gray-900">
      <Header />
      <main className="isolate">
        <Hero />
        <LogoCloud />
        <Features />
        <Testimonial />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
