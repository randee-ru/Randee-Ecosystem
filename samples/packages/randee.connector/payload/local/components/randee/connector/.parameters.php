<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

$arComponentParameters = [
    'PARAMETERS' => [
        'API_KEY' => [
            'PARENT' => 'BASE',
            'NAME' => 'API key for Randee Builder',
            'TYPE' => 'STRING',
            'DEFAULT' => '',
        ],
        'ALLOWED_IBLOCK_IDS' => [
            'PARENT' => 'BASE',
            'NAME' => 'Allowed iblock IDs (comma separated)',
            'TYPE' => 'STRING',
            'DEFAULT' => '',
        ],
        'MAX_PAGE_SIZE' => [
            'PARENT' => 'BASE',
            'NAME' => 'Maximum page size for list actions',
            'TYPE' => 'STRING',
            'DEFAULT' => '100',
        ],
        'DEFAULT_PAGE_SIZE' => [
            'PARENT' => 'BASE',
            'NAME' => 'Default page size for list actions',
            'TYPE' => 'STRING',
            'DEFAULT' => '20',
        ],
    ],
];
