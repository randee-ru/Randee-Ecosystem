<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    $documentRoot = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? ''), '/');
    $prologBefore = $documentRoot . '/bitrix/modules/main/include/prolog_before.php';
    if ($documentRoot === '' || !is_file($prologBefore)) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok' => false,
            'error' => [
                'code' => 'BITRIX_BOOTSTRAP_FAILED',
                'message' => 'Could not bootstrap Bitrix environment',
            ],
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        die();
    }
    require_once $prologBefore;
}

/** @var array<string, mixed> $arParams */

$localConfig = [];
$localConfigPath = __DIR__ . '/config.php';
if (is_file($localConfigPath)) {
    $loadedConfig = require $localConfigPath;
    if (is_array($loadedConfig)) {
        $localConfig = $loadedConfig;
    }
}

if (!\Bitrix\Main\Loader::includeModule('iblock')) {
    $arResult = [
        'ok' => false,
        'error' => [
            'code' => 'IBLOCK_MODULE_REQUIRED',
            'message' => 'Bitrix iblock module is not available',
        ],
    ];
    $this->IncludeComponentTemplate();
    return;
}

$defaultPageSize = max(1, (int)($arParams['DEFAULT_PAGE_SIZE'] ?? ($localConfig['default_page_size'] ?? 20)));
$maxPageSize = max($defaultPageSize, (int)($arParams['MAX_PAGE_SIZE'] ?? ($localConfig['max_page_size'] ?? 100)));
$apiKey = trim((string)($arParams['API_KEY'] ?? ($localConfig['api_key'] ?? '')));
$allowedIblockIdsRaw = trim((string)($arParams['ALLOWED_IBLOCK_IDS'] ?? ($localConfig['allowed_iblock_ids'] ?? '')));

$allowedIblockIds = [];
if ($allowedIblockIdsRaw !== '') {
    $parts = preg_split('/\s*,\s*/', $allowedIblockIdsRaw) ?: [];
    foreach ($parts as $part) {
        if ($part !== '' && ctype_digit($part)) {
            $allowedIblockIds[] = (int)$part;
        }
    }
}

$request = \Bitrix\Main\Context::getCurrent()->getRequest();
$isApiRequest = (string)$request->get('format') === 'json' || (string)$request->get('action') !== '';

if (!$isApiRequest) {
    $arResult = [
        'ok' => true,
        'mode' => 'ui',
    ];
    $this->IncludeComponentTemplate();
    return;
}

if ($apiKey === '') {
    sendJson(500, [
        'ok' => false,
        'error' => [
            'code' => 'CONNECTOR_NOT_CONFIGURED',
            'message' => 'API key is empty. Configure component parameters first.',
        ],
    ]);
}

$incomingApiKey = trim((string)$request->get('api_key'));
if (!hash_equals($apiKey, $incomingApiKey)) {
    sendJson(401, [
        'ok' => false,
        'error' => [
            'code' => 'UNAUTHORIZED',
            'message' => 'Invalid api_key',
        ],
    ]);
}

$action = trim((string)$request->get('action'));

