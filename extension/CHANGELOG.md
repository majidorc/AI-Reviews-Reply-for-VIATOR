# Changelog

All notable changes to the Reply by AI Chrome Extension (Viator & GetYourGuide).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.3] - 2026-03-13

### Added
- Optional **Company / business name** field in settings (for example, `AnyWhere.com`).
- Sign-off uses the saved value when available, for example: `Best regards, The AnyWhere.com Team`.

### Changed
- Company name fallback flow improved for platforms where automatic supplier-name detection is limited (notably GetYourGuide).

## [1.3.2] - 2026-03-13

### Changed
- Added strict **400-character handling** for GetYourGuide replies.
- Prompt now asks the model to stay under the platform limit.
- Final inserted text is hard-capped to the allowed max length.

## [1.3.1] - 2026-03-13

### Added
- Toolbar **popup UI** when left-clicking the extension icon.
- Popup includes quick instructions, **Open options** action, and a settings shortcut.

## [1.3.0] - 2026-03-13

### Removed
- Pro/license flow from the extension UI and logic.
- License validation handler and related host permission (`https://ai.majidorc.com/*`).

## [1.2.0] - 2026-03-13

### Added
- **GetYourGuide support** at `https://supplier.getyourguide.com/performance/reviews`.
- Reply button injection in the GetYourGuide review response modal.

### Changed
- Extension naming and messaging updated to cover both Viator and GetYourGuide.
- Content extraction generalized; ignores UI placeholder lines when reading review content.

## [1.1.0] - 2026-03-13

### Added
- Pro edition architecture (checkout/license activation) in the extension UI.
- License-key activation/deactivation controls in options.
- Background license validation against `https://ai.majidorc.com/api/extension/validate`.

## [1.0.0] - 2026-03-13

### Added
- Initial release for Viator reviews.
- **Reply by AI** button in Viator's response modal.
- Gemini integration (`gemini-2.5-flash-lite`) for suggested replies.
- Options page for storing Gemini API key in `chrome.storage.sync`.
- Reviewer/supplier extraction and auto-inserted formatted reply.
- MutationObserver-based modal detection and injection.
- Minimal required permissions and store-ready manifest/icon setup.

### Security
- Gemini API key is handled in the background worker and not injected into page scripts.
