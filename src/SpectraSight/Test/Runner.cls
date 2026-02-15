Class SpectraSight.Test.Runner Extends %RegisteredObject
{

/// Run all tests by directly testing CRUD operations
/// Stores results in ^ClaudeDebug global
ClassMethod RunAll() As %String [ SqlProc ]
{
    Set tResult = ""
    Try {
        Kill ^ClaudeDebug
        Set tPassed = 0
        Set tFailed = 0

        // Test 1: TestCreateBug
        Do ..RunOne("TestCreateBug", .tPassed, .tFailed)
        // Test 2: TestCreateTask
        Do ..RunOne("TestCreateTask", .tPassed, .tFailed)
        // Test 3: TestCreateStory
        Do ..RunOne("TestCreateStory", .tPassed, .tFailed)
        // Test 4: TestCreateEpic
        Do ..RunOne("TestCreateEpic", .tPassed, .tFailed)
        // Test 5: TestDefaultValues
        Do ..RunOne("TestDefaultValues", .tPassed, .tFailed)
        // Test 6: TestUpdateTimestamp
        Do ..RunOne("TestUpdateTimestamp", .tPassed, .tFailed)
        // Test 7: TestPolymorphicQuery
        Do ..RunOne("TestPolymorphicQuery", .tPassed, .tFailed)
        // Test 8: TestPolymorphicFilterByStatus
        Do ..RunOne("TestPolymorphicFilterByStatus", .tPassed, .tFailed)

        Set tResult = tPassed_" passed, "_tFailed_" failed"
        Set ^ClaudeDebug("summary") = tResult
    }
    Catch ex {
        Set tResult = "ERROR: "_ex.DisplayString()
        Set ^ClaudeDebug("error") = tResult
    }
    Quit tResult
}

ClassMethod GetResult(pTestName As %String) As %String [ SqlProc ]
{
    Quit $Get(^ClaudeDebug("results", pTestName), "NOT_RUN")
}

ClassMethod RunSingle(pTestName As %String) As %String [ SqlProc ]
{
    Set tOutput = "PASS"
    Try {
        Set tSC = $ClassMethod("SpectraSight.Test.Runner", pTestName)
        If $$$ISERR(tSC) {
            Set tOutput = "FAIL: "_$System.Status.GetErrorText(tSC)
        }
    }
    Catch ex {
        Set tOutput = "FAIL: "_ex.DisplayString()
    }
    Quit tOutput
}

ClassMethod RunOne(pTestName As %String, ByRef pPassed As %Integer, ByRef pFailed As %Integer) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tSC = $ClassMethod("SpectraSight.Test.Runner", pTestName)
        If $$$ISERR(tSC) {
            Set pFailed = pFailed + 1
            Set ^ClaudeDebug("results", pTestName) = "FAIL: "_$System.Status.GetErrorText(tSC)
        } Else {
            Set pPassed = pPassed + 1
            Set ^ClaudeDebug("results", pTestName) = "PASS"
        }
    }
    Catch ex {
        Set pFailed = pFailed + 1
        Set ^ClaudeDebug("results", pTestName) = "FAIL: "_ex.DisplayString()
    }
    Quit $$$OK
}

