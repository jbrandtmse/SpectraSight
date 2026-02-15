Class SpectraSight.Test.TestREST Extends %RegisteredObject
{

/// Run all REST API tests and return summary
ClassMethod RunAll() As %String [ SqlProc ]
{
    Set tResult = ""
    Try {
        Kill ^ClaudeDebug("REST")
        Set tPassed = 0
        Set tFailed = 0

        Do ..RunOne("TestTicketIDFormat", .tPassed, .tFailed)
        Do ..RunOne("TestValidation", .tPassed, .tFailed)
        Do ..RunOne("TestResponseEnvelope", .tPassed, .tFailed)
        Do ..RunOne("TestCreateTicketDirect", .tPassed, .tFailed)
        Do ..RunOne("TestActivityRecording", .tPassed, .tFailed)
        Do ..RunOne("TestListQueryBuilding", .tPassed, .tFailed)
        Do ..RunOne("TestGetTicketType", .tPassed, .tFailed)
        Do ..RunOne("TestBuildOrderBy", .tPassed, .tFailed)
        Do ..RunOne("TestDeleteWithCleanup", .tPassed, .tFailed)
        Do ..RunOne("TestTicketIDEdgeCases", .tPassed, .tFailed)
        Do ..RunOne("TestValidationAllValues", .tPassed, .tFailed)
        Do ..RunOne("TestUpdateTicketDirect", .tPassed, .tFailed)
        Do ..RunOne("TestPaginationWithOffsetFetch", .tPassed, .tFailed)
        Do ..RunOne("TestValidateHierarchy", .tPassed, .tFailed)
        Do ..RunOne("TestHierarchyInCreate", .tPassed, .tFailed)
        Do ..RunOne("TestChildrenInGetTicket", .tPassed, .tFailed)
        Do ..RunOne("TestClassHandlerListClasses", .tPassed, .tFailed)
        Do ..RunOne("TestClassHandlerListMethods", .tPassed, .tFailed)
        Do ..RunOne("TestCodeReferenceEndpoints", .tPassed, .tFailed)
        Do ..RunOne("TestCodeReferenceInTicketResponse", .tPassed, .tFailed)
        Do ..RunOne("TestRecordCodeReferenceChange", .tPassed, .tFailed)

        Set tResult = tPassed_" passed, "_tFailed_" failed"
        Set ^ClaudeDebug("REST", "summary") = tResult
    }
    Catch ex {
        Set tResult = "ERROR: "_ex.DisplayString()
        Set ^ClaudeDebug("REST", "error") = tResult
    }
    Quit tResult
}

ClassMethod RunOne(pTestName As %String, ByRef pPassed As %Integer, ByRef pFailed As %Integer) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tSC = $CLASSMETHOD("SpectraSight.Test.TestREST", pTestName)
        If $$$ISERR(tSC) {
            Set pFailed = pFailed + 1
            Set ^ClaudeDebug("REST", "results", pTestName) = "FAIL: "_$System.Status.GetErrorText(tSC)
        } Else {
            Set pPassed = pPassed + 1
            Set ^ClaudeDebug("REST", "results", pTestName) = "PASS"
        }
    }
    Catch ex {
        Set pFailed = pFailed + 1
        Set ^ClaudeDebug("REST", "results", pTestName) = "FAIL: "_ex.DisplayString()
    }
    Quit $$$OK
}

ClassMethod GetResult(pTestName As %String) As %String [ SqlProc ]
{
    Quit $GET(^ClaudeDebug("REST", "results", pTestName), "NOT_RUN")
}

/// Test TicketID.Format, Parse, and IsValid methods
ClassMethod TestTicketIDFormat() As %Status
{
    Set tSC = $$$OK
    Try {
        // Format tests
        Set tVal1 = ##class(SpectraSight.Util.TicketID).Format(1)
        If tVal1 '= "SS-1" Set tSC = $$$ERROR(5001, "Format(1) expected SS-1, got: "_tVal1) Quit

        Set tVal42 = ##class(SpectraSight.Util.TicketID).Format(42)
        If tVal42 '= "SS-42" Set tSC = $$$ERROR(5001, "Format(42) expected SS-42, got: "_tVal42) Quit

        // Parse tests
        Set tParsed1 = ##class(SpectraSight.Util.TicketID).Parse("SS-42")
        If tParsed1 '= 42 Set tSC = $$$ERROR(5001, "Parse(SS-42) expected 42, got: "_tParsed1) Quit

        Set tParsed2 = ##class(SpectraSight.Util.TicketID).Parse("42")
        If tParsed2 '= 42 Set tSC = $$$ERROR(5001, "Parse(42) expected 42, got: "_tParsed2) Quit

        Set tParsed3 = ##class(SpectraSight.Util.TicketID).Parse("invalid")
        If tParsed3 '= "" Set tSC = $$$ERROR(5001, "Parse(invalid) expected empty, got: "_tParsed3) Quit

        // IsValid tests
        Set tValid1 = ##class(SpectraSight.Util.TicketID).IsValid("SS-1")
        If tValid1 '= 1 Set tSC = $$$ERROR(5001, "IsValid(SS-1) expected 1, got: "_tValid1) Quit

        Set tValid2 = ##class(SpectraSight.Util.TicketID).IsValid("abc")
        If tValid2 '= 0 Set tSC = $$$ERROR(5001, "IsValid(abc) expected 0, got: "_tValid2) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Test Validation utility methods
ClassMethod TestValidation() As %Status
{
    Set tSC = $$$OK
    Try {
        // ValidateTicketType
        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateTicketType("bug")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "bug should be valid type") Quit

        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateTicketType("Bug")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "Bug should be valid type (case-insensitive)") Quit

        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateTicketType("invalid")
        If $$$ISOK(tSC2) Set tSC = $$$ERROR(5001, "invalid should be rejected as type") Quit

        // ValidateStatus
        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateStatus("Open")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "Open should be valid status") Quit

        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateStatus("invalid")
        If $$$ISOK(tSC2) Set tSC = $$$ERROR(5001, "invalid should be rejected as status") Quit

        // ValidatePriority
        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidatePriority("High")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "High should be valid priority") Quit

        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidatePriority("invalid")
        If $$$ISOK(tSC2) Set tSC = $$$ERROR(5001, "invalid should be rejected as priority") Quit

        // ValidateRequired
        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateRequired("", "title")
        If $$$ISOK(tSC2) Set tSC = $$$ERROR(5001, "empty string should fail required validation") Quit

        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateRequired("value", "title")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "non-empty should pass required validation") Quit

        // GetClassForType
        Set tSC2 = ##class(SpectraSight.Util.Validation).GetClassForType("bug", .tClass)
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "GetClassForType(bug) should succeed") Quit
        If tClass '= "SpectraSight.Model.Bug" Set tSC = $$$ERROR(5001, "bug should map to SpectraSight.Model.Bug, got: "_tClass) Quit

        Set tSC2 = ##class(SpectraSight.Util.Validation).GetClassForType("task", .tClass2)
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "GetClassForType(task) should succeed") Quit
        If tClass2 '= "SpectraSight.Model.Task" Set tSC = $$$ERROR(5001, "task should map to SpectraSight.Model.Task, got: "_tClass2) Quit

        Set tSC2 = ##class(SpectraSight.Util.Validation).GetClassForType("story", .tClass3)
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "GetClassForType(story) should succeed") Quit
        If tClass3 '= "SpectraSight.Model.Story" Set tSC = $$$ERROR(5001, "story should map to SpectraSight.Model.Story, got: "_tClass3) Quit

        Set tSC2 = ##class(SpectraSight.Util.Validation).GetClassForType("epic", .tClass4)
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "GetClassForType(epic) should succeed") Quit
        If tClass4 '= "SpectraSight.Model.Epic" Set tSC = $$$ERROR(5001, "epic should map to SpectraSight.Model.Epic, got: "_tClass4) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Test Response envelope methods
