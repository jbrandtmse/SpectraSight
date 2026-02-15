Class SpectraSight.REST.TicketHandler [ Abstract ]
{

/// POST /api/tickets - Create a new ticket
ClassMethod CreateTicket() As %Status
{
    Set tSC = $$$OK
    Try {
        Set tBody = ##class(%DynamicObject).%FromJSON(%request.Content)
        Set tType = tBody.%Get("type")
        Set tTitle = tBody.%Get("title")

        // Validate required fields
        Set tSC = ##class(SpectraSight.Util.Validation).ValidateRequired(tType, "type")
        If $$$ISERR(tSC) {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("type is required")
            Quit
        }
        Set tSC = ##class(SpectraSight.Util.Validation).ValidateRequired(tTitle, "title")
        If $$$ISERR(tSC) {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("title is required")
            Quit
        }

        // Validate ticket type
        Set tSC = ##class(SpectraSight.Util.Validation).ValidateTicketType(tType)
        If $$$ISERR(tSC) {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Invalid ticket type: "_tType_". Must be one of: bug, task, story, epic")
            Quit
        }

        // Get class name for type
        Set tSC = ##class(SpectraSight.Util.Validation).GetClassForType(tType, .tClassName)
        If $$$ISERR(tSC) {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Invalid ticket type: "_tType)
            Quit
        }

        // Validate hierarchy if parentId provided
        Set tParentObj = ""
        If tBody.%IsDefined("parentId") {
            Set tParentIdStr = tBody.%Get("parentId")
            If tParentIdStr '= "" {
                Set tParentInternalId = ##class(SpectraSight.Util.TicketID).Parse(tParentIdStr)
                If tParentInternalId = "" {
                    Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Invalid parent ticket ID format")
                    Quit
                }
                Set tSC = ##class(SpectraSight.Util.Validation).ValidateHierarchy(tParentInternalId, tType)
                If $$$ISERR(tSC) {
                    Set tSC = ##class(SpectraSight.REST.Response).BadRequest($System.Status.GetErrorText(tSC))
                    Quit
                }
                Set tParentObj = ##class(SpectraSight.Model.Ticket).%OpenId(tParentInternalId)
            }
        }

        // Create new instance
        Set tTicket = $CLASSMETHOD(tClassName, "%New")

        // Set base fields
        Set tTicket.Title = tTitle
        If tBody.%IsDefined("description") {
            Set tTicket.Description = tBody.%Get("description")
        }
        If tBody.%IsDefined("priority") {
            Set tPriority = tBody.%Get("priority")
            If tPriority '= "" {
                Set tSC = ##class(SpectraSight.Util.Validation).ValidatePriority(tPriority)
                If $$$ISERR(tSC) {
                    Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Invalid priority: "_tPriority_". Must be one of: Low, Medium, High, Critical")
                    Quit
                }
                Set tTicket.Priority = tPriority
            }
        }
        If tBody.%IsDefined("assignee") {
            Set tTicket.Assignee = tBody.%Get("assignee")
        }
        If tBody.%IsDefined("status") {
            Set tReqStatus = tBody.%Get("status")
            If tReqStatus '= "" {
                Set tSC = ##class(SpectraSight.Util.Validation).ValidateStatus(tReqStatus)
                If $$$ISERR(tSC) {
                    Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Invalid status: "_tReqStatus)
                    Quit
                }
                Set tTicket.Status = tReqStatus
            }
        }

        // Set type-specific fields
        Set tLowerType = $ZCONVERT(tType, "L")
        If tLowerType = "bug" {
            If tBody.%IsDefined("severity") Set tTicket.Severity = tBody.%Get("severity")
            If tBody.%IsDefined("stepsToReproduce") Set tTicket.StepsToReproduce = tBody.%Get("stepsToReproduce")
            If tBody.%IsDefined("expectedBehavior") Set tTicket.ExpectedBehavior = tBody.%Get("expectedBehavior")
            If tBody.%IsDefined("actualBehavior") Set tTicket.ActualBehavior = tBody.%Get("actualBehavior")
        } ElseIf tLowerType = "task" {
            If tBody.%IsDefined("estimatedHours") Set tTicket.EstimatedHours = tBody.%Get("estimatedHours")
            If tBody.%IsDefined("actualHours") Set tTicket.ActualHours = tBody.%Get("actualHours")
        } ElseIf tLowerType = "story" {
            If tBody.%IsDefined("acceptanceCriteria") Set tTicket.AcceptanceCriteria = tBody.%Get("acceptanceCriteria")
            If tBody.%IsDefined("storyPoints") Set tTicket.StoryPoints = tBody.%Get("storyPoints")
        } ElseIf tLowerType = "epic" {
            If tBody.%IsDefined("startDate") Set tTicket.StartDate = tBody.%Get("startDate")
            If tBody.%IsDefined("targetDate") Set tTicket.TargetDate = tBody.%Get("targetDate")
        }

        // Set parent if validated above
        If tParentObj '= "" {
            Set tTicket.Parent = tParentObj
        }

        // Save
        Set tSC = tTicket.%Save()
        If $$$ISERR(tSC) {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Failed to save ticket: "_$System.Status.GetErrorText(tSC))
            Quit
        }

        // Record activity: StatusChange on creation
        Set tActor = ##class(SpectraSight.Util.ActivityRecorder).GetActorFromRequest()
        Set tSC2 = ##class(SpectraSight.Util.ActivityRecorder).RecordStatusChange(tTicket.%Id(), "", tTicket.Status, tActor, "human")
        // Activity recording failure is non-fatal for ticket creation

        // Build and return response
        Set tResponse = ..BuildTicketResponse(tTicket)
        Set tSC = ##class(SpectraSight.REST.Response).Created(tResponse)
    }
    Catch ex {
        Set tSC = ##class(SpectraSight.REST.Response).ServerError("An unexpected error occurred while creating the ticket")
    }
    Quit tSC
}

