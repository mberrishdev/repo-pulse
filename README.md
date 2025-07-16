# RepoPulse

RepoPulse is a modern dashboard for monitoring, managing, and triggering CI/CD pipelines and Renovate PRs across multiple repositories in Azure DevOps.  
It provides a beautiful, unified UI for DevOps teams to track repository health, automate dependency updates, and manage build pipelines.

---

## 🚀 Features

- **Repository Dashboard:**  
  - View all configured repositories and their pipeline status.
  - Trigger CI pipelines for individual repositories or all at once.
  - Direct links to repository pages and build pipelines.

- **Renovate PR Management:**  
  - List and manage Renovate bot pull requests across all repositories.
  - Publish (activate) draft PRs with a single click.
  - See affected repositories for each PR, with direct links to PRs and build pipelines.
  - Trigger builds for any repository directly from the PR card.

- **Settings & Configuration:**  
  - View and edit all configuration (Azure DevOps, repositories, Renovate) via a user-friendly form.
  - Download or copy your config as JSON.
  - Add/remove repositories and update pipeline settings without leaving the UI.

- **Status Indicators:**  
  - Visual status badges for build and PR states (success, failed, running, etc.).
  - Tooltips and icons for quick status recognition.

---

## 🛠️ Technologies Used

- **Frontend:** React, TypeScript, Vite, shadcn-ui, Tailwind CSS
- **Icons:** Lucide
- **State & UI:** React hooks, custom toasts, and modals

---

## ⚙️ Configuration

All configuration is managed via `public/config.json`.  
**Example:**

```json
{
  "azureDevOps": {
    "baseUrl": "https://dev.azure.com",
    "organization": "your-org",
    "project": "your-project",
    "personalAccessToken": "<YOUR_PERSONAL_ACCESS_TOKEN>"
  },
  "repositories": [
    {
      "name": "Repo1",
      "url": "/your-org/your-project/_git/Repo1",
      "pipelineId": "123",
      "branch": "master",
      "status": ""
    }
  ],
  "renovate": {
    "enabled": true,
    "botName": "renovate[bot]",
    "autoMerge": false
  }
}
```

- **baseUrl:** Your Azure DevOps base URL (usually `https://dev.azure.com`)
- **personalAccessToken:** Required for all API calls. **Never expose this in production frontend code!**
- **repositories:** List of repos to manage, with their pipeline IDs and default branches.
- **renovate:** Renovate bot settings.

---

## ⚠️ Security Note

> **Do NOT expose your Personal Access Token (PAT) in production frontend code.**  
> Azure DevOps REST APIs do not support CORS, so all API calls requiring a PAT must be proxied through a secure backend.

---

## 🖥️ Local Development

1. **Clone the repository:**
   ```sh
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Configure your Azure DevOps and repositories:**
   - Edit `public/config.json` with your organization, project, PAT, and repositories.

4. **Start the development server:**
   ```sh
   npm run dev
   ```

5. **Open [http://localhost:5173](http://localhost:5173) in your browser.**

---

## 🧩 Main Pages

- **Repositories:**  
  Monitor and trigger CI pipelines for all configured repositories.

- **Renovate:**  
  Manage Renovate PRs, publish drafts, and trigger builds for affected repositories.

- **Settings:**  
  Edit, add, or remove repositories and Azure DevOps settings. Download or copy your config.

---

## 📝 Customization

- **Add/Remove Repositories:**  
  Use the Settings page to manage your repository list and pipeline settings.

- **Change Azure DevOps Settings:**  
  Update organization, project, or PAT in the Settings page.

- **Edit Renovate Settings:**  
  Enable/disable Renovate integration and set the bot name.

---

## 🛡️ Production Deployment

- **You must use a backend to proxy Azure DevOps API calls.**  
  This app is designed for internal/dev use or with a secure backend proxy.

---
 
## 📄 License

MIT

---

If you have questions or need help, open an issue or contact the maintainer.

---

## 🐳 Docker Usage

You can build and run RepoPulse as a Docker container:

1. **Build the Docker image:**
   ```sh
   docker build -t repopulse .
   ```

2. **Run the container:**
   ```sh
   docker run -p 5050:80 -d repopulse
   ```
   The app will be available at [http://localhost:5050](http://localhost:5050).

---