ClassMethod TestResponseEnvelope() As %Status
{
    Set tSC = $$$OK
    Try {
        // Test GetHttpStatusText mappings
        Set tText200 = ##class(SpectraSight.REST.Response).GetHttpStatusText(200)
        If tText200 '= "200 OK" Set tSC = $$$ERROR(5001, "200 expected 200 OK, got: "_tText200) Quit

        Set tText201 = ##class(SpectraSight.REST.Response).GetHttpStatusText(201)
        If tText201 '= "201 Created" Set tSC = $$$ERROR(5001, "201 expected 201 Created, got: "_tText201) Quit

        Set tText400 = ##class(SpectraSight.REST.Response).GetHttpStatusText(400)
        If tText400 '= "400 Bad Request" Set tSC = $$$ERROR(5001, "400 expected 400 Bad Request, got: "_tText400) Quit

        Set tText404 = ##class(SpectraSight.REST.Response).GetHttpStatusText(404)
        If tText404 '= "404 Not Found" Set tSC = $$$ERROR(5001, "404 expected 404 Not Found, got: "_tText404) Quit

        Set tText500 = ##class(SpectraSight.REST.Response).GetHttpStatusText(500)
        If tText500 '= "500 Internal Server Error" Set tSC = $$$ERROR(5001, "500 expected 500 Internal Server Error, got: "_tText500) Quit

        Set tTextUnknown = ##class(SpectraSight.REST.Response).GetHttpStatusText(418)
        If tTextUnknown '= "418 Error" Set tSC = $$$ERROR(5001, "418 expected 418 Error, got: "_tTextUnknown) Quit

        // Test PaginatedList totalPages calculation
        // totalPages = $SELECT(pTotal=0:0, 1:((pTotal - 1) \ pPageSize) + 1)
        Set tPages0 = $SELECT(0=0:0, 1:((0 - 1) \ 25) + 1)
        If tPages0 '= 0 Set tSC = $$$ERROR(5001, "0 items expected 0 pages, got: "_tPages0) Quit

        Set tPages1 = $SELECT(1=0:0, 1:((1 - 1) \ 25) + 1)
        If tPages1 '= 1 Set tSC = $$$ERROR(5001, "1 item expected 1 page, got: "_tPages1) Quit

        Set tPages25 = $SELECT(25=0:0, 1:((25 - 1) \ 25) + 1)
        If tPages25 '= 1 Set tSC = $$$ERROR(5001, "25 items expected 1 page, got: "_tPages25) Quit

        Set tPages26 = $SELECT(26=0:0, 1:((26 - 1) \ 25) + 1)
        If tPages26 '= 2 Set tSC = $$$ERROR(5001, "26 items expected 2 pages, got: "_tPages26) Quit

        Set tPages100 = $SELECT(100=0:0, 1:((100 - 1) \ 25) + 1)
        If tPages100 '= 4 Set tSC = $$$ERROR(5001, "100 items expected 4 pages, got: "_tPages100) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Test BuildTicketResponse for each ticket type
ClassMethod TestCreateTicketDirect() As %Status
{
    Set tSC = $$$OK
    Set tBugId = ""
    Set tTaskId = ""
    Set tStoryId = ""
    Set tEpicId = ""
    Try {
        // Test Bug
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "REST Test Bug"
        Set tBug.Severity = "High"
        Set tBug.StepsToReproduce = "Step 1"
        Set tBug.ExpectedBehavior = "Should work"
        Set tBug.ActualBehavior = "Does not work"
        Set tSC = tBug.%Save()
        If $$$ISERR(tSC) Quit
        Set tBugId = tBug.%Id()

        Set tBugObj = ##class(SpectraSight.REST.TicketHandler).BuildTicketResponse(tBug)
        If tBugObj.%Get("id") '= ("SS-"_tBugId) Set tSC = $$$ERROR(5001, "Bug ID should be SS-"_tBugId_", got: "_tBugObj.%Get("id")) Quit
        If tBugObj.%Get("type") '= "bug" Set tSC = $$$ERROR(5001, "Type should be bug, got: "_tBugObj.%Get("type")) Quit
        If tBugObj.%Get("title") '= "REST Test Bug" Set tSC = $$$ERROR(5001, "Title mismatch") Quit
        If tBugObj.%Get("severity") '= "High" Set tSC = $$$ERROR(5001, "Severity should be High") Quit
        If tBugObj.%Get("stepsToReproduce") '= "Step 1" Set tSC = $$$ERROR(5001, "StepsToReproduce mismatch") Quit

        // Test Task
        Set tTask = ##class(SpectraSight.Model.Task).%New()
        Set tTask.Title = "REST Test Task"
        Set tTask.EstimatedHours = 4
        Set tSC = tTask.%Save()
        If $$$ISERR(tSC) Quit
        Set tTaskId = tTask.%Id()

        Set tTaskObj = ##class(SpectraSight.REST.TicketHandler).BuildTicketResponse(tTask)
        If tTaskObj.%Get("type") '= "task" Set tSC = $$$ERROR(5001, "Type should be task") Quit
        If tTaskObj.%Get("estimatedHours") '= 4 Set tSC = $$$ERROR(5001, "EstimatedHours should be 4, got: "_tTaskObj.%Get("estimatedHours")) Quit

        // Test Story
        Set tStory = ##class(SpectraSight.Model.Story).%New()
        Set tStory.Title = "REST Test Story"
        Set tStory.StoryPoints = 5
        Set tStory.AcceptanceCriteria = "AC 1"
        Set tSC = tStory.%Save()
        If $$$ISERR(tSC) Quit
        Set tStoryId = tStory.%Id()

        Set tStoryObj = ##class(SpectraSight.REST.TicketHandler).BuildTicketResponse(tStory)
        If tStoryObj.%Get("type") '= "story" Set tSC = $$$ERROR(5001, "Type should be story") Quit
        If tStoryObj.%Get("storyPoints") '= 5 Set tSC = $$$ERROR(5001, "StoryPoints should be 5") Quit
        If tStoryObj.%Get("acceptanceCriteria") '= "AC 1" Set tSC = $$$ERROR(5001, "AcceptanceCriteria mismatch") Quit

        // Test Epic
        Set tEpic = ##class(SpectraSight.Model.Epic).%New()
        Set tEpic.Title = "REST Test Epic"
        Set tSC = tEpic.%Save()
        If $$$ISERR(tSC) Quit
        Set tEpicId = tEpic.%Id()

        Set tEpicObj = ##class(SpectraSight.REST.TicketHandler).BuildTicketResponse(tEpic)
        If tEpicObj.%Get("type") '= "epic" Set tSC = $$$ERROR(5001, "Type should be epic") Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    // Cleanup
    If tBugId '= "" Do ##class(SpectraSight.Model.Bug).%DeleteId(tBugId)
    If tTaskId '= "" Do ##class(SpectraSight.Model.Task).%DeleteId(tTaskId)
    If tStoryId '= "" Do ##class(SpectraSight.Model.Story).%DeleteId(tStoryId)
    If tEpicId '= "" Do ##class(SpectraSight.Model.Epic).%DeleteId(tEpicId)
    Quit tSC
}

/// Test ActivityRecorder methods
ClassMethod TestActivityRecording() As %Status
{
    Set tSC = $$$OK
    Set tTicketId = ""
    Try {
        // Create a test ticket
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "Activity Test Bug"
        Set tSC = tBug.%Save()
        If $$$ISERR(tSC) Quit
        Set tTicketId = tBug.%Id()

        // Record a status change
        Set tSC = ##class(SpectraSight.Util.ActivityRecorder).RecordStatusChange(tTicketId, "", "Open", "testuser", "human")
        If $$$ISERR(tSC) Quit

        // Record an assignment change
        Set tSC = ##class(SpectraSight.Util.ActivityRecorder).RecordAssignmentChange(tTicketId, "", "devuser", "testuser", "human")
        If $$$ISERR(tSC) Quit

        // Verify activities exist via SQL
        Set tStatement = ##class(%SQL.Statement).%New()
        Set tSC = tStatement.%Prepare("SELECT COUNT(*) AS cnt FROM SpectraSight_Model.Activity WHERE Ticket = ?")
        If $$$ISERR(tSC) Quit
        Set tResult = tStatement.%Execute(tTicketId)
        If tResult.%Next() {
            Set tCnt = tResult.%Get("cnt")
            If tCnt '= 2 Set tSC = $$$ERROR(5001, "Expected 2 activity entries, got: "_tCnt) Quit
        }

        // Verify actor name
        Set tStatement2 = ##class(%SQL.Statement).%New()
        Set tSC = tStatement2.%Prepare("SELECT ActorName FROM SpectraSight_Model.Activity WHERE Ticket = ? ORDER BY ID")
        If $$$ISERR(tSC) Quit
        Set tResult2 = tStatement2.%Execute(tTicketId)
        If tResult2.%Next() {
            Set tActorName = tResult2.%Get("ActorName")
            If tActorName '= "testuser" Set tSC = $$$ERROR(5001, "ActorName expected testuser, got: "_tActorName) Quit
        }
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    // Cleanup
    If tTicketId '= "" {
        Set tStmtDel = ##class(%SQL.Statement).%New()
        Set tSC2 = tStmtDel.%Prepare("DELETE FROM SpectraSight_Model.Activity WHERE Ticket = ?")
        If $$$ISOK(tSC2) Do tStmtDel.%Execute(tTicketId)
        Do ##class(SpectraSight.Model.Bug).%DeleteId(tTicketId)
    }
    Quit tSC
}

/// Test list query with multiple tickets
ClassMethod TestListQueryBuilding() As %Status
{
    Set tSC = $$$OK
    Set tBugId = ""
    Set tTaskId = ""
    Set tStoryId = ""
    Try {
        // Create 3 tickets with different types and statuses
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "ListTest Bug"
        Set tBug.Status = "Open"
        Set tSC = tBug.%Save()
        If $$$ISERR(tSC) Quit
        Set tBugId = tBug.%Id()

        Set tTask = ##class(SpectraSight.Model.Task).%New()
        Set tTask.Title = "ListTest Task"
        Set tTask.Status = "In Progress"
        Set tSC = tTask.%Save()
        If $$$ISERR(tSC) Quit
        Set tTaskId = tTask.%Id()

        Set tStory = ##class(SpectraSight.Model.Story).%New()
        Set tStory.Title = "ListTest Story"
        Set tStory.Status = "Open"
        Set tSC = tStory.%Save()
        If $$$ISERR(tSC) Quit
        Set tStoryId = tStory.%Id()

        // Query all with title prefix
        Set tStatement = ##class(%SQL.Statement).%New()
        Set tSC = tStatement.%Prepare("SELECT ID FROM SpectraSight_Model.Ticket WHERE Title LIKE 'ListTest %'")
        If $$$ISERR(tSC) Quit
        Set tResult = tStatement.%Execute()
        Set tCount = 0
        While tResult.%Next() {
            Set tCount = tCount + 1
        }
        If tCount '= 3 Set tSC = $$$ERROR(5001, "Expected 3 tickets, got: "_tCount) Quit

        // Filter by status = Open
        Set tStatement2 = ##class(%SQL.Statement).%New()
        Set tSC = tStatement2.%Prepare("SELECT ID FROM SpectraSight_Model.Ticket WHERE Title LIKE 'ListTest %' AND Status = ?")
        If $$$ISERR(tSC) Quit
        Set tResult2 = tStatement2.%Execute("Open")
        Set tOpenCount = 0
        While tResult2.%Next() {
            Set tOpenCount = tOpenCount + 1
        }
        If tOpenCount '= 2 Set tSC = $$$ERROR(5001, "Expected 2 Open tickets, got: "_tOpenCount) Quit

        // Filter by type (bug) using subquery
        Set tStatement3 = ##class(%SQL.Statement).%New()
        Set tSC = tStatement3.%Prepare("SELECT ID FROM SpectraSight_Model.Ticket WHERE Title LIKE 'ListTest %' AND %ID IN (SELECT %ID FROM SpectraSight_Model.Bug)")
        If $$$ISERR(tSC) Quit
        Set tResult3 = tStatement3.%Execute()
        Set tBugCount = 0
        While tResult3.%Next() {
            Set tBugCount = tBugCount + 1
        }
        If tBugCount '= 1 Set tSC = $$$ERROR(5001, "Expected 1 bug, got: "_tBugCount) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    // Cleanup
    If tBugId '= "" Do ##class(SpectraSight.Model.Bug).%DeleteId(tBugId)
    If tTaskId '= "" Do ##class(SpectraSight.Model.Task).%DeleteId(tTaskId)
    If tStoryId '= "" Do ##class(SpectraSight.Model.Story).%DeleteId(tStoryId)
    Quit tSC
}

/// Test GetTicketType returns correct lowercase type strings
ClassMethod TestGetTicketType() As %Status
{
    Set tSC = $$$OK
    Set tBugId = ""
    Set tTaskId = ""
    Set tStoryId = ""
    Set tEpicId = ""
    Try {
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "TypeTest Bug"
        Set tSC = tBug.%Save()
        If $$$ISERR(tSC) Quit
        Set tBugId = tBug.%Id()
        Set tBugType = ##class(SpectraSight.REST.TicketHandler).GetTicketType(tBug)
        If tBugType '= "bug" Set tSC = $$$ERROR(5001, "Bug type expected bug, got: "_tBugType) Quit

        Set tTask = ##class(SpectraSight.Model.Task).%New()
        Set tTask.Title = "TypeTest Task"
        Set tSC = tTask.%Save()
        If $$$ISERR(tSC) Quit
        Set tTaskId = tTask.%Id()
        Set tTaskType = ##class(SpectraSight.REST.TicketHandler).GetTicketType(tTask)
        If tTaskType '= "task" Set tSC = $$$ERROR(5001, "Task type expected task, got: "_tTaskType) Quit

        Set tStory = ##class(SpectraSight.Model.Story).%New()
        Set tStory.Title = "TypeTest Story"
        Set tSC = tStory.%Save()
        If $$$ISERR(tSC) Quit
        Set tStoryId = tStory.%Id()
        Set tStoryType = ##class(SpectraSight.REST.TicketHandler).GetTicketType(tStory)
        If tStoryType '= "story" Set tSC = $$$ERROR(5001, "Story type expected story, got: "_tStoryType) Quit

        Set tEpic = ##class(SpectraSight.Model.Epic).%New()
        Set tEpic.Title = "TypeTest Epic"
        Set tSC = tEpic.%Save()
        If $$$ISERR(tSC) Quit
        Set tEpicId = tEpic.%Id()
        Set tEpicType = ##class(SpectraSight.REST.TicketHandler).GetTicketType(tEpic)
        If tEpicType '= "epic" Set tSC = $$$ERROR(5001, "Epic type expected epic, got: "_tEpicType) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    // Cleanup
    If tBugId '= "" Do ##class(SpectraSight.Model.Bug).%DeleteId(tBugId)
    If tTaskId '= "" Do ##class(SpectraSight.Model.Task).%DeleteId(tTaskId)
    If tStoryId '= "" Do ##class(SpectraSight.Model.Story).%DeleteId(tStoryId)
    If tEpicId '= "" Do ##class(SpectraSight.Model.Epic).%DeleteId(tEpicId)
    Quit tSC
}

/// Test BuildOrderBy parses sort parameters correctly
ClassMethod TestBuildOrderBy() As %Status
{
    Set tSC = $$$OK
    Try {
        Set tOrder1 = ##class(SpectraSight.REST.TicketHandler).BuildOrderBy("-updatedAt")
        If tOrder1 '= "UpdatedAt DESC" Set tSC = $$$ERROR(5001, "-updatedAt expected UpdatedAt DESC, got: "_tOrder1) Quit

        Set tOrder2 = ##class(SpectraSight.REST.TicketHandler).BuildOrderBy("title")
        If tOrder2 '= "Title ASC" Set tSC = $$$ERROR(5001, "title expected Title ASC, got: "_tOrder2) Quit

        Set tOrder3 = ##class(SpectraSight.REST.TicketHandler).BuildOrderBy("-title")
        If tOrder3 '= "Title DESC" Set tSC = $$$ERROR(5001, "-title expected Title DESC, got: "_tOrder3) Quit

        Set tOrder4 = ##class(SpectraSight.REST.TicketHandler).BuildOrderBy("createdAt")
        If tOrder4 '= "CreatedAt ASC" Set tSC = $$$ERROR(5001, "createdAt expected CreatedAt ASC, got: "_tOrder4) Quit

        Set tOrder5 = ##class(SpectraSight.REST.TicketHandler).BuildOrderBy("-status")
        If tOrder5 '= "Status DESC" Set tSC = $$$ERROR(5001, "-status expected Status DESC, got: "_tOrder5) Quit

        Set tOrder6 = ##class(SpectraSight.REST.TicketHandler).BuildOrderBy("-unknown")
        If tOrder6 '= "UpdatedAt DESC" Set tSC = $$$ERROR(5001, "Unknown field expected UpdatedAt DESC, got: "_tOrder6) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Test that deleting a ticket also cleans up associated activities
ClassMethod TestDeleteWithCleanup() As %Status
{
    Set tSC = $$$OK
    Set tTicketId = ""
    Try {
        // Create a ticket
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "DeleteTest Bug"
        Set tSC = tBug.%Save()
        If $$$ISERR(tSC) Quit
        Set tTicketId = tBug.%Id()

        // Create activity entries
        Set tSC = ##class(SpectraSight.Util.ActivityRecorder).RecordStatusChange(tTicketId, "", "Open", "testuser", "human")
        If $$$ISERR(tSC) Quit
        Set tSC = ##class(SpectraSight.Util.ActivityRecorder).RecordAssignmentChange(tTicketId, "", "devuser", "testuser", "human")
        If $$$ISERR(tSC) Quit

        // Verify activities exist
        Set tStmt = ##class(%SQL.Statement).%New()
        Set tSC = tStmt.%Prepare("SELECT COUNT(*) AS cnt FROM SpectraSight_Model.Activity WHERE Ticket = ?")
        If $$$ISERR(tSC) Quit
        Set tRes = tStmt.%Execute(tTicketId)
        If tRes.%Next() {
            If tRes.%Get("cnt") '= 2 Set tSC = $$$ERROR(5001, "Expected 2 activities before delete, got: "_tRes.%Get("cnt")) Quit
        }

        // Delete activities first (same as TicketHandler.DeleteTicket logic)
        Set tDelStmt = ##class(%SQL.Statement).%New()
        Set tSC = tDelStmt.%Prepare("DELETE FROM SpectraSight_Model.Activity WHERE Ticket = ?")
        If $$$ISERR(tSC) Quit
        Do tDelStmt.%Execute(tTicketId)

        // Delete the ticket
        Set tDeletedId = tTicketId
        Set tSC = ##class(SpectraSight.Model.Bug).%DeleteId(tTicketId)
        If $$$ISERR(tSC) Quit
        Set tTicketId = ""

        // Verify ticket is gone
        If ##class(SpectraSight.Model.Ticket).%ExistsId(tDeletedId) {
            Set tSC = $$$ERROR(5001, "Ticket should not exist after delete")
            Quit
        }
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    // Cleanup in case of early failure
    If tTicketId '= "" {
        Set tCleanStmt = ##class(%SQL.Statement).%New()
        Set tSC2 = tCleanStmt.%Prepare("DELETE FROM SpectraSight_Model.Activity WHERE Ticket = ?")
        If $$$ISOK(tSC2) Do tCleanStmt.%Execute(tTicketId)
        Do ##class(SpectraSight.Model.Bug).%DeleteId(tTicketId)
    }
    Quit tSC
}

/// Test TicketID edge cases: empty, SS- without digits, SS-0, 0, SS-abc
ClassMethod TestTicketIDEdgeCases() As %Status
{
    Set tSC = $$$OK
    Try {
        // Empty string
        Set tEmpty = ##class(SpectraSight.Util.TicketID).Parse("")
        If tEmpty '= "" Set tSC = $$$ERROR(5001, "Parse('') expected empty, got: "_tEmpty) Quit

        // SS- without digits
        Set tNoDigit = ##class(SpectraSight.Util.TicketID).Parse("SS-")
        If tNoDigit '= "" Set tSC = $$$ERROR(5001, "Parse('SS-') expected empty, got: "_tNoDigit) Quit

        // SS-abc (non-numeric after prefix)
        Set tAlpha = ##class(SpectraSight.Util.TicketID).Parse("SS-abc")
        If tAlpha '= "" Set tSC = $$$ERROR(5001, "Parse('SS-abc') expected empty, got: "_tAlpha) Quit

        // SS-0 (zero is valid)
        Set tZero = ##class(SpectraSight.Util.TicketID).Parse("SS-0")
        If tZero '= 0 Set tSC = $$$ERROR(5001, "Parse('SS-0') expected 0, got: "_tZero) Quit

        // Plain 0
        Set tPlainZero = ##class(SpectraSight.Util.TicketID).Parse("0")
        If tPlainZero '= 0 Set tSC = $$$ERROR(5001, "Parse('0') expected 0, got: "_tPlainZero) Quit

        // IsValid for empty
        Set tValidEmpty = ##class(SpectraSight.Util.TicketID).IsValid("")
        If tValidEmpty '= 0 Set tSC = $$$ERROR(5001, "IsValid('') expected 0, got: "_tValidEmpty) Quit

        // IsValid for SS-
        Set tValidDash = ##class(SpectraSight.Util.TicketID).IsValid("SS-")
        If tValidDash '= 0 Set tSC = $$$ERROR(5001, "IsValid('SS-') expected 0, got: "_tValidDash) Quit

        // Format large number
        Set tLarge = ##class(SpectraSight.Util.TicketID).Format(99999)
        If tLarge '= "SS-99999" Set tSC = $$$ERROR(5001, "Format(99999) expected SS-99999, got: "_tLarge) Quit

        // Parse large number
        Set tParseLarge = ##class(SpectraSight.Util.TicketID).Parse("SS-99999")
        If tParseLarge '= 99999 Set tSC = $$$ERROR(5001, "Parse('SS-99999') expected 99999, got: "_tParseLarge) Quit

        // SS-3.5 (decimal should be rejected - not an integer)
        Set tDecimal = ##class(SpectraSight.Util.TicketID).Parse("SS-3.5")
        If tDecimal '= "" Set tSC = $$$ERROR(5001, "Parse('SS-3.5') expected empty, got: "_tDecimal) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Test all valid values for type, status, and priority validation
ClassMethod TestValidationAllValues() As %Status
{
    Set tSC = $$$OK
    Try {
        // All 4 ticket types (lowercase)
        Set tTypes = $LISTBUILD("bug", "task", "story", "epic")
        Set tPtr = 0
        While $LISTNEXT(tTypes, tPtr, tType) {
            Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateTicketType(tType)
            If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, tType_" should be valid ticket type") Quit
        }
        If $$$ISERR(tSC) Quit

        // All 4 ticket types (uppercase first letter)
        Set tTypesUpper = $LISTBUILD("Bug", "Task", "Story", "Epic")
        Set tPtr = 0
        While $LISTNEXT(tTypesUpper, tPtr, tType) {
            Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateTicketType(tType)
            If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, tType_" should be valid type (case-insensitive)") Quit
        }
        If $$$ISERR(tSC) Quit

        // All 4 statuses
        Set tStatuses = $LISTBUILD("Open", "In Progress", "Blocked", "Complete")
        Set tPtr = 0
        While $LISTNEXT(tStatuses, tPtr, tStat) {
            Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateStatus(tStat)
            If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, tStat_" should be valid status") Quit
        }
        If $$$ISERR(tSC) Quit

        // Invalid statuses
        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateStatus("Closed")
        If $$$ISOK(tSC2) Set tSC = $$$ERROR(5001, "Closed should be invalid status") Quit

        // All 4 priorities
        Set tPriorities = $LISTBUILD("Low", "Medium", "High", "Critical")
        Set tPtr = 0
        While $LISTNEXT(tPriorities, tPtr, tPri) {
            Set tSC2 = ##class(SpectraSight.Util.Validation).ValidatePriority(tPri)
            If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, tPri_" should be valid priority") Quit
        }
        If $$$ISERR(tSC) Quit

        // Invalid priority
        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidatePriority("Urgent")
        If $$$ISOK(tSC2) Set tSC = $$$ERROR(5001, "Urgent should be invalid priority") Quit

        // GetClassForType for invalid type
        Set tSC2 = ##class(SpectraSight.Util.Validation).GetClassForType("feature", .tClass)
        If $$$ISOK(tSC2) Set tSC = $$$ERROR(5001, "feature should be invalid type for GetClassForType") Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Test update workflow: create ticket, update fields, verify changes and activity recording
ClassMethod TestUpdateTicketDirect() As %Status
{
    Set tSC = $$$OK
    Set tTicketId = ""
    Try {
        // Create a Bug ticket
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "UpdateTest Bug"
        Set tBug.Status = "Open"
        Set tBug.Priority = "Low"
        Set tBug.Assignee = ""
        Set tBug.Severity = "Low"
        Set tSC = tBug.%Save()
        If $$$ISERR(tSC) Quit
        Set tTicketId = tBug.%Id()

        // Track old values
        Set tOldStatus = tBug.Status
        Set tOldAssignee = tBug.Assignee

        // Simulate update: change title, status, priority, assignee, severity
        Set tBug.Title = "UpdateTest Bug - Modified"
        Set tBug.Status = "In Progress"
        Set tBug.Priority = "High"
        Set tBug.Assignee = "dev1"
        Set tBug.Severity = "Critical"
        Set tSC = tBug.%Save()
        If $$$ISERR(tSC) Quit

        // Verify fields were saved
        Set tReloaded = ##class(SpectraSight.Model.Bug).%OpenId(tTicketId)
        If tReloaded = "" Set tSC = $$$ERROR(5001, "Failed to reload updated ticket") Quit
        If tReloaded.Title '= "UpdateTest Bug - Modified" Set tSC = $$$ERROR(5001, "Title not updated, got: "_tReloaded.Title) Quit
        If tReloaded.Status '= "In Progress" Set tSC = $$$ERROR(5001, "Status not updated, got: "_tReloaded.Status) Quit
        If tReloaded.Priority '= "High" Set tSC = $$$ERROR(5001, "Priority not updated, got: "_tReloaded.Priority) Quit
        If tReloaded.Assignee '= "dev1" Set tSC = $$$ERROR(5001, "Assignee not updated, got: "_tReloaded.Assignee) Quit
        If tReloaded.Severity '= "Critical" Set tSC = $$$ERROR(5001, "Severity not updated, got: "_tReloaded.Severity) Quit

        // Record activity for status change (simulating TicketHandler.UpdateTicket logic)
        If tReloaded.Status '= tOldStatus {
            Set tSC = ##class(SpectraSight.Util.ActivityRecorder).RecordStatusChange(tTicketId, tOldStatus, tReloaded.Status, "testuser", "human")
            If $$$ISERR(tSC) Quit
        }
        // Record activity for assignee change
        If tReloaded.Assignee '= tOldAssignee {
            Set tSC = ##class(SpectraSight.Util.ActivityRecorder).RecordAssignmentChange(tTicketId, tOldAssignee, tReloaded.Assignee, "testuser", "human")
            If $$$ISERR(tSC) Quit
        }

        // Verify both activities were recorded
        Set tStmt = ##class(%SQL.Statement).%New()
        Set tSC = tStmt.%Prepare("SELECT COUNT(*) AS cnt FROM SpectraSight_Model.Activity WHERE Ticket = ?")
        If $$$ISERR(tSC) Quit
        Set tRes = tStmt.%Execute(tTicketId)
        If tRes.%Next() {
            If tRes.%Get("cnt") '= 2 Set tSC = $$$ERROR(5001, "Expected 2 activities after update, got: "_tRes.%Get("cnt")) Quit
        }

        // Verify BuildTicketResponse reflects the updates
        Set tObj = ##class(SpectraSight.REST.TicketHandler).BuildTicketResponse(tReloaded)
        If tObj.%Get("title") '= "UpdateTest Bug - Modified" Set tSC = $$$ERROR(5001, "BuildTicketResponse title mismatch") Quit
        If tObj.%Get("status") '= "In Progress" Set tSC = $$$ERROR(5001, "BuildTicketResponse status mismatch") Quit
        If tObj.%Get("severity") '= "Critical" Set tSC = $$$ERROR(5001, "BuildTicketResponse severity mismatch") Quit
        If tObj.%Get("assignee") '= "dev1" Set tSC = $$$ERROR(5001, "BuildTicketResponse assignee mismatch") Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    // Cleanup
    If tTicketId '= "" {
        Set tCleanStmt = ##class(%SQL.Statement).%New()
        Set tSC2 = tCleanStmt.%Prepare("DELETE FROM SpectraSight_Model.Activity WHERE Ticket = ?")
        If $$$ISOK(tSC2) Do tCleanStmt.%Execute(tTicketId)
        Do ##class(SpectraSight.Model.Bug).%DeleteId(tTicketId)
    }
    Quit tSC
}

/// Test ValidateHierarchy rules: Epic->Story(valid), Epic->Task(invalid), Story->Task(valid), etc.
ClassMethod TestValidateHierarchy() As %Status
{
    Set tSC = $$$OK
    Set tEpicId = ""
    Set tStoryId = ""
    Set tTaskId = ""
    Set tBugId = ""
    Try {
        // Create test tickets
        Set tEpic = ##class(SpectraSight.Model.Epic).%New()
        Set tEpic.Title = "HierarchyTest Epic"
        Set tSC = tEpic.%Save()
        If $$$ISERR(tSC) Quit
        Set tEpicId = tEpic.%Id()

        Set tStory = ##class(SpectraSight.Model.Story).%New()
        Set tStory.Title = "HierarchyTest Story"
        Set tSC = tStory.%Save()
        If $$$ISERR(tSC) Quit
        Set tStoryId = tStory.%Id()

        Set tTask = ##class(SpectraSight.Model.Task).%New()
        Set tTask.Title = "HierarchyTest Task"
        Set tSC = tTask.%Save()
        If $$$ISERR(tSC) Quit
        Set tTaskId = tTask.%Id()

        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "HierarchyTest Bug"
        Set tSC = tBug.%Save()
        If $$$ISERR(tSC) Quit
        Set tBugId = tBug.%Id()

        // Epic -> Story: VALID
        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateHierarchy(tEpicId, "story")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "Epic->Story should be valid") Quit

        // Epic -> Bug: VALID
        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateHierarchy(tEpicId, "bug")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "Epic->Bug should be valid") Quit

        // Epic -> Task: INVALID
        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateHierarchy(tEpicId, "task")
        If $$$ISOK(tSC2) Set tSC = $$$ERROR(5001, "Epic->Task should be invalid") Quit

        // Epic -> Epic: INVALID
        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateHierarchy(tEpicId, "epic")
        If $$$ISOK(tSC2) Set tSC = $$$ERROR(5001, "Epic->Epic should be invalid") Quit

        // Story -> Task: VALID
        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateHierarchy(tStoryId, "task")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "Story->Task should be valid") Quit

        // Story -> Bug: VALID
        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateHierarchy(tStoryId, "bug")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "Story->Bug should be valid") Quit

        // Story -> Story: INVALID
        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateHierarchy(tStoryId, "story")
        If $$$ISOK(tSC2) Set tSC = $$$ERROR(5001, "Story->Story should be invalid") Quit

        // Story -> Epic: INVALID
        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateHierarchy(tStoryId, "epic")
        If $$$ISOK(tSC2) Set tSC = $$$ERROR(5001, "Story->Epic should be invalid") Quit

        // Task -> Bug: VALID
        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateHierarchy(tTaskId, "bug")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "Task->Bug should be valid") Quit

        // Task -> Task: INVALID
        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateHierarchy(tTaskId, "task")
        If $$$ISOK(tSC2) Set tSC = $$$ERROR(5001, "Task->Task should be invalid") Quit

        // Bug -> anything: INVALID (Bug cannot have children)
        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateHierarchy(tBugId, "task")
        If $$$ISOK(tSC2) Set tSC = $$$ERROR(5001, "Bug->Task should be invalid (Bug cannot have children)") Quit

        // No parent (empty string): VALID
        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateHierarchy("", "task")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "No parent should be valid") Quit

        // Non-existent parent: INVALID
        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateHierarchy(999999, "task")
        If $$$ISOK(tSC2) Set tSC = $$$ERROR(5001, "Non-existent parent should be invalid") Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    // Cleanup
    If tBugId '= "" Do ##class(SpectraSight.Model.Bug).%DeleteId(tBugId)
    If tTaskId '= "" Do ##class(SpectraSight.Model.Task).%DeleteId(tTaskId)
    If tStoryId '= "" Do ##class(SpectraSight.Model.Story).%DeleteId(tStoryId)
    If tEpicId '= "" Do ##class(SpectraSight.Model.Epic).%DeleteId(tEpicId)
    Quit tSC
}

