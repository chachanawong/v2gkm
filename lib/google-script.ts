const DEFAULT_GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzhQemA6bx5bYJGi3_LW2RYkOeIJuoqyuXHK_3TVl9rbN-WUmVeDGwxe_VF1S4OvCai/exec";

export function getGoogleScriptUrl() {
  return process.env.GOOGLE_SCRIPT_URL || DEFAULT_GOOGLE_SCRIPT_URL;
}
