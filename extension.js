export default {
  onload: ({extensionAPI}) => {
    ///// Settings /////
    // Enter the required settings for each variable below
    // See https://roamresearch.com/#/app/RoamScripts/page/CbDFNmcHQ for an explanation of each setting
    extensionAPI.settings.panel.create({
      tabTitle: "UQCRR",
      settings: [
        // var myToken = "add API token here";
        {
          id: "my-token",
          name: "My Token",
          description: "",
          action: { type: "input", placeholder: "***" },
        },
        // var TodoistAccount = "Free";
        {
          id: "todoist-account",
          name: "Todoist Account",
          description: "",
          action: { type: "input", placeholder: "Free" },
        },
        // var TodoistInboxId = "add inbox id here";
        {
          id: "todoist-inbox-id",
          name: "Todoist Inbox ID",
          description: "",
          action: { type: "input", placeholder: "add inbox id here" },
        },
        // var TodoistImportTag = "Quick Capture";
        {
          id: "todoist-import-tag",
          name: "Todoist Import Tag",
          description: "",
          action: { type: "input", placeholder: "Quick Capture" },
        },
        // var TodoistLabelMode = "Unlabelled";
       {
          id: "todoist-label-mode",
          name: "Todoist Label Mode",
          description: "",
          action: { type: "input", placeholder: "Unlabelled" },
        },
        // var TodoistLabelId = "";
        {
          id: "todoist-label-id",
          name: "Todoist Label ID",
          description: "",
          action: { type: "input", placeholder: "" },
        },
        // var TodoistOutputTodo = "False"; 
        {
          id: "todoist-output-todo",
          name: "Todoist Inbox ID",
          description: "change to True if you want the item to appear as a Roam TODO",
          action: { type: "switch" },
        },
        // var TodoistGetDescription = "False"; // change to True if you want to import the item description from Todoist
        {
          id: "todoist-get-description",
          name: "Todoist Get Description",
          description: "change to True if you want to import the item description from Todoist",
          action: { type: "switch" },
        },
        // var TodoistNoTag = "False";
        {
          id: "todoist-no-tag",
          name: "Todoist No Tag",
          description: "",
          action: { type: "switch" },
        },
        // var TodoistCreatedDate = "False"; // change to True if you want to import the item created date
        {
          id: "todoist-created-date",
          name: "Todoist Created Date",
          description: "change to True if you want to import the item created date",
          action: { type: "switch" },
        },
        // var TodoistDueDates = "False"; // change to True if you want to import the item due date
        {
          id: "todoist-due-dates",
          name: "Todoist Due Dates",
          description: "change to True if you want to import the item due date",
          action: { type: "switch" },
        },
        // var TodoistPriority = "False"; // change to True if you want to import the item priority
        {
          id: "todoist-priority",
          name: "Todoist Priority",
          description: "change to True if you want to import the item priority",
          action: { type: "switch" },
        },
      ]
    })
    ///// End Settings /////

    const importTodoist = () => {
      ///// Settings /////
      // Enter the required settings for each variable below
      // See https://roamresearch.com/#/app/RoamScripts/page/CbDFNmcHQ for an explanation of each setting
      var myToken = extensionAPI.settings.get("my-token") || "add API token here";
      var TodoistAccount = extensionAPI.settings.get("todoist-account") || "Free";
      var TodoistInboxId = extensionAPI.settings.get("todoist-inbox-id") || "add inbox id here";
      var TodoistImportTag = extensionAPI.settings.get("todoist-import-tag") || "Quick Capture";
      var TodoistLabelMode = extensionAPI.settings.get("todoist-label-mode") || "Unlabelled";
      var TodoistLabelId = extensionAPI.settings.get("todoist-label-id") || "";
      var TodoistOutputTodo = extensionAPI.settings.get("todoist-output-todo") || "False";
      var TodoistGetDescription = extensionAPI.settings.get("todoist-get-description") || "False";
      var TodoistNoTag = extensionAPI.settings.get("todoist-no-tag") || "False";
      var TodoistCreatedDate = extensionAPI.settings.get("todoist-created-date") || "False"; 
      var TodoistDueDates = extensionAPI.settings.get("todoist-due-dates") || "False"; 
      var TodoistPriority = extensionAPI.settings.get("todoist-priority") || "False"; 
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
    }

    // you can expose it to the Roam Command Palette
    window.roamAlphaAPI.ui.commandPalette.addCommand({
      label: "Import Todoist",
      callback: importTodoist,
    })

    // or even register as a smartblock
    const args = {
      text: 'IMPORTTODOIST',
      help: "What does this do?",
      handler: (context) => importTodoist,
    }
    if (window.roamjs?.extension?.smartblocks) {
      window.roamjs.extension.smartblocks.registerCommand(args);
    } else {
      document.body.addEventListener(
        `roamjs:smartblocks:loaded`,
        () =>
          window.roamjs?.extension.smartblocks &&
          window.roamjs.extension.smartblocks.registerCommand(args)
      );
    }
  }
}

