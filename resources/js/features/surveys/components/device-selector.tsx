// import { Card, CardContent } from '@/components/ui/card';
// import { Label } from '@/components/ui/label';
// import { Badge } from '@/components/ui/badge';
// import { Separator } from '@/components/ui/separator';
// import { useAvailableDevices, AvailableDevice } from '@/hooks/use-available-devices';
// import { 
//     CheckCircle, 
//     Loader2, 
//     Package, 
//     Wifi, 
//     Phone, 
//     Zap, 
//     Network, 
//     Radio,
//     Thermometer,
//     MapPin,
//     Building2,
//     Globe,
//     ChevronDown,
//     ChevronUp
// } from 'lucide-react';
// import { useState } from 'react';
// import { cn } from '@/lib/utils';

// interface DeviceSelectorProps {
//     serviceType?: string; // '1457567289' (broadband), '1207609454' (voice), '102647257' (combo)
//     mediaType?: string; // 'PON' (fiber) or 'COPPER' - from manual survey result
//     selectedDeviceId?: string; // For single selection (broadband/voice)
//     selectedDeviceInternetId?: string; // For combo internet device
//     selectedDeviceVoiceId?: string; // For combo voice device
//     onDeviceSelect?: (device: AvailableDevice) => void; // For single selection
//     onInternetDeviceSelect?: (device: AvailableDevice) => void; // For combo internet
//     onVoiceDeviceSelect?: (device: AvailableDevice) => void; // For combo voice
//     disabled?: boolean;
// }

// const SERVICE_TYPES = {
//     BROADBAND: '1457567289',
//     VOICE: '1207609454',
//     COMBO: '102647257',
// };

// export function DeviceSelector({
//     serviceType,
//     mediaType,
//     selectedDeviceId,
//     selectedDeviceInternetId,
//     selectedDeviceVoiceId,
//     onDeviceSelect,
//     onInternetDeviceSelect,
//     onVoiceDeviceSelect,
//     disabled,
// }: DeviceSelectorProps) {
//     const isCombo = serviceType === SERVICE_TYPES.COMBO;

//     // Track which device images have failed to load (by device ID)
//     const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

//     // Track which device cards have expanded specifications (by device ID)
//     const [expandedSpecs, setExpandedSpecs] = useState<Set<string>>(new Set());

//     // Fetch devices filtered by service type and media type (for manual surveys)
//     // For combo services, fetch all then filter by device_type
//     // For single services, API filters by service_type and optional media_type
//     const { devices: allDevices, loading, error } = useAvailableDevices(
//         isCombo ? undefined : serviceType,
//         mediaType // Pass media type for PON/COPPER filtering (manual surveys)
//     );

//     // Filter devices by type for combo
//     const broadbandDevices = isCombo
//         ? allDevices.filter((d: AvailableDevice) => d.device_type === 'broadband' || d.device_type === 'universal')
//         : [];

//     const voiceDevices = isCombo
//         ? allDevices.filter((d: AvailableDevice) => d.device_type === 'voice' || d.device_type === 'universal')
//         : [];

//     // For single service, use all devices (already filtered by API)
//     const displayDevices = isCombo ? [] : allDevices;

//     if (loading) {
//         return (
//             <div className="flex items-center justify-center py-8">
//                 <Loader2 className="h-6 w-6 animate-spin text-primary" />
//                 <span className="ml-2 text-sm text-gray-600">Loading devices...</span>
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div className="rounded-lg border border-red-200 bg-red-50 p-4">
//                 <p className="text-sm text-red-700">Error loading devices: {error}</p>
//             </div>
//         );
//     }

//     const formatPrice = (price: number) => {
//         return new Intl.NumberFormat('en-ET', {
//             style: 'currency',
//             currency: 'ETB',
//             minimumFractionDigits: 0,
//             maximumFractionDigits: 2,
//         }).format(price);
//     };

//     const renderSpecificationItem = (icon: React.ReactNode, label: string, value: string | string[] | Record<string, any>, className?: string) => {
//         if (!value) return null;

//         let displayValue: string;
//         if (Array.isArray(value)) {
//             displayValue = value.join(', ');
//         } else if (typeof value === 'object') {
//             displayValue = Object.entries(value)
//                 .map(([k, v]) => `${k}: ${v}`)
//                 .join(', ');
//         } else {
//             displayValue = value;
//         }

//         return (
//             <div className={cn('flex items-start gap-2 py-1.5', className)}>
//                 <div className="mt-0.5 shrink-0 text-primary">{icon}</div>
//                 <div className="flex-1 min-w-0">
//                     <p className="text-xs font-medium text-gray-700">{label}</p>
//                     <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{displayValue}</p>
//                 </div>
//             </div>
//         );
//     };

//     const renderDeviceCard = (device: AvailableDevice, isSelected: boolean, onSelect: () => void, namePrefix: string = 'device') => {
//         const hasImage = device.image_url && device.image_url.trim().length > 0;
//         const imageError = imageErrors.has(device.id);
//         const specs = device.specifications || {};
//         const specsExpanded = expandedSpecs.has(device.id);
//         const hasSpecs = Object.keys(specs).length > 0;

//         const handleImageError = () => {
//             setImageErrors((prev) => new Set(prev).add(device.id));
//         };

//         const toggleSpecs = (e: React.MouseEvent) => {
//             e.stopPropagation();
//             e.preventDefault();
//             setExpandedSpecs((prev) => {
//                 const newSet = new Set(prev);
//                 if (newSet.has(device.id)) {
//                     newSet.delete(device.id);
//                 } else {
//                     newSet.add(device.id);
//                 }
//                 return newSet;
//             });
//         };

//         return (
//             <label
//                 key={device.id}
//                 onClick={() => !disabled && onSelect()}
//                 className={cn(
//                     'group relative flex cursor-pointer flex-row rounded-xl border-2 bg-white shadow-sm transition-all duration-300 overflow-hidden',
//                     disabled
//                         ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-50'
//                         : isSelected
//                             ? 'border-primary ring-4 ring-primary/20 shadow-xl'
//                             : 'border-gray-200 hover:border-primary/50 hover:shadow-lg'
//                 )}
//             >
//                 <input
//                     type="radio"
//                     name={namePrefix}
//                     value={device.id}
//                     checked={isSelected}
//                     onChange={() => { }}
//                     className="absolute inset-0 cursor-pointer opacity-0"
//                     disabled={disabled}
//                 />

//                 {/* Selection Indicator */}
//                 {isSelected && (
//                     <div className="absolute top-3 right-3 z-10 rounded-full bg-primary p-1.5 shadow-lg">
//                         <CheckCircle className="h-4 w-4 text-white" />
//                     </div>
//                 )}

//                 {/* Device Image Section - Left Side */}
//                 <div className={cn(
//                     'relative shrink-0 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center',
//                     hasImage && !imageError ? 'w-52 min-h-[200px]' : 'w-20 min-h-[200px]'
//                 )}>
//                     {hasImage && !imageError ? (
//                         <>
//                             <img
//                                 src={device.image_url || ''}
//                                 alt={device.name}
//                                 className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-110"
//                                 onError={handleImageError}
//                             />
//                             <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-transparent pointer-events-none" />
//                         </>
//                     ) : (
//                         <div className={cn(
//                             'p-4 transition-colors',
//                             isSelected ? 'text-primary' : 'text-gray-400'
//                         )}>
//                             {device.device_type === 'broadband' ? (
//                                 <Wifi className="h-10 w-10" />
//                             ) : device.device_type === 'voice' ? (
//                                 <Phone className="h-10 w-10" />
//                             ) : (
//                                 <Package className="h-10 w-10" />
//                             )}
//                         </div>
//                     )}
//                 </div>

