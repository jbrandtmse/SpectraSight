Class SpectraSight.Util.ActivityRecorder [ Abstract ]
{

/// Record a status change activity for a ticket
ClassMethod RecordStatusChange(pTicketId As %Integer, pFromStatus As %String, pToStatus As %String, pActorName As %String, pActorType As %String = "human") As %Status
{
    Set tSC = $$$OK
    Try {
        Set tActivity = ##class(SpectraSight.Model.StatusChange).%New()
        Set tActivity.Ticket = ##class(SpectraSight.Model.Ticket).%OpenId(pTicketId)
        If tActivity.Ticket = "" {
            Set tSC = $$$ERROR(5001, "Ticket not found for activity recording: "_pTicketId)
            Quit
        }
        Set tActivity.ActorName = pActorName
        Set tActivity.ActorType = pActorType
        Set tActivity.FromStatus = pFromStatus
        Set tActivity.ToStatus = pToStatus
        Set tSC = tActivity.%Save()
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Record an assignment change activity for a ticket
ClassMethod RecordAssignmentChange(pTicketId As %Integer, pFromAssignee As %String, pToAssignee As %String, pActorName As %String, pActorType As %String = "human") As %Status
{
    Set tSC = $$$OK
    Try {
        Set tActivity = ##class(SpectraSight.Model.AssignmentChange).%New()
        Set tActivity.Ticket = ##class(SpectraSight.Model.Ticket).%OpenId(pTicketId)
        If tActivity.Ticket = "" {
            Set tSC = $$$ERROR(5001, "Ticket not found for activity recording: "_pTicketId)
            Quit
        }
        Set tActivity.ActorName = pActorName
        Set tActivity.ActorType = pActorType
        Set tActivity.FromAssignee = pFromAssignee
        Set tActivity.ToAssignee = pToAssignee
        Set tSC = tActivity.%Save()
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Record a code reference change activity for a ticket
ClassMethod RecordCodeReferenceChange(pTicketId As %Integer, pClassName As %String, pMethodName As %String, pAction As %String, pActorName As %String, pActorType As %String = "human") As %Status
{
    Set tSC = $$$OK
    Try {
        Set tActivity = ##class(SpectraSight.Model.CodeReferenceChange).%New()
        Set tActivity.Ticket = ##class(SpectraSight.Model.Ticket).%OpenId(pTicketId)
        If tActivity.Ticket = "" {
            Set tSC = $$$ERROR(5001, "Ticket not found for activity recording: "_pTicketId)
            Quit
        }
        Set tActivity.ActorName = pActorName
        Set tActivity.ActorType = pActorType
        Set tActivity.ClassName = pClassName
        Set tActivity.MethodName = pMethodName
        Set tActivity.Action = pAction
        Set tSC = tActivity.%Save()
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Get the authenticated username from the current IRIS session
ClassMethod GetActorFromRequest() As %String
{
    Quit $USERNAME
}

/// Resolve actor name from request body, validating against active user mappings.
/// If actorName is provided in body, validate it matches an active user mapping display name.
/// If not provided, fall back to GetActorFromRequest() ($USERNAME).
ClassMethod ResolveActor(pBody As %DynamicObject, Output pActorName As %String) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tActorName = pBody.%Get("actorName")
        If (tActorName = "") || (tActorName = $CHAR(0)) {
            // No actorName provided — fall back to $USERNAME
            Set pActorName = ..GetActorFromRequest()
            Quit
        }

        // Validate actorName against active user mapping display names
        Set tStatement = ##class(%SQL.Statement).%New()
        Set tSC = tStatement.%Prepare("SELECT COUNT(*) AS cnt FROM SpectraSight_Model.UserMapping WHERE DisplayName = ? AND IsActive = 1")
        If $$$ISERR(tSC) Quit

        Set tResult = tStatement.%Execute(tActorName)
        If tResult.%Next() && (tResult.%Get("cnt") > 0) {
            Set pActorName = tActorName
            Quit
        }

        // actorName not found in active mappings — return error
        Set tSC = $$$ERROR(5001, "Invalid actorName: '"_tActorName_"' does not match any active user mapping")
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Resolve actor type from request body.
/// Accepts "human" or "agent"; defaults to "human" if not provided or invalid.
ClassMethod ResolveActorType(pBody As %DynamicObject) As %String
{
    Set tActorType = pBody.%Get("actorType")
    If (tActorType = "human") || (tActorType = "agent") {
        Quit tActorType
    }
    Quit "human"
}

}
