import { Button } from '@/components/ui/button';
import { GoogleMapsProvider } from '@/contexts/google-maps-context';
import { CoverageAreaMap } from '@/features/services/components/coverage-area-map';
import { useIsSmallScreen } from '@/hooks/use-mobile';
import { useTranslation } from '@/hooks/use-translation';
import GuestLayout from '@/layouts/guest-layout';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import advancedGamingCard from '../images/advanced-gaming.svg';
import basicInternetCard from '../images/basic-internet-and-communication.svg';
import costEffectivePackages from '../images/cost-effective-packages.png';
import entertainmentCard from '../images/entertainment-and-streaming.svg';
import heroBgImage from '../images/hero-bg.png';
import multipleSpeedOptions from '../images/multiple-speed-options.svg';
import singleBilling from '../images/single-billing.png';
import technicalSupport from '../images/technical-support.svg';
import unlimitedData from '../images/unlimited-data.svg';
import voiceInternetBundle from '../images/voice-internet-bundle.png';

interface HomePageProps {
    googleMapsApiKey: string;
}

export default function HomePage({ googleMapsApiKey }: HomePageProps) {
    const { auth } = usePage<SharedData>().props;
    const demoRef = useRef<HTMLDivElement>(null);
    const carouselRef = useRef<HTMLDivElement>(null); // Desktop carousel ref
    const { t } = useTranslation();

    // State for desktop carousel
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [expandedDescriptions, setExpandedDescriptions] = useState<Record<number, boolean>>({});
    const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
    const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isSnappingRef = useRef(false);

    // State for mobile feature carousels
    const [currentFeatureByService, setCurrentFeatureByService] = useState<Record<number, number>>({
        0: 0, // Broadband starts at first feature
        1: 0, // Combo starts at first feature
    });

    const SERVICES = useMemo(
        () =>
            [
                {
                    id: 'broadband',
                    titleKey: 'home.services.broadband.title',
                    descriptionKey: 'home.services.broadband.description',
                    features: [
                        { image: multipleSpeedOptions, titleKey: 'home.services.broadband.feature1' },
                        { image: unlimitedData, titleKey: 'home.services.broadband.feature2' },
                        { image: technicalSupport, titleKey: 'home.services.broadband.feature3' },
                    ],
                },
                {
                    id: 'combo',
                    titleKey: 'home.services.combo.title',
                    descriptionKey: 'home.services.combo.description',
                    features: [
                        { image: voiceInternetBundle, titleKey: 'home.services.combo.feature1' },
                        { image: costEffectivePackages, titleKey: 'home.services.combo.feature2' },
                        { image: singleBilling, titleKey: 'home.services.combo.feature3' },
                    ],
                },
            ] as const,
        [],
    );

    const isMobile = useIsSmallScreen();
    const featureContainerRefs = useRef<Array<HTMLDivElement | null>>([]);
    const scrollAnimationRef = useRef<number | null>(null);

    // Initialize mobile feature refs
    useEffect(() => {
        featureContainerRefs.current = featureContainerRefs.current.slice(0, SERVICES.length);
    }, [SERVICES.length]);

    // ========== DESKTOP CAROUSEL LOGIC ==========
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

    // Desktop drag handlers
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

    // Desktop touch handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        if (isMobile) return;
        if ((e.target as HTMLElement).closest?.('[data-inner-feature-carousel]')) return;
        if (!carouselRef.current) return;
        setIsDragging(true);
        setStartX(e.touches[0].pageX - carouselRef.current.offsetLeft);
        setScrollLeft(carouselRef.current.scrollLeft);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || !carouselRef.current || isMobile) return;
        const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        carouselRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    // Start at Broadband (physical index 1) after layout
    useEffect(() => {
        if (isMobile) return;
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
    }, [SERVICES.length, isMobile]);

    // Update service index on scroll; snap to nearest slide when scroll ends
    useEffect(() => {
        if (isMobile) return;

        const carousel = carouselRef.current;
        if (!carousel || !SERVICES.length) return;
        const slideCount = SERVICES.length + 2;
        const physicalToLogical: number[] = [SERVICES.length - 1, ...Array.from({ length: SERVICES.length }, (_, i) => i), 0];

        // Smooth scroll to target position with easing
        const smoothScrollTo = (targetScroll: number, duration = 300) => {
            const startScroll = carousel.scrollLeft;
            const startTime = performance.now();

            const animateScroll = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic for smooth deceleration
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                carousel.scrollLeft = startScroll + (targetScroll - startScroll) * easeProgress;

                if (progress < 1) {
                    requestAnimationFrame(animateScroll);
                } else {
                    isSnappingRef.current = false;
                }
            };

            requestAnimationFrame(animateScroll);
        };

        // Snap to nearest slide - handles both clone wrapping AND mid-slide snapping
        const doSnap = () => {
            if (isSnappingRef.current) return;

            const w = carousel.scrollWidth / slideCount;
            if (w <= 0) return;

            const pos = carousel.scrollLeft;
            const nearestPhysical = Math.round(pos / w);
            const targetScroll = nearestPhysical * w;

            // Check if we need to handle clone wrapping
            if (nearestPhysical <= 0) {
                // At or before first clone - instant jump to real last slide
                isSnappingRef.current = true;
                carousel.scrollLeft = (slideCount - 2) * w;
                setCurrentServiceIndex(SERVICES.length - 1);
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        isSnappingRef.current = false;
                    });
                });
            } else if (nearestPhysical >= slideCount - 1) {
                // At or after last clone - instant jump to real first slide
                isSnappingRef.current = true;
                carousel.scrollLeft = 1 * w;
                setCurrentServiceIndex(0);
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        isSnappingRef.current = false;
                    });
                });
            } else {
                // Normal snap to nearest slide with smooth animation
                const diff = Math.abs(pos - targetScroll);
                // Only snap if we're more than 5px off (threshold to avoid micro-adjustments)
                if (diff > 5) {
                    isSnappingRef.current = true;
                    smoothScrollTo(targetScroll, 250);
                    setCurrentServiceIndex(physicalToLogical[nearestPhysical]);
                }
            }
        };

        // Debounced scroll end detection for trackpad/wheel scrolling
        let scrollEndTimer: ReturnType<typeof setTimeout> | null = null;
        const SCROLL_END_DELAY = 150; // ms to wait after last scroll event

        const handleScroll = () => {
            if (isSnappingRef.current) return;

            const slideWidth = carousel.scrollWidth / slideCount;
            if (slideWidth <= 0) return;
            const scrollPos = carousel.scrollLeft;
            const physical = Math.floor((scrollPos + slideWidth / 2) / slideWidth);

            // Update current index for indicator dots
            if (physical >= 1 && physical <= slideCount - 2) {
                setCurrentServiceIndex(physicalToLogical[physical]);
            } else {
                setCurrentServiceIndex(physical <= 0 ? SERVICES.length - 1 : 0);
            }

            // Clear existing timers
            if (snapTimeoutRef.current) {
                clearTimeout(snapTimeoutRef.current);
                snapTimeoutRef.current = null;
            }
            if (scrollEndTimer) {
                clearTimeout(scrollEndTimer);
            }

            // Set debounced snap - triggers when scrolling stops
            scrollEndTimer = setTimeout(doSnap, SCROLL_END_DELAY);
        };

        // Native scrollend event (more reliable when supported)
        const handleScrollEnd = () => {
            if (scrollEndTimer) {
                clearTimeout(scrollEndTimer);
                scrollEndTimer = null;
            }
            if (snapTimeoutRef.current) {
                clearTimeout(snapTimeoutRef.current);
                snapTimeoutRef.current = null;
            }
            // Small delay to ensure momentum has settled
            setTimeout(doSnap, 50);
        };

        carousel.addEventListener('scroll', handleScroll, { passive: true });
        carousel.addEventListener('scrollend', handleScrollEnd);

        return () => {
            carousel.removeEventListener('scroll', handleScroll);
            carousel.removeEventListener('scrollend', handleScrollEnd);
            if (snapTimeoutRef.current) {
                clearTimeout(snapTimeoutRef.current);
                snapTimeoutRef.current = null;
            }
            if (scrollEndTimer) {
                clearTimeout(scrollEndTimer);
            }
        };
    }, [SERVICES.length, isMobile]);

    // ========== MOBILE FEATURE CAROUSEL LOGIC ==========
    // Scroll to specific feature within a service
    const scrollToFeature = useCallback((serviceIndex: number, featureIndex: number) => {
        const container = featureContainerRefs.current[serviceIndex];
        if (!container) return;

        const cardWidth = container.offsetWidth;
        const gap = 16; // gap-4
        const targetScroll = featureIndex * (cardWidth + gap);

        // Cancel any ongoing animation
        if (scrollAnimationRef.current) {
            cancelAnimationFrame(scrollAnimationRef.current);
        }

        // Smooth scroll animation
        const startScroll = container.scrollLeft;
        const startTime = performance.now();
        const duration = 300; // ms

        const animateScroll = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            container.scrollLeft = startScroll + (targetScroll - startScroll) * easeProgress;

            if (progress < 1) {
                scrollAnimationRef.current = requestAnimationFrame(animateScroll);
            } else {
                scrollAnimationRef.current = null;
                // Update current feature index after animation completes
                setCurrentFeatureByService((prev) => ({
                    ...prev,
                    [serviceIndex]: featureIndex,
                }));
            }
        };

        scrollAnimationRef.current = requestAnimationFrame(animateScroll);
    }, []);

    // Handle feature container scroll
    const handleFeatureScroll = useCallback(
        (serviceIndex: number) => {
            const container = featureContainerRefs.current[serviceIndex];
            if (!container) return;

            const cardWidth = container.offsetWidth;
            const gap = 16;
            const scrollPosition = container.scrollLeft;
            const featureIndex = Math.round(scrollPosition / (cardWidth + gap));
            const clampedIndex = Math.max(0, Math.min(featureIndex, SERVICES[serviceIndex].features.length - 1));

            // Only update if changed
            setCurrentFeatureByService((prev) => {
                if (prev[serviceIndex] === clampedIndex) return prev;
                return { ...prev, [serviceIndex]: clampedIndex };
            });
        },
        [SERVICES],
    );

    // Setup scroll listeners for mobile feature containers
    useEffect(() => {
        if (!isMobile) return;

        const cleanupFunctions: (() => void)[] = [];

        SERVICES.forEach((_, index) => {
            const container = featureContainerRefs.current[index];
            if (!container) return;

            const handleScroll = () => handleFeatureScroll(index);
            container.addEventListener('scroll', handleScroll);
            cleanupFunctions.push(() => container.removeEventListener('scroll', handleScroll));
        });

        return () => {
            cleanupFunctions.forEach((cleanup) => cleanup());
            if (scrollAnimationRef.current) {
                cancelAnimationFrame(scrollAnimationRef.current);
            }
        };
    }, [SERVICES, handleFeatureScroll, isMobile]);

    // Next/Prev feature navigation for mobile
    const nextFeature = useCallback(
        (serviceIndex: number) => {
            const currentFeature = currentFeatureByService[serviceIndex] || 0;
            const totalFeatures = SERVICES[serviceIndex].features.length;
            if (currentFeature < totalFeatures - 1) {
                scrollToFeature(serviceIndex, currentFeature + 1);
            }
        },
        [currentFeatureByService, SERVICES, scrollToFeature],
    );

    const prevFeature = useCallback(
        (serviceIndex: number) => {
            const currentFeature = currentFeatureByService[serviceIndex] || 0;
            if (currentFeature > 0) {
                scrollToFeature(serviceIndex, currentFeature - 1);
            }
        },
        [currentFeatureByService, scrollToFeature],
    );

    return (
        <GoogleMapsProvider apiKey={googleMapsApiKey}>
            <GuestLayout>
                <div className="min-h-screen">
                    {/* ================= HERO & SERVICES SECTION ================= */}
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
                        <section className="relative px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
                            <div className="relative z-10 mx-auto flex min-h-[50vh] max-w-screen-2xl items-center sm:min-h-[70vh]">
                                <div className="grid w-full gap-6 sm:gap-12 lg:grid-cols-[2fr_2.8fr] lg:items-center">
                                    {/* LEFT COLUMN */}
                                    <div className="text-center lg:text-left">
                                        <h1 className="mb-3 text-2xl leading-tight font-bold text-gray-900 sm:mb-6 sm:text-3xl lg:text-5xl">
                                            {t('home.hero.title', { highlight: '' }).split('{highlight}')[0]}
                                            <span className="text-primary"> {t('home.hero.title_highlight')}</span>
                                        </h1>

                                        <p className="mx-auto mb-4 max-w-xl text-base leading-relaxed text-gray-600 sm:mb-8 sm:text-lg lg:mx-0">
                                            {t('home.hero.subtitle')}
                                        </p>

                                        <div className="flex flex-col gap-4 sm:flex-row lg:justify-start">
                                            <Link href={auth?.user ? route('services') : route('otp.phone')}>
                                                <Button
                                                    size="lg"
                                                    className="bg-primary px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:opacity-90 sm:px-8 sm:py-6 sm:text-lg"
                                                >
                                                    {t('home.cta.get_started')}
                                                    <ArrowRight className="ml-2 h-5 w-5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* RIGHT COLUMN (MAP) */}
                                    <div ref={demoRef} className="mt-2 sm:mt-8 lg:mt-0">
                                        <div className="h-[350px] w-full overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 sm:h-[440px]">
                                            <CoverageAreaMap googleMapsApiKey={googleMapsApiKey} height="100%" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* PACKAGES SECTION */}
                        <section className="relative px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
                            <div className="relative z-10 mx-auto max-w-screen-2xl space-y-6">
                                <h3 className="text-center text-xl font-semibold text-primary sm:mb-4 sm:text-2xl lg:text-4xl">
                                    {t('home.packages.title')}
                                </h3>
                                {/* <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-gray-600 sm:mb-12 sm:text-base">
                                    {t('home.packages.subtitle')}
                                </p> */}

                                <div className="mt-14 grid grid-cols-1 gap-6 sm:mt-20 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                                    {[
                                        { image: basicInternetCard, titleKey: 'home.packages.basic.title' },
                                        { image: entertainmentCard, titleKey: 'home.packages.entertainment.title' },
                                        { image: advancedGamingCard, titleKey: 'home.packages.advanced.title' },
                                    ].map((pkg, index) => (
                                        <div key={index} className="group flex justify-center transition-transform duration-300 hover:-translate-y-2">
                                            <img
                                                src={pkg.image}
                                                alt={t(pkg.titleKey)}
                                                className="h-auto w-full max-w-[315px] rounded-2xl shadow-lg transition-shadow duration-300 group-hover:shadow-xl"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* <div className="mt-8 flex justify-center sm:mt-12">
                                    <Link href={auth?.user ? route('services') : route('otp.phone')}>
                                        <Button
                                            size="lg"
                                            className="bg-primary px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:opacity-90 sm:px-8 sm:py-6 sm:text-lg"
                                        >
                                            {t('home.packages.cta')}
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                </div> */}
                            </div>
                        </section>

                        {/* SERVICES SECTION */}
                        <section id="services" className="relative px-4 py-10 sm:px-6 sm:py-20 lg:px-8">
                            <div className="relative z-10 mx-auto max-w-screen-2xl">
                                <h3 className="mb-6 text-center text-xl font-semibold text-primary sm:mb-12 sm:mb-16 sm:text-2xl sm:text-4xl">
                                    {t('home.services.title')}
                                </h3>

                                <div className="relative">
                                    {isMobile ? (
                                        /* ========== MOBILE LAYOUT: Vertical Services ========== */
                                        <div className="space-y-10">
                                            {SERVICES.map((service, serviceIndex) => (
                                                <div key={service.id} className="service-section" id={`service-${service.id}`}>
                                                    {/* Service Header */}
                                                    <div className="mb-4">
                                                        <div className="flex items-center justify-between">
                                                            <h2 className="text-xl font-bold text-gray-900">{t(service.titleKey)}</h2>
                                                            {/* <span className="text-sm font-medium text-primary">
                                {currentFeatureByService[serviceIndex] + 1} / {service.features.length}
                              </span> */}
                                                        </div>
                                                        <p className="mt-2 text-gray-600">{t(service.descriptionKey)}</p>

                                                        {/* Feature Progress Dots */}
                                                        {/* <div className="mt-4 flex justify-center gap-2">
                              {service.features.map((_, featureIndex) => (
                                <button
                                  key={featureIndex}
                                  onClick={() => scrollToFeature(serviceIndex, featureIndex)}
                                  className={`h-2 rounded-full transition-all ${
                                    currentFeatureByService[serviceIndex] === featureIndex
                                      ? 'w-6 bg-primary'
                                      : 'w-2 bg-gray-300'
                                  }`}
                                  aria-label={`Go to feature ${featureIndex + 1}`}
                                />
                              ))}
                            </div> */}
                                                    </div>

                                                    {/* Features Carousel Container */}
                                                    <div className="relative">
                                                        {/* Navigation Arrows */}
                                                        {/* <div className="absolute left-0 right-0 top-1/2 z-10 flex -translate-y-1/2 justify-between px-1">
                              <button
                                onClick={() => prevFeature(serviceIndex)}
                                disabled={currentFeatureByService[serviceIndex] === 0}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-lg transition hover:bg-primary hover:text-white disabled:opacity-30"
                                aria-label="Previous feature"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => nextFeature(serviceIndex)}
                                disabled={currentFeatureByService[serviceIndex] === service.features.length - 1}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-lg transition hover:bg-primary hover:text-white disabled:opacity-30"
                                aria-label="Next feature"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </div> */}

                                                        {/* Features Carousel */}
                                                        <div
                                                            ref={(el) => (featureContainerRefs.current[serviceIndex] = el)}
                                                            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
                                                            style={{
                                                                scrollbarWidth: 'none',
                                                                msOverflowStyle: 'none',
                                                                WebkitOverflowScrolling: 'touch',
                                                            }}
                                                        >
                                                            {service.features.map((feature, featureIndex) => (
                                                                <div
                                                                    key={featureIndex}
                                                                    className="flex min-w-[85vw] snap-center flex-col items-center rounded-xl border border-gray-200 bg-white p-6 shadow-xs"
                                                                >
                                                                    <div className="mb-4 flex h-48 w-full items-center justify-center">
                                                                        <img
                                                                            src={feature.image}
                                                                            alt={t(feature.titleKey)}
                                                                            className="h-auto max-h-full w-auto max-w-full object-contain"
                                                                        />
                                                                    </div>
                                                                    <p className="text-center text-base font-semibold text-gray-900">
                                                                        {t(feature.titleKey)}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="mt-4 flex justify-center gap-2">
                                                            {service.features.map((_, featureIndex) => (
                                                                <button
                                                                    key={featureIndex}
                                                                    onClick={() => scrollToFeature(serviceIndex, featureIndex)}
                                                                    className={`h-2 rounded-full transition-all ${
                                                                        currentFeatureByService[serviceIndex] === featureIndex
                                                                            ? 'w-6 bg-primary'
                                                                            : 'w-2 bg-gray-300'
                                                                    }`}
                                                                    aria-label={`Go to feature ${featureIndex + 1}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        /* ========== DESKTOP LAYOUT: Horizontal Carousel ========== */
                                        <>
                                            <div className="flex items-stretch gap-4">
                                                {!isMobile && (
                                                    <button
                                                        onClick={prevService}
                                                        aria-label="Previous service"
                                                        className="flex h-10 w-10 shrink-0 self-center"
                                                    >
                                                        <ChevronLeft className="mx-auto h-10 w-10 text-primary transition hover:bg-primary hover:text-white hover:opacity-90 hover:shadow-lg" />
                                                    </button>
                                                )}

                                                <div className="mt-4 min-w-0 flex-1 overflow-hidden sm:mt-8">
                                                    <div
                                                        ref={carouselRef}
                                                        className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto sm:snap-none"
                                                        style={{
                                                            scrollbarWidth: 'none',
                                                            msOverflowStyle: 'none',
                                                            cursor: isDragging ? 'grabbing' : 'grab',
                                                        }}
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
                                                                    className="flex min-h-[380px] min-w-full shrink-0 snap-center flex-col overflow-x-hidden px-2 sm:min-h-[620px] sm:px-4"
                                                                >
                                                                    <div className="w-full min-w-0">
                                                                        <h2 className="mb-2 text-3xl font-bold text-gray-900">
                                                                            {t(service.titleKey)}
                                                                        </h2>
                                                                        <p
                                                                            className={`text-lg leading-relaxed break-words text-gray-600 transition-all duration-300 ease-in-out ${
                                                                                expandedDescriptions[physicalIndex]
                                                                                    ? 'max-h-[500px] overflow-visible'
                                                                                    : 'max-h-[3.5rem] overflow-hidden'
                                                                            }`}
                                                                        >
                                                                            {t(service.descriptionKey)}
                                                                        </p>
                                                                        <button
                                                                            onClick={() => toggleDescription(physicalIndex)}
                                                                            className="mt-1 hidden text-sm font-medium text-primary"
                                                                        >
                                                                            {expandedDescriptions[physicalIndex] ? 'Show less' : 'Read more'}
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex flex-1 items-center justify-center">
                                                                        <div className="grid w-full grid-cols-3 gap-8">
                                                                            {service.features.map((feature, featureIndex) => (
                                                                                <div key={featureIndex} className="flex flex-col items-center">
                                                                                    <div className="mb-3 flex h-[280px] w-full max-w-[200px] items-center justify-center">
                                                                                        <img
                                                                                            src={feature.image}
                                                                                            alt={t(feature.titleKey)}
                                                                                            className="h-auto max-h-full w-auto max-w-full object-contain"
                                                                                        />
                                                                                    </div>
                                                                                    <p className="text-center text-base font-medium text-gray-900">
                                                                                        {t(feature.titleKey)}
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
                                                        aria-label="Next service"
                                                        className="flex h-10 w-10 shrink-0 self-center"
                                                    >
                                                        <ChevronRight className="mx-auto h-10 w-10 text-primary transition hover:bg-primary hover:text-white hover:opacity-90 hover:shadow-lg" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Desktop service indicators */}
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
                                        </>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </GuestLayout>
        </GoogleMapsProvider>
    );
}