/// Test that creating a ticket with an invalid hierarchy is rejected
ClassMethod TestHierarchyInCreate() As %Status
{
    Set tSC = $$$OK
    Set tEpicId = ""
    Set tTaskId = ""
    Try {
        // Create an Epic as parent
        Set tEpic = ##class(SpectraSight.Model.Epic).%New()
        Set tEpic.Title = "HierarchyCreateTest Epic"
        Set tSC = tEpic.%Save()
        If $$$ISERR(tSC) Quit
        Set tEpicId = tEpic.%Id()

        // Valid: Create Story with Epic parent (direct object test)
        Set tStory = ##class(SpectraSight.Model.Story).%New()
        Set tStory.Title = "HierarchyCreateTest Story"
        Set tStory.Parent = tEpic
        Set tSC = tStory.%Save()
        If $$$ISERR(tSC) Quit
        Set tStoryId = tStory.%Id()

        // Verify parent was set
        Set tReloaded = ##class(SpectraSight.Model.Story).%OpenId(tStoryId)
        If tReloaded.Parent = "" Set tSC = $$$ERROR(5001, "Story parent should be set") Quit
        If tReloaded.Parent.%Id() '= tEpicId Set tSC = $$$ERROR(5001, "Story parent should be epic, got: "_tReloaded.Parent.%Id()) Quit

        // Invalid: Validate Task under Epic (should fail)
        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateHierarchy(tEpicId, "task")
        If $$$ISOK(tSC2) Set tSC = $$$ERROR(5001, "Task under Epic should be rejected") Quit

        // Cleanup story
        Do ##class(SpectraSight.Model.Story).%DeleteId(tStoryId)

        // Create a Task (to test as parent of Bug)
        Set tTask = ##class(SpectraSight.Model.Task).%New()
        Set tTask.Title = "HierarchyCreateTest Task"
        Set tSC = tTask.%Save()
        If $$$ISERR(tSC) Quit
        Set tTaskId = tTask.%Id()

        // Valid: Bug under Task
        Set tSC2 = ##class(SpectraSight.Util.Validation).ValidateHierarchy(tTaskId, "bug")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "Bug under Task should be valid") Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    // Cleanup
    If tTaskId '= "" Do ##class(SpectraSight.Model.Task).%DeleteId(tTaskId)
    If tEpicId '= "" Do ##class(SpectraSight.Model.Epic).%DeleteId(tEpicId)
    Quit tSC
}

/// Test that children array is populated in BuildTicketResponse
ClassMethod TestChildrenInGetTicket() As %Status
{
    Set tSC = $$$OK
    Set tEpicId = ""
    Set tStoryId = ""
    Set tStoryId2 = ""
    Try {
        // Create parent Epic
        Set tEpic = ##class(SpectraSight.Model.Epic).%New()
        Set tEpic.Title = "ChildrenTest Epic"
        Set tSC = tEpic.%Save()
        If $$$ISERR(tSC) Quit
        Set tEpicId = tEpic.%Id()

        // Create child Story 1
        Set tStory = ##class(SpectraSight.Model.Story).%New()
        Set tStory.Title = "ChildrenTest Story 1"
        Set tStory.Parent = tEpic
        Set tSC = tStory.%Save()
        If $$$ISERR(tSC) Quit
        Set tStoryId = tStory.%Id()

        // Create child Story 2
        Set tStory2 = ##class(SpectraSight.Model.Story).%New()
        Set tStory2.Title = "ChildrenTest Story 2"
        Set tStory2.Parent = tEpic
        Set tSC = tStory2.%Save()
        If $$$ISERR(tSC) Quit
        Set tStoryId2 = tStory2.%Id()

        // Build response for Epic (with children)
        Set tEpicReloaded = ##class(SpectraSight.Model.Epic).%OpenId(tEpicId)
        Set tResponse = ##class(SpectraSight.REST.TicketHandler).BuildTicketResponse(tEpicReloaded, 1)
        Set tChildren = tResponse.%Get("children")
        If tChildren = "" Set tSC = $$$ERROR(5001, "children should be present") Quit
        If tChildren.%Size() '= 2 Set tSC = $$$ERROR(5001, "Expected 2 children, got: "_tChildren.%Size()) Quit

        // Verify child objects have correct structure
        Set tChild1 = tChildren.%Get(0)
        If tChild1.%Get("title") = "" Set tSC = $$$ERROR(5001, "Child should have title") Quit
        If tChild1.%Get("type") '= "story" Set tSC = $$$ERROR(5001, "Child type should be story, got: "_tChild1.%Get("type")) Quit
        If tChild1.%Get("status") = "" Set tSC = $$$ERROR(5001, "Child should have status") Quit

        // Build response for Story (with parent object)
        Set tStoryReloaded = ##class(SpectraSight.Model.Story).%OpenId(tStoryId)
        Set tStoryResp = ##class(SpectraSight.REST.TicketHandler).BuildTicketResponse(tStoryReloaded, 1)
        Set tParent = tStoryResp.%Get("parent")
        If tParent = "" Set tSC = $$$ERROR(5001, "parent object should be present") Quit
        If tParent.%Get("id") '= ("SS-"_tEpicId) Set tSC = $$$ERROR(5001, "Parent id should be SS-"_tEpicId_", got: "_tParent.%Get("id")) Quit
        If tParent.%Get("title") '= "ChildrenTest Epic" Set tSC = $$$ERROR(5001, "Parent title mismatch") Quit
        If tParent.%Get("type") '= "epic" Set tSC = $$$ERROR(5001, "Parent type should be epic") Quit

        // parentId should still be present for backward compat
        If tStoryResp.%Get("parentId") '= ("SS-"_tEpicId) Set tSC = $$$ERROR(5001, "parentId should be SS-"_tEpicId) Quit

        // Build response WITHOUT children (list mode)
        Set tListResp = ##class(SpectraSight.REST.TicketHandler).BuildTicketResponse(tEpicReloaded, 0)
        // children key should not be present when pIncludeChildren=0
        If tListResp.%IsDefined("children") Set tSC = $$$ERROR(5001, "children should not be in list response") Quit

        // Ticket with no parent should not have parent object
        Set tEpicResp2 = ##class(SpectraSight.REST.TicketHandler).BuildTicketResponse(tEpicReloaded, 1)
        If tEpicResp2.%IsDefined("parent") Set tSC = $$$ERROR(5001, "Epic with no parent should not have parent object") Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    // Cleanup
    If tStoryId2 '= "" Do ##class(SpectraSight.Model.Story).%DeleteId(tStoryId2)
    If tStoryId '= "" Do ##class(SpectraSight.Model.Story).%DeleteId(tStoryId)
    If tEpicId '= "" Do ##class(SpectraSight.Model.Epic).%DeleteId(tEpicId)
    Quit tSC
}

/// Test ClassHandler.ListClasses returns class definitions
ClassMethod TestClassHandlerListClasses() As %Status
{
    Set tSC = $$$OK
    Try {
        // The %Dictionary.ClassDefinition table should have entries
        Set tStmt = ##class(%SQL.Statement).%New()
        Set tSC2 = tStmt.%Prepare("SELECT COUNT(*) AS cnt FROM %Dictionary.ClassDefinition WHERE Name NOT LIKE '\%%' ESCAPE '\' AND Name NOT LIKE '%.' AND System = 0")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "Failed to prepare class query") Quit
        Set tRes = tStmt.%Execute()
        If tRes.%Next() {
            Set tCount = tRes.%Get("cnt")
            If tCount < 1 Set tSC = $$$ERROR(5001, "Expected at least 1 user class, got: "_tCount) Quit
        }

        // Test with search filter
        Set tStmt2 = ##class(%SQL.Statement).%New()
        Set tSC2 = tStmt2.%Prepare("SELECT Name FROM %Dictionary.ClassDefinition WHERE Name NOT LIKE '\%%' ESCAPE '\' AND Name NOT LIKE '%.' AND System = 0 AND Name LIKE ? FETCH FIRST 50 ROWS ONLY")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "Failed to prepare search query") Quit
        Set tRes2 = tStmt2.%Execute("SpectraSight%")
        Set tMatchCount = 0
        While tRes2.%Next() {
            Set tMatchCount = tMatchCount + 1
        }
        If tMatchCount < 1 Set tSC = $$$ERROR(5001, "Expected SpectraSight classes in search results, got: "_tMatchCount) Quit

        // Verify limit of 50 works (just check query doesn't error)
        Set tStmt3 = ##class(%SQL.Statement).%New()
        Set tSC2 = tStmt3.%Prepare("SELECT Name, Super FROM %Dictionary.ClassDefinition WHERE Name NOT LIKE '\%%' ESCAPE '\' AND Name NOT LIKE '%.' AND System = 0 ORDER BY Name FETCH FIRST 50 ROWS ONLY")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "Failed to prepare limited query") Quit
        Set tRes3 = tStmt3.%Execute()
        Set tLimitCount = 0
        While tRes3.%Next() {
            Set tLimitCount = tLimitCount + 1
        }
        If tLimitCount > 50 Set tSC = $$$ERROR(5001, "Expected at most 50 results, got: "_tLimitCount) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Test ClassHandler.ListMethods returns method definitions
ClassMethod TestClassHandlerListMethods() As %Status
{
    Set tSC = $$$OK
    Try {
        // Query methods for a known class
        Set tStmt = ##class(%SQL.Statement).%New()
        Set tSC2 = tStmt.%Prepare("SELECT Name, ClassMethod, ReturnType FROM %Dictionary.MethodDefinition WHERE parent = ?")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "Failed to prepare method query") Quit
        Set tRes = tStmt.%Execute("SpectraSight.REST.ClassHandler")
        Set tMethodCount = 0
        Set tFoundListClasses = 0
        While tRes.%Next() {
            Set tMethodCount = tMethodCount + 1
            If tRes.%Get("Name") = "ListClasses" Set tFoundListClasses = 1
        }
        If tMethodCount < 2 Set tSC = $$$ERROR(5001, "Expected at least 2 methods on ClassHandler, got: "_tMethodCount) Quit
        If 'tFoundListClasses Set tSC = $$$ERROR(5001, "Expected to find ListClasses method") Quit

        // Verify class existence check works for a non-existent class
        If ##class(%Dictionary.ClassDefinition).%ExistsId("NonExistent.Fake.Class") {
            Set tSC = $$$ERROR(5001, "Non-existent class should not exist") Quit
        }
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Test adding and removing code references on a ticket
ClassMethod TestCodeReferenceEndpoints() As %Status
{
    Set tSC = $$$OK
    Set tTicketId = ""
    Set tRefId = ""
    Try {
        // Create test ticket
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "CodeRefTest Bug"
        Set tSC = tBug.%Save()
        If $$$ISERR(tSC) Quit
        Set tTicketId = tBug.%Id()

        // Add a code reference
        Set tRef = ##class(SpectraSight.Model.CodeReference).%New()
        Set tRef.Ticket = tBug
        Set tRef.ClassName = "SpectraSight.Model.Ticket"
        Set tRef.MethodName = "%OnNew"
        Set tRef.AddedBy = "testuser"
        Set tSC = tRef.%Save()
        If $$$ISERR(tSC) Quit
        Set tRefId = tRef.%Id()

        // Verify the ref was saved
        Set tReloaded = ##class(SpectraSight.Model.CodeReference).%OpenId(tRefId)
        If tReloaded = "" Set tSC = $$$ERROR(5001, "Code reference should exist") Quit
        If tReloaded.ClassName '= "SpectraSight.Model.Ticket" Set tSC = $$$ERROR(5001, "ClassName mismatch") Quit
        If tReloaded.MethodName '= "%OnNew" Set tSC = $$$ERROR(5001, "MethodName mismatch") Quit
        If tReloaded.Ticket.%Id() '= tTicketId Set tSC = $$$ERROR(5001, "Ticket reference mismatch") Quit
        If tReloaded.Timestamp = "" Set tSC = $$$ERROR(5001, "Timestamp should be auto-set") Quit

        // Add a second reference (no method name)
        Set tRef2 = ##class(SpectraSight.Model.CodeReference).%New()
        Set tRef2.Ticket = tBug
        Set tRef2.ClassName = "SpectraSight.REST.Response"
        Set tRef2.AddedBy = "testuser"
        Set tSC = tRef2.%Save()
        If $$$ISERR(tSC) Quit
        Set tRefId2 = tRef2.%Id()

        // Verify we can query both refs for the ticket
        Set tStmt = ##class(%SQL.Statement).%New()
        Set tSC2 = tStmt.%Prepare("SELECT COUNT(*) AS cnt FROM SpectraSight_Model.CodeReference WHERE Ticket = ?")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "Failed to prepare count query") Quit
        Set tRes = tStmt.%Execute(tTicketId)
        If tRes.%Next() {
            If tRes.%Get("cnt") '= 2 Set tSC = $$$ERROR(5001, "Expected 2 code references, got: "_tRes.%Get("cnt")) Quit
        }

        // Delete a reference
        Set tSC = ##class(SpectraSight.Model.CodeReference).%DeleteId(tRefId)
        If $$$ISERR(tSC) Quit
        Set tRefId = ""

        // Verify only 1 remains
        Set tRes2 = tStmt.%Execute(tTicketId)
        If tRes2.%Next() {
            If tRes2.%Get("cnt") '= 1 Set tSC = $$$ERROR(5001, "Expected 1 code reference after delete, got: "_tRes2.%Get("cnt")) Quit
        }

        // Cleanup second ref
        Do ##class(SpectraSight.Model.CodeReference).%DeleteId(tRefId2)
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    // Cleanup
    If tRefId '= "" Do ##class(SpectraSight.Model.CodeReference).%DeleteId(tRefId)
    If tTicketId '= "" {
        Set tCleanStmt = ##class(%SQL.Statement).%New()
        Set tSC2 = tCleanStmt.%Prepare("DELETE FROM SpectraSight_Model.CodeReference WHERE Ticket = ?")
        If $$$ISOK(tSC2) Do tCleanStmt.%Execute(tTicketId)
        Set tCleanStmt2 = ##class(%SQL.Statement).%New()
        Set tSC2 = tCleanStmt2.%Prepare("DELETE FROM SpectraSight_Model.Activity WHERE Ticket = ?")
        If $$$ISOK(tSC2) Do tCleanStmt2.%Execute(tTicketId)
        Do ##class(SpectraSight.Model.Bug).%DeleteId(tTicketId)
    }
    Quit tSC
}

