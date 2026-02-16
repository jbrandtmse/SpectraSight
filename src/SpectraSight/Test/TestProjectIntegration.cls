Class SpectraSight.Test.TestProjectIntegration Extends %UnitTest.TestCase
{

/// Test that prefix validation rejects lowercase prefixes
Method TestPrefixValidationLowercase() As %Status
{
    Set tProject = ##class(SpectraSight.Model.Project).%New()
    Set tProject.Name = "Lowercase Test"
    Set tProject.Prefix = "abc"
    Set tSC = tProject.%Save()
    Do $$$AssertTrue($$$ISERR(tSC), "Lowercase prefix should be rejected")
    Quit $$$OK
}

/// Test that prefix validation rejects prefix shorter than 2 chars
Method TestPrefixValidationTooShort() As %Status
{
    Set tProject = ##class(SpectraSight.Model.Project).%New()
    Set tProject.Name = "Short Prefix Test"
    Set tProject.Prefix = "A"
    Set tSC = tProject.%Save()
    Do $$$AssertTrue($$$ISERR(tSC), "Single char prefix should be rejected")
    Quit $$$OK
}

/// Test that prefix validation rejects prefix with special chars
Method TestPrefixValidationSpecialChars() As %Status
{
    Set tProject = ##class(SpectraSight.Model.Project).%New()
    Set tProject.Name = "Special Chars Test"
    Set tProject.Prefix = "AB-C"
    Set tSC = tProject.%Save()
    Do $$$AssertTrue($$$ISERR(tSC), "Prefix with special chars should be rejected")
    Quit $$$OK
}

/// Test that TicketID.Format returns project-aware ID for ticket with project
Method TestTicketIDFormatWithProject() As %Status
{
    Set tProjectId = ""
    Set tBugId = ""
    Try {
        // Create a project
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = "Format Test Project"
        Set tProject.Prefix = "FT"
        Set tSC = tProject.%Save()
        Do $$$AssertStatusOK(tSC, "Project should save")
        Set tProjectId = tProject.%Id()

        // Create a ticket with project reference
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "Format Test Bug"
        Set tBug.Project = tProject
        Set tBug.SequenceNumber = 7
        Set tSC = tBug.%Save()
        Do $$$AssertStatusOK(tSC, "Bug should save")
        Set tBugId = tBug.%Id()

        // TicketID.Format should return "FT-7"
        Set tFormatted = ##class(SpectraSight.Util.TicketID).Format(tBugId)
        Do $$$AssertEquals(tFormatted, "FT-7", "Format should return project prefix and sequence number")
    }
    Catch ex {
        Do $$$AssertTrue(0, "Unexpected exception: "_ex.DisplayString())
    }
    // Cleanup
    If tBugId '= "" Do ##class(SpectraSight.Model.Bug).%DeleteId(tBugId)
    If tProjectId '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tProjectId)
    Quit $$$OK
}

/// Test that TicketID.Parse resolves project-aware IDs
Method TestTicketIDParseWithProject() As %Status
{
    Set tProjectId = ""
    Set tTaskId = ""
    Try {
        // Create a project
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = "Parse Test Project"
        Set tProject.Prefix = "PT"
        Set tSC = tProject.%Save()
        Do $$$AssertStatusOK(tSC, "Project should save")
        Set tProjectId = tProject.%Id()

        // Create a ticket with project reference
        Set tTask = ##class(SpectraSight.Model.Task).%New()
        Set tTask.Title = "Parse Test Task"
        Set tTask.Project = tProject
        Set tTask.SequenceNumber = 3
        Set tSC = tTask.%Save()
        Do $$$AssertStatusOK(tSC, "Task should save")
        Set tTaskId = tTask.%Id()

        // TicketID.Parse("PT-3") should return the task's internal ID
        Set tParsed = ##class(SpectraSight.Util.TicketID).Parse("PT-3")
        Do $$$AssertEquals(tParsed, +tTaskId, "Parse should resolve PT-3 to internal ID")

        // Unknown prefix should return empty
        Set tUnknown = ##class(SpectraSight.Util.TicketID).Parse("ZZ-99")
        Do $$$AssertEquals(tUnknown, "", "Parse of unknown prefix should return empty")
    }
    Catch ex {
        Do $$$AssertTrue(0, "Unexpected exception: "_ex.DisplayString())
    }
    // Cleanup
    If tTaskId '= "" Do ##class(SpectraSight.Model.Task).%DeleteId(tTaskId)
    If tProjectId '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tProjectId)
    Quit $$$OK
}

/// Test BuildTicketResponse includes project fields
Method TestBuildTicketResponseProjectFields() As %Status
{
    Set tProjectId = ""
    Set tBugId = ""
    Try {
        // Create a project
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = "Response Test"
        Set tProject.Prefix = "RS"
        Set tSC = tProject.%Save()
        Do $$$AssertStatusOK(tSC, "Project should save")
        Set tProjectId = tProject.%Id()

        // Create a ticket with project reference
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "Response Fields Bug"
        Set tBug.Severity = "Medium"
        Set tBug.Project = tProject
        Set tBug.SequenceNumber = 5
        Set tSC = tBug.%Save()
        Do $$$AssertStatusOK(tSC, "Bug should save")
        Set tBugId = tBug.%Id()

        // Build the response
        Set tResponse = ##class(SpectraSight.REST.TicketHandler).BuildTicketResponse(tBug)
        Do $$$AssertEquals(tResponse.%Get("projectId"), tProjectId, "projectId should match project ID")
        Do $$$AssertEquals(tResponse.%Get("projectPrefix"), "RS", "projectPrefix should be RS")
        Do $$$AssertEquals(tResponse.%Get("sequenceNumber"), 5, "sequenceNumber should be 5")
        Do $$$AssertEquals(tResponse.%Get("id"), "RS-5", "Display ID should be RS-5")
    }
    Catch ex {
        Do $$$AssertTrue(0, "Unexpected exception: "_ex.DisplayString())
    }
    // Cleanup
    If tBugId '= "" Do ##class(SpectraSight.Model.Bug).%DeleteId(tBugId)
    If tProjectId '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tProjectId)
    Quit $$$OK
}

/// Test BuildTicketResponse omits project fields for ticket without project
Method TestBuildTicketResponseNoProject() As %Status
{
    Set tBugId = ""
    Try {
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "No Project Bug"
        Set tSC = tBug.%Save()
        Do $$$AssertStatusOK(tSC, "Bug should save")
        Set tBugId = tBug.%Id()

        Set tResponse = ##class(SpectraSight.REST.TicketHandler).BuildTicketResponse(tBug)
        // projectId should not be set (or empty)
        Do $$$AssertTrue(tResponse.%Get("projectId") = "", "projectId should be empty for ticket without project")
        // sequenceNumber should not be set (SequenceNumber defaults to 0, which is excluded)
        Do $$$AssertTrue(tResponse.%Get("sequenceNumber") = "", "sequenceNumber should not be in response when 0")
        // Display ID should fall back to SS-{id}
        Do $$$AssertEquals(tResponse.%Get("id"), "SS-"_tBugId, "Display ID should fall back to SS-{id}")
    }
    Catch ex {
        Do $$$AssertTrue(0, "Unexpected exception: "_ex.DisplayString())
    }
    // Cleanup
    If tBugId '= "" Do ##class(SpectraSight.Model.Bug).%DeleteId(tBugId)
    Quit $$$OK
}

/// Test that EnsureDefaultProject creates default project and sets SequenceNumber on existing tickets
Method TestEnsureDefaultProjectSetsSequence() As %Status
{
    Set tBugId = ""
    Try {
        // Clean up any existing SS project
        Do ..CleanupDefaultProject()

        // Create a ticket without project or sequence
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "Sequence Setup Bug"
        Set tSC = tBug.%Save()
        Do $$$AssertStatusOK(tSC, "Bug should save")
        Set tBugId = tBug.%Id()

        // Run EnsureDefaultProject
        Set tSC = ##class(SpectraSight.Util.Setup).EnsureDefaultProject()
        Do $$$AssertStatusOK(tSC, "EnsureDefaultProject should succeed")

        // Verify the default project was created
        Set tStmt = ##class(%SQL.Statement).%New()
        Set tSC = tStmt.%Prepare("SELECT ID FROM SpectraSight_Model.Project WHERE Prefix = 'SS'")
        Do $$$AssertStatusOK(tSC, "SQL prepare should succeed")
        Set tRes = tStmt.%Execute()
        Do $$$AssertTrue(tRes.%Next(), "Default SS project should exist after EnsureDefaultProject")
        Set tSSProjectId = tRes.%Get("ID")

        // Verify SequenceNumber was set on the ticket via SQL
        Set tStmt2 = ##class(%SQL.Statement).%New()
        Set tSC = tStmt2.%Prepare("SELECT Project, SequenceNumber FROM SpectraSight_Model.Ticket WHERE ID = ?")
        Do $$$AssertStatusOK(tSC, "SQL prepare for ticket check should succeed")
        Set tRes2 = tStmt2.%Execute(tBugId)
        Do $$$AssertTrue(tRes2.%Next(), "Ticket should be queryable")
        Do $$$AssertEquals(tRes2.%Get("SequenceNumber"), +tBugId, "SequenceNumber should equal internal ID for migrated tickets")
    }
    Catch ex {
        Do $$$AssertTrue(0, "Unexpected exception: "_ex.DisplayString())
    }
    // Cleanup
    // Clear project reference before deleting project to avoid FK issues
    If tBugId '= "" {
        Set tStmtC = ##class(%SQL.Statement).%New()
        If $$$ISOK(tStmtC.%Prepare("UPDATE SpectraSight_Model.Ticket SET Project = NULL WHERE ID = ?")) {
            Do tStmtC.%Execute(tBugId)
        }
        Do ##class(SpectraSight.Model.Bug).%DeleteId(tBugId)
    }
    Do ..CleanupDefaultProject()
    Quit $$$OK
}

