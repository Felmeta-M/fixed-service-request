<?php

declare(strict_types=1);

namespace App\Policies;

use Illuminate\Foundation\Auth\User as AuthUser;
use App\Models\SurveyOrder;
use Illuminate\Auth\Access\HandlesAuthorization;

class SurveyOrderPolicy
{
    use HandlesAuthorization;
    
    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:SurveyOrder');
    }

    public function view(AuthUser $authUser, SurveyOrder $surveyOrder): bool
    {
        return $authUser->can('View:SurveyOrder');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:SurveyOrder');
    }

    public function update(AuthUser $authUser, SurveyOrder $surveyOrder): bool
    {
        return $authUser->can('Update:SurveyOrder');
    }

    public function delete(AuthUser $authUser, SurveyOrder $surveyOrder): bool
    {
        return $authUser->can('Delete:SurveyOrder');
    }

    public function restore(AuthUser $authUser, SurveyOrder $surveyOrder): bool
    {
        return $authUser->can('Restore:SurveyOrder');
    }

    public function forceDelete(AuthUser $authUser, SurveyOrder $surveyOrder): bool
    {
        return $authUser->can('ForceDelete:SurveyOrder');
    }

    public function forceDeleteAny(AuthUser $authUser): bool
    {
        return $authUser->can('ForceDeleteAny:SurveyOrder');
    }

    public function restoreAny(AuthUser $authUser): bool
    {
        return $authUser->can('RestoreAny:SurveyOrder');
    }

    public function replicate(AuthUser $authUser, SurveyOrder $surveyOrder): bool
    {
        return $authUser->can('Replicate:SurveyOrder');
    }

    public function reorder(AuthUser $authUser): bool
    {
        return $authUser->can('Reorder:SurveyOrder');
    }

}