//                 {/* Content Section - Right Side */}
//                 <div className="flex flex-col flex-1 p-5 min-w-0">
//                     {/* Header */}
//                     <div className="space-y-2 mb-3">
//                         <div>
//                             <h4 className={cn(
//                                 'text-lg font-bold leading-tight mb-1.5',
//                                 isSelected ? 'text-primary' : 'text-gray-900'
//                             )}>
//                                 {device.name}
//                             </h4>
//                             <div className="flex items-center gap-2 flex-wrap">
//                                 <p className="text-xs text-gray-500">
//                                     {device.vendor} {device.model ? `• ${device.model}` : ''}
//                                 </p>
//                                 {device.device_type && (
//                                     <Badge variant="outline" className="text-xs">
//                                         {device.device_type === 'broadband' ? 'Internet' : 
//                                          device.device_type === 'voice' ? 'Voice' : 'Universal'}
//                                     </Badge>
//                                 )}
//                             </div>
//                         </div>
//                     </div>

//                     {/* Price - Prominent */}
//                     <div className="flex items-baseline gap-2 mb-3">
//                         <span className="text-2xl font-bold text-gray-900">{formatPrice(device.price)}</span>
//                         <Badge variant="secondary" className="text-xs">
//                             One-time
//                         </Badge>
//                     </div>

//                     <Separator className="my-3" />

//                     {/* Description */}
//                     {device.description && (
//                         <div className="space-y-1 mb-3">
//                             <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Overview</p>
//                             <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{device.description}</p>
//                         </div>
//                     )}

//                     {/* Specifications - Collapsible */}
//                     {hasSpecs && (
//                         <div className="space-y-2">
//                             <div className="flex items-center justify-between">
//                                 <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Specifications</p>
//                                 <button
//                                     type="button"
//                                     onClick={toggleSpecs}
//                                     className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
//                                 >
//                                     {specsExpanded ? (
//                                         <>
//                                             <ChevronUp className="h-3 w-3" />
//                                             Hide
//                                         </>
//                                     ) : (
//                                         <>
//                                             <ChevronDown className="h-3 w-3" />
//                                             See more
//                                         </>
//                                     )}
//                                 </button>
//                             </div>
//                             {specsExpanded && (
//                                 <div className="space-y-1 bg-gray-50 rounded-lg p-3 animate-in fade-in slide-in-from-top-2 duration-200">
//                                 {/* Speed Specifications */}
//                                 {specs.speed && (
//                                     <>
//                                         {specs.speed.lan_cable && renderSpecificationItem(
//                                             <Zap className="h-3.5 w-3.5" />,
//                                             'LAN Speed',
//                                             specs.speed.lan_cable
//                                         )}
//                                         {specs.speed.wifi && renderSpecificationItem(
//                                             <Wifi className="h-3.5 w-3.5" />,
//                                             'Wi-Fi Speed',
//                                             specs.speed.wifi
//                                         )}
//                                     </>
//                                 )}

//                                 {/* Ethernet/Ports */}
//                                 {specs.ethernet && (
//                                     <>
//                                         {specs.ethernet.lan_ports && renderSpecificationItem(
//                                             <Network className="h-3.5 w-3.5" />,
//                                             'LAN Ports',
//                                             specs.ethernet.lan_ports
//                                         )}
//                                         {specs.ethernet.pots_port && renderSpecificationItem(
//                                             <Phone className="h-3.5 w-3.5" />,
//                                             'Voice Port',
//                                             specs.ethernet.pots_port
//                                         )}
//                                     </>
//                                 )}

//                                 {/* WiFi Features */}
//                                 {specs.wifi_features && (
//                                     <>
//                                         {specs.wifi_features.standard && renderSpecificationItem(
//                                             <Radio className="h-3.5 w-3.5" />,
//                                             'Wi-Fi Standard',
//                                             specs.wifi_features.standard
//                                         )}
//                                         {specs.wifi_features.type && renderSpecificationItem(
//                                             <Wifi className="h-3.5 w-3.5" />,
//                                             'Wi-Fi Type',
//                                             specs.wifi_features.type
//                                         )}
//                                         {specs.wifi_features.technology && renderSpecificationItem(
//                                             <Zap className="h-3.5 w-3.5" />,
//                                             'Technology',
//                                             specs.wifi_features.technology
//                                         )}
//                                     </>
//                                 )}

//                                 {/* Operating Range */}
//                                 {specs.operating_range && (
//                                     typeof specs.operating_range === 'string' 
//                                         ? renderSpecificationItem(
//                                             <MapPin className="h-3.5 w-3.5" />,
//                                             'Operating Range',
//                                             specs.operating_range
//                                         )
//                                         : (
//                                             <>
//                                                 {specs.operating_range.indoor && renderSpecificationItem(
//                                                     <Building2 className="h-3.5 w-3.5" />,
//                                                     'Indoor Range',
//                                                     specs.operating_range.indoor
//                                                 )}
//                                                 {specs.operating_range.outdoor && renderSpecificationItem(
//                                                     <Globe className="h-3.5 w-3.5" />,
//                                                     'Outdoor Range',
//                                                     specs.operating_range.outdoor
//                                                 )}
//                                             </>
//                                         )
//                                 )}

//                                 {/* Functionality */}
//                                 {specs.functionality && renderSpecificationItem(
//                                     <Thermometer className="h-3.5 w-3.5" />,
//                                     'Operating Conditions',
//                                     specs.functionality
//                                 )}

//                                 {/* Service Type (for voice devices) */}
//                                 {specs.service_type && renderSpecificationItem(
//                                     <Phone className="h-3.5 w-3.5" />,
//                                     'Service Type',
//                                     specs.service_type
//                                 )}

//                                 {/* Usage */}
//                                 {specs.usage && renderSpecificationItem(
//                                     <Building2 className="h-3.5 w-3.5" />,
//                                     'Usage',
//                                     specs.usage
//                                 )}

//                                 {/* Connection */}
//                                 {specs.connection && renderSpecificationItem(
//                                     <Network className="h-3.5 w-3.5" />,
//                                     'Connection',
//                                     specs.connection
//                                 )}

//                                 {/* Voice Quality */}
//                                 {specs.voice_quality && renderSpecificationItem(
//                                     <Phone className="h-3.5 w-3.5" />,
//                                     'Voice Quality',
//                                     specs.voice_quality
//                                 )}

//                                 {/* Calling Options */}
//                                 {specs.calling_options && renderSpecificationItem(
//                                     <Globe className="h-3.5 w-3.5" />,
//                                     'Calling Options',
//                                     specs.calling_options
//                                 )}

//                                 {/* Power */}
//                                 {specs.power && renderSpecificationItem(
//                                     <Zap className="h-3.5 w-3.5" />,
//                                     'Power',
//                                     specs.power
//                                 )}

//                                 {/* Display */}
//                                 {specs.display && renderSpecificationItem(
//                                     <Package className="h-3.5 w-3.5" />,
//                                     'Display',
//                                     specs.display
//                                 )}