/// Test that sequence counter increments correctly for multiple tickets
Method TestSequenceCounterIncrement() As %Status
{
    Set tProjectId = ""
    Set tBug1Id = ""
    Set tBug2Id = ""
    Try {
        // Create a project with SequenceCounter = 0
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = "Seq Counter Test"
        Set tProject.Prefix = "SC"
        Set tProject.SequenceCounter = 0
        Set tSC = tProject.%Save()
        Do $$$AssertStatusOK(tSC, "Project should save")
        Set tProjectId = tProject.%Id()

        // Simulate sequence counter increment for first ticket
        LOCK +^SpectraSight.Model.ProjectD(tProjectId):5
        Set tProjectObj = ##class(SpectraSight.Model.Project).%OpenId(tProjectId)
        Set tProjectObj.SequenceCounter = tProjectObj.SequenceCounter + 1
        Set tBug1 = ##class(SpectraSight.Model.Bug).%New()
        Set tBug1.Title = "Seq Test Bug 1"
        Set tBug1.Project = tProjectObj
        Set tBug1.SequenceNumber = tProjectObj.SequenceCounter
        Set tSC = tProjectObj.%Save()
        LOCK -^SpectraSight.Model.ProjectD(tProjectId)
        Do $$$AssertStatusOK(tSC, "Project save after first increment should succeed")
        Set tSC = tBug1.%Save()
        Do $$$AssertStatusOK(tSC, "First bug should save")
        Set tBug1Id = tBug1.%Id()

        // Simulate second ticket
        LOCK +^SpectraSight.Model.ProjectD(tProjectId):5
        Set tProjectObj2 = ##class(SpectraSight.Model.Project).%OpenId(tProjectId)
        Set tProjectObj2.SequenceCounter = tProjectObj2.SequenceCounter + 1
        Set tBug2 = ##class(SpectraSight.Model.Bug).%New()
        Set tBug2.Title = "Seq Test Bug 2"
        Set tBug2.Project = tProjectObj2
        Set tBug2.SequenceNumber = tProjectObj2.SequenceCounter
        Set tSC = tProjectObj2.%Save()
        LOCK -^SpectraSight.Model.ProjectD(tProjectId)
        Do $$$AssertStatusOK(tSC, "Project save after second increment should succeed")
        Set tSC = tBug2.%Save()
        Do $$$AssertStatusOK(tSC, "Second bug should save")
        Set tBug2Id = tBug2.%Id()

        // Verify sequence numbers
        Set tLoaded1 = ##class(SpectraSight.Model.Bug).%OpenId(tBug1Id)
        Set tLoaded2 = ##class(SpectraSight.Model.Bug).%OpenId(tBug2Id)
        Do $$$AssertEquals(tLoaded1.SequenceNumber, 1, "First ticket should have SequenceNumber 1")
        Do $$$AssertEquals(tLoaded2.SequenceNumber, 2, "Second ticket should have SequenceNumber 2")

        // Verify project counter is at 2
        Set tFinalProject = ##class(SpectraSight.Model.Project).%OpenId(tProjectId)
        Do $$$AssertEquals(tFinalProject.SequenceCounter, 2, "Project SequenceCounter should be 2")
    }
    Catch ex {
        Do $$$AssertTrue(0, "Unexpected exception: "_ex.DisplayString())
    }
    // Cleanup
    If tBug1Id '= "" Do ##class(SpectraSight.Model.Bug).%DeleteId(tBug1Id)
    If tBug2Id '= "" Do ##class(SpectraSight.Model.Bug).%DeleteId(tBug2Id)
    If tProjectId '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tProjectId)
    Quit $$$OK
}