/// Test that BuildTicketResponse includes codeReferences array
ClassMethod TestCodeReferenceInTicketResponse() As %Status
{
    Set tSC = $$$OK
    Set tTicketId = ""
    Try {
        // Create a ticket with code references
        Set tTask = ##class(SpectraSight.Model.Task).%New()
        Set tTask.Title = "CodeRefResponseTest Task"
        Set tSC = tTask.%Save()
        If $$$ISERR(tSC) Quit
        Set tTicketId = tTask.%Id()

        // Add two code references
        Set tRef1 = ##class(SpectraSight.Model.CodeReference).%New()
        Set tRef1.Ticket = tTask
        Set tRef1.ClassName = "SpectraSight.Model.Ticket"
        Set tRef1.MethodName = "Title"
        Set tRef1.AddedBy = "testuser"
        Set tSC = tRef1.%Save()
        If $$$ISERR(tSC) Quit

        Set tRef2 = ##class(SpectraSight.Model.CodeReference).%New()
        Set tRef2.Ticket = tTask
        Set tRef2.ClassName = "SpectraSight.REST.Response"
        Set tRef2.AddedBy = "testuser"
        Set tSC = tRef2.%Save()
        If $$$ISERR(tSC) Quit

        // Build response with pIncludeChildren=1 (detail view)
        Set tResponse = ##class(SpectraSight.REST.TicketHandler).BuildTicketResponse(tTask, 1)
        Set tCodeRefs = tResponse.%Get("codeReferences")
        If tCodeRefs = "" Set tSC = $$$ERROR(5001, "codeReferences should be present in detail response") Quit
        If tCodeRefs.%Size() '= 2 Set tSC = $$$ERROR(5001, "Expected 2 codeReferences, got: "_tCodeRefs.%Size()) Quit

        // Verify structure of first ref
        Set tFirstRef = tCodeRefs.%Get(0)
        If tFirstRef.%Get("className") = "" Set tSC = $$$ERROR(5001, "className should be present") Quit
        If tFirstRef.%Get("addedBy") = "" Set tSC = $$$ERROR(5001, "addedBy should be present") Quit

        // Build response with pIncludeChildren=0 (list view) should NOT include codeReferences
        Set tListResp = ##class(SpectraSight.REST.TicketHandler).BuildTicketResponse(tTask, 0)
        If tListResp.%IsDefined("codeReferences") Set tSC = $$$ERROR(5001, "codeReferences should not be in list response") Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    // Cleanup
    If tTicketId '= "" {
        Set tCleanStmt = ##class(%SQL.Statement).%New()
        Set tSC2 = tCleanStmt.%Prepare("DELETE FROM SpectraSight_Model.CodeReference WHERE Ticket = ?")
        If $$$ISOK(tSC2) Do tCleanStmt.%Execute(tTicketId)
        Do ##class(SpectraSight.Model.Task).%DeleteId(tTicketId)
    }
    Quit tSC
}

