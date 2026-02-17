Class SpectraSight.Test.TestCodeReference Extends %UnitTest.TestCase
{

Method TestCreateCodeReference() As %Status
{
    // Create a ticket
    Set tTicket = ##class(SpectraSight.Model.Bug).%New()
    Set tTicket.Title = "Test Bug for CodeRef"
    Set tSC = tTicket.%Save()
    Do $$$AssertStatusOK(tSC, "Ticket should save")
    Set tTicketId = tTicket.%Id()

    // Create code reference
    Set tRef = ##class(SpectraSight.Model.CodeReference).%New()
    Set tRef.Ticket = tTicket
    Set tRef.ClassName = "SpectraSight.Model.Ticket"
    Set tRef.MethodName = "OnBeforeSave"
    Set tRef.AddedBy = "TestDev"
    Set tSC = tRef.%Save()
    Do $$$AssertStatusOK(tSC, "CodeReference should save")

    // Verify
    Set tRefId = tRef.%Id()
    Do $$$AssertTrue(tRefId '= "", "CodeReference should have an ID")
    Kill tRef

    Set tLoaded = ##class(SpectraSight.Model.CodeReference).%OpenId(tRefId)
    Do $$$AssertEquals(tLoaded.ClassName, "SpectraSight.Model.Ticket", "ClassName should match")
    Do $$$AssertEquals(tLoaded.MethodName, "OnBeforeSave", "MethodName should match")
    Do $$$AssertEquals(tLoaded.AddedBy, "TestDev", "AddedBy should match")
    Do $$$AssertEquals(tLoaded.Ticket.%Id(), tTicketId, "Ticket reference should match")

    // Cleanup
    Set tSC = ##class(SpectraSight.Model.CodeReference).%DeleteId(tRefId)
    Do $$$AssertStatusOK(tSC, "CodeReference should delete")
    Set tSC = ##class(SpectraSight.Model.Bug).%DeleteId(tTicketId)
    Do $$$AssertStatusOK(tSC, "Ticket should delete")
    Quit $$$OK
}

Method TestCodeReferenceOptionalMethod() As %Status
{
    // Create a ticket
    Set tTicket = ##class(SpectraSight.Model.Task).%New()
    Set tTicket.Title = "Test Task for CodeRef NoMethod"
    Set tSC = tTicket.%Save()
    Do $$$AssertStatusOK(tSC, "Ticket should save")
    Set tTicketId = tTicket.%Id()

    // Create code reference with no MethodName
    Set tRef = ##class(SpectraSight.Model.CodeReference).%New()
    Set tRef.Ticket = tTicket
    Set tRef.ClassName = "SpectraSight.Model.Activity"
    // Deliberately not setting MethodName
    Set tSC = tRef.%Save()
    Do $$$AssertStatusOK(tSC, "CodeReference should save without MethodName")

    // Verify MethodName is empty
    Set tRefId = tRef.%Id()
    Kill tRef
    Set tLoaded = ##class(SpectraSight.Model.CodeReference).%OpenId(tRefId)
    Do $$$AssertEquals(tLoaded.ClassName, "SpectraSight.Model.Activity", "ClassName should match")
    Do $$$AssertEquals(tLoaded.MethodName, "", "MethodName should be empty")

    // Cleanup
    Set tSC = ##class(SpectraSight.Model.CodeReference).%DeleteId(tRefId)
    Do $$$AssertStatusOK(tSC, "CodeReference should delete")
    Set tSC = ##class(SpectraSight.Model.Task).%DeleteId(tTicketId)
    Do $$$AssertStatusOK(tSC, "Ticket should delete")
    Quit $$$OK
}

Method TestCodeReferenceTimestamp() As %Status
{
    // Create a ticket
    Set tTicket = ##class(SpectraSight.Model.Bug).%New()
    Set tTicket.Title = "Test Bug for CodeRef Timestamp"
    Set tSC = tTicket.%Save()
    Do $$$AssertStatusOK(tSC, "Ticket should save")
    Set tTicketId = tTicket.%Id()

    // Create code reference and verify auto-timestamp
    Set tRef = ##class(SpectraSight.Model.CodeReference).%New()
    Set tRef.Ticket = tTicket
    Set tRef.ClassName = "SpectraSight.Model.Bug"
    Do $$$AssertTrue(tRef.Timestamp '= "", "Timestamp should be auto-set on %New()")

    Set tSC = tRef.%Save()
    Do $$$AssertStatusOK(tSC, "CodeReference should save")

    // Verify timestamp persisted
    Set tRefId = tRef.%Id()
    Kill tRef
    Set tLoaded = ##class(SpectraSight.Model.CodeReference).%OpenId(tRefId)
    Do $$$AssertTrue(tLoaded.Timestamp '= "", "Timestamp should persist after save")

    // Cleanup
    Set tSC = ##class(SpectraSight.Model.CodeReference).%DeleteId(tRefId)
    Do $$$AssertStatusOK(tSC, "CodeReference should delete")
    Set tSC = ##class(SpectraSight.Model.Bug).%DeleteId(tTicketId)
    Do $$$AssertStatusOK(tSC, "Ticket should delete")
    Quit $$$OK
}

Method TestMultipleReferencesPerTicket() As %Status
{
    // Create a ticket
    Set tTicket = ##class(SpectraSight.Model.Story).%New()
    Set tTicket.Title = "Test Story for Multiple CodeRefs"
    Set tSC = tTicket.%Save()
    Do $$$AssertStatusOK(tSC, "Ticket should save")
    Set tTicketId = tTicket.%Id()

    // Create 3 code references for the same ticket
    Set tRef1 = ##class(SpectraSight.Model.CodeReference).%New()
    Set tRef1.Ticket = tTicket
    Set tRef1.ClassName = "SpectraSight.Model.Ticket"
    Set tRef1.MethodName = "OnNew"
    Set tSC = tRef1.%Save()
    Do $$$AssertStatusOK(tSC, "First CodeReference should save")
    Set tRefId1 = tRef1.%Id()

    Set tRef2 = ##class(SpectraSight.Model.CodeReference).%New()
    Set tRef2.Ticket = tTicket
    Set tRef2.ClassName = "SpectraSight.Model.Ticket"
    Set tRef2.MethodName = "OnBeforeSave"
    Set tSC = tRef2.%Save()
    Do $$$AssertStatusOK(tSC, "Second CodeReference should save")
    Set tRefId2 = tRef2.%Id()

    Set tRef3 = ##class(SpectraSight.Model.CodeReference).%New()
    Set tRef3.Ticket = tTicket
    Set tRef3.ClassName = "SpectraSight.Model.Activity"
    Set tSC = tRef3.%Save()
    Do $$$AssertStatusOK(tSC, "Third CodeReference should save")
    Set tRefId3 = tRef3.%Id()

    // Verify all 3 references exist for this ticket via SQL
    Set tStatement = ##class(%SQL.Statement).%New()
    Set tSC = tStatement.%Prepare("SELECT ID FROM SpectraSight_Model.CodeReference WHERE Ticket = ?")
    Do $$$AssertStatusOK(tSC, "SQL prepare should succeed")
    Set tResult = tStatement.%Execute(tTicketId)
    Set tCount = 0
    While tResult.%Next() {
        Set tCount = tCount + 1
    }
    Do $$$AssertEquals(tCount, 3, "Should find 3 code references for the ticket")

    // Cleanup
    Set tSC = ##class(SpectraSight.Model.CodeReference).%DeleteId(tRefId1)
    Do $$$AssertStatusOK(tSC, "First CodeReference should delete")
    Set tSC = ##class(SpectraSight.Model.CodeReference).%DeleteId(tRefId2)
    Do $$$AssertStatusOK(tSC, "Second CodeReference should delete")
    Set tSC = ##class(SpectraSight.Model.CodeReference).%DeleteId(tRefId3)
    Do $$$AssertStatusOK(tSC, "Third CodeReference should delete")
    Set tSC = ##class(SpectraSight.Model.Story).%DeleteId(tTicketId)
    Do $$$AssertStatusOK(tSC, "Ticket should delete")
    Quit $$$OK
}

}
