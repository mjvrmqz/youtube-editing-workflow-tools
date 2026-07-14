// toggle_claude.jsx
var script = 'tell application "System Events"\n' +
  'set isFront to (name of first process whose frontmost is true) is "Claude"\n' +
  'end tell\n' +
  'if isFront then\n' +
  'tell application "System Events" to set visible of process "Claude" to false\n' +
  'else\n' +
  'tell application "Claude" to activate\n' +
  'end if';
system.callSystem('osascript -e \'' + script.replace(/'/g, "'\\''") + '\'');