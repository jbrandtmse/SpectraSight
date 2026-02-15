Class SpectraSight.Model.Activity Extends (%Persistent, %JSON.Adaptor)
{

Property Ticket As SpectraSight.Model.Ticket(%JSONFIELDNAME = "ticketId") [ Required ];

Property ActorName As %String(%JSONFIELDNAME = "actorName", MAXLEN = 255);

Property ActorType As %String(%JSONFIELDNAME = "actorType", VALUELIST = ",human,agent");

Property Timestamp As %TimeStamp(%JSONFIELDNAME = "timestamp");

Index TicketIdx On Ticket;

Method %OnNew(initvalue As %String = "") As %Status
{
    Set tSC = $$$OK
    Try {
        Set ..Timestamp = $ZDATETIME($ZTIMESTAMP, 3, 1)
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

Storage Default
{
<Data name="ActivityDefaultData">
<Value name="1">
<Value>%%CLASSNAME</Value>
</Value>
<Value name="2">
<Value>Ticket</Value>
</Value>
<Value name="3">
<Value>ActorName</Value>
</Value>
<Value name="4">
<Value>ActorType</Value>
</Value>
<Value name="5">
<Value>Timestamp</Value>
</Value>
</Data>
<DataLocation>^SpectraSight.Model.ActivityD</DataLocation>
<DefaultData>ActivityDefaultData</DefaultData>
<IdLocation>^SpectraSight.Model.ActivityD</IdLocation>
<IndexLocation>^SpectraSight.Model.ActivityI</IndexLocation>
<StreamLocation>^SpectraSight.Model.ActivityS</StreamLocation>
<Type>%Storage.Persistent</Type>
}

}
