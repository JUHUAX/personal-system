import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class StaticRegressionTests(unittest.TestCase):
    def read(self, name):
        return (ROOT / name).read_text(encoding="utf-8")

    def test_manifest_and_timeline_ids_are_valid(self):
        json.loads(self.read("manifest.json"))
        ids = re.findall(r'\bid="([^"]+)"', self.read("timeline.html"))
        self.assertEqual(len(ids), len(set(ids)))

    def test_grid_todo_event_does_not_rebuild_today_card(self):
        source = self.read("timeline.js")
        handler = source.split('window.addEventListener("minimal-pomodoro-grid-todos"', 1)[1]
        handler = handler.split("recordForm.addEventListener", 1)[0]
        self.assertNotIn("renderToday()", handler)

    def test_work_record_creation_is_always_awaited(self):
        source = self.read("controller.js")
        calls = re.findall(r"^(\s*)(.*?)beginWorkRecord\(\);", source, re.MULTILINE)
        self.assertTrue(calls)
        self.assertTrue(all("await " in prefix for _, prefix in calls))

    def test_daily_review_supports_review_only_fallback(self):
        source = self.read("notion-client.js")
        self.assertIn('"generateNextTodos=false', source)
        self.assertIn("nextTodoSkipped: !generateNextTodos", source)
        self.assertLess(source.index("await writeDailyReview(dateKey"), source.index("await upsertDailyTodos(nextTodoDate"))

    def test_queue_and_timer_have_concurrency_guards(self):
        notion_source = self.read("notion-client.js")
        controller_source = self.read("controller.js")
        self.assertIn("withWriteQueueLock", notion_source)
        self.assertIn("phaseTransitionPromise", controller_source)

    def test_today_workspace_replaces_separate_pomodoro_navigation(self):
        html = self.read("timeline.html")
        timeline_source = self.read("timeline.js")
        self.assertNotIn('id="pomodoroMode"', html)
        self.assertIn('id="startPomodoroBtn"', html)
        self.assertIn('id="prevDayBtn"', html)
        self.assertIn('id="nextDayBtn"', html)
        self.assertIn("selectedTodayDate", timeline_source)

    def test_action_opens_compact_today_workspace(self):
        background_source = self.read("background.js")
        css_source = self.read("timeline.css")
        self.assertIn('timeline.html?mode=today&compact=1', background_source)
        self.assertIn('type: "popup"', background_source)
        for selector in [".mode-navigation", ".week-navigation", ".today-phase-plan-dock", ".flow-review-section"]:
            hidden = rf"body\.compact-today-window[^{{}}]*{re.escape(selector)}[^{{}}]*\{{[^{{}}]*display:\s*none"
            self.assertNotRegex(css_source, hidden)

    def test_saved_pomodoro_reviews_are_queued_into_completion(self):
        background_source = self.read("background.js")
        controller_source = self.read("controller.js")
        self.assertIn("SYNC_POMODORO_REVIEWS_TO_COMPLETION", controller_source)
        save_function = controller_source.split("async function saveReviewPanel", 1)[1]
        save_function = save_function.split("async function scheduleGlobalReviewReminder", 1)[0]
        self.assertIn("reviewSaveInFlight", save_function)
        self.assertIn("closeReviewPanel()", save_function)
        self.assertIn("syncPomodoroReviewsToCompletionInBackground", save_function)
        self.assertNotIn("await chrome.runtime.sendMessage", save_function)
        self.assertIn("syncPomodoroReviewsToCompletion", background_source)
        self.assertIn("queueDailyCompletion(dateKey, completion)", background_source)

    def test_record_editor_uses_completion_and_can_restart_recorded_work(self):
        html = self.read("timeline.html")
        timeline_source = self.read("timeline.js")
        css_source = self.read("timeline.css")
        self.assertNotIn('id="recordNote"', html)
        self.assertIn('id="recordReviewNote"', html)
        self.assertIn("完成情况", html)
        self.assertIn('data-action="start-pomodoro"', html)
        self.assertIn("startPomodoroFromRecord", timeline_source)
        start_function = timeline_source.split("async function startPomodoroFromRecord", 1)[1]
        start_function = start_function.split("async function copyDisplayRecord", 1)[0]
        self.assertIn("closeRecordEditor()", start_function)
        self.assertIn(".record-form textarea:focus-visible", css_source)
        self.assertIn("outline: none", css_source)
        self.assertNotIn("record.note ? ` · 备注", timeline_source)
        self.assertNotIn("评价备注：", timeline_source)

    def test_review_sync_keeps_only_completion_text(self):
        source = self.read("background.js")
        controller_source = self.read("controller.js")
        sync_function = source.split("async function syncPomodoroReviewsToCompletion", 1)[1]
        sync_function = sync_function.split("async function prepareControllerForTodo", 1)[0]
        self.assertIn("String(record.reviewNote || \"\").trim()", sync_function)
        self.assertIn("uniqueReviewLines(records)", sync_function)
        self.assertIn("filterNewReviewLines", sync_function)
        self.assertIn("appendReviewLines", sync_function)
        self.assertIn("formatReviewRecordTime(record)", sync_function)
        self.assertIn("stripReviewTimePrefix", sync_function)
        self.assertIn("clearReviewForContinuedWork(previousWork)", controller_source)
        self.assertNotIn('join("\\n\\n")', sync_function)
        self.assertNotIn("【番茄评价汇总】", sync_function)
        self.assertNotIn("完成度${", sync_function)

    def test_title_and_duration_auto_completes_todos_and_persists_switches(self):
        source = self.read("notion-integration.js")
        background_source = self.read("background.js")
        self.assertIn("autoCompleteTodosForDate", source)
        self.assertIn("pendingTodoQueueKeys(dateKey)", source)
        self.assertIn("todoHasPendingQueueEntry(todo, pendingTodoKeys)", source)
        self.assertIn("{ ...todo, pendingSync: false }", source)
        self.assertIn("todoTitleMatchesRecord(todo, record)", source)
        self.assertIn("matchedMinutes >= todoAutoCompleteThresholdMinutes(todo)", source)
        self.assertIn("todoAutoCompleteThresholdMinutes(todo)", background_source)
        self.assertIn('status: "done", pendingSync: true', source)
        self.assertIn("minimalPomodoroTimeline:", source)
        self.assertIn("persistAutomationSettings", source)
        self.assertIn("intradayAdjustmentEnabled.addEventListener(\"change\", persistAutomationSettings)", source)
        self.assertIn("autoCompletePlannedTodosFromRecords", background_source)
        self.assertIn("await autoCompletePlannedTodosFromRecords(changedTimelineDates)", background_source)

    def test_inspiration_records_have_daily_and_weekly_surfaces(self):
        html = self.read("timeline.html")
        source = self.read("timeline.js")
        css = self.read("timeline.css")
        self.assertIn('id="historyInspirationMode"', html)
        self.assertIn('id="inspirationBoard"', html)
        self.assertIn("minimalPomodoroInspirations:", source)
        self.assertIn('data-flow-role="inspiration"', source)
        self.assertIn("renderInspirations", source)
        self.assertIn(".inspiration-card", css)

    def test_pip_progress_slider_is_removed(self):
        source = self.read("controller.js")
        self.assertNotIn('id="progress"', source)
        self.assertNotIn("pip.progress", source)

    def test_custom_record_types_and_drag_copy_controls_exist(self):
        html = self.read("timeline.html")
        source = self.read("timeline.js")
        self.assertIn('id="addTimelineTypeBtn"', html)
        self.assertIn('id="recordType"', html)
        self.assertIn("CUSTOM_TIMELINE_TYPES_KEY", source)
        self.assertIn("addCustomTimelineType", source)
        self.assertIn("refreshTimelineTypeControls", source)
        self.assertIn("beginRecordDrag", source)
        self.assertIn("copyDisplayRecord", source)

    def test_natural_language_record_backfill_is_local_first_and_notion_synced(self):
        html = self.read("timeline.html")
        timeline_source = self.read("timeline.js")
        notion_source = self.read("notion-client.js")
        self.assertIn('id="openSupplementRecordsBtn"', html)
        self.assertIn('id="supplementRecordOverlay"', html)
        self.assertIn('"time_record.parse"', notion_source)
        self.assertIn("parseNaturalLanguageTimeRecords", notion_source)
        self.assertIn("todoAutoCompleteEligible: false", timeline_source)
        self.assertLess(
            timeline_source.index("await chrome.storage.local.set({ [key]: [...existing, ...generated]"),
            timeline_source.index("await api.syncRecords(generated.map")
        )

    def test_manual_time_records_do_not_auto_complete_todos(self):
        timeline_source = self.read("timeline.js")
        controller_source = self.read("controller.js")
        background_source = self.read("background.js")
        integration_source = self.read("notion-integration.js")
        self.assertIn("todoAutoCompleteEligible: type === \"work\"", controller_source)
        self.assertIn("todoAutoCompleteEligible: existingRecord", timeline_source)
        self.assertIn("record.todoAutoCompleteEligible !== false", background_source)
        self.assertIn("record.automatic !== false", background_source)
        self.assertIn("record.todoAutoCompleteEligible !== false", integration_source)

    def test_record_editor_uses_custom_time_picker(self):
        html = self.read("timeline.html")
        source = self.read("timeline.js")
        css = self.read("timeline.css")
        self.assertIn('id="customTimePicker"', html)
        self.assertIn("openCustomTimePicker", source)
        self.assertNotIn("openNativeTimePicker", source)
        self.assertIn(".custom-time-picker", css)


if __name__ == "__main__":
    unittest.main()