/// GET /api/tickets/:id - Get a single ticket
ClassMethod GetTicket(pId As %String) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tInternalId = ##class(SpectraSight.Util.TicketID).Parse(pId)
        If tInternalId = "" {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Invalid ticket ID format")
            Quit
        }
        Set tTicket = ##class(SpectraSight.Model.Ticket).%OpenId(tInternalId)
        If tTicket = "" {
            Set tSC = ##class(SpectraSight.REST.Response).NotFound("Ticket "_##class(SpectraSight.Util.TicketID).Format(tInternalId)_" not found")
            Quit
        }
        Set tResponse = ..BuildTicketResponse(tTicket)
        Set tSC = ##class(SpectraSight.REST.Response).Success(tResponse)
    }
    Catch ex {
        Set tSC = ##class(SpectraSight.REST.Response).ServerError("An unexpected error occurred while retrieving the ticket")
    }
    Quit tSC
}

/// GET /api/tickets - List tickets with pagination, filtering, sorting
ClassMethod ListTickets() As %Status
{
    Set tSC = $$$OK
    Try {
        // Extract query parameters
        Set tPage = +$GET(%request.Data("page", 1), 1)
        Set tPageSize = +$GET(%request.Data("pageSize", 1), 25)
        Set tType = $GET(%request.Data("type", 1))
        Set tStatus = $GET(%request.Data("status", 1))
        Set tPriority = $GET(%request.Data("priority", 1))
        Set tAssignee = $GET(%request.Data("assignee", 1))
        Set tSearch = $GET(%request.Data("search", 1))
        Set tSort = $GET(%request.Data("sort", 1), "-updatedAt")

        // Enforce min/max
        If tPage < 1 Set tPage = 1
        If tPageSize < 1 Set tPageSize = 25
        If tPageSize > 100 Set tPageSize = 100

        // Build WHERE clauses
        Set tWhere = ""
        Set tParamCount = 0

        // Type filter using subquery approach (supports comma-separated values)
        If tType '= "" {
            Set tTypeList = $LISTFROMSTRING(tType, ",")
            Set tTypeCount = $LISTLENGTH(tTypeList)
            Set tTypeClauses = ""
            Set tTypeValid = 1
            For tI = 1:1:tTypeCount {
                Set tOneType = $ZCONVERT($ZSTRIP($LIST(tTypeList, tI), "<>W"), "L")
                Set tSC2 = ##class(SpectraSight.Util.Validation).GetClassForType(tOneType, .tFilterClass)
                If $$$ISOK(tSC2) {
                    Set tTableName = $PIECE(tFilterClass, ".", 1, *-1)
                    Set tTableName = $TRANSLATE(tTableName, ".", "_")_"."_$PIECE(tFilterClass, ".", *)
                    Set tTypeClauses = tTypeClauses_$SELECT(tTypeClauses="":"", 1:" OR ")_"%ID IN (SELECT %ID FROM "_tTableName_")"
                } Else {
                    Set tTypeValid = 0
                    Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Invalid type filter: "_$LIST(tTypeList, tI))
                    Quit
                }
            }
            If 'tTypeValid Quit
            If tTypeClauses '= "" {
                Set tWhere = tWhere_$SELECT(tWhere="":"", 1:" AND ")_"("_tTypeClauses_")"
            }
        }

        // Status filter (supports comma-separated values)
        If tStatus '= "" {
            Set tStatusList = $LISTFROMSTRING(tStatus, ",")
            Set tStatusCount = $LISTLENGTH(tStatusList)
            If tStatusCount = 1 {
                Set tParamCount = tParamCount + 1
                Set tParams(tParamCount) = tStatus
                Set tWhere = tWhere_$SELECT(tWhere="":"", 1:" AND ")_"Status = ?"
            } Else {
                Set tStatusPlaceholders = ""
                For tI = 1:1:tStatusCount {
                    Set tParamCount = tParamCount + 1
                    Set tParams(tParamCount) = $ZSTRIP($LIST(tStatusList, tI), "<>W")
                    Set tStatusPlaceholders = tStatusPlaceholders_$SELECT(tStatusPlaceholders="":"", 1:", ")_"?"
                }
                Set tWhere = tWhere_$SELECT(tWhere="":"", 1:" AND ")_"Status IN ("_tStatusPlaceholders_")"
            }
        }

        // Priority filter
        If tPriority '= "" {
            Set tParamCount = tParamCount + 1
            Set tParams(tParamCount) = tPriority
            Set tWhere = tWhere_$SELECT(tWhere="":"", 1:" AND ")_"Priority = ?"
        }

        // Assignee filter
        If tAssignee '= "" {
            Set tParamCount = tParamCount + 1
            Set tParams(tParamCount) = tAssignee
            Set tWhere = tWhere_$SELECT(tWhere="":"", 1:" AND ")_"Assignee = ?"
        }

        // Search filter
        If tSearch '= "" {
            Set tParamCount = tParamCount + 1
            Set tParams(tParamCount) = "%"_tSearch_"%"
            Set tParamCount = tParamCount + 1
            Set tParams(tParamCount) = "%"_tSearch_"%"
            Set tWhere = tWhere_$SELECT(tWhere="":"", 1:" AND ")_"(Title LIKE ? OR Description LIKE ?)"
        }

        Set tWhereClause = ""
        If tWhere '= "" Set tWhereClause = " WHERE "_tWhere

        // Build ORDER BY from sort parameter
        Set tOrderBy = ..BuildOrderBy(tSort)

        // Count query
        Set tCountSQL = "SELECT COUNT(*) AS cnt FROM SpectraSight_Model.Ticket"_tWhereClause
        Set tStatement = ##class(%SQL.Statement).%New()
        Set tSC2 = tStatement.%Prepare(tCountSQL)
        If $$$ISERR(tSC2) {
            Set tSC = ##class(SpectraSight.REST.Response).ServerError("Failed to prepare count query: "_$System.Status.GetErrorText(tSC2))
            Quit
        }

        // Execute count with parameters
        Set tResult = ..ExecuteWithParams(tStatement, .tParams, tParamCount)

        Set tTotal = 0
        If tResult.%Next() {
            Set tTotal = tResult.%Get("cnt")
        }

        // Calculate offset
        Set tOffset = (tPage - 1) * tPageSize

        // Data query
        Set tDataSQL = "SELECT ID FROM SpectraSight_Model.Ticket"_tWhereClause_" ORDER BY "_tOrderBy_" OFFSET "_tOffset_" ROWS FETCH NEXT "_tPageSize_" ROWS ONLY"

        Set tStatement2 = ##class(%SQL.Statement).%New()
        Set tSC2 = tStatement2.%Prepare(tDataSQL)
        If $$$ISERR(tSC2) {
            Set tSC = ##class(SpectraSight.REST.Response).ServerError("Failed to prepare data query")
            Quit
        }

        // Execute data query with same parameters
        Set tResult2 = ..ExecuteWithParams(tStatement2, .tParams, tParamCount)

        // Build response array
        Set tArray = ##class(%DynamicArray).%New()
        While tResult2.%Next() {
            Set tTicketId = tResult2.%Get("ID")
            Set tTicket = ##class(SpectraSight.Model.Ticket).%OpenId(tTicketId)
            If tTicket '= "" {
                Set tObj = ..BuildTicketResponse(tTicket, 0)
                Do tArray.%Push(tObj)
            }
        }

        Set tSC = ##class(SpectraSight.REST.Response).PaginatedList(tArray, tTotal, tPage, tPageSize)
    }
    Catch ex {
        Set tSC = ##class(SpectraSight.REST.Response).ServerError("An unexpected error occurred while listing tickets")
    }
    Quit tSC
}

