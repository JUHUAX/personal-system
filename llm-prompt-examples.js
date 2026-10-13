// V2 code-managed source: shared fragments and recipes, not compiled prompt copies.
(function(root) {
  "use strict";
  const data = {
  "fixtureTemplates": {
    "F.PROFILE_STANDARD": {
      "timezone": "Asia/Shanghai",
      "pomodoroSettings": {
        "workMinutes": 30,
        "breakMinutes": 5
      },
      "workWindows": [
        {
          "weekdays": [
            1,
            2,
            3,
            4,
            5
          ],
          "start": "09:00",
          "end": "12:00"
        }
      ],
      "routineBlocks": [],
      "dateOverrides": [],
      "preferenceNote": ""
    },
    "F.PLAN_PERCENTAGE_3D": {
      "planId": "example:phase:reading",
      "title": "阶段阅读",
      "startDate": "2026-11-02",
      "endDate": "2026-11-04",
      "description": "本阶段推进阅读。没有具体每日内容安排。",
      "constraints": "",
      "milestones": [
        {
          "date": "2026-11-02",
          "planningMode": "percentage",
          "targetProgressPercent": 33.3,
          "goal": "推进阶段阅读至累计计划33.3%",
          "deliverables": [],
          "taskEstimates": [],
          "estimatedMinutes": null,
          "notes": "按三个等容量工作日分配，仅计划目标，耗时未知。",
          "taskProgress": [
            {
              "taskId": "example:task:阶段阅读",
              "title": "阶段阅读",
              "targetProgressPercent": 33.3
            }
          ]
        },
        {
          "date": "2026-11-03",
          "planningMode": "percentage",
          "targetProgressPercent": 66.7,
          "goal": "推进阶段阅读至累计计划66.7%",
          "deliverables": [],
          "taskEstimates": [],
          "estimatedMinutes": null,
          "notes": "承接前一日计划比例，不表示实际已完成。",
          "taskProgress": [
            {
              "taskId": "example:task:阶段阅读",
              "title": "阶段阅读",
              "targetProgressPercent": 66.7
            }
          ]
        },
        {
          "date": "2026-11-04",
          "planningMode": "percentage",
          "targetProgressPercent": 100,
          "goal": "推进阶段阅读至累计计划100%",
          "deliverables": [],
          "taskEstimates": [],
          "estimatedMinutes": null,
          "notes": "阶段结束计划目标，不保证真实完成。",
          "taskProgress": [
            {
              "taskId": "example:task:阶段阅读",
              "title": "阶段阅读",
              "targetProgressPercent": 100
            }
          ]
        }
      ],
      "adjustments": []
    },
    "F.PLAN_EXPLICIT_2D": {
      "planId": "example:phase:reading",
      "title": "阶段阅读",
      "startDate": "2026-11-02",
      "endDate": "2026-11-03",
      "description": "第1天读完资料A，预计专注60分钟；第2天读完资料B，预计专注30分钟。",
      "constraints": "",
      "milestones": [
        {
          "date": "2026-11-02",
          "planningMode": "explicit",
          "targetProgressPercent": 100,
          "goal": "读完资料A（预期100%）",
          "deliverables": [],
          "taskEstimates": [
            {
              "title": "阅读资料A",
              "estimatedMinutes": 60,
              "deliverable": "资料A阅读完成"
            }
          ],
          "estimatedMinutes": 60,
          "notes": "沿用用户第1天安排及专注时长。",
          "taskProgress": [
            {
              "taskId": "example:task:阅读资料A",
              "title": "阅读资料A",
              "targetProgressPercent": 100
            }
          ]
        },
        {
          "date": "2026-11-03",
          "planningMode": "explicit",
          "targetProgressPercent": 100,
          "goal": "读完资料B（预期100%）",
          "deliverables": [],
          "taskEstimates": [
            {
              "title": "阅读资料B",
              "estimatedMinutes": 30,
              "deliverable": "资料B阅读完成"
            }
          ],
          "estimatedMinutes": 30,
          "notes": "沿用用户第2天安排，不增加额外交付物。",
          "taskProgress": [
            {
              "taskId": "example:task:阅读资料B",
              "title": "阅读资料B",
              "targetProgressPercent": 100
            }
          ]
        }
      ],
      "adjustments": []
    },
    "F.PLAN_MIXED_3D": {
      "planId": "example:phase:reading",
      "title": "阶段阅读",
      "startDate": "2026-11-02",
      "endDate": "2026-11-04",
      "description": "本阶段推进阅读。第1天读完资料A，其余日期没有具体安排。",
      "constraints": "",
      "milestones": [
        {
          "date": "2026-11-02",
          "planningMode": "explicit",
          "targetProgressPercent": 100,
          "goal": "读完资料A",
          "deliverables": [],
          "taskEstimates": [],
          "estimatedMinutes": null,
          "notes": "沿用用户安排；没有足够信息估计工作量。",
          "taskProgress": [
            {
              "taskId": "example:task:阅读资料A",
              "title": "阅读资料A",
              "targetProgressPercent": 100
            }
          ]
        },
        {
          "date": "2026-11-03",
          "planningMode": "percentage",
          "targetProgressPercent": 50,
          "goal": "推进阶段阅读至累计计划50%",
          "deliverables": [],
          "taskEstimates": [],
          "estimatedMinutes": null,
          "notes": "对未明确安排日期等额分配，不推断资料A的进度份额。",
          "taskProgress": [
            {
              "taskId": "example:task:阶段阅读",
              "title": "阶段阅读",
              "targetProgressPercent": 50
            }
          ]
        },
        {
          "date": "2026-11-04",
          "planningMode": "percentage",
          "targetProgressPercent": 100,
          "goal": "推进阶段阅读至累计计划100%",
          "deliverables": [],
          "taskEstimates": [],
          "estimatedMinutes": null,
          "notes": "阶段计划目标，实际进度和耗时未知。",
          "taskProgress": [
            {
              "taskId": "example:task:阶段阅读",
              "title": "阶段阅读",
              "targetProgressPercent": 100
            }
          ]
        }
      ],
      "adjustments": []
    },
    "F.PLAN_EXPLICIT_CLOCK_2D": {
      "planId": "example:phase:reading",
      "title": "阶段阅读",
      "startDate": "2026-11-02",
      "endDate": "2026-11-03",
      "description": "第1天09:00至09:30读完短资料A，专注30分钟；第2天继续阅读，未给具体内容。",
      "constraints": "",
      "milestones": [
        {
          "date": "2026-11-02",
          "planningMode": "explicit",
          "targetProgressPercent": 100,
          "goal": "读完短资料A",
          "deliverables": [],
          "taskEstimates": [
            {
              "title": "阅读短资料A",
              "estimatedMinutes": 30,
              "deliverable": "短资料A阅读完成"
            }
          ],
          "estimatedMinutes": 30,
          "notes": "用户明确指定时段和专注时长。",
          "taskProgress": [
            {
              "taskId": "example:task:阅读短资料A",
              "title": "阅读短资料A",
              "targetProgressPercent": 100
            }
          ]
        },
        {
          "date": "2026-11-03",
          "planningMode": "percentage",
          "targetProgressPercent": 100,
          "goal": "推进阶段阅读至累计计划100%",
          "deliverables": [],
          "taskEstimates": [],
          "estimatedMinutes": null,
          "notes": "仅计划目标。",
          "taskProgress": [
            {
              "taskId": "example:task:阶段阅读",
              "title": "阶段阅读",
              "targetProgressPercent": 100
            }
          ]
        }
      ],
      "adjustments": []
    },
    "F.PLAN_MATERIALS_1D": {
      "planId": "example:phase:materials",
      "title": "资料阅读",
      "startDate": "2026-11-03",
      "endDate": "2026-11-03",
      "description": "今天阅读资料A、B、C，每项预计专注30分钟，优先保证A。",
      "constraints": "",
      "milestones": [
        {
          "date": "2026-11-03",
          "planningMode": "explicit",
          "targetProgressPercent": null,
          "goal": "阅读资料A、B、C",
          "deliverables": [],
          "taskEstimates": [
            {
              "title": "阅读资料A",
              "estimatedMinutes": 30,
              "deliverable": ""
            },
            {
              "title": "阅读资料B",
              "estimatedMinutes": 30,
              "deliverable": ""
            },
            {
              "title": "阅读资料C",
              "estimatedMinutes": 30,
              "deliverable": ""
            }
          ],
          "estimatedMinutes": 90,
          "notes": "用户明确指定事项及每项专注时长。",
          "taskProgress": [
            {
              "taskId": "example:task:阅读资料A",
              "title": "阅读资料A",
              "targetProgressPercent": 100
            },
            {
              "taskId": "example:task:阅读资料B",
              "title": "阅读资料B",
              "targetProgressPercent": 100
            },
            {
              "taskId": "example:task:阅读资料C",
              "title": "阅读资料C",
              "targetProgressPercent": 100
            }
          ]
        }
      ],
      "adjustments": []
    },
    "F.TODOS_MATERIALS": [
      {
        "id": "example:todo:C",
        "planningMode": "explicit",
        "targetProgressPercent": 100,
        "effortBasis": "task_estimate",
        "title": "阅读资料C",
        "details": "完成用户安排的阅读资料C，预计专注30分钟。",
        "priority": "medium",
        "estimatedPomodoros": 1,
        "source": "用户原待办",
        "plannedStart": "2026-11-03T09:00:00+08:00",
        "plannedEnd": "2026-11-03T09:30:00+08:00",
        "origin": "user",
        "status": "done",
        "phaseTaskId": "example:task:阅读资料C"
      },
      {
        "id": "example:todo:A",
        "planningMode": "explicit",
        "targetProgressPercent": 100,
        "effortBasis": "task_estimate",
        "title": "阅读资料A",
        "details": "完成用户安排的阅读资料A，预计专注30分钟。",
        "priority": "high",
        "estimatedPomodoros": 1,
        "source": "用户原待办",
        "plannedStart": "2026-11-03T09:30:00+08:00",
        "plannedEnd": "2026-11-03T10:00:00+08:00",
        "origin": "user",
        "status": "pending",
        "phaseTaskId": "example:task:阅读资料A"
      },
      {
        "id": "example:todo:B",
        "planningMode": "explicit",
        "targetProgressPercent": 100,
        "effortBasis": "task_estimate",
        "title": "阅读资料B",
        "details": "完成用户安排的阅读资料B，预计专注30分钟。",
        "priority": "low",
        "estimatedPomodoros": 1,
        "source": "用户原待办",
        "plannedStart": "2026-11-03T11:00:00+08:00",
        "plannedEnd": "2026-11-03T11:30:00+08:00",
        "origin": "user",
        "status": "pending",
        "phaseTaskId": "example:task:阅读资料B"
      }
    ],
    "F.TODO_PENDING_PERCENT_1": {
      "$base": {
        "$ref": "F.TODO_PERCENT_1"
      },
      "$set": {
        "id": "example:todo:reading:day1",
        "status": "pending"
      }
    },
    "F.TODO_PERCENT_1": {
      "planningMode": "percentage",
      "targetProgressPercent": 33.3,
      "effortBasis": "unknown",
      "title": "推进阶段阅读至累计计划33.3%",
      "details": "这是累计计划目标，具体阅读内容由用户决定；实际比例与投入预算未确认。",
      "priority": "medium",
      "estimatedPomodoros": null,
      "source": "用户原整体目标与当日百分比计划",
      "plannedStart": null,
      "plannedEnd": null,
      "origin": "llm",
      "phaseTaskId": "example:task:阶段阅读"
    },
    "F.TODO_PERCENT_2": {
      "$base": {
        "$ref": "F.TODO_PERCENT_1"
      },
      "$set": {
        "targetProgressPercent": 66.7,
        "title": "推进阶段阅读至累计计划66.7%"
      }
    },
    "F.SUMMARY_RECORDS": [
      {
        "id": "example:record:sumA1",
        "start": "2026-11-02T09:00:00+08:00",
        "end": "2026-11-02T09:30:00+08:00",
        "type": "work",
        "title": "阅读资料A",
        "note": "",
        "todoId": "example:todo:summary:A"
      },
      {
        "id": "example:record:sumBreak",
        "start": "2026-11-02T09:30:00+08:00",
        "end": "2026-11-02T09:35:00+08:00",
        "type": "break",
        "title": "阅读间休息",
        "note": ""
      },
      {
        "id": "example:record:sumA2",
        "start": "2026-11-02T09:35:00+08:00",
        "end": "2026-11-02T10:05:00+08:00",
        "type": "work",
        "title": "阅读资料A",
        "note": "",
        "todoId": "example:todo:summary:A"
      },
      {
        "id": "example:record:sumB",
        "start": "2026-11-03T09:00:00+08:00",
        "end": "2026-11-03T09:15:00+08:00",
        "type": "work",
        "title": "阅读资料B",
        "note": "",
        "todoId": "example:todo:summary:B"
      },
      {
        "id": "example:record:sumLife",
        "start": "2026-11-03T10:00:00+08:00",
        "end": "2026-11-03T10:30:00+08:00",
        "type": "life",
        "title": "处理家务",
        "note": ""
      }
    ],
    "F.SUMMARY_CONTEXT": [
      {
        "date": "2026-11-02",
        "todos": [
          {
            "id": "example:todo:summary:A",
            "planningMode": "explicit",
            "targetProgressPercent": 100,
            "effortBasis": "task_estimate",
            "title": "读完资料A",
            "details": "用户第1天阅读资料A，预计专注60分钟。",
            "priority": "medium",
            "estimatedPomodoros": 2,
            "source": "用户明确的阶段安排",
            "plannedStart": "2026-11-02T09:00:00+08:00",
            "plannedEnd": "2026-11-02T10:05:00+08:00",
            "origin": "user",
            "status": "done",
            "phaseTaskId": "example:task:阅读资料A"
          }
        ],
        "review": {
          "userCompletion": "资料A已读完。",
          "dailySummary": "",
          "timeAnalysis": "",
          "problemAnalysis": "",
          "nextFocus": ""
        }
      },
      {
        "date": "2026-11-03",
        "todos": [
          {
            "id": "example:todo:summary:B",
            "planningMode": "explicit",
            "targetProgressPercent": 100,
            "effortBasis": "task_estimate",
            "title": "读完资料B",
            "details": "用户第2天阅读资料B，预计专注30分钟。",
            "priority": "medium",
            "estimatedPomodoros": 1,
            "source": "用户明确的阶段安排",
            "plannedStart": "2026-11-03T09:00:00+08:00",
            "plannedEnd": "2026-11-03T09:30:00+08:00",
            "origin": "user",
            "status": "in_progress",
            "phaseTaskId": "example:task:阅读资料B"
          }
        ],
        "review": {
          "userCompletion": "资料B只读了一部分，之后处理家务，没有读完。",
          "dailySummary": "",
          "timeAnalysis": "",
          "problemAnalysis": "",
          "nextFocus": ""
        }
      }
    ],
    "F.SUMMARY_STATISTICS": {
      "totalMinutes": 110,
      "workMinutes": 75,
      "todoCount": 2,
      "doneTodoCount": 1,
      "completionRate": 50,
      "daily": [
        {
          "date": "2026-11-02",
          "totalMinutes": 65,
          "workMinutes": 60,
          "todoCount": 1,
          "done": 1,
          "inProgress": 0,
          "pending": 0,
          "completionRate": 100
        },
        {
          "date": "2026-11-03",
          "totalMinutes": 45,
          "workMinutes": 15,
          "todoCount": 1,
          "done": 0,
          "inProgress": 1,
          "pending": 0,
          "completionRate": 0
        }
      ]
    },
    "F.TODO_CHANGE_A": {
      "$base": {
        "$ref": "F.TODOS_MATERIALS",
        "path": [
          1
        ]
      },
      "$set": {},
      "$omit": [
        "status"
      ]
    },
    "F.PLAN_TASK_PROGRESS_PAPERS": {
      "startDate": "2026-10-14",
      "endDate": "2026-10-19",
      "description": "10月14日至15日阅读论文A，16日阅读论文B，17日比较两篇论文，18日至19日修改研究方案。论文A与方案修改各需总共四小时，论文B与比较各两小时，不添加章节或报告。",
      "constraints": ""
    }
  },
  "exampleRecipes": [
    {
      "id": "E.PHASE_WITHOUT_SCHEDULE",
      "version": "2.1",
      "actions": [
        "phase_plan.decompose"
      ],
      "outputContract": "O.PHASE_CREATE",
      "intent": "未给明确安排时仅输出百分比，空任务估计与null分钟不补造。",
      "input": {
        "plan": {
          "$base": {
            "$ref": "F.PLAN_PERCENTAGE_3D"
          },
          "$set": {
            "milestones": []
          }
        },
        "planningProfile": {
          "$ref": "F.PROFILE_STANDARD"
        },
        "progressContext": null
      },
      "output": {
        "status": "ok",
        "blockedReason": "",
        "planTitle": "阶段阅读",
        "summary": "用户只给整体阅读目标，按三个等容量工作日分配累计计划比例，不指定每日阅读内容。",
        "assumptions": [
          "33.3%、66.7%、100%仅为计划分配，不是实际完成率或耗时预测。"
        ],
        "questions": [],
        "milestones": [
          {
            "$ref": "F.PLAN_PERCENTAGE_3D",
            "path": [
              "milestones",
              0
            ]
          },
          {
            "$ref": "F.PLAN_PERCENTAGE_3D",
            "path": [
              "milestones",
              1
            ]
          },
          {
            "$ref": "F.PLAN_PERCENTAGE_3D",
            "path": [
              "milestones",
              2
            ]
          }
        ]
      }
    },
    {
      "id": "E.PHASE_WITH_EXPLICIT_SCHEDULE",
      "version": "2.1",
      "actions": [
        "phase_plan.decompose"
      ],
      "outputContract": "O.PHASE_CREATE",
      "intent": "明确安排保留原内容，也给数字预期进度；有依据的估时正常保留。",
      "input": {
        "plan": {
          "$base": {
            "$ref": "F.PLAN_EXPLICIT_2D"
          },
          "$set": {
            "milestones": []
          }
        },
        "planningProfile": {
          "$ref": "F.PROFILE_STANDARD"
        },
        "progressContext": null
      },
      "output": {
        "status": "ok",
        "blockedReason": "",
        "planTitle": "阶段阅读",
        "summary": "按用户明确的两天资料阅读安排划分，沿用用户提供的专注分钟，不添加额外报告。",
        "assumptions": [],
        "questions": [],
        "milestones": [
          {
            "$ref": "F.PLAN_EXPLICIT_2D",
            "path": [
              "milestones",
              0
            ]
          },
          {
            "$ref": "F.PLAN_EXPLICIT_2D",
            "path": [
              "milestones",
              1
            ]
          }
        ]
      }
    },
    {
      "id": "E.PHASE_WITH_PARTIAL_SCHEDULE",
      "version": "2.1",
      "actions": [
        "phase_plan.decompose"
      ],
      "outputContract": "O.PHASE_CREATE",
      "intent": "同一阶段可混合方式；明确任务不被猜测的具体日程或百分比覆盖。",
      "input": {
        "plan": {
          "$base": {
            "$ref": "F.PLAN_MIXED_3D"
          },
          "$set": {
            "milestones": []
          }
        },
        "planningProfile": {
          "$ref": "F.PROFILE_STANDARD"
        },
        "progressContext": null
      },
      "output": {
        "status": "ok",
        "blockedReason": "",
        "planTitle": "阶段阅读",
        "summary": "首日保留资料A阅读，其余日期只给累计计划比例，不推断资料A占整体目标的份额。",
        "assumptions": [
          "未明确安排的两个日期等额分配计划比例；不将资料A完成情况换算为实际百分比。"
        ],
        "questions": [],
        "milestones": [
          {
            "$ref": "F.PLAN_MIXED_3D",
            "path": [
              "milestones",
              0
            ]
          },
          {
            "$ref": "F.PLAN_MIXED_3D",
            "path": [
              "milestones",
              1
            ]
          },
          {
            "$ref": "F.PLAN_MIXED_3D",
            "path": [
              "milestones",
              2
            ]
          }
        ]
      }
    },
    {
      "id": "E.TODO_WITHOUT_HISTORY",
      "version": "2.1",
      "actions": [
        "daily_todo.initial"
      ],
      "outputContract": "O.DAY_GENERATE",
      "intent": "首日正常生成百分比目标，不要求昨日反馈，不凑多个待办。",
      "input": {
        "date": "2026-11-02",
        "phasePlan": {
          "$ref": "F.PLAN_PERCENTAGE_3D"
        },
        "dayMilestone": {
          "$ref": "F.PLAN_PERCENTAGE_3D",
          "path": [
            "milestones",
            0
          ]
        },
        "planningProfile": {
          "$ref": "F.PROFILE_STANDARD"
        },
        "requestedAt": null,
        "preparationMinutes": 0,
        "earliestStart": null,
        "availableWindows": null,
        "previousDayContext": null,
        "progressContext": null,
        "dailyWorkBudgetPomodoros": null
      },
      "output": {
        "status": "ok",
        "blockedReason": "",
        "todos": [
          {
            "$ref": "F.TODO_PERCENT_1"
          }
        ],
        "fixedSchedule": [],
        "deferredTodos": [],
        "warnings": [
          "33.3%为累计计划目标，首日无需前一日数据。",
          "投入预算未明确，目标尚未排程。"
        ]
      }
    },
    {
      "id": "E.TODO_WITH_EXPLICIT_SCHEDULE",
      "version": "2.1",
      "actions": [
        "daily_todo.initial",
        "daily_todo.generate"
      ],
      "outputContract": "O.DAY_GENERATE",
      "intent": "保留用户明确内容及时间，有依据时使用任务估时；示例日期同时满足首日条件。",
      "input": {
        "date": "2026-11-02",
        "phasePlan": {
          "$ref": "F.PLAN_EXPLICIT_CLOCK_2D"
        },
        "dayMilestone": {
          "$ref": "F.PLAN_EXPLICIT_CLOCK_2D",
          "path": [
            "milestones",
            0
          ]
        },
        "planningProfile": {
          "$ref": "F.PROFILE_STANDARD"
        },
        "requestedAt": null,
        "preparationMinutes": 0,
        "earliestStart": null,
        "availableWindows": null,
        "previousDayContext": null,
        "progressContext": null,
        "dailyWorkBudgetPomodoros": null
      },
      "output": {
        "status": "ok",
        "blockedReason": "",
        "todos": [
          {
            "planningMode": "explicit",
            "targetProgressPercent": 100,
            "effortBasis": "task_estimate",
            "title": "读完短资料A",
            "details": "按用户安排阅读短资料A，09:00至09:30专注30分钟；不增加笔记或报告要求。",
            "priority": "medium",
            "estimatedPomodoros": 1,
            "source": "用户明确的第1天阅读安排",
            "plannedStart": "2026-11-02T09:00:00+08:00",
            "plannedEnd": "2026-11-02T09:30:00+08:00",
            "origin": "llm",
            "phaseTaskId": "example:task:阅读短资料A"
          }
        ],
        "fixedSchedule": [],
        "deferredTodos": [],
        "warnings": []
      }
    },
    {
      "id": "E.TODO_WITH_UNKNOWN_PROGRESS",
      "version": "2.1",
      "actions": [
        "daily_todo.generate"
      ],
      "outputContract": "O.DAY_GENERATE",
      "intent": "不把昨日33.3%的计划当作已完成，也不从pending数量推算实际比例。",
      "input": {
        "date": "2026-11-03",
        "phasePlan": {
          "$ref": "F.PLAN_PERCENTAGE_3D"
        },
        "dayMilestone": {
          "$ref": "F.PLAN_PERCENTAGE_3D",
          "path": [
            "milestones",
            1
          ]
        },
        "planningProfile": {
          "$ref": "F.PROFILE_STANDARD"
        },
        "requestedAt": null,
        "preparationMinutes": 0,
        "earliestStart": null,
        "availableWindows": null,
        "previousDayContext": {
          "date": "2026-11-02",
          "todos": [
            {
              "$base": {
                "$ref": "F.TODO_PERCENT_1"
              },
              "$set": {
                "id": "example:todo:previous",
                "status": "pending"
              }
            }
          ],
          "records": [],
          "userCompletion": "昨天忙其他事情，没有记录阅读进度。",
          "review": {
            "dailySummary": "用户没有提供阅读进度。",
            "timeAnalysis": "没有可用阅读时间记录。",
            "problemAnalysis": "整体实际进度未知。",
            "nextFocus": "区分计划比例与真实完成情况。"
          }
        },
        "progressContext": null,
        "dailyWorkBudgetPomodoros": null
      },
      "output": {
        "status": "ok",
        "blockedReason": "",
        "todos": [
          {
            "$ref": "F.TODO_PERCENT_2"
          }
        ],
        "fixedSchedule": [],
        "deferredTodos": [],
        "warnings": [
          "昨日实际进度未确认；66.7%为今天累计计划目标，不代表已完成。",
          "投入预算未明确，目标尚未排程。"
        ]
      }
    },
    {
      "id": "E.TODO_FROM_MIXED_PHASE",
      "version": "2.1",
      "actions": [
        "daily_todo.generate"
      ],
      "outputContract": "O.DAY_GENERATE",
      "intent": "完成一个明确任务不等于完成某个整体比例；未知日期仍不补造资料B等具体任务。",
      "input": {
        "date": "2026-11-03",
        "phasePlan": {
          "$ref": "F.PLAN_MIXED_3D"
        },
        "dayMilestone": {
          "$ref": "F.PLAN_MIXED_3D",
          "path": [
            "milestones",
            1
          ]
        },
        "planningProfile": {
          "$ref": "F.PROFILE_STANDARD"
        },
        "requestedAt": null,
        "preparationMinutes": 0,
        "earliestStart": null,
        "availableWindows": null,
        "previousDayContext": {
          "date": "2026-11-02",
          "todos": [
            {
              "id": "example:todo:A",
              "planningMode": "explicit",
              "targetProgressPercent": 100,
              "title": "读完资料A",
              "details": "沿用用户原安排。",
              "status": "done",
              "origin": "user"
            }
          ],
          "records": [],
          "userCompletion": "资料A已读完，但整体阶段的完成比例不确定。",
          "review": {
            "dailySummary": "用户反馈资料A已读完。",
            "timeAnalysis": "没有可靠时间汇总。",
            "problemAnalysis": "资料A占整体目标的份额未知。",
            "nextFocus": "只承接原计划比例，不估算资料A的比例份额。"
          }
        },
        "progressContext": null,
        "dailyWorkBudgetPomodoros": null
      },
      "output": {
        "status": "ok",
        "blockedReason": "",
        "todos": [
          {
            "planningMode": "percentage",
            "targetProgressPercent": 50,
            "effortBasis": "unknown",
            "title": "推进阶段阅读至累计计划50%",
            "details": "这是累计计划目标，具体阅读内容由用户决定；实际比例与投入预算未确认。",
            "priority": "medium",
            "estimatedPomodoros": null,
            "source": "用户原整体目标与当日百分比计划",
            "plannedStart": null,
            "plannedEnd": null,
            "origin": "llm",
            "phaseTaskId": "example:task:阶段阅读"
          }
        ],
        "fixedSchedule": [],
        "deferredTodos": [],
        "warnings": [
          "资料A已完成的反馈与done标记一致，但其占整体目标的比例未知。",
          "50%沿用当日累计计划目标；投入预算未明确，尚未排程。"
        ]
      }
    },
    {
      "id": "E.RECORD_EXPLICIT_TIME",
      "version": "2.1",
      "actions": [
        "time_record.parse"
      ],
      "outputContract": "O.RECORDS",
      "intent": "由明确时间提取活动；起点与持续时长可计算终点，半开区间允许相邻。",
      "input": {
        "selectedDate": "2026-11-02",
        "timezone": "Asia/Shanghai",
        "instruction": "上午09:00至10:00阅读资料，之后休息15分钟。",
        "existingRecords": []
      },
      "output": {
        "status": "ok",
        "blockedReason": "",
        "records": [
          {
            "type": "work",
            "content": "阅读资料",
            "start": "2026-11-02T09:00:00+08:00",
            "end": "2026-11-02T10:00:00+08:00",
            "note": ""
          },
          {
            "type": "break",
            "content": "阅读后休息",
            "start": "2026-11-02T10:00:00+08:00",
            "end": "2026-11-02T10:15:00+08:00",
            "note": "由阅读结束时间和15分钟时长确定。"
          }
        ]
      }
    },
    {
      "id": "E.RECORD_MISSING_TIME",
      "version": "2.1",
      "actions": [
        "time_record.parse"
      ],
      "outputContract": "O.RECORDS",
      "intent": "一部分活动时间明确，另一部分缺失时整体阻塞，不偷偷遗漏或猜测。",
      "input": {
        "selectedDate": "2026-11-02",
        "timezone": "Asia/Shanghai",
        "instruction": "上午09:00至10:00阅读资料，下午还散了步，没记具体时间。",
        "existingRecords": []
      },
      "output": {
        "status": "blocked",
        "blockedReason": "散步的起止时间无法确定，请补充时间；本次不写入部分记录。",
        "records": []
      }
    },
    {
      "id": "E.RECORD_DEDUPLICATE",
      "version": "2.1",
      "actions": [
        "time_record.parse"
      ],
      "outputContract": "O.RECORDS",
      "intent": "识别已记录活动，只输出明确的新记录。",
      "input": {
        "selectedDate": "2026-11-02",
        "timezone": "Asia/Shanghai",
        "instruction": "上午09:00至10:00阅读资料，10:00至10:15休息。",
        "existingRecords": [
          {
            "id": "example:record:reading",
            "start": "2026-11-02T09:00:00+08:00",
            "end": "2026-11-02T10:00:00+08:00",
            "type": "work",
            "title": "阅读资料",
            "note": ""
          }
        ]
      },
      "output": {
        "status": "ok",
        "blockedReason": "",
        "records": [
          {
            "type": "break",
            "content": "阅读后休息",
            "start": "2026-11-02T10:00:00+08:00",
            "end": "2026-11-02T10:15:00+08:00",
            "note": "阅读活动已有相同记录，本次不重复补录。"
          }
        ]
      }
    },
    {
      "id": "E.REVIEW_STATUS_CONFLICT",
      "version": "2.1",
      "actions": [
        "daily_review.generate"
      ],
      "outputContract": "O.REVIEW_NEXT",
      "intent": "分别表述反馈、系统状态和程序统计；禁止生成次日时仍返回有效复盘。",
      "input": {
        "date": "2026-11-02",
        "nextTodoDate": "2026-11-03",
        "timezone": "Asia/Shanghai",
        "todos": [
          {
            "$ref": "F.TODO_PENDING_PERCENT_1"
          }
        ],
        "phasePlan": {
          "$ref": "F.PLAN_PERCENTAGE_3D"
        },
        "nextDayMilestone": {
          "$ref": "F.PLAN_PERCENTAGE_3D",
          "path": [
            "milestones",
            1
          ]
        },
        "planningProfile": {
          "$ref": "F.PROFILE_STANDARD"
        },
        "existingNextTodos": [],
        "progressContext": null,
        "dailyWorkBudgetPomodoros": null,
        "userCompletion": "今天09:00至10:00阅读了，觉得今天的阅读待办已经完成，但没有测量阶段整体完成比例。",
        "records": [
          {
            "id": "example:record:reading60",
            "start": "2026-11-02T09:00:00+08:00",
            "end": "2026-11-02T10:00:00+08:00",
            "type": "work",
            "title": "阶段阅读",
            "note": "",
            "todoId": "example:todo:reading:day1"
          }
        ],
        "generateNextTodos": false,
        "nextTodoBlockedReason": "本次仅复盘，不生成次日待办。",
        "statistics": {
          "totalMinutes": 60,
          "workMinutes": 60,
          "todoCount": 1,
          "doneTodoCount": 0,
          "completionRate": 0
        }
      },
      "output": {
        "status": "ok",
        "blockedReason": "",
        "review": {
          "dailySummary": "用户反馈已完成今天的阅读待办，但系统仍标记为pending。程序统计为1项待办、0项done；用户自述不计入系统完成数。阶段实际完成比例未提供，不能把今日计划33.3%视为已完成。",
          "timeAnalysis": "程序统计总投入60分钟，其中工作60分钟；没有其他类型的已记录投入。",
          "problemAnalysis": "用户反馈与待办状态不一致；整体目标实际比例未知，不能从投入或计划比例推算。",
          "nextFocus": "确认待办实际状态，由用户更新完成标记。\n补充同口径实际进度，区分计划目标与成果。"
        },
        "nextDayTodos": [],
        "fixedSchedule": [],
        "deferredTodos": [],
        "warnings": [
          "本次仅复盘，不生成次日待办。"
        ]
      }
    },
    {
      "id": "E.REVIEW_UNKNOWN_PROGRESS_NEXT",
      "version": "2.1",
      "actions": [
        "daily_review.generate"
      ],
      "outputContract": "O.REVIEW_NEXT",
      "intent": "复用百分比待办对象，不把阅读时长转换成进度；次日投入未知则保持未排程。",
      "input": {
        "date": "2026-11-02",
        "nextTodoDate": "2026-11-03",
        "timezone": "Asia/Shanghai",
        "todos": [
          {
            "$ref": "F.TODO_PENDING_PERCENT_1"
          }
        ],
        "phasePlan": {
          "$ref": "F.PLAN_PERCENTAGE_3D"
        },
        "nextDayMilestone": {
          "$ref": "F.PLAN_PERCENTAGE_3D",
          "path": [
            "milestones",
            1
          ]
        },
        "planningProfile": {
          "$ref": "F.PROFILE_STANDARD"
        },
        "existingNextTodos": [],
        "progressContext": null,
        "dailyWorkBudgetPomodoros": null,
        "userCompletion": "今天09:00至11:00阅读了两小时，整体完成比例不确定，也没有安排明天读什么。",
        "records": [
          {
            "id": "example:record:reading120",
            "start": "2026-11-02T09:00:00+08:00",
            "end": "2026-11-02T11:00:00+08:00",
            "type": "work",
            "title": "阶段阅读",
            "note": "",
            "todoId": "example:todo:reading:day1"
          }
        ],
        "generateNextTodos": true,
        "nextTodoBlockedReason": "",
        "statistics": {
          "totalMinutes": 120,
          "workMinutes": 120,
          "todoCount": 1,
          "doneTodoCount": 0,
          "completionRate": 0
        }
      },
      "output": {
        "status": "ok",
        "blockedReason": "",
        "review": {
          "dailySummary": "用户报告进行了阶段阅读，系统中的当日待办仍为pending，未提供完成标记。当前只有投入证据，没有整体目标的实际完成比例；不能认定已达到首日计划33.3%。",
          "timeAnalysis": "程序统计总投入120分钟，均为工作投入；这说明阅读投入，不证明整体目标的完成比例。",
          "problemAnalysis": "没有明确次日阅读内容和投入预算，也缺少可用于校正计划的实际进度比例。",
          "nextFocus": "沿用次日累计计划目标，不补造章节或子任务。\n确认投入预算后再安排工作时段。"
        },
        "nextDayTodos": [
          {
            "$ref": "F.TODO_PERCENT_2"
          }
        ],
        "fixedSchedule": [],
        "deferredTodos": [],
        "warnings": [
          "66.7%是次日累计计划目标，不是实际已完成比例。",
          "次日投入预算未知，目标尚未排程。"
        ]
      }
    },
    {
      "id": "E.REVIEW_KEEP_EXISTING_NEXT",
      "version": "2.1",
      "actions": [
        "daily_review.generate"
      ],
      "outputContract": "O.REVIEW_NEXT",
      "intent": "已有次日待办全部保留；相同目标不重复输出或重写。",
      "input": {
        "date": "2026-11-02",
        "nextTodoDate": "2026-11-03",
        "timezone": "Asia/Shanghai",
        "todos": [
          {
            "$ref": "F.TODO_PENDING_PERCENT_1"
          }
        ],
        "phasePlan": {
          "$ref": "F.PLAN_PERCENTAGE_3D"
        },
        "nextDayMilestone": {
          "$ref": "F.PLAN_PERCENTAGE_3D",
          "path": [
            "milestones",
            1
          ]
        },
        "planningProfile": {
          "$ref": "F.PROFILE_STANDARD"
        },
        "existingNextTodos": [
          {
            "planningMode": "percentage",
            "targetProgressPercent": 66.7,
            "effortBasis": "time_budget",
            "title": "推进阶段阅读至累计计划66.7%",
            "details": "用户明确投入一个番茄；这是时间预算，不保证达到累计计划66.7%。",
            "priority": "medium",
            "estimatedPomodoros": 1,
            "source": "用户已保存的次日阅读安排",
            "plannedStart": "2026-11-03T09:00:00+08:00",
            "plannedEnd": "2026-11-03T09:30:00+08:00",
            "origin": "user",
            "id": "example:todo:next-existing",
            "status": "pending",
            "phaseTaskId": "example:task:阶段阅读"
          }
        ],
        "progressContext": null,
        "dailyWorkBudgetPomodoros": 1,
        "userCompletion": "今天阅读了一个小时，整体进度没测。明天的阅读待办已经保存，投入一个番茄。",
        "records": [
          {
            "id": "example:record:reading60",
            "start": "2026-11-02T09:00:00+08:00",
            "end": "2026-11-02T10:00:00+08:00",
            "type": "work",
            "title": "阶段阅读",
            "note": "",
            "todoId": "example:todo:reading:day1"
          }
        ],
        "generateNextTodos": true,
        "nextTodoBlockedReason": "",
        "statistics": {
          "totalMinutes": 60,
          "workMinutes": 60,
          "todoCount": 1,
          "doneTodoCount": 0,
          "completionRate": 0
        }
      },
      "output": {
        "status": "ok",
        "blockedReason": "",
        "review": {
          "dailySummary": "用户报告今天进行了阅读，系统当日待办仍为pending。整体进度没有测量。次日已保存同一阅读目标的待办，本次保留原安排，不重复生成，也不将明日计划写成今日成果。",
          "timeAnalysis": "程序统计总投入60分钟、工作60分钟；次日一个番茄是未来预算，不能计入今日投入。",
          "problemAnalysis": "整体实际完成比例未知；次日已有目标和投入安排，无需重复创建同目标待办。",
          "nextFocus": "按已有次日安排推进，明确预算不保证完成比例。\n记录实际进展后再判断是否调整。"
        },
        "nextDayTodos": [],
        "fixedSchedule": [],
        "deferredTodos": [],
        "warnings": [
          "次日已有同目标待办，原样保留；空新增清单不表示删除原待办。",
          "已有一个番茄的投入预算不保证达到累计计划66.7%。"
        ]
      }
    },
    {
      "id": "E.MANUAL_MINIMAL_OVERRIDE",
      "version": "2.1",
      "actions": [
        "daily_todo.adjust"
      ],
      "outputContract": "O.MANUAL_DELTA",
      "intent": "保留ID、原来源和未修改事项；仅用户指定的窗口外任务允许覆盖常规窗口。",
      "input": {
        "date": "2026-11-03",
        "instruction": "只把资料A移动到今天13:00至13:30，其他任务不要动。",
        "phasePlan": {
          "$ref": "F.PLAN_MATERIALS_1D"
        },
        "dayMilestone": {
          "$ref": "F.PLAN_MATERIALS_1D",
          "path": [
            "milestones",
            0
          ]
        },
        "planningProfile": {
          "$ref": "F.PROFILE_STANDARD"
        },
        "todos": {
          "$ref": "F.TODOS_MATERIALS"
        },
        "protectedTodos": [
          {
            "$ref": "F.TODOS_MATERIALS",
            "path": [
              0
            ]
          }
        ],
        "adjustableTodos": [
          {
            "$ref": "F.TODOS_MATERIALS",
            "path": [
              1
            ]
          },
          {
            "$ref": "F.TODOS_MATERIALS",
            "path": [
              2
            ]
          }
        ],
        "requiredRescheduleTodos": [
          {
            "$ref": "F.TODOS_MATERIALS",
            "path": [
              1
            ]
          }
        ],
        "requestedAt": "2026-11-03T09:35:00+08:00",
        "preparationMinutes": 5,
        "earliestStart": "2026-11-03T09:40:00+08:00",
        "availableWindows": [
          {
            "start": "2026-11-03T09:40:00+08:00",
            "end": "2026-11-03T12:00:00+08:00"
          }
        ]
      },
      "output": {
        "status": "ok",
        "blockedReason": "",
        "changeSummary": "仅将资料A移至13:00至13:30；资料B及已完成的资料C保留。",
        "todos": [
          {
            "$base": {
              "$ref": "F.TODO_CHANGE_A"
            },
            "$set": {
              "plannedStart": "2026-11-03T13:00:00+08:00",
              "plannedEnd": "2026-11-03T13:30:00+08:00",
              "workWindowOverride": true
            }
          }
        ],
        "deletedTodoIds": [],
        "warnings": [
          "资料A使用用户明确指定的窗口外时间；不扩大其他任务的工作窗口。"
        ]
      }
    },
    {
      "id": "E.MANUAL_HARD_CONFLICT",
      "version": "2.1",
      "actions": [
        "daily_todo.adjust"
      ],
      "outputContract": "O.MANUAL_DELTA",
      "intent": "手动覆盖只覆盖常规窗口，不能覆盖固定阻塞；不偷偷移动用户时间。",
      "input": {
        "date": "2026-11-03",
        "instruction": "只把资料A移动到今天13:00至13:30，其他任务不要动。",
        "phasePlan": {
          "$ref": "F.PLAN_MATERIALS_1D"
        },
        "dayMilestone": {
          "$ref": "F.PLAN_MATERIALS_1D",
          "path": [
            "milestones",
            0
          ]
        },
        "planningProfile": {
          "$base": {
            "$ref": "F.PROFILE_STANDARD"
          },
          "$set": {
            "routineBlocks": [
              {
                "weekdays": [
                  2
                ],
                "start": "13:00",
                "end": "13:30",
                "label": "固定就诊"
              }
            ]
          }
        },
        "todos": {
          "$ref": "F.TODOS_MATERIALS"
        },
        "protectedTodos": [
          {
            "$ref": "F.TODOS_MATERIALS",
            "path": [
              0
            ]
          }
        ],
        "adjustableTodos": [
          {
            "$ref": "F.TODOS_MATERIALS",
            "path": [
              1
            ]
          },
          {
            "$ref": "F.TODOS_MATERIALS",
            "path": [
              2
            ]
          }
        ],
        "requiredRescheduleTodos": [
          {
            "$ref": "F.TODOS_MATERIALS",
            "path": [
              1
            ]
          }
        ],
        "requestedAt": "2026-11-03T09:35:00+08:00",
        "preparationMinutes": 5,
        "earliestStart": "2026-11-03T09:40:00+08:00",
        "availableWindows": [
          {
            "start": "2026-11-03T09:40:00+08:00",
            "end": "2026-11-03T12:00:00+08:00"
          }
        ]
      },
      "output": {
        "status": "blocked",
        "blockedReason": "用户指定的资料A时段13:00至13:30与固定就诊冲突，请修改任务时间或先更新固定安排。",
        "changeSummary": "",
        "todos": [],
        "deletedTodoIds": [],
        "warnings": [
          "未移动资料A，也未修改或删除其他待办。"
        ]
      }
    },
    {
      "id": "E.AUTO_RESCHEDULE_OVERDUE",
      "version": "2.1",
      "actions": [
        "daily_todo.intraday_adjust"
      ],
      "outputContract": "O.AUTO_DELTA",
      "intent": "重排过时A，未修改B保留，done的C受保护；输出只含增量。",
      "input": {
        "date": "2026-11-03",
        "currentTime": "2026-11-03T10:00:00+08:00",
        "phasePlan": {
          "$ref": "F.PLAN_MATERIALS_1D"
        },
        "dayMilestone": {
          "$ref": "F.PLAN_MATERIALS_1D",
          "path": [
            "milestones",
            0
          ]
        },
        "planningProfile": {
          "$ref": "F.PROFILE_STANDARD"
        },
        "availableWindows": [
          {
            "start": "2026-11-03T10:05:00+08:00",
            "end": "2026-11-03T12:00:00+08:00"
          }
        ],
        "protectedTodos": [
          {
            "$ref": "F.TODOS_MATERIALS",
            "path": [
              0
            ]
          }
        ],
        "adjustableTodos": [
          {
            "$ref": "F.TODOS_MATERIALS",
            "path": [
              1
            ]
          },
          {
            "$ref": "F.TODOS_MATERIALS",
            "path": [
              2
            ]
          }
        ],
        "requiredRescheduleTodos": [
          {
            "$ref": "F.TODOS_MATERIALS",
            "path": [
              1
            ]
          }
        ],
        "userCompletion": "资料C已经读完，资料A尚未开始。",
        "records": [
          {
            "id": "example:record:C",
            "start": "2026-11-03T09:00:00+08:00",
            "end": "2026-11-03T09:30:00+08:00",
            "type": "work",
            "title": "阅读资料C",
            "note": "",
            "todoId": "example:todo:C"
          }
        ]
      },
      "output": {
        "status": "ok",
        "blockedReason": "",
        "changeSummary": "将尚未开始的资料A移至10:05至10:35；资料B与已完成的资料C保留。",
        "todos": [
          {
            "$base": {
              "$ref": "F.TODO_CHANGE_A"
            },
            "$set": {
              "plannedStart": "2026-11-03T10:05:00+08:00",
              "plannedEnd": "2026-11-03T10:35:00+08:00"
            }
          }
        ],
        "deletedTodoIds": [],
        "warnings": []
      }
    },
    {
      "id": "E.AUTO_CAPACITY_SHORTAGE",
      "version": "2.1",
      "actions": [
        "daily_todo.intraday_adjust"
      ],
      "outputContract": "O.AUTO_DELTA",
      "intent": "逐项处理过时任务，优先保留A；删除代表取消安排，不代表完成或已经跨日迁移。",
      "input": {
        "date": "2026-11-03",
        "currentTime": "2026-11-03T11:25:00+08:00",
        "phasePlan": {
          "$ref": "F.PLAN_MATERIALS_1D"
        },
        "dayMilestone": {
          "$ref": "F.PLAN_MATERIALS_1D",
          "path": [
            "milestones",
            0
          ]
        },
        "planningProfile": {
          "$ref": "F.PROFILE_STANDARD"
        },
        "availableWindows": [
          {
            "start": "2026-11-03T11:30:00+08:00",
            "end": "2026-11-03T12:00:00+08:00"
          }
        ],
        "protectedTodos": [
          {
            "$ref": "F.TODOS_MATERIALS",
            "path": [
              0
            ]
          }
        ],
        "adjustableTodos": [
          {
            "$ref": "F.TODOS_MATERIALS",
            "path": [
              1
            ]
          },
          {
            "$ref": "F.TODOS_MATERIALS",
            "path": [
              2
            ]
          }
        ],
        "requiredRescheduleTodos": [
          {
            "$ref": "F.TODOS_MATERIALS",
            "path": [
              1
            ]
          },
          {
            "$ref": "F.TODOS_MATERIALS",
            "path": [
              2
            ]
          }
        ],
        "userCompletion": "",
        "records": []
      },
      "output": {
        "status": "ok",
        "blockedReason": "",
        "changeSummary": "剩余窗口只安排优先级较高的资料A；取消资料B当天安排，保留已完成的资料C。",
        "todos": [
          {
            "$base": {
              "$ref": "F.TODO_CHANGE_A"
            },
            "$set": {
              "plannedStart": "2026-11-03T11:30:00+08:00",
              "plannedEnd": "2026-11-03T12:00:00+08:00"
            }
          }
        ],
        "deletedTodoIds": [
          "example:todo:B"
        ],
        "warnings": [
          "资料B：剩余容量不足，取消当天安排，仍未完成；本次不自动迁移至其他日期。"
        ]
      }
    },
    {
      "id": "E.PHASE_ADJUST_ACTUAL_BASELINE",
      "version": "2.1",
      "actions": [
        "phase_plan.adjust"
      ],
      "outputContract": "O.PHASE_ADJUST",
      "intent": "用明确实际20%分配剩余80%，不返回首日历史；不修改阶段标识和期限。",
      "input": {
        "today": "2026-11-03",
        "instruction": "保持阶段目标和结束日期不变，把剩余80%均分到最后两天。",
        "plan": {
          "$ref": "F.PLAN_PERCENTAGE_3D"
        },
        "planningProfile": {
          "$ref": "F.PROFILE_STANDARD"
        },
        "records": [],
        "dailyContext": [
          {
            "date": "2026-11-02",
            "todos": [
              {
                "$ref": "F.TODO_PENDING_PERCENT_1"
              }
            ],
            "review": {
              "userCompletion": "截至11月2日，阶段整体阅读目标实际完成20%。",
              "dailySummary": "",
              "timeAnalysis": "",
              "problemAnalysis": "",
              "nextFocus": ""
            }
          }
        ],
        "progressContext": {
          "planId": "example:phase:reading",
          "asOfDate": "2026-11-02",
          "actualProgressPercent": 20,
          "basis": "用户明确反馈，口径为整个阶段阅读目标的累计完成比例。"
        }
      },
      "output": {
        "status": "ok",
        "blockedReason": "",
        "changeSummary": "按用户确认的实际20%基线，将剩余80%均分至11月3日和4日；首日历史保留。",
        "milestones": [
          {
            "date": "2026-11-03",
            "planningMode": "percentage",
            "targetProgressPercent": 60,
            "goal": "推进阶段阅读至累计计划60%",
            "deliverables": [],
            "taskEstimates": [],
            "estimatedMinutes": null,
            "notes": "由明确实际20%基线加剩余计划40个百分点；不是今日实际成果。",
            "taskProgress": [
              {
                "taskId": "example:task:阶段阅读",
                "title": "阶段阅读",
                "targetProgressPercent": 60
              }
            ]
          },
          {
            "date": "2026-11-04",
            "planningMode": "percentage",
            "targetProgressPercent": 100,
            "goal": "推进阶段阅读至累计计划100%",
            "deliverables": [],
            "taskEstimates": [],
            "estimatedMinutes": null,
            "notes": "剩余第二天计划达到100%；不代表已经完成。",
            "taskProgress": [
              {
                "taskId": "example:task:阶段阅读",
                "title": "阶段阅读",
                "targetProgressPercent": 100
              }
            ]
          }
        ],
        "warnings": [
          "百分比是计划分配；具体工作内容和耗时未知，不能保证可完成性。"
        ]
      }
    },
    {
      "id": "E.PHASE_ADJUST_UNKNOWN_BASELINE",
      "version": "2.1",
      "actions": [
        "phase_plan.adjust"
      ],
      "outputContract": "O.PHASE_ADJUST",
      "intent": "昨日计划33.3%不能成为实际基线；保留现有计划曲线，不编造每日内容。",
      "input": {
        "today": "2026-11-03",
        "instruction": "检查剩余安排；没有确认实际进度，先沿用原计划目标，不增加具体阅读内容。",
        "plan": {
          "$ref": "F.PLAN_PERCENTAGE_3D"
        },
        "planningProfile": {
          "$ref": "F.PROFILE_STANDARD"
        },
        "records": [],
        "dailyContext": [
          {
            "date": "2026-11-02",
            "todos": [
              {
                "$ref": "F.TODO_PENDING_PERCENT_1"
              }
            ],
            "review": {
              "userCompletion": "昨天阅读了，但整体实际完成比例不确定。",
              "dailySummary": "",
              "timeAnalysis": "",
              "problemAnalysis": "",
              "nextFocus": ""
            }
          }
        ],
        "progressContext": {
          "planId": "example:phase:reading",
          "asOfDate": "2026-11-02",
          "actualProgressPercent": null,
          "basis": "用户只反馈进行了阅读，没有提供整体目标的实际比例。"
        }
      },
      "output": {
        "status": "ok",
        "blockedReason": "",
        "changeSummary": "保留11月3日66.7%、11月4日100%的累计计划目标，只返回剩余日期，不添加具体阅读任务。",
        "milestones": [
          {
            "$ref": "F.PLAN_PERCENTAGE_3D",
            "path": [
              "milestones",
              1
            ]
          },
          {
            "$ref": "F.PLAN_PERCENTAGE_3D",
            "path": [
              "milestones",
              2
            ]
          }
        ],
        "warnings": [
          "整体实际进度未知，不能把首日计划33.3%当作实际完成；剩余目标仍为计划而非成果。",
          "具体工作量和估时未知，无法核验百分比目标的可完成性。"
        ]
      }
    },
    {
      "id": "E.SUMMARY_WITH_EVIDENCE",
      "version": "2.1",
      "actions": [
        "phase_plan.summarize"
      ],
      "outputContract": "O.PHASE_SUMMARY",
      "intent": "沿用程序统计，休息生活不计工作；待办完成率不等于整体目标进度；不自动创建新任务。",
      "input": {
        "plan": {
          "$ref": "F.PLAN_EXPLICIT_2D"
        },
        "records": {
          "$ref": "F.SUMMARY_RECORDS"
        },
        "dailyContext": {
          "$ref": "F.SUMMARY_CONTEXT"
        },
        "statistics": {
          "$ref": "F.SUMMARY_STATISTICS"
        },
        "timezone": "Asia/Shanghai",
        "asOf": "2026-11-03T20:00:00+08:00"
      },
      "output": {
        "status": "ok",
        "blockedReason": "",
        "phaseSummary": "阶段原目标是两天分别读完资料A和B。资料A的用户反馈与done标记一致，资料B反馈为部分阅读、状态为in_progress，原目标尚未全部完成。没有调整后的缩减目标，也没有同口径整体进度比例。",
        "achievementSummary": "资料A可确认为完成；资料B已有阅读投入，但用户明确表示未读完。程序统计2项待办、1项done，待办完成率50%；这个比例不能用于表示整个阅读目标已完成50%，也不能用投入时长推算成果。",
        "timeAnalysis": "程序统计总投入110分钟，其中工作75分钟。首日工作60分钟、次日15分钟；5分钟休息与30分钟家务不计入工作投入。资料B只记录15分钟工作，少于原预计30分钟，但不能因此推算完成了一半。",
        "unfinishedItems": [
          "资料B：用户反馈只读了一部分，状态为in_progress，剩余工作量未确认。"
        ],
        "lessons": [
          "投入与成果应分别记录；资料B有阅读时间，但未读完。"
        ],
        "nextSuggestions": [
          "确认资料B剩余内容与预计投入，再决定后续安排；本次不自动创建任务。"
        ]
      }
    },
    {
      "id": "E.SUMMARY_WITH_DATA_GAPS",
      "version": "2.1",
      "actions": [
        "phase_plan.summarize"
      ],
      "outputContract": "O.PHASE_SUMMARY",
      "intent": "计划不证明执行；空记录不表示零投入，数据不足时仍给有限总结，不制造成果、原因或经验。",
      "input": {
        "plan": {
          "$ref": "F.PLAN_EXPLICIT_2D"
        },
        "records": [],
        "dailyContext": [],
        "statistics": null,
        "timezone": "Asia/Shanghai",
        "asOf": "2026-11-03T20:00:00+08:00"
      },
      "output": {
        "status": "ok",
        "blockedReason": "",
        "phaseSummary": "阶段计划要求两天分别读完资料A和B，但本次没有提供执行记录、待办状态或用户反馈，只能说明计划范围，无法判断实际成果。",
        "achievementSummary": "资料A、资料B的完成情况均未确认。计划中的任务和预计分钟不是执行证据，不能据此认定完成、未完成或整体目标达到某个比例。",
        "timeAnalysis": "未提供时间记录与程序统计，无法报告精确投入、平均耗时或完成率；空记录不等于实际投入为零。",
        "unfinishedItems": [
          "资料A、资料B的完成情况待确认：缺少反馈及待办状态，不能判定为已完成或未完成。"
        ],
        "lessons": [],
        "nextSuggestions": [
          "补充阶段执行反馈、待办状态和时间记录，再分析成果与投入。"
        ]
      }
    },
    {
      "id": "E.PHASE_ALL_TASKS_PROGRESS",
      "version": "2.1",
      "actions": [
        "phase_plan.decompose"
      ],
      "outputContract": "O.PHASE_CREATE",
      "input": {
        "plan": {
          "$ref": "F.PLAN_TASK_PROGRESS_PAPERS"
        },
        "planningProfile": null
      },
      "output": {
        "status": "ok",
        "blockedReason": "",
        "planTitle": "论文阅读与方案修改",
        "summary": "保留明确日期及总估时，每个任务独立给累计预期进度；容量未提供，暂未核验。",
        "assumptions": [
          "两日任务按两天等额分配时间和计划进度，不表示实际已完成。"
        ],
        "questions": [],
        "milestones": [
          {
            "date": "2026-10-14",
            "planningMode": "explicit",
            "targetProgressPercent": 50,
            "taskProgress": [
              {
                "taskId": "example:paper:阅读论文A",
                "title": "阅读论文A",
                "targetProgressPercent": 50
              }
            ],
            "goal": "阅读论文A，累计预期50%",
            "deliverables": [],
            "taskEstimates": [
              {
                "title": "阅读论文A",
                "estimatedMinutes": 120,
                "deliverable": ""
              }
            ],
            "estimatedMinutes": 120,
            "notes": "保留用户日期，不拆章节；百分比是该任务计划目标。"
          },
          {
            "date": "2026-10-15",
            "planningMode": "explicit",
            "targetProgressPercent": 100,
            "taskProgress": [
              {
                "taskId": "example:paper:阅读论文A",
                "title": "阅读论文A",
                "targetProgressPercent": 100
              }
            ],
            "goal": "阅读论文A，累计预期100%",
            "deliverables": [],
            "taskEstimates": [
              {
                "title": "阅读论文A",
                "estimatedMinutes": 120,
                "deliverable": ""
              }
            ],
            "estimatedMinutes": 120,
            "notes": "保留用户日期，不拆章节；百分比是该任务计划目标。"
          },
          {
            "date": "2026-10-16",
            "planningMode": "explicit",
            "targetProgressPercent": 100,
            "taskProgress": [
              {
                "taskId": "example:paper:阅读论文B",
                "title": "阅读论文B",
                "targetProgressPercent": 100
              }
            ],
            "goal": "阅读论文B，累计预期100%",
            "deliverables": [],
            "taskEstimates": [
              {
                "title": "阅读论文B",
                "estimatedMinutes": 120,
                "deliverable": ""
              }
            ],
            "estimatedMinutes": 120,
            "notes": "保留用户日期，不拆章节；百分比是该任务计划目标。"
          },
          {
            "date": "2026-10-17",
            "planningMode": "explicit",
            "targetProgressPercent": 100,
            "taskProgress": [
              {
                "taskId": "example:paper:比较两篇论文",
                "title": "比较两篇论文",
                "targetProgressPercent": 100
              }
            ],
            "goal": "比较两篇论文，累计预期100%",
            "deliverables": [],
            "taskEstimates": [
              {
                "title": "比较两篇论文",
                "estimatedMinutes": 120,
                "deliverable": ""
              }
            ],
            "estimatedMinutes": 120,
            "notes": "保留用户日期，不拆章节；百分比是该任务计划目标。"
          },
          {
            "date": "2026-10-18",
            "planningMode": "explicit",
            "targetProgressPercent": 50,
            "taskProgress": [
              {
                "taskId": "example:paper:修改研究方案",
                "title": "修改研究方案",
                "targetProgressPercent": 50
              }
            ],
            "goal": "修改研究方案，累计预期50%",
            "deliverables": [],
            "taskEstimates": [
              {
                "title": "修改研究方案",
                "estimatedMinutes": 120,
                "deliverable": ""
              }
            ],
            "estimatedMinutes": 120,
            "notes": "保留用户日期，不拆章节；百分比是该任务计划目标。"
          },
          {
            "date": "2026-10-19",
            "planningMode": "explicit",
            "targetProgressPercent": 100,
            "taskProgress": [
              {
                "taskId": "example:paper:修改研究方案",
                "title": "修改研究方案",
                "targetProgressPercent": 100
              }
            ],
            "goal": "修改研究方案，累计预期100%",
            "deliverables": [],
            "taskEstimates": [
              {
                "title": "修改研究方案",
                "estimatedMinutes": 120,
                "deliverable": ""
              }
            ],
            "estimatedMinutes": 120,
            "notes": "保留用户日期，不拆章节；百分比是该任务计划目标。"
          }
        ]
      }
    },
    {
      "id": "E.PHASE_MULTI_RESEARCH_PROGRESS",
      "version": "2.1",
      "actions": [
        "phase_plan.decompose"
      ],
      "outputContract": "O.PHASE_CREATE",
      "input": {
        "plan": {
          "startDate": "2026-11-02",
          "endDate": "2026-11-03",
          "description": "上午推进behavfuzz，下午重点推进stateweaver，不设硬性成果要求。每天学习或阅读论文1小时、练字1小时，插件设计抽空。每天工作至少8小时。",
          "constraints": ""
        },
        "planningProfile": null
      },
      "output": {
        "status": "ok",
        "blockedReason": "",
        "planTitle": "科研与日常学习",
        "summary": "每个原任务独立分配本阶段预期进度，主线下午、支线上午；8小时计入口径与可用容量未知，不能据此估科研耗时。",
        "assumptions": [
          "连续任务按两日各50%分配累计预期目标，100%不代表整个科研结束。"
        ],
        "questions": [],
        "milestones": [
          {
            "date": "2026-11-02",
            "planningMode": "percentage",
            "targetProgressPercent": null,
            "taskProgress": [
              {
                "taskId": "example:research:behavfuzz",
                "title": "behavfuzz",
                "targetProgressPercent": 50
              },
              {
                "taskId": "example:research:stateweaver",
                "title": "stateweaver",
                "targetProgressPercent": 50
              },
              {
                "taskId": "example:research:学习或论文阅读",
                "title": "学习或论文阅读",
                "targetProgressPercent": 50
              },
              {
                "taskId": "example:research:练字",
                "title": "练字",
                "targetProgressPercent": 50
              },
              {
                "taskId": "example:research:个人系统插件设计",
                "title": "个人系统插件设计",
                "targetProgressPercent": 50
              }
            ],
            "goal": "上午behavfuzz，下午重点stateweaver",
            "deliverables": [],
            "taskEstimates": [],
            "estimatedMinutes": null,
            "notes": "学习或论文阅读、练字各1小时；插件抽空；每日工作≥8小时，计入口径及容量未知。"
          },
          {
            "date": "2026-11-03",
            "planningMode": "percentage",
            "targetProgressPercent": null,
            "taskProgress": [
              {
                "taskId": "example:research:behavfuzz",
                "title": "behavfuzz",
                "targetProgressPercent": 100
              },
              {
                "taskId": "example:research:stateweaver",
                "title": "stateweaver",
                "targetProgressPercent": 100
              },
              {
                "taskId": "example:research:学习或论文阅读",
                "title": "学习或论文阅读",
                "targetProgressPercent": 100
              },
              {
                "taskId": "example:research:练字",
                "title": "练字",
                "targetProgressPercent": 100
              },
              {
                "taskId": "example:research:个人系统插件设计",
                "title": "个人系统插件设计",
                "targetProgressPercent": 100
              }
            ],
            "goal": "上午behavfuzz，下午重点stateweaver",
            "deliverables": [],
            "taskEstimates": [],
            "estimatedMinutes": null,
            "notes": "学习或论文阅读、练字各1小时；插件抽空；每日工作≥8小时，计入口径及容量未知。"
          }
        ]
      }
    }
  ],
  "exampleIdsByTask": {
    "time_record.parse": [
      "E.RECORD_EXPLICIT_TIME",
      "E.RECORD_MISSING_TIME",
      "E.RECORD_DEDUPLICATE"
    ],
    "phase_plan.decompose": [
      "E.PHASE_WITHOUT_SCHEDULE",
      "E.PHASE_WITH_EXPLICIT_SCHEDULE",
      "E.PHASE_MULTI_RESEARCH_PROGRESS"
    ],
    "daily_todo.initial": [
      "E.TODO_WITHOUT_HISTORY",
      "E.TODO_WITH_EXPLICIT_SCHEDULE"
    ],
    "daily_todo.generate": [
      "E.TODO_WITH_EXPLICIT_SCHEDULE",
      "E.TODO_WITH_UNKNOWN_PROGRESS",
      "E.TODO_FROM_MIXED_PHASE"
    ],
    "daily_review.generate": [
      "E.REVIEW_STATUS_CONFLICT",
      "E.REVIEW_UNKNOWN_PROGRESS_NEXT",
      "E.REVIEW_KEEP_EXISTING_NEXT"
    ],
    "daily_todo.adjust": [
      "E.MANUAL_MINIMAL_OVERRIDE",
      "E.MANUAL_HARD_CONFLICT"
    ],
    "daily_todo.intraday_adjust": [
      "E.AUTO_RESCHEDULE_OVERDUE",
      "E.AUTO_CAPACITY_SHORTAGE"
    ],
    "daily_todo.adjust_repair": [],
    "daily_todo.intraday_repair:auto_delta": [],
    "daily_todo.intraday_repair:initial_generate": [],
    "daily_todo.intraday_repair:day_generate": [],
    "phase_plan.adjust": [
      "E.PHASE_ADJUST_ACTUAL_BASELINE",
      "E.PHASE_ADJUST_UNKNOWN_BASELINE"
    ],
    "phase_plan.summarize": [
      "E.SUMMARY_WITH_EVIDENCE",
      "E.SUMMARY_WITH_DATA_GAPS"
    ]
  },
  "boundaryText": "以下输入输出均为虚构示例，不是用户记录；只处理当前User JSON，遵守规则与字段契约，不照搬示例内容。"
};
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  else root.LlmPromptExamples = data;
})(globalThis);

