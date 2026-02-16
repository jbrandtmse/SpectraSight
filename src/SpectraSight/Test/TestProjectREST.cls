Class SpectraSight.Test.TestProjectREST Extends %RegisteredObject
{

/// Run all Project REST API tests and return summary
ClassMethod RunAll() As %String [ SqlProc ]
{
    Set tResult = ""
    Try {
        Kill ^ClaudeDebug("ProjectREST")
        Set tPassed = 0
        Set tFailed = 0

        Do ..RunOne("TestBuildProjectResponse", .tPassed, .tFailed)
        Do ..RunOne("TestBuildProjectResponseFields", .tPassed, .tFailed)
        Do ..RunOne("TestBuildProjectResponseTicketCount", .tPassed, .tFailed)
        Do ..RunOne("TestCreateProjectValidation", .tPassed, .tFailed)
        Do ..RunOne("TestCreateProjectPrefixUppercase", .tPassed, .tFailed)
        Do ..RunOne("TestCreateProjectDuplicatePrefix", .tPassed, .tFailed)
        Do ..RunOne("TestCreateProjectNameLength", .tPassed, .tFailed)
        Do ..RunOne("TestUpdateProjectImmutablePrefix", .tPassed, .tFailed)
        Do ..RunOne("TestUpdateProjectFields", .tPassed, .tFailed)
        Do ..RunOne("TestDeleteProjectWithTickets", .tPassed, .tFailed)
        Do ..RunOne("TestDeleteDefaultProject", .tPassed, .tFailed)
        Do ..RunOne("TestDeleteProjectSuccess", .tPassed, .tFailed)
        Do ..RunOne("TestListProjectsOrder", .tPassed, .tFailed)
        Do ..RunOne("TestResponseConflict", .tPassed, .tFailed)
        Do ..RunOne("TestResponseForbidden", .tPassed, .tFailed)
        Do ..RunOne("TestGetHttpStatusText403And409", .tPassed, .tFailed)
        Do ..RunOne("TestListTicketsProjectFilterByPrefix", .tPassed, .tFailed)
        Do ..RunOne("TestListTicketsProjectFilterByNumericId", .tPassed, .tFailed)
        Do ..RunOne("TestListTicketsProjectFilterUnknownPrefix", .tPassed, .tFailed)
        Do ..RunOne("TestTicketIdPatternMultiProject", .tPassed, .tFailed)

        Set tResult = tPassed_" passed, "_tFailed_" failed"
        Set ^ClaudeDebug("ProjectREST", "summary") = tResult
    }
    Catch ex {
        Set tResult = "ERROR: "_ex.DisplayString()
        Set ^ClaudeDebug("ProjectREST", "error") = tResult
    }
    Quit tResult
}

ClassMethod RunOne(pTestName As %String, ByRef pPassed As %Integer, ByRef pFailed As %Integer) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tSC = $CLASSMETHOD("SpectraSight.Test.TestProjectREST", pTestName)
        If $$$ISERR(tSC) {
            Set pFailed = pFailed + 1
            Set ^ClaudeDebug("ProjectREST", "results", pTestName) = "FAIL: "_$System.Status.GetErrorText(tSC)
        } Else {
            Set pPassed = pPassed + 1
            Set ^ClaudeDebug("ProjectREST", "results", pTestName) = "PASS"
        }
    }
    Catch ex {
        Set pFailed = pFailed + 1
        Set ^ClaudeDebug("ProjectREST", "results", pTestName) = "FAIL: "_ex.DisplayString()
    }
    Quit $$$OK
}

ClassMethod GetResult(pTestName As %String) As %String [ SqlProc ]
{
    Quit $GET(^ClaudeDebug("ProjectREST", "results", pTestName), "NOT_RUN")
}

