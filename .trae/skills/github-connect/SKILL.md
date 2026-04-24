---
name: "github-connect"
description: "Connects or switches the local project to a GitHub repository. Invoke when user wants to link the project to a specific GitHub URL or change the existing remote."
---

# GitHub Connect Skill

This skill handles the connection between your local project and a GitHub repository (Remote). It is useful for initial setup or when you need to change where your project is stored on GitHub.

## When to Use
- When you want to link your project to a GitHub repository for the first time.
- When you want to switch the existing repository (Remote URL) to a new one.
- When you want to verify if the project is correctly connected to GitHub.

## Steps to Follow

### 1. Initialize Git (If not already)
If the project doesn't have Git yet:
```bash
git init
```

### 2. Set or Change Remote URL
To connect to a repository:
```bash
# If 'origin' already exists, update it
git remote set-url origin <GITHUB_URL>

# If 'origin' does not exist, add it
git remote add origin <GITHUB_URL>
```

### 3. Verify Connection
Confirm that the URL is set correctly:
```bash
git remote -v
```

### 4. Fetch Information (Optional)
To check the status of the remote repository:
```bash
git fetch origin
```

## Usage Examples
You can trigger this skill by saying:
- "เชื่อมต่อโปรเจกต์กับ github [URL]"
- "เปลี่ยน repo ไปที่ [URL]"
- "เช็คหน่อยว่าเชื่อมต่อ github อยู่ที่ไหน"
- "Link this project to github [URL]"

## Next Steps after Connecting
Once connected, you can use the `github-push` skill to upload your files.
