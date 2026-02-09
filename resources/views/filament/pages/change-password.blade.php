<x-filament::page>
    <form wire:submit="submit">
        <div class="space-y-6">
            {{ $this->form }}
        </div>

        <div class="fi-form-actions mt-10 pt-6 border-t border-gray-200 dark:border-white/10">
            <div class="fi-ac gap-3 flex flex-wrap items-center justify-start">
                <x-filament::button type="submit">
                    {{ __('auth.update_password') }}
                </x-filament::button>
            </div>
        </div>
    </form>
</x-filament::page>