//                                 {/* Supplier */}
//                                 {specs.supplier && renderSpecificationItem(
//                                     <Building2 className="h-3.5 w-3.5" />,
//                                     'Supplier',
//                                     specs.supplier
//                                 )}
//                                 </div>
//                             )}
//                         </div>
//                     )}
//                 </div>
//             </label>
//         );
//     };

//     // Combo service - show both internet and voice devices sections
//     if (isCombo) {
//         const hasInternetDevices = broadbandDevices.length > 0;
//         const hasVoiceDevices = voiceDevices.length > 0;

//         if (!hasInternetDevices && !hasVoiceDevices) {
//             return (
//                 <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
//                     <p className="text-sm text-gray-600">No devices available at the moment.</p>
//                 </div>
//             );
//         }

//         return (
//             <div className="space-y-6">
//                 {/* Internet/Data Devices Section */}
//                 {hasInternetDevices && (
//                     <div className="space-y-4">
//                         <div className="flex items-center gap-2">
//                             <Wifi className="h-5 w-5 text-primary" />
//                             <Label className="text-base font-semibold">
//                                 Internet/Data Device <span className="text-red-500">*</span>
//                             </Label>
//                         </div>
//                         <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
//                             {broadbandDevices.map((device: AvailableDevice) => {
//                                 const isSelected = selectedDeviceInternetId === device.id;
//                                 return renderDeviceCard(
//                                     device,
//                                     isSelected,
//                                     () => onInternetDeviceSelect?.(device),
//                                     'device-internet'
//                                 );
//                             })}
//                         </div>
//                     </div>
//                 )}

//                 {/* Voice/Phone Devices Section */}
//                 {hasVoiceDevices && (
//                     <div className="space-y-4">
//                         <div className="flex items-center gap-2">
//                             <Phone className="h-5 w-5 text-primary" />
//                             <Label className="text-base font-semibold">
//                                 Voice/Phone Device <span className="text-red-500">*</span>
//                             </Label>
//                         </div>
//                         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
//                             {voiceDevices.map((device: AvailableDevice) => {
//                                 const isSelected = selectedDeviceVoiceId === device.id;
//                                 return renderDeviceCard(
//                                     device,
//                                     isSelected,
//                                     () => onVoiceDeviceSelect?.(device),
//                                     'device-voice'
//                                 );
//                             })}
//                         </div>
//                     </div>
//                 )}
//             </div>
//         );
//     }

//     // Single service (Broadband or Voice)
//     if (displayDevices.length === 0) {
//         return (
//             <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
//                 <p className="text-sm text-gray-600">No devices available at the moment.</p>
//             </div>
//         );
//     }

//     return (
//         <div className="space-y-4">
//             <Label className="text-sm font-medium">
//                 Select Device <span className="text-red-500">*</span>
//             </Label>
//             <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
//                 {displayDevices.map((device: AvailableDevice) => {
//                     const isSelected = selectedDeviceId === device.id;
//                     return renderDeviceCard(device, isSelected, () => onDeviceSelect?.(device), 'device');
//                 })}
//             </div>
//         </div>
//     );
// }


// import { Card, CardContent } from '@/components/ui/card';
// import { Label } from '@/components/ui/label';
// import { Badge } from '@/components/ui/badge';
// import { Separator } from '@/components/ui/separator';
// import { Button } from '@/components/ui/button';
// import { Skeleton } from '@/components/ui/skeleton';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { useAvailableDevices, AvailableDevice } from '@/hooks/use-available-devices';
// import { 
//     CheckCircle, 
//     Loader2, 
//     Package, 
//     Wifi, 
//     Phone, 
//     Zap, 
//     Network, 
//     Radio,
//     Thermometer,
//     MapPin,
//     Building2,
//     Globe,
//     ChevronDown,
//     ChevronUp,
//     Sparkles,
//     Award,
//     Shield,
//     Clock,
//     Star,
//     ExternalLink,
//     Maximize2,
//     Info,
//     Battery,
//     TrendingUp,
//     DollarSign,
//     Crown
// } from 'lucide-react';
// import { useState, useMemo, useCallback } from 'react';
// import { cn } from '@/lib/utils';

// interface DeviceSelectorProps {
//     serviceType?: string;
//     mediaType?: string;
//     selectedDeviceId?: string;
//     selectedDeviceInternetId?: string;
//     selectedDeviceVoiceId?: string;
//     onDeviceSelect?: (device: AvailableDevice) => void;
//     onInternetDeviceSelect?: (device: AvailableDevice) => void;
//     onVoiceDeviceSelect?: (device: AvailableDevice) => void;
//     disabled?: boolean;
//     showTabs?: boolean;
// }

// const SERVICE_TYPES = {
//     BROADBAND: '1457567289',
//     VOICE: '1207609454',
//     COMBO: '102647257',
// };

// const SPEC_CATEGORIES = {
//     performance: {
//         title: 'Performance',
//         icon: Zap,
//         color: 'text-orange-500 bg-orange-50',
//         keys: ['speed', 'wifi_features', 'voice_quality']
//     },
//     connectivity: {
//         title: 'Connectivity',
//         icon: Network,
//         color: 'text-blue-500 bg-blue-50',
//         keys: ['ethernet', 'connection', 'lan_ports', 'pots_port']
//     },
//     features: {
//         title: 'Features',
//         icon: Sparkles,
//         color: 'text-purple-500 bg-purple-50',
//         keys: ['functionality', 'calling_options', 'display', 'technology']
//     },
//     compatibility: {
//         title: 'Compatibility',
//         icon: Shield,
//         color: 'text-green-500 bg-green-50',
//         keys: ['operating_range', 'usage', 'service_type']
//     },
//     power: {
//         title: 'Power',
//         icon: Battery,
//         color: 'text-red-500 bg-red-50',
//         keys: ['power']
//     }
// };

// export function DeviceSelector({
//     serviceType,
//     mediaType,
//     selectedDeviceId,
//     selectedDeviceInternetId,
//     selectedDeviceVoiceId,
//     onDeviceSelect,
//     onInternetDeviceSelect,
//     onVoiceDeviceSelect,
//     disabled,
//     showTabs = true,
// }: DeviceSelectorProps) {
//     const isCombo = serviceType === SERVICE_TYPES.COMBO;

//     const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
//     const [expandedSpecs, setExpandedSpecs] = useState<Set<string>>(new Set());
//     const [activeTab, setActiveTab] = useState<string>('all');
//     const [hoveredDevice, setHoveredDevice] = useState<string | null>(null);

//     const { devices: allDevices, loading, error } = useAvailableDevices(
//         isCombo ? undefined : serviceType,
//         mediaType
//     );

//     const { broadbandDevices, voiceDevices, displayDevices, featuredDevices } = useMemo(() => {
//         const broadband = isCombo
//             ? allDevices.filter((d: AvailableDevice) => d.device_type === 'broadband' || d.device_type === 'universal')
//             : [];

//         const voice = isCombo
//             ? allDevices.filter((d: AvailableDevice) => d.device_type === 'voice' || d.device_type === 'universal')
//             : [];

//         const display = isCombo ? [] : allDevices;
//         const featured = allDevices.filter((d: AvailableDevice) => d.featured || d.price < 1000).slice(0, 2);

//         return { broadbandDevices: broadband, voiceDevices: voice, displayDevices: display, featuredDevices: featured };
//     }, [allDevices, isCombo]);

//     const filteredDevices = useMemo(() => {
//         if (!showTabs) return displayDevices;

