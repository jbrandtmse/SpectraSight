Class SpectraSight.Util.TicketID [ Abstract ]
{

/// Format an internal integer ID as a display ID (e.g., 42 -> "SS-42")
/// Looks up the ticket's Project prefix and SequenceNumber.
/// Falls back to "SS-{ID}" if ticket has no Project or SequenceNumber.
ClassMethod Format(pId As %Integer) As %String
{
    Set tResult = "SS-"_pId
    Try {
        Set tTicket = ##class(SpectraSight.Model.Ticket).%OpenId(pId)
        If tTicket = "" Quit
        If (tTicket.Project '= "") && (tTicket.SequenceNumber > 0) {
            Set tResult = tTicket.Project.Prefix_"-"_tTicket.SequenceNumber
        }
    }
    Catch ex {
        // Fall back to default format
    }
    Quit tResult
}

/// Parse a display ID to an internal integer ID.
/// Accepts "{Prefix}-{Number}" or plain numeric IDs.
/// For prefixed IDs, looks up the project by prefix and finds the ticket
/// by Project + SequenceNumber. Falls back to internal ID lookup for "SS-" prefix.
/// Returns "" if unparseable.
ClassMethod Parse(pDisplayId As %String) As %Integer
{
    Set tResult = ""
    Try {
        Set tDashPos = $FIND(pDisplayId, "-")
        If tDashPos > 0 {
            Set tPrefix = $EXTRACT(pDisplayId, 1, tDashPos - 2)
            Set tNumPart = $EXTRACT(pDisplayId, tDashPos, *)
            If (tNumPart '= "") && ($ISVALIDNUM(tNumPart)) && (tNumPart = (tNumPart \ 1)) {
                Set tNum = +tNumPart
                // Look up the project by prefix
                Set tStmt = ##class(%SQL.Statement).%New()
                Set tSC = tStmt.%Prepare("SELECT ID FROM SpectraSight_Model.Project WHERE Prefix = ?")
                If $$$ISOK(tSC) {
                    Set tRes = tStmt.%Execute(tPrefix)
                    If tRes.%Next() {
                        Set tProjectId = tRes.%Get("ID")
                        // Find ticket by Project + SequenceNumber
                        Set tStmt2 = ##class(%SQL.Statement).%New()
                        Set tSC2 = tStmt2.%Prepare("SELECT ID FROM SpectraSight_Model.Ticket WHERE Project = ? AND SequenceNumber = ?")
                        If $$$ISOK(tSC2) {
                            Set tRes2 = tStmt2.%Execute(tProjectId, tNum)
                            If tRes2.%Next() {
                                Set tResult = +tRes2.%Get("ID")
                                Quit
                            }
                        }
                    }
                }
                // Backward compatibility: if prefix is SS and no match found via project,
                // try treating the number as the internal ID
                If (tPrefix = "SS") && (tResult = "") {
                    If ##class(SpectraSight.Model.Ticket).%ExistsId(tNum) {
                        Set tResult = tNum
                    }
                }
            }
        } ElseIf (pDisplayId '= "") && ($ISVALIDNUM(pDisplayId)) && (pDisplayId = (pDisplayId \ 1)) {
            Set tResult = +pDisplayId
        }
    }
    Catch ex {
        Set tResult = ""
    }
    Quit tResult
}

/// Check if a string is a valid ticket ID format ("{Prefix}-{digits}" or plain digits)
ClassMethod IsValid(pDisplayId As %String) As %Boolean
{
    Quit (..Parse(pDisplayId) '= "")
}

}
