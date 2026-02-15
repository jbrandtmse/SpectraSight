Class SpectraSight.Test.TestFilter Extends %RegisteredObject
{

/// Run all filter-related tests and return summary
ClassMethod RunAll() As %String [ SqlProc ]
{
    Set tResult = ""
    Try {
        Kill ^ClaudeDebug("Filter")
        Set tPassed = 0
        Set tFailed = 0

        Do ..RunOne("TestMultiValueTypeFilter", .tPassed, .tFailed)
        Do ..RunOne("TestMultiValueStatusFilter", .tPassed, .tFailed)
        Do ..RunOne("TestSingleValueTypeFilter", .tPassed, .tFailed)
        Do ..RunOne("TestSingleValueStatusFilter", .tPassed, .tFailed)
        Do ..RunOne("TestCombinedFilters", .tPassed, .tFailed)
        Do ..RunOne("TestSearchFilter", .tPassed, .tFailed)
        Do ..RunOne("TestPriorityFilter", .tPassed, .tFailed)
        Do ..RunOne("TestAssigneeFilter", .tPassed, .tFailed)
        Do ..RunOne("TestSortParameters", .tPassed, .tFailed)
        Do ..RunOne("TestExecuteWithParamsZero", .tPassed, .tFailed)
        Do ..RunOne("TestExecuteWithParamsMultiple", .tPassed, .tFailed)
        Do ..RunOne("TestInvalidTypeFilter", .tPassed, .tFailed)

        Set tResult = tPassed_" passed, "_tFailed_" failed"
        Set ^ClaudeDebug("Filter", "summary") = tResult
    }
    Catch ex {
        Set tResult = "ERROR: "_ex.DisplayString()
        Set ^ClaudeDebug("Filter", "error") = tResult
    }
    Quit tResult
}

ClassMethod RunOne(pTestName As %String, ByRef pPassed As %Integer, ByRef pFailed As %Integer) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tSC = $CLASSMETHOD("SpectraSight.Test.TestFilter", pTestName)
        If $$$ISERR(tSC) {
            Set pFailed = pFailed + 1
            Set ^ClaudeDebug("Filter", "results", pTestName) = "FAIL: "_$System.Status.GetErrorText(tSC)
        } Else {
            Set pPassed = pPassed + 1
            Set ^ClaudeDebug("Filter", "results", pTestName) = "PASS"
        }
    }
    Catch ex {
        Set pFailed = pFailed + 1
        Set ^ClaudeDebug("Filter", "results", pTestName) = "FAIL: "_ex.DisplayString()
    }
    Quit $$$OK
}

ClassMethod GetResult(pTestName As %String) As %String [ SqlProc ]
{
    Quit $GET(^ClaudeDebug("Filter", "results", pTestName), "NOT_RUN")
}