//         switch (activeTab) {
//             case 'featured':
//                 return displayDevices.filter((d: AvailableDevice) => featuredDevices.includes(d));
//             case 'popular':
//                 return displayDevices.sort((a: AvailableDevice, b: AvailableDevice) => b.popularity - a.popularity);
//             case 'budget':
//                 return displayDevices.filter((d: AvailableDevice) => d.price < 1000);
//             case 'premium':
//                 return displayDevices.filter((d: AvailableDevice) => d.price >= 1000);
//             default:
//                 return displayDevices;
//         }
//     }, [displayDevices, activeTab, featuredDevices, showTabs]);

//     const handleImageError = useCallback((deviceId: string) => {
//         setImageErrors((prev) => new Set(prev).add(deviceId));
//     }, []);

//     const toggleSpecs = useCallback((deviceId: string, e: React.MouseEvent) => {
//         e.stopPropagation();
//         e.preventDefault();
//         setExpandedSpecs((prev) => {
//             const newSet = new Set(prev);
//             if (newSet.has(deviceId)) {
//                 newSet.delete(deviceId);
//             } else {
//                 newSet.add(deviceId);
//             }
//             return newSet;
//         });
//     }, []);

//     const formatPrice = (price: number) => {
//         return new Intl.NumberFormat('en-ET', {
//             style: 'currency',
//             currency: 'ETB',
//             minimumFractionDigits: 0,
//             maximumFractionDigits: 0,
//         }).format(price);
//     };

//     const getDeviceRating = (device: AvailableDevice) => {
//         return device.popularity ? Math.min(5, Math.max(4, device.popularity / 20)) : 4.2;
//     };

//     const renderSpecificationItem = (icon: React.ReactNode, label: string, value: string | string[] | Record<string, any>) => {
//         if (!value) return null;

//         let displayValue: string;
//         if (Array.isArray(value)) {
//             displayValue = value.join(', ');
//         } else if (typeof value === 'object') {
//             displayValue = Object.entries(value)
//                 .map(([k, v]) => `${k}: ${v}`)
//                 .join(', ');
//         } else {
//             displayValue = value;
//         }

//         return (
//             <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 group">
//                 <div className="shrink-0 mt-0.5 text-primary bg-primary/10 p-2 rounded-lg group-hover:scale-110 transition-transform duration-200">
//                     {icon}
//                 </div>
//                 <div className="flex-1 min-w-0">
//                     <p className="text-xs font-semibold text-gray-900 mb-1">{label}</p>
//                     <p className="text-sm text-gray-600 leading-relaxed">{displayValue}</p>
//                 </div>
//             </div>
//         );
//     };

//     const renderSpecificationCategory = (category: typeof SPEC_CATEGORIES[keyof typeof SPEC_CATEGORIES], specs: any) => {
//         const relevantSpecs = category.keys
//             .map(key => specs[key])
//             .filter(Boolean);

//         if (relevantSpecs.length === 0) return null;

//         const Icon = category.icon;

//         return (
//             <div className="space-y-3">
//                 <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", category.color)}>
//                     <Icon className="h-4 w-4" />
//                     <h4 className="text-sm font-semibold">{category.title}</h4>
//                 </div>
//                 <div className="space-y-2 pl-6 border-l-2 border-gray-200 ml-3">
//                     {category.keys.map((key) => {
//                         const spec = specs[key];
//                         if (!spec) return null;

//                         let icon, label;
//                         switch (key) {
//                             case 'speed':
//                                 icon = <Zap className="h-3.5 w-3.5" />;
//                                 label = 'Speed';
//                                 break;
//                             case 'wifi_features':
//                                 icon = <Wifi className="h-3.5 w-3.5" />;
//                                 label = 'Wi-Fi';
//                                 break;
//                             case 'ethernet':
//                                 icon = <Network className="h-3.5 w-3.5" />;
//                                 label = 'Ethernet';
//                                 break;
//                             case 'operating_range':
//                                 icon = <MapPin className="h-3.5 w-3.5" />;
//                                 label = 'Range';
//                                 break;
//                             case 'power':
//                                 icon = <Battery className="h-3.5 w-3.5" />;
//                                 label = 'Power';
//                                 break;
//                             default:
//                                 icon = <Info className="h-3.5 w-3.5" />;
//                                 label = key.replace('_', ' ');
//                         }

//                         return renderSpecificationItem(icon, label, spec);
//                     })}
//                 </div>
//             </div>
//         );
//     };

//     const renderDeviceCard = (device: AvailableDevice, isSelected: boolean, onSelect: () => void, namePrefix: string = 'device') => {
//         const hasImage = device.image_url && device.image_url.trim().length > 0;
//         const imageError = imageErrors.has(device.id);
//         const specs = device.specifications || {};
//         const specsExpanded = expandedSpecs.has(device.id);
//         const hasSpecs = Object.keys(specs).length > 0;
//         const rating = getDeviceRating(device);
//         const isHovered = hoveredDevice === device.id;

//         return (
//             <div
//                 className={cn(
//                     "transform transition-all duration-300 hover:-translate-y-1",
//                     isHovered && "scale-[1.02]"
//                 )}
//                 onMouseEnter={() => setHoveredDevice(device.id)}
//                 onMouseLeave={() => setHoveredDevice(null)}
//             >
//                 <label
//                     key={device.id}
//                     onClick={() => !disabled && onSelect()}
//                     className={cn(
//                         'group relative block cursor-pointer rounded-2xl border bg-gradient-to-br from-white to-gray-50/50 shadow-lg transition-all duration-500 overflow-hidden',
//                         disabled
//                             ? 'cursor-not-allowed border-gray-200 bg-gray-50/50 opacity-50'
//                             : isSelected
//                                 ? 'border-primary shadow-2xl ring-4 ring-primary/10 animate-pulse-glow'
//                                 : 'border-gray-200 hover:shadow-2xl hover:border-primary/30'
//                     )}
//                 >
//                     <input
//                         type="radio"
//                         name={namePrefix}
//                         value={device.id}
//                         checked={isSelected}
//                         onChange={() => { }}
//                         className="absolute inset-0 cursor-pointer opacity-0"
//                         disabled={disabled}
//                     />

//                     {/* Selection Indicator */}
//                     {isSelected && (
//                         <div className="absolute top-4 right-4 z-20 rounded-full bg-gradient-to-r from-primary to-primary/80 p-2 shadow-xl animate-bounce-in">
//                             <CheckCircle className="h-5 w-5 text-white" />
//                         </div>
//                     )}

//                     {/* Featured Badge */}
//                     {device.featured && (
//                         <div className="absolute top-4 left-4 z-20 animate-slide-in">
//                             <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
//                                 <Award className="h-3 w-3 mr-1" />
//                                 Featured
//                             </Badge>
//                         </div>
//                     )}

//                     {/* New Arrival Badge */}
//                     {device.isNew && (
//                         <div className="absolute top-4 left-4 z-20">
//                             <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg animate-pulse">
//                                 New
//                             </Badge>
//                         </div>
//                     )}