/// PUT /api/tickets/:id - Update a ticket
ClassMethod UpdateTicket(pId As %String) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tInternalId = ##class(SpectraSight.Util.TicketID).Parse(pId)
        If tInternalId = "" {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Invalid ticket ID format")
            Quit
        }

        Set tTicket = ##class(SpectraSight.Model.Ticket).%OpenId(tInternalId)
        If tTicket = "" {
            Set tSC = ##class(SpectraSight.REST.Response).NotFound("Ticket "_##class(SpectraSight.Util.TicketID).Format(tInternalId)_" not found")
            Quit
        }

        Set tBody = ##class(%DynamicObject).%FromJSON(%request.Content)

        // Track old values for activity recording
        Set tOldStatus = tTicket.Status
        Set tOldAssignee = tTicket.Assignee

        // Update base fields if present
        If tBody.%IsDefined("title") {
            Set tNewTitle = tBody.%Get("title")
            If tNewTitle '= "" {
                Set tTicket.Title = tNewTitle
            }
        }
        If tBody.%IsDefined("description") {
            Set tTicket.Description = tBody.%Get("description")
        }
        If tBody.%IsDefined("status") {
            Set tNewStatus = tBody.%Get("status")
            If tNewStatus '= "" {
                Set tSC = ##class(SpectraSight.Util.Validation).ValidateStatus(tNewStatus)
                If $$$ISERR(tSC) {
                    Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Invalid status: "_tNewStatus_". Must be one of: Open, In Progress, Blocked, Complete")
                    Quit
                }
                Set tTicket.Status = tNewStatus
            }
        }
        If tBody.%IsDefined("priority") {
            Set tNewPriority = tBody.%Get("priority")
            If tNewPriority '= "" {
                Set tSC = ##class(SpectraSight.Util.Validation).ValidatePriority(tNewPriority)
                If $$$ISERR(tSC) {
                    Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Invalid priority: "_tNewPriority_". Must be one of: Low, Medium, High, Critical")
                    Quit
                }
                Set tTicket.Priority = tNewPriority
            }
        }
        If tBody.%IsDefined("assignee") {
            Set tTicket.Assignee = tBody.%Get("assignee")
        }

        // Update parent if provided
        If tBody.%IsDefined("parentId") {
            Set tNewParentIdStr = tBody.%Get("parentId")
            If (tNewParentIdStr = "") || (tNewParentIdStr = "null") {
                // Remove parent (un-link from hierarchy)
                Set tTicket.Parent = ""
            } Else {
                Set tNewParentInternalId = ##class(SpectraSight.Util.TicketID).Parse(tNewParentIdStr)
                If tNewParentInternalId = "" {
                    Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Invalid parent ticket ID format")
                    Quit
                }
                // Prevent self-parenting
                If tNewParentInternalId = tInternalId {
                    Set tSC = ##class(SpectraSight.REST.Response).BadRequest("A ticket cannot be its own parent")
                    Quit
                }
                Set tChildType = ..GetTicketType(tTicket)
                Set tSC = ##class(SpectraSight.Util.Validation).ValidateHierarchy(tNewParentInternalId, tChildType)
                If $$$ISERR(tSC) {
                    Set tSC = ##class(SpectraSight.REST.Response).BadRequest($System.Status.GetErrorText(tSC))
                    Quit
                }
                Set tParentObj = ##class(SpectraSight.Model.Ticket).%OpenId(tNewParentInternalId)
                If tParentObj '= "" {
                    Set tTicket.Parent = tParentObj
                }
            }
        }

        // Update type-specific fields
        If tTicket.%IsA("SpectraSight.Model.Bug") {
            If tBody.%IsDefined("severity") Set tTicket.Severity = tBody.%Get("severity")
            If tBody.%IsDefined("stepsToReproduce") Set tTicket.StepsToReproduce = tBody.%Get("stepsToReproduce")
            If tBody.%IsDefined("expectedBehavior") Set tTicket.ExpectedBehavior = tBody.%Get("expectedBehavior")
            If tBody.%IsDefined("actualBehavior") Set tTicket.ActualBehavior = tBody.%Get("actualBehavior")
        } ElseIf tTicket.%IsA("SpectraSight.Model.Task") {
            If tBody.%IsDefined("estimatedHours") Set tTicket.EstimatedHours = tBody.%Get("estimatedHours")
            If tBody.%IsDefined("actualHours") Set tTicket.ActualHours = tBody.%Get("actualHours")
        } ElseIf tTicket.%IsA("SpectraSight.Model.Story") {
            If tBody.%IsDefined("acceptanceCriteria") Set tTicket.AcceptanceCriteria = tBody.%Get("acceptanceCriteria")
            If tBody.%IsDefined("storyPoints") Set tTicket.StoryPoints = tBody.%Get("storyPoints")
        } ElseIf tTicket.%IsA("SpectraSight.Model.Epic") {
            If tBody.%IsDefined("startDate") Set tTicket.StartDate = tBody.%Get("startDate")
            If tBody.%IsDefined("targetDate") Set tTicket.TargetDate = tBody.%Get("targetDate")
        }

        // Save
        Set tSC = tTicket.%Save()
        If $$$ISERR(tSC) {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Failed to save ticket: "_$System.Status.GetErrorText(tSC))
            Quit
        }

        // Record activity
        Set tActor = ##class(SpectraSight.Util.ActivityRecorder).GetActorFromRequest()
        If tTicket.Status '= tOldStatus {
            Do ##class(SpectraSight.Util.ActivityRecorder).RecordStatusChange(tInternalId, tOldStatus, tTicket.Status, tActor, "human")
        }
        If tTicket.Assignee '= tOldAssignee {
            Do ##class(SpectraSight.Util.ActivityRecorder).RecordAssignmentChange(tInternalId, tOldAssignee, tTicket.Assignee, tActor, "human")
        }

        // Build and return response
        Set tResponse = ..BuildTicketResponse(tTicket)
        Set tSC = ##class(SpectraSight.REST.Response).Success(tResponse)
    }
    Catch ex {
        Set tSC = ##class(SpectraSight.REST.Response).ServerError("An unexpected error occurred while updating the ticket")
    }
    Quit tSC
}

