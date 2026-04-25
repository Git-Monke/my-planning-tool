use sqlx::{FromRow, SqlitePool};
use serde::{Deserialize, Serialize};
use std::fs;
use tauri::Manager;
use uuid::Uuid;

// Task row structure for database queries
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TaskRow {
    pub id: String,
    pub title: String,
    pub notes: Option<String>,
    pub priority: Option<i32>,
    pub due_date: Option<String>,
    pub due_time: Option<String>,
    pub start_time: Option<String>,
    pub duration: Option<i32>,
    pub completed: bool,
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

#[tauri::command]
async fn get_tasks(pool: tauri::State<'_, SqlitePool>) -> Result<Vec<TaskRow>, String> {
    let tasks = sqlx::query_as::<_, TaskRow>(
        "SELECT id, title, notes, priority, due_date, due_time, start_time, duration, completed, created_at, updated_at FROM tasks ORDER BY created_at DESC"
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(tasks)
}

#[tauri::command]
async fn create_task(pool: tauri::State<'_, SqlitePool>, input: TaskInput) -> Result<TaskRow, String> {
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
        "SELECT id, title, notes, priority, due_date, due_time, start_time, duration, completed, created_at, updated_at FROM tasks WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(task)
}

#[tauri::command]
async fn update_task(pool: tauri::State<'_, SqlitePool>, id: String, input: TaskInput) -> Result<TaskRow, String> {
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
        "SELECT id, title, notes, priority, due_date, due_time, start_time, duration, completed, created_at, updated_at FROM tasks WHERE id = ?"
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
        .invoke_handler(tauri::generate_handler![greet, get_tasks, create_task, update_task, delete_task])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
