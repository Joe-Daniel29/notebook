# 🚀 Notebook RAG Pro: Next-Gen Document Intelligence
**Architected & Developed by Joe Daniel**  
*Next.js 16 • Tailwind CSS 4.0 • NVIDIA NIM • In-Memory DB • TypeScript*

![Notebook RAG Banner](https://img.shields.io/badge/Model-Llama--3.1--70B-blue?style=for-the-badge&logo=meta)
![Vector DB](https://img.shields.io/badge/Storage-Qdrant--Cloud-red?style=for-the-badge&logo=qdrant)
![Embeddings](https://img.shields.io/badge/Embeddings-NVIDIA--NeMo-green?style=for-the-badge&logo=nvidia)

**Notebook RAG Pro** is a professional-grade, high-performance Retrieval-Augmented Generation (RAG) platform. It is engineered to transform static data—PDFs, CSVs, and plain text—into dynamic, interactive intelligence partners with unmatched surgical precision and zero-latency retrieval.

---

## 💎 The Philosophy: Ground Truth First
In a world of AI hallucinations, **Notebook RAG Pro** stands apart. This platform is built on a deterministic pipeline that ensures every response is anchored in reality. By utilizing a hybrid storage architecture, we ensure that if a fact isn't in your document, the AI won't invent it.

---

## ✨ Why Choose Notebook RAG Pro?
*   **SOTA Orchestration**: Leverages the power of **Meta Llama 3.1 70B** for human-level reasoning.
*   **Persistent Memory**: Integrated with **In-Memory DB**, ensuring your research stays indexed even after a server restart.
*   **Obsidian Aesthetic**: A premium, "Glassmorphism" environment designed for distraction-free, long-form research.
*   **Hybrid Vector Engine**: Seamlessly toggles between ultra-fast in-memory processing and scalable cloud storage.

---

## 🧠 Technical Deep Dive

### 1. Advanced Embedding & Retrieval
Using the **NVIDIA nv-embedqa-e5-v5** model, we map your documents into a **1024-dimension semantic space**. This allows the system to understand the *intent* behind your words, not just the keywords.
*   **Precision Grounding**: Enforces strict adherence to retrieved context via advanced prompt engineering.
*   **Cross-Format Support**: Seamlessly indexes complex PDFs, structured CSV data, and raw TXT files.

### 2. Scalable Cloud Infrastructure
Unlike basic RAG setups, this "Pro" version utilizes **In-Memory DB** for persistent document storage:
*   **Semantic Filtering**: Queries are filtered by `notebookId` within the cloud, ensuring your chat session remains private to that specific document.
*   **Recursive Chunking**: Smart text splitting (~900 chars) with semantic overlap (150 chars) to maintain context across boundaries.

### 3. Intelligence-First UI/UX
The interface is a tailor-made "Research Environment" designed for maximum productivity:
*   **Glassmorphism UI**: Translucent, blurred backgrounds and obsidian-charcoal tones for a premium feel.
*   **Real-Time Citations**: Streamed answers include automated `[N]` citations that link directly to the source.
*   **Source Evidence HUD**: Instantly inspect the exact paragraph the AI used to generate its answer with a dedicated "Source Preview" card.

---

## 🛠️ Tech Stack & Infrastructure

| Component | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router) |
| **Styling** | Tailwind CSS 4.0 (Obsidian/Glass Theme) |
| **Model** | Meta Llama 3.1 70B Instruct |
| **Embeddings** | NVIDIA nv-embedqa-e5-v5 |
| **Vector Database** | In-Memory DB (Managed Instance) |
| **Language** | TypeScript (Strict Mode) |

---

## ⚙️ Installation & Setup

### 1. Clone & Install
```bash
git clone https://github.com/joedaniel/notebook.git
cd notebook
pnpm install
```

### 2. Configure Environment
Create a `.env.local` in the root directory:
```env
# NVIDIA NIM Inference
NVIDIA_API_KEY=your_key_here

# In-Memory DB Integration



```

### 3. Deploy Locally
```bash
npm run dev
```

---

**Developed with Passion by Joe Daniel**  
*Building the future of document intelligence, one chunk at a time.* 🚀