/// Test TicketID round-trip: Format then Parse returns same internal ID
Method TestTicketIDRoundTrip() As %Status
{
    Set tProjectId = ""
    Set tStoryId = ""
    Try {
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = "Round Trip Test"
        Set tProject.Prefix = "RR"
        Set tSC = tProject.%Save()
        Do $$$AssertStatusOK(tSC, "Project should save")
        Set tProjectId = tProject.%Id()

        Set tStory = ##class(SpectraSight.Model.Story).%New()
        Set tStory.Title = "Round Trip Story"
        Set tStory.Project = tProject
        Set tStory.SequenceNumber = 42
        Set tSC = tStory.%Save()
        Do $$$AssertStatusOK(tSC, "Story should save")
        Set tStoryId = tStory.%Id()

        // Format -> Parse should return original internal ID
        Set tDisplayId = ##class(SpectraSight.Util.TicketID).Format(tStoryId)
        Do $$$AssertEquals(tDisplayId, "RR-42", "Display ID should be RR-42")

        Set tParsedId = ##class(SpectraSight.Util.TicketID).Parse(tDisplayId)
        Do $$$AssertEquals(tParsedId, +tStoryId, "Parse of formatted ID should return internal ID")
    }
    Catch ex {
        Do $$$AssertTrue(0, "Unexpected exception: "_ex.DisplayString())
    }
    // Cleanup
    If tStoryId '= "" Do ##class(SpectraSight.Model.Story).%DeleteId(tStoryId)
    If tProjectId '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tProjectId)
    Quit $$$OK
}

/// Test prefix validation accepts valid alphanumeric uppercase prefixes
Method TestPrefixValidationValid() As %Status
{
    Set tProjectId = ""
    Try {
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = "Valid Prefix Test"
        Set tProject.Prefix = "AB12"
        Set tSC = tProject.%Save()
        Do $$$AssertStatusOK(tSC, "Alphanumeric uppercase prefix should be accepted")
        Set tProjectId = tProject.%Id()
    }
    Catch ex {
        Do $$$AssertTrue(0, "Unexpected exception: "_ex.DisplayString())
    }
    If tProjectId '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tProjectId)
    Quit $$$OK
}

/// Helper: clean up default project
Method CleanupDefaultProject() [ Private ]
{
    Set tStmt = ##class(%SQL.Statement).%New()
    Set tSC = tStmt.%Prepare("SELECT ID FROM SpectraSight_Model.Project WHERE Prefix = 'SS'")
    If $$$ISOK(tSC) {
        Set tRes = tStmt.%Execute()
        While tRes.%Next() {
            Do ##class(SpectraSight.Model.Project).%DeleteId(tRes.%Get("ID"))
        }
    }
}

}
