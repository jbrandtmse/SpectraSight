Class SpectraSight.REST.Dispatch Extends %CSP.REST
{

Parameter HandleCorsRequest = 1;

Parameter UseSession = 1;

XData UrlMap [ XMLNamespace = "http://www.intersystems.com/urlmap" ]
{
<Routes>
  <Route Url="/tickets" Method="GET" Call="SpectraSight.REST.TicketHandler:ListTickets" />
  <Route Url="/tickets" Method="POST" Call="SpectraSight.REST.TicketHandler:CreateTicket" />
  <Route Url="/tickets/:id" Method="GET" Call="SpectraSight.REST.TicketHandler:GetTicket" />
  <Route Url="/tickets/:id" Method="PUT" Call="SpectraSight.REST.TicketHandler:UpdateTicket" />
  <Route Url="/tickets/:id" Method="DELETE" Call="SpectraSight.REST.TicketHandler:DeleteTicket" />
  <Route Url="/tickets/:id/code-references" Method="POST" Call="SpectraSight.REST.TicketHandler:AddCodeReference" />
  <Route Url="/tickets/:id/code-references/:refId" Method="DELETE" Call="SpectraSight.REST.TicketHandler:RemoveCodeReference" />
  <Route Url="/classes/:name/methods" Method="GET" Call="SpectraSight.REST.ClassHandler:ListMethods" />
  <Route Url="/classes" Method="GET" Call="SpectraSight.REST.ClassHandler:ListClasses" />
</Routes>
}

/// Set default content type and charset on every request
ClassMethod OnPreDispatch(pUrl As %String, pMethod As %String, ByRef pContinue As %Boolean) As %Status
{
    Set tSC = $$$OK
    Try {
        Set %response.ContentType = "application/json"
        Set %response.CharSet = "utf-8"
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

}
