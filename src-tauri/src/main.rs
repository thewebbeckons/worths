// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

/// Application entry point that starts the application by delegating to `app_lib::run()`.
///
/// # Examples
///
/// ```
/// // Starts the application (delegates to `app_lib::run`)
/// main();
/// ```
fn main() {
  app_lib::run();
}