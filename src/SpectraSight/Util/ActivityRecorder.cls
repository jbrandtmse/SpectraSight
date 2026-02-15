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

}
