/// Entry point for the Cargo build script that runs Tauri's build routine.
///
/// # Examples
///
/// ```no_run
/// // Invoked automatically by Cargo during the build; calling directly will run the Tauri build step.
/// // In a crate context you can call `main()` to execute the same behavior.
/// fn example() {
///     crate::main();
/// }
/// ```
fn main() {
  tauri_build::build()
}