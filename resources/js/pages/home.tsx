import { CoverageAreaMap } from '@/features/services/components/coverage-area-map';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import GuestLayout from '@/layouts/guest-layout';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, CheckCircle, MapPin, Package, Phone, Users, Wifi } from 'lucide-react';
import { useRef } from 'react';
import fixedHeroImage from '../images/fixed-hero.png';
import telebirrLogo from '../images/telebirr-logo-1.png';

interface HomePageProps {
  googleMapsApiKey: string;
}

export default function HomePage({ googleMapsApiKey }: HomePageProps) {
  const { auth } = usePage<SharedData>().props;
  const demoRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const services = [
    {
      icon: Wifi,
      title: t('home.services.broadband.title'),
      description: t('home.services.broadband.description'),
      features: [
        t('home.services.broadband.feature1'),
        t('home.services.broadband.feature2'),
        t('home.services.broadband.feature3'),
      ],
      color: 'et-blue',
    },
    // {
    //   icon: Phone,
    //   title: t('home.services.voice.title'),
    //   description: t('home.services.voice.description'),
    //   features: [
    //     t('home.services.voice.feature1'),
    //     t('home.services.voice.feature2'),
    //     t('home.services.voice.feature3'),
    //   ],
    //   color: 'primary',
    // },
    {
      icon: Package,
      title: t('home.services.combo.title'),
      description: t('home.services.combo.description'),
      features: [
        t('home.services.combo.feature1'),
        t('home.services.combo.feature2'),
        t('home.services.combo.feature3'),
      ],
      color: 'primary',
      // color: 'et-green',
    },
  ];

  return (
    <GuestLayout>
      <div className="min-h-screen">
        {/* ================= HERO SECTION ================= */}
        <section
          className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8"
          style={{
            backgroundImage: `url(${fixedHeroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/90 to-white/95" />
          <div className="absolute inset-0 bg-gradient-to-r from-et-green/5 via-transparent to-et-blue/5" />

          <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-screen-2xl items-center">
            {/* 🔑 GRID: right column wider */}
            <div className="grid gap-12 lg:grid-cols-[2fr_2.8fr] lg:items-center">
              {/* LEFT COLUMN */}
              <div className="text-center lg:text-left">
                <h1 className="mb-6 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
                  {t('home.hero.title', { highlight: '' }).split('{highlight}')[0]} {" "}
                  <span className="bg-primary bg-clip-text text-transparent">
                    {t('home.hero.title_highlight')}
                  </span>
                  {t('home.hero.title', { highlight: '' }).split('{highlight}')[1]}
                </h1>

                <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-gray-700 sm:text-xl lg:mx-0">
                  {t('home.hero.subtitle')}
                </p>

                <div className="flex flex-col gap-4 sm:flex-row lg:justify-start">
                  <Link href={auth?.user ? route('services') : route('otp.phone')}>
                    <Button
                      size="lg"
                      className="bg-primary px-8 py-6 text-lg font-semibold text-white shadow-xl transition hover:opacity-90"
                    >
                      {t('home.cta.get_started')}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* RIGHT COLUMN (WIDER) */}
              <div ref={demoRef} className="mt-8 lg:mt-0">
                <div className="h-[440px] w-full overflow-hidden rounded-2xl bg-white/50 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
                  <CoverageAreaMap
                    googleMapsApiKey={googleMapsApiKey}
                    height="440px"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SERVICES ================= */}
        <section id="services" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-screen-2xl">
            <div className="mb-16 text-center">
              <h3 className="mb-4 font-semibold text-primary">
                {t('home.services.title')}
              </h3>
              <h2 className="mb-4 text-4xl font-bold text-gray-900">
                {t('home.services.heading')}
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-600">
                {t('home.services.subtitle')}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {services.map((service, index) => (
                <Card
                  key={index}
                  className="group border-0 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <CardHeader>
                    <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl">
                      <service.icon className={`h-7 w-7 text-${service.color}`} />
                    </div>
                    <CardTitle>{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3">
                      {service.features.map((feature, i) => (
                        <li key={i} className="flex items-center text-sm text-gray-600">
                          <CheckCircle
                            className={`mr-3 h-4 w-4 text-${service.color}`}
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    </GuestLayout>
  );
}
