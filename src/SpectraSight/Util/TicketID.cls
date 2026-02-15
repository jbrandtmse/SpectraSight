Class SpectraSight.Util.TicketID [ Abstract ]
{

/// Format an internal integer ID as a display ID (e.g., 42 -> "SS-42")
ClassMethod Format(pId As %Integer) As %String
{
    Quit "SS-"_pId
}

/// Parse a display ID to an internal integer ID.
/// Accepts "SS-42" or plain "42". Returns "" if unparseable.
ClassMethod Parse(pDisplayId As %String) As %Integer
{
    Set tResult = ""
    Try {
        If $EXTRACT(pDisplayId, 1, 3) = "SS-" {
            Set tNumPart = $EXTRACT(pDisplayId, 4, *)
            If (tNumPart '= "") && ($ISVALIDNUM(tNumPart)) && (tNumPart = (tNumPart \ 1)) {
                Set tResult = +tNumPart
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

/// Check if a string is a valid ticket ID format ("SS-{digits}" or plain digits)
ClassMethod IsValid(pDisplayId As %String) As %Boolean
{
    Quit (..Parse(pDisplayId) '= "")
}

}
