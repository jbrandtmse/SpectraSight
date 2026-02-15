Class SpectraSight.Test.TestActivity Extends %UnitTest.TestCase
{

Method TestCreateComment()
{
    // Create a ticket first (activity needs a ticket reference)
    Set tTicket = ##class(SpectraSight.Model.Bug).%New()
    Set tTicket.Title = "Test Bug for Comment"
    Set tSC = tTicket.%Save()
    Do $$$AssertStatusOK(tSC, "Ticket should save")
    Set tTicketId = tTicket.%Id()

    // Create comment
    Set tComment = ##class(SpectraSight.Model.Comment).%New()
    Set tComment.Ticket = tTicket
    Set tComment.ActorName = "TestUser"
    Set tComment.ActorType = "human"
    Set tComment.Body = "Test comment body"
    Set tSC = tComment.%Save()
    Do $$$AssertStatusOK(tSC, "Comment should save")

    // Verify by reloading
    Set tCommentId = tComment.%Id()
    Do $$$AssertTrue(tCommentId '= "", "Comment should have an ID")
    Kill tComment

    Set tLoaded = ##class(SpectraSight.Model.Comment).%OpenId(tCommentId)
    Do $$$AssertEquals(tLoaded.Body, "Test comment body", "Body should match")
    Do $$$AssertEquals(tLoaded.ActorName, "TestUser", "ActorName should match")
    Do $$$AssertEquals(tLoaded.ActorType, "human", "ActorType should match")

    // Cleanup
    Set tSC = ##class(SpectraSight.Model.Comment).%DeleteId(tCommentId)
    Do $$$AssertStatusOK(tSC, "Comment should delete")
    Set tSC = ##class(SpectraSight.Model.Bug).%DeleteId(tTicketId)
    Do $$$AssertStatusOK(tSC, "Ticket should delete")
}

Method TestCreateStatusChange()
{
    // Create a ticket
    Set tTicket = ##class(SpectraSight.Model.Bug).%New()
    Set tTicket.Title = "Test Bug for StatusChange"
    Set tSC = tTicket.%Save()
    Do $$$AssertStatusOK(tSC, "Ticket should save")
    Set tTicketId = tTicket.%Id()

    // Create status change
    Set tChange = ##class(SpectraSight.Model.StatusChange).%New()
    Set tChange.Ticket = tTicket
    Set tChange.ActorName = "AutoBot"
    Set tChange.ActorType = "agent"
    Set tChange.FromStatus = "Open"
    Set tChange.ToStatus = "In Progress"
    Set tSC = tChange.%Save()
    Do $$$AssertStatusOK(tSC, "StatusChange should save")

    // Verify
    Set tChangeId = tChange.%Id()
    Kill tChange
    Set tLoaded = ##class(SpectraSight.Model.StatusChange).%OpenId(tChangeId)
    Do $$$AssertEquals(tLoaded.FromStatus, "Open", "FromStatus should match")
    Do $$$AssertEquals(tLoaded.ToStatus, "In Progress", "ToStatus should match")
    Do $$$AssertEquals(tLoaded.ActorType, "agent", "ActorType should match")

    // Cleanup
    Set tSC = ##class(SpectraSight.Model.StatusChange).%DeleteId(tChangeId)
    Do $$$AssertStatusOK(tSC, "StatusChange should delete")
    Set tSC = ##class(SpectraSight.Model.Bug).%DeleteId(tTicketId)
    Do $$$AssertStatusOK(tSC, "Ticket should delete")
}

Method TestCreateAssignmentChange()
{
    // Create a ticket
    Set tTicket = ##class(SpectraSight.Model.Task).%New()
    Set tTicket.Title = "Test Task for AssignmentChange"
    Set tSC = tTicket.%Save()
    Do $$$AssertStatusOK(tSC, "Ticket should save")
    Set tTicketId = tTicket.%Id()

    // Create assignment change
    Set tChange = ##class(SpectraSight.Model.AssignmentChange).%New()
    Set tChange.Ticket = tTicket
    Set tChange.ActorName = "PM"
    Set tChange.ActorType = "human"
    Set tChange.FromAssignee = "Alice"
    Set tChange.ToAssignee = "Bob"
    Set tSC = tChange.%Save()
    Do $$$AssertStatusOK(tSC, "AssignmentChange should save")

    // Verify
    Set tChangeId = tChange.%Id()
    Kill tChange
    Set tLoaded = ##class(SpectraSight.Model.AssignmentChange).%OpenId(tChangeId)
    Do $$$AssertEquals(tLoaded.FromAssignee, "Alice", "FromAssignee should match")
    Do $$$AssertEquals(tLoaded.ToAssignee, "Bob", "ToAssignee should match")

    // Cleanup
    Set tSC = ##class(SpectraSight.Model.AssignmentChange).%DeleteId(tChangeId)
    Do $$$AssertStatusOK(tSC, "AssignmentChange should delete")
    Set tSC = ##class(SpectraSight.Model.Task).%DeleteId(tTicketId)
    Do $$$AssertStatusOK(tSC, "Ticket should delete")
}

Method TestCreateCodeReferenceChange()
{
    // Create a ticket
    Set tTicket = ##class(SpectraSight.Model.Story).%New()
    Set tTicket.Title = "Test Story for CodeReferenceChange"
    Set tSC = tTicket.%Save()
    Do $$$AssertStatusOK(tSC, "Ticket should save")
    Set tTicketId = tTicket.%Id()

    // Create code reference change
    Set tChange = ##class(SpectraSight.Model.CodeReferenceChange).%New()
    Set tChange.Ticket = tTicket
    Set tChange.ActorName = "DevAgent"
    Set tChange.ActorType = "agent"
    Set tChange.ClassName = "SpectraSight.Model.Ticket"
    Set tChange.MethodName = "OnBeforeSave"
    Set tChange.Action = "added"
    Set tSC = tChange.%Save()
    Do $$$AssertStatusOK(tSC, "CodeReferenceChange should save")

    // Verify
    Set tChangeId = tChange.%Id()
    Kill tChange
    Set tLoaded = ##class(SpectraSight.Model.CodeReferenceChange).%OpenId(tChangeId)
    Do $$$AssertEquals(tLoaded.ClassName, "SpectraSight.Model.Ticket", "ClassName should match")
    Do $$$AssertEquals(tLoaded.MethodName, "OnBeforeSave", "MethodName should match")
    Do $$$AssertEquals(tLoaded.Action, "added", "Action should match")

    // Cleanup
    Set tSC = ##class(SpectraSight.Model.CodeReferenceChange).%DeleteId(tChangeId)
    Do $$$AssertStatusOK(tSC, "CodeReferenceChange should delete")
    Set tSC = ##class(SpectraSight.Model.Story).%DeleteId(tTicketId)
    Do $$$AssertStatusOK(tSC, "Ticket should delete")
}

Method TestActivityTimestamp()
{
    // Create a ticket
    Set tTicket = ##class(SpectraSight.Model.Bug).%New()
    Set tTicket.Title = "Test Bug for Timestamp"
    Set tSC = tTicket.%Save()
    Do $$$AssertStatusOK(tSC, "Ticket should save")
    Set tTicketId = tTicket.%Id()

    // Create a comment and check timestamp is auto-set
    Set tComment = ##class(SpectraSight.Model.Comment).%New()
    Set tComment.Ticket = tTicket
    Set tComment.ActorName = "TimestampUser"
    Set tComment.ActorType = "human"
    Set tComment.Body = "Timestamp test"
    Do $$$AssertTrue(tComment.Timestamp '= "", "Timestamp should be auto-set on %New()")

    Set tSC = tComment.%Save()
    Do $$$AssertStatusOK(tSC, "Comment should save")

    // Verify timestamp persisted
    Set tCommentId = tComment.%Id()
    Kill tComment
    Set tLoaded = ##class(SpectraSight.Model.Comment).%OpenId(tCommentId)
    Do $$$AssertTrue(tLoaded.Timestamp '= "", "Timestamp should persist after save")

    // Cleanup
    Set tSC = ##class(SpectraSight.Model.Comment).%DeleteId(tCommentId)
    Do $$$AssertStatusOK(tSC, "Comment should delete")
    Set tSC = ##class(SpectraSight.Model.Bug).%DeleteId(tTicketId)
    Do $$$AssertStatusOK(tSC, "Ticket should delete")
}

Method TestActivityTicketReference()
{
    // Create a ticket
    Set tTicket = ##class(SpectraSight.Model.Bug).%New()
    Set tTicket.Title = "Test Bug for Activity Ref"
    Set tSC = tTicket.%Save()
    Do $$$AssertStatusOK(tSC, "Ticket should save")
    Set tTicketId = tTicket.%Id()

    // Create an activity referencing the ticket
    Set tComment = ##class(SpectraSight.Model.Comment).%New()
    Set tComment.Ticket = tTicket
    Set tComment.ActorName = "RefUser"
    Set tComment.ActorType = "human"
    Set tComment.Body = "Reference test"
    Set tSC = tComment.%Save()
    Do $$$AssertStatusOK(tSC, "Comment should save")

    // Verify the reference persists after reload
    Set tCommentId = tComment.%Id()
    Kill tComment
    Set tLoaded = ##class(SpectraSight.Model.Comment).%OpenId(tCommentId)
    Do $$$AssertTrue(tLoaded.Ticket '= "", "Ticket reference should not be empty")
    Do $$$AssertEquals(tLoaded.Ticket.%Id(), tTicketId, "Ticket ID should match")
    Do $$$AssertEquals(tLoaded.Ticket.Title, "Test Bug for Activity Ref", "Referenced ticket title should match")

    // Verify via SQL query on Activity extent
    Set tStatement = ##class(%SQL.Statement).%New()
    Set tSC = tStatement.%Prepare("SELECT ID FROM SpectraSight_Model.Activity WHERE Ticket = ?")
    Do $$$AssertStatusOK(tSC, "SQL prepare should succeed")
    Set tResult = tStatement.%Execute(tTicketId)
    Set tCount = 0
    While tResult.%Next() {
        Set tCount = tCount + 1
    }
    Do $$$AssertEquals(tCount, 1, "Should find 1 activity for the ticket")

    // Cleanup
    Set tSC = ##class(SpectraSight.Model.Comment).%DeleteId(tCommentId)
    Do $$$AssertStatusOK(tSC, "Comment should delete")
    Set tSC = ##class(SpectraSight.Model.Bug).%DeleteId(tTicketId)
    Do $$$AssertStatusOK(tSC, "Ticket should delete")
}

}
