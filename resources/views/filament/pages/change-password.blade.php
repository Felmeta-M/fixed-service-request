<x-filament::page>
    {{ $this->form }}
    <x-filament::button wire:click="submit" class="mt-6">
        {{ __('auth.update_password') }}
    </x-filament::button>
</x-filament::page>
