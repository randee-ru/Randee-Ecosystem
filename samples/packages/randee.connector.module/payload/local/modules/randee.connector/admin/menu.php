<?php

if (!$USER->IsAdmin()) {
    return false;
}

return [
    'parent_menu' => 'global_menu_settings',
    'section' => 'randee_connector',
    'sort' => 9999,
    'text' => 'Randee Connector',
    'title' => 'Randee Connector settings for Builder API',
    'icon' => 'sys_menu_icon',
    'page_icon' => 'sys_page_icon',
    'items_id' => 'menu_randee_connector',
    'items' => [
        [
            'text' => 'Настройки коннектора',
            'title' => 'API key, endpoint and iblock access for Builder',
            'url' => 'settings.php?lang=ru&mid=randee.connector',
            'more_url' => ['settings.php?lang=ru&mid=randee.connector'],
        ],
    ],
];
