/// Starts the Tauri application configured for this crate.
///
/// In debug builds, registers the logging plugin with log level `Info` on the application handle.
/// This function will panic with "error while running tauri application" if the application fails to start.
///
/// # Examples
///
/// ```no_run
/// fn main() {
///     my_crate::run();
/// }
/// ```
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}