//                     {/* Device Image Section */}
//                     <div className={cn(
//                         'relative h-48 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/50 transition-all duration-500',
//                         isHovered && 'scale-105'
//                     )}>
//                         {hasImage && !imageError ? (
//                             <>
//                                 <img
//                                     src={device.image_url || ''}
//                                     alt={device.name}
//                                     className="h-full w-full object-contain p-6 transition-transform duration-700 group-hover:scale-110"
//                                     onError={() => handleImageError(device.id)}
//                                 />
//                                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white/20 pointer-events-none" />
//                             </>
//                         ) : (
//                             <div className="flex h-full items-center justify-center">
//                                 <div className={cn(
//                                     'p-6 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 transition-colors duration-300',
//                                     isSelected ? 'text-primary' : 'text-gray-400'
//                                 )}>
//                                     {device.device_type === 'broadband' ? (
//                                         <Wifi className="h-16 w-16" />
//                                     ) : device.device_type === 'voice' ? (
//                                         <Phone className="h-16 w-16" />
//                                     ) : (
//                                         <Package className="h-16 w-16" />
//                                     )}
//                                 </div>
//                             </div>
//                         )}
//                     </div>

//                     {/* Content Section */}
//                     <div className="p-6">
//                         {/* Header with Rating */}
//                         <div className="space-y-3 mb-4">
//                             <div className="flex items-start justify-between gap-2">
//                                 <div className="flex-1">
//                                     <h4 className={cn(
//                                         'text-xl font-bold leading-tight mb-2 line-clamp-1 transition-colors duration-300',
//                                         isSelected ? 'text-primary' : 'text-gray-900'
//                                     )}>
//                                         {device.name}
//                                     </h4>
//                                     <div className="flex items-center gap-3 flex-wrap">
//                                         <p className="text-sm text-gray-600">
//                                             {device.vendor} {device.model ? `• ${device.model}` : ''}
//                                         </p>
//                                         <Badge variant="outline" className="border-primary/20 text-primary">
//                                             {device.device_type === 'broadband' ? 'Internet' : 
//                                              device.device_type === 'voice' ? 'Voice' : 'Universal'}
//                                         </Badge>
//                                     </div>
//                                 </div>
//                                 <div className="flex items-center gap-1">
//                                     <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
//                                     <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Price Section */}
//                         <div className="flex items-baseline justify-between mb-4">
//                             <div className="space-y-1">
//                                 <div className="flex items-baseline gap-2">
//                                     <span className="text-2xl font-bold text-gray-900">{formatPrice(device.price)}</span>
//                                     {device.originalPrice && device.price < device.originalPrice && (
//                                         <span className="text-sm text-gray-500 line-through">
//                                             {formatPrice(device.originalPrice)}
//                                         </span>
//                                     )}
//                                 </div>
//                                 <div className="flex items-center gap-2">
//                                     <Badge variant="secondary" className="text-xs font-normal">
//                                         One-time
//                                     </Badge>
//                                     {device.popularity > 50 && (
//                                         <Badge variant="outline" className="text-xs font-normal border-green-200 text-green-700">
//                                             <TrendingUp className="h-3 w-3 mr-1" />
//                                             Popular
//                                         </Badge>
//                                     )}
//                                     {device.price < 500 && (
//                                         <Badge variant="outline" className="text-xs font-normal border-blue-200 text-blue-700">
//                                             <DollarSign className="h-3 w-3 mr-1" />
//                                             Best Value
//                                         </Badge>
//                                     )}
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Description */}
//                         {device.description && (
//                             <div className="space-y-2 mb-4">
//                                 <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Overview</p>
//                                 <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
//                                     {device.description}
//                                 </p>
//                             </div>
//                         )}

//                         {/* Quick Stats */}
//                         <div className="grid grid-cols-3 gap-2 mb-4">
//                             <div className="text-center p-2 bg-gray-50 rounded-lg">
//                                 <div className="text-xs font-semibold text-gray-900">{device.warranty || '12'}</div>
//                                 <div className="text-xs text-gray-600">Months Warranty</div>
//                             </div>
//                             <div className="text-center p-2 bg-gray-50 rounded-lg">
//                                 <div className="text-xs font-semibold text-gray-900">{device.stock || 'In Stock'}</div>
//                                 <div className="text-xs text-gray-600">Availability</div>
//                             </div>
//                             <div className="text-center p-2 bg-gray-50 rounded-lg">
//                                 <div className="text-xs font-semibold text-gray-900">Free</div>
//                                 <div className="text-xs text-gray-600">Delivery</div>
//                             </div>
//                         </div>

//                         {/* Specifications Toggle */}
//                         {hasSpecs && (
//                             <div className="space-y-3">
//                                 <Separator className="opacity-50" />
//                                 <button
//                                     type="button"
//                                     onClick={(e) => toggleSpecs(device.id, e)}
//                                     className={cn(
//                                         "flex items-center justify-between w-full py-3 px-4 rounded-xl transition-all duration-300",
//                                         specsExpanded 
//                                             ? "bg-gradient-to-r from-primary/5 to-primary/10 text-primary border border-primary/20" 
//                                             : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
//                                     )}
//                                 >
//                                     <div className="flex items-center gap-3">
//                                         <div className={cn(
//                                             "p-2 rounded-lg transition-all duration-300",
//                                             specsExpanded ? "bg-primary/20" : "bg-gray-100"
//                                         )}>
//                                             <Maximize2 className="h-4 w-4" />
//                                         </div>
//                                         <div className="text-left">
//                                             <span className="text-sm font-semibold">Technical Specifications</span>
//                                             <p className="text-xs text-gray-500 mt-0.5">Click to expand details</p>
//                                         </div>
//                                     </div>
//                                     <ChevronDown className={cn(
//                                         "h-5 w-5 transition-all duration-300",
//                                         specsExpanded && "rotate-180 text-primary"
//                                     )} />
//                                 </button>

//                                 {/* Expandable Specifications */}
//                                 <div className={cn(
//                                     "overflow-hidden transition-all duration-500 ease-in-out",
//                                     specsExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
//                                 )}>
//                                     <div className="pt-4 border-t space-y-6 animate-fade-in">
//                                         {Object.values(SPEC_CATEGORIES).map((category) => 
//                                             renderSpecificationCategory(category, specs)
//                                         )}
//                                     </div>

//                                     {/* View All Details Button */}
//                                     <div className="mt-4 pt-4 border-t">
//                                         <Button
//                                             variant="outline"
//                                             size="sm"
//                                             className="w-full text-primary hover:text-primary/80"
//                                             onClick={(e) => {
//                                                 e.stopPropagation();
//                                                 // Show detailed modal or page
//                                             }}
//                                         >
//                                             <ExternalLink className="h-4 w-4 mr-2" />
//                                             View Full Specifications
//                                         </Button>
//                                     </div>
//                                 </div>
//                             </div>
//                         )}

//                         {/* Select Button */}
//                         <div className="mt-6">
//                             <div className={cn(
//                                 "w-full py-3 px-4 rounded-lg text-center font-semibold transition-all duration-300",
//                                 isSelected
//                                     ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg"
//                                     : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
//                             )}>
//                                 {isSelected ? '✓ Selected' : 'Select Device'}
//                             </div>
//                         </div>
//                     </div>
//                 </label>
//             </div>
//         );
//     };

