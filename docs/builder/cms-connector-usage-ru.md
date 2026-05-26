# CMS Connector: Builder + IDE (randee.connector)

Дата: 2026-05-24  
Статус: актуально для `randee.connector >= 0.3.1`

## 1. Что это дает

`randee.connector` позволяет Builder читать данные инфоблоков Bitrix:

- список инфоблоков;
- поля и свойства инфоблока;
- sample элементов.

Дальше эти данные можно привязать к props компонента в правом Inspector через `Binding (CMS)`.

## 2. Предусловия

1. На сайте Bitrix установлен модуль `randee.connector`.
2. В настройках модуля задан `API key`.
3. Известен endpoint:
`/local/modules/randee.connector/tools/connector.php`

## 3. Настройка в Bitrix

Откройте:

`/bitrix/admin/settings.php?mid=randee.connector&lang=ru`

Проверьте поля:

1. `API key` — обязательный.
2. `Allowed iblock IDs` — при необходимости ограничьте доступ.
3. `Allowed origins` — добавьте origin Builder (например, `http://localhost:3000` или production origin).

Проверка API вручную:

```text
https://YOUR_SITE/local/modules/randee.connector/tools/connector.php?action=ping&api_key=YOUR_KEY&format=json
```

Ожидаемый ответ:

```json
{"ok":true,"data":{"service":"randee.connector","version":"0.3.1"}}
```

## 4. Настройка в Builder (UI)

Откройте Builder и вкладку `CMS`.

Заполните:

1. `Site URL` — например `https://c0l.ru`.
2. `API key` — тот же, что в модуле.
3. `Connector Path` — `/local/modules/randee.connector/tools/connector.php`.

Дальше:

1. Нажмите `Save CMS settings`.
2. Убедитесь в статусе `CMS saved status: saved`.
3. Нажмите `Проверить подключение`.
4. Нажмите `Обновить инфоблоки`.

Если все корректно, в блоке `IBLOCKS` появится список инфоблоков.

## 5. Привязка данных к props компонента

Откройте компонент/блок на canvas и правый Inspector.

Для нужного prop:

1. Переключите `Static` → `Binding (CMS)`.
2. Выберите `Iblock`.
3. Выберите `Field` или `Property`.
4. Выберите `Element` (или оставьте `Auto`).
5. При необходимости задайте `Fallback`.

Привязка сохраняется в `page.blocks[].cmsBindings`.

## 6. Настройка через IDE (без UI)

Можно править JSON страницы напрямую в `.randee/pages/<slug>.json`.

Пример:

```json
{
  "cmsConnection": {
    "provider": "bitrix",
    "siteUrl": "https://c0l.ru",
    "connectorPath": "/local/modules/randee.connector/tools/connector.php",
    "apiKey": "YOUR_KEY",
    "enabled": true
  }
}
```

Пример привязки prop:

```json
{
  "cmsBindings": {
    "version": 1,
    "props": {
      "title": {
        "mode": "binding",
        "binding": {
          "source": {
            "provider": "bitrix",
            "siteUrl": "https://c0l.ru",
            "iblockId": "1",
            "mode": "element",
            "elementId": "10"
          },
          "field": {
            "kind": "property",
            "code": "TITLE_LINE_1"
          },
          "fallback": "Заголовок по умолчанию"
        }
      }
    }
  }
}
```

## 7. Частые проблемы

1. `Load failed`
Причина: CORS/HTTPS/неверный путь.
Проверьте `allowed_origins`, `Site URL`, `Connector Path`.

2. После reload снова `example.com / secret key`
Причина: данные не были сохранены в страницу.
Нажмите `Save CMS settings` и дождитесь `saved`.

3. `Проверить подключение` успешно, но инфоблоки пустые
Причина: ограничения allowlist или нет прав.
Проверьте `Allowed iblock IDs` и права к инфоблокам в Bitrix.

## 8. Рекомендация по процессу

1. Сначала подключите CMS и проверьте инфоблоки.
2. Затем делайте привязки props в Inspector.
3. После каждой серии изменений — `Save CMS settings` и сохранение страницы.
