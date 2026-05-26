<?php

use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

class randee_connector extends CModule
{
    public $MODULE_ID = 'randee.connector';
    public $MODULE_VERSION;
    public $MODULE_VERSION_DATE;
    public $MODULE_NAME = 'Randee Connector';
    public $MODULE_DESCRIPTION = 'Read-only CMS connector for Randee Builder';
    public $PARTNER_NAME = 'Randee';
    public $PARTNER_URI = 'https://updates.c0l.ru';

    public function __construct()
    {
        $versionFile = __DIR__ . '/version.php';
        if (file_exists($versionFile)) {
            include $versionFile;
            $this->MODULE_VERSION = $arModuleVersion['VERSION'];
            $this->MODULE_VERSION_DATE = $arModuleVersion['VERSION_DATE'];
        }
    }

    public function DoInstall()
    {
        RegisterModule($this->MODULE_ID);
    }

    public function DoUninstall()
    {
        UnRegisterModule($this->MODULE_ID);
    }
}