//     if (loading) {
//         return (
//             <div className="space-y-6 animate-fade-in">
//                 <div className="flex items-center gap-4 mb-6">
//                     <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
//                     <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
//                 </div>
//                 <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
//                     {[1, 2, 3, 4, 5, 6].map((i) => (
//                         <div key={i} className="rounded-2xl border bg-white p-6 shadow-sm">
//                             <div className="h-48 w-full bg-gray-200 rounded-xl mb-4 animate-pulse"></div>
//                             <div className="h-6 w-3/4 bg-gray-200 rounded mb-2 animate-pulse"></div>
//                             <div className="h-4 w-1/2 bg-gray-200 rounded mb-4 animate-pulse"></div>
//                             <div className="h-8 w-1/3 bg-gray-200 rounded mb-4 animate-pulse"></div>
//                             <div className="space-y-2">
//                                 <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
//                                 <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50/50 to-white p-8 text-center animate-fade-in">
//                 <div className="mx-auto max-w-md space-y-4">
//                     <div className="rounded-full bg-red-100 p-4 w-16 h-16 mx-auto flex items-center justify-center">
//                         <Package className="h-8 w-8 text-red-500" />
//                     </div>
//                     <h3 className="text-lg font-semibold text-gray-900">Unable to Load Devices</h3>
//                     <p className="text-sm text-gray-600">We're having trouble loading the device catalog. Please try again.</p>
//                     <Button 
//                         variant="outline" 
//                         onClick={() => window.location.reload()}
//                         className="mt-2"
//                     >
//                         Retry
//                     </Button>
//                 </div>
//             </div>
//         );
//     }

//     // Combo service layout
//     if (isCombo) {
//         const hasInternetDevices = broadbandDevices.length > 0;
//         const hasVoiceDevices = voiceDevices.length > 0;

//         if (!hasInternetDevices && !hasVoiceDevices) {
//             return (
//                 <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-8 text-center animate-fade-in">
//                     <div className="rounded-full bg-gray-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
//                         <Package className="h-8 w-8 text-gray-400" />
//                     </div>
//                     <h3 className="text-lg font-semibold text-gray-900 mb-2">No Devices Available</h3>
//                     <p className="text-sm text-gray-600">Check back soon for new device options.</p>
//                 </div>
//             );
//         }

//         return (
//             <div className="space-y-8 animate-fade-in">
//                 {/* Internet/Data Devices Section */}
//                 {hasInternetDevices && (
//                     <div className="space-y-6">
//                         <div className="space-y-2">
//                             <div className="flex items-center gap-3">
//                                 <div className="rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 p-3 shadow-md">
//                                     <Wifi className="h-6 w-6 text-blue-600" />
//                                 </div>
//                                 <div>
//                                     <Label className="text-lg font-bold text-gray-900">
//                                         Internet Device
//                                     </Label>
//                                     <p className="text-sm text-gray-600">Select your preferred internet device</p>
//                                 </div>
//                                 <Badge className="ml-auto bg-blue-100 text-blue-700">
//                                     {broadbandDevices.length} options
//                                 </Badge>
//                             </div>
//                         </div>
//                         <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
//                             {broadbandDevices.map((device: AvailableDevice, index: number) => {
//                                 const isSelected = selectedDeviceInternetId === device.id;
//                                 return (
//                                     <div 
//                                         key={device.id}
//                                         className="animate-slide-in"
//                                         style={{ animationDelay: `${index * 100}ms` }}
//                                     >
//                                         {renderDeviceCard(
//                                             device,
//                                             isSelected,
//                                             () => onInternetDeviceSelect?.(device),
//                                             'device-internet'
//                                         )}
//                                     </div>
//                                 );
//                             })}
//                         </div>
//                     </div>
//                 )}

//                 {/* Voice/Phone Devices Section */}
//                 {hasVoiceDevices && (
//                     <div className="space-y-6">
//                         <div className="space-y-2">
//                             <div className="flex items-center gap-3">
//                                 <div className="rounded-lg bg-gradient-to-br from-green-100 to-emerald-200 p-3 shadow-md">
//                                     <Phone className="h-6 w-6 text-green-600" />
//                                 </div>
//                                 <div>
//                                     <Label className="text-lg font-bold text-gray-900">
//                                         Voice Device
//                                     </Label>
//                                     <p className="text-sm text-gray-600">Select your preferred voice device</p>
//                                 </div>
//                                 <Badge className="ml-auto bg-green-100 text-green-700">
//                                     {voiceDevices.length} options
//                                 </Badge>
//                             </div>
//                         </div>
//                         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//                             {voiceDevices.map((device: AvailableDevice, index: number) => {
//                                 const isSelected = selectedDeviceVoiceId === device.id;
//                                 return (
//                                     <div 
//                                         key={device.id}
//                                         className="animate-slide-in"
//                                         style={{ animationDelay: `${index * 150}ms` }}
//                                     >
//                                         {renderDeviceCard(
//                                             device,
//                                             isSelected,
//                                             () => onVoiceDeviceSelect?.(device),
//                                             'device-voice'
//                                         )}
//                                     </div>
//                                 );
//                             })}
//                         </div>
//                     </div>
//                 )}
//             </div>
//         );
//     }

//     // Single service layout with tabs
//     if (displayDevices.length === 0) {
//         return (
//             <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-8 text-center animate-fade-in">
//                 <div className="rounded-full bg-gray-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
//                     <Package className="h-8 w-8 text-gray-400" />
//                 </div>
//                 <h3 className="text-lg font-semibold text-gray-900 mb-2">No Devices Available</h3>
//                 <p className="text-sm text-gray-600">Check back soon for new device options.</p>
//             </div>
//         );
//     }

//     return (
//         <div className="space-y-6 animate-fade-in">
//             {/* Header */}
//             <div className="space-y-4">
//                 <div className="flex items-center justify-between">
//                     <div>
//                         <h2 className="text-2xl font-bold text-gray-900">
//                             Select Your Device
//                         </h2>
//                         <p className="text-sm text-gray-600 mt-1">
//                             Choose the perfect device for your needs
//                         </p>
//                     </div>
//                     <div className="flex items-center gap-2">
//                         <Badge variant="outline" className="hidden sm:inline-flex">
//                             {filteredDevices.length} devices
//                         </Badge>
//                         <Button
//                             variant="ghost"
//                             size="sm"
//                             className="text-primary hover:text-primary/80"
//                         >
//                             <Crown className="h-4 w-4 mr-2" />
//                             Compare
//                         </Button>
//                     </div>
//                 </div>

//                 {/* Search and Filter */}
//                 <div className="flex flex-col sm:flex-row gap-4">
//                     <div className="flex-1">
//                         <div className="relative">
//                             <input
//                                 type="text"
//                                 placeholder="Search devices..."
//                                 className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
//                             />
//                             <div className="absolute left-3 top-2.5">
//                                 <Package className="h-4 w-4 text-gray-400" />
//                             </div>
//                         </div>
//                     </div>
//                     <div className="flex gap-2">
//                         <Button variant="outline" size="sm">
//                             Filter
//                         </Button>
//                         <Button variant="outline" size="sm">
//                             Sort by: Popular
//                         </Button>
//                     </div>
//                 </div>
//             </div>

//             {/* Tabs for filtering */}
//             {showTabs && (
//                 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//                     <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full max-w-2xl bg-gray-100 p-1 rounded-xl">
//                         <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
//                             All Devices
//                         </TabsTrigger>
//                         <TabsTrigger value="featured" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
//                             <Sparkles className="h-3.5 w-3.5 mr-2" />
//                             Featured
//                         </TabsTrigger>
//                         <TabsTrigger value="popular" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
//                             <TrendingUp className="h-3.5 w-3.5 mr-2" />
//                             Popular
//                         </TabsTrigger>
//                         <TabsTrigger value="budget" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
//                             <DollarSign className="h-3.5 w-3.5 mr-2" />
//                             Budget
//                         </TabsTrigger>
//                         <TabsTrigger value="premium" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
//                             <Crown className="h-3.5 w-3.5 mr-2" />
//                             Premium
//                         </TabsTrigger>
//                     </TabsList>
//                 </Tabs>
//             )}

