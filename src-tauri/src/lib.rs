use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use std::fs;
use tauri::Manager;
use uuid::Uuid;

// Note structure for database queries
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

// Input for creating/updating notes
#[derive(Debug, Clone, Deserialize)]
pub struct NoteInput {
    pub title: String,
    pub description: Option<String>,
}

// Task row structure for database queries
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TaskRow {
    pub id: String,
    pub title: String,
    pub notes: Option<String>,
    pub priority: Option<i32>,
    pub due_date: Option<String>,
    pub due_time: Option<String>,
    pub duration: Option<i32>,
    pub completed: bool,
    pub created_at: String,
    pub updated_at: String,
}

// TimeBlock row structure for database queries
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TimeBlockRow {
    pub id: String,
    pub task_id: String,
    pub start_date: String,
    pub start_time: String,
    pub duration: i32,
    pub created_at: String,
    pub updated_at: String,
}

// Input for creating/updating tasks
#[derive(Debug, Clone, Deserialize)]
pub struct TaskInput {
    pub title: String,
    pub notes: Option<String>,
    pub priority: Option<i32>,
    pub due_date: Option<String>,
    pub due_time: Option<String>,
    pub duration: Option<i32>,
    pub completed: Option<bool>,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Note CRUD commands
#[tauri::command]
async fn get_notes(pool: tauri::State<'_, SqlitePool>) -> Result<Vec<Note>, String> {
    let notes = sqlx::query_as::<_, Note>(
        "SELECT id, title, description, created_at, updated_at FROM notes ORDER BY updated_at DESC"
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(notes)
}

#[tauri::command]
async fn create_note(
    pool: tauri::State<'_, SqlitePool>,
    input: NoteInput,
) -> Result<Note, String> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        r#"
        INSERT INTO notes (id, title, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        "#
    )
    .bind(&id)
    .bind(&input.title)
    .bind(&input.description)
    .bind(&now)
    .bind(&now)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    // Return the created note
    let note = sqlx::query_as::<_, Note>(
        "SELECT id, title, description, created_at, updated_at FROM notes WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(note)
}

#[tauri::command]
async fn update_note(
    pool: tauri::State<'_, SqlitePool>,
    id: String,
    input: NoteInput,
) -> Result<Note, String> {
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        r#"
        UPDATE notes SET title = ?, description = ?, updated_at = ?
        WHERE id = ?
        "#
    )
    .bind(&input.title)
    .bind(&input.description)
    .bind(&now)
    .bind(&id)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    // Return the updated note
    let note = sqlx::query_as::<_, Note>(
        "SELECT id, title, description, created_at, updated_at FROM notes WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(note)
}

#[tauri::command]
async fn delete_note(pool: tauri::State<'_, SqlitePool>, id: String) -> Result<(), String> {
    sqlx::query("DELETE FROM notes WHERE id = ?")
        .bind(&id)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn get_tasks(
    pool: tauri::State<'_, SqlitePool>,
    from_date: Option<String>,
) -> Result<Vec<TaskRow>, String> {
    let tasks = if let Some(from) = from_date {
        sqlx::query_as::<_, TaskRow>(
            "SELECT id, title, notes, priority, due_date, due_time, duration, completed, created_at, updated_at FROM tasks WHERE due_date >= ? ORDER BY due_date ASC, due_time ASC"
        )
        .bind(&from)
        .fetch_all(pool.inner())
        .await
        .map_err(|e| e.to_string())?
    } else {
        sqlx::query_as::<_, TaskRow>(
            "SELECT id, title, notes, priority, due_date, due_time, duration, completed, created_at, updated_at FROM tasks ORDER BY created_at DESC"
        )
        .fetch_all(pool.inner())
        .await
        .map_err(|e| e.to_string())?
    };

    Ok(tasks)
}

#[tauri::command]
async fn create_task(
    pool: tauri::State<'_, SqlitePool>,
    input: TaskInput,
) -> Result<TaskRow, String> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        r#"
        INSERT INTO tasks (id, title, notes, priority, due_date, due_time, duration, completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&id)
    .bind(&input.title)
    .bind(&input.notes)
    .bind(input.priority)
    .bind(&input.due_date)
    .bind(&input.due_time)
    .bind(input.duration)
    .bind(input.completed.unwrap_or(false))
    .bind(&now)
    .bind(&now)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    // Return the created task
    let task = sqlx::query_as::<_, TaskRow>(
        "SELECT id, title, notes, priority, due_date, due_time, duration, completed, created_at, updated_at FROM tasks WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(task)
}

#[tauri::command]
async fn update_task(
    pool: tauri::State<'_, SqlitePool>,
    id: String,
    input: TaskInput,
) -> Result<TaskRow, String> {
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        r#"
        UPDATE tasks SET title = ?, notes = ?, priority = ?, due_date = ?, due_time = ?, duration = ?, completed = ?, updated_at = ?
        WHERE id = ?
        "#
    )
    .bind(&input.title)
    .bind(&input.notes)
    .bind(input.priority)
    .bind(&input.due_date)
    .bind(&input.due_time)
    .bind(input.duration)
    .bind(input.completed.unwrap_or(false))
    .bind(&now)
    .bind(&id)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    // Return the updated task
    let task = sqlx::query_as::<_, TaskRow>(
        "SELECT id, title, notes, priority, due_date, due_time, duration, completed, created_at, updated_at FROM tasks WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(task)
}

#[tauri::command]
async fn delete_task(pool: tauri::State<'_, SqlitePool>, id: String) -> Result<(), String> {
    sqlx::query("DELETE FROM tasks WHERE id = ?")
        .bind(&id)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// TimeBlock commands
#[tauri::command]
async fn get_time_blocks(
    pool: tauri::State<'_, SqlitePool>,
    date: Option<String>,
) -> Result<Vec<TimeBlockRow>, String> {
    let time_blocks = if let Some(from) = date {
        sqlx::query_as::<_, TimeBlockRow>(
            "SELECT id, task_id, start_date, start_time, duration, created_at, updated_at FROM time_blocks WHERE start_date = ? ORDER BY start_time ASC"
        )
        .bind(&from)
        .fetch_all(pool.inner())
        .await
        .map_err(|e| e.to_string())?
    } else {
        sqlx::query_as::<_, TimeBlockRow>(
            "SELECT id, task_id, start_date, start_time, duration, created_at, updated_at FROM time_blocks ORDER BY start_date ASC, start_time ASC"
        )
        .fetch_all(pool.inner())
        .await
        .map_err(|e| e.to_string())?
    };
    Ok(time_blocks)
}

async fn setup_db(app_handle: &tauri::AppHandle) -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let app_dir = app_handle.path().app_data_dir()?;
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir)?;
    }
    let db_path = app_dir.join("nota.db");

    let db_url = format!("sqlite:{}", db_path.display());

    // Create the database file if it doesn't exist
    if !db_path.exists() {
        fs::File::create(&db_path)?;
    }

    let pool = SqlitePool::connect(&db_url).await?;

    sqlx::migrate!().run(&pool).await?;

    Ok(pool)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            tauri::async_runtime::block_on(async move {
                let pool = setup_db(&app_handle)
                    .await
                    .expect("Failed to setup database");
                app_handle.manage(pool);
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_notes,
            create_note,
            update_note,
            delete_note,
            get_tasks,
            create_task,
            update_task,
            delete_task,
            get_time_blocks
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