/// DELETE /api/tickets/:id - Delete a ticket
ClassMethod DeleteTicket(pId As %String) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tInternalId = ##class(SpectraSight.Util.TicketID).Parse(pId)
        If tInternalId = "" {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Invalid ticket ID format")
            Quit
        }

        Set tTicket = ##class(SpectraSight.Model.Ticket).%OpenId(tInternalId)
        If tTicket = "" {
            Set tSC = ##class(SpectraSight.REST.Response).NotFound("Ticket "_##class(SpectraSight.Util.TicketID).Format(tInternalId)_" not found")
            Quit
        }

        // Delete associated Activity entries first
        Set tStatement = ##class(%SQL.Statement).%New()
        Set tSC2 = tStatement.%Prepare("DELETE FROM SpectraSight_Model.Activity WHERE Ticket = ?")
        If $$$ISOK(tSC2) {
            Do tStatement.%Execute(tInternalId)
        }

        // Delete associated CodeReference entries
        Set tStatement2 = ##class(%SQL.Statement).%New()
        Set tSC2 = tStatement2.%Prepare("DELETE FROM SpectraSight_Model.CodeReference WHERE Ticket = ?")
        If $$$ISOK(tSC2) {
            Do tStatement2.%Execute(tInternalId)
        }

        // Clear parent references on children (make them standalone)
        Set tStatement3 = ##class(%SQL.Statement).%New()
        Set tSC2 = tStatement3.%Prepare("UPDATE SpectraSight_Model.Ticket SET Parent = NULL WHERE Parent = ?")
        If $$$ISOK(tSC2) {
            Do tStatement3.%Execute(tInternalId)
        }

        // Delete the ticket
        Set tSC = ##class(SpectraSight.Model.Ticket).%DeleteId(tInternalId)
        If $$$ISERR(tSC) {
            Set tSC = ##class(SpectraSight.REST.Response).ServerError("Failed to delete ticket: "_$System.Status.GetErrorText(tSC))
            Quit
        }

        Set tSC = ##class(SpectraSight.REST.Response).SuccessNoContent()
    }
    Catch ex {
        Set tSC = ##class(SpectraSight.REST.Response).ServerError("An unexpected error occurred while deleting the ticket")
    }
    Quit tSC
}

