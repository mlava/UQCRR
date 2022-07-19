///// Settings /////
// Enter the required settings for each variable below
// See https://roamresearch.com/#/app/RoamScripts/page/CbDFNmcHQ for an explanation of each setting
var myToken = "add API token here";
var TodoistAccount = "Free";
var TodoistInboxId = "add inbox id here";
var TodoistImportTag = "Quick Capture";
var TodoistLabelMode = "Unlabelled";
var TodoistLabelId = "";
var TodoistOutputTodo = "False"; // change to True if you want the item to appear as a Roam TODO
var TodoistGetDescription = "False"; // change to True if you want to import the item description from Todoist
var TodoistNoTag = "False";
var TodoistCreatedDate = "False"; // change to True if you want to import the item created date
var TodoistDueDates = "False"; // change to True if you want to import the item due date
var TodoistPriority = "False"; // change to True if you want to import the item priority
///// End Settings /////

function convertToRoamDate(dateString) {
  var parsedDate = dateString.split('-');
  var year = parsedDate[0];
  var month = Number(parsedDate[1]);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var monthName = months[month - 1];
  var day = Number(parsedDate[2]);
  let suffix = (day >= 4 && day <= 20) || (day >= 24 && day <= 30)
    ? "th"
    : ["st", "nd", "rd"][day % 10 - 1];
  return "" + monthName + " " + day + suffix + ", " + year + "";
}

var url = "https://api.todoist.com/rest/v1/tasks?project_id=" + TodoistInboxId + "";
if (TodoistLabelMode == "Label") {
  url += "&label_id=" + TodoistLabelId + "";
}

var bearer = 'Bearer ' + myToken;
var myTasks = $.ajax({ url: url, type: "GET", async: false, headers: { Authorization: bearer }, }).responseText;

let taskList = [];
let subTaskList = [];
for await (task of JSON.parse(myTasks)) {
  if (task.hasOwnProperty('parent_id')) {
    subTaskList.push({ id: task.id, parent_id: task.parent_id, order: task.order, content: task.content });
  } else {
    taskList.push({ id: task.id, uid: "temp" });
  }
}
//console.error(taskList, subTaskList);
var thisBlock = startBlock;

for (var i = 0; i < taskList.length; i++) {
  for await (task of JSON.parse(myTasks)) {
    if (taskList[i].id == task.id) {
      // print task
      var itemString = "";
      if (TodoistOutputTodo == "True") {
        itemString += "{{[[TODO]]}} "
      }
      itemString += "" + task.content + "";
      if (TodoistNoTag !== "True") {
        itemString += " #[[" + TodoistImportTag + "]]";
      }
      if (TodoistCreatedDate == "True") {
        var createdDate = task.created.split("T");
        itemString += " Created: [[" + convertToRoamDate(createdDate[0]) + "]]";
      }
      if (TodoistDueDates == "True" && task.hasOwnProperty('due')) {
        itemString += " Due: [[" + convertToRoamDate(task.due.date) + "]]";
      }
      if (TodoistPriority == "True") {
        if (task.priority == "4") {
          var priority = "1";
        } else if (task.priority == "3") {
          var priority = "2";
        } else if (task.priority == "2") {
          var priority = "3";
        } else if (task.priority == "1") {
          var priority = "4";
        }
        itemString += " #Priority-" + priority + "";
      }

      thisBlock1 = await roam42.common.createSiblingBlock(thisBlock, itemString, true);
      if (i == 0) {
        await roam42.common.deleteBlock(thisBlock);
      }
      thisBlock = thisBlock1;
      let newBlock = thisBlock;

      // print description
      if (TodoistGetDescription == "True" && task.description) {
        await roam42.common.createBlock(newBlock, 1, task.description);
      }
      // print comments
      if (task.comment_count > 0) {
        var url = "https://api.todoist.com/rest/v1/comments?task_id=" + task.id + "";
        var myComments = $.ajax({ url: url, type: "GET", async: false, headers: { Authorization: bearer }, }).responseText;
        let commentsJSON = await JSON.parse(myComments);
        var commentString = "";
        for (var j = 0; j < commentsJSON.length; j++) {
          console.error(commentsJSON[j]);
          commentString = "";
          if (commentsJSON[j].hasOwnProperty('attachment') && TodoistAccount == "Premium") {
            if (commentsJSON[j].attachment.file_type == "application/pdf") {
              commentString = "{{pdf: " + commentsJSON[j].attachment.file_url + "}}";
            } else if (commentsJSON[j].attachment.file_type == "image/jpeg" || commentsJSON[j].attachment.file_type == "image/png") {
              commentString = "![](" + commentsJSON[j].attachment.file_url + ")";
            } else {
              commentString = "" + commentsJSON[j].content + "";
            }
          } else if (commentsJSON[j].hasOwnProperty('attachment')) {
              if (commentsJSON[j].attachment.file_type == "text/html") {
                commentString = "" + commentsJSON[j].content + " [Email Body](" + commentsJSON[j].attachment.file_url + ")";
              }
          } else {
            commentString = "" + commentsJSON[j].content + "";
          }
          
          console.error(commentsJSON[j].content, commentString);
          if (commentString.length > 0) {
            if (j == 0) {
              newBlock = await roam42.common.createBlock(newBlock, 1, commentString);
            } else {
              newBlock = await roam42.common.createSiblingBlock(newBlock, commentString, true);
            }
          }
        }
        // print subtasks
        for (var k = 0; k < subTaskList.length; k++) {
          if (subTaskList[k].parent_id == task.id) {
            newBlock = await roam42.common.createSiblingBlock(newBlock, subTaskList[k].content, true);
          }
        }
      } else {
        // print subtasks
        var n = 0;
        for (var k = 0; k < subTaskList.length; k++) {
          if (subTaskList[k].parent_id == task.id) {
            if (n == 0) {
              newBlock = await roam42.common.createBlock(newBlock, 1, subTaskList[k].content);
              n = 1;
            } else {
              newBlock = await roam42.common.createSiblingBlock(newBlock, subTaskList[k].content, true);
            }
          }
        }
      }
      var url = "https://api.todoist.com/rest/v1/tasks/" + task.id + "";
      var settings = {
        "url": url,
        "method": "DELETE",
        "timeout": 0,
        "headers": {
          "Authorization": bearer
        },
      };
      $.ajax(settings);
    }
  }
}
