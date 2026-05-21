# 🔮 ThinkNote

> A premium, minimalist, AI-powered thought organizer that elegantly maps your ideas into a connected tree structure. Designed for distraction-free note-taking, dynamic branching, and intelligent organization.

---

## ✨ Features

- **🌲 Interactive Thought Trees**: Your ideas are automatically organized as connected node structures, creating an intuitive flow from spark to structured document.
- **🤖 Context-Aware AI integration**: Auto-answer questions directly within the thought stream. Supports a wide array of AI providers:
  - Cloud: **OpenRouter**, **OpenAI**, **Anthropic (Claude)**
  - Local: **Ollama**, **LM Studio**
  - Custom: Any OpenAI-compatible endpoint.
- **🎨 Premium Minimalist Aesthetic**:
  - Immersive Dark Mode & Light Mode support.
  - Curated, premium typography: **Source Serif 4** (calm & reader-focused), **DM Sans** (modern & clean), **Georgia** (classic), or **Monospace**.
  - Crisp, modern UI built using 1.5px stroke **Lucide Icons** and glassmorphic micro-animations.
- **📦 Collapsible Sessions Panel**: Manage and switch between your recent think sessions through an elegant, space-saving sidebar.
- **💾 Robust Document Exporting**:
  - Download your organized thought maps as clean `.txt` files.
  - Export beautifully formatted Microsoft Word `.docx` documents instantly (powered by `docx.js`).
- **⚡ Performance & Privacy First**:
  - Fully offline-first capabilities (works perfectly without any API keys).
  - High-performance, single-page architecture.

---

## 🛠️ Tech Stack

- **Core**: HTML5, Vanilla JavaScript (ES6+), and CSS3
- **Icons**: [Lucide Icons](https://lucide.dev)
- **Markdown Parsing**: [Marked.js](https://marked.js.org)
- **Document Exporting**: [docx.js](https://docx.js.org)
- **Fonts**: Google Fonts (*DM Sans*, *Source Serif 4*)

---

## 📂 Project Structure

```text
thinknote/
├── index.html       # Single-page application structure
├── style.css        # Immersive glassmorphic design & layout styles
├── state.js         # Core state management (Note history, node storage)
├── ai.js            # Unified AI connection & request handling layer
├── layout.js        # Responsive UI panel state & settings drawer toggles
├── render.js        # Dynamic tree node rendering & tree visualizations
├── export.js        # Exporters for TXT and DOCX formats
└── app.js           # Main app initialization & keyboard shortcuts
```

---

## 🚀 Getting Started

### Local Setup
Since ThinkNote is a static web application, there are **no build steps or dependencies to install**. You can run it directly in your browser.

1. **Clone the repository**:
   ```bash
   git clone git@github.com:Exactly15/ThinkNote.git
   cd ThinkNote
   ```

2. **Run it locally**:
   - Double-click `index.html` to open it in your browser.
   - Or, run a simple local server in the folder:
     ```bash
     python3 -m http.server 8000
     ```
     Then navigate to `http://localhost:8000`.

---

## ⚙️ AI Configuration

Click the slider icon in the top right corner to configure your AI assistant:
1. Select your preferred provider (e.g. OpenRouter, OpenAI, Anthropic, or a local server like Ollama).
2. Enter your API Key or local URL endpoint.
3. Specify the model you'd like to use (e.g. `gpt-4o-mini`, `claude-3-haiku`, or your local model like `llama3`).
4. Click **Test connection** (⚡) to verify, then save (**✓**)!
