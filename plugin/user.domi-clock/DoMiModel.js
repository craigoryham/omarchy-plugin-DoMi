// DoMi agenda helpers for the domi-clock widget.
// Pure functions, no Qt dependency — testable under node.

// Parse the blocks.json file written by block-sync.
function parseBlocksFile(text) {
  if (!text || typeof text !== "string") return []
  try {
    var data = JSON.parse(text)
    return Array.isArray(data.blocks) ? data.blocks : []
  } catch (e) {
    return []
  }
}

// "YYYY-MM-DD" key for a Date or { year, month, day }.
function dateKeyFromDate(date) {
  var y = date.getFullYear()
  var m = date.getMonth() + 1
  var d = date.getDate()
  return y + "-" + (m < 10 ? "0" : "") + m + "-" + (d < 10 ? "0" : "") + d
}

// Filter blocks to a specific day, sorted by startMinute.
function filterDay(blocks, dateKey) {
  var key = String(dateKey || "")
  return blocks
    .filter(function(b) { return b.date === key })
    .sort(function(a, b) { return a.startMinute - b.startMinute })
}

// The next block whose time range includes or is after nowMs.
function nextEvent(blocks, nowMs) {
  var now = new Date(nowMs)
  var todayKey = dateKeyFromDate(now)
  var todayBlocks = filterDay(blocks, todayKey)
  var nowMinutes = now.getHours() * 60 + now.getMinutes()

  for (var i = 0; i < todayBlocks.length; i++) {
    var b = todayBlocks[i]
    var endMinute = b.startMinute + (b.durationMin || 0)
    if (endMinute > nowMinutes) return b
  }
  return null
}

// Minutes since midnight → "HH:mm".
function formatTime(minutes) {
  var h = Math.floor(minutes / 60)
  var m = minutes % 60
  return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m
}

// Duration in minutes → "1h 30m" or "45m".
function formatDuration(minutes) {
  if (minutes < 60) return minutes + "m"
  var h = Math.floor(minutes / 60)
  var m = minutes % 60
  return h + "h" + (m > 0 ? " " + m + "m" : "")
}

// Countdown text for a block relative to nowMs.
function countdownText(block, nowMs) {
  if (!block) return ""
  var now = new Date(nowMs)
  var nowMinutes = now.getHours() * 60 + now.getMinutes()
  var start = block.startMinute
  var end = start + (block.durationMin || 0)

  if (nowMinutes >= start && nowMinutes < end) return "now"
  if (nowMinutes >= end) return "done"
  var diff = start - nowMinutes
  if (diff <= 60) return "in " + diff + "m"
  var h = Math.floor(diff / 60)
  var m = diff % 60
  return "in " + h + "h" + (m > 0 ? " " + m + "m" : "")
}

// Time range string: "09:00 – 10:30".
function formatRange(block) {
  return formatTime(block.startMinute) + " – " + formatTime(block.startMinute + (block.durationMin || 0))
}

// Number of blocks for a given date key.
function countDay(blocks, dateKey) {
  var key = String(dateKey || "")
  var count = 0
  for (var i = 0; i < blocks.length; i++) {
    if (blocks[i].date === key) count++
  }
  return count
}

if (typeof module !== "undefined") {
  module.exports = {
    parseBlocksFile: parseBlocksFile,
    dateKeyFromDate: dateKeyFromDate,
    filterDay: filterDay,
    nextEvent: nextEvent,
    formatTime: formatTime,
    formatDuration: formatDuration,
    countdownText: countdownText,
    formatRange: formatRange,
    countDay: countDay,
  }
}
