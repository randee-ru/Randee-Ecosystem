<?php

use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;

class RandeeConnectorService
{
    public const MODULE_ID = 'randee.connector';

    public static function handleRequest(\Bitrix\Main\HttpRequest $request): array
    {
        if (!Loader::includeModule('iblock')) {
            return self::error('IBLOCK_MODULE_REQUIRED', 'Bitrix iblock module is not available');
        }

        $apiKey = trim((string)Option::get(self::MODULE_ID, 'api_key', ''));
        if ($apiKey === '') {
            return self::error('CONNECTOR_NOT_CONFIGURED', 'API key is empty. Configure module settings.');
        }

        $incomingApiKey = trim((string)$request->get('api_key'));
        if (!hash_equals($apiKey, $incomingApiKey)) {
            return self::error('UNAUTHORIZED', 'Invalid api_key', 401);
        }

        $allowed = self::allowedIblockIds();
        $defaultPageSize = max(1, (int)Option::get(self::MODULE_ID, 'default_page_size', '20'));
        $maxPageSize = max($defaultPageSize, (int)Option::get(self::MODULE_ID, 'max_page_size', '100'));

        $action = trim((string)$request->get('action'));
        switch ($action) {
            case 'ping':
                return self::ok([
                    'service' => 'randee.connector',
                    'version' => '0.3.1',
                ], ['serverTime' => date(DATE_ATOM)]);

            case 'iblocks.list':
                $data = [];
                $iterator = \Bitrix\Iblock\IblockTable::getList([
                    'select' => ['ID', 'NAME', 'CODE', 'IBLOCK_TYPE_ID', 'ACTIVE'],
                    'filter' => ['=ACTIVE' => 'Y'],
                    'order' => ['ID' => 'ASC'],
                ]);
                while ($row = $iterator->fetch()) {
                    $id = (int)$row['ID'];
                    if (!self::isIblockAllowed($id, $allowed)) {
                        continue;
                    }
                    $data[] = [
                        'id' => (string)$id,
                        'name' => (string)$row['NAME'],
                        'code' => (string)$row['CODE'],
                        'type' => (string)$row['IBLOCK_TYPE_ID'],
                    ];
                }
                return self::ok($data, ['count' => count($data)]);

            case 'iblock.schema':
                $iblockId = self::readIblockId($request, $allowed);
                if ($iblockId <= 0) {
                    return self::error('INVALID_IBLOCK_ID', 'iblockId must be a positive integer');
                }
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
                    $propCode = trim((string)$prop['CODE']);
                    $propId   = (int)$prop['ID'];
                    // If CODE is empty, fall back to PROP_{ID} so the binding key is always usable
                    $bindCode = $propCode !== '' ? $propCode : 'PROP_' . $propId;
                    $fields[] = [
                        'kind' => 'property',
                        'code' => $bindCode,
                        'label' => (string)($prop['NAME'] ?: $bindCode),
                        'propertyType' => (string)$prop['PROPERTY_TYPE'],
                        'multiple' => (string)$prop['MULTIPLE'] === 'Y',
                        'propertyId' => $propId,
                    ];
                }
                return self::ok(['iblockId' => (string)$iblockId, 'fields' => $fields]);

            case 'elements.list':
                $iblockId = self::readIblockId($request, $allowed);
                if ($iblockId <= 0) {
                    return self::error('INVALID_IBLOCK_ID', 'iblockId must be a positive integer');
                }
                $offset = max(0, (int)$request->get('offset'));
                $limit = max(1, min($maxPageSize, (int)($request->get('limit') ?: $defaultPageSize)));
                $elements = [];
                $count = 0;
                $result = \CIBlockElement::GetList(
                    ['SORT' => 'ASC', 'ID' => 'ASC'],
                    ['IBLOCK_ID' => $iblockId, 'ACTIVE' => 'Y'],
                    false,
                    ['nTopCount' => $offset + $limit],
                    ['ID', 'IBLOCK_ID', 'NAME', 'PREVIEW_TEXT', 'DETAIL_TEXT', 'PREVIEW_PICTURE', 'DETAIL_PICTURE']
                );
                while ($item = $result->GetNext()) {
                    if ($count < $offset) {
                        $count++;
                        continue;
                    }
                    if (count($elements) >= $limit) {
                        break;
                    }
                    $elements[] = self::normalizeElement($item);
                    $count++;
                }
                return self::ok($elements, ['offset' => $offset, 'limit' => $limit, 'count' => count($elements)]);

            case 'element.get':
                $iblockId = self::readIblockId($request, $allowed);
                if ($iblockId <= 0) {
                    return self::error('INVALID_IBLOCK_ID', 'iblockId must be a positive integer');
                }
                $elementId = (int)$request->get('elementId');
                if ($elementId <= 0) {
                    return self::error('INVALID_ELEMENT_ID', 'elementId must be a positive integer');
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
                    return self::error('NOT_FOUND', 'Element was not found', 404);
                }
                $fields = $item->GetFields();
                $properties = $item->GetProperties();
                $normalizedProperties = [];
                foreach ($properties as $propertyCode => $property) {
                    $normalizedProperties[$propertyCode] = self::normalizeProperty($property);
                }
                return self::ok([
                    'element' => self::normalizeElement($fields),
                    'properties' => $normalizedProperties,
                ]);

            default:
                return self::error('UNKNOWN_ACTION', 'Unknown action');
        }
    }

    public static function sendJson(int $status, array $payload): void
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

    public static function applyCors(\Bitrix\Main\HttpRequest $request): void
    {
        $origin = trim((string)$request->getHeader('Origin'));
        $allowedRaw = trim((string)Option::get(self::MODULE_ID, 'allowed_origins', ''));
        $allowed = [];
        if ($allowedRaw !== '') {
            $parts = preg_split('/\s*,\s*/', $allowedRaw) ?: [];
            foreach ($parts as $part) {
                if ($part !== '') {
                    $allowed[] = rtrim($part, '/');
                }
            }
        }

        $allowOriginHeader = '';
        if ($origin !== '') {
            if (count($allowed) === 0) {
                $allowOriginHeader = $origin;
            } else {
                $normalizedOrigin = rtrim($origin, '/');
                if (in_array($normalizedOrigin, $allowed, true)) {
                    $allowOriginHeader = $origin;
                }
            }
        }

        if ($allowOriginHeader !== '') {
            header('Access-Control-Allow-Origin: ' . $allowOriginHeader);
            header('Vary: Origin');
        }

        header('Access-Control-Allow-Methods: GET, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Max-Age: 600');
    }

    private static function allowedIblockIds(): array
    {
        $raw = trim((string)Option::get(self::MODULE_ID, 'allowed_iblock_ids', ''));
        if ($raw === '') {
            return [];
        }
        $parts = preg_split('/\s*,\s*/', $raw) ?: [];
        $result = [];
        foreach ($parts as $part) {
            if ($part !== '' && ctype_digit($part)) {
                $result[] = (int)$part;
            }
        }
        return $result;
    }

    private static function readIblockId(\Bitrix\Main\HttpRequest $request, array $allowed): int
    {
        $iblockId = (int)$request->get('iblockId');
        if ($iblockId <= 0) {
            return 0;
        }
        if (!self::isIblockAllowed($iblockId, $allowed)) {
            return -1;
        }
        return $iblockId;
    }

    private static function isIblockAllowed(int $iblockId, array $allowed): bool
    {
        if (count($allowed) === 0) {
            return true;
        }
        return in_array($iblockId, $allowed, true);
    }

    private static function normalizeElement(array $item): array
    {
        return [
            'id' => (string)$item['ID'],
            'iblockId' => (string)$item['IBLOCK_ID'],
            'name' => (string)($item['~NAME'] ?? $item['NAME'] ?? ''),
            'previewText' => (string)($item['~PREVIEW_TEXT'] ?? $item['PREVIEW_TEXT'] ?? ''),
            'detailText' => (string)($item['~DETAIL_TEXT'] ?? $item['DETAIL_TEXT'] ?? ''),
            'previewPicture' => self::normalizeFileById((int)($item['PREVIEW_PICTURE'] ?? 0)),
            'detailPicture' => self::normalizeFileById((int)($item['DETAIL_PICTURE'] ?? 0)),
        ];
    }

    private static function normalizeProperty(array $property): array
    {
        $type = (string)($property['PROPERTY_TYPE'] ?? '');
        $multiple = (string)($property['MULTIPLE'] ?? '') === 'Y';
        $value = $property['VALUE'] ?? null;
        if ($type === 'F') {
            if (is_array($value)) {
                $files = [];
                foreach ($value as $fileId) {
                    $files[] = self::normalizeFileById((int)$fileId);
                }
                return ['type' => 'file', 'multiple' => $multiple, 'value' => $files];
            }
            return ['type' => 'file', 'multiple' => $multiple, 'value' => self::normalizeFileById((int)$value)];
        }
        return [
            'type' => $type,
            'multiple' => $multiple,
            'value' => $value,
            'description' => $property['DESCRIPTION'] ?? null,
        ];
    }

    private static function normalizeFileById(int $fileId): ?array
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

    private static function ok($data, array $meta = []): array
    {
        return ['status' => 200, 'payload' => ['ok' => true, 'data' => $data, 'meta' => $meta]];
    }

    private static function error(string $code, string $message, int $status = 400): array
    {
        return ['status' => $status, 'payload' => ['ok' => false, 'error' => ['code' => $code, 'message' => $message]]];
    }
}
