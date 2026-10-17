# Contributing to ZOX SuperApp (Mizoram Errand & Service Platform)

Thank you for your interest in contributing to **ZOX SuperApp**! We welcome community contributions, bug fixes, localization improvements, and new feature suggestions.

---

## 🧭 Code of Conduct

This project is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold its standards.

---

## 🛠️ Development Setup

1. **Fork & Clone**:
   ```bash
   git clone https://github.com/<your-username>/Mizoram-errand.git
   cd Mizoram-errand
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run Dev Server**:
   ```bash
   npm run dev
   ```
4. **Run Unit Tests**:
   ```bash
   npm test
   ```
5. **Run Type Checks**:
   ```bash
   npm run lint
   ```

---

## 📝 Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

* `feat:` A new feature or capability (e.g., `feat(dispatch): add estimated purchase budget support`)
* `fix:` A bug fix (e.g., `fix(preview): resolve SPA dev routing on root URL`)
* `docs:` Documentation additions or updates (e.g., `docs(readme): add architecture diagrams`)
* `style:` Code style, formatting, or theme adjustments (e.g., `style(theme): enhance dark mode contrast`)
* `refactor:` Code restructuring without modifying behavior
* `test:` Adding or updating unit tests
* `chore:` Build scripts, dependency updates, or repository maintenance

---

## 🌐 Localization & Mizo Ṭawng Guidelines

ZOX SuperApp is proudly bilingual:
* All user-facing strings must have both **English** and **Mizo ṭawng** representations.
* Respect proper Mizo spelling and diacritics where appropriate (e.g., `ṭ`, `chhawrtu`, `thawktu`, `kailawn`).
* When adding a new module or field, update both `name` and `nameMizo` in `src/utils/mizoramData.ts` and `src/types/platform.ts`.

---

## 📐 Pull Request (PR) Process

1. Create a dedicated feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Ensure all 17+ unit tests pass:
   ```bash
   npm test
   ```
3. Ensure TypeScript compiles without errors:
   ```bash
   npm run lint
   ```
4. Push your branch to GitHub and open a Pull Request against `main`.
5. Provide a clear description of the problem solved, architectural considerations, and screenshots/recordings if UI changes were made.
