# Randee UI: Animation Composition и Performance (RU)

Документ для `packages/ui/src/animations/*`.

## Цели анимационного слоя

- Дать переиспользуемые анимационные primitives.
- Сохранить предсказуемость UI при отключении анимаций.
- Соблюдать доступность через `prefers-reduced-motion`.
- Избегать тяжелых анимаций, ломающих FPS.

## Реализованные primitives

- `RandeeReveal`
- `RandeeParallax`
- `RandeeCounter`
- `RandeeMarquee`
- `RandeeScrollSection`
- `RandeeAnimatedSection`

## Базовые правила композиции

1. На одном экране используйте 1-2 выраженных эффекта, не больше.
2. Не объединяйте `pin + heavy parallax + infinite marquee` в одном viewport-блоке.
3. Для текстовых блоков начинайте с `RandeeReveal`.
4. Для фоновых акцентов используйте `RandeeParallax` с умеренным `speed`.
5. `RandeeScrollSection` применяйте только к секциям, где pin оправдан UX.

## Performance knobs

- `enabled`:
  - Обязательный флаг для runtime отключения анимации (по фичефлагу/режиму).
- `prefers-reduced-motion`:
  - Хук `useReducedMotion` автоматически отключает анимации.
- `duration` (`RandeeReveal`, `RandeeCounter`):
  - Рекомендуемый диапазон `0.6 - 1.2`.
- `speed` (`RandeeParallax`, `RandeeMarquee`):
  - Parallax: `0.15 - 0.35`.
  - Marquee: `20 - 40` (больше число = медленнее).
- `scrub` (`RandeeScrollSection`):
  - `true` для плавной синхронизации.
  - число для более контролируемого инерционного эффекта.

## Практические пресеты

### Preset A: Product Hero

- `RandeeReveal` для заголовка/подзаголовка.
- `RandeeCounter` для цифр достижений.
- Без pin и без marquee.

### Preset B: Narrative Scroll

- `RandeeScrollSection` (pin=true, scrub=true).
- Внутри секции — `RandeeReveal` по подблокам.
- `RandeeParallax` только на декоративных слоях.

### Preset C: Brand Band

- `RandeeMarquee` для логотипов/ключевых слов.
- `enabled=false` в low-performance режиме.

## Антипаттерны

- Анимация layout-свойств (`top/left/width/height`) вместо transform/opacity.
- Одновременные бесконечные анимации в нескольких секциях above-the-fold.
- Игнорирование reduced motion.
- Избыточные ScrollTrigger на каждый мелкий элемент.

## DX-рекомендации

- Каждому animation primitive соответствуют story и unit test.
- Для критичных экранов добавляйте visual snapshot (`tests/visual`).
- В code review проверяйте:
  - fallback при `enabled=false`;
  - корректность reduced-motion поведения;
  - отсутствие лишних перерисовок.