//             {/* Featured Banner */}
//             {activeTab === 'all' && featuredDevices.length > 0 && (
//                 <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4 animate-pulse-glow">
//                     <div className="flex items-center gap-3">
//                         <div className="rounded-full bg-primary/20 p-2">
//                             <Award className="h-5 w-5 text-primary" />
//                         </div>
//                         <div className="flex-1">
//                             <p className="text-sm font-medium text-gray-900">
//                                 <span className="text-primary font-bold">Top Picks:</span> Our recommended devices based on performance and value
//                             </p>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* Device Grid */}
//             <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
//                 {filteredDevices.map((device: AvailableDevice, index: number) => {
//                     const isSelected = selectedDeviceId === device.id;
//                     return (
//                         <div
//                             key={device.id}
//                             className="animate-slide-in"
//                             style={{ animationDelay: `${index * 100}ms` }}
//                         >
//                             {renderDeviceCard(device, isSelected, () => onDeviceSelect?.(device), 'device')}
//                         </div>
//                     );
//                 })}
//             </div>

//             {/* Empty State for Filter */}
//             {filteredDevices.length === 0 && (
//                 <div className="text-center py-12">
//                     <div className="rounded-full bg-gray-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
//                         <Package className="h-8 w-8 text-gray-400" />
//                     </div>
//                     <h3 className="text-lg font-semibold text-gray-900 mb-2">No devices found</h3>
//                     <p className="text-sm text-gray-600 mb-4">Try changing your filters or search term</p>
//                     <Button
//                         variant="outline"
//                         onClick={() => setActiveTab('all')}
//                     >
//                         View All Devices
//                     </Button>
//                 </div>
//             )}
//         </div>
//     );
// }


