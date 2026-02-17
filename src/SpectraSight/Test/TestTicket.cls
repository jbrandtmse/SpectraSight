Class SpectraSight.Test.TestTicket Extends %UnitTest.TestCase
{

Method TestCreateBug() As %Status
{
    Set tBug = ##class(SpectraSight.Model.Bug).%New()
    Set tBug.Title = "Test Bug"
    Set tBug.Severity = "High"
    Set tBug.StepsToReproduce = "Step 1: Do something"
    Set tBug.ExpectedBehavior = "Should work"
    Set tBug.ActualBehavior = "Does not work"
    Set tSC = tBug.%Save()
    Do $$$AssertStatusOK(tSC, "Bug should save successfully")

    Set tId = tBug.%Id()
    Do $$$AssertTrue(tId '= "", "Bug should have an ID after save")

    Set tLoaded = ##class(SpectraSight.Model.Bug).%OpenId(tId)
    Do $$$AssertEquals(tLoaded.Title, "Test Bug", "Title should match")
    Do $$$AssertEquals(tLoaded.Severity, "High", "Severity should match")

    Set tSC = ##class(SpectraSight.Model.Bug).%DeleteId(tId)
    Do $$$AssertStatusOK(tSC, "Bug should delete successfully")
    Quit $$$OK
}

Method TestCreateTask() As %Status
{
    Set tTask = ##class(SpectraSight.Model.Task).%New()
    Set tTask.Title = "Test Task"
    Set tTask.EstimatedHours = 8
    Set tTask.ActualHours = 4
    Set tSC = tTask.%Save()
    Do $$$AssertStatusOK(tSC, "Task should save successfully")

    Set tId = tTask.%Id()
    Do $$$AssertTrue(tId '= "", "Task should have an ID after save")

    Set tLoaded = ##class(SpectraSight.Model.Task).%OpenId(tId)
    Do $$$AssertEquals(tLoaded.Title, "Test Task", "Title should match")
    Do $$$AssertEquals(tLoaded.EstimatedHours, 8, "EstimatedHours should match")

    Set tSC = ##class(SpectraSight.Model.Task).%DeleteId(tId)
    Do $$$AssertStatusOK(tSC, "Task should delete successfully")
    Quit $$$OK
}

Method TestCreateStory() As %Status
{
    Set tStory = ##class(SpectraSight.Model.Story).%New()
    Set tStory.Title = "Test Story"
    Set tStory.AcceptanceCriteria = "Given/When/Then"
    Set tStory.StoryPoints = 5
    Set tSC = tStory.%Save()
    Do $$$AssertStatusOK(tSC, "Story should save successfully")

    Set tId = tStory.%Id()
    Do $$$AssertTrue(tId '= "", "Story should have an ID after save")

    Set tLoaded = ##class(SpectraSight.Model.Story).%OpenId(tId)
    Do $$$AssertEquals(tLoaded.Title, "Test Story", "Title should match")
    Do $$$AssertEquals(tLoaded.StoryPoints, 5, "StoryPoints should match")

    Set tSC = ##class(SpectraSight.Model.Story).%DeleteId(tId)
    Do $$$AssertStatusOK(tSC, "Story should delete successfully")
    Quit $$$OK
}

Method TestCreateEpic() As %Status
{
    Set tEpic = ##class(SpectraSight.Model.Epic).%New()
    Set tEpic.Title = "Test Epic"
    Set tEpic.StartDate = +$HOROLOG
    Set tEpic.TargetDate = +$HOROLOG + 30
    Set tSC = tEpic.%Save()
    Do $$$AssertStatusOK(tSC, "Epic should save successfully")

    Set tId = tEpic.%Id()
    Do $$$AssertTrue(tId '= "", "Epic should have an ID after save")

    Set tLoaded = ##class(SpectraSight.Model.Epic).%OpenId(tId)
    Do $$$AssertEquals(tLoaded.Title, "Test Epic", "Title should match")

    Set tSC = ##class(SpectraSight.Model.Epic).%DeleteId(tId)
    Do $$$AssertStatusOK(tSC, "Epic should delete successfully")
    Quit $$$OK
}

Method TestDefaultValues() As %Status
{
    Set tBug = ##class(SpectraSight.Model.Bug).%New()
    Set tBug.Title = "Default Test"
    Do $$$AssertEquals(tBug.Status, "Open", "Status should default to Open")
    Do $$$AssertTrue(tBug.CreatedAt '= "", "CreatedAt should be auto-set")
    Do $$$AssertTrue(tBug.UpdatedAt '= "", "UpdatedAt should be auto-set")

    Set tSC = tBug.%Save()
    Do $$$AssertStatusOK(tSC, "Bug should save")

    Set tId = tBug.%Id()
    Set tSC = ##class(SpectraSight.Model.Bug).%DeleteId(tId)
    Do $$$AssertStatusOK(tSC, "Cleanup should succeed")
    Quit $$$OK
}

Method TestUpdateTimestamp() As %Status
{
    Set tTask = ##class(SpectraSight.Model.Task).%New()
    Set tTask.Title = "Timestamp Test"
    Set tSC = tTask.%Save()
    Do $$$AssertStatusOK(tSC, "First save should succeed")

    Set tId = tTask.%Id()
    Kill tTask
    Set tTask1 = ##class(SpectraSight.Model.Task).%OpenId(tId)
    Set tFirstUpdate = tTask1.UpdatedAt
    Kill tTask1

    // Pause to ensure timestamp differs
    Hang 1.1

    Set tTask2 = ##class(SpectraSight.Model.Task).%OpenId(tId)
    Set tTask2.Title = "Timestamp Test Updated"
    Set tSC = tTask2.%Save()
    Do $$$AssertStatusOK(tSC, "Second save should succeed")
    Kill tTask2

    Set tTask3 = ##class(SpectraSight.Model.Task).%OpenId(tId)
    Do $$$AssertTrue(tTask3.UpdatedAt '= tFirstUpdate, "UpdatedAt should change after second save")

    Set tSC = ##class(SpectraSight.Model.Task).%DeleteId(tId)
    Do $$$AssertStatusOK(tSC, "Cleanup should succeed")
    Quit $$$OK
}

Method TestPolymorphicQuery() As %Status
{
    // Create one of each type
    Set tBug = ##class(SpectraSight.Model.Bug).%New()
    Set tBug.Title = "Poly Bug"
    Set tSC = tBug.%Save()
    Do $$$AssertStatusOK(tSC, "Bug save")
    Set tBugId = tBug.%Id()

    Set tTask = ##class(SpectraSight.Model.Task).%New()
    Set tTask.Title = "Poly Task"
    Set tSC = tTask.%Save()
    Do $$$AssertStatusOK(tSC, "Task save")
    Set tTaskId = tTask.%Id()

    Set tStory = ##class(SpectraSight.Model.Story).%New()
    Set tStory.Title = "Poly Story"
    Set tSC = tStory.%Save()
    Do $$$AssertStatusOK(tSC, "Story save")
    Set tStoryId = tStory.%Id()

    Set tEpic = ##class(SpectraSight.Model.Epic).%New()
    Set tEpic.Title = "Poly Epic"
    Set tSC = tEpic.%Save()
    Do $$$AssertStatusOK(tSC, "Epic save")
    Set tEpicId = tEpic.%Id()

    // Query base Ticket extent
    Set tStatement = ##class(%SQL.Statement).%New()
    Set tSC = tStatement.%Prepare("SELECT ID FROM SpectraSight_Model.Ticket WHERE Title LIKE 'Poly %'")
    Do $$$AssertStatusOK(tSC, "SQL prepare should succeed")

    Set tResult = tStatement.%Execute()
    Set tCount = 0
    While tResult.%Next() {
        Set tCount = tCount + 1
    }
    Do $$$AssertEquals(tCount, 4, "Polymorphic query should return 4 rows")

    // Cleanup
    Do ##class(SpectraSight.Model.Bug).%DeleteId(tBugId)
    Do ##class(SpectraSight.Model.Task).%DeleteId(tTaskId)
    Do ##class(SpectraSight.Model.Story).%DeleteId(tStoryId)
    Do ##class(SpectraSight.Model.Epic).%DeleteId(tEpicId)
    Quit $$$OK
}

Method TestPolymorphicFilterByStatus() As %Status
{
    // Create tickets with different statuses
    Set tBug = ##class(SpectraSight.Model.Bug).%New()
    Set tBug.Title = "Filter Open Bug"
    Set tSC = tBug.%Save()
    Do $$$AssertStatusOK(tSC, "Bug save")
    Set tBugId = tBug.%Id()

    Set tTask = ##class(SpectraSight.Model.Task).%New()
    Set tTask.Title = "Filter InProgress Task"
    Set tTask.Status = "In Progress"
    Set tSC = tTask.%Save()
    Do $$$AssertStatusOK(tSC, "Task save")
    Set tTaskId = tTask.%Id()

    Set tStory = ##class(SpectraSight.Model.Story).%New()
    Set tStory.Title = "Filter Open Story"
    Set tSC = tStory.%Save()
    Do $$$AssertStatusOK(tSC, "Story save")
    Set tStoryId = tStory.%Id()

    // Query only Open tickets
    Set tStatement = ##class(%SQL.Statement).%New()
    Set tSC = tStatement.%Prepare("SELECT ID FROM SpectraSight_Model.Ticket WHERE Status = 'Open' AND Title LIKE 'Filter %'")
    Do $$$AssertStatusOK(tSC, "SQL prepare should succeed")

    Set tResult = tStatement.%Execute()
    Set tCount = 0
    While tResult.%Next() {
        Set tCount = tCount + 1
    }
    Do $$$AssertEquals(tCount, 2, "Filter should return 2 Open tickets")

    // Cleanup
    Do ##class(SpectraSight.Model.Bug).%DeleteId(tBugId)
    Do ##class(SpectraSight.Model.Task).%DeleteId(tTaskId)
    Do ##class(SpectraSight.Model.Story).%DeleteId(tStoryId)
    Quit $$$OK
}

}
