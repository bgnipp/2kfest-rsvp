-- Sends one message via Messages.app.
-- Usage: osascript send.applescript "<recipient>" "<message>" "<service>"
--   <recipient> : phone number in E.164 (e.g. +15103685413) or an email/Apple ID
--   <message>   : the text to send (UTF-8, emoji OK)
--   <service>   : "iMessage" (default) or "SMS"
--
-- Notes:
--   * SMS only works if your iPhone has Text Message Forwarding enabled for this
--     Mac (Settings → Messages → Text Message Forwarding). Otherwise use iMessage.
--   * The first run will trigger a macOS Automation permission prompt for
--     controlling Messages — approve it (System Settings → Privacy & Security →
--     Automation).

on run argv
	set targetNumber to item 1 of argv
	set targetMessage to item 2 of argv
	set serviceName to "iMessage"
	if (count of argv) > 2 then set serviceName to item 3 of argv

	tell application "Messages"
		if serviceName is "SMS" then
			set targetService to 1st service whose service type = SMS
		else
			set targetService to 1st service whose service type = iMessage
		end if
		set targetBuddy to buddy targetNumber of targetService
		send targetMessage to targetBuddy
	end tell
end run