/// POST /api/tickets/:id/code-references - Add a code reference to a ticket
ClassMethod AddCodeReference(pId As %String) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tInternalId = ##class(SpectraSight.Util.TicketID).Parse(pId)
        If tInternalId = "" {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Invalid ticket ID format")
            Quit
        }

        Set tTicket = ##class(SpectraSight.Model.Ticket).%OpenId(tInternalId)
        If tTicket = "" {
            Set tSC = ##class(SpectraSight.REST.Response).NotFound("Ticket " _ ##class(SpectraSight.Util.TicketID).Format(tInternalId) _ " not found")
            Quit
        }

        Set tBody = ##class(%DynamicObject).%FromJSON(%request.Content)
        Set tClassName = tBody.%Get("className")
        If tClassName = "" {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("className is required")
            Quit
        }
        If $LENGTH(tClassName) > 500 {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("className exceeds maximum length of 500 characters")
            Quit
        }
        Set tMethodName = tBody.%Get("methodName")
        If (tMethodName '= "") && ($LENGTH(tMethodName) > 255) {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("methodName exceeds maximum length of 255 characters")
            Quit
        }

        Set tRef = ##class(SpectraSight.Model.CodeReference).%New()
        Set tRef.Ticket = tTicket
        Set tRef.ClassName = tClassName
        If tMethodName '= "" {
            Set tRef.MethodName = tMethodName
        }
        Set tRef.AddedBy = ##class(SpectraSight.Util.ActivityRecorder).GetActorFromRequest()

        Set tSC2 = tRef.%Save()
        If $$$ISERR(tSC2) {
            Set tSC = ##class(SpectraSight.REST.Response).ServerError("Failed to save code reference: " _ $System.Status.GetErrorText(tSC2))
            Quit
        }

        // Record activity
        Do ##class(SpectraSight.Util.ActivityRecorder).RecordCodeReferenceChange(tInternalId, tClassName, tMethodName, "added", tRef.AddedBy, "human")

        // Build response
        Set tResponse = ##class(%DynamicObject).%New()
        Do tResponse.%Set("id", tRef.%Id(), "number")
        Do tResponse.%Set("className", tRef.ClassName)
        Do tResponse.%Set("methodName", tRef.MethodName)
        Do tResponse.%Set("addedBy", tRef.AddedBy)
        Do tResponse.%Set("timestamp", tRef.Timestamp)

        Set tSC = ##class(SpectraSight.REST.Response).Created(tResponse)
    }
    Catch ex {
        Set tSC = ##class(SpectraSight.REST.Response).ServerError("An unexpected error occurred while adding code reference")
    }
    Quit tSC
}

