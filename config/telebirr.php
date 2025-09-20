<?php


return [
    'private_key_path' => storage_path('keys/private.pem'),

    // If you need public key verification later
    'public_key_path'  => storage_path('keys/public.pem'),

    'exclude_fields' => [
        'sign',
        'sign_type',
        'header',
        'refund_info',
        'openType',
        'raw_request',
    ],
];
