import { CoverageAreaMap } from '@/features/services/components/coverage-area-map';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import GuestLayout from '@/layouts/guest-layout';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import heroBgImage from '../images/hero-bg.png';
import multipleSpeedOptions from '../images/multiple-speed-options.png';
import unlimitedData from '../images/unlimited-data.png';
import technicalSupport from '../images/technical-support.png';
import crystalClearVoice from '../images/crystal-clear-voice.png';
import internationalCalling from '../images/international-calling.png';
import competitiveRates from '../images/competitive-rates.png';
import voiceInternetBundle from '../images/voice-internet-bundle.png';
import costEffectivePackages from '../images/cost-effective-packages.png';
import singleBilling from '../images/single-billing.png';

interface HomePageProps {
  googleMapsApiKey: string;
}

export default function HomePage({ googleMapsApiKey }: HomePageProps) {
  const { auth } = usePage<SharedData>().props;
  const demoRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<number, boolean>>({});


  const SERVICES = [
    {
      titleKey: 'home.services.broadband.title',
      descriptionKey: 'home.services.broadband.description',
      features: [
        { image: multipleSpeedOptions, titleKey: 'home.services.broadband.feature1' },
        { image: unlimitedData, titleKey: 'home.services.broadband.feature2' },
        { image: technicalSupport, titleKey: 'home.services.broadband.feature3' },
      ],
    },
    // {
    //   titleKey: 'home.services.voice.title',
    //   descriptionKey: 'home.services.voice.description',
    //   features: [
    //     { image: crystalClearVoice, titleKey: 'home.services.voice.feature1' },
    //     { image: internationalCalling, titleKey: 'home.services.voice.feature2' },
    //     { image: competitiveRates, titleKey: 'home.services.voice.feature3' },
    //   ],
    // },
    {
      titleKey: 'home.services.combo.title',
      descriptionKey: 'home.services.combo.description',
      features: [
        { image: voiceInternetBundle, titleKey: 'home.services.combo.feature1' },
        { image: costEffectivePackages, titleKey: 'home.services.combo.feature2' },
        { image: singleBilling, titleKey: 'home.services.combo.feature3' },
      ],
    },
  ] as const;

  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSnappingRef = useRef(false);
  const isMobile = typeof window !== 'undefined'
  ? window.matchMedia('(max-width: 640px)').matches
  : false;

  // Infinite carousel: slide count and mapping depend on SERVICES.length
  // 2 services → [Combo, Broadband, Combo, Broadband]; 3 services → [Combo, Broadband, Voice, Combo, Broadband]
  const SLIDE_COUNT = SERVICES.length + 2;
  const PHYSICAL_TO_LOGICAL: number[] = [
    SERVICES.length - 1, // physical 0 = last service (clone at start)
    ...Array.from({ length: SERVICES.length }, (_, i) => i), // physical 1..n = all services
    0, // physical n+1 = first service (clone at end)
  ];

  const getSlideWidth = () => {
    const el = carouselRef.current;
    return el ? el.scrollWidth / SLIDE_COUNT : 0;
  };

  const scrollToService = (logicalIndex: number, smooth = true) => {
    const el = carouselRef.current;
    if (!el || !SERVICES.length) return;
    const slideWidth = getSlideWidth();
    if (!slideWidth) return;
    const physical = logicalIndex + 1; // logical 0 → physical 1, logical 1 → physical 2, etc.
    el.scrollTo({ left: physical * slideWidth, behavior: smooth ? 'smooth' : 'auto' });
  };

  const nextService = () => {
    const next = (currentServiceIndex + 1) % SERVICES.length;
    setCurrentServiceIndex(next);
    const el = carouselRef.current;
    if (!el || !SERVICES.length) return;
    const slideWidth = getSlideWidth();
    if (!slideWidth) return;
    // From last service to first: scroll to clone at end, then snap to physical 1
    if (next === 0 && currentServiceIndex === SERVICES.length - 1) {
      el.scrollTo({ left: (SLIDE_COUNT - 1) * slideWidth, behavior: 'smooth' });
    } else {
      scrollToService(next);
    }
  };

  const toggleDescription = (index: number) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const prevService = () => {
    const prev = (currentServiceIndex - 1 + SERVICES.length) % SERVICES.length;
    setCurrentServiceIndex(prev);
    const el = carouselRef.current;
    if (!el || !SERVICES.length) return;
    const slideWidth = getSlideWidth();
    if (!slideWidth) return;
    // From first service to last: scroll to physical 0 (clone at start), then snap to real last
    if (prev === SERVICES.length - 1 && currentServiceIndex === 0) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      scrollToService(prev);
    }
  };

  // Drag handlers for carousel
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !carouselRef.current) return;
    const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Start at Broadband (physical index 1) after layout
  useEffect(() => {
    const el = carouselRef.current;
    if (!el || !SERVICES.length) return;
    const slideCount = SERVICES.length + 2;
    let rafId: number;
    const init = () => {
      if (!el) return;
      const w = el.scrollWidth / slideCount;
      if (w > 0) {
        el.scrollLeft = w; // physical 1 = first service (Broadband)
      }
    };
    rafId = requestAnimationFrame(init);
    return () => cancelAnimationFrame(rafId);
  }, [SERVICES.length]);

  // Update service index on scroll; snap at clones when scroll has ended
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || !SERVICES.length) return;
    const slideCount = SERVICES.length + 2;
    const physicalToLogical: number[] = [
      SERVICES.length - 1,
      ...Array.from({ length: SERVICES.length }, (_, i) => i),
      0,
    ];

    const doSnap = () => {
      const w = carousel.scrollWidth / slideCount;
      if (w <= 0) return;
      const pos = carousel.scrollLeft;
      const p = Math.round(pos / w);
      if (p <= 0) {
        isSnappingRef.current = true;
        carousel.scrollLeft = (slideCount - 2) * w; // snap to real “last” slide
        setCurrentServiceIndex(SERVICES.length - 1);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { isSnappingRef.current = false; });
        });
      } else if (p >= slideCount - 1) {
        isSnappingRef.current = true;
        carousel.scrollLeft = 1 * w; // snap to real “first” slide
        setCurrentServiceIndex(0);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { isSnappingRef.current = false; });
        });
      }
    };

    const handleScroll = () => {
      if (isSnappingRef.current) return;
      const slideWidth = carousel.scrollWidth / slideCount;
      if (slideWidth <= 0) return;
      const scrollPos = carousel.scrollLeft;
      const physical = Math.floor((scrollPos + slideWidth / 2) / slideWidth);

      if (physical >= 1 && physical <= slideCount - 2) {
        setCurrentServiceIndex(physicalToLogical[physical]);
        if (snapTimeoutRef.current) {
          clearTimeout(snapTimeoutRef.current);
          snapTimeoutRef.current = null;
        }
        return;
      }

      setCurrentServiceIndex(physical <= 0 ? SERVICES.length - 1 : 0);
      if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
      snapTimeoutRef.current = setTimeout(doSnap, 300);
    };

    const handleScrollEnd = () => {
      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current);
        snapTimeoutRef.current = null;
      }
      doSnap();
    };

    carousel.addEventListener('scroll', handleScroll);
    carousel.addEventListener('scrollend', handleScrollEnd);

    return () => {
      carousel.removeEventListener('scroll', handleScroll);
      carousel.removeEventListener('scrollend', handleScrollEnd);
      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current);
        snapTimeoutRef.current = null;
      }
    };
  }, [SERVICES.length]);

  return (
    <GuestLayout>
      <div className="min-h-screen">
        {/* ================= HERO & SERVICES SECTION (CONTINUOUS BACKGROUND) ================= */}
        <div
          className="relative overflow-hidden bg-white"
          style={{
            backgroundImage: `url(${heroBgImage})`,
            backgroundSize: 'contain',
            backgroundPosition: '100% -25%',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* HERO SECTION */}
          <section className="relative px-4 py-16 sm:px-6 lg:px-8">
            <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-screen-2xl items-center">
              <div className="grid w-full gap-12 lg:grid-cols-[2fr_2.8fr] lg:items-center">
                {/* LEFT COLUMN */}
                <div className="text-center lg:text-left">
                  <h1 className="mb-6 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
                    {t('home.hero.title', { highlight: '' }).split('{highlight}')[0]}
                    <span className="text-primary">
                      {" "}{t('home.hero.title_highlight')}
                    </span>
                  </h1>

                  <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-gray-600 sm:text-xl lg:mx-0">
                    {t('home.hero.subtitle')}
                  </p>

                  <div className="flex flex-col gap-4 sm:flex-row lg:justify-start">
                    <Link href={auth?.user ? route('services') : route('otp.phone')}>
                      <Button
                        size="lg"
                        className="bg-primary px-8 py-6 text-lg font-semibold text-white shadow-lg transition hover:opacity-90"
                      >
                        {t('home.cta.get_started')}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* RIGHT COLUMN (MAP) */}
                <div ref={demoRef} className="mt-8 lg:mt-0">
                  <div className="h-[440px] w-full overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                    <CoverageAreaMap
                      googleMapsApiKey={googleMapsApiKey}
                      height="440px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SERVICES SECTION - One horizontal carousel: Broadband | Voice | Combo */}
          <section id="services" className="relative px-4 py-20 sm:px-6 lg:px-8">
            <div className="relative z-10 mx-auto max-w-screen-2xl">
              <h3 className="mb-12 text-center text-2xl font-semibold text-primary sm:mb-16 sm:text-4xl">
                {t('home.services.title')}
              </h3>

              <div className="relative">
                <div className="flex items-stretch gap-4">

                {/* {!isMobile && (
  <button onClick={prevService} aria-label="Previous service">
    <ChevronLeft className="h-10 w-10 text-primary" />
  </button>
)} */}
{!isMobile && (
                  <button
                    onClick={prevService}
                    // className="flex h-10 w-10 shrink-0 self-center text-primary shadow-md transition hover:bg-primary hover:opacity-90 hover:shadow-lg"
                    aria-label="Previous service"
                  >
                    <ChevronLeft className="mx-auto h-10 w-10 text-primary hover:opacity-90 transition hover:bg-primary hover:text-white hover:shadow-lg" />
                  </button>)}

                  <div className="mt-4 sm:mt-8 min-w-0 flex-1 overflow-hidden">
                    <div
                      ref={carouselRef}
                      className="
    flex overflow-x-auto scrollbar-hide
    snap-x snap-mandatory
    sm:snap-none
  "
  style={{
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    cursor: isDragging ? 'grabbing' : 'grab',
  }}
  {...(!isMobile && {
    onMouseDown: handleMouseDown,
    onMouseLeave: handleMouseLeave,
    onMouseUp: handleMouseUp,
    onMouseMove: handleMouseMove,
  })}
  {...(isMobile && {
    onTouchStart: undefined,
    onTouchMove: undefined,
    onTouchEnd: undefined,
  })}
                      onMouseDown={handleMouseDown}
                      onMouseLeave={handleMouseLeave}
                      onMouseUp={handleMouseUp}
                      onMouseMove={handleMouseMove}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      {Array.from({ length: SLIDE_COUNT }, (_, i) => i).map((physicalIndex) => {
                        const service = SERVICES[PHYSICAL_TO_LOGICAL[physicalIndex]];
                        return (
                        <div
                          key={physicalIndex}
                          className="flex min-w-full shrink-0 flex-col snap-center overflow-x-hidden px-2 sm:px-4 min-h-[520px] sm:min-h-[620px]"
                        >
                          <div className="min-w-0 w-full">
                            <h2 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                              {t(service?.titleKey)}
                            </h2>

                            <p
  className={`hidden sm:block text-gray-600 text-base leading-relaxed break-words columns-2 [column-gap:0.75rem] sm:columns-1 sm:text-lg transition-all duration-300 ease-in-out ${
    expandedDescriptions[physicalIndex]
      ? 'max-h-[500px] overflow-visible'
      : 'max-h-[3.5rem] overflow-hidden'
  }`}
  // style={{
  //   display: '-webkit-box',
  //   WebkitBoxOrient: 'vertical',
  //   WebkitLineClamp: expandedDescriptions[physicalIndex] ? 'unset' : '2',
  //   lineHeight: '1.5rem',
  // }}
>
  {t(service?.descriptionKey)}
</p>
<button
  onClick={() => toggleDescription(physicalIndex)}
  className="hidden mt-1 text-sm font-medium text-primary"
>
  {expandedDescriptions[physicalIndex] ? 'Show less' : 'Read more'}
</button>
                          </div>

<div className="flex flex-1 items-center justify-center">
  <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
    {service?.features?.map((feature, featureIndex) => (
      <div key={featureIndex} className="flex flex-col items-center">
        <div className="mb-3 flex h-[180px] sm:h-[260px] w-full max-w-[200px] items-center justify-center">
          <img
            src={feature?.image}
            alt={t(feature?.titleKey)}
            className="h-auto max-h-full w-auto max-w-full object-contain"
          />
        </div>
        <p className="text-center text-sm sm:text-base font-medium text-gray-900">
          {t(feature?.titleKey)}
        </p>
      </div>
    ))}
  </div>
</div>
                        </div>
                        );
                      })}
                    </div>
                  </div>

                  {!isMobile && (
                  <button
                    onClick={nextService}
                    // className="flex h-10 w-10 shrink-0 self-center rounded-full bg-white text-primary shadow-md transition hover:bg-primary hover:text-white hover:shadow-lg"
                    aria-label="Next service"
                  >
                    <ChevronRight className="mx-auto h-10 w-10 text-primary hover:opacity-90 transition hover:bg-primary hover:text-white hover:shadow-lg" />
                  </button>
              )}
                </div>

                {/* Service indicators */}
                <div className="mt-6 flex justify-center gap-2">
                  {SERVICES.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentServiceIndex(index);
                        scrollToService(index);
                      }}
                      className={`h-2 rounded-full transition-all ${
                        index === currentServiceIndex ? 'w-8 bg-primary' : 'w-2 bg-gray-300'
                      }`}
                      aria-label={`Go to ${t(SERVICES[index].titleKey)}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </GuestLayout>
  );
}
