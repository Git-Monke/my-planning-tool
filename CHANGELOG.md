# Changelog

## [Unreleased]

### Changed

- **AI tools**: `get_notes` was split into `list_notes` (returns id and title for every note) and `get_note` (full content for one id) so the model can avoid loading all note bodies into context. The Notes UI still uses the existing `get_notes` Tauri command.
