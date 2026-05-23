# Git Setup

## Initial bootstrap

```bash
git init
git add .
git commit -m "chore: bootstrap randee ecosystem architecture docs"
git branch -M main
git remote add origin https://github.com/randee-ru/Randee-Ecosystem.git
git push -u origin main
```

## Commit convention

- `feat:` новая функциональность
- `fix:` исправление
- `chore:` технические изменения
- `docs:` документация
- `refactor:` рефакторинг без изменения поведения
