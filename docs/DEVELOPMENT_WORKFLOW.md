# Frontend delivery workflow

این مخزن بخشی از گردش‌کار دو مخزنه Nexus است. قواعد کامل در فایل workspace زیر نگهداری می‌شود:

`../../../../docs/playbooks/development-workflow.md`

قواعد اختصاصی Frontend:

- شاخه پایه: `develop`
- شاخه تسک: `feature/NEXUS-XXX-<name>`
- کنترل‌های حداقلی: `npm run lint` و در صورت وجود script مربوط، type-check/test
- PR همیشه به `develop` باز می‌شود.
- PR متناظر Backend باید در توضیحات لینک شود.
- Merge به `develop` یا `main` بدون تأیید مالک محصول انجام نمی‌شود.