switch ($action) {
    case 'ping':
        sendJson(200, [
            'ok' => true,
            'data' => [
                'service' => 'randee.connector',
                'version' => '0.1.0',
            ],
            'meta' => [
                'serverTime' => date(DATE_ATOM),
            ],
        ]);
        break;

    case 'iblocks.list':
        $iblocks = [];
        $iterator = \Bitrix\Iblock\IblockTable::getList([
            'select' => ['ID', 'NAME', 'CODE', 'IBLOCK_TYPE_ID', 'ACTIVE'],
            'filter' => ['=ACTIVE' => 'Y'],
            'order' => ['ID' => 'ASC'],
        ]);
        while ($row = $iterator->fetch()) {
            $id = (int)$row['ID'];
            if (!isIblockAllowed($id, $allowedIblockIds)) {
                continue;
            }
            $iblocks[] = [
                'id' => (string)$id,
                'name' => (string)$row['NAME'],
                'code' => (string)$row['CODE'],
                'type' => (string)$row['IBLOCK_TYPE_ID'],
            ];
        }

        sendJson(200, [
            'ok' => true,
            'data' => $iblocks,
            'meta' => ['count' => count($iblocks)],
        ]);
        break;

    case 'iblock.schema':
        $iblockId = readIblockId($request, $allowedIblockIds);

        $fields = [
            ['kind' => 'field', 'code' => 'ID', 'label' => 'ID'],
            ['kind' => 'field', 'code' => 'NAME', 'label' => 'Name'],
            ['kind' => 'field', 'code' => 'PREVIEW_TEXT', 'label' => 'Preview text'],
            ['kind' => 'field', 'code' => 'DETAIL_TEXT', 'label' => 'Detail text'],
            ['kind' => 'field', 'code' => 'PREVIEW_PICTURE', 'label' => 'Preview picture'],
            ['kind' => 'field', 'code' => 'DETAIL_PICTURE', 'label' => 'Detail picture'],
            ['kind' => 'field', 'code' => 'ACTIVE_FROM', 'label' => 'Active from'],
        ];

        $propIterator = \CIBlockProperty::GetList(
            ['SORT' => 'ASC', 'ID' => 'ASC'],
            ['IBLOCK_ID' => $iblockId, 'ACTIVE' => 'Y']
        );
        while ($prop = $propIterator->Fetch()) {
            $fields[] = [
                'kind' => 'property',
                'code' => (string)$prop['CODE'],
                'label' => (string)($prop['NAME'] ?: $prop['CODE']),
                'propertyType' => (string)$prop['PROPERTY_TYPE'],
                'multiple' => (string)$prop['MULTIPLE'] === 'Y',
            ];
        }

        sendJson(200, [
            'ok' => true,
            'data' => [
                'iblockId' => (string)$iblockId,
                'fields' => $fields,
            ],
        ]);
        break;

    case 'elements.list':
        $iblockId = readIblockId($request, $allowedIblockIds);
        $offset = max(0, (int)$request->get('offset'));
        $limit = max(1, min($maxPageSize, (int)($request->get('limit') ?: $defaultPageSize)));
        $withProperties = (string)$request->get('withProperties') === 'true' || (string)$request->get('with_properties') === 'true';

        $elements = [];
        $count = 0;
        $result = \CIBlockElement::GetList(
            ['SORT' => 'ASC', 'ID' => 'ASC'],
            ['IBLOCK_ID' => $iblockId, 'ACTIVE' => 'Y'],
            false,
            ['nTopCount' => $offset + $limit],
            ['ID', 'IBLOCK_ID', 'NAME', 'PREVIEW_TEXT', 'DETAIL_TEXT', 'PREVIEW_PICTURE', 'DETAIL_PICTURE']
        );

        while ($item = $result->GetNextElement()) {
            if ($count < $offset) {
                $count++;
                continue;
            }
            if (count($elements) >= $limit) {
                break;
            }
            $fields = $item->GetFields();
            $element = normalizeElement($fields);
            if ($withProperties) {
                $properties = $item->GetProperties();
                $normalizedProps = [];
                foreach ($properties as $propCode => $prop) {
                    $normalizedProps[$propCode] = normalizeProperty($prop);
                }
                $element['properties'] = $normalizedProps;
            }
            $elements[] = $element;
            $count++;
        }

        sendJson(200, [
            'ok' => true,
            'data' => $elements,
            'meta' => [
                'offset' => $offset,
                'limit' => $limit,
                'count' => count($elements),
            ],
        ]);
        break;

    case 'element.get':
        $iblockId = readIblockId($request, $allowedIblockIds);
        $elementId = (int)$request->get('elementId');
        if ($elementId <= 0) {
            sendJson(400, [
                'ok' => false,
                'error' => [
                    'code' => 'INVALID_ELEMENT_ID',
                    'message' => 'elementId must be a positive integer',
                ],
            ]);
        }

        $result = \CIBlockElement::GetList(
            [],
            ['IBLOCK_ID' => $iblockId, 'ID' => $elementId],
            false,
            ['nTopCount' => 1],
            ['ID', 'IBLOCK_ID', 'NAME', 'PREVIEW_TEXT', 'DETAIL_TEXT', 'PREVIEW_PICTURE', 'DETAIL_PICTURE']
        );
        $item = $result->GetNextElement();
        if (!$item) {
            sendJson(404, [
                'ok' => false,
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'Element was not found',
                ],
            ]);
        }

        $fields = $item->GetFields();
        $properties = $item->GetProperties();

        $normalizedProperties = [];
        foreach ($properties as $propertyCode => $property) {
            $normalizedProperties[$propertyCode] = normalizeProperty($property);
        }

        sendJson(200, [
            'ok' => true,
            'data' => [
                'element' => normalizeElement($fields),
                'properties' => $normalizedProperties,
            ],
        ]);
        break;

    default:
        sendJson(400, [
            'ok' => false,
            'error' => [
                'code' => 'UNKNOWN_ACTION',
                'message' => 'Unknown action',
            ],
        ]);
}