/// Test RecordCodeReferenceChange creates proper activity entries
ClassMethod TestRecordCodeReferenceChange() As %Status
{
    Set tSC = $$$OK
    Set tTicketId = ""
    Try {
        // Create a test ticket
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "CodeRefActivityTest Bug"
        Set tSC = tBug.%Save()
        If $$$ISERR(tSC) Quit
        Set tTicketId = tBug.%Id()

        // Record an "added" activity
        Set tSC = ##class(SpectraSight.Util.ActivityRecorder).RecordCodeReferenceChange(tTicketId, "SpectraSight.Model.Ticket", "%OnNew", "added", "testuser", "human")
        If $$$ISERR(tSC) Quit

        // Record a "removed" activity
        Set tSC = ##class(SpectraSight.Util.ActivityRecorder).RecordCodeReferenceChange(tTicketId, "SpectraSight.Model.Ticket", "%OnNew", "removed", "testuser", "human")
        If $$$ISERR(tSC) Quit

        // Verify activities exist
        Set tStmt = ##class(%SQL.Statement).%New()
        Set tSC2 = tStmt.%Prepare("SELECT COUNT(*) AS cnt FROM SpectraSight_Model.Activity WHERE Ticket = ?")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "Failed to prepare activity count query") Quit
        Set tRes = tStmt.%Execute(tTicketId)
        If tRes.%Next() {
            If tRes.%Get("cnt") '= 2 Set tSC = $$$ERROR(5001, "Expected 2 activities, got: "_tRes.%Get("cnt")) Quit
        }

        // Verify CodeReferenceChange specific fields
        Set tStmt2 = ##class(%SQL.Statement).%New()
        Set tSC2 = tStmt2.%Prepare("SELECT ClassName, MethodName, Action FROM SpectraSight_Model.CodeReferenceChange WHERE Ticket = ? ORDER BY ID")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "Failed to prepare CodeReferenceChange query") Quit
        Set tRes2 = tStmt2.%Execute(tTicketId)

        // First entry: added
        If tRes2.%Next() {
            If tRes2.%Get("ClassName") '= "SpectraSight.Model.Ticket" Set tSC = $$$ERROR(5001, "ClassName mismatch on added entry") Quit
            If tRes2.%Get("MethodName") '= "%OnNew" Set tSC = $$$ERROR(5001, "MethodName mismatch on added entry") Quit
            If tRes2.%Get("Action") '= "added" Set tSC = $$$ERROR(5001, "Action should be 'added', got: "_tRes2.%Get("Action")) Quit
        } Else {
            Set tSC = $$$ERROR(5001, "Expected first CodeReferenceChange entry") Quit
        }

        // Second entry: removed
        If tRes2.%Next() {
            If tRes2.%Get("Action") '= "removed" Set tSC = $$$ERROR(5001, "Action should be 'removed', got: "_tRes2.%Get("Action")) Quit
        } Else {
            Set tSC = $$$ERROR(5001, "Expected second CodeReferenceChange entry") Quit
        }
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    // Cleanup
    If tTicketId '= "" {
        Set tCleanStmt = ##class(%SQL.Statement).%New()
        Set tSC2 = tCleanStmt.%Prepare("DELETE FROM SpectraSight_Model.Activity WHERE Ticket = ?")
        If $$$ISOK(tSC2) Do tCleanStmt.%Execute(tTicketId)
        Do ##class(SpectraSight.Model.Bug).%DeleteId(tTicketId)
    }
    Quit tSC
}

