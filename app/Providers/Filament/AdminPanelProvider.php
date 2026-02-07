<?php

namespace App\Providers\Filament;

use Filament\Navigation\NavigationGroup;
use Filament\Panel;
use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use App\Filament\Pages\Auth\Login as AuthLogin;
use App\Filament\Pages\ChangePassword;
use App\Filament\Pages\Dashboard;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use App\Filament\Widgets\PaymentStatsWidget;
use App\Filament\Widgets\ServiceTypeStatsWidget;
use App\Filament\Widgets\SubscriptionStatsWidget;
use App\Filament\Widgets\SurveyModeStatsWidget;
use App\Filament\Widgets\SurveyOrderStatsWidget;
use Filament\Widgets\AccountWidget;
use Filament\Widgets\FilamentInfoWidget;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->path('ffd')
            ->login(AuthLogin::class)
            ->colors([
                'primary' => Color::Lime,
                'secondary' => Color::Emerald,
                'accent' => Color::Sky,
                'destructive' => Color::Red,
                'success' => Color::Green,
                'warning' => Color::Yellow,
                'info' => Color::Blue,
                'gray' => Color::Gray,
            ])
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\Filament\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\Filament\Pages')
            ->pages([
                Dashboard::class,
                ChangePassword::class,
            ])
            ->userMenuItems([
                \Filament\Navigation\MenuItem::make()
                    ->label(__('auth.change_password'))
                    ->url(fn (): string => ChangePassword::getUrl())
                    ->icon('heroicon-o-key'),
            ])
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\Filament\Widgets')
            ->widgets([
                SurveyOrderStatsWidget::class,
                SubscriptionStatsWidget::class,
                PaymentStatsWidget::class,
                ServiceTypeStatsWidget::class,
                SurveyModeStatsWidget::class,
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ])
            ->plugins([
                \BezhanSalleh\FilamentShield\FilamentShieldPlugin::make(),
            ])
            ->navigationGroups([
                NavigationGroup::make()
                    ->label('Service Management'),
                NavigationGroup::make()
                    ->label(label: 'Trouble Ticket Management'),
                NavigationGroup::make()
                    ->label('User Management'),
                NavigationGroup::make()
                    ->label(fn(): string => __('navigation.settings'))
                    ->collapsed(),
            ]);
    }
}
