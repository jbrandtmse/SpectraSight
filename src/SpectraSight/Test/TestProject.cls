Class SpectraSight.Test.TestProject Extends %UnitTest.TestCase
{

Method TestProjectCreate() As %Status
{
    Set tProject = ##class(SpectraSight.Model.Project).%New()
    Set tProject.Name = "Test Project"
    Set tProject.Prefix = "TP"
    Set tProject.Owner = "TestOwner"
    Set tSC = tProject.%Save()
    Do $$$AssertStatusOK(tSC, "Project should save successfully")

    Set tId = tProject.%Id()
    Do $$$AssertTrue(tId '= "", "Project should have an ID after save")

    Set tLoaded = ##class(SpectraSight.Model.Project).%OpenId(tId)
    Do $$$AssertEquals(tLoaded.Name, "Test Project", "Name should match")
    Do $$$AssertEquals(tLoaded.Prefix, "TP", "Prefix should match")
    Do $$$AssertEquals(tLoaded.Owner, "TestOwner", "Owner should match")
    Do $$$AssertTrue(tLoaded.CreatedAt '= "", "CreatedAt should be set")
    Do $$$AssertTrue(tLoaded.UpdatedAt '= "", "UpdatedAt should be set")

    Do ##class(SpectraSight.Model.Project).%DeleteId(tId)
    Quit $$$OK
}

Method TestProjectPrefixUnique() As %Status
{
    Set tProject1 = ##class(SpectraSight.Model.Project).%New()
    Set tProject1.Name = "First Project"
    Set tProject1.Prefix = "UQ"
    Set tSC = tProject1.%Save()
    Do $$$AssertStatusOK(tSC, "First project should save successfully")
    Set tId1 = tProject1.%Id()

    Set tProject2 = ##class(SpectraSight.Model.Project).%New()
    Set tProject2.Name = "Second Project"
    Set tProject2.Prefix = "UQ"
    Set tSC2 = tProject2.%Save()
    Do $$$AssertTrue($$$ISERR(tSC2), "Second project with same prefix should fail")

    Do ##class(SpectraSight.Model.Project).%DeleteId(tId1)
    Quit $$$OK
}

Method TestProjectDefaults() As %Status
{
    Set tProject = ##class(SpectraSight.Model.Project).%New()
    Set tProject.Name = "Defaults Test"
    Set tProject.Prefix = "DT"
    Do $$$AssertEquals(tProject.SequenceCounter, 0, "SequenceCounter should default to 0")

    Set tSC = tProject.%Save()
    Do $$$AssertStatusOK(tSC, "Project should save")

    Set tId = tProject.%Id()
    Set tLoaded = ##class(SpectraSight.Model.Project).%OpenId(tId)
    Do $$$AssertEquals(tLoaded.SequenceCounter, 0, "Loaded SequenceCounter should be 0")

    Do ##class(SpectraSight.Model.Project).%DeleteId(tId)
    Quit $$$OK
}

Method TestDefaultProjectSetup() As %Status
{
    // Clean up any existing SS project first
    Do ..CleanupDefaultProject()

    Set tSC = ##class(SpectraSight.Util.Setup).EnsureDefaultProject()
    Do $$$AssertStatusOK(tSC, "EnsureDefaultProject should succeed")

    // Verify project exists
    Set tStmt = ##class(%SQL.Statement).%New()
    Set tSC = tStmt.%Prepare("SELECT ID, Name, Prefix, SequenceCounter FROM SpectraSight_Model.Project WHERE Prefix = 'SS'")
    Do $$$AssertStatusOK(tSC, "SQL prepare should succeed")
    Set tRes = tStmt.%Execute()
    Do $$$AssertTrue(tRes.%Next(), "Default project should exist")
    Do $$$AssertEquals(tRes.%Get("Name"), "SpectraSight", "Name should be SpectraSight")
    Do $$$AssertEquals(tRes.%Get("Prefix"), "SS", "Prefix should be SS")

    // Cleanup
    Do ..CleanupDefaultProject()
    Quit $$$OK
}

Method TestDefaultProjectIdempotent() As %Status
{
    // Clean up any existing SS project first
    Do ..CleanupDefaultProject()

    // Call twice
    Set tSC = ##class(SpectraSight.Util.Setup).EnsureDefaultProject()
    Do $$$AssertStatusOK(tSC, "First call should succeed")

    Set tSC = ##class(SpectraSight.Util.Setup).EnsureDefaultProject()
    Do $$$AssertStatusOK(tSC, "Second call should succeed")

    // Count projects with prefix SS
    Set tStmt = ##class(%SQL.Statement).%New()
    Set tSC = tStmt.%Prepare("SELECT COUNT(*) AS cnt FROM SpectraSight_Model.Project WHERE Prefix = 'SS'")
    Do $$$AssertStatusOK(tSC, "SQL prepare should succeed")
    Set tRes = tStmt.%Execute()
    Do $$$AssertTrue(tRes.%Next(), "Query should return results")
    Do $$$AssertEquals(tRes.%Get("cnt"), 1, "Should have exactly one SS project")

    // Cleanup
    Do ..CleanupDefaultProject()
    Quit $$$OK
}

Method TestTicketProjectReference() As %Status
{
    // Create a project
    Set tProject = ##class(SpectraSight.Model.Project).%New()
    Set tProject.Name = "Ref Test Project"
    Set tProject.Prefix = "RT"
    Set tSC = tProject.%Save()
    Do $$$AssertStatusOK(tSC, "Project should save")
    Set tProjectId = tProject.%Id()

    // Create a ticket with project reference
    Set tBug = ##class(SpectraSight.Model.Bug).%New()
    Set tBug.Title = "Project Ref Test Bug"
    Set tBug.Project = tProject
    Set tBug.SequenceNumber = 1
    Set tSC = tBug.%Save()
    Do $$$AssertStatusOK(tSC, "Bug with project ref should save")
    Set tBugId = tBug.%Id()

    // Reload and verify
    Set tLoaded = ##class(SpectraSight.Model.Bug).%OpenId(tBugId)
    Do $$$AssertTrue(tLoaded.Project '= "", "Project reference should be set")
    Do $$$AssertEquals(tLoaded.Project.%Id(), tProjectId, "Project ID should match")
    Do $$$AssertEquals(tLoaded.Project.Prefix, "RT", "Project prefix should match")
    Do $$$AssertEquals(tLoaded.SequenceNumber, 1, "SequenceNumber should match")

    // Cleanup
    Do ##class(SpectraSight.Model.Bug).%DeleteId(tBugId)
    Do ##class(SpectraSight.Model.Project).%DeleteId(tProjectId)
    Quit $$$OK
}

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