/// DELETE /api/tickets/:id/code-references/:refId - Remove a code reference from a ticket
ClassMethod RemoveCodeReference(pId As %String, pRefId As %String) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tInternalId = ##class(SpectraSight.Util.TicketID).Parse(pId)
        If tInternalId = "" {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Invalid ticket ID format")
            Quit
        }

        Set tTicket = ##class(SpectraSight.Model.Ticket).%OpenId(tInternalId)
        If tTicket = "" {
            Set tSC = ##class(SpectraSight.REST.Response).NotFound("Ticket " _ ##class(SpectraSight.Util.TicketID).Format(tInternalId) _ " not found")
            Quit
        }

        // Validate code reference exists and belongs to this ticket
        Set tRef = ##class(SpectraSight.Model.CodeReference).%OpenId(pRefId)
        If tRef = "" {
            Set tSC = ##class(SpectraSight.REST.Response).NotFound("Code reference not found")
            Quit
        }
        If tRef.Ticket.%Id() '= tInternalId {
            Set tSC = ##class(SpectraSight.REST.Response).BadRequest("Code reference does not belong to this ticket")
            Quit
        }

        // Record activity BEFORE deleting
        Set tActor = ##class(SpectraSight.Util.ActivityRecorder).GetActorFromRequest()
        Do ##class(SpectraSight.Util.ActivityRecorder).RecordCodeReferenceChange(tInternalId, tRef.ClassName, tRef.MethodName, "removed", tActor, "human")

        // Delete the code reference
        Set tSC2 = ##class(SpectraSight.Model.CodeReference).%DeleteId(pRefId)
        If $$$ISERR(tSC2) {
            Set tSC = ##class(SpectraSight.REST.Response).ServerError("Failed to delete code reference")
            Quit
        }

        Set tSC = ##class(SpectraSight.REST.Response).SuccessNoContent()
    }
    Catch ex {
        Set tSC = ##class(SpectraSight.REST.Response).ServerError("An unexpected error occurred while removing code reference")
    }
    Quit tSC
}

