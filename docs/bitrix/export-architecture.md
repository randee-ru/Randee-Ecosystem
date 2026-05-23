# Bitrix Export Architecture

## Target structure

```txt
/local/components/randee/<component_name>/
  component.php
  .parameters.php
  templates/.default/template.php
  templates/.default/style.css
  templates/.default/script.js
```

## Mapping

- Randee block type -> Bitrix component namespace.
- Block props -> `$arParams` и/или data bindings.
- Styles/scripts выносятся в шаблон компонента.

## Compatibility constraints

- PHP templates без runtime-зависимости от React.
- Прогрессивная деградация JS-эффектов.
- Изоляция стилей для предотвращения конфликтов в теме Bitrix.
