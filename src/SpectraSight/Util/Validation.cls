Class SpectraSight.Util.Validation [ Abstract ]
{

/// Validate that pType is one of the valid ticket types (case-insensitive)
ClassMethod ValidateTicketType(pType As %String) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tLower = $ZCONVERT(pType, "L")
        If ",bug,task,story,epic," '[ (","_tLower_",") {
            Set tSC = $$$ERROR(5001, "INVALID_TYPE: Ticket type must be one of: bug, task, story, epic")
        }
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Validate that pStatus is one of the valid ticket statuses
ClassMethod ValidateStatus(pStatus As %String) As %Status
{
    Set tSC = $$$OK
    Try {
        If ",Open,In Progress,Blocked,Complete," '[ (","_pStatus_",") {
            Set tSC = $$$ERROR(5001, "INVALID_STATUS: Status must be one of: Open, In Progress, Blocked, Complete")
        }
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Validate that pPriority is one of the valid priority levels
ClassMethod ValidatePriority(pPriority As %String) As %Status
{
    Set tSC = $$$OK
    Try {
        If ",Low,Medium,High,Critical," '[ (","_pPriority_",") {
            Set tSC = $$$ERROR(5001, "INVALID_PRIORITY: Priority must be one of: Low, Medium, High, Critical")
        }
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Validate that pValue is not empty
ClassMethod ValidateRequired(pValue As %String, pFieldName As %String) As %Status
{
    Set tSC = $$$OK
    Try {
        If pValue = "" {
            Set tSC = $$$ERROR(5001, "BAD_REQUEST: "_pFieldName_" is required")
        }
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Map a lowercase type string to the full class name
ClassMethod GetClassForType(pType As %String, Output pClassName As %String) As %Status
{
    Set tSC = $$$OK
    Set pClassName = ""
    Try {
        Set tLower = $ZCONVERT(pType, "L")
        If tLower = "bug" {
            Set pClassName = "SpectraSight.Model.Bug"
        } ElseIf tLower = "task" {
            Set pClassName = "SpectraSight.Model.Task"
        } ElseIf tLower = "story" {
            Set pClassName = "SpectraSight.Model.Story"
        } ElseIf tLower = "epic" {
            Set pClassName = "SpectraSight.Model.Epic"
        } Else {
            Set tSC = $$$ERROR(5001, "INVALID_TYPE: Unknown ticket type: "_pType)
        }
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

}