/// Create test data: 1 bug, 1 task, 1 story, 1 epic with known properties
/// Returns IDs as a $LIST in order: bug, task, story, epic
ClassMethod CreateTestData(Output pIds As %List) As %Status
{
    Set tSC = $$$OK
    Set pIds = ""
    Try {
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "FilterTest Login Bug"
        Set tBug.Description = "Login page validation error"
        Set tBug.Status = "Open"
        Set tBug.Priority = "High"
        Set tBug.Assignee = "alice"
        Set tSC = tBug.%Save()
        If $$$ISERR(tSC) Quit

        Set tTask = ##class(SpectraSight.Model.Task).%New()
        Set tTask.Title = "FilterTest Setup CI"
        Set tTask.Description = "Configure pipeline"
        Set tTask.Status = "In Progress"
        Set tTask.Priority = "Medium"
        Set tTask.Assignee = "bob"
        Set tSC = tTask.%Save()
        If $$$ISERR(tSC) Quit

        Set tStory = ##class(SpectraSight.Model.Story).%New()
        Set tStory.Title = "FilterTest User Profile"
        Set tStory.Description = "User profile page"
        Set tStory.Status = "Open"
        Set tStory.Priority = "Low"
        Set tStory.Assignee = "alice"
        Set tSC = tStory.%Save()
        If $$$ISERR(tSC) Quit

        Set tEpic = ##class(SpectraSight.Model.Epic).%New()
        Set tEpic.Title = "FilterTest Authentication Epic"
        Set tEpic.Description = "Full authentication module"
        Set tEpic.Status = "Blocked"
        Set tEpic.Priority = "Critical"
        Set tEpic.Assignee = "charlie"
        Set tSC = tEpic.%Save()
        If $$$ISERR(tSC) Quit

        Set pIds = $LISTBUILD(tBug.%Id(), tTask.%Id(), tStory.%Id(), tEpic.%Id())
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Clean up test data by IDs list
ClassMethod CleanupTestData(pIds As %List) As %Status
{
    Set tSC = $$$OK
    Try {
        For tI = 1:1:$LISTLENGTH(pIds) {
            Set tId = $LISTGET(pIds, tI)
            If tId '= "" {
                // Clean up activities first
                Set tStmt = ##class(%SQL.Statement).%New()
                Set tSC2 = tStmt.%Prepare("DELETE FROM SpectraSight_Model.Activity WHERE Ticket = ?")
                If $$$ISOK(tSC2) Do tStmt.%Execute(tId)
                // Delete ticket
                Do ##class(SpectraSight.Model.Ticket).%DeleteId(tId)
            }
        }
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Helper: count tickets matching a WHERE clause (scoped to FilterTest data)
ClassMethod CountFiltered(pExtraWhere As %String, ByRef pParams, pParamCount As %Integer, Output pCount As %Integer) As %Status
{
    Set tSC = $$$OK
    Set pCount = 0
    Try {
        Set tSQL = "SELECT COUNT(*) AS cnt FROM SpectraSight_Model.Ticket WHERE Title LIKE 'FilterTest %'"
        If pExtraWhere '= "" {
            Set tSQL = tSQL_" AND "_pExtraWhere
        }
        Set tStmt = ##class(%SQL.Statement).%New()
        Set tSC = tStmt.%Prepare(tSQL)
        If $$$ISERR(tSC) Quit
        Set tResult = ##class(SpectraSight.REST.TicketHandler).ExecuteWithParams(tStmt, .pParams, pParamCount)
        If tResult.%Next() {
            Set pCount = tResult.%Get("cnt")
        }
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Test multi-value type filter (comma-separated): bug,task should return 2
ClassMethod TestMultiValueTypeFilter() As %Status
{
    Set tSC = $$$OK
    Set tIds = ""
    Try {
        Set tSC = ..CreateTestData(.tIds)
        If $$$ISERR(tSC) Quit

        // Simulate type=bug,task filter logic from ListTickets
        Set tType = "bug,task"
        Set tTypeList = $LISTFROMSTRING(tType, ",")
        Set tTypeCount = $LISTLENGTH(tTypeList)
        Set tTypeClauses = ""
        For tI = 1:1:tTypeCount {
            Set tOneType = $ZCONVERT($ZSTRIP($LIST(tTypeList, tI), "<>W"), "L")
            Set tSC2 = ##class(SpectraSight.Util.Validation).GetClassForType(tOneType, .tFilterClass)
            If $$$ISOK(tSC2) {
                Set tTableName = $TRANSLATE($PIECE(tFilterClass, ".", 1, *-1), ".", "_")_"."_$PIECE(tFilterClass, ".", *)
                Set tTypeClauses = tTypeClauses_$SELECT(tTypeClauses="":"", 1:" OR ")_"%ID IN (SELECT %ID FROM "_tTableName_")"
            }
        }

        // Query: tickets of type bug OR task among our test data
        Set tParamCount = 0
        Set tSC = ..CountFiltered("("_tTypeClauses_")", .tParams, tParamCount, .tCount)
        If $$$ISERR(tSC) Quit
        If tCount '= 2 Set tSC = $$$ERROR(5001, "Multi-value type bug,task expected 2, got: "_tCount) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Do ..CleanupTestData(tIds)
    Quit tSC
}

/// Test multi-value status filter (comma-separated): Open,Blocked should return 3 (bug=Open, story=Open, epic=Blocked)
ClassMethod TestMultiValueStatusFilter() As %Status
{
    Set tSC = $$$OK
    Set tIds = ""
    Try {
        Set tSC = ..CreateTestData(.tIds)
        If $$$ISERR(tSC) Quit

        // Simulate status=Open,Blocked filter logic from ListTickets
        Set tStatus = "Open,Blocked"
        Set tStatusList = $LISTFROMSTRING(tStatus, ",")
        Set tStatusCount = $LISTLENGTH(tStatusList)
        Set tStatusPlaceholders = ""
        Set tParamCount = 0
        For tI = 1:1:tStatusCount {
            Set tParamCount = tParamCount + 1
            Set tParams(tParamCount) = $ZSTRIP($LIST(tStatusList, tI), "<>W")
            Set tStatusPlaceholders = tStatusPlaceholders_$SELECT(tStatusPlaceholders="":"", 1:", ")_"?"
        }

        Set tSC = ..CountFiltered("Status IN ("_tStatusPlaceholders_")", .tParams, tParamCount, .tCount)
        If $$$ISERR(tSC) Quit
        If tCount '= 3 Set tSC = $$$ERROR(5001, "Multi-value status Open,Blocked expected 3, got: "_tCount) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Do ..CleanupTestData(tIds)
    Quit tSC
}

/// Test single-value type filter: bug should return 1
ClassMethod TestSingleValueTypeFilter() As %Status
{
    Set tSC = $$$OK
    Set tIds = ""
    Try {
        Set tSC = ..CreateTestData(.tIds)
        If $$$ISERR(tSC) Quit

        // Single type=bug uses subquery approach
        Set tSC2 = ##class(SpectraSight.Util.Validation).GetClassForType("bug", .tFilterClass)
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "GetClassForType(bug) failed") Quit
        Set tTableName = $TRANSLATE($PIECE(tFilterClass, ".", 1, *-1), ".", "_")_"."_$PIECE(tFilterClass, ".", *)

        Set tParamCount = 0
        Set tSC = ..CountFiltered("%ID IN (SELECT %ID FROM "_tTableName_")", .tParams, tParamCount, .tCount)
        If $$$ISERR(tSC) Quit
        If tCount '= 1 Set tSC = $$$ERROR(5001, "Single type bug expected 1, got: "_tCount) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Do ..CleanupTestData(tIds)
    Quit tSC
}

/// Test single-value status filter: Open should return 2 (bug and story)
ClassMethod TestSingleValueStatusFilter() As %Status
{
    Set tSC = $$$OK
    Set tIds = ""
    Try {
        Set tSC = ..CreateTestData(.tIds)
        If $$$ISERR(tSC) Quit

        Set tParamCount = 1
        Set tParams(1) = "Open"
        Set tSC = ..CountFiltered("Status = ?", .tParams, tParamCount, .tCount)
        If $$$ISERR(tSC) Quit
        If tCount '= 2 Set tSC = $$$ERROR(5001, "Single status Open expected 2, got: "_tCount) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Do ..CleanupTestData(tIds)
    Quit tSC
}

/// Test combined filters: type=bug,story AND status=Open should return 2 (bug=Open, story=Open)
ClassMethod TestCombinedFilters() As %Status
{
    Set tSC = $$$OK
    Set tIds = ""
    Try {
        Set tSC = ..CreateTestData(.tIds)
        If $$$ISERR(tSC) Quit

        // Build type filter: bug,story
        Set tType = "bug,story"
        Set tTypeList = $LISTFROMSTRING(tType, ",")
        Set tTypeCount = $LISTLENGTH(tTypeList)
        Set tTypeClauses = ""
        For tI = 1:1:tTypeCount {
            Set tOneType = $ZCONVERT($ZSTRIP($LIST(tTypeList, tI), "<>W"), "L")
            Set tSC2 = ##class(SpectraSight.Util.Validation).GetClassForType(tOneType, .tFilterClass)
            If $$$ISOK(tSC2) {
                Set tTableName = $TRANSLATE($PIECE(tFilterClass, ".", 1, *-1), ".", "_")_"."_$PIECE(tFilterClass, ".", *)
                Set tTypeClauses = tTypeClauses_$SELECT(tTypeClauses="":"", 1:" OR ")_"%ID IN (SELECT %ID FROM "_tTableName_")"
            }
        }

        // Build status filter: Open
        Set tParamCount = 1
        Set tParams(1) = "Open"

        Set tWhere = "("_tTypeClauses_") AND Status = ?"
        Set tSC = ..CountFiltered(tWhere, .tParams, tParamCount, .tCount)
        If $$$ISERR(tSC) Quit
        If tCount '= 2 Set tSC = $$$ERROR(5001, "Combined type=bug,story status=Open expected 2, got: "_tCount) Quit

        // Now add assignee filter: alice (only the bug and story belong to alice)
        Set tParamCount = 2
        Set tParams(2) = "alice"
        Set tWhere2 = "("_tTypeClauses_") AND Status = ? AND Assignee = ?"
        Set tSC = ..CountFiltered(tWhere2, .tParams, tParamCount, .tCount2)
        If $$$ISERR(tSC) Quit
        If tCount2 '= 2 Set tSC = $$$ERROR(5001, "Combined type+status+assignee=alice expected 2, got: "_tCount2) Quit

        // Assignee=bob (only the task, which is In Progress not Open, so with status=Open: 0)
        Set tParams(2) = "bob"
        Set tSC = ..CountFiltered(tWhere2, .tParams, tParamCount, .tCount3)
        If $$$ISERR(tSC) Quit
        If tCount3 '= 0 Set tSC = $$$ERROR(5001, "Combined type+status+assignee=bob expected 0, got: "_tCount3) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Do ..CleanupTestData(tIds)
    Quit tSC
}

/// Test search filter: matches against Title and Description (AC #5)
ClassMethod TestSearchFilter() As %Status
{
    Set tSC = $$$OK
    Set tIds = ""
    Try {
        Set tSC = ..CreateTestData(.tIds)
        If $$$ISERR(tSC) Quit

        // Search for "Login" - should match bug title "FilterTest Login Bug"
        Set tParamCount = 2
        Set tParams(1) = "%Login%"
        Set tParams(2) = "%Login%"
        Set tSC = ..CountFiltered("(Title LIKE ? OR Description LIKE ?)", .tParams, tParamCount, .tCount)
        If $$$ISERR(tSC) Quit
        If tCount '= 1 Set tSC = $$$ERROR(5001, "Search 'Login' expected 1, got: "_tCount) Quit

        // Search for "validation" - should match bug description "Login page validation error"
        Set tParams(1) = "%validation%"
        Set tParams(2) = "%validation%"
        Set tSC = ..CountFiltered("(Title LIKE ? OR Description LIKE ?)", .tParams, tParamCount, .tCount2)
        If $$$ISERR(tSC) Quit
        If tCount2 '= 1 Set tSC = $$$ERROR(5001, "Search 'validation' expected 1, got: "_tCount2) Quit

        // Search for "FilterTest" - should match all 4
        Set tParams(1) = "%FilterTest%"
        Set tParams(2) = "%FilterTest%"
        Set tSC = ..CountFiltered("(Title LIKE ? OR Description LIKE ?)", .tParams, tParamCount, .tCount3)
        If $$$ISERR(tSC) Quit
        If tCount3 '= 4 Set tSC = $$$ERROR(5001, "Search 'FilterTest' expected 4, got: "_tCount3) Quit

        // Search for "pipeline" - should match task description only
        Set tParams(1) = "%pipeline%"
        Set tParams(2) = "%pipeline%"
        Set tSC = ..CountFiltered("(Title LIKE ? OR Description LIKE ?)", .tParams, tParamCount, .tCount4)
        If $$$ISERR(tSC) Quit
        If tCount4 '= 1 Set tSC = $$$ERROR(5001, "Search 'pipeline' expected 1 (task desc), got: "_tCount4) Quit

        // Search for "nonexistent" - should return 0
        Set tParams(1) = "%nonexistent%"
        Set tParams(2) = "%nonexistent%"
        Set tSC = ..CountFiltered("(Title LIKE ? OR Description LIKE ?)", .tParams, tParamCount, .tCount5)
        If $$$ISERR(tSC) Quit
        If tCount5 '= 0 Set tSC = $$$ERROR(5001, "Search 'nonexistent' expected 0, got: "_tCount5) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Do ..CleanupTestData(tIds)
    Quit tSC
}

/// Test priority filter: High should return 1 (the bug)
ClassMethod TestPriorityFilter() As %Status
{
    Set tSC = $$$OK
    Set tIds = ""
    Try {
        Set tSC = ..CreateTestData(.tIds)
        If $$$ISERR(tSC) Quit

        // Priority = High
        Set tParamCount = 1
        Set tParams(1) = "High"
        Set tSC = ..CountFiltered("Priority = ?", .tParams, tParamCount, .tCount)
        If $$$ISERR(tSC) Quit
        If tCount '= 1 Set tSC = $$$ERROR(5001, "Priority High expected 1, got: "_tCount) Quit

        // Priority = Critical
        Set tParams(1) = "Critical"
        Set tSC = ..CountFiltered("Priority = ?", .tParams, tParamCount, .tCount2)
        If $$$ISERR(tSC) Quit
        If tCount2 '= 1 Set tSC = $$$ERROR(5001, "Priority Critical expected 1, got: "_tCount2) Quit

        // Priority = Low
        Set tParams(1) = "Low"
        Set tSC = ..CountFiltered("Priority = ?", .tParams, tParamCount, .tCount3)
        If $$$ISERR(tSC) Quit
        If tCount3 '= 1 Set tSC = $$$ERROR(5001, "Priority Low expected 1, got: "_tCount3) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Do ..CleanupTestData(tIds)
    Quit tSC
}

/// Test assignee filter: alice should return 2 (bug and story)
ClassMethod TestAssigneeFilter() As %Status
{
    Set tSC = $$$OK
    Set tIds = ""
    Try {
        Set tSC = ..CreateTestData(.tIds)
        If $$$ISERR(tSC) Quit

        // Assignee = alice
        Set tParamCount = 1
        Set tParams(1) = "alice"
        Set tSC = ..CountFiltered("Assignee = ?", .tParams, tParamCount, .tCount)
        If $$$ISERR(tSC) Quit
        If tCount '= 2 Set tSC = $$$ERROR(5001, "Assignee alice expected 2, got: "_tCount) Quit

        // Assignee = bob
        Set tParams(1) = "bob"
        Set tSC = ..CountFiltered("Assignee = ?", .tParams, tParamCount, .tCount2)
        If $$$ISERR(tSC) Quit
        If tCount2 '= 1 Set tSC = $$$ERROR(5001, "Assignee bob expected 1, got: "_tCount2) Quit

        // Assignee = charlie
        Set tParams(1) = "charlie"
        Set tSC = ..CountFiltered("Assignee = ?", .tParams, tParamCount, .tCount3)
        If $$$ISERR(tSC) Quit
        If tCount3 '= 1 Set tSC = $$$ERROR(5001, "Assignee charlie expected 1, got: "_tCount3) Quit

        // Assignee = nobody (should return 0)
        Set tParams(1) = "nobody"
        Set tSC = ..CountFiltered("Assignee = ?", .tParams, tParamCount, .tCount4)
        If $$$ISERR(tSC) Quit
        If tCount4 '= 0 Set tSC = $$$ERROR(5001, "Assignee nobody expected 0, got: "_tCount4) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Do ..CleanupTestData(tIds)
    Quit tSC
}

/// Test BuildOrderBy with all sort parameters used by Story 2.2
ClassMethod TestSortParameters() As %Status
{
    Set tSC = $$$OK
    Try {
        // Ascending title
        Set tOrder = ##class(SpectraSight.REST.TicketHandler).BuildOrderBy("title")
        If tOrder '= "Title ASC" Set tSC = $$$ERROR(5001, "title expected Title ASC, got: "_tOrder) Quit

        // Descending title
        Set tOrder2 = ##class(SpectraSight.REST.TicketHandler).BuildOrderBy("-title")
        If tOrder2 '= "Title DESC" Set tSC = $$$ERROR(5001, "-title expected Title DESC, got: "_tOrder2) Quit

        // Status sort
        Set tOrder3 = ##class(SpectraSight.REST.TicketHandler).BuildOrderBy("status")
        If tOrder3 '= "Status ASC" Set tSC = $$$ERROR(5001, "status expected Status ASC, got: "_tOrder3) Quit

        // Priority sort
        Set tOrder4 = ##class(SpectraSight.REST.TicketHandler).BuildOrderBy("-priority")
        If tOrder4 '= "Priority DESC" Set tSC = $$$ERROR(5001, "-priority expected Priority DESC, got: "_tOrder4) Quit

        // Assignee sort
        Set tOrder5 = ##class(SpectraSight.REST.TicketHandler).BuildOrderBy("assignee")
        If tOrder5 '= "Assignee ASC" Set tSC = $$$ERROR(5001, "assignee expected Assignee ASC, got: "_tOrder5) Quit

        // UpdatedAt sort (default)
        Set tOrder6 = ##class(SpectraSight.REST.TicketHandler).BuildOrderBy("-updatedAt")
        If tOrder6 '= "UpdatedAt DESC" Set tSC = $$$ERROR(5001, "-updatedAt expected UpdatedAt DESC, got: "_tOrder6) Quit

        // Unknown field defaults to UpdatedAt DESC
        Set tOrder7 = ##class(SpectraSight.REST.TicketHandler).BuildOrderBy("invalidField")
        If tOrder7 '= "UpdatedAt DESC" Set tSC = $$$ERROR(5001, "invalidField expected UpdatedAt DESC, got: "_tOrder7) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Test ExecuteWithParams with zero parameters
ClassMethod TestExecuteWithParamsZero() As %Status
{
    Set tSC = $$$OK
    Try {
        Set tStmt = ##class(%SQL.Statement).%New()
        Set tSC = tStmt.%Prepare("SELECT COUNT(*) AS cnt FROM SpectraSight_Model.Ticket WHERE Title LIKE 'FilterTestZeroParams%'")
        If $$$ISERR(tSC) Quit

        Set tParamCount = 0
        Set tResult = ##class(SpectraSight.REST.TicketHandler).ExecuteWithParams(tStmt, .tParams, tParamCount)
        If tResult.%Next() {
            Set tCount = tResult.%Get("cnt")
            // Should be 0 since no test data matches this pattern
            If tCount '= 0 Set tSC = $$$ERROR(5001, "Zero param query expected 0, got: "_tCount) Quit
        } Else {
            Set tSC = $$$ERROR(5001, "Zero param query returned no rows") Quit
        }
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Test ExecuteWithParams with multiple parameters (simulating combined filters)
ClassMethod TestExecuteWithParamsMultiple() As %Status
{
    Set tSC = $$$OK
    Set tIds = ""
    Try {
        Set tSC = ..CreateTestData(.tIds)
        If $$$ISERR(tSC) Quit

        // Query with 3 params: status + priority + search (Title LIKE ?)
        Set tSQL = "SELECT COUNT(*) AS cnt FROM SpectraSight_Model.Ticket WHERE Title LIKE 'FilterTest %' AND Status = ? AND Priority = ? AND Title LIKE ?"
        Set tStmt = ##class(%SQL.Statement).%New()
        Set tSC = tStmt.%Prepare(tSQL)
        If $$$ISERR(tSC) Quit

        Set tParamCount = 3
        Set tParams(1) = "Open"
        Set tParams(2) = "High"
        Set tParams(3) = "%Login%"
        Set tResult = ##class(SpectraSight.REST.TicketHandler).ExecuteWithParams(tStmt, .tParams, tParamCount)
        If tResult.%Next() {
            Set tCount = tResult.%Get("cnt")
            // Bug: Open, High, title contains "Login"
            If tCount '= 1 Set tSC = $$$ERROR(5001, "3-param query expected 1 (bug), got: "_tCount) Quit
        }

        // Test with 5 params
        Set tSQL5 = "SELECT COUNT(*) AS cnt FROM SpectraSight_Model.Ticket WHERE Title LIKE 'FilterTest %' AND Status IN (?, ?) AND Priority = ? AND (Title LIKE ? OR Description LIKE ?)"
        Set tStmt5 = ##class(%SQL.Statement).%New()
        Set tSC = tStmt5.%Prepare(tSQL5)
        If $$$ISERR(tSC) Quit

        Set tParamCount5 = 5
        Set tParams5(1) = "Open"
        Set tParams5(2) = "Blocked"
        Set tParams5(3) = "High"
        Set tParams5(4) = "%Login%"
        Set tParams5(5) = "%Login%"
        Set tResult5 = ##class(SpectraSight.REST.TicketHandler).ExecuteWithParams(tStmt5, .tParams5, tParamCount5)
        If tResult5.%Next() {
            Set tCount5 = tResult5.%Get("cnt")
            // Bug: Open+High, title has Login
            If tCount5 '= 1 Set tSC = $$$ERROR(5001, "5-param query expected 1, got: "_tCount5) Quit
        }
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Do ..CleanupTestData(tIds)
    Quit tSC
}

/// Test that invalid type values in multi-value filter are detected
ClassMethod TestInvalidTypeFilter() As %Status
{
    Set tSC = $$$OK
    Try {
        // Valid type
        Set tSC2 = ##class(SpectraSight.Util.Validation).GetClassForType("bug", .tClass)
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "bug should be valid type") Quit

        // Invalid type
        Set tSC2 = ##class(SpectraSight.Util.Validation).GetClassForType("feature", .tClass2)
        If $$$ISOK(tSC2) Set tSC = $$$ERROR(5001, "feature should be invalid type") Quit

        // Mixed valid+invalid in comma-separated list
        Set tType = "bug,feature"
        Set tTypeList = $LISTFROMSTRING(tType, ",")
        Set tTypeCount = $LISTLENGTH(tTypeList)
        Set tAllValid = 1
        For tI = 1:1:tTypeCount {
            Set tOneType = $ZCONVERT($ZSTRIP($LIST(tTypeList, tI), "<>W"), "L")
            Set tSC2 = ##class(SpectraSight.Util.Validation).GetClassForType(tOneType, .tFilterClass)
            If $$$ISERR(tSC2) {
                Set tAllValid = 0
            }
        }
        If tAllValid Set tSC = $$$ERROR(5001, "Mixed valid+invalid types should detect invalid") Quit

        // All valid types
        Set tType2 = "bug,task,story,epic"
        Set tTypeList2 = $LISTFROMSTRING(tType2, ",")
        Set tTypeCount2 = $LISTLENGTH(tTypeList2)
        Set tAllValid2 = 1
        For tI = 1:1:tTypeCount2 {
            Set tOneType2 = $ZCONVERT($ZSTRIP($LIST(tTypeList2, tI), "<>W"), "L")
            Set tSC2 = ##class(SpectraSight.Util.Validation).GetClassForType(tOneType2, .tFilterClass2)
            If $$$ISERR(tSC2) {
                Set tAllValid2 = 0
            }
        }
        If 'tAllValid2 Set tSC = $$$ERROR(5001, "All valid types should pass validation") Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

}
