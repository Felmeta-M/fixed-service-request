<?php

namespace App\Exceptions;

use Throwable;

/**
 * Exception for authorization failures.
 *
 * Use when:
 * - User doesn't have permission for an action
 * - Resource access is denied
 * - Role requirements not met
 */
class AuthorizationException extends BaseException
{
    public function __construct(
        string $message = 'Access denied',
        string $errorCode = 'FORBIDDEN',
        array $context = [],
        ?string $userMessage = null,
        ?Throwable $previous = null
    ) {
        parent::__construct(
            message: $message,
            errorCode: $errorCode,
            context: $context,
            httpStatusCode: 403,
            userMessage: $userMessage ?? 'You do not have permission to perform this action.',
            previous: $previous
        );
    }

    /**
     * Create exception for resource ownership
     */
    public static function notOwner(string $resource): self
    {
        return new self(
            message: "User is not the owner of {$resource}",
            errorCode: 'NOT_OWNER',
            context: ['resource' => $resource],
            userMessage: "You can only access your own {$resource}."
        );
    }

    /**
     * Create exception for missing permission
     */
    public static function missingPermission(string $permission): self
    {
        return new self(
            message: "Missing required permission: {$permission}",
            errorCode: 'MISSING_PERMISSION',
            context: ['required_permission' => $permission],
            userMessage: 'You do not have the required permission for this action.'
        );
    }

    /**
     * Create exception for account restriction
     */
    public static function accountRestricted(string $reason = ''): self
    {
        return new self(
            message: "Account is restricted" . ($reason ? ": {$reason}" : ""),
            errorCode: 'ACCOUNT_RESTRICTED',
            context: ['reason' => $reason],
            userMessage: 'Your account has been restricted. Please contact support.'
        );
    }
}
