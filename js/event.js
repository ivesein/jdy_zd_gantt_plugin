function btnFunc(name) {
	gantt.performAction(name)
}
//缩放按钮功能
function zoomIn() {
	gantt.ext.zoom.zoomIn()
}
function zoomOut() {
	gantt.ext.zoom.zoomOut()
}
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
	var json = JSON.parse(gantt.serialize())
	console.log("json>>>", json)
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