function readIblockId(\Bitrix\Main\HttpRequest $request, array $allowedIblockIds): int
{
    $iblockId = (int)$request->get('iblockId');
    if ($iblockId <= 0) {
        sendJson(400, [
            'ok' => false,
            'error' => [
                'code' => 'INVALID_IBLOCK_ID',
                'message' => 'iblockId must be a positive integer',
            ],
        ]);
    }
    if (!isIblockAllowed($iblockId, $allowedIblockIds)) {
        sendJson(403, [
            'ok' => false,
            'error' => [
                'code' => 'IBLOCK_FORBIDDEN',
                'message' => 'Requested iblock is not allowed',
            ],
        ]);
    }
    return $iblockId;
}

function isIblockAllowed(int $iblockId, array $allowedIblockIds): bool
{
    if (count($allowedIblockIds) === 0) {
        return true;
    }
    return in_array($iblockId, $allowedIblockIds, true);
}

function normalizeElement(array $item): array
{
    $previewPictureId = (int)($item['PREVIEW_PICTURE'] ?? 0);
    $detailPictureId = (int)($item['DETAIL_PICTURE'] ?? 0);

    return [
        'id' => (string)$item['ID'],
        'iblockId' => (string)$item['IBLOCK_ID'],
        'name' => (string)($item['~NAME'] ?? $item['NAME'] ?? ''),
        'previewText' => (string)($item['~PREVIEW_TEXT'] ?? $item['PREVIEW_TEXT'] ?? ''),
        'detailText' => (string)($item['~DETAIL_TEXT'] ?? $item['DETAIL_TEXT'] ?? ''),
        'previewPicture' => normalizeFileById($previewPictureId),
        'detailPicture' => normalizeFileById($detailPictureId),
    ];
}

function normalizeProperty(array $property): array
{
    $type = (string)($property['PROPERTY_TYPE'] ?? '');
    $multiple = (string)($property['MULTIPLE'] ?? '') === 'Y';
    $value = $property['VALUE'] ?? null;

    if ($type === 'F') {
        if (is_array($value)) {
            $files = [];
            foreach ($value as $fileId) {
                $files[] = normalizeFileById((int)$fileId);
            }
            return ['type' => 'file', 'multiple' => $multiple, 'value' => $files];
        }
        return ['type' => 'file', 'multiple' => $multiple, 'value' => normalizeFileById((int)$value)];
    }

    return [
        'type' => $type,
        'multiple' => $multiple,
        'value' => $value,
        'description' => $property['DESCRIPTION'] ?? null,
    ];
}

function normalizeFileById(int $fileId): ?array
{
    if ($fileId <= 0) {
        return null;
    }
    $file = \CFile::GetFileArray($fileId);
    if (!is_array($file)) {
        return null;
    }

    return [
        'id' => (string)$fileId,
        'src' => (string)($file['SRC'] ?? ''),
        'width' => isset($file['WIDTH']) ? (int)$file['WIDTH'] : null,
        'height' => isset($file['HEIGHT']) ? (int)$file['HEIGHT'] : null,
        'contentType' => (string)($file['CONTENT_TYPE'] ?? ''),
        'fileName' => (string)($file['FILE_NAME'] ?? ''),
    ];
}

function sendJson(int $status, array $payload): void
{
    global $APPLICATION;
    if (is_object($APPLICATION) && method_exists($APPLICATION, 'RestartBuffer')) {
        $APPLICATION->RestartBuffer();
    }
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    die();
}
