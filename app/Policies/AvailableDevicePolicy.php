<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\AvailableDevice;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Foundation\Auth\User as AuthUser;

class AvailableDevicePolicy
{
    use HandlesAuthorization;

    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:AvailableDevice');
    }

    public function view(AuthUser $authUser, AvailableDevice $availableDevice): bool
    {
        return $authUser->can('View:AvailableDevice');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:AvailableDevice');
    }

    public function update(AuthUser $authUser, AvailableDevice $availableDevice): bool
    {
        return $authUser->can('Update:AvailableDevice');
    }

    public function delete(AuthUser $authUser, AvailableDevice $availableDevice): bool
    {
        return $authUser->can('Delete:AvailableDevice');
    }

    public function restore(AuthUser $authUser, AvailableDevice $availableDevice): bool
    {
        return $authUser->can('Restore:AvailableDevice');
    }

    public function forceDelete(AuthUser $authUser, AvailableDevice $availableDevice): bool
    {
        return $authUser->can('ForceDelete:AvailableDevice');
    }

    public function forceDeleteAny(AuthUser $authUser): bool
    {
        return $authUser->can('ForceDeleteAny:AvailableDevice');
    }

    public function restoreAny(AuthUser $authUser): bool
    {
        return $authUser->can('RestoreAny:AvailableDevice');
    }

    public function replicate(AuthUser $authUser, AvailableDevice $availableDevice): bool
    {
        return $authUser->can('Replicate:AvailableDevice');
    }

    public function reorder(AuthUser $authUser): bool
    {
        return $authUser->can('Reorder:AvailableDevice');
    }
}
