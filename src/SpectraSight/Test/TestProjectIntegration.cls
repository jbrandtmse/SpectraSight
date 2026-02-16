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

/// Test sequential numbering: 3 tickets in same project get SequenceNumbers 1, 2, 3 (AC#6)
Method TestSequentialNumbering() As %Status
{
    Set tProjectId = ""
    Set tIds(1) = ""
    Set tIds(2) = ""
    Set tIds(3) = ""
    Try {
        // Create a project
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = "Sequential Test"
        Set tProject.Prefix = "SQ"
        Set tProject.SequenceCounter = 0
        Set tSC = tProject.%Save()
        Do $$$AssertStatusOK(tSC, "Project should save")
        Set tProjectId = tProject.%Id()

        // Create ticket 1
        LOCK +^SpectraSight.Model.ProjectD(tProjectId):5
        Set tProjObj = ##class(SpectraSight.Model.Project).%OpenId(tProjectId)
        Set tProjObj.SequenceCounter = tProjObj.SequenceCounter + 1
        Set tTicket1 = ##class(SpectraSight.Model.Task).%New()
        Set tTicket1.Title = "Seq Test 1"
        Set tTicket1.Project = tProjObj
        Set tTicket1.SequenceNumber = tProjObj.SequenceCounter
        Set tSC = tProjObj.%Save()
        LOCK -^SpectraSight.Model.ProjectD(tProjectId)
        Do $$$AssertStatusOK(tSC, "Project save for ticket 1 should succeed")
        Set tSC = tTicket1.%Save()
        Do $$$AssertStatusOK(tSC, "Ticket 1 should save")
        Set tIds(1) = tTicket1.%Id()

        // Create ticket 2
        LOCK +^SpectraSight.Model.ProjectD(tProjectId):5
        Set tProjObj = ##class(SpectraSight.Model.Project).%OpenId(tProjectId)
        Set tProjObj.SequenceCounter = tProjObj.SequenceCounter + 1
        Set tTicket2 = ##class(SpectraSight.Model.Task).%New()
        Set tTicket2.Title = "Seq Test 2"
        Set tTicket2.Project = tProjObj
        Set tTicket2.SequenceNumber = tProjObj.SequenceCounter
        Set tSC = tProjObj.%Save()
        LOCK -^SpectraSight.Model.ProjectD(tProjectId)
        Do $$$AssertStatusOK(tSC, "Project save for ticket 2 should succeed")
        Set tSC = tTicket2.%Save()
        Do $$$AssertStatusOK(tSC, "Ticket 2 should save")
        Set tIds(2) = tTicket2.%Id()

        // Create ticket 3
        LOCK +^SpectraSight.Model.ProjectD(tProjectId):5
        Set tProjObj = ##class(SpectraSight.Model.Project).%OpenId(tProjectId)
        Set tProjObj.SequenceCounter = tProjObj.SequenceCounter + 1
        Set tTicket3 = ##class(SpectraSight.Model.Task).%New()
        Set tTicket3.Title = "Seq Test 3"
        Set tTicket3.Project = tProjObj
        Set tTicket3.SequenceNumber = tProjObj.SequenceCounter
        Set tSC = tProjObj.%Save()
        LOCK -^SpectraSight.Model.ProjectD(tProjectId)
        Do $$$AssertStatusOK(tSC, "Project save for ticket 3 should succeed")
        Set tSC = tTicket3.%Save()
        Do $$$AssertStatusOK(tSC, "Ticket 3 should save")
        Set tIds(3) = tTicket3.%Id()

        // Verify sequential numbering
        Set tLoaded1 = ##class(SpectraSight.Model.Task).%OpenId(tIds(1))
        Set tLoaded2 = ##class(SpectraSight.Model.Task).%OpenId(tIds(2))
        Set tLoaded3 = ##class(SpectraSight.Model.Task).%OpenId(tIds(3))
        Do $$$AssertEquals(tLoaded1.SequenceNumber, 1, "First ticket should be SequenceNumber 1")
        Do $$$AssertEquals(tLoaded2.SequenceNumber, 2, "Second ticket should be SequenceNumber 2")
        Do $$$AssertEquals(tLoaded3.SequenceNumber, 3, "Third ticket should be SequenceNumber 3")

        // Verify display IDs
        Do $$$AssertEquals(##class(SpectraSight.Util.TicketID).Format(tIds(1)), "SQ-1", "First ticket display ID should be SQ-1")
        Do $$$AssertEquals(##class(SpectraSight.Util.TicketID).Format(tIds(2)), "SQ-2", "Second ticket display ID should be SQ-2")
        Do $$$AssertEquals(##class(SpectraSight.Util.TicketID).Format(tIds(3)), "SQ-3", "Third ticket display ID should be SQ-3")

        // Verify project counter is at 3
        Set tFinalProject = ##class(SpectraSight.Model.Project).%OpenId(tProjectId)
        Do $$$AssertEquals(tFinalProject.SequenceCounter, 3, "Project SequenceCounter should be 3")
    }
    Catch ex {
        Do $$$AssertTrue(0, "Unexpected exception: "_ex.DisplayString())
    }
    // Cleanup
    If tIds(1) '= "" Do ##class(SpectraSight.Model.Task).%DeleteId(tIds(1))
    If tIds(2) '= "" Do ##class(SpectraSight.Model.Task).%DeleteId(tIds(2))
    If tIds(3) '= "" Do ##class(SpectraSight.Model.Task).%DeleteId(tIds(3))
    If tProjectId '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tProjectId)
    Quit $$$OK
}

/// Test independent numbering across projects: 2 projects have separate counters (AC#7)
Method TestIndependentNumbering() As %Status
{
    Set tProj1Id = ""
    Set tProj2Id = ""
    Set tTicketIds = ""
    Try {
        // Create two projects
        Set tProj1 = ##class(SpectraSight.Model.Project).%New()
        Set tProj1.Name = "Project Alpha"
        Set tProj1.Prefix = "PA"
        Set tProj1.SequenceCounter = 0
        Set tSC = tProj1.%Save()
        Do $$$AssertStatusOK(tSC, "Project Alpha should save")
        Set tProj1Id = tProj1.%Id()

        Set tProj2 = ##class(SpectraSight.Model.Project).%New()
        Set tProj2.Name = "Project Beta"
        Set tProj2.Prefix = "PB"
        Set tProj2.SequenceCounter = 0
        Set tSC = tProj2.%Save()
        Do $$$AssertStatusOK(tSC, "Project Beta should save")
        Set tProj2Id = tProj2.%Id()

        // Create tickets alternating between projects: PA-1, PB-1, PA-2, PB-2
        Set tTicketCount = 0
        For tI = 1:1:4 {
            Set tTargetProjId = $SELECT(tI#2=1:tProj1Id, 1:tProj2Id)
            LOCK +^SpectraSight.Model.ProjectD(tTargetProjId):5
            Set tProjObj = ##class(SpectraSight.Model.Project).%OpenId(tTargetProjId)
            Set tProjObj.SequenceCounter = tProjObj.SequenceCounter + 1
            Set tTicket = ##class(SpectraSight.Model.Bug).%New()
            Set tTicket.Title = "Independent Test "_tI
            Set tTicket.Project = tProjObj
            Set tTicket.SequenceNumber = tProjObj.SequenceCounter
            Set tSC = tProjObj.%Save()
            LOCK -^SpectraSight.Model.ProjectD(tTargetProjId)
            Do $$$AssertStatusOK(tSC, "Project save for ticket "_tI_" should succeed")
            Set tSC = tTicket.%Save()
            Do $$$AssertStatusOK(tSC, "Ticket "_tI_" should save")
            Set tTicketCount = tTicketCount + 1
            Set tTicketIds(tTicketCount) = tTicket.%Id()
            Set tTicketSeqs(tTicketCount) = tTicket.SequenceNumber
            Set tTicketProjs(tTicketCount) = tTargetProjId
        }

        // Verify: PA tickets have seq 1,2 and PB tickets have seq 1,2
        // Ticket 1 -> PA, seq 1; Ticket 2 -> PB, seq 1; Ticket 3 -> PA, seq 2; Ticket 4 -> PB, seq 2
        Do $$$AssertEquals(tTicketSeqs(1), 1, "PA first ticket should be seq 1")
        Do $$$AssertEquals(tTicketSeqs(2), 1, "PB first ticket should be seq 1")
        Do $$$AssertEquals(tTicketSeqs(3), 2, "PA second ticket should be seq 2")
        Do $$$AssertEquals(tTicketSeqs(4), 2, "PB second ticket should be seq 2")

        // Verify display IDs
        Do $$$AssertEquals(##class(SpectraSight.Util.TicketID).Format(tTicketIds(1)), "PA-1", "First PA ticket should be PA-1")
        Do $$$AssertEquals(##class(SpectraSight.Util.TicketID).Format(tTicketIds(2)), "PB-1", "First PB ticket should be PB-1")
        Do $$$AssertEquals(##class(SpectraSight.Util.TicketID).Format(tTicketIds(3)), "PA-2", "Second PA ticket should be PA-2")
        Do $$$AssertEquals(##class(SpectraSight.Util.TicketID).Format(tTicketIds(4)), "PB-2", "Second PB ticket should be PB-2")

        // Verify each project counter
        Set tFinalProj1 = ##class(SpectraSight.Model.Project).%OpenId(tProj1Id)
        Set tFinalProj2 = ##class(SpectraSight.Model.Project).%OpenId(tProj2Id)
        Do $$$AssertEquals(tFinalProj1.SequenceCounter, 2, "PA SequenceCounter should be 2")
        Do $$$AssertEquals(tFinalProj2.SequenceCounter, 2, "PB SequenceCounter should be 2")

        // Verify Parse resolves correctly across projects
        Do $$$AssertEquals(##class(SpectraSight.Util.TicketID).Parse("PA-1"), +tTicketIds(1), "PA-1 should resolve to first PA ticket")
        Do $$$AssertEquals(##class(SpectraSight.Util.TicketID).Parse("PB-2"), +tTicketIds(4), "PB-2 should resolve to second PB ticket")
    }
    Catch ex {
        Do $$$AssertTrue(0, "Unexpected exception: "_ex.DisplayString())
    }
    // Cleanup
    For tI = 1:1:4 {
        If $GET(tTicketIds(tI)) '= "" Do ##class(SpectraSight.Model.Bug).%DeleteId(tTicketIds(tI))
    }
    If tProj1Id '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tProj1Id)
    If tProj2Id '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tProj2Id)
    Quit $$$OK
}

/// Test default project assignment: ticket without projectId gets SS project (AC#5)
Method TestDefaultProjectAssignment() As %Status
{
    Set tBugId = ""
    Try {
        // Ensure default project exists
        Do ..CleanupDefaultProject()
        Set tSC = ##class(SpectraSight.Util.Setup).EnsureDefaultProject()
        Do $$$AssertStatusOK(tSC, "EnsureDefaultProject should succeed")

        // Get the SS project ID
        Set tStmt = ##class(%SQL.Statement).%New()
        Set tSC = tStmt.%Prepare("SELECT ID, SequenceCounter FROM SpectraSight_Model.Project WHERE Prefix = 'SS'")
        Do $$$AssertStatusOK(tSC, "SQL prepare should succeed")
        Set tRes = tStmt.%Execute()
        Do $$$AssertTrue(tRes.%Next(), "SS project should exist")
        Set tSSProjectId = tRes.%Get("ID")
        Set tSSCounter = tRes.%Get("SequenceCounter")

        // Simulate CreateTicket without projectId (uses default SS project)
        LOCK +^SpectraSight.Model.ProjectD(tSSProjectId):5
        Set tProjObj = ##class(SpectraSight.Model.Project).%OpenId(tSSProjectId)
        Set tProjObj.SequenceCounter = tProjObj.SequenceCounter + 1
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "Default Project Test"
        Set tBug.Project = tProjObj
        Set tBug.SequenceNumber = tProjObj.SequenceCounter
        Set tSC = tProjObj.%Save()
        LOCK -^SpectraSight.Model.ProjectD(tSSProjectId)
        Do $$$AssertStatusOK(tSC, "Project save should succeed")
        Set tSC = tBug.%Save()
        Do $$$AssertStatusOK(tSC, "Bug should save")
        Set tBugId = tBug.%Id()

        // Verify the ticket is assigned to SS project
        Set tLoaded = ##class(SpectraSight.Model.Bug).%OpenId(tBugId)
        Do $$$AssertTrue(tLoaded.Project '= "", "Ticket should have a project")
        Do $$$AssertEquals(tLoaded.Project.Prefix, "SS", "Ticket should be assigned to SS project")
        Do $$$AssertEquals(tLoaded.SequenceNumber, tSSCounter + 1, "Ticket SequenceNumber should be counter + 1")

        // Verify display ID uses SS prefix
        Set tDisplayId = ##class(SpectraSight.Util.TicketID).Format(tBugId)
        Do $$$AssertEquals(tDisplayId, "SS-"_(tSSCounter + 1), "Display ID should use SS prefix")
    }
    Catch ex {
        Do $$$AssertTrue(0, "Unexpected exception: "_ex.DisplayString())
    }
    // Cleanup
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

/// Test full CRUD round-trip with project-scoped IDs (AC#4, Task 3)
Method TestCRUDRoundTripWithProjectIDs() As %Status
{
    Set tProjectId = ""
    Set tTicketId = ""
    Try {
        // Create a project
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = "CRUD Round Trip"
        Set tProject.Prefix = "CR"
        Set tProject.SequenceCounter = 0
        Set tSC = tProject.%Save()
        Do $$$AssertStatusOK(tSC, "Project should save")
        Set tProjectId = tProject.%Id()

        // Create a ticket with sequence number
        LOCK +^SpectraSight.Model.ProjectD(tProjectId):5
        Set tProjObj = ##class(SpectraSight.Model.Project).%OpenId(tProjectId)
        Set tProjObj.SequenceCounter = tProjObj.SequenceCounter + 1
        Set tTask = ##class(SpectraSight.Model.Task).%New()
        Set tTask.Title = "CRUD Test Task"
        Set tTask.Project = tProjObj
        Set tTask.SequenceNumber = tProjObj.SequenceCounter
        Set tSC = tProjObj.%Save()
        LOCK -^SpectraSight.Model.ProjectD(tProjectId)
        Do $$$AssertStatusOK(tSC, "Project save should succeed")
        Set tSC = tTask.%Save()
        Do $$$AssertStatusOK(tSC, "Task should save")
        Set tTicketId = tTask.%Id()

        // Get the display ID (should be "CR-1")
        Set tDisplayId = ##class(SpectraSight.Util.TicketID).Format(tTicketId)
        Do $$$AssertEquals(tDisplayId, "CR-1", "Display ID should be CR-1")

        // Parse the display ID back to internal ID (READ operation prep)
        Set tParsedId = ##class(SpectraSight.Util.TicketID).Parse(tDisplayId)
        Do $$$AssertEquals(tParsedId, +tTicketId, "Parse should resolve CR-1 to internal ID")

        // Simulate GET: open by parsed ID
        Set tLoaded = ##class(SpectraSight.Model.Task).%OpenId(tParsedId)
        Do $$$AssertTrue(tLoaded '= "", "GET: Ticket should be loadable via parsed ID")
        Do $$$AssertEquals(tLoaded.Title, "CRUD Test Task", "GET: Title should match")

        // Simulate UPDATE: modify title via parsed ID
        Set tLoaded.Title = "Updated CRUD Test Task"
        Set tSC = tLoaded.%Save()
        Do $$$AssertStatusOK(tSC, "UPDATE: Save should succeed")

        // Verify update persisted
        Set tReloaded = ##class(SpectraSight.Model.Task).%OpenId(tParsedId)
        Do $$$AssertEquals(tReloaded.Title, "Updated CRUD Test Task", "UPDATE: Title should be updated")
        // Display ID should remain unchanged
        Do $$$AssertEquals(##class(SpectraSight.Util.TicketID).Format(tParsedId), "CR-1", "UPDATE: Display ID should still be CR-1")

        // Simulate DELETE: delete by parsed ID
        Set tSC = ##class(SpectraSight.Model.Task).%DeleteId(tParsedId)
        Do $$$AssertStatusOK(tSC, "DELETE: Should succeed via parsed ID")
        Set tTicketId = ""

        // Verify deleted
        Set tGone = ##class(SpectraSight.Model.Task).%OpenId(tParsedId)
        Do $$$AssertTrue(tGone = "", "DELETE: Ticket should no longer exist")
    }
    Catch ex {
        Do $$$AssertTrue(0, "Unexpected exception: "_ex.DisplayString())
    }
    // Cleanup
    If tTicketId '= "" Do ##class(SpectraSight.Model.Task).%DeleteId(tTicketId)
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
