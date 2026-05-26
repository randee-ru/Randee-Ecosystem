<?php

define('NO_KEEP_STATISTIC', true);
define('NOT_CHECK_PERMISSIONS', true);

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php';

if (!\Bitrix\Main\Loader::includeModule('randee.connector')) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'error' => [
            'code' => 'MODULE_NOT_INSTALLED',
            'message' => 'Module randee.connector is not installed',
        ],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    die();
}

$request = \Bitrix\Main\Context::getCurrent()->getRequest();
RandeeConnectorService::applyCors($request);
if (strtoupper((string)$request->getRequestMethod()) === 'OPTIONS') {
    http_response_code(200);
    die();
}
$result = RandeeConnectorService::handleRequest($request);
RandeeConnectorService::sendJson((int)$result['status'], $result['payload']);