/// Build a %DynamicObject response from a ticket object
/// pIncludeChildren: if true, include children array and parent object (used for detail view)
ClassMethod BuildTicketResponse(pTicket As SpectraSight.Model.Ticket, pIncludeChildren As %Boolean = 1) As %DynamicObject
{
    Set tObj = ##class(%DynamicObject).%New()
    Try {
        Do tObj.%Set("id", ##class(SpectraSight.Util.TicketID).Format(pTicket.%Id()))
        Do tObj.%Set("type", ..GetTicketType(pTicket))
        Do tObj.%Set("title", pTicket.Title)
        Do tObj.%Set("description", pTicket.Description)
        Do tObj.%Set("status", pTicket.Status)
        Do tObj.%Set("priority", pTicket.Priority)
        Do tObj.%Set("assignee", pTicket.Assignee)
        If (pTicket.Parent '= "") {
            Do tObj.%Set("parentId", ##class(SpectraSight.Util.TicketID).Format(pTicket.Parent.%Id()))
            // Include parent object with id, title, type
            If pIncludeChildren {
                Set tParentObj = ##class(%DynamicObject).%New()
                Do tParentObj.%Set("id", ##class(SpectraSight.Util.TicketID).Format(pTicket.Parent.%Id()))
                Do tParentObj.%Set("title", pTicket.Parent.Title)
                Do tParentObj.%Set("type", ..GetTicketType(pTicket.Parent))
                Do tObj.%Set("parent", tParentObj)
            }
        }
        Do tObj.%Set("createdAt", pTicket.CreatedAt)
        Do tObj.%Set("updatedAt", pTicket.UpdatedAt)

        // Type-specific fields
        If pTicket.%IsA("SpectraSight.Model.Bug") {
            Do tObj.%Set("severity", pTicket.Severity)
            Do tObj.%Set("stepsToReproduce", pTicket.StepsToReproduce)
            Do tObj.%Set("expectedBehavior", pTicket.ExpectedBehavior)
            Do tObj.%Set("actualBehavior", pTicket.ActualBehavior)
        } ElseIf pTicket.%IsA("SpectraSight.Model.Task") {
            Do tObj.%Set("estimatedHours", pTicket.EstimatedHours)
            Do tObj.%Set("actualHours", pTicket.ActualHours)
        } ElseIf pTicket.%IsA("SpectraSight.Model.Story") {
            Do tObj.%Set("acceptanceCriteria", pTicket.AcceptanceCriteria)
            Do tObj.%Set("storyPoints", pTicket.StoryPoints)
        } ElseIf pTicket.%IsA("SpectraSight.Model.Epic") {
            Do tObj.%Set("startDate", pTicket.StartDate)
            Do tObj.%Set("targetDate", pTicket.TargetDate)
        }

        // Include code references
        If pIncludeChildren {
            Set tCodeRefs = ##class(%DynamicArray).%New()
            Set tRefStmt = ##class(%SQL.Statement).%New()
            Set tSC2 = tRefStmt.%Prepare("SELECT ID, ClassName, MethodName, AddedBy, Timestamp FROM SpectraSight_Model.CodeReference WHERE Ticket = ? ORDER BY ID")
            If $$$ISOK(tSC2) {
                Set tRefRS = tRefStmt.%Execute(pTicket.%Id())
                While tRefRS.%Next() {
                    Set tRefObj = ##class(%DynamicObject).%New()
                    Do tRefObj.%Set("id", tRefRS.ID, "number")
                    Do tRefObj.%Set("className", tRefRS.ClassName)
                    Do tRefObj.%Set("methodName", tRefRS.MethodName)
                    Do tRefObj.%Set("addedBy", tRefRS.AddedBy)
                    Do tRefObj.%Set("timestamp", tRefRS.Timestamp)
                    Do tCodeRefs.%Push(tRefObj)
                }
            }
            Do tObj.%Set("codeReferences", tCodeRefs)
        }

        // Include children array for detail view
        If pIncludeChildren {
            Set tChildren = ##class(%DynamicArray).%New()
            Set tChildStmt = ##class(%SQL.Statement).%New()
            Set tSC2 = tChildStmt.%Prepare("SELECT ID, Title, Status FROM SpectraSight_Model.Ticket WHERE Parent = ?")
            If $$$ISOK(tSC2) {
                Set tChildRS = tChildStmt.%Execute(pTicket.%Id())
                While tChildRS.%Next() {
                    Set tChild = ##class(SpectraSight.Model.Ticket).%OpenId(tChildRS.ID)
                    If tChild '= "" {
                        Set tChildObj = ##class(%DynamicObject).%New()
                        Do tChildObj.%Set("id", ##class(SpectraSight.Util.TicketID).Format(tChildRS.ID))
                        Do tChildObj.%Set("title", tChildRS.Title)
                        Do tChildObj.%Set("status", tChildRS.Status)
                        Do tChildObj.%Set("type", ..GetTicketType(tChild))
                        Do tChildren.%Push(tChildObj)
                    }
                }
            }
            Do tObj.%Set("children", tChildren)
        }
    }
    Catch ex {
        Set ^ClaudeDebug("REST", "BuildTicketResponse", "error") = ex.DisplayString()
    }
    Quit tObj
}

/// Determine the lowercase type string from the ticket class
ClassMethod GetTicketType(pTicket As SpectraSight.Model.Ticket) As %String
{
    Set tResult = "unknown"
    Try {
        Set tClassName = pTicket.%ClassName(1)
        If tClassName = "SpectraSight.Model.Bug" {
            Set tResult = "bug"
        } ElseIf tClassName = "SpectraSight.Model.Task" {
            Set tResult = "task"
        } ElseIf tClassName = "SpectraSight.Model.Story" {
            Set tResult = "story"
        } ElseIf tClassName = "SpectraSight.Model.Epic" {
            Set tResult = "epic"
        }
    }
    Catch ex {
        // Return "unknown" on error
    }
    Quit tResult
}

/// Build ORDER BY clause from sort parameter string
ClassMethod BuildOrderBy(pSort As %String) As %String
{
    Set tResult = "UpdatedAt DESC"
    Try {
        Set tDirection = "ASC"
        Set tField = pSort
        If $EXTRACT(pSort, 1) = "-" {
            Set tDirection = "DESC"
            Set tField = $EXTRACT(pSort, 2, *)
        }

        // Map camelCase field names to SQL column names
        Set tLower = $ZCONVERT(tField, "L")
        If tLower = "title" {
            Set tResult = "Title "_tDirection
        } ElseIf tLower = "status" {
            Set tResult = "Status "_tDirection
        } ElseIf tLower = "priority" {
            Set tResult = "Priority "_tDirection
        } ElseIf tLower = "assignee" {
            Set tResult = "Assignee "_tDirection
        } ElseIf tLower = "createdat" {
            Set tResult = "CreatedAt "_tDirection
        } ElseIf tLower = "updatedat" {
            Set tResult = "UpdatedAt "_tDirection
        }
    }
    Catch ex {
        // Fall back to default sort on error
    }
    Quit tResult
}

/// Execute a prepared SQL statement with a dynamic number of parameters
ClassMethod ExecuteWithParams(pStatement As %SQL.Statement, ByRef pParams, pCount As %Integer) As %SQL.StatementResult
{
    If pCount = 0 {
        Quit pStatement.%Execute()
    } ElseIf pCount = 1 {
        Quit pStatement.%Execute(pParams(1))
    } ElseIf pCount = 2 {
        Quit pStatement.%Execute(pParams(1), pParams(2))
    } ElseIf pCount = 3 {
        Quit pStatement.%Execute(pParams(1), pParams(2), pParams(3))
    } ElseIf pCount = 4 {
        Quit pStatement.%Execute(pParams(1), pParams(2), pParams(3), pParams(4))
    } ElseIf pCount = 5 {
        Quit pStatement.%Execute(pParams(1), pParams(2), pParams(3), pParams(4), pParams(5))
    } ElseIf pCount = 6 {
        Quit pStatement.%Execute(pParams(1), pParams(2), pParams(3), pParams(4), pParams(5), pParams(6))
    } ElseIf pCount = 7 {
        Quit pStatement.%Execute(pParams(1), pParams(2), pParams(3), pParams(4), pParams(5), pParams(6), pParams(7))
    } ElseIf pCount = 8 {
        Quit pStatement.%Execute(pParams(1), pParams(2), pParams(3), pParams(4), pParams(5), pParams(6), pParams(7), pParams(8))
    } Else {
        Quit pStatement.%Execute(pParams(1), pParams(2), pParams(3), pParams(4), pParams(5), pParams(6), pParams(7), pParams(8), pParams(9))
    }
}

}