ClassMethod TestCreateBug() As %Status
{
    Set tSC = $$$OK
    Try {
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "Test Bug"
        Set tBug.Severity = "High"
        Set tSC = tBug.%Save()
        If $$$ISERR(tSC) Quit

        Set tId = tBug.%Id()
        If tId = "" Set tSC = $$$ERROR(5001, "Bug has no ID") Quit

        Set tLoaded = ##class(SpectraSight.Model.Bug).%OpenId(tId)
        If tLoaded.Title '= "Test Bug" Set tSC = $$$ERROR(5001, "Title mismatch: "_tLoaded.Title) Quit
        If tLoaded.Severity '= "High" Set tSC = $$$ERROR(5001, "Severity mismatch") Quit

        Set tSC = ##class(SpectraSight.Model.Bug).%DeleteId(tId)
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

ClassMethod TestCreateTask() As %Status
{
    Set tSC = $$$OK
    Try {
        Set tTask = ##class(SpectraSight.Model.Task).%New()
        Set tTask.Title = "Test Task"
        Set tTask.EstimatedHours = 8
        Set tSC = tTask.%Save()
        If $$$ISERR(tSC) Quit

        Set tId = tTask.%Id()
        Set tLoaded = ##class(SpectraSight.Model.Task).%OpenId(tId)
        If tLoaded.Title '= "Test Task" Set tSC = $$$ERROR(5001, "Title mismatch") Quit
        If tLoaded.EstimatedHours '= 8 Set tSC = $$$ERROR(5001, "EstimatedHours mismatch") Quit

        Set tSC = ##class(SpectraSight.Model.Task).%DeleteId(tId)
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

ClassMethod TestCreateStory() As %Status
{
    Set tSC = $$$OK
    Try {
        Set tStory = ##class(SpectraSight.Model.Story).%New()
        Set tStory.Title = "Test Story"
        Set tStory.StoryPoints = 5
        Set tSC = tStory.%Save()
        If $$$ISERR(tSC) Quit

        Set tId = tStory.%Id()
        Set tLoaded = ##class(SpectraSight.Model.Story).%OpenId(tId)
        If tLoaded.Title '= "Test Story" Set tSC = $$$ERROR(5001, "Title mismatch") Quit
        If tLoaded.StoryPoints '= 5 Set tSC = $$$ERROR(5001, "StoryPoints mismatch") Quit

        Set tSC = ##class(SpectraSight.Model.Story).%DeleteId(tId)
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

ClassMethod TestCreateEpic() As %Status
{
    Set tSC = $$$OK
    Try {
        Set tEpic = ##class(SpectraSight.Model.Epic).%New()
        Set tEpic.Title = "Test Epic"
        Set tEpic.StartDate = +$Horolog
        Set tEpic.TargetDate = +$Horolog + 30
        Set tSC = tEpic.%Save()
        If $$$ISERR(tSC) Quit

        Set tId = tEpic.%Id()
        Set tLoaded = ##class(SpectraSight.Model.Epic).%OpenId(tId)
        If tLoaded.Title '= "Test Epic" Set tSC = $$$ERROR(5001, "Title mismatch") Quit

        Set tSC = ##class(SpectraSight.Model.Epic).%DeleteId(tId)
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

ClassMethod TestDefaultValues() As %Status
{
    Set tSC = $$$OK
    Try {
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "Default Test"
        If tBug.Status '= "Open" Set tSC = $$$ERROR(5001, "Status should default to Open, got: "_tBug.Status) Quit
        If tBug.CreatedAt = "" Set tSC = $$$ERROR(5001, "CreatedAt should be auto-set") Quit
        If tBug.UpdatedAt = "" Set tSC = $$$ERROR(5001, "UpdatedAt should be auto-set") Quit

        Set tSC = tBug.%Save()
        If $$$ISERR(tSC) Quit
        Set tId = tBug.%Id()
        Set tSC = ##class(SpectraSight.Model.Bug).%DeleteId(tId)
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

ClassMethod TestUpdateTimestamp() As %Status
{
    Set tSC = $$$OK
    Try {
        Set tTask = ##class(SpectraSight.Model.Task).%New()
        Set tTask.Title = "Timestamp Test"
        Set tSC = tTask.%Save()
        If $$$ISERR(tSC) Quit

        Set tId = tTask.%Id()
        // Read saved value from a fresh open to get the stored timestamp
        Kill tTask
        Set tTask1 = ##class(SpectraSight.Model.Task).%OpenId(tId, , .tSC)
        If $$$ISERR(tSC) Quit
        Set tFirstUpdate = tTask1.UpdatedAt
        Kill tTask1

        // Wait 1.1 seconds to ensure timestamp difference
        Hang 1.1

        // Open fresh, modify, save
        Set tTask2 = ##class(SpectraSight.Model.Task).%OpenId(tId, , .tSC)
        If $$$ISERR(tSC) Quit
        Set tTask2.Title = "Timestamp Test Updated"
        Set tSC = tTask2.%Save()
        If $$$ISERR(tSC) Quit
        Kill tTask2

        // Open fresh to read new timestamp
        Set tTask3 = ##class(SpectraSight.Model.Task).%OpenId(tId, , .tSC)
        If $$$ISERR(tSC) Quit
        If tTask3.UpdatedAt = tFirstUpdate Set tSC = $$$ERROR(5001, "UpdatedAt should change: first="_tFirstUpdate_" second="_tTask3.UpdatedAt) Quit

        Set tSC = ##class(SpectraSight.Model.Task).%DeleteId(tId)
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

ClassMethod TestPolymorphicQuery() As %Status
{
    Set tSC = $$$OK
    Set tBugId = ""
    Set tTaskId = ""
    Set tStoryId = ""
    Set tEpicId = ""
    Try {
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "Poly Bug"
        Set tSC = tBug.%Save()
        If $$$ISERR(tSC) Quit
        Set tBugId = tBug.%Id()

        Set tTask = ##class(SpectraSight.Model.Task).%New()
        Set tTask.Title = "Poly Task"
        Set tSC = tTask.%Save()
        If $$$ISERR(tSC) Quit
        Set tTaskId = tTask.%Id()

        Set tStory = ##class(SpectraSight.Model.Story).%New()
        Set tStory.Title = "Poly Story"
        Set tSC = tStory.%Save()
        If $$$ISERR(tSC) Quit
        Set tStoryId = tStory.%Id()

        Set tEpic = ##class(SpectraSight.Model.Epic).%New()
        Set tEpic.Title = "Poly Epic"
        Set tSC = tEpic.%Save()
        If $$$ISERR(tSC) Quit
        Set tEpicId = tEpic.%Id()

        Set tStatement = ##class(%SQL.Statement).%New()
        Set tSC = tStatement.%Prepare("SELECT ID FROM SpectraSight_Model.Ticket WHERE Title LIKE 'Poly %'")
        If $$$ISERR(tSC) Quit

        Set tResult = tStatement.%Execute()
        Set tCount = 0
        While tResult.%Next() {
            Set tCount = tCount + 1
        }
        If tCount '= 4 Set tSC = $$$ERROR(5001, "Expected 4 rows, got: "_tCount) Quit
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

ClassMethod TestPolymorphicFilterByStatus() As %Status
{
    Set tSC = $$$OK
    Set tBugId = ""
    Set tTaskId = ""
    Set tStoryId = ""
    Try {
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "Filter Open Bug"
        Set tSC = tBug.%Save()
        If $$$ISERR(tSC) Quit
        Set tBugId = tBug.%Id()

        Set tTask = ##class(SpectraSight.Model.Task).%New()
        Set tTask.Title = "Filter InProgress Task"
        Set tTask.Status = "In Progress"
        Set tSC = tTask.%Save()
        If $$$ISERR(tSC) Quit
        Set tTaskId = tTask.%Id()

        Set tStory = ##class(SpectraSight.Model.Story).%New()
        Set tStory.Title = "Filter Open Story"
        Set tSC = tStory.%Save()
        If $$$ISERR(tSC) Quit
        Set tStoryId = tStory.%Id()

        Set tStatement = ##class(%SQL.Statement).%New()
        Set tSC = tStatement.%Prepare("SELECT ID FROM SpectraSight_Model.Ticket WHERE Status = 'Open' AND Title LIKE 'Filter %'")
        If $$$ISERR(tSC) Quit

        Set tResult = tStatement.%Execute()
        Set tCount = 0
        While tResult.%Next() {
            Set tCount = tCount + 1
        }
        If tCount '= 2 Set tSC = $$$ERROR(5001, "Expected 2 Open tickets, got: "_tCount) Quit
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

}