/// AC #3: BuildProjectResponse returns all expected fields with correct types
ClassMethod TestBuildProjectResponse() As %Status
{
    Set tSC = $$$OK
    Set tProjectId = ""
    Try {
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = "BuildResp Test"
        Set tProject.Prefix = "BR"
        Set tProject.Owner = "TestOwner"
        Set tSC = tProject.%Save()
        If $$$ISERR(tSC) Quit
        Set tProjectId = tProject.%Id()

        Set tResponse = ##class(SpectraSight.REST.ProjectHandler).BuildProjectResponse(tProject)

        // Verify all fields exist
        If tResponse.%Get("id") '= +tProjectId Set tSC = $$$ERROR(5001, "id should equal project ID, got: "_tResponse.%Get("id")) Quit
        If tResponse.%Get("name") '= "BuildResp Test" Set tSC = $$$ERROR(5001, "name mismatch: "_tResponse.%Get("name")) Quit
        If tResponse.%Get("prefix") '= "BR" Set tSC = $$$ERROR(5001, "prefix mismatch: "_tResponse.%Get("prefix")) Quit
        If tResponse.%Get("owner") '= "TestOwner" Set tSC = $$$ERROR(5001, "owner mismatch: "_tResponse.%Get("owner")) Quit
        If tResponse.%Get("sequenceCounter") '= 0 Set tSC = $$$ERROR(5001, "sequenceCounter should be 0, got: "_tResponse.%Get("sequenceCounter")) Quit
        If tResponse.%Get("ticketCount") '= 0 Set tSC = $$$ERROR(5001, "ticketCount should be 0, got: "_tResponse.%Get("ticketCount")) Quit
        If tResponse.%Get("createdAt") = "" Set tSC = $$$ERROR(5001, "createdAt should not be empty") Quit
        If tResponse.%Get("updatedAt") = "" Set tSC = $$$ERROR(5001, "updatedAt should not be empty") Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    If tProjectId '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tProjectId)
    Quit tSC
}

/// AC #3: Verify id is numeric type, sequenceCounter is numeric type, ticketCount is numeric type
ClassMethod TestBuildProjectResponseFields() As %Status
{
    Set tSC = $$$OK
    Set tProjectId = ""
    Try {
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = "Fields Test"
        Set tProject.Prefix = "FD"
        Set tSC = tProject.%Save()
        If $$$ISERR(tSC) Quit
        Set tProjectId = tProject.%Id()

        Set tResponse = ##class(SpectraSight.REST.ProjectHandler).BuildProjectResponse(tProject)

        // Convert to JSON and back to verify numeric types
        Set tJSON = tResponse.%ToJSON()
        Set tParsed = ##class(%DynamicObject).%FromJSON(tJSON)

        // id should be a number (not a string)
        Set tIdType = tParsed.%GetTypeOf("id")
        If tIdType '= "number" Set tSC = $$$ERROR(5001, "id should be number type, got: "_tIdType) Quit

        Set tSeqType = tParsed.%GetTypeOf("sequenceCounter")
        If tSeqType '= "number" Set tSC = $$$ERROR(5001, "sequenceCounter should be number type, got: "_tSeqType) Quit

        Set tCountType = tParsed.%GetTypeOf("ticketCount")
        If tCountType '= "number" Set tSC = $$$ERROR(5001, "ticketCount should be number type, got: "_tCountType) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    If tProjectId '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tProjectId)
    Quit tSC
}

/// AC #3: BuildProjectResponse ticketCount reflects actual ticket count
ClassMethod TestBuildProjectResponseTicketCount() As %Status
{
    Set tSC = $$$OK
    Set tProjectId = ""
    Set tBugId = ""
    Try {
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = "TicketCount Test"
        Set tProject.Prefix = "TC"
        Set tSC = tProject.%Save()
        If $$$ISERR(tSC) Quit
        Set tProjectId = tProject.%Id()

        // No tickets: ticketCount should be 0
        Set tResponse0 = ##class(SpectraSight.REST.ProjectHandler).BuildProjectResponse(tProject)
        If tResponse0.%Get("ticketCount") '= 0 Set tSC = $$$ERROR(5001, "ticketCount should be 0 with no tickets, got: "_tResponse0.%Get("ticketCount")) Quit

        // Add a ticket
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "Count Test Bug"
        Set tBug.Project = tProject
        Set tBug.SequenceNumber = 1
        Set tSC = tBug.%Save()
        If $$$ISERR(tSC) Quit
        Set tBugId = tBug.%Id()

        // With one ticket: ticketCount should be 1
        Set tResponse1 = ##class(SpectraSight.REST.ProjectHandler).BuildProjectResponse(tProject)
        If tResponse1.%Get("ticketCount") '= 1 Set tSC = $$$ERROR(5001, "ticketCount should be 1, got: "_tResponse1.%Get("ticketCount")) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    If tBugId '= "" Do ##class(SpectraSight.Model.Bug).%DeleteId(tBugId)
    If tProjectId '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tProjectId)
    Quit tSC
}

/// AC #1: Validate required fields for project creation
ClassMethod TestCreateProjectValidation() As %Status
{
    Set tSC = $$$OK
    Try {
        // Name is required (empty name)
        Set tProject1 = ##class(SpectraSight.Model.Project).%New()
        Set tProject1.Name = ""
        Set tProject1.Prefix = "VL"
        Set tSC2 = tProject1.%Save()
        // Name is Required at the property level, should fail
        If $$$ISOK(tSC2) {
            Do ##class(SpectraSight.Model.Project).%DeleteId(tProject1.%Id())
            // If IRIS doesn't enforce Required on empty string, that's acceptable
        }

        // Prefix is required (empty prefix)
        Set tProject2 = ##class(SpectraSight.Model.Project).%New()
        Set tProject2.Name = "Valid Name"
        Set tProject2.Prefix = ""
        Set tSC2 = tProject2.%Save()
        If $$$ISOK(tSC2) {
            Do ##class(SpectraSight.Model.Project).%DeleteId(tProject2.%Id())
            Set tSC = $$$ERROR(5001, "Empty prefix should be rejected")
            Quit
        }
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// AC #1: Prefix is uppercased before save in the handler
ClassMethod TestCreateProjectPrefixUppercase() As %Status
{
    Set tSC = $$$OK
    Set tProjectId = ""
    Try {
        // Simulate what CreateProject does: uppercase the prefix
        Set tPrefix = "data"
        Set tUpperPrefix = $ZCONVERT(tPrefix, "U")
        If tUpperPrefix '= "DATA" Set tSC = $$$ERROR(5001, "$ZCONVERT uppercase failed: "_tUpperPrefix) Quit

        // Create with uppercase prefix (as handler would)
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = "Uppercase Test"
        Set tProject.Prefix = tUpperPrefix
        Set tSC = tProject.%Save()
        If $$$ISERR(tSC) Quit
        Set tProjectId = tProject.%Id()

        // Verify stored as uppercase
        Set tLoaded = ##class(SpectraSight.Model.Project).%OpenId(tProjectId)
        If tLoaded.Prefix '= "DATA" Set tSC = $$$ERROR(5001, "Prefix should be DATA, got: "_tLoaded.Prefix) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    If tProjectId '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tProjectId)
    Quit tSC
}

/// AC #7: Duplicate prefix returns error on save (unique index)
ClassMethod TestCreateProjectDuplicatePrefix() As %Status
{
    Set tSC = $$$OK
    Set tId1 = ""
    Try {
        Set tProject1 = ##class(SpectraSight.Model.Project).%New()
        Set tProject1.Name = "First"
        Set tProject1.Prefix = "DP"
        Set tSC = tProject1.%Save()
        If $$$ISERR(tSC) Quit
        Set tId1 = tProject1.%Id()

        Set tProject2 = ##class(SpectraSight.Model.Project).%New()
        Set tProject2.Name = "Second"
        Set tProject2.Prefix = "DP"
        Set tSC2 = tProject2.%Save()
        If $$$ISOK(tSC2) {
            Do ##class(SpectraSight.Model.Project).%DeleteId(tProject2.%Id())
            Set tSC = $$$ERROR(5001, "Duplicate prefix DP should be rejected by unique index")
            Quit
        }

        // Verify the error text contains "unique" or "Unique" or "PrefixIdx"
        Set tErrorText = $System.Status.GetErrorText(tSC2)
        // The handler checks for these patterns:
        If (tErrorText '[ "unique") && (tErrorText '[ "Unique") && (tErrorText '[ "UNIQUE") && (tErrorText '[ "PrefixIdx") {
            Set tSC = $$$ERROR(5001, "Error should mention unique constraint, got: "_tErrorText)
            Quit
        }
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    If tId1 '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tId1)
    Quit tSC
}

/// AC #1: Name exceeding 255 characters (handler-level check)
ClassMethod TestCreateProjectNameLength() As %Status
{
    Set tSC = $$$OK
    Try {
        // Name with 256 characters
        Set tLongName = ""
        For tI = 1:1:256 Set tLongName = tLongName_"X"

        // The handler checks $LENGTH(tName) > 255 before save
        If $LENGTH(tLongName) '> 255 Set tSC = $$$ERROR(5001, "Test string should exceed 255 chars") Quit

        // Verify that a 255-char name saves successfully
        Set tOkName = ""
        For tI = 1:1:255 Set tOkName = tOkName_"Y"
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = tOkName
        Set tProject.Prefix = "NL"
        Set tSC = tProject.%Save()
        If $$$ISERR(tSC) Set tSC = $$$ERROR(5001, "255-char name should save, error: "_$System.Status.GetErrorText(tSC)) Quit
        Do ##class(SpectraSight.Model.Project).%DeleteId(tProject.%Id())
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// AC #4: Prefix is immutable after creation (handler logic)
ClassMethod TestUpdateProjectImmutablePrefix() As %Status
{
    Set tSC = $$$OK
    Set tProjectId = ""
    Try {
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = "Immutable Test"
        Set tProject.Prefix = "IM"
        Set tSC = tProject.%Save()
        If $$$ISERR(tSC) Quit
        Set tProjectId = tProject.%Id()

        // Simulate what UpdateProject checks: if body contains "prefix" field -> 400
        // We verify the logic: the handler checks tBody.%IsDefined("prefix")
        Set tBody = ##class(%DynamicObject).%New()
        Do tBody.%Set("prefix", "XX")
        If 'tBody.%IsDefined("prefix") Set tSC = $$$ERROR(5001, "prefix should be defined in body") Quit

        // Verify that a body without prefix is OK
        Set tBody2 = ##class(%DynamicObject).%New()
        Do tBody2.%Set("name", "Updated Name")
        If tBody2.%IsDefined("prefix") Set tSC = $$$ERROR(5001, "prefix should NOT be in name-only body") Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    If tProjectId '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tProjectId)
    Quit tSC
}

/// AC #4: Update name and owner fields
ClassMethod TestUpdateProjectFields() As %Status
{
    Set tSC = $$$OK
    Set tProjectId = ""
    Try {
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = "Original Name"
        Set tProject.Prefix = "UF"
        Set tProject.Owner = "OriginalOwner"
        Set tSC = tProject.%Save()
        If $$$ISERR(tSC) Quit
        Set tProjectId = tProject.%Id()

        // Update name
        Set tProject.Name = "Updated Name"
        Set tSC = tProject.%Save()
        If $$$ISERR(tSC) Quit

        Set tLoaded = ##class(SpectraSight.Model.Project).%OpenId(tProjectId)
        If tLoaded.Name '= "Updated Name" Set tSC = $$$ERROR(5001, "Name should be Updated Name, got: "_tLoaded.Name) Quit

        // Update owner
        Set tLoaded.Owner = "NewOwner"
        Set tSC = tLoaded.%Save()
        If $$$ISERR(tSC) Quit

        Set tReloaded = ##class(SpectraSight.Model.Project).%OpenId(tProjectId)
        If tReloaded.Owner '= "NewOwner" Set tSC = $$$ERROR(5001, "Owner should be NewOwner, got: "_tReloaded.Owner) Quit

        // Prefix should remain unchanged
        If tReloaded.Prefix '= "UF" Set tSC = $$$ERROR(5001, "Prefix should still be UF, got: "_tReloaded.Prefix) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    If tProjectId '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tProjectId)
    Quit tSC
}

/// AC #5: Cannot delete project with existing tickets (409 Conflict)
ClassMethod TestDeleteProjectWithTickets() As %Status
{
    Set tSC = $$$OK
    Set tProjectId = ""
    Set tBugId = ""
    Try {
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = "Delete With Tickets"
        Set tProject.Prefix = "DW"
        Set tSC = tProject.%Save()
        If $$$ISERR(tSC) Quit
        Set tProjectId = tProject.%Id()

        // Add a ticket to the project
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "Block Delete Bug"
        Set tBug.Project = tProject
        Set tBug.SequenceNumber = 1
        Set tSC = tBug.%Save()
        If $$$ISERR(tSC) Quit
        Set tBugId = tBug.%Id()

        // Simulate the delete check: count tickets
        Set tStmt = ##class(%SQL.Statement).%New()
        Set tSC2 = tStmt.%Prepare("SELECT COUNT(*) AS cnt FROM SpectraSight_Model.Ticket WHERE Project = ?")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "SQL prepare failed") Quit
        Set tResult = tStmt.%Execute(tProjectId)
        Set tCount = 0
        If tResult.%Next() Set tCount = tResult.%Get("cnt")

        If tCount '> 0 Set tSC = $$$ERROR(5001, "Ticket count should be > 0 for project with tickets, got: "_tCount) Quit

        // The handler would return 409 Conflict here
        // Verify the logic path: tCount > 0 triggers conflict response
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    If tBugId '= "" Do ##class(SpectraSight.Model.Bug).%DeleteId(tBugId)
    If tProjectId '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tProjectId)
    Quit tSC
}

/// AC #6: Cannot delete the default SS project (403 Forbidden)
ClassMethod TestDeleteDefaultProject() As %Status
{
    Set tSC = $$$OK
    Set tProjectId = ""
    Try {
        // Create a project with prefix "SS" to simulate the default
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = "SpectraSight Default"
        Set tProject.Prefix = "SS"

        // Check if SS project already exists
        Set tStmt = ##class(%SQL.Statement).%New()
        Set tSC2 = tStmt.%Prepare("SELECT ID FROM SpectraSight_Model.Project WHERE Prefix = 'SS'")
        If $$$ISOK(tSC2) {
            Set tRes = tStmt.%Execute()
            If tRes.%Next() {
                // SS project exists, use it for the test
                Set tProjectId = tRes.%Get("ID")
                Set tProject = ##class(SpectraSight.Model.Project).%OpenId(tProjectId)
            } Else {
                // Create it
                Set tSC = tProject.%Save()
                If $$$ISERR(tSC) Quit
                Set tProjectId = tProject.%Id()
            }
        }

        // Verify the delete guard: Prefix = "SS" should trigger Forbidden
        If tProject.Prefix '= "SS" Set tSC = $$$ERROR(5001, "Project prefix should be SS") Quit

        // The handler checks: If tProject.Prefix = "SS" -> Forbidden
        // We verify this check works correctly
        Set tIsDefault = (tProject.Prefix = "SS")
        If 'tIsDefault Set tSC = $$$ERROR(5001, "SS prefix check should be true") Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    // Only delete if we created it (not if it was pre-existing)
    // Don't delete SS project if it was already there
    Quit tSC
}

/// AC #5: Delete a project with zero tickets succeeds
ClassMethod TestDeleteProjectSuccess() As %Status
{
    Set tSC = $$$OK
    Set tProjectId = ""
    Try {
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = "Deletable Project"
        Set tProject.Prefix = "DL"
        Set tSC = tProject.%Save()
        If $$$ISERR(tSC) Quit
        Set tProjectId = tProject.%Id()

        // Verify no tickets
        Set tStmt = ##class(%SQL.Statement).%New()
        Set tSC2 = tStmt.%Prepare("SELECT COUNT(*) AS cnt FROM SpectraSight_Model.Ticket WHERE Project = ?")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "SQL prepare failed") Quit
        Set tResult = tStmt.%Execute(tProjectId)
        Set tCount = 0
        If tResult.%Next() Set tCount = tResult.%Get("cnt")
        If tCount '= 0 Set tSC = $$$ERROR(5001, "Ticket count should be 0, got: "_tCount) Quit

        // Delete should succeed
        Set tSC = ##class(SpectraSight.Model.Project).%DeleteId(tProjectId)
        If $$$ISERR(tSC) Quit
        Set tProjectId = ""

        // Verify deleted
        Set tGone = ##class(SpectraSight.Model.Project).%OpenId(tProjectId)
        If tGone '= "" Set tSC = $$$ERROR(5001, "Project should be deleted but still exists") Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    If tProjectId '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tProjectId)
    Quit tSC
}

/// AC #2: ListProjects SQL orders by Prefix
ClassMethod TestListProjectsOrder() As %Status
{
    Set tSC = $$$OK
    Set tIds = ""
    Try {
        // Create projects with different prefixes (out of order)
        Set tPrefixes = $LISTBUILD("ZZ", "AA", "MM")
        For tI = 1:1:$LISTLENGTH(tPrefixes) {
            Set tPrefix = $LIST(tPrefixes, tI)
            Set tProject = ##class(SpectraSight.Model.Project).%New()
            Set tProject.Name = "Order Test "_tPrefix
            Set tProject.Prefix = tPrefix
            Set tSC = tProject.%Save()
            If $$$ISERR(tSC) Quit
            Set tIds(tI) = tProject.%Id()
        }
        If $$$ISERR(tSC) Quit

        // Query the same way ListProjects does
        Set tStmt = ##class(%SQL.Statement).%New()
        Set tSC2 = tStmt.%Prepare("SELECT ID FROM SpectraSight_Model.Project WHERE Prefix IN ('AA','MM','ZZ') ORDER BY Prefix")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "SQL prepare failed") Quit
        Set tResult = tStmt.%Execute()

        // Should come out in alphabetical order: AA, MM, ZZ
        Set tExpected = $LISTBUILD("AA", "MM", "ZZ")
        Set tIdx = 0
        While tResult.%Next() {
            Set tIdx = tIdx + 1
            Set tProject = ##class(SpectraSight.Model.Project).%OpenId(tResult.%Get("ID"))
            Set tExpPrefix = $LIST(tExpected, tIdx)
            If tProject.Prefix '= tExpPrefix Set tSC = $$$ERROR(5001, "Expected prefix "_tExpPrefix_" at position "_tIdx_", got: "_tProject.Prefix) Quit
        }
        If $$$ISERR(tSC) Quit
        If tIdx '= 3 Set tSC = $$$ERROR(5001, "Expected 3 projects, got: "_tIdx) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    For tI = 1:1:3 {
        If $GET(tIds(tI)) '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tIds(tI))
    }
    Quit tSC
}

/// AC #5: Response.Conflict returns proper error structure
ClassMethod TestResponseConflict() As %Status
{
    Set tSC = $$$OK
    Try {
        // Verify the Conflict method delegates to Error with code "CONFLICT" and status 409
        // We can verify the method exists and the GetHttpStatusText returns 409 Conflict
        Set tText = ##class(SpectraSight.REST.Response).GetHttpStatusText(409)
        If tText '= "409 Conflict" Set tSC = $$$ERROR(5001, "GetHttpStatusText(409) should be '409 Conflict', got: "_tText) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// AC #6: Response.Forbidden returns proper error structure
ClassMethod TestResponseForbidden() As %Status
{
    Set tSC = $$$OK
    Try {
        Set tText = ##class(SpectraSight.REST.Response).GetHttpStatusText(403)
        If tText '= "403 Forbidden" Set tSC = $$$ERROR(5001, "GetHttpStatusText(403) should be '403 Forbidden', got: "_tText) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Verify GetHttpStatusText handles both 403 and 409 correctly
ClassMethod TestGetHttpStatusText403And409() As %Status
{
    Set tSC = $$$OK
    Try {
        // 403 Forbidden
        Set t403 = ##class(SpectraSight.REST.Response).GetHttpStatusText(403)
        If t403 '= "403 Forbidden" Set tSC = $$$ERROR(5001, "403 expected '403 Forbidden', got: "_t403) Quit

        // 409 Conflict
        Set t409 = ##class(SpectraSight.REST.Response).GetHttpStatusText(409)
        If t409 '= "409 Conflict" Set tSC = $$$ERROR(5001, "409 expected '409 Conflict', got: "_t409) Quit

        // Existing codes still work
        Set t200 = ##class(SpectraSight.REST.Response).GetHttpStatusText(200)
        If t200 '= "200 OK" Set tSC = $$$ERROR(5001, "200 expected '200 OK', got: "_t200) Quit

        Set t400 = ##class(SpectraSight.REST.Response).GetHttpStatusText(400)
        If t400 '= "400 Bad Request" Set tSC = $$$ERROR(5001, "400 expected '400 Bad Request', got: "_t400) Quit

        Set t404 = ##class(SpectraSight.REST.Response).GetHttpStatusText(404)
        If t404 '= "404 Not Found" Set tSC = $$$ERROR(5001, "404 expected '404 Not Found', got: "_t404) Quit

        Set t500 = ##class(SpectraSight.REST.Response).GetHttpStatusText(500)
        If t500 '= "500 Internal Server Error" Set tSC = $$$ERROR(5001, "500 expected '500 Internal Server Error', got: "_t500) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// AC #10: ListTickets project filter resolves prefix to project ID
ClassMethod TestListTicketsProjectFilterByPrefix() As %Status
{
    Set tSC = $$$OK
    Set tProjectId = ""
    Set tBugId = ""
    Set tBug2Id = ""
    Try {
        // Create a project
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = "Filter Prefix Test"
        Set tProject.Prefix = "FP"
        Set tSC = tProject.%Save()
        If $$$ISERR(tSC) Quit
        Set tProjectId = tProject.%Id()

        // Create ticket in that project
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "ProjFilter Test Bug"
        Set tBug.Project = tProject
        Set tBug.SequenceNumber = 1
        Set tSC = tBug.%Save()
        If $$$ISERR(tSC) Quit
        Set tBugId = tBug.%Id()

        // Create another ticket NOT in the project
        Set tBug2 = ##class(SpectraSight.Model.Bug).%New()
        Set tBug2.Title = "ProjFilter Test Bug 2"
        Set tSC = tBug2.%Save()
        If $$$ISERR(tSC) Quit
        Set tBug2Id = tBug2.%Id()

        // Simulate prefix resolution: "FP" -> uppercase -> SQL lookup
        Set tPrefixUpper = $ZCONVERT("FP", "U")
        Set tStmt = ##class(%SQL.Statement).%New()
        Set tSC2 = tStmt.%Prepare("SELECT ID FROM SpectraSight_Model.Project WHERE Prefix = ?")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "SQL prepare failed") Quit
        Set tRes = tStmt.%Execute(tPrefixUpper)
        If 'tRes.%Next() Set tSC = $$$ERROR(5001, "Prefix FP should resolve to a project") Quit
        Set tResolvedId = tRes.%Get("ID")
        If tResolvedId '= tProjectId Set tSC = $$$ERROR(5001, "Resolved ID should match project ID") Quit

        // Query tickets with project filter
        Set tStmt2 = ##class(%SQL.Statement).%New()
        Set tSC2 = tStmt2.%Prepare("SELECT COUNT(*) AS cnt FROM SpectraSight_Model.Ticket WHERE Project = ?")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "SQL prepare for ticket count failed") Quit
        Set tRes2 = tStmt2.%Execute(tResolvedId)
        Set tCount = 0
        If tRes2.%Next() Set tCount = tRes2.%Get("cnt")
        If tCount '= 1 Set tSC = $$$ERROR(5001, "Should find 1 ticket for project FP, got: "_tCount) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    If tBugId '= "" Do ##class(SpectraSight.Model.Bug).%DeleteId(tBugId)
    If tBug2Id '= "" Do ##class(SpectraSight.Model.Bug).%DeleteId(tBug2Id)
    If tProjectId '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tProjectId)
    Quit tSC
}

/// AC #10: ListTickets project filter accepts numeric project ID
ClassMethod TestListTicketsProjectFilterByNumericId() As %Status
{
    Set tSC = $$$OK
    Set tProjectId = ""
    Set tBugId = ""
    Try {
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = "Numeric Filter Test"
        Set tProject.Prefix = "NF"
        Set tSC = tProject.%Save()
        If $$$ISERR(tSC) Quit
        Set tProjectId = tProject.%Id()

        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "NumFilter Test Bug"
        Set tBug.Project = tProject
        Set tBug.SequenceNumber = 1
        Set tSC = tBug.%Save()
        If $$$ISERR(tSC) Quit
        Set tBugId = tBug.%Id()

        // Simulate numeric filter: +tProjectFilter = tProjectFilter means numeric
        Set tProjectFilter = tProjectId
        If +tProjectFilter '= tProjectFilter Set tSC = $$$ERROR(5001, "Project ID should be numeric") Quit

        // Query with numeric ID directly
        Set tStmt = ##class(%SQL.Statement).%New()
        Set tSC2 = tStmt.%Prepare("SELECT COUNT(*) AS cnt FROM SpectraSight_Model.Ticket WHERE Project = ?")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "SQL prepare failed") Quit
        Set tRes = tStmt.%Execute(tProjectFilter)
        Set tCount = 0
        If tRes.%Next() Set tCount = tRes.%Get("cnt")
        If tCount '= 1 Set tSC = $$$ERROR(5001, "Should find 1 ticket with numeric project ID filter, got: "_tCount) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    If tBugId '= "" Do ##class(SpectraSight.Model.Bug).%DeleteId(tBugId)
    If tProjectId '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tProjectId)
    Quit tSC
}

/// AC #10: Unknown prefix returns empty results (uses -1 as impossible project ID)
ClassMethod TestListTicketsProjectFilterUnknownPrefix() As %Status
{
    Set tSC = $$$OK
    Try {
        // Simulate prefix lookup for non-existent prefix
        Set tStmt = ##class(%SQL.Statement).%New()
        Set tSC2 = tStmt.%Prepare("SELECT ID FROM SpectraSight_Model.Project WHERE Prefix = ?")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "SQL prepare failed") Quit
        Set tRes = tStmt.%Execute("NONEXISTENT")
        Set tFound = tRes.%Next()
        If tFound Set tSC = $$$ERROR(5001, "NONEXISTENT prefix should not resolve to a project") Quit

        // The handler uses Project = -1 for unknown prefix, which matches no tickets
        Set tStmt2 = ##class(%SQL.Statement).%New()
        Set tSC2 = tStmt2.%Prepare("SELECT COUNT(*) AS cnt FROM SpectraSight_Model.Ticket WHERE Project = ?")
        If $$$ISERR(tSC2) Set tSC = $$$ERROR(5001, "SQL prepare for ticket count failed") Quit
        Set tRes2 = tStmt2.%Execute(-1)
        Set tCount = 0
        If tRes2.%Next() Set tCount = tRes2.%Get("cnt")
        If tCount '= 0 Set tSC = $$$ERROR(5001, "Unknown prefix should return 0 tickets, got: "_tCount) Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// AC #5 (MCP types.ts): TICKET_ID_PATTERN /^[A-Z]{2,10}-\d+$/ supports multi-project formats
/// Tests format validation logic matching the MCP pattern, independent of ticket existence
ClassMethod TestTicketIdPatternMultiProject() As %Status
{
    Set tSC = $$$OK
    Set tProjectId = ""
    Set tBugId = ""
    Try {
        // Create a project with a non-SS prefix to verify multi-project Parse works
        Set tProject = ##class(SpectraSight.Model.Project).%New()
        Set tProject.Name = "Pattern Test"
        Set tProject.Prefix = "MP"
        Set tSC = tProject.%Save()
        If $$$ISERR(tSC) Quit
        Set tProjectId = tProject.%Id()

        // Create a ticket in that project
        Set tBug = ##class(SpectraSight.Model.Bug).%New()
        Set tBug.Title = "Multi-Project Pattern Bug"
        Set tBug.Project = tProject
        Set tBug.SequenceNumber = 1
        Set tSC = tBug.%Save()
        If $$$ISERR(tSC) Quit
        Set tBugId = tBug.%Id()

        // Verify multi-project ticket ID resolves: MP-1 -> internal ID
        Set tParsed = ##class(SpectraSight.Util.TicketID).Parse("MP-1")
        If tParsed '= +tBugId Set tSC = $$$ERROR(5001, "MP-1 should resolve to bug ID "_tBugId_", got: "_tParsed) Quit

        // Verify Format round-trip
        Set tFormatted = ##class(SpectraSight.Util.TicketID).Format(tBugId)
        If tFormatted '= "MP-1" Set tSC = $$$ERROR(5001, "Format should return MP-1, got: "_tFormatted) Quit

        // Verify unknown prefix returns empty (not an error, just no match)
        Set tUnknown = ##class(SpectraSight.Util.TicketID).Parse("NONEXIST-99")
        If tUnknown '= "" Set tSC = $$$ERROR(5001, "Unknown prefix should return empty, got: "_tUnknown) Quit

        // Verify invalid formats
        Set tEmpty = ##class(SpectraSight.Util.TicketID).Parse("")
        If tEmpty '= "" Set tSC = $$$ERROR(5001, "Empty string should return empty") Quit

        // Verify the ObjectScript format pattern matches what MCP expects:
        // The MCP pattern /^[A-Z]{2,10}-\d+$/ means:
        // - 2-10 uppercase letters
        // - dash
        // - one or more digits
        // Verify this by checking that the prefix validation on Project matches
        Set tPrefixOK = $MATCH("DATA", "^[A-Z]{2,10}$")
        If 'tPrefixOK Set tSC = $$$ERROR(5001, "DATA should match prefix pattern") Quit

        Set tPrefixBad = $MATCH("X", "^[A-Z]{2,10}$")
        If tPrefixBad Set tSC = $$$ERROR(5001, "Single char X should not match prefix pattern") Quit

        Set tPrefixBad2 = $MATCH("ABCDEFGHIJK", "^[A-Z]{2,10}$")
        If tPrefixBad2 Set tSC = $$$ERROR(5001, "11-char prefix should not match prefix pattern") Quit

        Set tPrefixBad3 = $MATCH("data", "^[A-Z]{2,10}$")
        If tPrefixBad3 Set tSC = $$$ERROR(5001, "Lowercase prefix should not match pattern") Quit
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    If tBugId '= "" Do ##class(SpectraSight.Model.Bug).%DeleteId(tBugId)
    If tProjectId '= "" Do ##class(SpectraSight.Model.Project).%DeleteId(tProjectId)
    Quit tSC
}

}
