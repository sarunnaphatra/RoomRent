---
name: "github-push"
description: "Pushes project to GitHub, handles secret cleaning, and flattens history. Invoke when user wants to push/upload project to a GitHub repository."
---

# GitHub Push Skill

This skill automates the process of pushing a local project to a GitHub repository, with a focus on security and a clean history.

## When to Use
- When the user wants to push their project to a new or existing GitHub repository.
- When there is a need to ensure no secrets (API keys, credentials) are pushed.
- When the user wants a "clean" initial commit without old history.

## Steps to Follow

### 1. Verification
- Check if git is initialized: `git status`.
- Check existing remotes: `git remote -v`.
- Confirm the target repository URL with the user if not provided.

### 2. Security Check (Secrets Cleaning)
- **Scan for Secrets**: Check common configuration files (e.g., `.env`, `config.json`, `appspec.md`, `*.txt`) for API keys or private credentials.
- **Replace with Placeholders**: If secrets are found, replace them with `YOUR_API_KEY`, `YOUR_PRIVATE_KEY`, etc.
- **Update .gitignore**: Ensure sensitive files and directories are added to `.gitignore`.
- **Remove from Index**: If sensitive files were previously tracked, use `git rm --cached <file>`.

### 3. Flatten History (Optional but Recommended for Clean Start)
If the user wants a fresh start on the remote:
```bash
git checkout --orphan temp_branch
git add -A
git commit -m "Initial upload - Cleaned"
git branch -D main
git branch -m main
```

### 4. Set Remote and Push
- Set/Update remote: `git remote set-url origin <URL>` or `git remote add origin <URL>`.
- Push to GitHub: `git push -u origin main -f` (Use `-f` only if flattening history or overwriting remote).

## Safety Notes
- Always warn the user before performing a `force push` (`-f`).
- Ensure the user is aware that history flattening will delete previous commit logs.

## How to User
วิธีการสั่งใช้งานครั้งถัดไป: คุณสามารถพิมพ์สั่งในแชทได้ง่ายๆ เช่น:
- "Push โปรเจกต์นี้ไปที่ github [URL]"
- "อัปโหลดไฟล์ขึ้น GitHub ให้หน่อย ล้างประวัติด้วย"
- "ใช้ skill github-push ส่งงานไปที่ [URL]"
