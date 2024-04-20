const CALENDAR_ID = 'uecrail@gmail.com'; //カレンダーID

// # calendar にお知らせ
function postDiscordbot(text) {
  // discord側で作成したボットのウェブフックURL
  const discordWebHookURL = "https://discord.com/api/webhooks/xxxxxxxxxx";

  // 投稿するチャット内容と設定
  const message = {
    "content": text, // チャット本文
    "tts": false  // ロボットによる読み上げ機能を無効化
  }

  const param = {
    "method": "POST",
    "headers": { 'Content-type': "application/json" },
    "payload": JSON.stringify(message)
  }

  UrlFetchApp.fetch(discordWebHookURL, param);
}

// 今日の0時を返す
function getDate0() {
  const date = new Date();
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}

// 今日の23時59分を返す
function getDate2359() {
  var date = new Date();
  date.setHours(23)
  date.setMinutes(59)
  date.setSeconds(0)
  date.setMilliseconds(0)
  return date
}

// 3日後の0時を返す
function getDateAfter3_0() {
  var date = new Date()
  date.setDate(date.getDate() + 3);
  date.setHours(0)
  date.setMinutes(0)
  date.setSeconds(0)
  date.setMilliseconds(0)
  return date
}

// 3日後の23時59分を返す
function getDateAfter3_2359() {
  var date = new Date()
  date.setDate(date.getDate() + 3);
  date.setHours(23)
  date.setMinutes(59)
  date.setSeconds(0)
  date.setMilliseconds(0)
  return date
}

// eventの日付・曜日・時刻を返す。
function getTime(event){
  var year_month_day = Utilities.formatDate(event.getStartTime(), "Asia/Tokyo", "yyyy/MM/dd").split("/")
  var time1 = Utilities.formatDate(event.getStartTime(), "Asia/Tokyo", "HH:mm")
  var year1 = parseInt(year_month_day[0])
  var month1 = parseInt(year_month_day[1])
  var day1 = parseInt(year_month_day[2])
  var date01 = Moment.moment(String(year1)+"年"+String(month1)+"月"+String(day1)+"日","YYYY年M月D日")
  var dayArray = ["日", "月","火","水","木","金","土"];
  var dayNum = date01.format("d")
  var event_time = [year_month_day, dayArray[dayNum], time1]
  return event_time
}

// eventのdescriptionを整形する。
function event_description_convert(event){
  meeting_contents = event.getDescription()
  if (meeting_contents != ""){
    meeting_contents = meeting_contents.replace(/<br>/g, "\n").replace(/<html-blob>/g, "").replace(/<\/html-blob>/g, "").replace(/<u>/g, "").replace(/<.u>/g, "").replace(/&nbsp;/g, " ").replace(/<a href=".*">/g,"").replace(/<\/a>/g,"")
  }
  return meeting_contents
}

// event_dateの時刻 > now_timeの時刻 のとき、event_date と now_time の差分を秒単位で返す。
function getTimeDiff(event_date, now_time){

  // eventの日時情報
  var year1 = event_date.getFullYear()
  var month1 = event_date.getMonth() + 1
  var day1 = event_date.getDate()
  var hour1 = event_date.getHours()
  var min1 = event_date.getMinutes()
  var sec1 = event_date.getSeconds()
  var date01 = Moment.moment(String(year1)+"年"+String(month1)+"月"+String(day1)+"日","YYYY年M月D日");
  
  // 現在の日時情報
  var year2 = now_time.getFullYear()
  var month2 = now_time.getMonth() + 1
  var day2 = now_time.getDate()
  var hour2 = now_time.getHours()
  var min2 = now_time.getMinutes()
  var sec2 = now_time.getSeconds()
  var date02 = Moment.moment(String(year2)+"年"+String(month2)+"月"+String(day2)+"日","YYYY年M月D日");

  var day_diff = date01.diff(date02,"days");
  var hour_diff = hour1 - hour2
  if (hour_diff < 0){
    hour_diff += 24
    day_diff -= 1
  }
  var min_diff = min1 - min2
  if (min_diff<0){
    min_diff += 60
    hour_diff -= 1
  }
  var sec_diff = sec1 - sec2
  if (sec_diff<0){
    sec_diff += 60
    min_diff -= 1
  }
  return day_diff * 24 * 3600 + hour_diff * 3600 + min_diff * 60 + sec_diff
}

function getFileByName(file_name, folder) {
  var files = DriveApp.getFolderById(folder.getId()).getFilesByName(file_name);
  while (files.hasNext()) {
    // 一つ目のファイルを返す（複数存在した場合は考慮しない）
    return files.next();
  }
  return null;
}

// 毎日18時に3日後の予定を通知する関数
function calendar_notification_after3(){
  const calendarId = CALENDAR_ID;
  var cal = CalendarApp.getCalendarById(calendarId)
  var events_list = cal.getEvents(getDateAfter3_0(), getDateAfter3_2359()) // 3日後の予定を取得
  var num_events = events_list.length
  for (var i = 0; i<num_events; ++i){
    var event = events_list[i]
    var splitEventId = event.getId().split('@')
    var eventURL = "https://www.google.com/calendar/event?eid=" + Utilities.base64Encode(splitEventId[0] + " " + calendarId).toString().replace(/=+/,'')
    meeting_contents = event_description_convert(event)
    var txts = [
      Utilities.formatString("%s", event.getTitle()),
      Utilities.formatString("\n"),
      Utilities.formatDate(event.getStartTime(), "JST", "yyyy/MM/dd"),
      Utilities.formatString("(%s) ", getTime(event)[1]),
      Utilities.formatDate(event.getStartTime(), "JST", "HH:mm"),
      Utilities.formatString("\n"),
      Utilities.formatString("%s\n", eventURL)
    ];
    var txt = txts.join("");
    postDiscordbot(txt)
  }
}

// 毎日9時に当日の予定を通知する関数
function calendar_notification_today(){
  const calendarId = CALENDAR_ID;
  var cal = CalendarApp.getCalendarById(calendarId)
  var events_list = cal.getEvents(getDate0(), getDate2359()) // 当日の予定を取得
  var num_events = events_list.length
  for (var i = 0; i<num_events; ++i){
    var event = events_list[i]
    var splitEventId = event.getId().split('@')
    var eventURL = "https://www.google.com/calendar/event?eid=" + Utilities.base64Encode(splitEventId[0] + " " + calendarId).toString().replace(/=+/,'')
    meeting_contents = event_description_convert(event)
    var txts = [
      Utilities.formatString("%s", event.getTitle()),
      Utilities.formatString("\n"),
      Utilities.formatDate(event.getStartTime(), "JST", "yyyy/MM/dd"),
      Utilities.formatString("(%s) ", getTime(event)[1]),
      Utilities.formatDate(event.getStartTime(), "JST", "HH:mm"),
      Utilities.formatString("\n"),
      Utilities.formatString("%s\n", eventURL)
    ];
    var txt = txts.join("");
    postDiscordbot(txt)
  }
}
