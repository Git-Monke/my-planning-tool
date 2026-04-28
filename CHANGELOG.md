# Changelog

## [Unreleased]

### Changed

- **Calendar day view**: The timeline always shows the full day (12 AM–11 PM) at a fixed scale (60 px per hour, 1 px per minute); the previous configurable visible-hour range was removed. Opening the view defaults to 6:00 AM when no scroll position is saved, and the vertical scroll position is persisted in local storage.

### Fixed

- **Calendar**: Switching between Day and Month no longer resets the 1 / 3 / 7 day column choice (or overwrites the saved preference in local storage).
- **Tasks**: Checking or unchecking a task in the list now persists `completed` via `update_task` (previously only in-memory state changed).

### Changed

- **AI tools**: `get_notes` was split into `list_notes` (returns id and title for every note) and `get_note` (full content for one id) so the model can avoid loading all note bodies into context. The Notes UI still uses the existing `get_notes` Tauri command.