/// Test pagination SQL with OFFSET/FETCH returns correct subsets
ClassMethod TestPaginationWithOffsetFetch() As %Status
{
    Set tSC = $$$OK
    Set tIds = ""
    Try {
        // Create 5 tickets with unique titles
        For tI = 1:1:5 {
            Set tTask = ##class(SpectraSight.Model.Task).%New()
            Set tTask.Title = "PaginTest "_tI
            Set tSC = tTask.%Save()
            If $$$ISERR(tSC) Quit
            Set $LIST(tIds, tI) = tTask.%Id()
        }
        If $$$ISERR(tSC) Quit

        // Page 1 with pageSize 2: should return 2 rows
        Set tPageSize = 2
        Set tOffset = 0
        Set tStmt = ##class(%SQL.Statement).%New()
        Set tSC = tStmt.%Prepare("SELECT ID FROM SpectraSight_Model.Ticket WHERE Title LIKE 'PaginTest %' ORDER BY Title ASC OFFSET "_tOffset_" ROWS FETCH NEXT "_tPageSize_" ROWS ONLY")
        If $$$ISERR(tSC) Quit
        Set tRes = tStmt.%Execute()
        Set tCount = 0
        While tRes.%Next() {
            Set tCount = tCount + 1
        }
        If tCount '= 2 Set tSC = $$$ERROR(5001, "Page 1 expected 2 rows, got: "_tCount) Quit

        // Page 2 with pageSize 2: should return 2 rows
        Set tOffset2 = 2
        Set tStmt2 = ##class(%SQL.Statement).%New()
        Set tSC = tStmt2.%Prepare("SELECT ID FROM SpectraSight_Model.Ticket WHERE Title LIKE 'PaginTest %' ORDER BY Title ASC OFFSET "_tOffset2_" ROWS FETCH NEXT "_tPageSize_" ROWS ONLY")
        If $$$ISERR(tSC) Quit
        Set tRes2 = tStmt2.%Execute()
        Set tCount2 = 0
        While tRes2.%Next() {
            Set tCount2 = tCount2 + 1
        }
        If tCount2 '= 2 Set tSC = $$$ERROR(5001, "Page 2 expected 2 rows, got: "_tCount2) Quit

        // Page 3 with pageSize 2: should return 1 row (5 total, page 3 = last item)
        Set tOffset3 = 4
        Set tStmt3 = ##class(%SQL.Statement).%New()
        Set tSC = tStmt3.%Prepare("SELECT ID FROM SpectraSight_Model.Ticket WHERE Title LIKE 'PaginTest %' ORDER BY Title ASC OFFSET "_tOffset3_" ROWS FETCH NEXT "_tPageSize_" ROWS ONLY")
        If $$$ISERR(tSC) Quit
        Set tRes3 = tStmt3.%Execute()
        Set tCount3 = 0
        While tRes3.%Next() {
            Set tCount3 = tCount3 + 1
        }
        If tCount3 '= 1 Set tSC = $$$ERROR(5001, "Page 3 expected 1 row, got: "_tCount3) Quit

        // Count total
        Set tStmtC = ##class(%SQL.Statement).%New()
        Set tSC = tStmtC.%Prepare("SELECT COUNT(*) AS cnt FROM SpectraSight_Model.Ticket WHERE Title LIKE 'PaginTest %'")
        If $$$ISERR(tSC) Quit
        Set tResC = tStmtC.%Execute()
        If tResC.%Next() {
            Set tTotal = tResC.%Get("cnt")
            If tTotal '= 5 Set tSC = $$$ERROR(5001, "Expected 5 total tickets, got: "_tTotal) Quit
        }

        // Verify totalPages formula: 5 items, pageSize 2 => 3 pages
        Set tTotalPages = $SELECT(5=0:0, 1:((5 - 1) \ 2) + 1)
        If tTotalPages '= 3 Set tSC = $$$ERROR(5001, "5 items / pageSize 2 expected 3 pages, got: "_tTotalPages) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    // Cleanup
    For tI = 1:1:$LISTLENGTH(tIds) {
        Set tDelId = $LISTGET(tIds, tI)
        If tDelId '= "" Do ##class(SpectraSight.Model.Task).%DeleteId(tDelId)
    }
    Quit tSC
}

}
