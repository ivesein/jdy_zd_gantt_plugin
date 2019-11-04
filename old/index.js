/*
 * @Description:
 * @Version:
 * @Company: ZD
 * @Author: Ivesein Zhang
 * @Date: 2019-09-09 11:07:21
 * @LastEditors: Ivesein Zhang
 * @LastEditTime: 2019-09-16 15:20:17
 */
;(function(KDApi, $) {
	function MyComponent(model) {
		this._setModel(model)
	}

	MyComponent.prototype = {
		_setModel: function(model) {
			this.model = model
		},
		init: function(props) {
			setHtml(this.model, props)
			console.log("-----init", this.model, props)
		},
		update: function(props) {
			console.log("-----update", this.model, props)
		},
		destoryed: function() {
			console.log("-----destoryed", this.model)
		}
	}

	var setHtml = function(model, props) {
		// KDApi.loadFile('./js/jquery.min.js',model.schemaId,null)
		KDApi.loadFile("./css/dhtmlxgantt.css?v=6.2.4", model.schemaId, () => {
			KDApi.loadFile("./css/customstyle.css", model.schemaId, () => {
				KDApi.loadFile("./css/iconfont.css", model.schemaId, () => {
					KDApi.loadFile("./js/dhtmlxgantt.js",model.schemaId,()=>{
						KDApi.loadFile("./js/locale_cn.js", model.schemaId, () => {
							KDApi.loadFile("./js/event.js", model.schemaId, () => {
								KDApi.loadFile("./js/dhtmlxgantt_critical_path.js", model.schemaId, () => {
									KDApi.loadFile("./js/dhtmlxgantt_auto_scheduling.js", model.schemaId, () => {
										KDApi.loadFile("./js/dhtmlxgantt_multiselect.js", model.schemaId, () => {
											KDApi.loadFile("./js/dhtmlxgantt_undo.js", model.schemaId, () => {
												KDApi.loadFile("./js/dhtmlxgantt_marker.js", model.schemaId, () => {
													KDApi.loadFile("./js/testdata_with_planned_date.js", model.schemaId, () => {
														KDApi.templateFilePath(
															"./html/gantt.html",
															model.schemaId,
															{
																path:
																	KDApi.nameSpace(model.schemaId) +
																	"./img/lock.png"
															}
														).then(result => {
															model.dom.innerHTML = result
															console.log(result)
															// initEvent(model, props)
															// 添加任务基准
															gantt.locale.labels.baseline_enable_button = "设置基准"
															gantt.locale.labels.baseline_disable_button = "移除基准"

															gantt.config.lightbox.sections = [
																{
																	name: "description",
																	height: 70,
																	map_to: "text",
																	type: "textarea",
																	focus: true
																},
																{ name: "time", map_to: "auto", type: "duration" },
																{
																	name: "baseline",
																	map_to: {
																		start_date: "planned_start",
																		end_date: "planned_end"
																	},
																	button: true,
																	type: "duration_optional"
																}
															]
															gantt.locale.labels.section_baseline = "计划工期"
															// adding baseline display
															gantt.addTaskLayer(function draw_planned(task) {
																if (task.planned_start && task.planned_end) {
																	var sizes = gantt.getTaskPosition(
																		task,
																		task.planned_start,
																		task.planned_end
																	)
																	var el = document.createElement("div")
																	el.className = "baseline"
																	el.style.left = sizes.left + "px"
																	el.style.width = sizes.width + "px"
																	el.style.top = sizes.top + gantt.config.task_height + 13 + "px"
																	return el
																}
																return false
															})

															gantt.templates.task_class = function(start, end, task) {
																if (task.planned_end) {
																	var classes = ["has-baseline"]
																	if (end.getTime() > task.planned_end.getTime()) {
																		classes.push("overdue")
																	}
																	return classes.join(" ")
																}
															}

															gantt.attachEvent("onTaskLoading", function(task) {
																task.planned_start = gantt.date.parseDate(
																	task.planned_start,
																	"xml_date"
																)
																task.planned_end = gantt.date.parseDate(
																	task.planned_end,
																	"xml_date"
																)
																return true
															})
															// 动态计算任务进度
															;(function dynamicProgress() {
																function calculateSummaryProgress(task) {
																	if (task.type != gantt.config.types.project)
																		return task.progress
																	var totalToDo = 0
																	var totalDone = 0
																	gantt.eachTask(function(child) {
																		if (child.type != gantt.config.types.project) {
																			totalToDo += child.duration
																			totalDone += (child.progress || 0) * child.duration
																		}
																	}, task.id)
																	if (!totalToDo) return 0
																	else return totalDone / totalToDo
																}

																function refreshSummaryProgress(id, submit) {
																	if (!gantt.isTaskExists(id)) return

																	var task = gantt.getTask(id)
																	task.progress = calculateSummaryProgress(task)

																	if (!submit) {
																		gantt.refreshTask(id)
																	} else {
																		gantt.updateTask(id)
																	}

																	if (!submit && gantt.getParent(id) !== gantt.config.root_id) {
																		refreshSummaryProgress(gantt.getParent(id), submit)
																	}
																}

																gantt.attachEvent("onParse", function() {
																	gantt.eachTask(function(task) {
																		task.progress = calculateSummaryProgress(task)
																	})
																})

																gantt.attachEvent("onAfterTaskUpdate", function(id) {
																	refreshSummaryProgress(gantt.getParent(id), true)
																})

																gantt.attachEvent("onTaskDrag", function(id) {
																	refreshSummaryProgress(gantt.getParent(id), false)
																})
																gantt.attachEvent("onAfterTaskAdd", function(id) {
																	refreshSummaryProgress(gantt.getParent(id), true)
																})
																;(function() {
																	var idParentBeforeDeleteTask = 0
																	gantt.attachEvent("onBeforeTaskDelete", function(id) {
																		idParentBeforeDeleteTask = gantt.getParent(id)
																	})
																	gantt.attachEvent("onAfterTaskDelete", function() {
																		refreshSummaryProgress(idParentBeforeDeleteTask, true)
																	})
																})()
															})()
															// 双击连线编辑连线功能
															;(function() {
																function endPopup() {
																	modal = null
																	editLinkId = null
																}
																function cancelEditLink() {
																	endPopup()
																}

																function deleteLink() {
																	gantt.deleteLink(editLinkId)
																	endPopup()
																}

																function saveLink() {
																	var link = gantt.getLink(editLinkId)

																	var lagValue = modal.querySelector(".lag-input").value
																	if (!isNaN(parseInt(lagValue, 10))) {
																		link.lag = parseInt(lagValue, 10)
																	}

																	gantt.updateLink(link.id)
																	if (gantt.autoSchedule) {
																		gantt.autoSchedule(link.source)
																	}
																	endPopup()
																}

																var modal
																var editLinkId
																gantt.attachEvent("onLinkDblClick", function(id, e) {
																	editLinkId = id
																	var link = gantt.getLink(id)
																	var linkTitle
																	switch (link.type) {
																		case gantt.config.links.finish_to_start:
																			linkTitle = "FS"
																			break
																		case gantt.config.links.finish_to_finish:
																			linkTitle = "FF"
																			break
																		case gantt.config.links.start_to_start:
																			linkTitle = "SS"
																			break
																		case gantt.config.links.start_to_finish:
																			linkTitle = "SF"
																			break
																	}

																	linkTitle +=
																		" " +
																		gantt.getTask(link.source).text +
																		" -> " +
																		gantt.getTask(link.target).text

																	modal = gantt.modalbox({
																		title: linkTitle,
																		text:
																			"<div>" +
																			"<label>延迟 <input type='number' class='lag-input' /></label>" +
																			"</div>",
																		buttons: [
																			{ label: "保存", css: "link-save-btn", value: "save" },
																			{
																				label: "取消",
																				css: "link-cancel-btn",
																				value: "cancel"
																			},
																			{
																				label: "删除",
																				css: "link-delete-btn",
																				value: "delete"
																			}
																		],
																		width: "500px",
																		type: "popup-css-class-here",
																		callback: function(result) {
																			switch (result) {
																				case "save":
																					saveLink()
																					break
																				case "cancel":
																					cancelEditLink()
																					break

																				case "delete":
																					deleteLink()
																					break
																			}
																		}
																	})

																	modal.querySelector(".lag-input").value = link.lag || 0

																	//any custom logic here
																	return false
																})
															})()
															//关键路径按钮功能
															function updateCriticalPath(toggle) {
																toggle.enabled = !toggle.enabled
																if (toggle.enabled) {
																	// toggle.innerHTML = "隐藏关键路径"
																	gantt.config.highlight_critical_path = true
																} else {
																	// toggle.innerHTML = "显示关键路径"
																	gantt.config.highlight_critical_path = false
																}
																gantt.render()
															}

															// 保存获取json数据
															function save() {
																var json = gantt.serialize()
																console.log("json>>>", json)
															}

															// gantt 配置
															gantt.config.scale_height = 50
															gantt.config.link_line_width = 3
															gantt.config.link_line_height = 3
															gantt.config.row_height = 42
															gantt.config.task_height = 20
															gantt.config.grid_resize = true
															gantt.config.drag_links = true
															gantt.config.drag_progress = true
															gantt.config.work_time = true
															gantt.config.details_on_create = true
															// 添加自动规划
															gantt.config.auto_scheduling = true
															gantt.config.auto_scheduling_strict = true
															gantt.config.auto_scheduling_compatibility = true

															// 从设置的项目开始日期自动计算各任务开始结束日期
															gantt.config.schedule_from_end = false
															// gantt.config.project_start = new Date("2019 / 11 / 1")
															var start = new Date("2019/9/18")
															// 添加状态线marker
															var date_to_str = gantt.date.date_to_str(gantt.config.task_date)
															var today = new Date()
															gantt.addMarker({
																start_date: today,
																css: "today",
																text: "今天",
																title: "今天: " + date_to_str(today)
															})
															gantt.addMarker({
																start_date: start,
																css: "status_line",
																text: "开始日期",
																title: "开始日期: " + date_to_str(start)
															})
															var projectEnd = new Date("2019/10/2")
															gantt.addMarker({
																start_date: projectEnd,
																css: "end_date",
																text: "结束日期",
																title: "结束日期: " + date_to_str(today)
															})
															// 设置时间尺度
															// gantt.config.scales = [
															// 	{ unit: "month", step: 1, format: "%Y,%F" },
															// 	// { unit: "day", step: 1, format: "%j" },
															// 	{ unit: "day", step: 1, format: "%j &nbsp;&nbsp;&nbsp;%D" }
															// ]

															// 设置type为project任务条的样式
															gantt.config.type_renderers[gantt.config.types.project] = function(
																task
															) {
																var main_el = document.createElement("div")
																main_el.setAttribute(gantt.config.task_attribute, task.id)
																var size = gantt.getTaskPosition(task)
																main_el.innerHTML = [
																	"<div class='project-left'></div>",
																	"<div class='project-right'></div>"
																].join("")
																main_el.className = "custom-project"

																main_el.style.left = size.left + "px"
																main_el.style.top = size.top + 7 + "px"
																main_el.style.width = size.width + "px"

																return main_el
															}

															// 为type为project的任务条添加样式
															gantt.templates.grid_row_class = function(start, end, task) {
																if (task.type == gantt.config.types.project) {
																	return "project-line"
																}
															}
															gantt.templates.timeline_cell_class = function(item, date) {
																if (date.getDay() == 0 || date.getDay() == 6) {
																	return "weekend"
																}
															}
															gantt.templates.task_text = function() {
																return ""
															}

															//为任务名称添加搜索功能
															var filterValue = ""
															gantt.$doFilter = function(value) {
																filterValue = value
																gantt.refreshData()
															}

															gantt.attachEvent("onBeforeTaskDisplay", function(id, task) {
																if (!filterValue) return true

																var normalizedText = task.text.toLowerCase()
																var normalizedValue = filterValue.toLowerCase()
																return normalizedText.indexOf(normalizedValue) > -1
															})

															gantt.attachEvent("onGanttRender", function() {
																gantt.$root.querySelector("[data-text-filter]").value = filterValue
															})
															gantt.attachEvent("onAfterTaskDrag", function(id, mode, e) {
																gantt.autoSchedule()
															})
															// 设置grid 按钮 添加 新增 编辑 删除任务功能
															var colHeader =
																	'<div class="gantt_grid_head_cell gantt_grid_head_add" onclick="gantt.createTask()"></div>',
																colContent = function(task) {
																	return (
																		'<i class="fa iconfont icon-bianji fa-pencil" onclick="clickGridButton(' +
																		task.id +
																		", 'edit')\"></i>" +
																		'<i class="fa iconfont icon-iconaddsuccess fa-plus" onclick="clickGridButton(' +
																		task.id +
																		", 'add')\"></i>" +
																		'<i class="fa iconfont icon-shanchu fa-times" onclick="clickGridButton(' +
																		task.id +
																		", 'delete')\"></i>"
																	)
																}
															function clickGridButton(id, action) {
																switch (action) {
																	case "edit":
																		gantt.showLightbox(id)
																		break
																	case "add":
																		gantt.createTask(null, id)
																		break
																	case "delete":
																		gantt.confirm({
																			title: gantt.locale.labels.confirm_deleting_title,
																			text: gantt.locale.labels.confirm_deleting,
																			callback: function(res) {
																				if (res) gantt.deleteTask(id)
																			}
																		})
																		break
																}
															}
															//设置左侧grid 内容
															var textFilter =
																"<div class='searchEl'>任务名称 <input data-text-filter id='search' type='text' placeholder='搜索任务...' oninput='gantt.$doFilter(this.value)'></div>"
															gantt.config.columns = [
																{
																	name: "wbs",
																	label: "WBS",
																	min_width: 50,
																	width: 50,
																	template: gantt.getWBSCode
																	// resize: true
																},
																{
																	name: "buttons",
																	label: colHeader,
																	width: 80,
																	template: colContent
																},
																{
																	name: "text",
																	label: textFilter,
																	width: 260,
																	tree: true
																	// resize: true
																},
																{
																	name: "start_date",
																	label: "开始日期",
																	width: 80,
																	align: "center"
																},
																{
																	name: "end_date",
																	label: "结束日期",
																	align: "center",
																	width: 80,
																	template: function(task) {
																		return gantt.templates.date_grid(task.end_date, task)
																	}
																	// resize: true
																},
																{
																	name: "progress",
																	label: "进度",
																	align: "center",
																	width: 60,
																	template: function(task) {
																		return Math.round(task.progress * 100) + "%"
																	}
																	// resize: true
																},
																{ name: "duration", label: "工期", width: 60, align: "center" }
															]

															// 设置甘特图布局
															gantt.config.layout = {
																css: "gantt_container",
																cols: [
																	{
																		width: 470,
																		min_width: 300,
																		rows: [
																			{
																				view: "grid",
																				scrollX: "gridScroll",
																				scrollable: true,
																				scrollY: "scrollVer"
																			},
																			{
																				view: "scrollbar",
																				id: "gridScroll",
																				group: "horizontal"
																			}
																		]
																	},
																	{ resizer: false, width: 1 },
																	{
																		rows: [
																			{
																				view: "timeline",
																				scrollX: "scrollHor",
																				scrollY: "scrollVer"
																			},
																			{
																				view: "scrollbar",
																				id: "scrollHor",
																				group: "horizontal"
																			}
																		]
																	},
																	{ view: "scrollbar", id: "scrollVer" }
																]
															}

															//格式化日期
															gantt.config.xml_date = "%Y-%m-%d %H:%i:%s"

															// 放大缩小时间尺度
															var zoomConfig = {
																levels: [
																	{
																		name: "day",
																		scale_height: 50,
																		min_column_width: 80,
																		scales: [{ unit: "day", step: 1, format: "%d %M" }]
																	},
																	{
																		name: "week",
																		scale_height: 50,
																		min_column_width: 50,
																		scales: [
																			{
																				unit: "week",
																				step: 1,
																				format: function(date) {
																					var dateToStr = gantt.date.date_to_str("%d %M")
																					var endDate = gantt.date.add(date, -6, "day")
																					var weekNum = gantt.date.date_to_str("%W")(date)
																					return (
																						"#" +
																						weekNum +
																						", " +
																						dateToStr(date) +
																						" - " +
																						dateToStr(endDate)
																					)
																				}
																			},
																			{ unit: "day", step: 1, format: "%j %D" }
																		]
																	},
																	{
																		name: "month",
																		scale_height: 50,
																		min_column_width: 120,
																		scales: [
																			{ unit: "month", format: "%F, %Y" },
																			{ unit: "week", format: "Week #%W" }
																		]
																	},
																	{
																		name: "quarter",
																		height: 50,
																		min_column_width: 90,
																		scales: [
																			{ unit: "month", step: 1, format: "%M" },
																			{
																				unit: "quarter",
																				step: 1,
																				format: function(date) {
																					var dateToStr = gantt.date.date_to_str("%M")
																					var endDate = gantt.date.add(
																						gantt.date.add(date, 3, "month"),
																						-1,
																						"day"
																					)
																					return (
																						dateToStr(date) + " - " + dateToStr(endDate)
																					)
																				}
																			}
																		]
																	},
																	{
																		name: "year",
																		scale_height: 50,
																		min_column_width: 30,
																		scales: [{ unit: "year", step: 1, format: "%Y" }]
																	}
																]
															}

															gantt.ext.zoom.init(zoomConfig)
															gantt.ext.zoom.setLevel("day")
															//初始化甘特图
															gantt.init("gantt_here")

															//任务条右侧显示任务名称
															gantt.templates.rightside_text = function(start, end, task) {
																// 如果逾期 显示逾期日期
																if (task.planned_end) {
																	if (end.getTime() > task.planned_end.getTime()) {
																		var overdue = Math.ceil(
																			Math.abs(
																				(end.getTime() - task.planned_end.getTime()) /
																					(24 * 60 * 60 * 1000)
																			)
																		)
																		var text = "<b>逾期: " + overdue + " 天</b>"
																		return task.text + " " + text
																	}
																}
																return task.text
															}

															// 给选择的任务添加样式
															gantt.templates.task_class = gantt.templates.grid_row_class = gantt.templates.task_row_class = function(
																start,
																end,
																task
															) {
																if (gantt.isSelectedTask(task.id)) return "gantt_selected"
															}
															//载入数据
															gantt.parse(projects_with_milestones)

															//缩放按钮功能
															function zoomIn() {
																gantt.ext.zoom.zoomIn()
															}
															function zoomOut() {
																gantt.ext.zoom.zoomOut()
															}

															// 升级降级按钮功能
															;(function() {
																function shiftTask(task_id, direction) {
																	var task = gantt.getTask(task_id)
																	task.start_date = gantt.date.add(
																		task.start_date,
																		direction,
																		"day"
																	)
																	task.end_date = gantt.calculateEndDate(
																		task.start_date,
																		task.duration
																	)
																	gantt.updateTask(task.id)
																}

																var actions = {
																	indent: function indent(task_id) {
																		var prev_id = gantt.getPrevSibling(task_id)
																		while (gantt.isSelectedTask(prev_id)) {
																			var prev = gantt.getPrevSibling(prev_id)
																			if (!prev) break
																			prev_id = prev
																		}
																		if (prev_id) {
																			var new_parent = gantt.getTask(prev_id)
																			gantt.moveTask(
																				task_id,
																				gantt.getChildren(new_parent.id).length,
																				new_parent.id
																			)
																			new_parent.type = gantt.config.types.project
																			new_parent.$open = true
																			gantt.updateTask(task_id)
																			gantt.updateTask(new_parent.id)
																			return task_id
																		}
																		return null
																	},
																	outdent: function outdent(
																		task_id,
																		initialIndexes,
																		initialSiblings
																	) {
																		var cur_task = gantt.getTask(task_id)
																		var old_parent = cur_task.parent
																		if (
																			gantt.isTaskExists(old_parent) &&
																			old_parent != gantt.config.root_id
																		) {
																			var index = gantt.getTaskIndex(old_parent) + 1
																			var prevSibling = initialSiblings[task_id].first

																			if (gantt.isSelectedTask(prevSibling)) {
																				index +=
																					initialIndexes[task_id] -
																					initialIndexes[prevSibling]
																			}
																			gantt.moveTask(
																				task_id,
																				index,
																				gantt.getParent(cur_task.parent)
																			)
																			if (!gantt.hasChild(old_parent))
																				gantt.getTask(old_parent).type =
																					gantt.config.types.task
																			gantt.updateTask(task_id)
																			gantt.updateTask(old_parent)
																			return task_id
																		}
																		return null
																	},
																	del: function(task_id) {
																		if (gantt.isTaskExists(task_id)) gantt.deleteTask(task_id)
																		return task_id
																	},
																	moveForward: function(task_id) {
																		shiftTask(task_id, 1)
																	},
																	moveBackward: function(task_id) {
																		shiftTask(task_id, -1)
																	}
																}
																var cascadeAction = {
																	indent: true,
																	outdent: true,
																	del: true
																}

																gantt.performAction = function(actionName) {
																	var action = actions[actionName]
																	if (!action) return

																	// updates multiple tasks/links at once
																	gantt.batchUpdate(function() {
																		// need to preserve order of items on indent/outdent,
																		// remember order before changing anything:
																		var indexes = {}
																		var siblings = {}
																		gantt.eachSelectedTask(function(task_id) {
																			indexes[task_id] = gantt.getTaskIndex(task_id)
																			siblings[task_id] = {
																				first: null
																			}

																			var currentId = task_id
																			while (
																				gantt.isTaskExists(
																					gantt.getPrevSibling(currentId)
																				) &&
																				gantt.isSelectedTask(
																					gantt.getPrevSibling(currentId)
																				)
																			) {
																				currentId = gantt.getPrevSibling(currentId)
																			}
																			siblings[task_id].first = currentId
																		})

																		var updated = {}
																		gantt.eachSelectedTask(function(task_id) {
																			if (cascadeAction[actionName]) {
																				if (!updated[gantt.getParent(task_id)]) {
																					var updated_id = action(
																						task_id,
																						indexes,
																						siblings
																					)

																					updated[updated_id] = true
																				} else {
																					updated[task_id] = true
																				}
																			} else {
																				action(task_id, indexes)
																			}
																		})
																	})
																}
															})()
															var btnFunc = function(name) {
																gantt.performAction(name)
															}
														})
													})
												})
											})
										})
									})
								})
							})	
						})
					})
				})
			})
		})
	}
	KDApi.register("zd_gantt_V1.0.201909.1", MyComponent)
})(window.KDApi, jQuery)