import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAvailableDevices, AvailableDevice } from '@/hooks/use-available-devices';
import {
    CheckCircle,
    Loader2,
    Package,
    Wifi,
    Phone,
    Zap,
    Network,
    Radio,
    Thermometer,
    MapPin,
    Building2,
    Globe,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Award,
    Shield,
    Clock,
    ExternalLink,
    Maximize2,
    Info,
    Battery,
    RadioTower,
    Check
} from 'lucide-react';
import { useState, useMemo, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

interface DeviceSelectorProps {
    serviceType?: string;
    mediaType?: string;
    selectedDeviceId?: string;
    selectedDeviceInternetId?: string;
    selectedDeviceVoiceId?: string;
    onDeviceSelect?: (device: AvailableDevice | null) => void; // null = unselect/toggle off
    onInternetDeviceSelect?: (device: AvailableDevice | null) => void;
    onVoiceDeviceSelect?: (device: AvailableDevice | null) => void;
    disabled?: boolean;
}

const SERVICE_TYPES = {
    BROADBAND: '1457567289',
    VOICE: '1207609454',
    COMBO: '102647257',
};

export function DeviceSelector({
    serviceType,
    mediaType,
    selectedDeviceId,
    selectedDeviceInternetId,
    selectedDeviceVoiceId,
    onDeviceSelect,
    onInternetDeviceSelect,
    onVoiceDeviceSelect,
    disabled,
}: DeviceSelectorProps) {
    const isCombo = serviceType === SERVICE_TYPES.COMBO;

    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
    const [expandedSpecs, setExpandedSpecs] = useState<Set<string>>(new Set());

    const { devices: allDevices, loading, error } = useAvailableDevices(
        isCombo ? undefined : serviceType,
        mediaType
    );

    const { broadbandDevices, voiceDevices, displayDevices } = useMemo(() => {
        const broadband = isCombo
            ? allDevices.filter((d: AvailableDevice) => d.device_type === 'broadband' || d.device_type === 'universal')
            : [];

        const voice = isCombo
            ? allDevices.filter((d: AvailableDevice) => d.device_type === 'voice' || d.device_type === 'universal')
            : [];

        const display = isCombo ? [] : allDevices;

        return { broadbandDevices: broadband, voiceDevices: voice, displayDevices: display };
    }, [allDevices, isCombo]);

    const handleImageError = useCallback((deviceId: string) => {
        setImageErrors((prev) => new Set(prev).add(deviceId));
    }, []);

    const toggleSpecs = useCallback((deviceId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Stop event from bubbling to parent
        e.preventDefault(); // Prevent any default behavior
        setExpandedSpecs((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(deviceId)) {
                newSet.delete(deviceId);
            } else {
                newSet.add(deviceId);
            }
            return newSet;
        });
    }, []);

    const handleDeviceSelect = useCallback((device: AvailableDevice, selectFn?: (device: AvailableDevice) => void) => {
        if (disabled) return;
        selectFn?.(device);
    }, [disabled]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const renderSpecificationItem = (icon: React.ReactNode, label: string, value: string | string[] | Record<string, any>) => {
        if (!value) return null;

        let displayValue: string;
        if (Array.isArray(value)) {
            displayValue = value.join(', ');
        } else if (typeof value === 'object') {
            displayValue = Object.entries(value)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ');
        } else {
            displayValue = value;
        }

        return (
            <div className="flex items-start gap-2 py-1.5">
                <div className="shrink-0 mt-0.5 text-primary">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 mb-0.5">{label}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{displayValue}</p>
                </div>
            </div>
        );
    };

    const renderSpecificationCategory = (specs: any) => {
        const categories = [
            {
                title: 'Performance',
                icon: <Zap className="h-3.5 w-3.5" />,
                specs: [
                    { key: 'speed', label: 'Speed', icon: <Zap className="h-3.5 w-3.5" /> },
                    { key: 'wifi_features', label: 'Wi-Fi', icon: <Wifi className="h-3.5 w-3.5" /> },
                    { key: 'voice_quality', label: 'Voice Quality', icon: <Phone className="h-3.5 w-3.5" /> },
                ]
            },
            {
                title: 'Connectivity',
                icon: <Network className="h-3.5 w-3.5" />,
                specs: [
                    { key: 'ethernet', label: 'Ethernet', icon: <Network className="h-3.5 w-3.5" /> },
                    { key: 'connection', label: 'Connection', icon: <RadioTower className="h-3.5 w-3.5" /> },
                    { key: 'lan_ports', label: 'LAN Ports', icon: <Network className="h-3.5 w-3.5" /> },
                ]
            },
            {
                title: 'Features',
                icon: <Sparkles className="h-3.5 w-3.5" />,
                specs: [
                    { key: 'functionality', label: 'Functionality', icon: <Maximize2 className="h-3.5 w-3.5" /> },
                    { key: 'calling_options', label: 'Calling Options', icon: <Phone className="h-3.5 w-3.5" /> },
                    { key: 'display', label: 'Display', icon: <Package className="h-3.5 w-3.5" /> },
                ]
            }
        ];

        return (
            <div className="space-y-3">
                {categories.map((category) => {
                    const hasSpecs = category.specs.some(spec => specs[spec.key]);
                    if (!hasSpecs) return null;

                    return (
                        <div key={category.title} className="space-y-2">
                            <div className="flex items-center gap-2">
                                {category.icon}
                                <h4 className="text-xs font-semibold text-gray-900">{category.title}</h4>
                            </div>
                            <div className="space-y-1 pl-4">
                                {category.specs.map((spec) => {
                                    const value = specs[spec.key];
                                    if (!value) return null;
                                    return renderSpecificationItem(spec.icon, spec.label, value);
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderDeviceCard = (device: AvailableDevice, isSelected: boolean, onSelect: () => void, namePrefix: string = 'device') => {
        const hasImage = device.image_url && device.image_url.trim().length > 0;
        const imageError = imageErrors.has(device.id);
        const specs = device.specifications || {};
        const specsExpanded = expandedSpecs.has(device.id);
        const hasSpecs = Object.keys(specs).length > 0;

        // Handle card click for selection
        const handleCardClick = () => {
            if (disabled) return;
            onSelect();
        };

        // Handle click on non-interactive parts of the card
        const handleMainContentClick = (e: React.MouseEvent) => {
            // Only trigger device selection if clicking on non-button areas
            const target = e.target as HTMLElement;
            const isButton = target.tagName === 'BUTTON' ||
                target.closest('button') ||
                target.closest('[data-specs-area]');

            if (!isButton) {
                handleDeviceSelect(device, onSelect ? () => onSelect() : undefined);
            }
        };

        return (
            <div className="group">
                <div
                    onClick={handleMainContentClick}
                    className={cn(
                        'relative cursor-pointer rounded-lg border bg-white transition-all duration-200',
                        disabled
                            ? 'cursor-not-allowed border-gray-200 bg-gray-50/50 opacity-50'
                            : isSelected
                                ? 'border-primary shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-xs'
                    )}
                >
                    {/* Selection Indicator */}
                    {isSelected && (
                        <div className="absolute top-3 right-3 z-10 rounded-full bg-primary p-1.5">
                            <Check className="h-4 w-4 text-white" />
                        </div>
                    )}

                    {/* Featured Badge */}
                    {device.featured && (
                        <div className="absolute top-3 left-3 z-10">
                            <Badge className="bg-primary text-white border-0 text-xs px-2 py-0.5">
                                <Award className="h-3 w-3 mr-1" />
                                Featured
                            </Badge>
                        </div>
                    )}

                    {/* Device Image Section */}
                    <div className="relative h-40 overflow-hidden bg-gray-50">
                        {hasImage && !imageError ? (
                            <>
                                <img
                                    src={device.image_url || ''}
                                    alt={device.name}
                                    className="h-full w-full object-contain p-4"
                                    onError={() => handleImageError(device.id)}
                                />
                            </>
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <div className={cn(
                                    'p-4 transition-colors',
                                    isSelected ? 'text-primary' : 'text-gray-400'
                                )}>
                                    {device.device_type === 'broadband' ? (
                                        <Wifi className="h-12 w-12" />
                                    ) : device.device_type === 'voice' ? (
                                        <Phone className="h-12 w-12" />
                                    ) : (
                                        <Package className="h-12 w-12" />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="p-4">
                        {/* Header */}
                        <div className="space-y-1 mb-2">
                            <h4 className={cn(
                                'text-base font-semibold leading-tight line-clamp-1',
                                isSelected ? 'text-primary' : 'text-gray-900'
                            )}>
                                {device.name}
                            </h4>
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-gray-600">
                                    {device.vendor} {device.model ? `• ${device.model}` : ''}
                                </p>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="mb-3">
                            <span className="text-lg font-bold text-gray-900">{formatPrice(device.price)}</span>
                        </div>

                        {/* Description */}
                        {device.description && (
                            <div className="space-y-1 mb-3">
                                <p className="text-xs font-medium text-gray-700">Overview</p>
                                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                                    {device.description}
                                </p>
                            </div>
                        )}

                        {/* Specifications Toggle - SEPARATE FROM SELECTION */}
                        {hasSpecs && (
                            <div className="border-t pt-3" data-specs-area="true">
                                <button
                                    type="button"
                                    onClick={(e) => toggleSpecs(device.id, e)}
                                    className={cn(
                                        "flex items-center justify-between w-full transition-colors duration-200",
                                        specsExpanded
                                            ? "text-primary"
                                            : "text-gray-600 hover:text-gray-900"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <Maximize2 className="h-3.5 w-3.5" />
                                        <span className="text-xs font-medium">Technical Specifications</span>
                                    </div>
                                    <ChevronDown className={cn(
                                        "h-3.5 w-3.5 transition-transform duration-300",
                                        specsExpanded && "rotate-180"
                                    )} />
                                </button>

                                {/* Expandable Specifications */}
                                <div
                                    className={cn(
                                        "overflow-hidden transition-all duration-300 ease-in-out",
                                        specsExpanded ? "max-h-[500px] opacity-100 mt-3" : "max-h-0 opacity-0"
                                    )}
                                >
                                    <div className="pt-2 space-y-3">
                                        {renderSpecificationCategory(specs)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {[1, 2].map((i) => (
                        <div key={i} className="rounded-lg border bg-white p-4">
                            <div className="h-40 w-full bg-gray-200 rounded mb-3 animate-pulse"></div>
                            <div className="h-5 w-3/4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                            <div className="h-4 w-1/2 bg-gray-200 rounded mb-3 animate-pulse"></div>
                            <div className="h-6 w-1/3 bg-gray-200 rounded mb-3 animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">Error loading devices: {error}</p>
            </div>
        );
    }

    // Combo service layout
    if (isCombo) {
        const hasInternetDevices = broadbandDevices.length > 0;
        const hasVoiceDevices = voiceDevices.length > 0;

        if (!hasInternetDevices && !hasVoiceDevices) {
            return (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">No devices available at the moment.</p>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {/* Internet/Data Devices Section */}
                {hasInternetDevices && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Wifi className="h-5 w-5 text-primary" />
                            <Label className="text-base font-semibold">
                                Internet/Data Device <span className="text-muted-foreground font-normal">(optional)</span>
                            </Label>
                        </div>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {broadbandDevices.map((device: AvailableDevice) => {
                                const isSelected = selectedDeviceInternetId === device.id;
                                return (
                                    <div key={device.id}>
                                        {renderDeviceCard(
                                            device,
                                            isSelected,
                                            () => onInternetDeviceSelect?.(isSelected ? null : device),
                                            'device-internet'
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Voice/Phone Devices Section */}
                {hasVoiceDevices && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Phone className="h-5 w-5 text-primary" />
                            <Label className="text-base font-semibold">
                                Voice/Phone Device <span className="text-muted-foreground font-normal">(optional)</span>
                            </Label>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {voiceDevices.map((device: AvailableDevice) => {
                                const isSelected = selectedDeviceVoiceId === device.id;
                                return (
                                    <div key={device.id}>
                                        {renderDeviceCard(
                                            device,
                                            isSelected,
                                            () => onVoiceDeviceSelect?.(isSelected ? null : device),
                                            'device-voice'
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Single service layout
    if (displayDevices.length === 0) {
        return (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">No devices available at the moment.</p>
            </div>
        );
    }

    // Single service (data/broadband or voice): device is mandatory when "With device" — no unselect
    return (
        <div className="space-y-4">
            <Label className="text-sm font-medium">
                Select Device <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {displayDevices.map((device: AvailableDevice) => {
                    const isSelected = selectedDeviceId === device.id;
                    return (
                        <div key={device.id}>
                            {renderDeviceCard(device, isSelected, () => onDeviceSelect?.(device), 'device')}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}