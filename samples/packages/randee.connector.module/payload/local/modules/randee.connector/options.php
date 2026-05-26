<?php

use Bitrix\Main\Config\Option;
use Bitrix\Main\Localization\Loc;

$moduleId = 'randee.connector';

if (!$USER->IsAdmin()) {
    return;
}

Loc::loadMessages(__FILE__);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && check_bitrix_sessid()) {
    Option::set($moduleId, 'api_key', trim((string)($_POST['api_key'] ?? '')));
    Option::set($moduleId, 'allowed_origins', trim((string)($_POST['allowed_origins'] ?? '')));
    Option::set($moduleId, 'allowed_iblock_ids', trim((string)($_POST['allowed_iblock_ids'] ?? '')));
    Option::set($moduleId, 'default_page_size', trim((string)($_POST['default_page_size'] ?? '20')));
    Option::set($moduleId, 'max_page_size', trim((string)($_POST['max_page_size'] ?? '100')));
}

$apiKey = Option::get($moduleId, 'api_key', '');
$allowedOrigins = Option::get($moduleId, 'allowed_origins', '');
$allowedIblockIds = Option::get($moduleId, 'allowed_iblock_ids', '');
$defaultPageSize = Option::get($moduleId, 'default_page_size', '20');
$maxPageSize = Option::get($moduleId, 'max_page_size', '100');
$endpointPath = '/local/modules/randee.connector/tools/connector.php';
?>
<form method="post" action="<?= $APPLICATION->GetCurPageParam() ?>">
    <?= bitrix_sessid_post() ?>
    <table class="adm-detail-content-table edit-table">
        <tr>
            <td width="40%">API key</td>
            <td width="60%"><input type="text" name="api_key" value="<?= htmlspecialcharsbx($apiKey) ?>" size="60"></td>
        </tr>
        <tr>
            <td>Allowed iblock IDs (comma separated)</td>
            <td><input type="text" name="allowed_iblock_ids" value="<?= htmlspecialcharsbx($allowedIblockIds) ?>" size="60"></td>
        </tr>
        <tr>
            <td>Allowed origins (comma separated)</td>
            <td>
                <input type="text" name="allowed_origins" value="<?= htmlspecialcharsbx($allowedOrigins) ?>" size="60"><br>
                <span style="color:#666">Example: http://localhost:3000, https://builder.example.com</span>
            </td>
        </tr>
        <tr>
            <td>Default page size</td>
            <td><input type="text" name="default_page_size" value="<?= htmlspecialcharsbx($defaultPageSize) ?>" size="10"></td>
        </tr>
        <tr>
            <td>Maximum page size</td>
            <td><input type="text" name="max_page_size" value="<?= htmlspecialcharsbx($maxPageSize) ?>" size="10"></td>
        </tr>
        <tr>
            <td>API endpoint</td>
            <td><code><?= htmlspecialcharsbx($endpointPath) ?></code></td>
        </tr>
        <tr>
            <td>Builder connection URL</td>
            <td>
                <code><?= htmlspecialcharsbx($endpointPath) ?></code><br>
                <span style="color:#666">Use this value in Builder field "Connector Path".</span>
            </td>
        </tr>
        <tr>
            <td>Ping example</td>
            <td>
                <code><?= htmlspecialcharsbx($endpointPath) ?>?action=ping&amp;api_key=YOUR_KEY</code>
            </td>
        </tr>
    </table>
    <input type="submit" name="save" value="Save" class="adm-btn-save">
</form>
